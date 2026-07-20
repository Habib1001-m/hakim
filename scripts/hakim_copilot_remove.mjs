#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseTargetArgs } from './hakim_copilot_install.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const INSTRUCTIONS_RELATIVE_PATH = path.join('.github', 'copilot-instructions.md');

export function parseArgs(args) {
  return parseTargetArgs(args);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function inspect(targetPath, expectedType) {
  let stat;
  try {
    stat = fs.lstatSync(targetPath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return { ok: false, state: 'MISSING' };
    }
    return { ok: false, state: 'UNREADABLE', error };
  }
  if (stat.isSymbolicLink()) return { ok: false, state: 'SYMLINK' };
  if (expectedType === 'file' && !stat.isFile()) return { ok: false, state: 'NOT_FILE' };
  if (expectedType === 'directory' && !stat.isDirectory()) return { ok: false, state: 'NOT_DIRECTORY' };
  return { ok: true, state: 'PRESENT' };
}

function entryExists(targetPath) {
  const state = inspect(targetPath, null);
  return state.state !== 'MISSING';
}

function result(base, status, state, nextSafeAction, mutation = {}) {
  return {
    ...base,
    status,
    state,
    mutation_attempted: mutation.mutation_attempted ?? false,
    removal_performed: mutation.removal_performed ?? false,
    filesystem_changed: mutation.filesystem_changed ?? false,
    restoration_attempted: mutation.restoration_attempted ?? false,
    restoration_performed: mutation.restoration_performed ?? false,
    quarantine_retained: mutation.quarantine_retained ?? false,
    quarantine_path: mutation.quarantine_path ?? null,
    next_safe_action: nextSafeAction,
    ...mutation.extra,
  };
}

function restore(quarantinePath, targetPath, renameFile) {
  if (entryExists(targetPath)) {
    return { attempted: false, performed: false, conflict: true, error: null };
  }
  try {
    renameFile(quarantinePath, targetPath);
    return { attempted: true, performed: true, conflict: false, error: null };
  } catch (error) {
    return { attempted: true, performed: false, conflict: false, error };
  }
}

function chooseQuarantinePath(targetDirectory, randomBytes) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = randomBytes(8).toString('hex');
    const candidate = path.join(
      targetDirectory,
      `.copilot-instructions.md.hakim-remove-${process.pid}-${token}`,
    );
    if (!entryExists(candidate)) return candidate;
  }
  return null;
}

