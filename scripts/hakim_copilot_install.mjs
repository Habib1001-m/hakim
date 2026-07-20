#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_RELATIVE_PATH = path.join('.github', 'copilot-instructions.md');

export function parseArgs(args) {
  const options = { target: null, apply: false, json: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--apply') options.apply = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--target') {
      if (!args[index + 1]) throw new Error('--target requires a path');
      options.target = args[index + 1];
      index += 1;
    } else if (arg.startsWith('--target=')) options.target = arg.slice('--target='.length);
    else throw new Error(`unknown option: ${arg}`);
  }
  if (!options.help && !options.target) throw new Error('--target is required');
  return options;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fail(base, state, message, mutation = {}) {
  return {
    ...base,
    status: 'FAIL',
    state,
    write_attempted: mutation.write_attempted ?? false,
    write_performed: mutation.write_performed ?? false,
    filesystem_changed: mutation.filesystem_changed ?? false,
    next_safe_action: message,
  };
}

export function installCopilotInstructions(options, root = ROOT) {
  const sourcePath = path.join(root, SOURCE_RELATIVE_PATH);
  const targetRoot = path.resolve(options.target);
  const targetDirectory = path.join(targetRoot, '.github');
  const targetPath = path.join(targetRoot, SOURCE_RELATIVE_PATH);
  const base = {
    schema_version: 1,
    mode: options.apply ? 'APPLY_CREATE_ONLY' : 'DRY_RUN',
    source_path: sourcePath,
    target_root: targetRoot,
    target_path: targetPath,
    overwrite_allowed: false,
    merge_performed: false,
  };

  if (!fs.existsSync(sourcePath)) {
    return fail(base, 'SOURCE_NOT_FOUND', 'Restore the canonical Copilot instruction source before installation.');
  }
  if (!fs.existsSync(targetRoot)) {
    return fail(base, 'TARGET_NOT_FOUND', 'Provide an existing target repository directory.');
  }

  let rootStat;
  try {
    rootStat = fs.lstatSync(targetRoot);
  } catch (error) {
    return fail(base, 'TARGET_UNREADABLE', error.message);
  }
  if (rootStat.isSymbolicLink()) {
    return fail(base, 'REFUSED_TARGET_SYMLINK', 'Use the real target repository path; symlink roots are not accepted.');
  }
  if (!rootStat.isDirectory()) {
    return fail(base, 'TARGET_NOT_DIRECTORY', 'The target path must be a directory.');
  }

  if (fs.existsSync(targetDirectory)) {
    const directoryStat = fs.lstatSync(targetDirectory);
    if (directoryStat.isSymbolicLink()) {
      return fail(base, 'REFUSED_GITHUB_SYMLINK', 'The target .github path is a symlink; no write was attempted.');
    }
    if (!directoryStat.isDirectory()) {
      return fail(base, 'REFUSED_GITHUB_NON_DIRECTORY', 'The target .github path is not a directory; no write was attempted.');
    }
  }

  const sourceBytes = fs.readFileSync(sourcePath);
  const sourceHash = sha256(sourceBytes);
  const withSource = { ...base, source_sha256: sourceHash };

  if (fs.existsSync(targetPath)) {
    const targetStat = fs.lstatSync(targetPath);
    if (targetStat.isSymbolicLink()) {
      return fail(withSource, 'REFUSED_TARGET_FILE_SYMLINK', 'The target instruction file is a symlink; no write was attempted.');
    }
    if (!targetStat.isFile()) {
      return fail(withSource, 'REFUSED_TARGET_NON_FILE', 'The target instruction path is not a regular file; no write was attempted.');
    }
    const targetBytes = fs.readFileSync(targetPath);
    const targetHash = sha256(targetBytes);
    if (targetHash === sourceHash) {
      return {
        ...withSource,
        status: 'PASS',
        state: 'ALREADY_MATCHES',
        target_sha256_before: targetHash,
        target_sha256_after: targetHash,
        write_attempted: false,
        write_performed: false,
        filesystem_changed: false,
        next_safe_action: 'No change is needed; the target already matches the canonical instructions.',
      };
    }
    return {
      ...fail(withSource, 'REFUSED_EXISTING_DIFF', 'Review and merge the existing instructions manually; automatic overwrite is prohibited.'),
      target_sha256_before: targetHash,
      target_sha256_after: targetHash,
    };
  }

  if (!options.apply) {
    return {
      ...withSource,
      status: 'PASS',
      state: 'READY_TO_CREATE',
      target_sha256_before: null,
      target_sha256_after: null,
      write_attempted: false,
      write_performed: false,
      filesystem_changed: false,
      next_safe_action: `Review the source, then rerun with --apply to create ${targetPath}.`,
    };
  }

  const directoryExistedBefore = fs.existsSync(targetDirectory);
  try {
    fs.mkdirSync(targetDirectory, { recursive: true });
    fs.writeFileSync(targetPath, sourceBytes, { flag: 'wx', mode: 0o644 });
  } catch (error) {
    const targetExistsAfter = fs.existsSync(targetPath);
    let directoryRetained = !directoryExistedBefore && fs.existsSync(targetDirectory);
    if (!targetExistsAfter && directoryRetained) {
      try {
        fs.rmdirSync(targetDirectory);
        directoryRetained = false;
      } catch {
        directoryRetained = true;
      }
    }
    if (error.code === 'EEXIST') {
      return fail(
        withSource,
        'REFUSED_CONCURRENT_EXISTING_TARGET',
        'The target appeared during installation; inspect it manually.',
        { write_attempted: true, write_performed: false, filesystem_changed: directoryRetained },
      );
    }
    return fail(withSource, 'CREATE_FAILED', error.message, {
      write_attempted: true,
      write_performed: targetExistsAfter,
      filesystem_changed: targetExistsAfter || directoryRetained,
    });
  }

  const targetHashAfter = sha256(fs.readFileSync(targetPath));
  if (targetHashAfter !== sourceHash) {
    return {
      ...fail(
        withSource,
        'POST_WRITE_HASH_MISMATCH',
        'The created file did not match the canonical source; inspect the target immediately.',
        { write_attempted: true, write_performed: true, filesystem_changed: true },
      ),
      target_sha256_after: targetHashAfter,
    };
  }

  return {
    ...withSource,
    status: 'PASS',
    state: 'CREATED',
    target_sha256_before: null,
    target_sha256_after: targetHashAfter,
    write_attempted: true,
    write_performed: true,
    filesystem_changed: true,
    next_safe_action: 'Review and commit the new target instruction file in the target repository.',
  };
}

