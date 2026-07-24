import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPPORTED_HOSTS,
  buildLiveAcceptance,
  parseArgs,
  validateOutputPath,
} from '../scripts/hakim_live_host_acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.deepEqual(SUPPORTED_HOSTS, ['codex', 'claude-code', 'github-copilot', 'opencode']);

const parsed = parseArgs([
  '--host', 'claude-code',
  '--record',
  '--installation', 'PASS',
  '--activation', 'PASS',
  '--invocation', 'PASS',
  '--evidence-ref', 'issue:8#claude-live',
  '--verified-at', '2026-07-24T12:00:00Z',
  '--json',
]);
assert.equal(parsed.host, 'claude-code');
assert.equal(parsed.record, true);
assert.equal(parsed.observations.installation, 'PASS');
assert.equal(parsed.observations.activation, 'PASS');
assert.equal(parsed.observations.invocation, 'PASS');
assert.equal(parsed.evidenceRef, 'issue:8#claude-live');
assert.equal(parsed.verifiedAt, '2026-07-24T12:00:00Z');
assert.equal(parsed.json, true);

for (const argv of [
  [],
  ['--host', 'unknown'],
  ['--host', 'codex', '--apply'],
  ['--host', 'codex', '--record', '--installation', 'PASS', '--activation', 'PASS', '--invocation', 'PASS'],
  ['--host', 'codex', '--target', '/tmp/project'],
  ['--host', 'opencode', '--record', '--installation', 'PASS', '--activation', 'PASS', '--invocation', 'PASS', '--evidence-ref', 'issue:8#opencode'],
]) {
  assert.throws(() => parseArgs(argv));
}

const dependencies = {
  resolveExecutable: () => '/usr/local/bin/claude',
  probeVersion: () => ({ status: 'PASS', version: '2.1.211', exit_code: 0, reason: null }),
};

const inspect = buildLiveAcceptance(parseArgs(['--host', 'claude-code']), root, dependencies);
assert.equal(inspect.mode, 'READ_ONLY_INSPECTION');
assert.equal(inspect.candidate_status, 'INSPECT_ONLY');
assert.equal(inspect.host_binary.version_probe.version, '2.1.211');
assert.equal(inspect.evidence_ref, null);
assert.equal(inspect.safety.host_installation_performed, false);
assert.equal(inspect.safety.host_configuration_mutated, false);
assert.equal(inspect.safety.acceptance_projection_mutated, false);
assert.equal(inspect.safety.raw_host_output_captured, false);
assert.ok(inspect.journey.every((item) => item.observation === 'NOT_RECORDED'));
assert.ok(inspect.install_commands.some((command) => /claude plugin install hakim@hakim/.test(command)));

const accepted = buildLiveAcceptance(parsed, root, dependencies);
assert.equal(accepted.mode, 'CANDIDATE_EVIDENCE');
assert.equal(accepted.candidate_status, 'PASS');
assert.equal(accepted.verified_at, '2026-07-24T12:00:00Z');
assert.equal(accepted.evidence_ref, 'issue:8#claude-live');
assert.deepEqual(accepted.journey.map((item) => item.observation), ['PASS', 'PASS', 'PASS']);
assert.match(accepted.next_safe_action, /Review this candidate packet/);

const incomplete = buildLiveAcceptance(
  parseArgs([
    '--host', 'claude-code',
    '--record',
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--evidence-ref', 'issue:8#claude-incomplete',
  ]),
  root,
  dependencies,
);
assert.equal(incomplete.candidate_status, 'INCOMPLETE');

const failed = buildLiveAcceptance(
  parseArgs([
    '--host', 'claude-code',
    '--record',
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'FAIL',
    '--evidence-ref', 'issue:8#claude-fail',
  ]),
  root,
  dependencies,
);
assert.equal(failed.candidate_status, 'FAIL');

const blockedVersion = buildLiveAcceptance(
  parseArgs([
    '--host', 'claude-code',
    '--record',
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'PASS',
    '--evidence-ref', 'issue:8#claude-version-blocked',
  ]),
  root,
  {
    resolveExecutable: () => null,
    probeVersion: () => ({ status: 'BLOCKED', version: null, exit_code: null, reason: 'BINARY_NOT_FOUND' }),
  },
);
assert.equal(blockedVersion.candidate_status, 'INCOMPLETE');
assert.equal(blockedVersion.host_binary.version_probe.reason, 'BINARY_NOT_FOUND');

const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-live-evidence-'));
try {
  const outputPath = path.join(outputRoot, 'nested', 'candidate.json');
  assert.equal(validateOutputPath(outputPath), path.resolve(outputPath));
  assert.equal(fs.existsSync(path.dirname(outputPath)), true);
  fs.writeFileSync(outputPath, '{}\n', 'utf8');
  assert.throws(() => validateOutputPath(outputPath), /refusing overwrite/);
} finally {
  fs.rmSync(outputRoot, { recursive: true, force: true });
}

console.log('live host acceptance harness stays read-only and produces create-only reviewable candidate evidence');
