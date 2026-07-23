#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const PLUGIN_RELATIVE_PATH = path.join('plugins', 'codex');
const MANIFEST_RELATIVE_PATH = path.join(PLUGIN_RELATIVE_PATH, '.codex-plugin', 'plugin.json');
const SKILLS_RELATIVE_PATH = path.join(PLUGIN_RELATIVE_PATH, 'skills');
const HOOKS_RELATIVE_PATH = path.join(PLUGIN_RELATIVE_PATH, 'hooks', 'hooks.json');
const MARKETPLACE_RELATIVE_PATH = path.join('.agents', 'plugins', 'marketplace.json');

export function parseArgs(args) {
  const options = { apply: false, json: false, help: false, binary: 'codex', cwd: null, passthrough: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') {
      options.passthrough = args.slice(index + 1);
      break;
    }
    if (arg === '--apply') options.apply = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--binary') {
      if (!args[index + 1]) throw new Error('--binary requires a value');
      options.binary = args[++index];
    } else if (arg.startsWith('--binary=')) options.binary = arg.slice('--binary='.length);
    else if (arg === '--cwd') {
      if (!args[index + 1]) throw new Error('--cwd requires a path');
      options.cwd = args[++index];
    } else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
    else throw new Error(`unknown option: ${arg}`);
  }

  if (options.apply && options.json) throw new Error('--json cannot be combined with --apply because Codex uses interactive stdout');
  for (const arg of options.passthrough) {
    if (arg === '--cd' || arg === '-C' || arg.startsWith('--cd=')) throw new Error('--cd/-C is controlled by Hakim and cannot be overridden');
    if (arg === '--dangerously-bypass-approvals-and-sandbox' || arg.startsWith('--dangerously-bypass-approvals-and-sandbox=') || arg === '--yolo' || arg.startsWith('--yolo=')) {
      throw new Error('approval and sandbox bypass flags are refused by the guarded Hakim launcher');
    }
  }
  return options;
}

function fail(base, state, nextSafeAction, extra = {}) {
  return {
    ...base,
    status: 'FAIL',
    state,
    execution_attempted: false,
    child_process_started: false,
    launcher_write_attempted: false,
    launcher_filesystem_changed: false,
    child_mutation_scope: 'NOT_OBSERVED',
    next_safe_action: nextSafeAction,
    ...extra,
  };
}

function inspectPath(targetPath, expectedType) {
  if (!fs.existsSync(targetPath)) return { ok: false, state: 'MISSING' };
  const stat = fs.lstatSync(targetPath);
  if (stat.isSymbolicLink()) return { ok: false, state: 'SYMLINK' };
  if (expectedType === 'directory' && !stat.isDirectory()) return { ok: false, state: 'NOT_DIRECTORY' };
  if (expectedType === 'file' && !stat.isFile()) return { ok: false, state: 'NOT_FILE' };
  return { ok: true, state: 'PRESENT' };
}

function executableCandidates(binary, env = process.env, platform = process.platform) {
  if (binary.includes('/') || binary.includes('\\')) return [path.resolve(binary)];
  const pathEntries = (env.PATH || '').split(path.delimiter).filter(Boolean);
  const extensions = platform === 'win32' ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean) : [''];
  return pathEntries.flatMap((entry) => extensions.map((extension) => path.join(entry, `${binary}${extension}`)));
}

export function resolveExecutable(binary, env = process.env, platform = process.platform) {
  for (const candidate of executableCandidates(binary, env, platform)) {
    try {
      const stat = fs.statSync(candidate);
      if (!stat.isFile()) continue;
      if (platform !== 'win32') fs.accessSync(candidate, fs.constants.X_OK);
      return path.resolve(candidate);
    } catch {
      // Try next PATH candidate.
    }
  }
  return null;
}

