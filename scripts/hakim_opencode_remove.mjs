#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './hakim_opencode_install.mjs';
import {
  OPENCODE_ROOT,
  buildOpenCodeBundle,
  bundleDirectories,
  inspectEntry,
  inspectInstalledBundle,
  removeEmptyDirectories,
  sha256,
  validateDirectoryChain,
  validateTargetRoot,
} from './lib/opencode_bundle.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

function publicManifest(bundle) {
  return bundle.files.map((file) => ({
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
    mutation_attempted: mutation.mutation_attempted ?? false,
    removal_performed: mutation.removal_performed ?? false,
    filesystem_changed: mutation.filesystem_changed ?? false,
    rollback_attempted: mutation.rollback_attempted ?? false,
    rollback_complete: mutation.rollback_complete ?? true,
    quarantine_retained: mutation.quarantine_retained ?? false,
    quarantine_path: mutation.quarantine_path ?? null,
    removed_files: mutation.removed_files || [],
    removed_directories: mutation.removed_directories || [],
    next_safe_action: nextSafeAction,
  };
}

function quarantineRelative(targetRelative) {
  const normalized = targetRelative.replace(/^\.opencode\//, '');
  if (!normalized || normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new Error(`unsafe quarantine target: ${targetRelative}`);
  }
  return normalized;
}

function createQuarantineRoot(targetRoot) {
  const parent = path.join(targetRoot, OPENCODE_ROOT);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = crypto.randomBytes(8).toString('hex');
    const candidate = path.join(parent, `.hakim-remove-${process.pid}-${token}`);
    try {
      fs.mkdirSync(candidate, { mode: 0o700 });
      return candidate;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error('could not allocate a unique quarantine directory');
}

function backupBundle(targetRoot, bundle, quarantineRoot) {
  const backups = [];
  for (const file of bundle.files) {
    const targetPath = path.join(targetRoot, file.target_relative);
    const state = inspectEntry(targetPath, 'file');
    if (!state.ok) throw new Error(`${file.target_relative} changed before backup: ${state.state}`);
    const current = fs.readFileSync(targetPath);
    if (sha256(current) !== file.sha256) throw new Error(`${file.target_relative} changed before backup`);

    const backupPath = path.join(quarantineRoot, quarantineRelative(file.target_relative));
    fs.mkdirSync(path.dirname(backupPath), { recursive: true, mode: 0o700 });
    fs.copyFileSync(targetPath, backupPath, fs.constants.COPYFILE_EXCL);
    const backupState = inspectEntry(backupPath, 'file');
    if (!backupState.ok || sha256(fs.readFileSync(backupPath)) !== file.sha256) {
      throw new Error(`${file.target_relative} quarantine verification failed`);
    }
    backups.push({ file, targetPath, backupPath });
  }
  return backups;
}

function restoreRemoved(backups, removedTargets) {
  const errors = [];
  for (const item of backups) {
    if (!removedTargets.has(item.targetPath)) continue;
    const targetState = inspectEntry(item.targetPath, 'file');
    if (targetState.state !== 'MISSING') {
      errors.push(`${item.file.target_relative}: target reappeared; not overwritten`);
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(item.targetPath), { recursive: true, mode: 0o755 });
      fs.copyFileSync(item.backupPath, item.targetPath, fs.constants.COPYFILE_EXCL);
      if (sha256(fs.readFileSync(item.targetPath)) !== item.file.sha256) {
        errors.push(`${item.file.target_relative}: restored hash mismatch`);
      }
    } catch (error) {
      errors.push(`${item.file.target_relative}: ${error.message}`);
    }
  }
  return errors;
}

export function removeOpenCodeAdapter(options, root = ROOT) {
  let bundle;
  try {
    bundle = buildOpenCodeBundle(root);
  } catch (error) {
    return result({ schema_version: 1, mode: options.apply ? 'APPLY_REMOVE_EXACT_MATCH' : 'DRY_RUN' }, 'FAIL', 'SOURCE_INVALID', error.message);
  }

  const target = validateTargetRoot(options.target);
  const base = {
    schema_version: 1,
    adapter: bundle.adapter,
    mode: options.apply ? 'APPLY_REMOVE_EXACT_MATCH' : 'DRY_RUN',
    target_root: target.target_root,
    modified_target_removal_allowed: false,
    opencode_config_mutation: false,
    unrelated_path_removal_allowed: false,
    mutation_scope: bundle.mutation_scope,
    manifest: publicManifest(bundle),
  };
  if (!target.ok) return result(base, 'FAIL', target.state, target.message);

  const directories = bundleDirectories(bundle);
  const directoryCheck = validateDirectoryChain(target.target_root, directories);
  if (!directoryCheck.ok) {
    return result({ ...base, refused_path: directoryCheck.path }, 'FAIL', directoryCheck.state, directoryCheck.message);
  }

  const installed = inspectInstalledBundle(target.target_root, bundle);
  const withInspection = { ...base, inspection: installed.counts };
  if (installed.aggregate_state === 'ABSENT') {
    return result(withInspection, 'PASS', 'ALREADY_ABSENT', 'No canonical Hakim OpenCode bundle is present; no change is needed.');
  }
  if (installed.aggregate_state !== 'EXACT_MATCH') {
    return result(
      withInspection,
      'FAIL',
      installed.aggregate_state === 'UNSAFE' ? 'REFUSED_UNSAFE_TARGET' : 'REFUSED_PARTIAL_OR_MODIFIED',
      'Preserve the current OpenCode paths and reconcile them manually; removal is allowed only for one complete exact canonical bundle.',
    );
  }
  if (!options.apply) {
    return result(withInspection, 'PASS', 'READY_TO_REMOVE', 'Review the exact-match manifest, then rerun with --apply to remove only the Hakim bundle.');
  }

  let quarantineRoot = null;
  let backups = [];
  const removedTargets = new Set();
  try {
    quarantineRoot = createQuarantineRoot(target.target_root);
    backups = backupBundle(target.target_root, bundle, quarantineRoot);

    const secondInspection = inspectInstalledBundle(target.target_root, bundle);
    if (secondInspection.aggregate_state !== 'EXACT_MATCH') {
      throw new Error('installed bundle changed after quarantine backup');
    }

    for (const item of backups) {
      const currentState = inspectEntry(item.targetPath, 'file');
      if (!currentState.ok || sha256(fs.readFileSync(item.targetPath)) !== item.file.sha256) {
        throw new Error(`${item.file.target_relative} changed before removal`);
      }
      fs.unlinkSync(item.targetPath);
      removedTargets.add(item.targetPath);
    }
  } catch (error) {
    const restorationErrors = backups.length > 0 ? restoreRemoved(backups, removedTargets) : [];
    let quarantineRetained = false;
    if (quarantineRoot) {
      try {
        fs.rmSync(quarantineRoot, { recursive: true, force: true });
      } catch {
        quarantineRetained = true;
      }
    }
    return result(withInspection, 'FAIL', restorationErrors.length === 0 ? 'REMOVE_FAILED_RESTORED' : 'REMOVE_FAILED_RESTORE_INCOMPLETE', error.message, {
      mutation_attempted: true,
      removal_performed: removedTargets.size > 0,
      filesystem_changed: restorationErrors.length > 0 || quarantineRetained,
      rollback_attempted: removedTargets.size > 0,
      rollback_complete: restorationErrors.length === 0,
      quarantine_retained: quarantineRetained,
      quarantine_path: quarantineRetained ? quarantineRoot : null,
      removed_files: restorationErrors.length === 0 ? [] : [...removedTargets].map((value) => path.relative(target.target_root, value)),
    });
  }

  const removedDirectories = removeEmptyDirectories(target.target_root, directories);
  try {
    fs.rmSync(quarantineRoot, { recursive: true });
  } catch (error) {
    return result(withInspection, 'FAIL', 'REMOVED_QUARANTINE_RETAINED', `The canonical adapter was removed, but quarantine cleanup failed: ${error.message}`, {
      mutation_attempted: true,
      removal_performed: true,
      filesystem_changed: true,
      quarantine_retained: true,
      quarantine_path: quarantineRoot,
      removed_files: bundle.files.map((file) => file.target_relative),
      removed_directories: removedDirectories,
    });
  }

  const finalInspection = inspectInstalledBundle(target.target_root, bundle);
  if (finalInspection.aggregate_state !== 'ABSENT') {
    return result({ ...base, inspection: finalInspection.counts }, 'FAIL', 'POST_REMOVE_VERIFY_FAILED', 'One or more Hakim OpenCode bundle paths remain; inspect the target manually.', {
      mutation_attempted: true,
      removal_performed: true,
      filesystem_changed: true,
      removed_files: bundle.files.map((file) => file.target_relative),
      removed_directories: removedDirectories,
    });
  }

  return result({ ...base, inspection: finalInspection.counts }, 'PASS', 'REMOVED', 'The exact canonical Hakim OpenCode bundle was removed; unrelated .opencode content was preserved.', {
    mutation_attempted: true,
    removal_performed: true,
    filesystem_changed: true,
    removed_files: bundle.files.map((file) => file.target_relative),
    removed_directories: removedDirectories,
  });
}

export function formatText(report) {
  return [
    'Hakim OpenCode Project Remover',
    `MODE=${report.mode}`,
    `STATUS=${report.status}`,
    `STATE=${report.state}`,
    `MUTATION_ATTEMPTED=${report.mutation_attempted ? 'YES' : 'NO'}`,
    `REMOVAL_PERFORMED=${report.removal_performed ? 'YES' : 'NO'}`,
    `FILESYSTEM_CHANGED=${report.filesystem_changed ? 'YES' : 'NO'}`,
    `ROLLBACK_COMPLETE=${report.rollback_complete ? 'YES' : 'NO'}`,
    `QUARANTINE_RETAINED=${report.quarantine_retained ? 'YES' : 'NO'}`,
    'MODIFIED_TARGET_REMOVAL_ALLOWED=NO',
    'OPENCODE_CONFIG_MUTATION=NO',
    `TARGET_ROOT=${report.target_root || 'UNRESOLVED'}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run remove:opencode -- --target <repository>',
    '  npm run remove:opencode -- --target <repository> --apply',
    '  npm run remove:opencode:json -- --target <repository> [--apply]',
    '',
    'Dry-run is the default. Removal requires one complete byte-identical bundle.',
    'Modified, partial, symlink, non-regular, or unrelated OpenCode paths are preserved.',
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
  const report = removeOpenCodeAdapter(options);
  console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
