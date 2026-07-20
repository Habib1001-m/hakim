#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildHostPreflight,
  formatText as formatPreflightText,
  parseArgs as parsePreflightArgs,
} from './hakim_host_preflight.mjs';
import {
  buildGuardianReport,
  formatText as formatGuardianText,
  parseArgs as parseGuardianArgs,
} from './hakim_pr_guardian.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

function requireValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${option} requires a value`);
  return value;
}

export function parseArgs(args) {
  const raw = {
    host: null,
    repository: null,
    pr: null,
    baseSha: null,
    headSha: null,
    cwd: null,
    target: null,
    binary: null,
    full: false,
    json: false,
    help: false,
    passthrough: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') {
      raw.passthrough = args.slice(index + 1);
      break;
    }
    if (arg === '--json') raw.json = true;
    else if (arg === '--full') raw.full = true;
    else if (arg === '--help' || arg === '-h') raw.help = true;
    else if (arg === '--apply') throw new Error('--apply is not supported; minimal PR review is read-only');
    else if (arg === '--host') {
      raw.host = requireValue(args, index, '--host');
      index += 1;
    } else if (arg.startsWith('--host=')) raw.host = arg.slice('--host='.length);
    else if (arg === '--repository') {
      raw.repository = requireValue(args, index, '--repository');
      index += 1;
    } else if (arg.startsWith('--repository=')) raw.repository = arg.slice('--repository='.length);
    else if (arg === '--pr') {
      raw.pr = requireValue(args, index, '--pr');
      index += 1;
    } else if (arg.startsWith('--pr=')) raw.pr = arg.slice('--pr='.length);
    else if (arg === '--base-sha') {
      raw.baseSha = requireValue(args, index, '--base-sha');
      index += 1;
    } else if (arg.startsWith('--base-sha=')) raw.baseSha = arg.slice('--base-sha='.length);
    else if (arg === '--head-sha') {
      raw.headSha = requireValue(args, index, '--head-sha');
      index += 1;
    } else if (arg.startsWith('--head-sha=')) raw.headSha = arg.slice('--head-sha='.length);
    else if (arg === '--cwd') {
      raw.cwd = requireValue(args, index, '--cwd');
      index += 1;
    } else if (arg.startsWith('--cwd=')) raw.cwd = arg.slice('--cwd='.length);
    else if (arg === '--target') {
      raw.target = requireValue(args, index, '--target');
      index += 1;
    } else if (arg.startsWith('--target=')) raw.target = arg.slice('--target='.length);
    else if (arg === '--binary') {
      raw.binary = requireValue(args, index, '--binary');
      index += 1;
    } else if (arg.startsWith('--binary=')) raw.binary = arg.slice('--binary='.length);
    else throw new Error(`unknown option: ${arg}`);
  }

  if (raw.help) return { ...raw, preflight: null, guardian: null };
  if (raw.host !== 'github-copilot' && !raw.cwd) {
    throw new Error('--cwd is required for codex and claude-code review');
  }

  const preflightArgv = ['--host', raw.host || ''];
  if (raw.target) preflightArgv.push('--target', raw.target);
  if (raw.cwd) preflightArgv.push('--cwd', raw.cwd);
  if (raw.binary) preflightArgv.push('--binary', raw.binary);
  if (raw.full) preflightArgv.push('--full');
  if (raw.passthrough.length > 0) preflightArgv.push('--', ...raw.passthrough);
  const preflight = parsePreflightArgs(preflightArgv);

  const reviewCwd = preflight.host === 'github-copilot' ? preflight.target : preflight.cwd;
  const guardian = parseGuardianArgs([
    '--repository', raw.repository || '',
    '--pr', raw.pr || '',
    '--base-sha', raw.baseSha || '',
    '--head-sha', raw.headSha || '',
    '--cwd', reviewCwd || '',
  ]);

  return { ...raw, preflight, guardian };
}

export function buildReviewReport(options, root = ROOT, dependencies = {}) {
  const preflightBuilder = dependencies.preflightBuilder || buildHostPreflight;
  const guardianBuilder = dependencies.guardianBuilder || buildGuardianReport;
  const preflight = preflightBuilder(
    options.preflight,
    root,
    dependencies.preflightDependencies || {},
  );

  if (preflight.mutation_performed !== false) {
    throw new Error('host preflight did not preserve the read-only contract');
  }

  if (preflight.overall_status !== 'PASS') {
    return {
      schema_version: 1,
      mode: 'READ_ONLY',
      mutation_performed: false,
      merge_blocking: false,
      selected_host: options.preflight.host,
      scope: {
        repository: options.guardian.repository,
        pull_request: options.guardian.pr,
        base_sha: options.guardian.baseSha,
        head_sha: options.guardian.headSha,
        checkout_path: options.guardian.cwd,
        fallback_used: false,
      },
      overall_status: 'BLOCKED',
      review_executed: false,
      components: { preflight: preflight.overall_status, guardian: 'SKIPPED' },
      next_safe_action: preflight.next_safe_action,
      preflight,
      guardian: null,
      limitations: [
        'The PR review is not attempted when host preflight fails.',
        'No host launch, apply action, ref fetch, GitHub publication, or automatic fix occurs.',
      ],
    };
  }

  const guardian = guardianBuilder(options.guardian);
  if (guardian.mutation_performed !== false || guardian.blocking !== false) {
    throw new Error('PR Guardian did not preserve its advisory read-only contract');
  }

  return {
    schema_version: 1,
    mode: 'READ_ONLY',
    mutation_performed: false,
    merge_blocking: false,
    selected_host: options.preflight.host,
    scope: {
      repository: guardian.scope.repository,
      pull_request: guardian.scope.pull_request,
      base_sha: guardian.scope.base_sha,
      head_sha: guardian.scope.head_sha,
      checkout_path: options.guardian.cwd,
      fallback_used: guardian.scope.fallback_used,
    },
    overall_status: 'PASS',
    review_executed: true,
    components: { preflight: 'PASS', guardian: 'PASS' },
    next_safe_action: guardian.review.outcome === 'LEAN_ALREADY_SHIP'
      ? 'Lean already. Ship.'
      : 'Review the evidence-backed advisory findings; no automatic action was taken.',
    preflight,
    guardian,
    limitations: [
      'This is a thin composition of existing host preflight and deterministic PR Guardian components.',
      'It does not launch a host, fetch refs, publish GitHub output, apply fixes, or block merge.',
      'Guardian findings remain conservative advisory evidence, not a correctness or security verdict.',
    ],
  };
}

export function formatText(report) {
  const lines = [
    'Hakim Minimal PR Review',
    'MODE=READ_ONLY',
    'MUTATION_PERFORMED=NO',
    'MERGE_BLOCKING=NO',
    `HOST=${report.selected_host}`,
    `OVERALL_STATUS=${report.overall_status}`,
    `PREFLIGHT_STATUS=${report.components.preflight}`,
    `GUARDIAN_STATUS=${report.components.guardian}`,
    `REVIEW_EXECUTED=${report.review_executed ? 'YES' : 'NO'}`,
    `REPOSITORY=${report.scope.repository}`,
    `PR=${report.scope.pull_request}`,
    `BASE_SHA=${report.scope.base_sha}`,
    `HEAD_SHA=${report.scope.head_sha}`,
    `FALLBACK_USED=${report.scope.fallback_used ? 'YES' : 'NO'}`,
    '',
    formatPreflightText(report.preflight),
  ];

  if (report.guardian) lines.push('', formatGuardianText(report.guardian));
  else lines.push('', `NEXT_SAFE_ACTION=${report.next_safe_action}`);
  return lines.join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run review:pr -- --host codex --cwd <repository> [--binary <path-or-name>] --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [-- <codex-args...>]',
    '  npm run review:pr -- --host claude-code --cwd <repository> [--binary <path-or-name>] --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [-- <claude-args...>]',
    '  npm run review:pr -- --host github-copilot --target <repository> --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex>',
    '  npm run review:pr:json -- <same options>',
    '',
    'Runs host preflight first. The explicit PR review is skipped when preflight fails.',
    'The command is read-only and never launches, applies, fetches, publishes, fixes, or blocks merge.',
  ].join('\n');
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = buildReviewReport(options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
    process.exit(report.overall_status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
