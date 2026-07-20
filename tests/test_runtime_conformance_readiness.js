'use strict';
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

let result = run(process.execPath, ['scripts/check_runtime_conformance_readiness.mjs']);
assert.strictEqual(result.status, 0, result.stderr + result.stdout);
const readiness = JSON.parse(result.stdout);
assert.strictEqual(readiness.runtime_scenarios, 10);
assert.strictEqual(readiness.packaged_runtime_contract_copies, 2);
assert.strictEqual(readiness.exact_prompt_gate, true);
assert.strictEqual(readiness.policy_isolation_gate, true);
assert.strictEqual(readiness.guarded_codex_case_runner, true);
assert.strictEqual(readiness.runtime_acceptance_status, 'PARTIAL');
assert.deepStrictEqual(readiness.accepted_runtime_verdicts, {
  PASS: 23,
  FAIL: 0,
  BLOCKED: 0,
  NOT_RUN: 7,
});

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-p1-1a-'));
try {
  const runtimeRoot = path.join(temp, 'runtime');
  result = run('bash', ['scripts/prepare_runtime_conformance_session.sh', 'github-copilot', runtimeRoot]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);

  const packet = path.join(runtimeRoot, 'github-copilot');
  const evidencePath = path.join(packet, 'evidence.json');
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.strictEqual(evidence.schema_version, 2);
  assert.strictEqual(evidence.cases.length, 10);
  assert.strictEqual(evidence.acceptance_status, 'HOLD_FOR_OPERATOR_TRANSCRIPTS');
  assert.strictEqual(evidence.policy_isolation.competing_policy_context_observed, null);
  assert.ok(evidence.cases.every((item) => item.verdict === 'NOT_RUN'));
  assert.ok(evidence.cases.every((item) => item.fixture_state_before));
  assert.ok(evidence.cases.every((item) => item.prompt_fidelity?.exact === null));

  for (const item of evidence.cases) {
    const promptPath = path.join(packet, item.prompt_fidelity.prompt_path);
    assert.ok(fs.existsSync(promptPath), `missing prompt file for ${item.id}`);
    const promptText = fs.readFileSync(promptPath, 'utf8');
    assert.strictEqual(item.prompt_fidelity.prompt_sha256, sha256(promptText));
  }

  const reviewFixture = path.join(packet, 'fixtures', 'HC-101');
  const reviewStatus = run('git', ['status', '--porcelain=v1'], { cwd: reviewFixture });
  assert.strictEqual(reviewStatus.status, 0, reviewStatus.stderr);
  assert.ok(reviewStatus.stdout.includes(' M src/a.js'));
  assert.ok(reviewStatus.stdout.includes('M  src/b.js'));
  assert.ok(!reviewStatus.stdout.includes('.hakim-fixture.json'));
  const reviewMetadata = JSON.parse(fs.readFileSync(path.join(reviewFixture, '.hakim-fixture.json'), 'utf8'));
  assert.ok(reviewMetadata.baseline_status.startsWith(' M src/a.js'));
  assert.ok(reviewMetadata.baseline_status.includes('M  src/b.js'));
  assert.strictEqual(reviewMetadata.baseline_status, reviewStatus.stdout.trimEnd());

  const auditEvidence = evidence.cases.find((item) => item.id === 'HC-102');
  assert.ok(auditEvidence.fixture_state_before.ignored_artifact_sha256);

  result = run(process.execPath, ['scripts/capture_runtime_fixture_state.mjs', '--packet', packet]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  const captured = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.ok(captured.cases.every((item) => item.mutation_observed === false));
  assert.ok(captured.cases.every((item) => item.fixture_state_after));

  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', evidencePath]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  const validation = JSON.parse(result.stdout);
  assert.strictEqual(validation.acceptance_status, 'HOLD_FOR_OPERATOR_TRANSCRIPTS');
  assert.strictEqual(validation.structurally_valid, true);
  assert.strictEqual(validation.prompt_fidelity_required, true);
  assert.strictEqual(validation.policy_isolation_required, true);

  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', evidencePath, '--require-complete']);
  assert.notStrictEqual(result.status, 0, 'incomplete evidence must not pass --require-complete');

  const guarded = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const guardedCase = guarded.cases.find((item) => item.id === 'HC-003');
  const promptText = fs.readFileSync(path.join(packet, guardedCase.prompt_fidelity.prompt_path), 'utf8');
  fs.writeFileSync(path.join(packet, 'transcripts', 'HC-003.txt'), promptText, 'utf8');
  guardedCase.verdict = 'PASS';
  guardedCase.transcript_path = 'transcripts/HC-003.txt';
  guardedCase.prompt_fidelity.exact = true;
  guardedCase.prompt_fidelity.evidence = 'Exact generated prompt copied from the case prompt file.';
  guardedCase.required_assertions = guardedCase.required_assertions.map((item) => ({ ...item, satisfied: true, evidence: 'fixture transcript evidence' }));
  guardedCase.forbidden_assertions = guardedCase.forbidden_assertions.map((item) => ({ ...item, absent: true, evidence: 'fixture transcript absence evidence' }));
  guardedCase.mutation_observed = false;
  guarded.policy_isolation = {
    competing_policy_context_observed: true,
    observed_contexts: ['Ponytail full mode'],
    evidence: 'A competing policy hook appeared in the startup transcript.',
  };
  guarded.acceptance_status = 'PARTIAL';
  fs.writeFileSync(evidencePath, `${JSON.stringify(guarded, null, 2)}\n`);

  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', evidencePath]);
  assert.notStrictEqual(result.status, 0, 'competing policy context must invalidate PASS');
  assert.ok(result.stdout.includes('competing_policy_context_observed=false'));

  guarded.policy_isolation = {
    competing_policy_context_observed: false,
    observed_contexts: ['Hakim full mode'],
    evidence: 'Only the Hakim policy context appeared in the startup transcript.',
  };
  fs.writeFileSync(path.join(packet, 'transcripts', 'HC-003.txt'), 'generic prompt without the generated task\n', 'utf8');
  fs.writeFileSync(evidencePath, `${JSON.stringify(guarded, null, 2)}\n`);
  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', evidencePath]);
  assert.notStrictEqual(result.status, 0, 'prompt mismatch must invalidate PASS');
  assert.ok(result.stdout.includes('transcript does not contain the exact generated prompt'));

  fs.writeFileSync(path.join(packet, 'transcripts', 'HC-003.txt'), promptText, 'utf8');
  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', evidencePath]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);

  const claudeRoot = path.join(temp, 'claude-runtime');
  result = run('bash', ['scripts/prepare_runtime_conformance_session.sh', 'claude-code', claudeRoot]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  const claudePacket = path.join(claudeRoot, 'claude-code');
  const claudeEvidencePath = path.join(claudePacket, 'evidence.json');
  result = run(process.execPath, ['scripts/capture_runtime_fixture_state.mjs', '--packet', claudePacket]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  const claudeEvidence = JSON.parse(fs.readFileSync(claudeEvidencePath, 'utf8'));
  const claudeCase = claudeEvidence.cases.find((item) => item.id === 'HC-001');
  const claudePrompt = fs.readFileSync(path.join(claudePacket, claudeCase.prompt_fidelity.prompt_path), 'utf8');
  const claudeCanonicalizedPrompt = claudePrompt.replace(/^\/hakim(?=\r?\n)/, '/hakim:hakim');
  fs.writeFileSync(path.join(claudePacket, 'transcripts', 'HC-001.txt'), claudeCanonicalizedPrompt, 'utf8');
  claudeCase.verdict = 'PASS';
  claudeCase.transcript_path = 'transcripts/HC-001.txt';
  claudeCase.prompt_fidelity.exact = true;
  claudeCase.prompt_fidelity.evidence = 'Claude canonicalized /hakim to /hakim:hakim without changing the prompt body.';
  claudeCase.required_assertions = claudeCase.required_assertions.map((item) => ({ ...item, satisfied: true, evidence: 'fixture transcript evidence' }));
  claudeCase.forbidden_assertions = claudeCase.forbidden_assertions.map((item) => ({ ...item, absent: true, evidence: 'fixture transcript absence evidence' }));
  claudeCase.mutation_observed = true;
  claudeEvidence.policy_isolation = {
    competing_policy_context_observed: false,
    observed_contexts: ['Hakim full mode'],
    evidence: 'No competing policy capability was invoked.',
  };
  claudeEvidence.acceptance_status = 'PARTIAL';
  fs.writeFileSync(claudeEvidencePath, `${JSON.stringify(claudeEvidence, null, 2)}\n`);

  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', claudeEvidencePath]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);

  fs.writeFileSync(
    path.join(claudePacket, 'transcripts', 'HC-001.txt'),
    claudePrompt.replace(/^\/hakim(?=\r?\n)/, '/other:hakim'),
    'utf8',
  );
  result = run(process.execPath, ['scripts/validate_runtime_conformance_evidence.mjs', '--input', claudeEvidencePath]);
  assert.notStrictEqual(result.status, 0, 'unrelated namespace canonicalization must not pass prompt fidelity');

  const codexRoot = path.join(temp, 'codex-runtime');
  result = run('bash', ['scripts/prepare_runtime_conformance_session.sh', 'codex', codexRoot]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  const codexSession = fs.readFileSync(path.join(codexRoot, 'codex', 'SESSION.md'), 'utf8');
  assert.ok(codexSession.includes('run_runtime_conformance_case.sh'));
  assert.ok(codexSession.includes('Do not open Codex first'));
  assert.ok(codexSession.includes('paste only the generated prompt'));

  const allRoot = path.join(temp, 'all-hosts');
  result = run(process.execPath, ['scripts/generate_conformance_packets.mjs', '--output', allRoot]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  result = run(process.execPath, ['scripts/build_runtime_conformance_matrix.mjs', '--root', allRoot]);
  assert.strictEqual(result.status, 0, result.stderr + result.stdout);
  const matrix = JSON.parse(fs.readFileSync(path.join(allRoot, 'ACCEPTANCE_MATRIX.json'), 'utf8'));
  assert.strictEqual(matrix.observed_total_verdicts, 30);
  assert.strictEqual(matrix.overall_acceptance, 'HOLD_FOR_OPERATOR_TRANSCRIPTS');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('runtime conformance readiness workflow ok');
