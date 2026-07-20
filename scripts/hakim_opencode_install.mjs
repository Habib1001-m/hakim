#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildOpenCodeBundle,
  bundleDirectories,
  inspectEntry,
  inspectInstalledBundle,
  validateDirectoryChain,
  validateTargetRoot,
} from './lib/opencode_bundle.mjs';

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
    created_files: mutation.created_files || [],
    created_directories: mutation.created_directories || [],
    next_safe_action: nextSafeAction,
  };
}

function rollback(targetRoot, createdFiles, createdDirectories) {
  const errors = [];
  for (const relative of [...createdFiles].reverse()) {
    try {
      fs.unlinkSync(path.join(targetRoot, relative));
    } catch (error) {
      if (error.code !== 'ENOENT') errors.push(`${relative}: ${error.message}`);
    }
  }
  for (const relative of [...createdDirectories].reverse()) {
    try {
      fs.rmdirSync(path.join(targetRoot, relative));
    } catch (error) {
      if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) errors.push(`${relative}: ${error.message}`);
    }
  }
  return errors;
}

export function installOpenCodeAdapter(options, root = ROOT) {
  let bundle;
  try {
    bundle = buildOpenCodeBundle(root);
  } catch (error) {
    return result({ schema_version: 1, mode: options.apply ? 'APPLY_CREATE_ONLY' : 'DRY_RUN' }, 'FAIL', 'SOURCE_INVALID', error.message);
  }

  const target = validateTargetRoot(options.target);
  const base = {
    schema_version: 1,
    adapter: bundle.adapter,
    mode: options.apply ? 'APPLY_CREATE_ONLY' : 'DRY_RUN',
    target_root: target.target_root,
    overwrite_allowed: false,
    opencode_config_mutation: false,
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
  if (installed.aggregate_state === 'EXACT_MATCH') {
    return result(withInspection, 'PASS', 'ALREADY_MATCHES', 'The project-local OpenCode adapter already matches the canonical Hakim bundle.');
  }
  if (installed.aggregate_state !== 'ABSENT') {
    return result(
      withInspection,
      'FAIL',
      installed.aggregate_state === 'UNSAFE' ? 'REFUSED_UNSAFE_TARGET' : 'REFUSED_PARTIAL_OR_DIFFERENT',
      'Preserve the existing OpenCode paths and reconcile them manually; automatic overwrite or partial repair is prohibited.',
    );
  }
  if (!options.apply) {
    return result(withInspection, 'PASS', 'READY_TO_CREATE', 'Review the manifest, then rerun with --apply to create the project-local OpenCode adapter.');
  }

  const createdDirectories = [];
  const createdFiles = [];
  try {
    for (const relative of directories) {
      const absolute = path.join(target.target_root, relative);
      const existing = inspectEntry(absolute, 'directory');
      if (existing.ok) continue;
      if (existing.state !== 'MISSING') throw new Error(`${relative} became unsafe: ${existing.state}`);
      fs.mkdirSync(absolute, { mode: 0o755 });
      const created = inspectEntry(absolute, 'directory');
      if (!created.ok) throw new Error(`${relative} was not created as a real directory`);
      createdDirectories.push(relative);
    }

    for (const file of bundle.files) {
      const targetPath = path.join(target.target_root, file.target_relative);
      fs.writeFileSync(targetPath, file.bytes, { flag: 'wx', mode: 0o644 });
      createdFiles.push(file.target_relative);
      const created = inspectEntry(targetPath, 'file');
      if (!created.ok) throw new Error(`${file.target_relative} was not created as a regular file`);
      const targetBytes = fs.readFileSync(targetPath);
      if (targetBytes.length !== file.size) throw new Error(`${file.target_relative} size mismatch after write`);
      const verified = inspectInstalledBundle(target.target_root, bundle)
        .entries.find((entry) => entry.target_relative === file.target_relative);
      if (!verified?.exact_match) throw new Error(`${file.target_relative} hash mismatch after write`);
    }
  } catch (error) {
    const rollbackErrors = rollback(target.target_root, createdFiles, createdDirectories);
    return result(withInspection, 'FAIL', rollbackErrors.length === 0 ? 'CREATE_FAILED_ROLLED_BACK' : 'CREATE_FAILED_ROLLBACK_INCOMPLETE', error.message, {
      write_attempted: true,
      write_performed: createdFiles.length > 0,
      filesystem_changed: rollbackErrors.length > 0,
      rollback_attempted: createdFiles.length > 0 || createdDirectories.length > 0,
      rollback_complete: rollbackErrors.length === 0,
      created_files: rollbackErrors.length === 0 ? [] : createdFiles,
      created_directories: rollbackErrors.length === 0 ? [] : createdDirectories,
    });
  }

  const finalInspection = inspectInstalledBundle(target.target_root, bundle);
  if (finalInspection.aggregate_state !== 'EXACT_MATCH') {
    const rollbackErrors = rollback(target.target_root, createdFiles, createdDirectories);
    return result({ ...base, inspection: finalInspection.counts }, 'FAIL', rollbackErrors.length === 0 ? 'POST_WRITE_VERIFY_FAILED_ROLLED_BACK' : 'POST_WRITE_VERIFY_FAILED_ROLLBACK_INCOMPLETE', 'The installed bundle did not match the canonical manifest.', {
      write_attempted: true,
      write_performed: true,
      filesystem_changed: rollbackErrors.length > 0,
      rollback_attempted: true,
      rollback_complete: rollbackErrors.length === 0,
    });
  }

  return result({ ...base, inspection: finalInspection.counts }, 'PASS', 'CREATED', 'Run OpenCode from the target repository and capture separate runtime evidence before claiming live compatibility.', {
    write_attempted: true,
    write_performed: true,
    filesystem_changed: true,
    created_files: createdFiles,
    created_directories: createdDirectories,
  });
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
    'Dry-run is the default. Installation is create-only and never edits opencode.json.',
    'Any partial, different, symlink, or non-regular target is refused.',
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
