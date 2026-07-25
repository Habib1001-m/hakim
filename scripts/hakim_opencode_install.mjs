#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INSTALL_MANIFEST_RELATIVE_PATH,
  OPENCODE_ROOT,
  buildOpenCodeBundle,
  bundleDirectories,
  createPrivateWorkRoot,
  detectManagedInstallation,
  fileRecordMatches,
  inspectEntry,
  manifestBytes,
  manifestFromBundle,
  manifestsEquivalent,
  moveVerifiedRecordToWorkRoot,
  sha256,
  validateDirectoryChain,
  validateTargetRoot,
} from './lib/opencode_bundle.mjs';
import {
  restoreQuarantinedBytesNoClobber,
  rollbackCreatedRecordsNoClobber,
} from './lib/opencode_transaction.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export function parseArgs(args) {
  const options = { target: null, apply: false, json: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--apply') options.apply = true;
    else if (token === '--json') options.json = true;
    else if (token === '--help' || token === '-h') options.help = true;
    else if (token === '--target') {
      if (!args[index + 1]) throw new Error('--target requires a path');
      options.target = args[++index];
    } else if (token.startsWith('--target=')) options.target = token.slice('--target='.length);
    else throw new Error(`unknown option: ${token}`);
  }
  if (!options.help && !options.target) throw new Error('--target is required');
  return options;
}

function publicManifest(bundle) {
  return bundle.files.map((file) => ({
    source_relative: file.source_relative,
    target_relative: file.target_relative,
    sha256: file.sha256,
    size: file.size,
  }));
}

function result(base, status, state, nextSafeAction, mutation = {}) {
  return {
    ...base,
    status,
    state,
    write_attempted: mutation.write_attempted ?? false,
    write_performed: mutation.write_performed ?? false,
    filesystem_changed: mutation.filesystem_changed ?? false,
    rollback_attempted: mutation.rollback_attempted ?? false,
    rollback_complete: mutation.rollback_complete ?? true,
    quarantine_retained: mutation.quarantine_retained ?? false,
    quarantine_path: mutation.quarantine_path ?? null,
    created_files: mutation.created_files || [],
    created_directories: mutation.created_directories || [],
    previous_product_version: mutation.previous_product_version ?? null,
    installed_product_version: mutation.installed_product_version ?? base.product_version ?? null,
    next_safe_action: nextSafeAction,
  };
}

function manifestRecord(manifest, bytes = manifestBytes(manifest)) {
  return {
    target_relative: INSTALL_MANIFEST_RELATIVE_PATH,
    sha256: sha256(bytes),
    size: bytes.length,
    bytes,
  };
}

function installedManifestRecord(managed) {
  if (managed.manifest_source !== 'INSTALLED_MANIFEST' || !managed.manifest_record) return null;
  return {
    target_relative: INSTALL_MANIFEST_RELATIVE_PATH,
    sha256: managed.manifest_record.raw_sha256,
    size: managed.manifest_record.raw_size,
  };
}

function createDirectories(targetRoot, directories, createdDirectories) {
  for (const relative of directories) {
    const absolute = path.join(targetRoot, relative);
    const existing = inspectEntry(absolute, 'directory');
    if (existing.ok) continue;
    if (existing.state !== 'MISSING') throw new Error(`${relative} became unsafe: ${existing.state}`);
    fs.mkdirSync(absolute, { mode: 0o755 });
    const created = inspectEntry(absolute, 'directory');
    if (!created.ok) throw new Error(`${relative} was not created as a real directory`);
    createdDirectories.push(relative);
  }
}

function writeRecordCreateOnly(targetRoot, record, bytes) {
  const targetPath = path.join(targetRoot, record.target_relative);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true, mode: 0o755 });
  fs.writeFileSync(targetPath, bytes, { flag: 'wx', mode: 0o644 });
  const verified = fileRecordMatches(targetRoot, record);
  if (!verified.ok) throw new Error(`${record.target_relative} hash mismatch after write`);
}