export function removeCopilotInstructions(options, root = ROOT, dependencies = {}) {
  const renameFile = dependencies.renameSync || fs.renameSync;
  const unlinkFile = dependencies.unlinkSync || fs.unlinkSync;
  const randomBytes = dependencies.randomBytes || crypto.randomBytes;
  const sourcePath = path.join(root, INSTRUCTIONS_RELATIVE_PATH);
  const targetRoot = path.resolve(options.target);
  const targetDirectory = path.join(targetRoot, '.github');
  const targetPath = path.join(targetRoot, INSTRUCTIONS_RELATIVE_PATH);
  const base = {
    schema_version: 1,
    mode: options.apply ? 'APPLY_REMOVE_EXACT_MATCH' : 'DRY_RUN',
    source_path: sourcePath,
    target_root: targetRoot,
    target_path: targetPath,
    quarantine_strategy: 'ATOMIC_RENAME_VERIFY_DELETE',
    modified_target_removal_allowed: false,
    directory_removal_allowed: false,
  };

  const sourceState = inspect(sourcePath, 'file');
  if (!sourceState.ok) {
    return result(base, 'FAIL', `REFUSED_SOURCE_${sourceState.state}`, 'Restore the canonical Copilot instruction source before removal.');
  }
  const rootState = inspect(targetRoot, 'directory');
  if (!rootState.ok) {
    return result(base, 'FAIL', `REFUSED_TARGET_${rootState.state}`, 'Provide the real path to an existing target repository directory.');
  }

  const sourceHash = sha256(fs.readFileSync(sourcePath));
  const withSource = { ...base, source_sha256: sourceHash };
  const directoryState = inspect(targetDirectory, 'directory');
  if (directoryState.state === 'MISSING') {
    return result(withSource, 'PASS', 'ALREADY_ABSENT', 'No .github directory or Copilot instruction file exists; no change is needed.');
  }
  if (!directoryState.ok) {
    return result(withSource, 'FAIL', `REFUSED_GITHUB_${directoryState.state}`, 'The target .github path must be a real directory.');
  }

  const targetState = inspect(targetPath, 'file');
  if (targetState.state === 'MISSING') {
    return result(withSource, 'PASS', 'ALREADY_ABSENT', 'The Copilot instruction file is already absent; no change is needed.');
  }
  if (!targetState.ok) {
    return result(withSource, 'FAIL', `REFUSED_TARGET_FILE_${targetState.state}`, 'The target instruction path must be a regular file.');
  }

  const targetHash = sha256(fs.readFileSync(targetPath));
  const withTarget = {
    ...withSource,
    target_sha256_before: targetHash,
    target_sha256_after: targetHash,
  };
  if (targetHash !== sourceHash) {
    return result(withTarget, 'FAIL', 'REFUSED_MODIFIED_TARGET', 'Preserve and reconcile the modified instructions manually; Hakim removes only an exact canonical match.');
  }
  if (!options.apply) {
    return result(withTarget, 'PASS', 'READY_TO_REMOVE', `Review the exact hash match, then rerun with --apply to remove ${targetPath}.`);
  }

  const latestState = inspect(targetPath, 'file');
  if (latestState.state === 'MISSING') {
    return result({ ...withTarget, target_sha256_after: null }, 'PASS', 'ALREADY_ABSENT', 'The target disappeared before removal; no mutation was performed.');
  }
  if (!latestState.ok || sha256(fs.readFileSync(targetPath)) !== sourceHash) {
    return result(withTarget, 'FAIL', 'REFUSED_CHANGED_TARGET', 'The target changed after preflight; preserve it and inspect manually.');
  }

  const quarantinePath = chooseQuarantinePath(targetDirectory, randomBytes);
  if (!quarantinePath) {
    return result(withTarget, 'FAIL', 'QUARANTINE_PATH_UNAVAILABLE', 'Could not allocate a unique quarantine path.');
  }

  try {
    renameFile(targetPath, quarantinePath);
  } catch (error) {
    return result(withTarget, 'FAIL', 'QUARANTINE_RENAME_FAILED', `Could not quarantine the target: ${error.message}`, {
      mutation_attempted: true,
    });
  }

  const quarantineState = inspect(quarantinePath, 'file');
  const quarantineHash = quarantineState.ok ? sha256(fs.readFileSync(quarantinePath)) : null;
  if (!quarantineState.ok || quarantineHash !== sourceHash) {
    const restoration = restore(quarantinePath, targetPath, renameFile);
    const retained = !restoration.performed && entryExists(quarantinePath);
    return result(
      { ...withTarget, target_sha256_after: quarantineHash },
      'FAIL',
      restoration.performed ? 'QUARANTINE_VERIFY_FAILED_RESTORED' : 'QUARANTINE_VERIFY_FAILED_RETAINED',
      restoration.performed
        ? 'Quarantine verification failed and the file was restored.'
        : 'Quarantine verification failed; inspect the retained quarantine file.',
      {
        mutation_attempted: true,
        filesystem_changed: !restoration.performed,
        restoration_attempted: restoration.attempted,
        restoration_performed: restoration.performed,
        quarantine_retained: retained,
        quarantine_path: retained ? quarantinePath : null,
      },
    );
  }

  try {
    unlinkFile(quarantinePath);
  } catch (error) {
    const restoration = restore(quarantinePath, targetPath, renameFile);
    const retained = !restoration.performed && entryExists(quarantinePath);
    return result(
      withTarget,
      'FAIL',
      restoration.performed ? 'REMOVE_FAILED_RESTORED' : 'REMOVE_FAILED_QUARANTINED',
      restoration.performed
        ? `Deletion failed and the file was restored: ${error.message}`
        : `Deletion failed; inspect the retained quarantine file: ${error.message}`,
      {
        mutation_attempted: true,
        filesystem_changed: !restoration.performed,
        restoration_attempted: restoration.attempted,
        restoration_performed: restoration.performed,
        quarantine_retained: retained,
        quarantine_path: retained ? quarantinePath : null,
      },
    );
  }

  if (entryExists(targetPath)) {
    return result(withTarget, 'FAIL', 'TARGET_RECREATED_CONCURRENTLY', 'The canonical file was removed, but another target appeared concurrently; preserve it and inspect manually.', {
      mutation_attempted: true,
      removal_performed: true,
      filesystem_changed: true,
    });
  }

  return result({ ...withTarget, target_sha256_after: null }, 'PASS', 'REMOVED', 'Review and commit the target repository removal. The .github directory was intentionally preserved.', {
    mutation_attempted: true,
    removal_performed: true,
    filesystem_changed: true,
  });
}

export function formatText(removal) {
  const lines = [
    'Hakim Copilot Instruction Remover',
    `MODE=${removal.mode}`,
    `STATUS=${removal.status}`,
    `STATE=${removal.state}`,
    `MUTATION_ATTEMPTED=${removal.mutation_attempted ? 'YES' : 'NO'}`,
    `REMOVAL_PERFORMED=${removal.removal_performed ? 'YES' : 'NO'}`,
    `FILESYSTEM_CHANGED=${removal.filesystem_changed ? 'YES' : 'NO'}`,
    `RESTORATION_PERFORMED=${removal.restoration_performed ? 'YES' : 'NO'}`,
    `QUARANTINE_RETAINED=${removal.quarantine_retained ? 'YES' : 'NO'}`,
    'MODIFIED_TARGET_REMOVAL_ALLOWED=NO',
    'DIRECTORY_REMOVAL_ALLOWED=NO',
    `SOURCE=${removal.source_path}`,
    `TARGET=${removal.target_path}`,
  ];
  if (removal.quarantine_path) lines.push(`QUARANTINE=${removal.quarantine_path}`);
  if (removal.source_sha256) lines.push(`SOURCE_SHA256=${removal.source_sha256}`);
  if (removal.target_sha256_before) lines.push(`TARGET_SHA256_BEFORE=${removal.target_sha256_before}`);
  if (removal.target_sha256_after) lines.push(`TARGET_SHA256_AFTER=${removal.target_sha256_after}`);
  lines.push(`NEXT_SAFE_ACTION=${removal.next_safe_action}`);
  return lines.join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run remove:copilot -- --target <repository>',
    '  npm run remove:copilot -- --target <repository> --apply',
    '  npm run remove:copilot:json -- --target <repository> [--apply]',
    '',
    'Dry-run is the default. --apply removes only an exact canonical instruction',
    'file after same-directory quarantine and hash re-verification. Modified files,',
    'symlinks, non-regular paths, and directory removal are refused.',
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
  const removal = removeCopilotInstructions(options);
  console.log(options.json ? JSON.stringify(removal, null, 2) : formatText(removal));
  process.exit(removal.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
