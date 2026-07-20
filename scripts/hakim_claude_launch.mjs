#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const PLUGIN_RELATIVE_PATH = path.join('plugins', 'claude-code');
const MANIFEST_RELATIVE_PATH = path.join(PLUGIN_RELATIVE_PATH, '.claude-plugin', 'plugin.json');
const SKILLS_RELATIVE_PATH = path.join(PLUGIN_RELATIVE_PATH, 'skills');
const HOOKS_RELATIVE_PATH = path.join(PLUGIN_RELATIVE_PATH, 'hooks', 'hooks.json');

export function parseArgs(args) {
  const options = {
    apply: false,
    json: false,
    help: false,
    binary: 'claude',
    cwd: null,
    passthrough: [],
  };

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
      options.binary = args[index + 1];
      index += 1;
    } else if (arg.startsWith('--binary=')) options.binary = arg.slice('--binary='.length);
    else if (arg === '--cwd') {
      if (!args[index + 1]) throw new Error('--cwd requires a path');
      options.cwd = args[index + 1];
      index += 1;
    } else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
    else throw new Error(`unknown option: ${arg}`);
  }

  if (options.apply && options.json) {
    throw new Error('--json cannot be combined with --apply because Claude uses interactive stdout');
  }
  if (options.passthrough.some((arg) => arg === '--plugin-dir' || arg.startsWith('--plugin-dir='))) {
    throw new Error('--plugin-dir is controlled by Hakim and cannot be overridden');
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
  const extensions = platform === 'win32'
    ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)
    : [''];
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
      // Try the next PATH candidate.
    }
  }
  return null;
}

export function buildClaudeLaunchPlan(options, root = ROOT, environment = process.env) {
  const pluginPath = path.join(root, PLUGIN_RELATIVE_PATH);
  const manifestPath = path.join(root, MANIFEST_RELATIVE_PATH);
  const skillsPath = path.join(root, SKILLS_RELATIVE_PATH);
  const hooksPath = path.join(root, HOOKS_RELATIVE_PATH);
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
    argv: [],
    persistent_installation_claimed: false,
    automatic_host_configuration: false,
  };

  const plugin = inspectPath(pluginPath, 'directory');
  if (!plugin.ok) {
    return fail(base, `PLUGIN_${plugin.state}`, 'Restore the canonical plugins/claude-code directory before launching.');
  }
  const manifest = inspectPath(manifestPath, 'file');
  if (!manifest.ok) {
    return fail(base, `MANIFEST_${manifest.state}`, 'Restore the Claude Code plugin manifest before launching.');
  }
  const skills = inspectPath(skillsPath, 'directory');
  if (!skills.ok) {
    return fail(base, `SKILLS_${skills.state}`, 'Restore the Claude Code skills directory before launching.');
  }
  const hooks = inspectPath(hooksPath, 'file');
  if (!hooks.ok) {
    return fail(base, `HOOKS_${hooks.state}`, 'Restore the Claude Code hooks manifest before launching.');
  }
  const cwdState = inspectPath(cwd, 'directory');
  if (!cwdState.ok) {
    return fail(base, `CWD_${cwdState.state}`, 'Provide an existing working directory for Claude Code.');
  }
  if (!fs.existsSync(versionPath)) {
    return fail(base, 'VERSION_MISSING', 'Restore core/hakim-skill/VERSION before launching.');
  }

  let manifestJson;
  try {
    manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return fail(base, 'MANIFEST_INVALID_JSON', `Repair the Claude Code plugin manifest: ${error.message}`);
  }
  const hakimVersion = fs.readFileSync(versionPath, 'utf8').trim();
  if (manifestJson.name !== 'hakim') {
    return fail(base, 'MANIFEST_NAME_MISMATCH', 'The Claude Code plugin manifest must identify the hakim plugin.', {
      hakim_version: hakimVersion,
      manifest_name: manifestJson.name || null,
      manifest_version: manifestJson.version || null,
    });
  }
  if (manifestJson.version !== hakimVersion) {
    return fail(base, 'MANIFEST_VERSION_MISMATCH', 'Synchronize the Claude Code plugin manifest with the canonical Hakim version.', {
      hakim_version: hakimVersion,
      manifest_name: manifestJson.name,
      manifest_version: manifestJson.version || null,
    });
  }

  const binaryResolved = resolveExecutable(options.binary, environment);
  const withManifest = {
    ...base,
    hakim_version: hakimVersion,
    manifest_name: manifestJson.name,
    manifest_version: manifestJson.version,
  };
  if (!binaryResolved) {
    return fail(withManifest, 'BINARY_NOT_FOUND', `Install Claude Code or provide an executable with --binary. Requested: ${options.binary}`);
  }

  const argv = ['--plugin-dir', pluginPath, ...options.passthrough];
  return {
    ...withManifest,
    status: 'PASS',
    state: 'READY_TO_LAUNCH',
    binary_resolved: binaryResolved,
    argv,
    execution_attempted: false,
    child_process_started: false,
    launcher_write_attempted: false,
    launcher_filesystem_changed: false,
    child_mutation_scope: 'NOT_OBSERVED',
    next_safe_action: options.apply
      ? 'Launch Claude Code with the validated plugin directory and explicit argv.'
      : 'Review the resolved binary, working directory, plugin path, and argv; rerun with --apply to launch.',
  };
}

