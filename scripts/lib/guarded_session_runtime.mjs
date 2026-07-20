import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildReport as buildDoctorReport,
  readVersion,
  selectChecks,
} from '../hakim_doctor.mjs';
import { buildHostPreflight } from '../hakim_host_preflight.mjs';
import { buildReviewReport as buildLegacyReviewReport } from '../hakim_review_pr.mjs';
import {
  DEFAULT_PROCESS_LIMITS,
  processEvidence,
  runBoundedProcess,
} from './bounded_process.mjs';

const MODULE_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(MODULE_PATH), '../..');
const LEGACY_GUARDIAN = path.join(ROOT, 'scripts', 'hakim_pr_guardian.mjs');
const FULL_SHA = /^[0-9a-f]{40}$/;

export const DEFAULT_REVIEW_SCOPE_LIMITS = Object.freeze({
  max_files: 200,
  max_changed_lines: 20_000,
  max_binary_files: 20,
});

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (
    relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function resolvePotentialPath(candidate) {
  let existing = path.resolve(candidate);
  const suffix = [];
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) break;
    suffix.unshift(path.basename(existing));
    existing = parent;
  }
  const resolvedExisting = fs.realpathSync(existing);
  return path.join(resolvedExisting, ...suffix);
}

export function validateOutputPlacement(options) {
  const checkout = path.resolve(options.host === 'github-copilot' ? options.target : options.cwd);
  const checkoutReal = fs.realpathSync(checkout);
  if (!options.output) {
    return {
      status: 'NOT_REQUESTED',
      policy: 'OUTSIDE_CHECKOUT_ONLY',
      checkout_path: checkoutReal,
      output_path: null,
    };
  }

  const outputLexical = path.resolve(options.output);
  const outputResolved = resolvePotentialPath(outputLexical);
  if (isWithin(path.resolve(checkout), outputLexical) || isWithin(checkoutReal, outputResolved)) {
    throw new Error('--output must be outside the reviewed checkout so report writing cannot invalidate final-state proof');
  }
  return {
    status: 'PASS',
    policy: 'OUTSIDE_CHECKOUT_ONLY',
    checkout_path: checkoutReal,
    output_path: outputResolved,
  };
}

function commandFailure(label, result) {
  const detail = result.error || result.stderr.trim() || result.stdout.trim() || result.status;
  return new Error(`${label} failed: ${detail}`);
}

export function captureGitStateBounded(cwd, dependencies = {}) {
  const timeoutMs = dependencies.timeout_ms || DEFAULT_PROCESS_LIMITS.git_timeout_ms;
  const runner = dependencies.runner;
  const commands = [
    ['head', ['rev-parse', 'HEAD']],
    ['status', ['status', '--porcelain=v1', '--untracked-files=all']],
    ['unstaged', ['diff', '--binary', 'HEAD']],
    ['staged', ['diff', '--cached', '--binary', 'HEAD']],
  ];
  const results = {};
  for (const [name, args] of commands) {
    results[name] = runBoundedProcess('git', args, {
      cwd,
      timeout_ms: timeoutMs,
      max_buffer_bytes: dependencies.max_buffer_bytes,
      runner,
    });
    if (results[name].status !== 'PASS') {
      return {
        status: results[name].status,
        state: `GIT_${name.toUpperCase()}_${results[name].status}`,
        error: results[name].error || results[name].stderr.trim() || 'git command failed',
        duration_ms: Object.values(results).reduce((sum, item) => sum + item.duration_ms, 0),
        processes: Object.fromEntries(
          Object.entries(results).map(([key, value]) => [key, processEvidence(value)]),
        ),
      };
    }
  }

  const statusText = results.status.stdout;
  return {
    status: 'PASS',
    head_sha: results.head.stdout.trim(),
    clean: statusText.trim().length === 0,
    status_entry_count: statusText.trim() ? statusText.trimEnd().split('\n').length : 0,
    status_sha256: sha256(statusText),
    unstaged_diff_sha256: sha256(results.unstaged.stdout),
    staged_diff_sha256: sha256(results.staged.stdout),
    duration_ms: Object.values(results).reduce((sum, item) => sum + item.duration_ms, 0),
    processes: Object.fromEntries(
      Object.entries(results).map(([key, value]) => [key, processEvidence(value)]),
    ),
  };
}

function parseCheckJson(text) {
  const value = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!value) throw new Error('check produced no JSON output');
  return JSON.parse(value);
}

