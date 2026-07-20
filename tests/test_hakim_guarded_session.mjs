#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildReviewArgv,
  parseArgs,
  runGuardedSession,
} from '../scripts/hakim_guarded_session.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-session-'));
  git(root, ['init']);
  git(root, ['config', 'user.name', 'Hakim Test']);
  git(root, ['config', 'user.email', 'hakim-test@example.invalid']);
  git(root, ['remote', 'add', 'origin', 'https://github.com/example/session-fixture.git']);
  fs.writeFileSync(path.join(root, 'README.md'), '# Fixture\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-m', 'baseline']);
  const base = git(root, ['rev-parse', 'HEAD']);
  fs.appendFileSync(path.join(root, 'README.md'), '\nSmall safe change.\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-m', 'change']);
  const head = git(root, ['rev-parse', 'HEAD']);
  return { root, base, head };
}

function passDoctor() {
  return {
    schema_version: 1,
    repository_health: 'PASS',
    next_safe_action: 'Continue.',
    mutation_performed: false,
  };
}

function syntheticOptions(overrides = {}) {
  return {
    host: 'codex',
    cwd: '/tmp/repository',
    target: null,
    binary: 'codex',
    repository: 'example/repository',
    pr: '7',
    baseSha: '1'.repeat(40),
    headSha: '2'.repeat(40),
    testBin: 'node',
    testArgs: ['-e', 'process.exit(0)'],
    hostArgs: [],
    applyLaunch: false,
    full: false,
    json: false,
    output: null,
    help: false,
    ...overrides,
  };
}

{
  const parsed = parseArgs([
    '--host', 'codex',
    '--cwd', '/tmp/repository',
    '--binary', 'codex',
    '--repository', 'example/repository',
    '--pr', '7',
    '--base-sha', '1'.repeat(40),
    '--head-sha', '2'.repeat(40),
    '--test-bin', 'npm',
    '--test-arg', '--runInBand',
    '--host-arg', '--model',
    '--host-arg', 'gpt-5.6',
    '--apply-launch',
  ]);
  assert.equal(parsed.applyLaunch, true);
  assert.deepEqual(parsed.testArgs, ['--runInBand']);
  assert.deepEqual(parsed.hostArgs, ['--model', 'gpt-5.6']);
  const reviewArgv = buildReviewArgv(parsed);
  assert.deepEqual(reviewArgv.slice(-3), ['--', '--model', 'gpt-5.6']);
  assert.equal(reviewArgv.filter((value) => value === '--').length, 1);
}

for (const argv of [
  [],
  ['--host', 'unknown'],
  ['--host', 'github-copilot', '--target', '/tmp/repo', '--cwd', '/tmp/repo'],
  ['--host', 'codex', '--cwd', '/tmp/repo', '--repository', 'o/r', '--pr', '1', '--base-sha', '1'.repeat(40), '--head-sha', '2'.repeat(40)],
  ['--host', 'codex', '--cwd', '/tmp/repo', '--repository', 'o/r', '--pr', '1', '--base-sha', '1'.repeat(40), '--head-sha', '2'.repeat(40), '--test-bin', 'npm', '--shell'],
]) assert.throws(() => parseArgs(argv));

{
  const { root, base, head } = fixture();
  try {
    const report = runGuardedSession({
      host: 'github-copilot',
      cwd: null,
      target: root,
      binary: null,
      repository: 'example/session-fixture',
      pr: '1',
      baseSha: base,
      headSha: head,
      testBin: process.execPath,
      testArgs: ['-e', 'process.exit(0)'],
      hostArgs: [],
      applyLaunch: true,
      full: false,
      json: false,
      output: null,
      help: false,
    }, ROOT, { doctor: passDoctor });

    assert.equal(report.overall_status, 'PASS');
    assert.equal(report.mode, 'EXPLICIT_APPLY_LAUNCH');
    assert.equal(report.stages.launch.state, 'CREATED');
    assert.equal(report.stages.tests.status, 'PASS');
    assert.equal(report.stages.review.overall_status, 'PASS');
    assert.equal(report.stages.review.guardian.review.outcome, 'NO_FINDINGS_FROM_ENABLED_RULES');
    assert.equal(report.stages.review.guardian.review.findings_count, 0);
    assert.equal(report.stages.review.guardian.coverage.correctness_review, 'NOT_PERFORMED');
    assert.equal(report.stages.review.guardian.coverage.security_review, 'NOT_PERFORMED');
    assert.equal(report.stages.review.guardian.coverage.semantic_code_review, 'NOT_PERFORMED');
    assert.equal(report.repository_state_preserved, true);
    assert.equal(report.shell_used, false);
    assert.equal(report.hidden_state_written, false);
    assert.equal(report.github_publication_performed, false);
    assert.equal(report.automatic_fix_performed, false);
    assert.equal(fs.existsSync(path.join(root, '.github', 'copilot-instructions.md')), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const state = {
    status: 'PASS',
    head_sha: 'a'.repeat(40),
    clean: true,
    status_entry_count: 0,
    status_sha256: 'b'.repeat(64),
    unstaged_diff_sha256: 'c'.repeat(64),
    staged_diff_sha256: 'd'.repeat(64),
  };
  let reviewCalled = false;
  const report = runGuardedSession(syntheticOptions(), ROOT, {
    doctor: passDoctor,
    preflight: () => ({
      overall_status: 'PASS',
      next_safe_action: 'Continue.',
      host_dry_run: { status: 'PASS', state: 'READY_TO_LAUNCH' },
    }),
    launch: () => ({ status: 'PASS', state: 'READY_TO_LAUNCH' }),
    snapshot: () => ({ ...state }),
    test: () => ({ status: 'FAIL', exit_code: 1 }),
    review: () => { reviewCalled = true; return { overall_status: 'PASS' }; },
  });
  assert.equal(report.overall_status, 'FAIL');
  assert.equal(report.stopped_after, 'tests');
  assert.equal(reviewCalled, false);
  assert.equal(report.repository_state_preserved, true);
}

{
  const baseline = {
    status: 'PASS',
    head_sha: 'a'.repeat(40),
    clean: true,
    status_entry_count: 0,
    status_sha256: 'b'.repeat(64),
    unstaged_diff_sha256: 'c'.repeat(64),
    staged_diff_sha256: 'd'.repeat(64),
  };
  let snapshots = 0;
  const report = runGuardedSession(syntheticOptions(), ROOT, {
    doctor: passDoctor,
    preflight: () => ({
      overall_status: 'PASS',
      next_safe_action: 'Continue.',
      host_dry_run: { status: 'PASS', state: 'READY_TO_LAUNCH' },
    }),
    launch: () => ({ status: 'PASS', state: 'READY_TO_LAUNCH' }),
    snapshot: () => {
      snapshots += 1;
      return snapshots === 1
        ? { ...baseline }
        : { ...baseline, status_sha256: 'e'.repeat(64), clean: false };
    },
    test: () => ({ status: 'PASS', exit_code: 0 }),
    review: () => ({
      overall_status: 'PASS',
      next_safe_action: 'No findings from enabled deterministic rules; continue with required human review.',
    }),
  });
  assert.equal(report.overall_status, 'FAIL');
  assert.equal(report.stopped_after, 'final_state');
  assert.equal(report.repository_state_preserved, false);
}

console.log('unified guarded session preserves bounded Guardian coverage, single passthrough delimiter, stop-on-failure, shell-free tests, and Git-state proof');
