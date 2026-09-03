'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const check = spawnSync('node', [path.join(root, 'scripts/check_cross_adapter_conformance.mjs')], { cwd: root, encoding: 'utf8' });
assert.equal(check.status, 0, check.stderr + check.stdout);
const checkPayload = JSON.parse(check.stdout);
assert.equal(checkPayload.ok, true);
assert.equal(checkPayload.case_count, 10);
assert.deepEqual(checkPayload.hosts, ['codex', 'claude-code', 'github-copilot']);
assert.equal(checkPayload.runtime_behavior_status, 'NOT_CLAIMED_BY_STATIC_CONFORMANCE');

const runtimeHosts = ['codex', 'claude-code', 'github-copilot'];
const runtimeSchema = JSON.parse(fs.readFileSync(path.join(root, 'conformance/runtime-evidence.schema.json'), 'utf8'));
assert.deepEqual(runtimeSchema.allowed_hosts, runtimeHosts, 'runtime evidence schema must match suite host authority');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-conformance-'));
try {
  const generated = spawnSync('node', [path.join(root, 'scripts/generate_conformance_packets.mjs'), '--output', tempRoot], { cwd: root, encoding: 'utf8' });
  assert.equal(generated.status, 0, generated.stderr + generated.stdout);
  const generatedPayload = JSON.parse(generated.stdout);
  assert.equal(generatedPayload.case_count_per_host, 10);
  assert.deepEqual(generatedPayload.hosts, runtimeHosts, 'runtime packet generator must follow suite.hosts only');
  assert.equal(fs.existsSync(path.join(tempRoot, 'opencode')), false, 'OpenCode is structural-only for this runtime suite');

  const rejectedOpenCode = spawnSync('node', [path.join(root, 'scripts/generate_conformance_packets.mjs'), '--host', 'opencode', '--output', path.join(tempRoot, 'opencode-rejected')], { cwd: root, encoding: 'utf8' });
  assert.notEqual(rejectedOpenCode.status, 0, 'runtime packet generator must reject structural-only OpenCode');
  assert.match(rejectedOpenCode.stderr + rejectedOpenCode.stdout, /opencode.*runtime suite|runtime suite.*opencode/i);

  for (const host of runtimeHosts) {
    const hostDir = path.join(tempRoot, host);
    const prompts = fs.readFileSync(path.join(hostDir, 'PROMPTS.md'), 'utf8');
    const results = fs.readFileSync(path.join(hostDir, 'RESULTS.md'), 'utf8');
    const session = fs.readFileSync(path.join(hostDir, 'SESSION.md'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(hostDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest.host, host);
    assert.equal(manifest.cases.length, 10);
    assert.equal(manifest.acceptance_status, 'HOLD_FOR_OPERATOR_TRANSCRIPTS');
    assert.match(prompts, /^# Hakim Runtime Conformance Prompts/m);
    assert.match(results, /^# Hakim Runtime Conformance Results/m);
    assert.match(session, /^# Hakim Runtime Conformance Session Instructions/m);
    assert.doesNotMatch(prompts, /P1\.1A/);
    assert.doesNotMatch(results, /P1\.1A/);
    assert.doesNotMatch(session, /P1\.1A/);
    assert.match(prompts, /HC-101 — Current diff only/);
    assert.match(prompts, /HC-104 — Evidence status without inherited metrics/);
    assert.match(results, /Allowed verdicts: `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`/);

    const roundTripEvidencePath = path.join(hostDir, 'evidence.json');
    const roundTrip = spawnSync('node', [path.join(root, 'scripts/validate_runtime_conformance_evidence.mjs'), '--input', roundTripEvidencePath], { cwd: root, encoding: 'utf8' });
    assert.equal(roundTrip.status, 0, `${host} generated evidence must validate:\n${roundTrip.stderr}${roundTrip.stdout}`);
    const roundTripPayload = JSON.parse(roundTrip.stdout);
    assert.equal(roundTripPayload.host, host);
    assert.equal(roundTripPayload.structurally_valid, true);
  }

  const codexPrompts = fs.readFileSync(path.join(tempRoot, 'codex/PROMPTS.md'), 'utf8');
  const claudePrompts = fs.readFileSync(path.join(tempRoot, 'claude-code/PROMPTS.md'), 'utf8');
  const copilotPrompts = fs.readFileSync(path.join(tempRoot, 'github-copilot/PROMPTS.md'), 'utf8');

  assert.match(codexPrompts, /\$hakim:hakim-review/);
  assert.match(claudePrompts, /\/hakim:review/);
  assert.doesNotMatch(claudePrompts, /\n\/hakim-review\n/);
  assert.match(copilotPrompts, /Use the installed Hakim skill hakim-review\./);
  assert.doesNotMatch(copilotPrompts, /Use Hakim capability hakim-review\./);

  const packet = path.join(tempRoot, 'github-copilot');
  const evidencePath = path.join(packet, 'evidence.json');
  const capture = spawnSync('node', [path.join(root, 'scripts/capture_runtime_fixture_state.mjs'), '--packet', packet], { cwd: root, encoding: 'utf8' });
  assert.equal(capture.status, 0, capture.stderr + capture.stdout);
  const capturedEvidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.ok(capturedEvidence.cases.every((item) => item.fixture_state_after));
  assert.ok(capturedEvidence.cases.every((item) => typeof item.mutation_observed === 'boolean'));

  const validate = spawnSync('node', [path.join(root, 'scripts/validate_runtime_conformance_evidence.mjs'), '--input', evidencePath], { cwd: root, encoding: 'utf8' });
  assert.equal(validate.status, 0, validate.stderr + validate.stdout);
  const validation = JSON.parse(validate.stdout);
  assert.equal(validation.structurally_valid, true);
  assert.equal(validation.acceptance_status, 'HOLD_FOR_OPERATOR_TRANSCRIPTS');

  const invalidSemverEvidence = { ...capturedEvidence, hakim_version: '1.0.0-01' };
  const invalidSemverPath = path.join(packet, 'invalid-semver-evidence.json');
  fs.writeFileSync(invalidSemverPath, `${JSON.stringify(invalidSemverEvidence, null, 2)}\n`, 'utf8');
  const invalidSemver = spawnSync('node', [path.join(root, 'scripts/validate_runtime_conformance_evidence.mjs'), '--input', invalidSemverPath], { cwd: root, encoding: 'utf8' });
  assert.notEqual(invalidSemver.status, 0, 'numeric prerelease identifiers with leading zeroes must be rejected');
  const invalidSemverValidation = JSON.parse(invalidSemver.stdout);
  assert.equal(invalidSemverValidation.structurally_valid, false);
  assert.ok(invalidSemverValidation.errors.includes('hakim_version must be valid semver'));

  const requireComplete = spawnSync('node', [path.join(root, 'scripts/validate_runtime_conformance_evidence.mjs'), '--input', evidencePath, '--require-complete'], { cwd: root, encoding: 'utf8' });
  assert.notEqual(requireComplete.status, 0, 'NOT_RUN evidence must not pass --require-complete');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('test_cross_adapter_conformance.js: native host activations and current runtime evidence utilities ok');
