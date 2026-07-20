#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runGuardedSession } from './hakim_guarded_session_command.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function parseArgs(args) {
  let output = null;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--output') {
      if (!args[index + 1]) throw new Error('--output requires a path');
      output = args[index + 1];
      index += 1;
    } else if (arg.startsWith('--output=')) output = arg.slice(9);
    else throw new Error(`unknown option: ${arg}`);
  }
  return { output };
}

function buildFixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-w2-session-'));
  git(directory, ['init']);
  git(directory, ['config', 'user.name', 'Hakim Evidence']);
  git(directory, ['config', 'user.email', 'hakim-evidence@example.invalid']);
  git(directory, ['remote', 'add', 'origin', 'https://github.com/example/guarded-session-fixture.git']);
  fs.writeFileSync(path.join(directory, 'README.md'), '# Guarded session fixture\n');
  git(directory, ['add', 'README.md']);
  git(directory, ['commit', '-m', 'baseline']);
  const base = git(directory, ['rev-parse', 'HEAD']);
  fs.appendFileSync(path.join(directory, 'README.md'), '\nOne bounded change.\n');
  git(directory, ['add', 'README.md']);
  git(directory, ['commit', '-m', 'change']);
  const head = git(directory, ['rev-parse', 'HEAD']);
  return { directory, base, head };
}

function stateSummary(state) {
  return {
    status: state?.status || 'NOT_RUN',
    head_sha: state?.head_sha || null,
    status_entry_count: state?.status_entry_count ?? null,
    status_sha256: state?.status_sha256 || null,
    unstaged_diff_sha256: state?.unstaged_diff_sha256 || null,
    staged_diff_sha256: state?.staged_diff_sha256 || null,
    duration_ms: state?.duration_ms ?? null,
  };
}

function summarize(report) {
  return {
    schema_version: 3,
    task: 'W2-T01',
    evidence_reconciled_by: 'W2.5-T10',
    status: report.overall_status,
    mode: report.mode,
    host: report.selected_host,
    launch_approved: report.launch_approved,
    launch_mutation: report.launch_mutation,
    shell_used: report.shell_used,
    hidden_state_written: report.hidden_state_written,
    hidden_state_observation: report.hidden_state_observation,
    github_publication_performed: report.github_publication_performed,
    automatic_fix_performed: report.automatic_fix_performed,
    stopped_after: report.stopped_after,
    output_policy: report.output_policy,
    process_policy: report.process_policy,
    stages: {
      doctor: report.stages.doctor?.repository_health || 'NOT_RUN',
      preflight: report.stages.preflight?.overall_status || 'NOT_RUN',
      launch: report.stages.launch?.status || 'NOT_RUN',
      launch_state: report.stages.launch?.state || null,
      pre_launch_state: report.pre_launch_state?.status || 'NOT_RUN',
      post_launch_state: report.post_launch_state?.status || 'NOT_RUN',
      tests: report.stages.tests?.status || 'NOT_RUN',
      tests_exit_code: report.stages.tests?.exit_code ?? null,
      tests_signal: report.stages.tests?.signal ?? null,
      tests_timed_out: report.stages.tests?.timed_out ?? null,
      tests_duration_ms: report.stages.tests?.duration_ms ?? null,
      review: report.stages.review?.overall_status || 'NOT_RUN',
      review_outcome: report.stages.review?.guardian?.review?.outcome || null,
      review_findings: report.stages.review?.guardian?.review?.findings_count ?? null,
      final_state: report.stages.final_state?.status || 'NOT_RUN',
      final_state_duration_ms: report.stages.final_state?.duration_ms ?? null,
    },
    scope: {
      repository: report.repository,
      pull_request: report.pull_request,
      base_sha: report.base_sha,
      head_sha: report.head_sha,
    },
    pre_launch_state: stateSummary(report.pre_launch_state),
    post_launch_state: stateSummary(report.post_launch_state),
    final_state: stateSummary(report.final_state),
    post_launch_repository_state_preserved: report.post_launch_repository_state_preserved,
    whole_session_repository_state_preserved: report.whole_session_repository_state_preserved,
    claim_boundaries: {
      hidden_external_host_state: 'NOT_OBSERVED',
      live_copilot_agent_behavior_proven: false,
      independent_benchmark_established: false,
      public_release_readiness: 'HOLD',
    },
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const fixture = buildFixture();
  try {
    const report = runGuardedSession({
      host: 'github-copilot',
      cwd: null,
      target: fixture.directory,
      binary: null,
      repository: 'example/guarded-session-fixture',
      pr: '1',
      baseSha: fixture.base,
      headSha: fixture.head,
      testBin: process.execPath,
      testArgs: ['-e', 'process.exit(0)'],
      hostArgs: [],
      applyLaunch: true,
      full: false,
      json: false,
      output: null,
      help: false,
    }, ROOT);
    const evidence = summarize(report);
    const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
    if (options.output) {
      const output = path.resolve(options.output);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, serialized, { flag: 'wx' });
    }
    process.stdout.write(serialized);
    process.exit(evidence.status === 'PASS' ? 0 : 1);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
}

main();
