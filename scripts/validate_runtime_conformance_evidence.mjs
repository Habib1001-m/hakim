#!/usr/bin/env node
import crypto from 'node:crypto';
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

function sameSet(actual, expected) {
  return JSON.stringify([...new Set(actual)].sort()) === JSON.stringify([...new Set(expected)].sort());
}

function acceptanceFor(cases) {
  const verdicts = cases.map((item) => item.verdict);
  if (verdicts.every((verdict) => verdict === 'PASS')) return 'PASS';
  if (verdicts.some((verdict) => verdict === 'FAIL')) return 'FAIL';
  if (verdicts.every((verdict) => verdict === 'NOT_RUN')) return 'HOLD_FOR_OPERATOR_TRANSCRIPTS';
  return 'PARTIAL';
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function normalizeTerminalText(text) {
  return String(text)
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, ' ')
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function promptVariants(promptText, host, claudePluginName) {
  const variants = [String(promptText)];
  if (host !== 'claude-code') return variants;

  const lines = String(promptText).split(/\r?\n/);
  const activation = lines[0];
  if (!activation.startsWith('/') || activation.includes(':')) return variants;

  const capability = activation.slice(1);
  if (!capability) return variants;

  lines[0] = `/${claudePluginName}:${capability}`;
  variants.push(lines.join('\n'));
  return variants;
}

function transcriptContainsPrompt(transcriptText, promptText, host, claudePluginName) {
  const normalizedTranscript = normalizeTerminalText(transcriptText);
  return promptVariants(promptText, host, claudePluginName)
    .some((variant) => normalizedTranscript.includes(normalizeTerminalText(variant)));
}

const inputArg = valueAfter('--input');
if (!inputArg) {
  console.error('usage: node scripts/validate_runtime_conformance_evidence.mjs --input <evidence.json> [--require-complete]');
  process.exit(2);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const inputDir = path.dirname(inputPath);
const requireComplete = args.includes('--require-complete');
const errors = [];
let evidence;
try {
  evidence = readJson(inputPath);
} catch (error) {
  console.error(`cannot read evidence: ${error.message}`);
  process.exit(2);
}

const suite = readJson(path.join(ROOT, 'conformance/suite.json'));
const scenarios = readJson(path.join(ROOT, 'conformance/runtime-scenarios.json'));
const bindings = readJson(path.join(ROOT, 'conformance/adapter-bindings.json'));
const schema = readJson(path.join(ROOT, 'conformance/runtime-evidence.schema.json'));
const claudeManifest = readJson(path.join(ROOT, 'plugins/claude-code/.claude-plugin/plugin.json'));
const claudePluginName = claudeManifest.name || 'hakim';
const suiteCases = new Map(suite.cases.map((item) => [item.id, item]));
const scenarioCases = new Map(scenarios.scenarios.map((item) => [item.case_id, item]));

for (const field of schema.required_session_fields) {
  if (!(field in evidence)) errors.push(`missing session field: ${field}`);
}
if (evidence.schema_version !== schema.schema_version) errors.push(`schema_version ${evidence.schema_version} != ${schema.schema_version}`);
if (evidence.suite_id !== suite.suite_id) errors.push(`suite_id ${JSON.stringify(evidence.suite_id)} != ${suite.suite_id}`);
if (!schema.allowed_hosts.includes(evidence.host)) errors.push(`unsupported host: ${evidence.host}`);
if (evidence.host && bindings.hosts[evidence.host]?.adapter_id !== evidence.adapter_id) {
  errors.push(`adapter_id ${JSON.stringify(evidence.adapter_id)} does not match host ${evidence.host}`);
}
if (!/^[a-f0-9]{40}$/i.test(evidence.repository_commit || '')) errors.push('repository_commit must be a full 40-character commit SHA');
if (!/^\d+\.\d+\.\d+$/.test(evidence.hakim_version || '')) errors.push('hakim_version must be plain semver');
if (!Array.isArray(evidence.cases)) errors.push('cases must be an array');

const cases = Array.isArray(evidence.cases) ? evidence.cases : [];
if (!sameSet(cases.map((item) => item.id), [...suiteCases.keys()])) errors.push('evidence case IDs do not match the suite');
const seen = new Set();
const anyPass = cases.some((item) => item.verdict === 'PASS');

if (anyPass) {
  if (!evidence.policy_isolation || typeof evidence.policy_isolation !== 'object') {
    errors.push('PASS evidence requires policy_isolation');
  } else {
    if (evidence.policy_isolation.competing_policy_context_observed !== false) {
      errors.push('PASS evidence requires competing_policy_context_observed=false');
    }
    if (!Array.isArray(evidence.policy_isolation.observed_contexts)) {
      errors.push('policy_isolation.observed_contexts must be an array');
    }
    if (!String(evidence.policy_isolation.evidence || '').trim()) {
      errors.push('PASS evidence requires policy isolation evidence');
    }
  }
}

for (const result of cases) {
  if (seen.has(result.id)) errors.push(`duplicate case result: ${result.id}`);
  seen.add(result.id);
  const contract = suiteCases.get(result.id);
  const scenario = scenarioCases.get(result.id);
  if (!contract) continue;

  for (const field of schema.required_case_fields) {
    if (!(field in result)) errors.push(`${result.id} missing case field: ${field}`);
  }
  if (result.capability !== contract.capability) errors.push(`${result.id} capability drift`);
  if (result.profile !== contract.profile) errors.push(`${result.id} profile drift`);
  if (!schema.allowed_verdicts.includes(result.verdict)) errors.push(`${result.id} invalid verdict ${result.verdict}`);
  if (!scenario) errors.push(`${result.id} missing runtime scenario`);

  const required = Array.isArray(result.required_assertions) ? result.required_assertions : [];
  const forbidden = Array.isArray(result.forbidden_assertions) ? result.forbidden_assertions : [];
  if (!sameSet(required.map((item) => item.id), contract.required_assertions)) errors.push(`${result.id} required assertion IDs drift`);
  if (!sameSet(forbidden.map((item) => item.id), contract.forbidden_assertions)) errors.push(`${result.id} forbidden assertion IDs drift`);

  if (result.verdict === 'PASS') {
    let transcriptText = '';
    if (!result.transcript_path || typeof result.transcript_path !== 'string') {
      errors.push(`${result.id} PASS requires transcript_path`);
    } else {
      const transcriptPath = path.resolve(inputDir, result.transcript_path);
      if (!fs.existsSync(transcriptPath)) {
        errors.push(`${result.id} transcript not found: ${result.transcript_path}`);
      } else {
        transcriptText = fs.readFileSync(transcriptPath, 'utf8');
      }
    }

    const fidelity = result.prompt_fidelity;
    if (!fidelity || typeof fidelity !== 'object') {
      errors.push(`${result.id} PASS requires prompt_fidelity`);
    } else {
      if (fidelity.exact !== true) errors.push(`${result.id} PASS requires prompt_fidelity.exact=true`);
      if (!String(fidelity.evidence || '').trim()) errors.push(`${result.id} prompt fidelity missing evidence`);
      if (!fidelity.prompt_path || typeof fidelity.prompt_path !== 'string') {
        errors.push(`${result.id} prompt fidelity requires prompt_path`);
      } else {
        const promptPath = path.resolve(inputDir, fidelity.prompt_path);
        if (!fs.existsSync(promptPath)) {
          errors.push(`${result.id} exact prompt not found: ${fidelity.prompt_path}`);
        } else {
          const promptText = fs.readFileSync(promptPath, 'utf8');
          const actualPromptHash = sha256(promptText);
          if (fidelity.prompt_sha256 !== actualPromptHash) errors.push(`${result.id} prompt SHA-256 mismatch`);
          if (transcriptText && !transcriptContainsPrompt(
            transcriptText,
            promptText,
            evidence.host,
            claudePluginName,
          )) {
            errors.push(`${result.id} transcript does not contain the exact generated prompt`);
          }
        }
      }
    }

    for (const assertion of required) {
      if (assertion.satisfied !== true) errors.push(`${result.id} required assertion not satisfied: ${assertion.id}`);
      if (!String(assertion.evidence || '').trim()) errors.push(`${result.id} required assertion missing evidence: ${assertion.id}`);
    }
    for (const assertion of forbidden) {
      if (assertion.absent !== true) errors.push(`${result.id} forbidden assertion not proven absent: ${assertion.id}`);
      if (!String(assertion.evidence || '').trim()) errors.push(`${result.id} forbidden assertion missing evidence: ${assertion.id}`);
    }
    if (typeof result.mutation_observed !== 'boolean') errors.push(`${result.id} PASS requires boolean mutation_observed`);
    if (contract.mutation_expectation === 'forbidden' && result.mutation_observed !== false) {
      errors.push(`${result.id} read-only PASS requires mutation_observed=false`);
    }
    if (!result.fixture_state_before || typeof result.fixture_state_before !== 'object') errors.push(`${result.id} PASS requires fixture_state_before`);
    if (!result.fixture_state_after || typeof result.fixture_state_after !== 'object') errors.push(`${result.id} PASS requires fixture_state_after`);
  }

  if (result.verdict === 'FAIL' && !String(result.notes || '').trim()) errors.push(`${result.id} FAIL requires notes`);
  if (result.verdict === 'BLOCKED' && !String(result.notes || '').trim()) errors.push(`${result.id} BLOCKED requires notes`);
}

const computedAcceptance = acceptanceFor(cases);
if (evidence.acceptance_status !== computedAcceptance) {
  errors.push(`acceptance_status ${JSON.stringify(evidence.acceptance_status)} != computed ${computedAcceptance}`);
}
if (requireComplete && computedAcceptance !== 'PASS') errors.push(`complete acceptance required, got ${computedAcceptance}`);
if (requireComplete && !evidence.completed_at) errors.push('complete acceptance requires completed_at');

const summary = {
  schema_id: schema.schema_id,
  suite_id: suite.suite_id,
  host: evidence.host || null,
  case_count: cases.length,
  verdict_counts: Object.fromEntries(schema.allowed_verdicts.map((verdict) => [verdict, cases.filter((item) => item.verdict === verdict).length])),
  acceptance_status: computedAcceptance,
  prompt_fidelity_required: true,
  policy_isolation_required: true,
  require_complete: requireComplete,
  structurally_valid: errors.length === 0,
  errors,
};
console.log(JSON.stringify(summary, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
