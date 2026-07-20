#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHostPreflight } from './hakim_host_preflight.mjs';
import {
  buildReviewArgv,
  formatText as formatLegacyText,
  parseArgs,
  runGuardedSession as runLegacyGuardedSession,
} from './hakim_guarded_session.mjs';
import {
  buildReviewReport as buildLegacyReviewReport,
  parseArgs as parseReviewArgs,
} from './hakim_review_pr.mjs';
import {
  buildGuardianReportBounded,
  captureGitStateBounded,
  runDoctorBounded,
  runTestBounded,
  validateOutputPlacement,
} from './lib/guarded_session_integrity.mjs';
import { DEFAULT_PROCESS_LIMITS } from './lib/bounded_process.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export { buildReviewArgv, parseArgs };

function sameGitState(before, after) {
  return before?.status === 'PASS'
    && after?.status === 'PASS'
    && before.head_sha === after.head_sha
    && before.status_sha256 === after.status_sha256
    && before.unstaged_diff_sha256 === after.unstaged_diff_sha256
    && before.staged_diff_sha256 === after.staged_diff_sha256;
}

function boundedReview(options, preflight, root, dependencies) {
  const reviewOptions = parseReviewArgs(buildReviewArgv(options));
  const report = buildLegacyReviewReport(reviewOptions, root, {
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

function preLaunchFailure(options, checkout, outputPolicy, preLaunchState) {
  return {
    schema_version: 2,
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
    hidden_state_written: null,
    hidden_state_observation: 'NOT_OBSERVED',
    github_publication_performed: false,
    automatic_fix_performed: false,
    stopped_after: 'pre_launch_state',
    stages: { pre_launch_state: preLaunchState },
    pre_launch_state: preLaunchState,
    post_launch_state: null,
    final_state: null,
    launch_mutation: {
      status: 'NOT_EVALUATED',
      authorized: options.applyLaunch,
      classification: 'NOT_EVALUATED',
      expected_scope: options.host === 'github-copilot' && options.applyLaunch
        ? '.github/copilot-instructions.md create-only'
        : 'NO_REPOSITORY_MUTATION_EXPECTED',
    },
    post_launch_repository_state_preserved: null,
    whole_session_repository_state_preserved: null,
    repository_state_preserved: null,
    output_policy: outputPolicy,
    next_safe_action: preLaunchState.error || 'Restore readable pre-launch Git state before retrying.',
  };
}

export function runGuardedSession(options, root = ROOT, dependencies = {}) {
  const outputPolicy = validateOutputPlacement(options);
  const checkout = path.resolve(options.host === 'github-copilot' ? options.target : options.cwd);
  const snapshot = dependencies.snapshot || ((cwd) => captureGitStateBounded(
    cwd,
    dependencies.git || {},
  ));
  const preLaunchState = snapshot(checkout);
  if (preLaunchState.status !== 'PASS') {
    return preLaunchFailure(options, checkout, outputPolicy, preLaunchState);
  }

  let doctorReport = null;
  const doctor = () => {
    if (!doctorReport) {
      doctorReport = runDoctorBounded(options, root, dependencies.doctor || {});
    }
    return doctorReport;
  };

  const report = runLegacyGuardedSession(options, root, {
    ...dependencies,
    doctor: dependencies.doctor_override || doctor,
    preflight: dependencies.preflight || ((preflightOptions, preflightRoot) => buildHostPreflight(
      preflightOptions,
      preflightRoot,
      { doctorReport: doctor() },
    )),
    snapshot,
    test: dependencies.test || ((sessionOptions) => runTestBounded(
      sessionOptions,
      dependencies.test_process || {},
    )),
    review: dependencies.review || ((sessionOptions, preflight) => boundedReview(
      sessionOptions,
      preflight,
      root,
      dependencies.review_process || {},
    )),
  });

  report.schema_version = 2;
  report.output_policy = outputPolicy;
  report.process_policy = {
    shell_used: false,
    bounded_non_interactive_processes: true,
    git_timeout_ms: dependencies.git?.timeout_ms || DEFAULT_PROCESS_LIMITS.git_timeout_ms,
    doctor_timeout_ms: dependencies.doctor?.timeout_ms || DEFAULT_PROCESS_LIMITS.check_timeout_ms,
    review_timeout_ms: dependencies.review_process?.guardian?.review_timeout_ms
      || DEFAULT_PROCESS_LIMITS.review_timeout_ms,
    test_timeout_ms: dependencies.test_process?.timeout_ms || DEFAULT_PROCESS_LIMITS.test_timeout_ms,
    duration_recorded: true,
    exit_and_signal_recorded: true,
  };

  report.pre_launch_state = preLaunchState;
  report.stages.pre_launch_state = preLaunchState;
  report.post_launch_state = report.baseline || null;
  if (report.post_launch_state) report.stages.post_launch_state = report.post_launch_state;

  const launchMutationEvaluated = preLaunchState.status === 'PASS'
    && report.post_launch_state?.status === 'PASS';
  const launchMutationObserved = launchMutationEvaluated
    ? !sameGitState(preLaunchState, report.post_launch_state)
    : null;
  const launchMutationAuthorized = options.applyLaunch === true;
  const launchMutationClassification = launchMutationObserved === null
    ? 'NOT_EVALUATED'
    : launchMutationObserved
      ? launchMutationAuthorized ? 'APPROVED' : 'UNEXPECTED'
      : 'NONE_OBSERVED';

  report.launch_mutation = {
    status: launchMutationObserved === null ? 'NOT_EVALUATED' : launchMutationObserved ? 'OBSERVED' : 'NONE_OBSERVED',
    authorized: launchMutationAuthorized,
    classification: launchMutationClassification,
    expected_scope: options.host === 'github-copilot' && options.applyLaunch
      ? '.github/copilot-instructions.md create-only'
      : 'NO_REPOSITORY_MUTATION_EXPECTED',
  };
  report.hidden_state_written = null;
  report.hidden_state_observation = 'NOT_OBSERVED';
  report.post_launch_repository_state_preserved = report.repository_state_preserved;
  report.whole_session_repository_state_preserved = report.final_state?.status === 'PASS'
    ? sameGitState(preLaunchState, report.final_state)
    : null;

  if (launchMutationClassification === 'UNEXPECTED') {
    report.overall_status = 'FAIL';
    report.stopped_after = report.stopped_after || 'launch_mutation_evaluation';
    report.next_safe_action = 'A repository mutation occurred without explicit --apply-launch approval; inspect and restore it before retrying.';
  }

  if (report.stages.tests?.status === 'TIMED_OUT') {
    report.next_safe_action = 'The explicit test command timed out; inspect or split the test scope before retrying.';
  } else if (report.stages.review?.guardian?.review?.outcome === 'SCOPE_TOO_LARGE') {
    report.next_safe_action = report.stages.review.guardian.review.next_safe_action;
  }
  return report;
}

function triState(value) {
  return value === true ? 'YES' : value === false ? 'NO' : 'NOT_EVALUATED';
}

export function formatText(report) {
  const legacy = formatLegacyText(report)
    .replace('HIDDEN_STATE_WRITTEN=NO', 'HIDDEN_STATE_WRITTEN=NOT_OBSERVED')
    .replace('REPOSITORY_STATE_PRESERVED=', 'POST_LAUNCH_REPOSITORY_STATE_PRESERVED=');
  return [
    legacy,
    `PRE_LAUNCH_STATE=${report.pre_launch_state?.status || 'NOT_RUN'}`,
    `POST_LAUNCH_STATE=${report.post_launch_state?.status || 'NOT_RUN'}`,
    `LAUNCH_MUTATION_STATUS=${report.launch_mutation?.status || 'NOT_EVALUATED'}`,
    `LAUNCH_MUTATION_AUTHORIZED=${report.launch_mutation?.authorized ? 'YES' : 'NO'}`,
    `LAUNCH_MUTATION_CLASSIFICATION=${report.launch_mutation?.classification || 'NOT_EVALUATED'}`,
    `WHOLE_SESSION_REPOSITORY_STATE_PRESERVED=${triState(report.whole_session_repository_state_preserved)}`,
    `HIDDEN_STATE_OBSERVATION=${report.hidden_state_observation || 'NOT_OBSERVED'}`,
    `OUTPUT_POLICY=${report.output_policy.policy}`,
    `OUTPUT_PATH_STATUS=${report.output_policy.status}`,
    'NON_INTERACTIVE_PROCESSES_BOUNDED=YES',
    `TEST_TIMEOUT_MS=${report.process_policy?.test_timeout_ms || 'NOT_EVALUATED'}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run session:guarded -- --host codex --cwd <repo> [--binary codex] --repository <owner/name> --pr <n> --base-sha <sha> --head-sha <sha> --test-bin npm --test-arg test [--host-arg <arg>] [--apply-launch] [--json] [--output <file>]',
    '  npm run session:guarded -- --host claude-code --cwd <repo> [--binary claude] <same PR/test options>',
    '  npm run session:guarded -- --host github-copilot --target <repo> <same PR/test options> [--apply-launch]',
    '',
    'Output must be outside the reviewed checkout. Pre-launch, post-launch, and final Git states are distinct.',
    'Approved launch mutation is reported explicitly. External hidden state is NOT_OBSERVED unless measured.',
    'Non-interactive subprocesses are shell-free and time-bounded. Oversized review scope is refused explicitly.',
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
      const output = report.output_policy.output_path;
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