function stagePath(workRoot, targetRelative) {
  const prefix = `${OPENCODE_ROOT}/`;
  if (!targetRelative.startsWith(prefix)) throw new Error(`unsafe staged target: ${targetRelative}`);
  return path.join(workRoot, targetRelative.slice(prefix.length));
}

function stageNewInstallation(workRoot, bundle, currentManifest) {
  const staged = [];
  for (const file of bundle.files) {
    const target = stagePath(workRoot, file.target_relative);
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.writeFileSync(target, file.bytes, { flag: 'wx', mode: 0o600 });
    const bytes = fs.readFileSync(target);
    if (bytes.length !== file.size || sha256(bytes) !== file.sha256) throw new Error(`${file.target_relative} staging verification failed`);
    staged.push({ record: file, path: target });
  }
  const bytes = manifestBytes(currentManifest);
  const record = manifestRecord(currentManifest, bytes);
  const target = stagePath(workRoot, record.target_relative);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  fs.writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });
  if (sha256(fs.readFileSync(target)) !== record.sha256) throw new Error('install manifest staging verification failed');
  return { staged, manifest: { record, path: target } };
}

function installStagedRecord(targetRoot, stagedItem) {
  const targetPath = path.join(targetRoot, stagedItem.record.target_relative);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true, mode: 0o755 });
  fs.copyFileSync(stagedItem.path, targetPath, fs.constants.COPYFILE_EXCL);
  const verified = fileRecordMatches(targetRoot, stagedItem.record);
  if (!verified.ok) throw new Error(`${stagedItem.record.target_relative} hash mismatch after staged install`);
}

function moveOldInstallation(targetRoot, managed, oldRoot) {
  const moved = [];
  try {
    for (const record of managed.manifest.files) moved.push(moveVerifiedRecordToWorkRoot(targetRoot, oldRoot, record));
    const manifest = installedManifestRecord(managed);
    if (manifest) moved.push(moveVerifiedRecordToWorkRoot(targetRoot, oldRoot, manifest));
    return moved;
  } catch (error) {
    if (error.quarantined_record) moved.push(error.quarantined_record);
    error.moved_records = moved;
    throw error;
  }
}

function sameManagedInstallation(left, right) {
  return left && right
    && ['EXACT_MATCH', 'LEGACY_EXACT_MATCH', 'UNMANIFESTED_CURRENT_EXACT'].includes(right.state)
    && manifestsEquivalent(left.manifest, right.manifest)
    && left.manifest_source === right.manifest_source;
}

function adoptManifest(targetRoot, bundle, currentManifest, base, directories) {
  const createdDirectories = [];
  const record = manifestRecord(currentManifest);
  try {
    createDirectories(targetRoot, directories, createdDirectories);
    writeRecordCreateOnly(targetRoot, record, record.bytes);
    const finalState = detectManagedInstallation(targetRoot, bundle);
    if (finalState.state !== 'EXACT_MATCH' || !manifestsEquivalent(finalState.manifest, currentManifest)) {
      throw new Error('install manifest adoption did not produce an exact managed installation');
    }
    return result(base, 'PASS', 'ADOPTED_MANIFEST', 'Hakim already matched the current payload; a persistent install manifest was added for future safe upgrade/removal.', {
      write_attempted: true,
      write_performed: true,
      filesystem_changed: true,
      created_directories: createdDirectories,
      installed_product_version: currentManifest.product_version,
    });
  } catch (error) {
    const rollback = rollbackCreatedRecordsNoClobber(targetRoot, [record], createdDirectories);
    return result(base, 'FAIL', rollback.rollback_complete ? 'MANIFEST_ADOPTION_FAILED_ROLLED_BACK' : 'MANIFEST_ADOPTION_FAILED_ROLLBACK_INCOMPLETE', error.message, {
      write_attempted: true,
      write_performed: true,
      filesystem_changed: !rollback.rollback_complete,
      rollback_attempted: true,
      rollback_complete: rollback.rollback_complete,
      quarantine_retained: rollback.quarantine_retained,
      quarantine_path: rollback.quarantine_path,
      installed_product_version: currentManifest.product_version,
    });
  }
}

