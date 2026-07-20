#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildReport as buildDoctorReport,
  readVersion,
  runCheck,
  selectChecks,
} from './hakim_doctor.mjs';
import { buildHostPreflight } from './hakim_host_preflight.mjs';
import { launchCodex } from './hakim_codex_launch.mjs';
import { launchClaude } from './hakim_claude_launch.mjs';
import { installCopilotInstructions } from './hakim_copilot_install.mjs';
import {
  buildReviewReport,
  parseArgs as parseReviewArgs,
} from './hakim_review_pr.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const HOSTS = new Set(['codex', 'claude-code', 'github-copilot']);

function nextValue(args, index, option, allowOptionLike = false) {
  const value = args[index + 1];
  if (!value || (!allowOptionLike && value.startsWith('--'))) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

export function parseArgs(args) {
  const options = {
    host: null,
    cwd: null,
    target: null,
    binary: null,
    repository: null,
    pr: null,
    baseSha: null,
    headSha: null,
    testBin: null,
    testArgs: [],
    hostArgs: [],
    applyLaunch: false,
    full: false,
    json: false,
    output: null,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--apply-launch') options.applyLaunch = true;
    else if (arg === '--full') options.full = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--host') { options.host = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--host=')) options.host = arg.slice(7);
    else if (arg === '--cwd') { options.cwd = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--cwd=')) options.cwd = arg.slice(6);
    else if (arg === '--target') { options.target = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--target=')) options.target = arg.slice(9);
    else if (arg === '--binary') { options.binary = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--binary=')) options.binary = arg.slice(9);
    else if (arg === '--repository') { options.repository = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--repository=')) options.repository = arg.slice(13);
    else if (arg === '--pr') { options.pr = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--pr=')) options.pr = arg.slice(5);
    else if (arg === '--base-sha') { options.baseSha = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--base-sha=')) options.baseSha = arg.slice(11);
    else if (arg === '--head-sha') { options.headSha = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--head-sha=')) options.headSha = arg.slice(11);
    else if (arg === '--test-bin') { options.testBin = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--test-bin=')) options.testBin = arg.slice(11);
    else if (arg === '--test-arg') { options.testArgs.push(nextValue(args, index, arg, true)); index += 1; }
    else if (arg.startsWith('--test-arg=')) options.testArgs.push(arg.slice(11));
    else if (arg === '--host-arg') { options.hostArgs.push(nextValue(args, index, arg, true)); index += 1; }
    else if (arg.startsWith('--host-arg=')) options.hostArgs.push(arg.slice(11));
    else if (arg === '--output') { options.output = nextValue(args, index, arg); index += 1; }
    else if (arg.startsWith('--output=')) options.output = arg.slice(9);
    else throw new Error(`unknown option: ${arg}`);
  }

  if (options.help) return options;
  if (!HOSTS.has(options.host)) {
    throw new Error('--host must be one of: codex, claude-code, github-copilot');
  }
  for (const key of ['repository', 'pr', 'baseSha', 'headSha', 'testBin']) {
    if (!options[key]) {
      const flag = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      throw new Error(`--${flag} is required`);
    }
  }
  if (options.host === 'github-copilot') {
    if (!options.target) throw new Error('--target is required for github-copilot');
    if (options.cwd || options.binary || options.hostArgs.length > 0) {
      throw new Error('--cwd, --binary, and --host-arg are not supported for github-copilot');
    }
  } else {
    if (!options.cwd) throw new Error('--cwd is required for codex and claude-code');
    if (options.target) throw new Error('--target is supported only for github-copilot');
  }
  return options;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function runCommand(command, args, cwd, runner = spawnSync) {
  const result = runner(command, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, NO_COLOR: '1' },
  });
  return {
    command,
    args: [...args],
    exit_code: Number.isInteger(result.status) ? result.status : null,
    signal: result.signal || null,
    error: result.error?.message || null,
    stdout_sha256: sha256(result.stdout || ''),
    stderr_sha256: sha256(result.stderr || ''),
    status: !result.error && !result.signal && result.status === 0 ? 'PASS' : 'FAIL',
  };
}

export function captureGitState(cwd, runner = spawnSync) {
  const execute = (args) => runner('git', args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, NO_COLOR: '1' },
  });
  const commands = {
    head: execute(['rev-parse', 'HEAD']),
    status: execute(['status', '--porcelain=v1', '--untracked-files=all']),
    unstaged: execute(['diff', '--binary', 'HEAD']),
    staged: execute(['diff', '--cached', '--binary', 'HEAD']),
  };
  for (const [name, result] of Object.entries(commands)) {
    if (result.error || result.status !== 0) {
      return {
        status: 'FAIL',
        state: `GIT_${name.toUpperCase()}_FAILED`,
        error: result.error?.message || result.stderr?.trim() || 'git command failed',
      };
    }
  }
  const statusText = commands.status.stdout || '';
  return {
    status: 'PASS',
    head_sha: commands.head.stdout.trim(),
    clean: statusText.trim().length === 0,
    status_entry_count: statusText.trim() ? statusText.trimEnd().split('\n').length : 0,
    status_sha256: sha256(statusText),
    unstaged_diff_sha256: sha256(commands.unstaged.stdout || ''),
    staged_diff_sha256: sha256(commands.staged.stdout || ''),
  };
}

function buildDoctor(options, root, dependencies) {
  if (dependencies.doctor) return dependencies.doctor(options);
  const fast = !options.full;
  const results = selectChecks(fast).map((check) => runCheck(check, dependencies.doctorRunner));
  return buildDoctorReport(results, readVersion(root), fast ? 'FAST' : 'FULL');
}

function toPreflightOptions(options) {
  return {
    host: options.host,
    target: options.target,
    cwd: options.cwd,
    binary: options.binary,
    full: options.full,
    json: false,
    help: false,
    passthrough: [...options.hostArgs],
  };
}

function runLaunch(options, root, dependencies) {
  if (dependencies.launch) return dependencies.launch(options);
  if (!options.applyLaunch) return { ...options.preflight.host_dry_run, approved: false };
  if (options.host === 'codex') {
    return launchCodex({
      apply: true,
      json: false,
      help: false,
      binary: options.binary || 'codex',
      cwd: options.cwd,
      passthrough: [...options.hostArgs],
    }, root, dependencies.launchDependencies || {});
  }
  if (options.host === 'claude-code') {
    return launchClaude({
      apply: true,
      json: false,
      help: false,
      binary: options.binary || 'claude',
      cwd: options.cwd,
      passthrough: [...options.hostArgs],
    }, root, dependencies.launchDependencies || {});
  }
  return installCopilotInstructions({
    target: options.target,
    apply: true,
    json: false,
    help: false,
  }, root);
}

export function buildReviewArgv(options) {
  const argv = [
    '--host', options.host,
    '--repository', options.repository,
    '--pr', String(options.pr),
    '--base-sha', options.baseSha,
    '--head-sha', options.headSha,
  ];
  if (options.host === 'github-copilot') {
    argv.push('--target', options.target);
    return argv;
  }
  argv.push('--cwd', options.cwd);
  if (options.binary) argv.push('--binary', options.binary);
  if (options.hostArgs.length > 0) argv.push('--', ...options.hostArgs);
  return argv;
}

function sameGitState(before, after) {
  return before?.status === 'PASS'
    && after?.status === 'PASS'
    && before.head_sha === after.head_sha
    && before.status_sha256 === after.status_sha256
    && before.unstaged_diff_sha256 === after.unstaged_diff_sha256
    && before.staged_diff_sha256 === after.staged_diff_sha256;
}

export function runGuardedSession(options, root = ROOT, dependencies = {}) {
  const checkout = path.resolve(options.host === 'github-copilot' ? options.target : options.cwd);
  const stages = {};
  const snapshot = dependencies.snapshot || captureGitState;
  const report = {
    schema_version: 1,
    mode: options.applyLaunch ? 'EXPLICIT_APPLY_LAUNCH' : 'DRY_RUN_LAUNCH',
    overall_status: 'FAIL',
    selected_host: options.host,
    checkout,
    repository: options.repository,
    pull_request: Number(options.pr),
    base_sha: options.baseSha,
    head_sha: options.headSha,
    launch_approved: options.applyLaunch,
    shell_used: false,
    hidden_state_written: false,
    github_publication_performed: false,
    automatic_fix_performed: false,
    stopped_after: null,
    stages,
    next_safe_action: null,
  };

  const stop = (stage, action) => {
    report.stopped_after = stage;
    report.next_safe_action = action;
    report.final_state = snapshot(checkout, dependencies.gitRunner);
    report.repository_state_preserved = report.baseline
      ? sameGitState(report.baseline, report.final_state)
      : null;
    return report;
  };

  stages.doctor = buildDoctor(options, root, dependencies);
  if (stages.doctor.repository_health !== 'PASS') {
    return stop('doctor', stages.doctor.next_safe_action);
  }

  stages.preflight = (dependencies.preflight || buildHostPreflight)(
    toPreflightOptions(options),
    root,
    { ...(dependencies.preflightDependencies || {}), doctorReport: stages.doctor },
  );
  if (stages.preflight.overall_status !== 'PASS') {
    return stop('preflight', stages.preflight.next_safe_action);
  }

  stages.launch = runLaunch({ ...options, preflight: stages.preflight }, root, dependencies);
  if (stages.launch.status !== 'PASS') {
    return stop('launch', stages.launch.next_safe_action || 'Resolve the guarded launch failure.');
  }

  report.baseline = snapshot(checkout, dependencies.gitRunner);
  stages.baseline = report.baseline;
  if (report.baseline.status !== 'PASS') {
    return stop('baseline', report.baseline.error || 'Restore a readable Git repository.');
  }

  stages.tests = dependencies.test
    ? dependencies.test(options)
    : runCommand(options.testBin, options.testArgs, checkout, dependencies.testRunner || spawnSync);
  if (stages.tests.status !== 'PASS') {
    return stop('tests', 'Inspect the explicit test command failure; review was not executed.');
  }

  const reviewOptions = parseReviewArgs(buildReviewArgv(options));
  stages.review = dependencies.review
    ? dependencies.review(options, stages.preflight)
    : buildReviewReport(reviewOptions, root, { preflightBuilder: () => stages.preflight });
  if (stages.review.overall_status !== 'PASS') {
    return stop('review', stages.review.next_safe_action || 'Resolve the bounded review failure.');
  }

  report.final_state = snapshot(checkout, dependencies.gitRunner);
  stages.final_state = report.final_state;
  if (report.final_state.status !== 'PASS') {
    return stop('final_state', report.final_state.error || 'Restore readable Git state.');
  }

  report.repository_state_preserved = sameGitState(report.baseline, report.final_state);
  if (!report.repository_state_preserved) {
    return stop(
      'final_state',
      'The repository changed after baseline; inspect and reconcile the unexpected state before continuing.',
    );
  }

  report.overall_status = 'PASS';
  report.next_safe_action = stages.review.next_safe_action;
  return report;
}

export function formatText(report) {
  const statusOf = (name) => {
    const stage = report.stages[name];
    if (!stage) return 'NOT_RUN';
    return stage.overall_status || stage.repository_health || stage.status || 'UNKNOWN';
  };
  return [
    'Hakim Unified Guarded Development Session',
    `MODE=${report.mode}`,
    `OVERALL_STATUS=${report.overall_status}`,
    `HOST=${report.selected_host}`,
    `LAUNCH_APPROVED=${report.launch_approved ? 'YES' : 'NO'}`,
    'SHELL_USED=NO',
    'HIDDEN_STATE_WRITTEN=NO',
    'GITHUB_PUBLICATION_PERFORMED=NO',
    'AUTOMATIC_FIX_PERFORMED=NO',
    `DOCTOR=${statusOf('doctor')}`,
    `PREFLIGHT=${statusOf('preflight')}`,
    `LAUNCH=${statusOf('launch')}`,
    `BASELINE=${statusOf('baseline')}`,
    `TESTS=${statusOf('tests')}`,
    `REVIEW=${statusOf('review')}`,
    `FINAL_STATE=${statusOf('final_state')}`,
    `REPOSITORY_STATE_PRESERVED=${report.repository_state_preserved === true ? 'YES' : report.repository_state_preserved === false ? 'NO' : 'NOT_EVALUATED'}`,
    `STOPPED_AFTER=${report.stopped_after || 'NONE'}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action || 'None.'}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run session:guarded -- --host codex --cwd <repo> [--binary codex] --repository <owner/name> --pr <n> --base-sha <sha> --head-sha <sha> --test-bin npm --test-arg test [--host-arg <arg>] [--apply-launch] [--json] [--output <file>]',
    '  npm run session:guarded -- --host claude-code --cwd <repo> [--binary claude] <same PR/test options>',
    '  npm run session:guarded -- --host github-copilot --target <repo> <same PR/test options> [--apply-launch]',
    '',
    'Launch is dry-run by default. --apply-launch is explicit. Test execution is shell-free.',
    'Use --test-bin for the executable and repeat --test-arg for every argument.',
    'The session stops after the first failed stage and attempts a final Git-state capture.',
  ].join('\n');
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = runGuardedSession(options);
    if (options.output) {
      const output = path.resolve(options.output);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    }
    console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
    process.exit(report.overall_status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
