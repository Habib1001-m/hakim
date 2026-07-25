#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installOpenCodeAdapter } from './hakim_opencode_install.mjs';
import { removeOpenCodeAdapter } from './hakim_opencode_remove.mjs';
import {
  buildOpenCodeBundle,
  detectManagedInstallation,
  manifestFromBundle,
  manifestsEquivalent,
  validateTargetRoot,
} from './lib/opencode_bundle.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ACTIONS = new Set(['install', 'remove', 'status']);

export function parseCliArgs(argv, cwd = process.cwd()) {
  const options = { action: null, target: cwd, dryRun: false, json: false, help: false };
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
    const currentManifest = manifestFromBundle(bundle);
    const managed = detectManagedInstallation(targetState.target_root, bundle);
    const unsafe = ['MANIFEST_INVALID', 'UNSAFE', 'PARTIAL_OR_MODIFIED', 'UNMANAGED_CONFLICT'].includes(managed.state);

    let state = managed.state;
    let nextSafeAction = 'Preserve the existing OpenCode paths and inspect them manually.';
    if (managed.state === 'ABSENT') {
      state = 'ABSENT';
      nextSafeAction = 'Run `hakim-opencode install` from this repository to install Hakim.';
    } else if (managed.state === 'EXACT_MATCH' && manifestsEquivalent(managed.manifest, currentManifest)) {
      state = 'EXACT_MATCH';
      nextSafeAction = 'Hakim matches the current canonical project-local OpenCode bundle and persistent install manifest.';
    } else if (managed.state === 'UNMANIFESTED_CURRENT_EXACT' && manifestsEquivalent(managed.manifest, currentManifest)) {
      state = 'EXACT_MATCH_MANIFEST_MISSING';
      nextSafeAction = 'Run `hakim-opencode install` to add only the persistent lifecycle manifest.';
    } else if (managed.state === 'LEGACY_EXACT_MATCH' && manifestsEquivalent(managed.manifest, currentManifest)) {
      state = 'LEGACY_EXACT_MATCH_MANIFEST_MISSING';
      nextSafeAction = 'Run `hakim-opencode install` to adopt the accepted legacy beta.1 installation into persistent lifecycle metadata.';
    } else if (['EXACT_MATCH', 'LEGACY_EXACT_MATCH', 'UNMANIFESTED_CURRENT_EXACT'].includes(managed.state)) {
      state = 'UPGRADE_AVAILABLE';
      nextSafeAction = `Verified Hakim ${managed.manifest.product_version} is installed; run \`hakim-opencode install --dry-run\` to inspect the upgrade to ${currentManifest.product_version}.`;
    } else if (managed.message) {
      nextSafeAction = managed.message;
    }

    return {
      schema_version: 1,
      action: 'status',
      status: unsafe ? 'FAIL' : 'PASS',
      state,
      target_root: targetState.target_root,
      filesystem_changed: false,
      product_version: bundle.product_version,
      installed_product_version: managed.manifest?.product_version || null,
      manifest_source: managed.manifest_source,
      inspection: managed.inspection?.counts || null,
      next_safe_action: nextSafeAction,
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
  const mutationOptions = { target, apply: !options.dryRun, json: options.json, help: false };
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
    '`install` creates a new managed bundle, adopts an exact legacy/current bundle into lifecycle metadata, or transactionally upgrades a complete verified older installation.',
    '`remove` can remove a complete verified supported older installation using its persisted/accepted manifest; modified or partial state is refused.',
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

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(SCRIPT_PATH);
  } catch {
    return path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH);
  }
}

if (isDirectExecution()) main();