function createInstallation(targetRoot, bundle, currentManifest, base, directories) {
  const createdDirectories = [];
  const createdRecords = [];
  try {
    createDirectories(targetRoot, directories, createdDirectories);
    for (const file of bundle.files) {
      writeRecordCreateOnly(targetRoot, file, file.bytes);
      createdRecords.push(file);
    }
    const record = manifestRecord(currentManifest);
    writeRecordCreateOnly(targetRoot, record, record.bytes);
    createdRecords.push(record);

    const finalState = detectManagedInstallation(targetRoot, bundle);
    if (finalState.state !== 'EXACT_MATCH' || !manifestsEquivalent(finalState.manifest, currentManifest)) {
      throw new Error('The installed bundle did not match the persistent canonical manifest.');
    }

    return result(base, 'PASS', 'CREATED', 'Run OpenCode from the target repository and capture fresh runtime evidence before promoting this changed lifecycle.', {
      write_attempted: true,
      write_performed: true,
      filesystem_changed: true,
      created_files: bundle.files.map((file) => file.target_relative),
      created_directories: createdDirectories,
      installed_product_version: currentManifest.product_version,
    });
  } catch (error) {
    const rollback = rollbackCreatedRecordsNoClobber(targetRoot, createdRecords, createdDirectories);
    return result(base, 'FAIL', rollback.rollback_complete ? 'CREATE_FAILED_ROLLED_BACK' : 'CREATE_FAILED_ROLLBACK_INCOMPLETE', error.message, {
      write_attempted: true,
      write_performed: createdRecords.length > 0,
      filesystem_changed: !rollback.rollback_complete,
      rollback_attempted: createdRecords.length > 0 || createdDirectories.length > 0,
      rollback_complete: rollback.rollback_complete,
      quarantine_retained: rollback.quarantine_retained,
      quarantine_path: rollback.quarantine_path,
      created_files: rollback.rollback_complete ? [] : createdRecords.map((record) => record.target_relative),
      created_directories: rollback.rollback_complete ? [] : createdDirectories,
      installed_product_version: currentManifest.product_version,
    });
  }
}