export function runDoctorBounded(options, root = ROOT, dependencies = {}) {
  const fast = !options.full;
  const timeoutMs = dependencies.timeout_ms || DEFAULT_PROCESS_LIMITS.check_timeout_ms;
  const results = selectChecks(fast).map((check) => {
    const commandArgs = [check.script, ...(check.args || [])];
    const processResult = runBoundedProcess(globalThis.process.execPath, commandArgs, {
      cwd: root,
      timeout_ms: timeoutMs,
      max_buffer_bytes: dependencies.max_buffer_bytes,
      runner: dependencies.runner,
    });
    let data = null;
    let parseError = null;
    try {
      data = parseCheckJson(processResult.stdout);
    } catch (error) {
      parseError = error.message;
    }
    const payloadErrors = Array.isArray(data?.errors) ? data.errors : [];
    const ok = processResult.status === 'PASS' && data !== null && data?.ok !== false;
    const diagnostics = [];
    if (processResult.error) diagnostics.push(processResult.error);
    if (parseError) diagnostics.push(parseError);
    if (processResult.stderr.trim()) diagnostics.push(processResult.stderr.trim());
    diagnostics.push(...payloadErrors);
    return {
      id: check.id,
      tier: check.tier,
      status: ok ? 'PASS' : processResult.status === 'PASS' ? 'FAIL' : processResult.status,
      exit_code: processResult.exit_code,
      signal: processResult.signal,
      timed_out: processResult.timed_out,
      duration_ms: processResult.duration_ms,
      timeout_ms: processResult.timeout_ms,
      command: `node ${commandArgs.join(' ')}`,
      diagnostics,
      data,
    };
  });
  const report = buildDoctorReport(results, readVersion(root), fast ? 'FAST' : 'FULL');
  report.process_policy = {
    shell_used: false,
    timeout_ms: timeoutMs,
    duration_recorded: true,
    exit_and_signal_recorded: true,
  };
  return report;
}

