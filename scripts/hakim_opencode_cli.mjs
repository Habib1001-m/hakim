#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installOpenCodeAdapter } from './hakim_opencode_install.mjs';
import { removeOpenCodeAdapter } from './hakim_opencode_remove.mjs';
import { buildOpenCodeBundle, inspectInstalledBundle, validateTargetRoot } from './lib/opencode_bundle.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ACTIONS = new Set(['install', 'remove', 'status']);

export function parseCliArgs(argv, cwd = process.cwd()) {
  const options = {
    action: null,
    target: cwd,
    dryRun: false,
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!options.action && ACTIONS.has(token)) options.action = token;
    else if (token === '--target') {
      if (!argv[index + 1]) throw new Error('--target requires a path');
      options.target = argv[++index];
    } else if (token.startsWith('--target=')) options.target = token.slice('--target='.length);
    else if (token === '--dry-run') options.dryRun = true;
    else if (token === '--json') options.json = true;
    else if (token === '--help' || token === '-h') options.help = true;
    else throw new Error(`unknown argument: ${token}`);
  }

  if (!options.help && !options.action) throw new Error('action is required: install, remove, or status');
  return options;
}

export function inspectStatus(target, root = ROOT) {
  const targetState = validateTargetRoot(target);
  if (!targetState.ok) {
    return {
      schema_version: 1,
      action: 'status',
      status: 'FAIL',
      state: targetState.state,
      target_root: targetState.target_root,
      filesystem_changed: false,
      next_safe_action: targetState.message,
    };
  }

  try {
    const bundle = buildOpenCodeBundle(root);
    const installed = inspectInstalledBundle(targetState.target_root, bundle);
    return {
      schema_version: 1,
      action: 'status',
      status: installed.aggregate_state === 'UNSAFE' ? 'FAIL' : 'PASS',
      state: installed.aggregate_state,
      target_root: targetState.target_root,
      filesystem_changed: false,
      inspection: installed.counts,
      next_safe_action: installed.aggregate_state === 'EXACT_MATCH'
        ? 'Hakim matches the canonical project-local OpenCode bundle.'
        : installed.aggregate_state === 'ABSENT'
          ? 'Run `hakim-opencode install` from this repository to install Hakim.'
          : 'Preserve the existing OpenCode paths and reconcile them manually; automatic overwrite is prohibited.',
    };
  } catch (error) {
    return {
      schema_version: 1,
      action: 'status',
      status: 'FAIL',
      state: 'SOURCE_INVALID',
      target_root: targetState.target_root,
      filesystem_changed: false,
      next_safe_action: error.message,
    };
  }
}

export function runAction(options, root = ROOT) {
  const target = path.resolve(options.target);
  if (options.action === 'status') return inspectStatus(target, root);

  const mutationOptions = {
    target,
    apply: !options.dryRun,
    json: options.json,
    help: false,
  };
  if (options.action === 'install') return installOpenCodeAdapter(mutationOptions, root);
  return removeOpenCodeAdapter(mutationOptions, root);
}

export function formatText(report) {
  return [
    'Hakim OpenCode Bootstrap',
    `ACTION=${report.action || 'unknown'}`,
    `STATUS=${report.status}`,
    `STATE=${report.state}`,
    `TARGET_ROOT=${report.target_root || 'UNRESOLVED'}`,
    `FILESYSTEM_CHANGED=${report.filesystem_changed ? 'YES' : 'NO'}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  hakim-opencode install [--target <repository>] [--dry-run] [--json]',
    '  hakim-opencode status [--target <repository>] [--json]',
    '  hakim-opencode remove [--target <repository>] [--dry-run] [--json]',
    '',
    'The target defaults to the current directory.',
    '`install` is an explicit create-only mutation; use --dry-run to inspect first.',
    '`remove` mutates only when the installed bundle is an exact canonical match.',
    'No command edits opencode.json or installs global OpenCode state.',
  ].join('\n');
}

function main() {
  let options;
  try {
    options = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  const report = runAction(options);
  const payload = { ...report, action: options.action };
  console.log(options.json ? JSON.stringify(payload, null, 2) : formatText(payload));
  process.exit(payload.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