function upgradeInstallation(targetRoot, bundle, managed, currentManifest, base, directories) {
  let workRoot = null;
  const createdRecords = [];
  const createdDirectories = [];
  let moved = [];
  const previousVersion = managed.manifest.product_version;
  try {
    workRoot = createPrivateWorkRoot(targetRoot, 'hakim-upgrade');
    const oldRoot = path.join(workRoot, 'old');
    const newRoot = path.join(workRoot, 'new');
    fs.mkdirSync(oldRoot, { mode: 0o700 });
    fs.mkdirSync(newRoot, { mode: 0o700 });
    const staged = stageNewInstallation(newRoot, bundle, currentManifest);

    const rechecked = detectManagedInstallation(targetRoot, bundle);
    if (!sameManagedInstallation(managed, rechecked)) throw new Error('installed Hakim state changed during upgrade preflight');

    moved = moveOldInstallation(targetRoot, managed, oldRoot);
    createDirectories(targetRoot, directories, createdDirectories);

    for (const item of staged.staged) {
      installStagedRecord(targetRoot, item);
      createdRecords.push(item.record);
    }
    installStagedRecord(targetRoot, staged.manifest);
    createdRecords.push(staged.manifest.record);

    const finalState = detectManagedInstallation(targetRoot, bundle);
    if (finalState.state !== 'EXACT_MATCH' || !manifestsEquivalent(finalState.manifest, currentManifest)) {
      throw new Error('upgraded Hakim state failed final manifest verification');
    }

    fs.rmSync(workRoot, { recursive: true });
    return result(base, 'PASS', 'UPGRADED', 'Hakim was transactionally upgraded. Start a new OpenCode session and capture fresh live-host evidence for this changed lifecycle before promotion.', {
      write_attempted: true,
      write_performed: true,
      filesystem_changed: true,
      created_files: bundle.files.map((file) => file.target_relative),
      previous_product_version: previousVersion,
      installed_product_version: currentManifest.product_version,
    });
  } catch (error) {
    if (error.quarantined_record) moved.push(error.quarantined_record);
    if (error.moved_records) moved = error.moved_records;

    const createdRollback = rollbackCreatedRecordsNoClobber(targetRoot, createdRecords, createdDirectories);
    const oldRecovery = restoreQuarantinedBytesNoClobber(moved);
    const rollbackErrors = [...createdRollback.errors, ...oldRecovery.errors];
    const rollbackComplete = rollbackErrors.length === 0;

    let quarantineRetained = createdRollback.quarantine_retained;
    let quarantinePath = createdRollback.quarantine_path;
    if (workRoot) {
      try {
        if (rollbackComplete) fs.rmSync(workRoot, { recursive: true, force: true });
        else {
          quarantineRetained = true;
          quarantinePath ||= workRoot;
        }
      } catch {
        quarantineRetained = true;
        quarantinePath ||= workRoot;
      }
    }

    return result(base, 'FAIL', rollbackComplete ? 'UPGRADE_FAILED_ROLLED_BACK' : 'UPGRADE_FAILED_ROLLBACK_INCOMPLETE', error.message, {
      write_attempted: true,
      write_performed: moved.length > 0 || createdRecords.length > 0,
      filesystem_changed: !rollbackComplete,
      rollback_attempted: moved.length > 0 || createdRecords.length > 0,
      rollback_complete: rollbackComplete,
      quarantine_retained: quarantineRetained,
      quarantine_path: quarantinePath,
      created_files: rollbackComplete ? [] : createdRecords.map((record) => record.target_relative),
      created_directories: rollbackComplete ? [] : createdDirectories,
      previous_product_version: previousVersion,
      installed_product_version: currentManifest.product_version,
    });
  }
}

