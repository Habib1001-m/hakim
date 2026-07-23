#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildReport as buildDoctorReport,
  readVersion,
  runCheck,
  selectChecks,
} from './hakim_doctor.mjs';
import { buildPlan as buildInstallPlan } from './hakim_install_plan.mjs';
import { buildCodexLaunchPlan } from './hakim_codex_launch.mjs';
import { buildClaudeLaunchPlan } from './hakim_claude_launch.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SUPPORTED_HOSTS = Object.freeze(['codex', 'claude-code', 'github-copilot']);

export function parseArgs(args) {
  const options = { host: null, target: null, cwd: null, binary: null, full: false, json: false, help: false, passthrough: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') { options.passthrough = args.slice(index + 1); break; }
    if (arg === '--json') options.json = true;
    else if (arg === '--full') options.full = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--apply') throw new Error('--apply is not supported; host preflight is read-only');
    else if (arg === '--host') {
      if (!args[index + 1]) throw new Error('--host requires a value');
      options.host = args[++index];
    } else if (arg.startsWith('--host=')) options.host = arg.slice('--host='.length);
    else if (arg === '--target') {
      if (!args[index + 1]) throw new Error('--target requires a path');
      options.target = args[++index];
    } else if (arg.startsWith('--target=')) options.target = arg.slice('--target='.length);
    else if (arg === '--cwd') {
      if (!args[index + 1]) throw new Error('--cwd requires a path');
      options.cwd = args[++index];
    } else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
    else if (arg === '--binary') {
      if (!args[index + 1]) throw new Error('--binary requires a value');
      options.binary = args[++index];
    } else if (arg.startsWith('--binary=')) options.binary = arg.slice('--binary='.length);
    else throw new Error(`unknown option: ${arg}`);
  }

  if (options.help) return options;
  if (!SUPPORTED_HOSTS.includes(options.host)) throw new Error(`--host must be one of: ${SUPPORTED_HOSTS.join(', ')}`);
  if (options.host === 'github-copilot') {
    if (options.cwd) throw new Error('--cwd is not supported for github-copilot');
    if (options.binary) throw new Error('--binary is not supported for github-copilot');
    if (options.passthrough.length > 0) throw new Error('passthrough arguments are not supported for github-copilot');
  } else if (options.target) {
    throw new Error('--target is supported only for github-copilot baseline comparison');
  }
  return options;
}

function doctorFor(options, root, dependencies) {
  if (dependencies.doctorReport) return dependencies.doctorReport;
  const fast = !options.full;
  const runner = dependencies.doctorRunner;
  const results = selectChecks(fast).map((check) => runCheck(check, runner));
  return buildDoctorReport(results, readVersion(root), fast ? 'FAST' : 'FULL');
}

function hostSurfaceCheck(options, root, environment, installPlan) {
  if (options.host === 'codex') {
    return buildCodexLaunchPlan({ apply: false, json: false, help: false, binary: options.binary || 'codex', cwd: options.cwd, passthrough: options.passthrough }, root, environment);
  }
  if (options.host === 'claude-code') {
    return buildClaudeLaunchPlan({ apply: false, json: false, help: false, binary: options.binary || 'claude', cwd: options.cwd, passthrough: options.passthrough }, root, environment);
  }
  const plan = installPlan.plans[0];
  return {
    status: plan.status,
    state: plan.target_state,
    mode: 'READ_ONLY_NATIVE_PLUGIN_CHECK',
    execution_attempted: false,
    child_process_started: false,
    write_attempted: false,
    filesystem_changed: false,
    install_identity: plan.install_identity,
    distribution_mode: plan.distribution_mode,
    baseline_state: plan.comparison?.target_state || 'NOT_COMPARED',
    next_safe_action: plan.next_safe_action,
  };
}

export function buildHostPreflight(options, root = ROOT, dependencies = {}) {
  const environment = dependencies.env || process.env;
  const doctor = doctorFor(options, root, dependencies);
  const installPlan = buildInstallPlan({ host: options.host, target: options.target, json: false, help: false }, root);
  const surface = hostSurfaceCheck(options, root, environment, installPlan);
  const components = { doctor: doctor.repository_health, install_plan: installPlan.overall_status, host_surface: surface.status };
  const failedComponent = Object.entries(components).find(([, status]) => status !== 'PASS');
  let nextSafeAction = surface.next_safe_action;
  if (components.doctor !== 'PASS') nextSafeAction = doctor.next_safe_action;
  else if (components.install_plan !== 'PASS') nextSafeAction = installPlan.next_safe_action;

  return {
    schema_version: 2,
    mode: 'READ_ONLY',
    mutation_performed: false,
    selected_host: options.host,
    doctor_scope: options.full ? 'FULL' : 'FAST',
    overall_status: failedComponent ? 'FAIL' : 'PASS',
    components,
    next_safe_action: nextSafeAction,
    doctor,
    install_plan: installPlan,
    host_surface: surface,
    host_dry_run: surface,
  };
}

export function formatText(report) {
  return [
    'Hakim Host Preflight',
    'MODE=READ_ONLY',
    'MUTATION_PERFORMED=NO',
    `HOST=${report.selected_host}`,
    `DOCTOR_SCOPE=${report.doctor_scope}`,
    `OVERALL_STATUS=${report.overall_status}`,
    `DOCTOR_STATUS=${report.components.doctor}`,
    `INSTALL_PLAN_STATUS=${report.components.install_plan}`,
    `HOST_SURFACE_STATUS=${report.components.host_surface}`,
    `HOST_SURFACE_STATE=${report.host_surface.state || 'UNKNOWN'}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run preflight:host -- --host codex [--cwd <directory>] [--binary <path-or-name>] [-- <codex-args...>]',
    '  npm run preflight:host -- --host claude-code [--cwd <directory>] [--binary <path-or-name>] [-- <claude-args...>]',
    '  npm run preflight:host -- --host github-copilot [--target <repository>]',
    '  npm run preflight:host:json -- --host <host> [host options]',
    '',
    'Runs the fast read-only doctor, the native installation plan, and a host-surface check.',
    'For Copilot, --target is optional and compares only the repository-instructions fallback.',
    'This command never applies, installs, launches, or changes repository or host state.',
  ].join('\n');
}

function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`Error: ${error.message}`); console.error(usage()); process.exit(2); }
  if (options.help) { console.log(usage()); return; }
  const report = buildHostPreflight(options);
  console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
  process.exit(report.overall_status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
