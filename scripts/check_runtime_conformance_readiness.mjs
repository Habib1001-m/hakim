#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function read(relativePath) {
  try { return fs.readFileSync(path.join(ROOT, relativePath), 'utf8'); }
  catch (error) { errors.push(`cannot read ${relativePath}: ${error.message}`); return ''; }
}
function readJson(relativePath) {
  const text = read(relativePath);
  if (!text) return {};
  try { return JSON.parse(text); }
  catch (error) { errors.push(`invalid JSON in ${relativePath}: ${error.message}`); return {}; }
}
function sameSet(actual, expected, label) {
  const a = [...new Set(actual || [])].sort();
  const e = [...new Set(expected || [])].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) errors.push(`${label} ${JSON.stringify(a)} != ${JSON.stringify(e)}`);
}
function acceptanceFor(verdicts) {
  if (verdicts.length > 0 && verdicts.every((verdict) => verdict === 'PASS')) return 'PASS';
  if (verdicts.some((verdict) => verdict === 'FAIL')) return 'FAIL';
  if (verdicts.length > 0 && verdicts.every((verdict) => verdict === 'NOT_RUN')) return 'HOLD_FOR_OPERATOR_TRANSCRIPTS';
  return 'PARTIAL';
}

const rootScenarioPath = 'conformance/runtime-scenarios.json';
const packagedScenarioPath = 'core/hakim-skill/conformance/runtime-scenarios.json';
const rootSchemaPath = 'conformance/runtime-evidence.schema.json';
const packagedSchemaPath = 'core/hakim-skill/conformance/runtime-evidence.schema.json';
const ledgerPath = 'conformance/runtime-acceptance-ledger.json';
if (read(rootScenarioPath) !== read(packagedScenarioPath)) errors.push('runtime scenario packaged copy drift');
if (read(rootSchemaPath) !== read(packagedSchemaPath)) errors.push('runtime evidence schema packaged copy drift');