function normalizeOrigin(url) {
  const value = url.trim();
  for (const pattern of [
    /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i,
    /^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i,
    /^ssh:\/\/git@github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i,
  ]) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function runGitScope(root, args, dependencies, label, allowFailure = false) {
  const result = runBoundedProcess('git', ['-C', root, ...args], {
    timeout_ms: dependencies.timeout_ms || DEFAULT_PROCESS_LIMITS.git_timeout_ms,
    max_buffer_bytes: dependencies.max_buffer_bytes,
    runner: dependencies.runner,
  });
  if (!allowFailure && result.status !== 'PASS') throw commandFailure(label, result);
  return result;
}

export function inspectReviewScope(options, dependencies = {}) {
  const requested = path.resolve(options.cwd);
  const rootProbe = runGitScope(requested, ['rev-parse', '--show-toplevel'], dependencies, 'repository probe');
  const root = path.resolve(rootProbe.stdout.trim());
  const originResult = runGitScope(root, ['remote', 'get-url', 'origin'], dependencies, 'origin lookup');
  const origin = normalizeOrigin(originResult.stdout);
  if (!origin || origin.toLowerCase() !== options.repository.toLowerCase()) {
    throw new Error(`repository scope mismatch: origin is ${origin || 'unsupported'}, requested ${options.repository}`);
  }
  for (const [label, sha] of [['base', options.baseSha], ['head', options.headSha]]) {
    if (!FULL_SHA.test(sha || '')) throw new Error(`${label} SHA must be a full lowercase commit SHA`);
    const probe = runGitScope(root, ['cat-file', '-e', `${sha}^{commit}`], dependencies, `${label} commit`, true);
    if (probe.status !== 'PASS') throw commandFailure(`${label} commit is unavailable`, probe);
  }
  const mergeBase = runGitScope(root, ['merge-base', options.baseSha, options.headSha], dependencies, 'merge base').stdout.trim();
  if (!FULL_SHA.test(mergeBase)) throw new Error('cannot resolve one explicit merge base');
  const numstat = runGitScope(
    root,
    ['diff', '--numstat', '--no-renames', `${options.baseSha}...${options.headSha}`, '--'],
    dependencies,
    'review scope measurement',
  );

  let changedLines = 0;
  let binaryFiles = 0;
  const rows = numstat.stdout.trim() ? numstat.stdout.trimEnd().split('\n') : [];
  for (const row of rows) {
    const [added, deleted] = row.split('\t');
    if (added === '-' || deleted === '-') binaryFiles += 1;
    else changedLines += Number(added || 0) + Number(deleted || 0);
  }
  const limits = { ...DEFAULT_REVIEW_SCOPE_LIMITS, ...(dependencies.limits || {}) };
  const reasons = [];
  if (rows.length > limits.max_files) reasons.push(`changed files ${rows.length} exceed ${limits.max_files}`);
  if (changedLines > limits.max_changed_lines) reasons.push(`changed lines ${changedLines} exceed ${limits.max_changed_lines}`);
  if (binaryFiles > limits.max_binary_files) reasons.push(`binary files ${binaryFiles} exceed ${limits.max_binary_files}`);
  return {
    status: reasons.length === 0 ? 'PASS' : 'SCOPE_TOO_LARGE',
    accepted: reasons.length === 0,
    root,
    merge_base_sha: mergeBase,
    changed_files: rows.length,
    changed_lines: changedLines,
    binary_files: binaryFiles,
    limits,
    reasons,
    duration_ms: rootProbe.duration_ms + originResult.duration_ms + numstat.duration_ms,
  };
}

function blockedGuardian(options, scope, outcome, nextSafeAction, processResult = null) {
  return {
    schema_version: 1,
    overall_status: 'BLOCKED',
    mode: 'READ_ONLY',
    mutation_performed: false,
    blocking: false,
    scope: {
      repository: options.repository,
      pull_request: options.pr,
      base_sha: options.baseSha,
      head_sha: options.headSha,
      merge_base_sha: scope.merge_base_sha,
      diff_expression: `${options.baseSha}...${options.headSha}`,
      fallback_used: false,
    },
    scope_guard: scope,
    process: processResult ? processEvidence(processResult) : null,
    review: {
      executed: false,
      files_inspected: 0,
      added_lines_inspected: 0,
      findings_count: 0,
      findings: [],
      estimated_removable_lines: 0,
      outcome,
      next_safe_action: nextSafeAction,
    },
    limitations: [
      'No partial deterministic review is reported when the registered scope cannot be processed safely.',
      'No GitHub check, comment, code, branch, setting, or merge state is mutated.',
    ],
  };
}

export function buildGuardianReportBounded(options, dependencies = {}) {
  const scope = inspectReviewScope(options, dependencies.scope || dependencies);
  if (!scope.accepted) {
    return blockedGuardian(
      options,
      scope,
      'SCOPE_TOO_LARGE',
      'Split the pull request into a smaller explicit commit range or use a separately approved large-scope review process.',
    );
  }

  const args = [
    LEGACY_GUARDIAN,
    '--json',
    '--repository', options.repository,
    '--pr', String(options.pr),
    '--base-sha', options.baseSha,
    '--head-sha', options.headSha,
    '--cwd', scope.root,
  ];
  const processResult = runBoundedProcess(globalThis.process.execPath, args, {
    cwd: ROOT,
    timeout_ms: dependencies.review_timeout_ms || DEFAULT_PROCESS_LIMITS.review_timeout_ms,
    max_buffer_bytes: dependencies.max_buffer_bytes,
    runner: dependencies.review_runner,
  });
  if (processResult.status === 'TIMED_OUT') {
    return blockedGuardian(
      options,
      scope,
      'REVIEW_TIMED_OUT',
      'Reduce the explicit review scope or inspect the deterministic Guardian process before retrying.',
      processResult,
    );
  }
  if (processResult.status === 'OUTPUT_LIMIT_EXCEEDED') {
    return blockedGuardian(
      options,
      scope,
      'REVIEW_OUTPUT_LIMIT_EXCEEDED',
      'Reduce the explicit review scope; no partial result was accepted.',
      processResult,
    );
  }
  if (processResult.status !== 'PASS') throw commandFailure('bounded PR Guardian', processResult);

  const report = parseCheckJson(processResult.stdout);
  report.overall_status = 'PASS';
  report.scope_guard = scope;
  report.process = processEvidence(processResult);
  report.review.executed = true;
  return report;
}

export function buildReviewReportBounded(options, root = ROOT, dependencies = {}) {
  const doctor = runDoctorBounded(
    { full: options.preflight.full },
    root,
    dependencies.doctor || {},
  );
  const preflight = buildHostPreflight(options.preflight, root, {
    ...(dependencies.preflight || {}),
    doctorReport: doctor,
  });
  const report = buildLegacyReviewReport(options, root, {
    preflightBuilder: () => preflight,
    guardianBuilder: (guardianOptions) => buildGuardianReportBounded(
      guardianOptions,
      dependencies.guardian || {},
    ),
  });
  if (report.guardian?.overall_status === 'BLOCKED') {
    return {
      ...report,
      overall_status: 'BLOCKED',
      review_executed: false,
      components: { preflight: 'PASS', guardian: 'BLOCKED' },
      next_safe_action: report.guardian.review.next_safe_action,
    };
  }
  return report;
}

export function runTestBounded(options, dependencies = {}) {
  const processResult = runBoundedProcess(options.testBin, options.testArgs, {
    cwd: path.resolve(options.host === 'github-copilot' ? options.target : options.cwd),
    timeout_ms: dependencies.timeout_ms || DEFAULT_PROCESS_LIMITS.test_timeout_ms,
    max_buffer_bytes: dependencies.max_buffer_bytes,
    runner: dependencies.runner,
  });
  return {
    command: processResult.command,
    args: processResult.args,
    ...processEvidence(processResult),
    stdout_sha256: sha256(processResult.stdout),
    stderr_sha256: sha256(processResult.stderr),
  };
}