export function buildCodexLaunchPlan(options, root = ROOT, environment = process.env) {
  const pluginPath = path.join(root, PLUGIN_RELATIVE_PATH);
  const manifestPath = path.join(root, MANIFEST_RELATIVE_PATH);
  const skillsPath = path.join(root, SKILLS_RELATIVE_PATH);
  const hooksPath = path.join(root, HOOKS_RELATIVE_PATH);
  const marketplacePath = path.join(root, MARKETPLACE_RELATIVE_PATH);
  const versionPath = path.join(root, 'core', 'hakim-skill', 'VERSION');
  const cwd = path.resolve(options.cwd || process.cwd());
  const base = {
    schema_version: 1,
    mode: options.apply ? 'APPLY_LAUNCH' : 'DRY_RUN',
    binary_requested: options.binary,
    binary_resolved: null,
    cwd,
    plugin_path: pluginPath,
    manifest_path: manifestPath,
    hooks_path: hooksPath,
    marketplace_path: marketplacePath,
    argv: [],
    host_ui_managed: true,
    plugin_installation_claimed: false,
    plugin_activation_claimed: false,
    persistent_installation_claimed: false,
    automatic_host_configuration: false,
    product_install_path: 'codex plugin marketplace add Habib1001-m/hakim',
    product_install_identity: 'hakim@hakim',
    development_fallback: true,
  };

  for (const [label, targetPath, expectedType, nextSafeAction] of [
    ['PLUGIN', pluginPath, 'directory', 'Restore the canonical plugins/codex directory before launching.'],
    ['MANIFEST', manifestPath, 'file', 'Restore the Codex plugin manifest before launching.'],
    ['SKILLS', skillsPath, 'directory', 'Restore the Codex skills directory before launching.'],
    ['HOOKS', hooksPath, 'file', 'Restore the Codex hooks manifest before launching.'],
    ['MARKETPLACE', marketplacePath, 'file', 'Restore the Codex marketplace declaration before launching.'],
    ['CWD', cwd, 'directory', 'Provide an existing working directory for Codex.'],
    ['VERSION', versionPath, 'file', 'Restore core/hakim-skill/VERSION before launching.'],
  ]) {
    const inspected = inspectPath(targetPath, expectedType);
    if (!inspected.ok) return fail(base, `${label}_${inspected.state}`, nextSafeAction);
  }

  let manifestJson;
  let marketplaceJson;
  try { manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch (error) { return fail(base, 'MANIFEST_INVALID_JSON', `Repair the Codex plugin manifest: ${error.message}`); }
  try { marketplaceJson = JSON.parse(fs.readFileSync(marketplacePath, 'utf8')); }
  catch (error) { return fail(base, 'MARKETPLACE_INVALID_JSON', `Repair the Codex marketplace declaration: ${error.message}`); }

  const hakimVersion = fs.readFileSync(versionPath, 'utf8').trim();
  const marketplaceEntry = (marketplaceJson.plugins || []).find((entry) => entry.name === 'hakim');
  const withContracts = {
    ...base,
    hakim_version: hakimVersion,
    manifest_name: manifestJson.name || null,
    manifest_version: manifestJson.version || null,
    marketplace_name: marketplaceJson.name || null,
    marketplace_entry_name: marketplaceEntry?.name || null,
    marketplace_source_type: marketplaceEntry?.source?.source || null,
    marketplace_source_path: marketplaceEntry?.source?.path || null,
    marketplace_installation_policy: marketplaceEntry?.policy?.installation || null,
  };

  if (manifestJson.name !== 'hakim') return fail(withContracts, 'MANIFEST_NAME_MISMATCH', 'The Codex plugin manifest must identify the hakim plugin.');
  if (manifestJson.version !== hakimVersion) return fail(withContracts, 'MANIFEST_VERSION_MISMATCH', 'Synchronize the Codex plugin manifest with the canonical Hakim version.');
  if (marketplaceJson.name !== 'hakim') return fail(withContracts, 'MARKETPLACE_NAME_MISMATCH', 'The Codex marketplace must be named hakim.');
  if (!marketplaceEntry) return fail(withContracts, 'MARKETPLACE_ENTRY_MISSING', 'Restore the hakim entry in the Codex marketplace.');
  if (marketplaceEntry.source?.source !== 'local' || marketplaceEntry.source?.path !== './plugins/codex') {
    return fail(withContracts, 'MARKETPLACE_SOURCE_MISMATCH', 'Restore the marketplace source path to ./plugins/codex.');
  }
  if (marketplaceEntry.policy?.installation !== 'AVAILABLE') return fail(withContracts, 'MARKETPLACE_POLICY_MISMATCH', 'Restore the Hakim marketplace installation policy to AVAILABLE.');

  const binaryResolved = resolveExecutable(options.binary, environment);
  if (!binaryResolved) return fail(withContracts, 'BINARY_NOT_FOUND', `Install Codex or provide an executable with --binary. Requested: ${options.binary}`);

  return {
    ...withContracts,
    status: 'PASS',
    state: 'READY_TO_LAUNCH',
    binary_resolved: binaryResolved,
    argv: [...options.passthrough],
    execution_attempted: false,
    child_process_started: false,
    launcher_write_attempted: false,
    launcher_filesystem_changed: false,
    child_mutation_scope: 'NOT_OBSERVED',
    next_safe_action: options.apply
      ? 'Launch Codex in the validated working directory. Native Hakim installation remains managed by Codex; verify hakim@hakim and the SessionStart hook in the host UI.'
      : 'Development fallback only: review binary, working directory, marketplace contract, and argv; rerun with --apply to launch. Product users should install Hakim through the Codex marketplace.',
  };
}

export function launchCodex(options, root = ROOT, dependencies = {}) {
  const environment = dependencies.env || process.env;
  const plan = buildCodexLaunchPlan(options, root, environment);
  if (plan.status !== 'PASS' || !options.apply) return plan;
  const spawn = dependencies.spawnSync || spawnSync;
  const child = spawn(plan.binary_resolved, plan.argv, { cwd: plan.cwd, env: environment, stdio: 'inherit', shell: false });
  if (child.error) return { ...plan, status: 'FAIL', state: 'LAUNCH_ERROR', execution_attempted: true, child_process_started: false, child_error: child.error.message, next_safe_action: 'Resolve the Codex launch error and rerun the dry-run before trying --apply again.' };
  if (child.signal) return { ...plan, status: 'FAIL', state: 'CHILD_SIGNALLED', execution_attempted: true, child_process_started: true, child_signal: child.signal, exit_code: child.status, next_safe_action: 'Inspect why Codex was interrupted before retrying.' };
  if (child.status !== 0) return { ...plan, status: 'FAIL', state: 'CHILD_EXIT_NONZERO', execution_attempted: true, child_process_started: true, exit_code: child.status, next_safe_action: 'Review the Codex output and resolve the non-zero exit before retrying.' };
  return { ...plan, status: 'PASS', state: 'CHILD_EXIT_ZERO', execution_attempted: true, child_process_started: true, exit_code: 0, next_safe_action: 'Codex exited successfully. The development launcher did not install, activate, trust, or persist the Hakim plugin.' };
}

export function formatText(result) {
  return [
    'Hakim Codex Development Launcher',
    `MODE=${result.mode}`,
    `STATUS=${result.status}`,
    `STATE=${result.state}`,
    `HAKIM_VERSION=${result.hakim_version || 'UNKNOWN'}`,
    `BINARY_REQUESTED=${result.binary_requested}`,
    `BINARY_RESOLVED=${result.binary_resolved || 'NOT_FOUND'}`,
    `CWD=${result.cwd}`,
    `PLUGIN=${result.plugin_path}`,
    `MARKETPLACE=${result.marketplace_path}`,
    `PRODUCT_INSTALL=${result.product_install_path}`,
    `PRODUCT_IDENTITY=${result.product_install_identity}`,
    `ARGV_JSON=${JSON.stringify(result.argv || [])}`,
    `EXECUTION_ATTEMPTED=${result.execution_attempted ? 'YES' : 'NO'}`,
    `CHILD_PROCESS_STARTED=${result.child_process_started ? 'YES' : 'NO'}`,
    `LAUNCHER_WRITE_ATTEMPTED=${result.launcher_write_attempted ? 'YES' : 'NO'}`,
    `LAUNCHER_FILESYSTEM_CHANGED=${result.launcher_filesystem_changed ? 'YES' : 'NO'}`,
    'HOST_UI_MANAGED=YES',
    'PLUGIN_INSTALLATION_CLAIMED=NO',
    'PLUGIN_ACTIVATION_CLAIMED=NO',
    'PERSISTENT_INSTALLATION_CLAIMED=NO',
    `NEXT_SAFE_ACTION=${result.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Development fallback usage:',
    '  npm run launch:codex -- [--binary <path-or-name>] [--cwd <directory>] [-- <codex-args...>]',
    '  npm run launch:codex -- --apply [--binary <path-or-name>] [--cwd <directory>] [-- <codex-args...>]',
    '  npm run launch:codex:json -- [--binary <path-or-name>] [--cwd <directory>] [-- <codex-args...>]',
    '',
    'Product installation: codex plugin marketplace add Habib1001-m/hakim, then install hakim@hakim from the Codex plugin UI.',
    'The launcher does not install or trust plugins. --cd/-C and approval/sandbox bypass flags are refused.',
  ].join('\n');
}

function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
  if (options.help) { console.log(usage()); return; }
  const result = launchCodex(options);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatText(result));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