export function launchClaude(options, root = ROOT, dependencies = {}) {
  const environment = dependencies.env || process.env;
  const plan = buildClaudeLaunchPlan(options, root, environment);
  if (plan.status !== 'PASS' || !options.apply) return plan;

  const spawn = dependencies.spawnSync || spawnSync;
  const child = spawn(plan.binary_resolved, plan.argv, {
    cwd: plan.cwd,
    env: environment,
    stdio: 'inherit',
    shell: false,
  });

  if (child.error) {
    return {
      ...plan,
      status: 'FAIL',
      state: 'LAUNCH_ERROR',
      execution_attempted: true,
      child_process_started: false,
      child_error: child.error.message,
      next_safe_action: 'Resolve the Claude Code launch error and rerun the dry-run before trying --apply again.',
    };
  }
  if (child.signal) {
    return {
      ...plan,
      status: 'FAIL',
      state: 'CHILD_SIGNALLED',
      execution_attempted: true,
      child_process_started: true,
      child_signal: child.signal,
      exit_code: child.status,
      next_safe_action: 'Inspect why Claude Code was interrupted before retrying.',
    };
  }
  if (child.status !== 0) {
    return {
      ...plan,
      status: 'FAIL',
      state: 'CHILD_EXIT_NONZERO',
      execution_attempted: true,
      child_process_started: true,
      exit_code: child.status,
      next_safe_action: 'Review the Claude Code output and resolve the non-zero exit before retrying.',
    };
  }
  return {
    ...plan,
    status: 'PASS',
    state: 'CHILD_EXIT_ZERO',
    execution_attempted: true,
    child_process_started: true,
    exit_code: 0,
    next_safe_action: 'Claude Code exited successfully. No persistent installation or host configuration was performed by the launcher.',
  };
}

export function formatText(result) {
  return [
    'Hakim Claude Code Launcher',
    `MODE=${result.mode}`,
    `STATUS=${result.status}`,
    `STATE=${result.state}`,
    `HAKIM_VERSION=${result.hakim_version || 'UNKNOWN'}`,
    `BINARY_REQUESTED=${result.binary_requested}`,
    `BINARY_RESOLVED=${result.binary_resolved || 'NOT_FOUND'}`,
    `CWD=${result.cwd}`,
    `PLUGIN=${result.plugin_path}`,
    `ARGV_JSON=${JSON.stringify(result.argv || [])}`,
    `EXECUTION_ATTEMPTED=${result.execution_attempted ? 'YES' : 'NO'}`,
    `CHILD_PROCESS_STARTED=${result.child_process_started ? 'YES' : 'NO'}`,
    `LAUNCHER_WRITE_ATTEMPTED=${result.launcher_write_attempted ? 'YES' : 'NO'}`,
    `LAUNCHER_FILESYSTEM_CHANGED=${result.launcher_filesystem_changed ? 'YES' : 'NO'}`,
    'PERSISTENT_INSTALLATION_CLAIMED=NO',
    `NEXT_SAFE_ACTION=${result.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run launch:claude -- [--binary <path-or-name>] [--cwd <directory>] [-- <claude-args...>]',
    '  npm run launch:claude -- --apply [--binary <path-or-name>] [--cwd <directory>] [-- <claude-args...>]',
    '  npm run launch:claude:json -- [--binary <path-or-name>] [--cwd <directory>] [-- <claude-args...>]',
    '',
    'Dry-run is the default. --apply starts Claude Code with the validated',
    'plugins/claude-code directory using shell-free argv. The launcher does not',
    'perform persistent installation, update host configuration, or overwrite files.',
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

  const result = launchClaude(options);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatText(result));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
