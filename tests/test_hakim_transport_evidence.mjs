import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUPPORTED_HOSTS,
  buildTransportEvidence,
  parseArgs,
  validateOutputPath,
} from '../scripts/hakim_transport_evidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedSha = '5d00039479f2f11b7fe30ccf2385e70ce24553c3';
const expectedVersion = '1.0.0-beta.4';
const evidenceRef = 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-transport-codex';

assert.deepEqual(SUPPORTED_HOSTS, ['codex', 'claude-code', 'github-copilot', 'opencode']);

const parsed = parseArgs([
  '--host', 'codex',
  '--record',
  '--requested-source', `codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref ${expectedSha}`,
  '--resolved-source-sha', expectedSha,
  '--installed-product-version', expectedVersion,
  '--installation', 'PASS',
  '--activation', 'PASS',
  '--invocation', 'PASS',
  '--evidence-ref', evidenceRef,
  '--verified-at', '2026-07-30T20:30:00Z',
  '--json',
]);
assert.equal(parsed.host, 'codex');
assert.equal(parsed.record, true);
assert.equal(parsed.resolvedSourceSha, expectedSha);
assert.equal(parsed.installedProductVersion, expectedVersion);
assert.equal(parsed.observations.installation, 'PASS');
assert.equal(parsed.observations.activation, 'PASS');
assert.equal(parsed.observations.invocation, 'PASS');
assert.equal(parsed.evidenceRef, evidenceRef);
assert.equal(parsed.verifiedAt, '2026-07-30T20:30:00Z');
assert.equal(parsed.json, true);

for (const argv of [
  [],
  ['--host', 'unknown'],
  ['--host', 'codex', '--apply'],
  ['--host', 'codex', '--resolved-source-sha', 'abc'],
  ['--host', 'codex', '--resolved-source-sha', `${expectedSha.slice(0, 39)}g`],
  ['--host', 'codex', '--record', '--resolved-source-sha', expectedSha],
  ['--host', 'codex', '--evidence-ref', evidenceRef],
]) {
  assert.throws(() => parseArgs(argv));
}

const dependencies = {
  resolveExecutable: () => '/usr/local/bin/codex',
  probeVersion: () => ({ status: 'PASS', version: 'codex-cli 0.145.0', exit_code: 0, reason: null }),
};

const inspect = buildTransportEvidence(parseArgs(['--host', 'codex']), root, dependencies);
assert.equal(inspect.schema_version, 1);
assert.equal(inspect.packet_type, 'P0_HOST_TRANSPORT_EVIDENCE');
assert.equal(inspect.mode, 'READ_ONLY_INSPECTION');
assert.equal(inspect.packet_status, 'INSPECT_ONLY');
assert.equal(inspect.expected.product_version, expectedVersion);
assert.equal(inspect.expected.source_sha, expectedSha);
assert.equal(inspect.observed.resolved_source_sha, null);
assert.equal(inspect.observed.installed_product_version, null);
assert.equal(inspect.host_binary.version_probe.version, 'codex-cli 0.145.0');
assert.equal(inspect.safety.host_installation_performed, false);
assert.equal(inspect.safety.host_configuration_mutated, false);
assert.equal(inspect.safety.acceptance_projection_mutated, false);
assert.equal(inspect.safety.raw_host_output_captured, false);
assert.equal(inspect.safety.output_is_create_only, true);

const accepted = buildTransportEvidence(parsed, root, dependencies);
assert.equal(accepted.mode, 'CANDIDATE_EVIDENCE');
assert.equal(accepted.packet_status, 'PASS');
assert.equal(accepted.observed.resolved_source_sha, expectedSha);
assert.equal(accepted.observed.installed_product_version, expectedVersion);
assert.equal(accepted.observed.installation_status, 'PASS');
assert.equal(accepted.observed.activation_status, 'PASS');
assert.equal(accepted.observed.invocation_status, 'PASS');
assert.equal(accepted.evidence_ref, evidenceRef);
assert.equal(accepted.verified_at, '2026-07-30T20:30:00Z');
assert.match(accepted.next_safe_action, /Review this create-only packet/);

const mismatchedSha = buildTransportEvidence(
  parseArgs([
    '--host', 'codex',
    '--record',
    '--resolved-source-sha', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '--installed-product-version', expectedVersion,
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'PASS',
    '--evidence-ref', `${evidenceRef}-sha-mismatch`,
  ]),
  root,
  dependencies,
);
assert.equal(mismatchedSha.packet_status, 'FAIL');
assert.match(mismatchedSha.next_safe_action, /source\/version mismatch/i);

const mismatchedVersion = buildTransportEvidence(
  parseArgs([
    '--host', 'codex',
    '--record',
    '--resolved-source-sha', expectedSha,
    '--installed-product-version', '1.0.0-beta.4.post1',
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'PASS',
    '--evidence-ref', `${evidenceRef}-version-mismatch`,
  ]),
  root,
  dependencies,
);
assert.equal(mismatchedVersion.packet_status, 'FAIL');

const incomplete = buildTransportEvidence(
  parseArgs([
    '--host', 'codex',
    '--record',
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'PASS',
    '--evidence-ref', `${evidenceRef}-incomplete`,
  ]),
  root,
  dependencies,
);
assert.equal(incomplete.packet_status, 'INCOMPLETE');
assert.match(incomplete.next_safe_action, /exact resolved SHA/i);

const blocked = buildTransportEvidence(
  parseArgs([
    '--host', 'codex',
    '--record',
    '--resolved-source-sha', expectedSha,
    '--installed-product-version', expectedVersion,
    '--installation', 'PASS',
    '--activation', 'BLOCKED',
    '--invocation', 'NOT_RECORDED',
    '--evidence-ref', `${evidenceRef}-blocked`,
  ]),
  root,
  dependencies,
);
assert.equal(blocked.packet_status, 'BLOCKED');

const failedObservation = buildTransportEvidence(
  parseArgs([
    '--host', 'codex',
    '--record',
    '--resolved-source-sha', expectedSha,
    '--installed-product-version', expectedVersion,
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'FAIL',
    '--evidence-ref', `${evidenceRef}-failed`,
  ]),
  root,
  dependencies,
);
assert.equal(failedObservation.packet_status, 'FAIL');

const blockedVersion = buildTransportEvidence(
  parseArgs([
    '--host', 'codex',
    '--record',
    '--resolved-source-sha', expectedSha,
    '--installed-product-version', expectedVersion,
    '--installation', 'PASS',
    '--activation', 'PASS',
    '--invocation', 'PASS',
    '--evidence-ref', `${evidenceRef}-version-blocked`,
  ]),
  root,
  {
    resolveExecutable: () => null,
    probeVersion: () => ({ status: 'BLOCKED', version: null, exit_code: null, reason: 'BINARY_NOT_FOUND' }),
  },
);
assert.equal(blockedVersion.packet_status, 'INCOMPLETE');
assert.equal(blockedVersion.host_binary.version_probe.reason, 'BINARY_NOT_FOUND');

const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-transport-evidence-'));
try {
  const outputPath = path.join(outputRoot, 'nested', 'codex.json');
  assert.equal(validateOutputPath(outputPath), path.resolve(outputPath));
  assert.equal(fs.existsSync(path.dirname(outputPath)), true);
  fs.writeFileSync(outputPath, '{}\n', 'utf8');
  assert.throws(() => validateOutputPath(outputPath), /refusing overwrite/);
} finally {
  fs.rmSync(outputRoot, { recursive: true, force: true });
}

console.log('P0 transport evidence harness remains read-only/create-only and fails closed on missing or mismatched source identity');
