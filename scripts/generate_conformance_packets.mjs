#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function valueAfter(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}
function readJson(relativePath) { return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8')); }
function activate(binding, capability) {
  return binding.activation_map?.[capability] || binding.activation_template.replaceAll('{capability}', capability);
}
function run(command, commandArgs, cwd = ROOT) {
  return execFileSync(command, commandArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function resolveRepositoryCommit() {
  try { return run('git', ['rev-parse', 'HEAD']); }
  catch {
    console.error('generate_conformance_packets.mjs requires a git repository (run inside a git clone or working tree)');
    process.exit(2);
  }
}
function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function launchCommand(host) {
  if (host === 'codex') return 'Start Codex with native hakim@hakim installed and its SessionStart hook trusted, then open the fixture directory.';
  if (host === 'claude-code') return 'Start Claude Code normally with native hakim@hakim installed.';
  if (host === 'github-copilot') return 'Start Copilot CLI with native hakim@hakim installed, or use a supported Copilot surface with that plugin enabled.';
  return 'Start OpenCode from the fixture directory with the project-local Hakim bundle installed.';
}

const requestedHost = valueAfter('--host', 'all');
const outputRoot = path.resolve(ROOT, valueAfter('--output', 'dist/conformance-runtime'));
const repositoryCommit = resolveRepositoryCommit();
const suite = readJson('conformance/suite.json');
const profiles = readJson('conformance/policy-profiles.json');
const bindings = readJson('conformance/adapter-bindings.json');
const scenarios = readJson('conformance/runtime-scenarios.json');
const schema = readJson('conformance/runtime-evidence.schema.json');
const profileMap = new Map(profiles.profiles.map((profile) => [profile.id, profile]));
const scenarioMap = new Map(scenarios.scenarios.map((scenario) => [scenario.case_id, scenario]));
const availableHosts = Object.keys(bindings.hosts);
const selectedHosts = requestedHost === 'all' ? availableHosts : [requestedHost];
const hakimVersion = fs.readFileSync(path.join(ROOT, 'core/hakim-skill/VERSION'), 'utf8').trim();

for (const host of selectedHosts) {
  if (!bindings.hosts[host]) {
    console.error(`unknown host: ${host}`);
    process.exit(2);
  }
}

fs.mkdirSync(outputRoot, { recursive: true });

for (const host of selectedHosts) {
  const binding = bindings.hosts[host];
  const hostDir = path.join(outputRoot, host);
  const fixtureDir = path.join(hostDir, 'fixtures');
  const casePromptDir = path.join(hostDir, 'case-prompts');
  fs.rmSync(hostDir, { recursive: true, force: true });
  fs.mkdirSync(hostDir, { recursive: true });
  fs.mkdirSync(casePromptDir, { recursive: true });
  run(process.execPath, [path.join(ROOT, 'scripts/build_runtime_conformance_fixtures.mjs'), '--output', fixtureDir, '--force']);
  fs.mkdirSync(path.join(hostDir, 'transcripts'), { recursive: true });
  fs.writeFileSync(path.join(hostDir, 'transcripts/README.md'), '# Runtime transcripts\n\nStore one complete transcript per case as `HC-XXX.txt` or `HC-XXX.md`.\n');

  const promptLines = [
    `# Hakim P1.1A Runtime Conformance Prompts — ${host}`,
    '',
    `Suite: \`${suite.suite_id}\``,
    `Repository commit: \`${repositoryCommit}\``,
    `Hakim version: \`${hakimVersion}\``,
    '',
    'Run each case in its isolated fixture directory using the native Hakim host integration. Paste the exact matching case prompt and record the full output/tool calls. Do not mark PASS only because the capability was discovered.',
    '',
  ];
  const resultLines = [
    `# Hakim P1.1A Runtime Conformance Results — ${host}`,
    '',
    'Allowed verdicts: `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`.',
    'The authoritative machine-readable record is `evidence.json`.',
    '',
  ];
  const manifestCases = [];
  const evidenceCases = [];

  for (const testCase of suite.cases) {
    const profile = profileMap.get(testCase.profile);
    const scenario = scenarioMap.get(testCase.id);
    if (!scenario) throw new Error(`missing runtime scenario for ${testCase.id}`);
    const activation = activate(binding, testCase.capability);
    const profilePrompt = bindings.profile_prompt_templates[testCase.profile];
    const fixturePath = path.join(fixtureDir, testCase.id);
    const fullPrompt = `${activation}\n\n${profilePrompt}\n\nCase ${testCase.id}: ${scenario.task}`;
    const promptText = `${fullPrompt}\n`;
    const promptFile = path.join(casePromptDir, `${testCase.id}.txt`);
    const promptHash = sha256(promptText);
    fs.writeFileSync(promptFile, promptText, 'utf8');
    const fixtureStateBefore = JSON.parse(fs.readFileSync(path.join(fixturePath, '.hakim-fixture.json'), 'utf8'));

    promptLines.push(`## ${testCase.id} — ${testCase.title}`, '', `Capability: \`${testCase.capability}\``, `Profile: \`${testCase.profile}\` (mode \`${profile.mode}\`, mutation \`${profile.mutation_policy}\`)`, `Fixture: \`${path.relative(ROOT, fixturePath)}\``, `Exact prompt file: \`case-prompts/${testCase.id}.txt\``, `Prompt SHA-256: \`${promptHash}\``, '', '```text', fullPrompt, '```', '', `Required assertions: ${testCase.required_assertions.map((item) => `\`${item}\``).join(', ')}`, `Forbidden assertions: ${testCase.forbidden_assertions.map((item) => `\`${item}\``).join(', ')}`, `Objective fixture checks: ${scenario.objective_checks.map((item) => `\`${item}\``).join(', ')}`, '');

    resultLines.push(`## ${testCase.id} — ${testCase.title}`, '', '- Verdict: NOT_RUN', `- Exact prompt: case-prompts/${testCase.id}.txt`, `- Transcript: transcripts/${testCase.id}.txt`, '- Required assertions satisfied:');
    for (const assertion of testCase.required_assertions) resultLines.push(`  - [ ] ${assertion}`);
    resultLines.push('- Forbidden assertions absent:');
    for (const assertion of testCase.forbidden_assertions) resultLines.push(`  - [ ] ${assertion}`);
    resultLines.push('- Repository mutation observed: NOT_RECORDED', '- Notes:', '');

    manifestCases.push({ id: testCase.id, capability: testCase.capability, profile: testCase.profile, activation, fixture: path.relative(hostDir, fixturePath), prompt_path: `case-prompts/${testCase.id}.txt`, prompt_sha256: promptHash, mutation_expectation: testCase.mutation_expectation, required_assertions: testCase.required_assertions, forbidden_assertions: testCase.forbidden_assertions, objective_checks: scenario.objective_checks, verdict: 'NOT_RUN' });
    evidenceCases.push({ id: testCase.id, capability: testCase.capability, profile: testCase.profile, verdict: 'NOT_RUN', transcript_path: '', prompt_fidelity: { exact: null, prompt_path: `case-prompts/${testCase.id}.txt`, prompt_sha256: promptHash, evidence: '' }, required_assertions: testCase.required_assertions.map((id) => ({ id, satisfied: null, evidence: '' })), forbidden_assertions: testCase.forbidden_assertions.map((id) => ({ id, absent: null, evidence: '' })), mutation_observed: null, fixture_state_before: fixtureStateBefore, fixture_state_after: null, notes: '' });
  }

  const manifest = { schema_version: schema.schema_version, suite_id: suite.suite_id, host, adapter_id: binding.adapter_id, invocation_kind: binding.invocation_kind, repository_commit: repositoryCommit, hakim_version: hakimVersion, generated_from: ['conformance/suite.json', 'conformance/policy-profiles.json', 'conformance/adapter-bindings.json', 'conformance/runtime-scenarios.json', 'conformance/runtime-evidence.schema.json'], cases: manifestCases, acceptance_status: 'HOLD_FOR_OPERATOR_TRANSCRIPTS' };
  const evidence = { schema_version: schema.schema_version, suite_id: suite.suite_id, host, adapter_id: binding.adapter_id, repository_commit: repositoryCommit, hakim_version: hakimVersion, host_version: null, started_at: null, completed_at: null, policy_isolation: { competing_policy_context_observed: null, observed_contexts: [], evidence: '' }, cases: evidenceCases, acceptance_status: 'HOLD_FOR_OPERATOR_TRANSCRIPTS' };
  const sessionLines = [
    `# P1.1A Session Instructions — ${host}`,
    '',
    `Launch requirement: \`${launchCommand(host)}\``,
    '',
    'Isolation gate before running any case:',
    '1. Disable or exclude other policy/behavior plugins and hooks, including Ponytail, for this conformance session.',
    '2. Confirm Hakim is the only policy plugin active for the case.',
    '3. If another policy context appears, stop and mark the run RETEST_REQUIRED; do not assign PASS.',
    '',
    'For each case:',
    '1. Change to the fixture directory shown in `PROMPTS.md`.',
    '2. Start a fresh or clearly separated interaction.',
    '3. Paste the exact contents of `case-prompts/HC-XXX.txt` once.',
    '4. Save the complete transcript under `transcripts/HC-XXX.txt`.',
    '5. Record prompt fidelity and policy-isolation evidence in `evidence.json`.',
    '6. After all cases, run the fixture-state capture and evidence validator.',
    '',
    'Do not edit the suite, profiles, bindings, scenarios, assertions, generated prompt files, or fixture baselines during evidence collection.',
  ];

  fs.writeFileSync(path.join(hostDir, 'PROMPTS.md'), `${promptLines.join('\n')}\n`);
  fs.writeFileSync(path.join(hostDir, 'RESULTS.md'), `${resultLines.join('\n')}\n`);
  fs.writeFileSync(path.join(hostDir, 'SESSION.md'), `${sessionLines.join('\n')}\n`);
  fs.writeFileSync(path.join(hostDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(hostDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({ suite_id: suite.suite_id, hosts: selectedHosts, case_count_per_host: suite.cases.length, output: path.relative(ROOT, outputRoot), generated_files_per_host: ['PROMPTS.md', 'RESULTS.md', 'SESSION.md', 'manifest.json', 'evidence.json', 'case-prompts/', 'fixtures/', 'transcripts/'], runtime_behavior_status: 'HOLD_FOR_OPERATOR_TRANSCRIPTS' }, null, 2));
