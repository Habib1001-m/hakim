#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildReviewReport,
  formatText,
  parseArgs,
} from '../scripts/hakim_review_pr.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function commit(root, message) {
  git(root, ['add', '--all']);
  git(root, ['commit', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

const passingDoctor = {
  schema_version: 1,
  mode: 'READ_ONLY',
  scope: 'FAST',
  mutation_performed: false,
  repository_health: 'PASS',
  next_safe_action: 'Continue normal development.',
  checks: [],
};
const failingDoctor = {
  ...passingDoctor,
  repository_health: 'FAIL',
  next_safe_action: 'Run the first failing doctor check directly.',
};

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-review-pr-'));
const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-review-pr-bin-'));
write(binDir, 'codex', '#!/bin/sh\nexit 0\n');
fs.chmodSync(path.join(binDir, 'codex'), 0o755);
const env = { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}` };

try {
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.name', 'Hakim Test']);
  git(root, ['config', 'user.email', 'hakim@example.invalid']);
  git(root, ['remote', 'add', 'origin', 'https://github.com/example/repo.git']);

  write(root, 'package.json', `${JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    private: true,
    engines: { node: '>=18' },
  }, null, 2)}\n`);
  write(root, 'README.md', '# Fixture\n\nEvidence-bound baseline.\n');
  const baseSha = commit(root, 'base');

  write(root, 'src/clean.js', 'export const clean = true;\n');
  const cleanHead = commit(root, 'clean head');

  const options = parseArgs([
    '--host', 'codex',
    '--cwd', root,
    '--binary', 'codex',
    '--repository', 'example/repo',
    '--pr', '41',
    '--base-sha', baseSha,
    '--head-sha', cleanHead,
    '--', '--model', 'gpt-5.6',
  ]);
  assert.equal(options.preflight.host, 'codex');
  assert.equal(options.guardian.repository, 'example/repo');
  assert.equal(options.guardian.pr, 41);
  assert.equal(options.guardian.cwd, root);
  assert.deepEqual(options.preflight.passthrough, ['--model', 'gpt-5.6']);

  const copilotOptions = parseArgs([
    '--json',
    '--host', 'github-copilot',
    '--target', root,
    '--repository', 'example/repo',
    '--pr', '43',
    '--base-sha', baseSha,
    '--head-sha', cleanHead,
  ]);
  assert.equal(copilotOptions.json, true);
  assert.equal(copilotOptions.preflight.target, root);
  assert.equal(copilotOptions.guardian.cwd, root);

  const statusBefore = git(root, ['status', '--porcelain=v1']);
  const clean = buildReviewReport(options, repoRoot, {
    preflightDependencies: { doctorReport: passingDoctor, env },
  });
  const statusAfter = git(root, ['status', '--porcelain=v1']);
  assert.equal(statusBefore, statusAfter);
  assert.equal(clean.mode, 'READ_ONLY');
  assert.equal(clean.mutation_performed, false);
  assert.equal(clean.merge_blocking, false);
  assert.equal(clean.overall_status, 'PASS');
  assert.equal(clean.review_executed, true);
  assert.deepEqual(clean.components, { preflight: 'PASS', guardian: 'PASS' });
  assert.equal(clean.scope.fallback_used, false);
  assert.equal(clean.preflight.host_dry_run.execution_attempted, false);
  assert.equal(clean.guardian.review.outcome, 'NO_FINDINGS_FROM_ENABLED_RULES');
  assert.equal(clean.guardian.coverage.correctness_review, 'NOT_PERFORMED');
  assert.equal(clean.guardian.coverage.security_review, 'NOT_PERFORMED');
  assert.match(formatText(clean), /Hakim Minimal PR Review/);
  assert.match(formatText(clean), /Hakim Host Preflight/);
  assert.match(formatText(clean), /Hakim PR Guardian/);
  assert.match(formatText(clean), /No findings from enabled deterministic rules\./);
  assert.match(formatText(clean), /Correctness and security review were not performed\./);
  assert.doesNotMatch(formatText(clean), /Lean already\. Ship\./);

  const jsonReport = JSON.parse(JSON.stringify(clean));
  assert.equal(jsonReport.schema_version, 1);
  assert.equal(jsonReport.mode, 'READ_ONLY');
  assert.equal(jsonReport.scope.repository, 'example/repo');
  assert.equal(jsonReport.preflight.overall_status, 'PASS');
  assert.equal(jsonReport.guardian.review.outcome, 'NO_FINDINGS_FROM_ENABLED_RULES');
  assert.equal(jsonReport.guardian.coverage.semantic_code_review, 'NOT_PERFORMED');

  write(root, 'package.json', `${JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    private: true,
    engines: { node: '>=18' },
    dependencies: { 'left-pad': '1.3.0' },
  }, null, 2)}\n`);
  write(root, 'README.md', '# Fixture\n\nEvidence-bound baseline.\n\nHakim is production-ready.\n');
  const findingsHead = commit(root, 'advisory head');
  const advisory = buildReviewReport(
    parseArgs([
      '--host', 'codex',
      '--cwd', root,
      '--binary', 'codex',
      '--repository', 'example/repo',
      '--pr', '42',
      '--base-sha', cleanHead,
      '--head-sha', findingsHead,
    ]),
    repoRoot,
    { preflightDependencies: { doctorReport: passingDoctor, env } },
  );
  assert.equal(advisory.overall_status, 'PASS');
  assert.equal(advisory.review_executed, true);
  assert.equal(advisory.guardian.review.outcome, 'ADVISORY_FINDINGS');
  assert.equal(advisory.guardian.review.findings_count, 2);
  assert.match(advisory.next_safe_action, /no automatic action/);

  let guardianCalls = 0;
  const blocked = buildReviewReport(options, repoRoot, {
    preflightDependencies: { doctorReport: failingDoctor, env },
    guardianBuilder() {
      guardianCalls += 1;
      throw new Error('guardian must not run');
    },
  });
  assert.equal(guardianCalls, 0);
  assert.equal(blocked.overall_status, 'BLOCKED');
  assert.equal(blocked.review_executed, false);
  assert.deepEqual(blocked.components, { preflight: 'FAIL', guardian: 'SKIPPED' });
  assert.equal(blocked.guardian, null);
  assert.equal(blocked.next_safe_action, failingDoctor.next_safe_action);
  assert.match(formatText(blocked), /REVIEW_EXECUTED=NO/);

  assert.throws(() => parseArgs(['--apply']), /read-only/);
  assert.throws(() => parseArgs([
    '--host', 'codex',
    '--repository', 'example/repo',
    '--pr', '1',
    '--base-sha', baseSha,
    '--head-sha', cleanHead,
  ]), /--cwd is required/);
  assert.throws(() => parseArgs([
    '--host', 'github-copilot',
    '--target', root,
    '--cwd', root,
    '--repository', 'example/repo',
    '--pr', '1',
    '--base-sha', baseSha,
    '--head-sha', cleanHead,
  ]), /not supported/);

  const help = spawnSync(process.execPath, ['scripts/hakim_review_pr.mjs', '--help'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /npm run review:pr/);
  assert.match(help.stdout, /preflight first/);
  assert.match(help.stdout, /never launches, applies, fetches, publishes, fixes, or blocks merge/);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(binDir, { recursive: true, force: true });
}

console.log('minimal PR review composes preflight with bounded Guardian coverage, explicit non-review fields, and no mutation');