const suite = readJson('conformance/suite.json');
const scenarios = readJson(rootScenarioPath);
const schema = readJson(rootSchemaPath);
const bindings = readJson('conformance/adapter-bindings.json');
const ledger = readJson(ledgerPath);
const caseIds = (suite.cases || []).map((item) => item.id);
const scenarioIds = (scenarios.scenarios || []).map((item) => item.case_id);
const hostIds = Object.keys(bindings.hosts || {});
sameSet(scenarioIds, caseIds, 'runtime scenario case IDs');
sameSet(schema.allowed_hosts, hostIds, 'runtime schema hosts');
sameSet(schema.allowed_verdicts, ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'], 'runtime verdicts');

if (scenarios.policy !== 'runtime acceptance uses isolated deterministic fixtures; semantic assertions remain host-neutral') {
  errors.push('runtime scenario policy drift');
}
if (schema.schema_id !== 'hakim-runtime-conformance-evidence-v2') errors.push('runtime evidence schema ID drift');
if (!schema.pass_requirements?.transcript_path_nonempty) errors.push('PASS must require a transcript');
if (!schema.pass_requirements?.exact_prompt_required) errors.push('PASS must require exact prompt fidelity');
if (!schema.pass_requirements?.no_competing_policy_context) errors.push('PASS must require isolated Hakim policy context');
if (!schema.pass_requirements?.required_assertions_all_satisfied) errors.push('PASS must require all required assertions');
if (!schema.pass_requirements?.forbidden_assertions_all_absent) errors.push('PASS must require all forbidden assertions absent');
if (!schema.pass_requirements?.mutation_must_match_case_expectation) errors.push('PASS must enforce mutation expectations');
if (!(schema.required_session_fields || []).includes('policy_isolation')) errors.push('runtime evidence must require policy_isolation');
if (!(schema.required_case_fields || []).includes('prompt_fidelity')) errors.push('runtime evidence must require prompt_fidelity');

const suiteMap = new Map((suite.cases || []).map((item) => [item.id, item]));
for (const scenario of scenarios.scenarios || []) {
  const testCase = suiteMap.get(scenario.case_id);
  if (!testCase) continue;
  if (!scenario.fixture || !scenario.working_directory || !scenario.task) errors.push(`${scenario.case_id} missing executable scenario fields`);
  if (!(scenario.objective_checks || []).length) errors.push(`${scenario.case_id} missing objective fixture checks`);
  if (!['allowed', 'forbidden'].includes(scenario.mutation_expectation)) errors.push(`${scenario.case_id} has invalid runtime mutation expectation`);
  if (testCase.mutation_expectation === 'forbidden' && scenario.mutation_expectation !== 'forbidden') {
    errors.push(`${scenario.case_id} runtime scenario weakens a read-only mutation boundary`);
  }
}

for (const requiredPath of [
  'scripts/build_runtime_conformance_fixtures.mjs',
  'scripts/generate_conformance_packets.mjs',
  'scripts/prepare_runtime_conformance_session.sh',
  'scripts/run_runtime_conformance_case.sh',
  'scripts/capture_runtime_fixture_state.mjs',
  'scripts/validate_runtime_conformance_evidence.mjs',
  'scripts/build_runtime_conformance_matrix.mjs',
  ledgerPath,
]) {
  if (!fs.existsSync(path.join(ROOT, requiredPath))) errors.push(`missing runtime conformance tool or state: ${requiredPath}`);
}

const generator = read('scripts/generate_conformance_packets.mjs');
for (const phrase of [
  'runtime-scenarios.json', 'runtime-evidence.schema.json', 'evidence.json',
  'build_runtime_conformance_fixtures.mjs', 'run_runtime_conformance_case.sh',
  'Do not open Codex first', 'case-prompts', 'prompt_sha256', 'policy_isolation',
  'competing_policy_context_observed',
]) {
  if (!generator.includes(phrase)) errors.push(`packet generator missing runtime contract phrase: ${phrase}`);
}
const validator = read('scripts/validate_runtime_conformance_evidence.mjs');
for (const phrase of [
  '--require-complete', 'transcript not found', 'mutation_observed=false', 'computedAcceptance',
  'prompt_fidelity.exact=true', 'transcript does not contain the exact generated prompt',
  'competing_policy_context_observed=false', 'policy isolation evidence',
]) {
  if (!validator.includes(phrase)) errors.push(`evidence validator missing acceptance guard: ${phrase}`);
}
const runner = read('scripts/run_runtime_conformance_case.sh');
for (const phrase of [
  'Run this command from the normal shell', 'Do not paste it inside Codex',
  'fixture state does not match its recorded baseline', 'script -q -f -c codex',
  'paste ONLY the generated case prompt', 'git -C "$FIXTURE" diff --exit-code',
  'TEST_COMMAND=NOT_APPLICABLE_NO_PACKAGE_JSON',
]) {
  if (!runner.includes(phrase)) errors.push(`guarded case runner missing safety phrase: ${phrase}`);
}

if (ledger.schema_version !== 1) errors.push('runtime acceptance ledger schema_version must be 1');
if (ledger.suite_id !== suite.suite_id) errors.push('runtime acceptance ledger suite_id drift');
sameSet(ledger.expected_hosts, hostIds, 'runtime acceptance ledger hosts');
if (ledger.expected_cases_per_host !== caseIds.length) errors.push('runtime acceptance ledger case count drift');
if (ledger.expected_total_verdicts !== hostIds.length * caseIds.length) errors.push('runtime acceptance ledger total verdict count drift');

const ledgerVerdicts = [];
for (const host of hostIds) {
  const hostState = ledger.hosts?.[host];
  if (!hostState) {
    errors.push(`runtime acceptance ledger missing host: ${host}`);
    continue;
  }
  const hostCases = Array.isArray(hostState.cases) ? hostState.cases : [];
  sameSet(hostCases.map((item) => item.id), caseIds, `runtime acceptance ledger ${host} case IDs`);
  const hostVerdicts = [];
  for (const item of hostCases) {
    if (!schema.allowed_verdicts.includes(item.verdict)) errors.push(`${host}/${item.id} has invalid ledger verdict ${item.verdict}`);
    hostVerdicts.push(item.verdict);
    ledgerVerdicts.push(item.verdict);
    if (item.verdict === 'PASS') {
      if (!/^[a-f0-9]{40}$/i.test(item.repository_commit || '')) errors.push(`${host}/${item.id} PASS missing full repository_commit`);
      if (!/^\d+\.\d+\.\d+$/.test(item.hakim_version || '')) errors.push(`${host}/${item.id} PASS missing plain-semver hakim_version`);
      if (!/^[a-f0-9]{64}$/i.test(item.prompt_sha256 || '')) errors.push(`${host}/${item.id} PASS missing prompt_sha256`);
      if (!item.evidence_doc || !fs.existsSync(path.join(ROOT, item.evidence_doc))) errors.push(`${host}/${item.id} PASS evidence_doc is missing`);
    }
  }
  const computedHostAcceptance = acceptanceFor(hostVerdicts);
  if (hostState.acceptance_status !== computedHostAcceptance) {
    errors.push(`${host} acceptance_status ${JSON.stringify(hostState.acceptance_status)} != computed ${computedHostAcceptance}`);
  }
}

const verdictCounts = Object.fromEntries(schema.allowed_verdicts.map((verdict) => [verdict, ledgerVerdicts.filter((item) => item === verdict).length]));
for (const verdict of schema.allowed_verdicts) {
  if (ledger.verdict_counts?.[verdict] !== verdictCounts[verdict]) errors.push(`runtime acceptance ledger ${verdict} count drift`);
}
const computedOverallAcceptance = acceptanceFor(ledgerVerdicts);
if (ledger.overall_acceptance !== computedOverallAcceptance) {
  errors.push(`runtime acceptance ledger overall_acceptance ${JSON.stringify(ledger.overall_acceptance)} != computed ${computedOverallAcceptance}`);
}
if (ledgerVerdicts.length !== hostIds.length * caseIds.length) errors.push('runtime acceptance ledger must contain exactly 30 verdicts');

console.log(JSON.stringify({
  suite_id: suite.suite_id || null,
  runtime_scenarios: scenarioIds.length,
  allowed_hosts: schema.allowed_hosts || [],
  allowed_verdicts: schema.allowed_verdicts || [],
  packaged_runtime_contract_copies: 2,
  exact_prompt_gate: true,
  policy_isolation_gate: true,
  guarded_codex_case_runner: true,
  accepted_runtime_verdicts: verdictCounts,
  runtime_acceptance_status: computedOverallAcceptance,
  ok: errors.length === 0,
  errors,
}, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
