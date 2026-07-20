#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function valueAfter(flag, fallback = null) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const rootArg = valueAfter('--root');
if (!rootArg) {
  console.error('usage: node scripts/build_runtime_conformance_matrix.mjs --root <runtime-root> [--output <file>]');
  process.exit(2);
}

const runtimeRoot = path.resolve(process.cwd(), rootArg);
const outputPath = path.resolve(process.cwd(), valueAfter('--output', path.join(runtimeRoot, 'ACCEPTANCE_MATRIX.json')));
const hosts = ['codex', 'claude-code', 'github-copilot'];
const errors = [];
const hostSummaries = [];
const rows = [];

for (const host of hosts) {
  const evidencePath = path.join(runtimeRoot, host, 'evidence.json');
  if (!fs.existsSync(evidencePath)) {
    errors.push(`missing evidence for ${host}: ${evidencePath}`);
    continue;
  }
  const evidence = readJson(evidencePath);
  const counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].map((verdict) => [verdict, evidence.cases.filter((item) => item.verdict === verdict).length]));
  hostSummaries.push({ host, acceptance_status: evidence.acceptance_status, counts, repository_commit: evidence.repository_commit, host_version: evidence.host_version });
  for (const item of evidence.cases) {
    rows.push({ host, id: item.id, capability: item.capability, profile: item.profile, verdict: item.verdict, transcript_path: item.transcript_path || null });
  }
}

const verdicts = rows.map((row) => row.verdict);
let overall = 'HOLD_FOR_OPERATOR_TRANSCRIPTS';
if (errors.length) overall = 'INCOMPLETE';
else if (verdicts.some((verdict) => verdict === 'FAIL')) overall = 'FAIL';
else if (rows.length === 30 && verdicts.every((verdict) => verdict === 'PASS')) overall = 'PASS';
else if (verdicts.some((verdict) => verdict === 'PASS' || verdict === 'BLOCKED')) overall = 'PARTIAL';

const payload = {
  schema_version: 1,
  suite_id: 'hakim-cross-adapter-conformance-v1',
  expected_hosts: hosts,
  expected_case_count_per_host: 10,
  expected_total_verdicts: 30,
  observed_total_verdicts: rows.length,
  hosts: hostSummaries,
  rows,
  overall_acceptance: overall,
  errors,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(ROOT, outputPath),
  observed_total_verdicts: rows.length,
  overall_acceptance: overall,
  errors,
}, null, 2));
process.exit(errors.length ? 1 : 0);