export function formatText(result) {
  const lines = [
    'Hakim Copilot Instruction Installer',
    `MODE=${result.mode}`,
    `STATUS=${result.status}`,
    `STATE=${result.state}`,
    `WRITE_ATTEMPTED=${result.write_attempted ? 'YES' : 'NO'}`,
    `WRITE_PERFORMED=${result.write_performed ? 'YES' : 'NO'}`,
    `FILESYSTEM_CHANGED=${result.filesystem_changed ? 'YES' : 'NO'}`,
    'OVERWRITE_ALLOWED=NO',
    'MERGE_PERFORMED=NO',
    `SOURCE=${result.source_path}`,
    `TARGET=${result.target_path}`,
  ];
  if (result.source_sha256) lines.push(`SOURCE_SHA256=${result.source_sha256}`);
  if (result.target_sha256_before) lines.push(`TARGET_SHA256_BEFORE=${result.target_sha256_before}`);
  if (result.target_sha256_after) lines.push(`TARGET_SHA256_AFTER=${result.target_sha256_after}`);
  lines.push(`NEXT_SAFE_ACTION=${result.next_safe_action}`);
  return lines.join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run install:copilot -- --target <repository>',
    '  npm run install:copilot -- --target <repository> --apply',
    '  node scripts/hakim_copilot_install.mjs --target <repository> [--apply] [--json]',
    '',
    'Dry-run is the default. --apply creates a missing Copilot instruction file',
    'only. Existing, different, non-regular, or symlink targets are never changed.',
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
  const result = installCopilotInstructions(options);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatText(result));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