export function installOpenCodeAdapter(options, root = ROOT) {
  let bundle;
  try {
    bundle = buildOpenCodeBundle(root);
  } catch (error) {
    return result({ schema_version: 1, mode: options.apply ? 'APPLY_MANAGED' : 'DRY_RUN' }, 'FAIL', 'SOURCE_INVALID', error.message);
  }

  const currentManifest = manifestFromBundle(bundle);
  const target = validateTargetRoot(options.target);
  const base = {
    schema_version: 1,
    adapter: bundle.adapter,
    product_version: bundle.product_version,
    mode: options.apply ? 'APPLY_MANAGED' : 'DRY_RUN',
    target_root: target.target_root,
    overwrite_allowed: false,
    opencode_config_mutation: false,
    mutation_scope: bundle.mutation_scope,
    manifest: publicManifest(bundle),
    install_manifest_path: INSTALL_MANIFEST_RELATIVE_PATH,
  };
  if (!target.ok) return result(base, 'FAIL', target.state, target.message);

  const directories = bundleDirectories(bundle);
  const directoryCheck = validateDirectoryChain(target.target_root, directories);
  if (!directoryCheck.ok) return result({ ...base, refused_path: directoryCheck.path }, 'FAIL', directoryCheck.state, directoryCheck.message);

  const managed = detectManagedInstallation(target.target_root, bundle);
  const inspection = managed.inspection?.counts || null;
  const withInspection = { ...base, inspection, managed_state: managed.state, managed_manifest_source: managed.manifest_source };

  if (managed.state === 'EXACT_MATCH' && manifestsEquivalent(managed.manifest, currentManifest)) {
    return result(withInspection, 'PASS', 'ALREADY_MATCHES', 'The project-local OpenCode adapter and persistent install manifest already match the canonical Hakim bundle.', {
      previous_product_version: managed.manifest.product_version,
      installed_product_version: currentManifest.product_version,
    });
  }

  if (['MANIFEST_INVALID', 'MANIFEST_UNSUPPORTED', 'UNSAFE', 'PARTIAL_OR_MODIFIED', 'UNMANAGED_CONFLICT'].includes(managed.state)) {
    return result(withInspection, 'FAIL', `REFUSED_${managed.state}`, managed.message || 'Preserve the existing OpenCode paths and reconcile them manually; unsafe or unowned state is never overwritten.');
  }

  if (managed.state === 'ABSENT') {
    if (!options.apply) return result(withInspection, 'PASS', 'READY_TO_CREATE', 'Review the manifest, then rerun without --dry-run to create the project-local OpenCode adapter and persistent install manifest.');
    return createInstallation(target.target_root, bundle, currentManifest, withInspection, directories);
  }

  if (managed.state === 'UNMANIFESTED_CURRENT_EXACT' && manifestsEquivalent(managed.manifest, currentManifest)) {
    if (!options.apply) return result(withInspection, 'PASS', 'READY_TO_ADOPT_MANIFEST', 'The payload is exact but predates persistent lifecycle metadata; rerun without --dry-run to add only the install manifest.');
    return adoptManifest(target.target_root, bundle, currentManifest, withInspection, directories);
  }

  if (managed.state === 'LEGACY_EXACT_MATCH' && manifestsEquivalent(managed.manifest, currentManifest)) {
    if (!options.apply) return result(withInspection, 'PASS', 'READY_TO_ADOPT_MANIFEST', 'The accepted legacy beta.1 payload is exact; rerun without --dry-run to add only the persistent install manifest.');
    return adoptManifest(target.target_root, bundle, currentManifest, withInspection, directories);
  }

  if (['EXACT_MATCH', 'LEGACY_EXACT_MATCH', 'UNMANIFESTED_CURRENT_EXACT'].includes(managed.state)) {
    if (!options.apply) {
      return result(withInspection, 'PASS', 'READY_TO_UPGRADE', `Verified Hakim ${managed.manifest.product_version} is installed; rerun without --dry-run to transactionally upgrade to ${currentManifest.product_version}.`, {
        previous_product_version: managed.manifest.product_version,
        installed_product_version: currentManifest.product_version,
      });
    }
    return upgradeInstallation(target.target_root, bundle, managed, currentManifest, withInspection, directories);
  }

  return result(withInspection, 'FAIL', 'REFUSED_UNKNOWN_STATE', 'The installed Hakim state is not recognized; preserve it and inspect manually.');
}

export function formatText(report) {
  return [
    'Hakim OpenCode Project Installer',
    `MODE=${report.mode}`,
    `STATUS=${report.status}`,
    `STATE=${report.state}`,
    `WRITE_ATTEMPTED=${report.write_attempted ? 'YES' : 'NO'}`,
    `WRITE_PERFORMED=${report.write_performed ? 'YES' : 'NO'}`,
    `FILESYSTEM_CHANGED=${report.filesystem_changed ? 'YES' : 'NO'}`,
    `ROLLBACK_COMPLETE=${report.rollback_complete ? 'YES' : 'NO'}`,
    `QUARANTINE_RETAINED=${report.quarantine_retained ? 'YES' : 'NO'}`,
    'OVERWRITE_ALLOWED=NO',
    'OPENCODE_CONFIG_MUTATION=NO',
    `TARGET_ROOT=${report.target_root || 'UNRESOLVED'}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run install:opencode -- --target <repository>',
    '  npm run install:opencode -- --target <repository> --apply',
    '  npm run install:opencode:json -- --target <repository> [--apply]',
    '',
    'Dry-run is the default. Installation creates new state or transactionally upgrades only a complete verified supported Hakim-owned installation.',
    'A persistent install manifest makes future cross-version upgrade/removal verifiable without trusting arbitrary local ownership metadata.',
    'Unsafe, partial, modified, symlinked, unsupported-manifest, or unowned targets are refused. opencode.json is never edited.',
  ].join('\n');
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  const report = installOpenCodeAdapter(options);
  console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
