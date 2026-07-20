#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  } catch (error) {
    errors.push(`cannot read ${relativePath}: ${error.message}`);
    return '';
  }
}

function readJson(relativePath) {
  const text = read(relativePath);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`invalid JSON in ${relativePath}: ${error.message}`);
    return {};
  }
}

function sameSet(actual, expected, label) {
  const a = [...new Set(actual || [])].sort();
  const e = [...expected].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) {
    errors.push(`${label} ${JSON.stringify(a)} != ${JSON.stringify(e)}`);
  }
}

function requireIncludes(collection, value, label) {
  if (!(collection || []).includes(value)) errors.push(`${label} missing ${value}`);
}

const rootPaths = {
  profiles: 'conformance/policy-profiles.json',
  suite: 'conformance/suite.json',
  bindings: 'conformance/adapter-bindings.json',
};
const packagedPaths = {
  profiles: 'core/hakim-skill/conformance/policy-profiles.json',
  suite: 'core/hakim-skill/conformance/suite.json',
  bindings: 'core/hakim-skill/conformance/adapter-bindings.json',
};

for (const key of Object.keys(rootPaths)) {
  const rootText = read(rootPaths[key]);
  const packagedText = read(packagedPaths[key]);
  if (rootText !== packagedText) errors.push(`${key} packaged copy drift`);
}

const capabilitiesContract = readJson('core/hakim-skill/capabilities.json');
const profilesContract = readJson(rootPaths.profiles);
const suite = readJson(rootPaths.suite);
const bindings = readJson(rootPaths.bindings);
const copilotInstructions = read('.github/copilot-instructions.md');

const expectedRuntimeHosts = ['codex', 'claude-code', 'github-copilot'];
const expectedStructuralHosts = ['opencode'];
const expectedBindingHosts = [...expectedRuntimeHosts, ...expectedStructuralHosts];
const expectedCapabilities = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
const expectedProfiles = ['balanced-full', 'read-only', 'ultra-minimal', 'disabled'];
const expectedCases = ['HC-001', 'HC-002', 'HC-003', 'HC-101', 'HC-102', 'HC-103', 'HC-104', 'HC-105', 'HC-201', 'HC-202'];

sameSet((capabilitiesContract.capabilities || []).map((item) => item.id), expectedCapabilities, 'capability contract ids');
sameSet((profilesContract.profiles || []).map((item) => item.id), expectedProfiles, 'policy profile ids');
sameSet(suite.hosts, expectedRuntimeHosts, 'runtime suite hosts');
sameSet(Object.keys(bindings.hosts || {}), expectedBindingHosts, 'binding hosts');
sameSet((suite.cases || []).map((item) => item.id), expectedCases, 'conformance case ids');

if (profilesContract.policy !== 'profiles constrain existing Hakim capabilities; they do not add commands, adapters, or benchmark claims') {
  errors.push('policy profile boundary changed');
}
if (suite.policy !== 'the same semantic case and acceptance assertions apply to every supported adapter; invocation syntax may differ') {
  errors.push('suite semantic parity policy changed');
}

const profiles = new Map((profilesContract.profiles || []).map((profile) => [profile.id, profile]));
const capabilityMap = new Map((capabilitiesContract.capabilities || []).map((capability) => [capability.id, capability]));
const seenCaseIds = new Set();
const coveredCapabilities = new Set();
const coveredProfiles = new Set();

for (const testCase of suite.cases || []) {
  if (seenCaseIds.has(testCase.id)) errors.push(`duplicate conformance case id: ${testCase.id}`);
  seenCaseIds.add(testCase.id);

  if (!capabilityMap.has(testCase.capability)) errors.push(`${testCase.id} references unknown capability ${testCase.capability}`);
  if (!profiles.has(testCase.profile)) errors.push(`${testCase.id} references unknown profile ${testCase.profile}`);
  coveredCapabilities.add(testCase.capability);
  coveredProfiles.add(testCase.profile);

  const profile = profiles.get(testCase.profile);
  if (profile && !(profile.applies_to || []).includes(testCase.capability)) {
    errors.push(`${testCase.id} capability ${testCase.capability} is outside profile ${testCase.profile}`);
  }

  if (!testCase.prompt || typeof testCase.prompt !== 'string') errors.push(`${testCase.id} missing prompt`);
  if (!(testCase.required_assertions || []).length) errors.push(`${testCase.id} missing required assertions`);
  if (!(testCase.forbidden_assertions || []).length) errors.push(`${testCase.id} missing forbidden assertions`);

  if (testCase.profile === 'read-only') {
    if (testCase.mutation_expectation !== 'forbidden') errors.push(`${testCase.id} read-only mutation expectation must be forbidden`);
    requireIncludes(testCase.required_assertions, 'reports-no-mutation', `${testCase.id} required assertions`);
  }
}

sameSet([...coveredCapabilities], expectedCapabilities, 'covered capabilities');
sameSet([...coveredProfiles], expectedProfiles, 'covered profiles');

