#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}

function run(cwd, command, commandArgs = []) {
  return execFileSync(command, commandArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}

function sha256File(filePath) {
  return fs.existsSync(filePath)
    ? crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
    : null;
}

const packetArg = valueAfter('--packet');
if (!packetArg) {
  console.error('usage: node scripts/capture_runtime_fixture_state.mjs --packet <host-packet-directory>');
  process.exit(2);
}
const packetDir = path.resolve(process.cwd(), packetArg);
const evidencePath = path.join(packetDir, 'evidence.json');
if (!fs.existsSync(evidencePath)) {
  console.error(`missing evidence file: ${evidencePath}`);
  process.exit(2);
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const stateSummary = [];

for (const result of evidence.cases) {
  const fixtureDir = path.join(packetDir, 'fixtures', result.id);
  if (!fs.existsSync(path.join(fixtureDir, '.git'))) {
    throw new Error(`${result.id} fixture is missing a Git repository`);
  }
  const ignoredArtifactPath = path.join(fixtureDir, 'dist/audit.json');
  const testResult = fs.existsSync(path.join(fixtureDir, 'package.json'))
    ? spawnSync('npm', ['test'], { cwd: fixtureDir, encoding: 'utf8' })
    : null;
  const after = {
    head: run(fixtureDir, 'git', ['rev-parse', 'HEAD']),
    status: run(fixtureDir, 'git', ['status', '--porcelain=v1']),
    index_diff: run(fixtureDir, 'git', ['diff', '--cached', '--no-ext-diff', '--']),
    worktree_diff: run(fixtureDir, 'git', ['diff', '--no-ext-diff', '--']),
    ignored_artifact_sha256: sha256File(ignoredArtifactPath),
    tests: testResult ? {
      command: 'npm test',
      exit_code: testResult.status,
      stdout: String(testResult.stdout || '').slice(-4000),
      stderr: String(testResult.stderr || '').slice(-4000),
    } : null,
  };
  const before = result.fixture_state_before || {};
  const mutationObserved =
    after.head !== before.baseline_head ||
    after.status !== before.baseline_status ||
    after.index_diff !== before.baseline_index_diff ||
    after.worktree_diff !== before.baseline_worktree_diff ||
    after.ignored_artifact_sha256 !== before.ignored_artifact_sha256;

  result.fixture_state_after = after;
  result.mutation_observed = mutationObserved;
  stateSummary.push({ case_id: result.id, mutation_observed: mutationObserved, tests_exit_code: after.tests?.exit_code ?? null });
}

fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
fs.writeFileSync(path.join(packetDir, 'fixture-state-after.json'), `${JSON.stringify({ host: evidence.host, cases: stateSummary }, null, 2)}\n`);
console.log(JSON.stringify({
  host: evidence.host,
  packet: path.relative(ROOT, packetDir),
  case_count: stateSummary.length,
  mutation_observed_cases: stateSummary.filter((item) => item.mutation_observed).map((item) => item.case_id),
  state_file: path.relative(ROOT, path.join(packetDir, 'fixture-state-after.json')),
}, null, 2));