const requiredProfileDetails = {
  'balanced-full': { mode: 'full', mutation_policy: 'request-controlled', invariants: ['reuse-first', 'smallest-safe-diff', 'lazy-not-negligent', 'evidence-bound-claims'] },
  'read-only': { mode: 'full', mutation_policy: 'forbidden', invariants: ['no-repository-writes', 'no-generated-artifact-writes', 'explicit-no-mutation-report'] },
  'ultra-minimal': { mode: 'ultra', mutation_policy: 'request-controlled', invariants: ['challenge-additions', 'prefer-deletion', 'evidence-before-new-dependency', 'preserve-safety-boundaries'] },
  disabled: { mode: 'off', mutation_policy: 'request-controlled', invariants: ['do-not-apply-hakim-prescriptive-guidance', 'do-not-claim-hakim-evaluation'] },
};

for (const [profileId, expected] of Object.entries(requiredProfileDetails)) {
  const profile = profiles.get(profileId);
  if (!profile) continue;
  if (profile.mode !== expected.mode) errors.push(`${profileId} mode ${profile.mode} != ${expected.mode}`);
  if (profile.mutation_policy !== expected.mutation_policy) errors.push(`${profileId} mutation policy drift`);
  for (const invariant of expected.invariants) requireIncludes(profile.required_invariants, invariant, `${profileId} invariants`);
  if (!bindings.profile_prompt_templates?.[profileId]) errors.push(`missing prompt template for profile ${profileId}`);
}

const hostExpectations = {
  codex: { invocation_kind: 'namespaced-skill', source_root: 'plugins/codex/skills', slash_commands_claimed: false, activation: '$hakim:{capability}' },
  'claude-code': { invocation_kind: 'slash-skill', source_root: 'plugins/claude-code/skills', slash_commands_claimed: true, activation: '/{capability}' },
  'github-copilot': { invocation_kind: 'natural-language', source_root: '.github/copilot-instructions.md', slash_commands_claimed: false, activation: 'Use Hakim capability {capability}.' },
  opencode: { invocation_kind: 'slash-command-and-native-skill', source_root: 'plugins/opencode', slash_commands_claimed: true, activation: '/{capability}' },
};

for (const [host, expected] of Object.entries(hostExpectations)) {
  const binding = bindings.hosts?.[host] || {};
  for (const field of ['invocation_kind', 'source_root', 'slash_commands_claimed']) {
    if (binding[field] !== expected[field]) errors.push(`${host} ${field} ${JSON.stringify(binding[field])} != ${JSON.stringify(expected[field])}`);
  }
  if (binding.activation_template !== expected.activation) errors.push(`${host} activation template drift`);
  if (!binding.activation_template?.includes('{capability}')) errors.push(`${host} activation template missing capability placeholder`);
}
if (bindings.hosts?.opencode?.runtime_validation !== 'NOT_PERFORMED') {
  errors.push('OpenCode structural binding must retain runtime_validation=NOT_PERFORMED');
}

for (const capability of capabilitiesContract.capabilities || []) {
  for (const host of expectedBindingHosts) {
    const hostContract = capability.hosts?.[host];
    if (!hostContract?.path) {
      errors.push(`${capability.id} missing ${host} contract path`);
      continue;
    }
    if (!fs.existsSync(path.join(ROOT, hostContract.path))) errors.push(`${capability.id} missing ${host} source ${hostContract.path}`);
  }
  if (!copilotInstructions.includes(capability.id)) errors.push(`Copilot instructions missing capability route ${capability.id}`);
}

const regressionRequirements = {
  'HC-101': { required: ['uses-working-tree-diff', 'uses-staged-diff'], forbidden: ['head-previous-commit-fallback'] },
  'HC-102': { required: ['reports-no-mutation'], forbidden: ['runs-audit-ci-write-path', 'writes-dist-artifact'] },
  'HC-103': { required: ['separates-live-synthetic-archive'], forbidden: ['promotes-synthetic-to-live', 'promotes-archive-to-live'] },
  'HC-104': { required: ['benchmark-not-established', 'performance-roi-hold'], forbidden: ['ponytail-benchmark-transfer', 'invented-performance-number'] },
  'HC-105': { required: ['lists-six-capabilities', 'host-aware-invocation'], forbidden: ['universal-slash-command-promise'] },
};
const casesById = new Map((suite.cases || []).map((item) => [item.id, item]));
for (const [caseId, requirements] of Object.entries(regressionRequirements)) {
  const testCase = casesById.get(caseId);
  if (!testCase) continue;
  for (const assertion of requirements.required) requireIncludes(testCase.required_assertions, assertion, `${caseId} required assertions`);
  for (const assertion of requirements.forbidden) requireIncludes(testCase.forbidden_assertions, assertion, `${caseId} forbidden assertions`);
}

const result = {
  suite_id: suite.suite_id || null,
  hosts: expectedRuntimeHosts,
  structural_hosts: expectedStructuralHosts,
  capabilities: expectedCapabilities,
  profiles: expectedProfiles,
  case_count: (suite.cases || []).length,
  packaged_contract_copies: 3,
  runtime_behavior_status: 'HOLD_FOR_P1_1A_OPERATOR_EVIDENCE',
  opencode_runtime_validation: 'NOT_PERFORMED',
  ok: errors.length === 0,
  errors,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
