import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_HOSTS,
  computeOverall,
  validateProjection,
} from '../scripts/check_native_host_acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = fs.readFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
const projection = JSON.parse(fs.readFileSync(path.join(root, 'conformance', 'native-host-acceptance.json'), 'utf8'));
const beta1History = JSON.parse(fs.readFileSync(path.join(root, 'conformance', 'history', 'native-host-acceptance-1.0.0-beta.1.json'), 'utf8'));

const current = validateProjection(projection, version);
assert.equal(current.ok, true, current.errors.join('\n'));
assert.equal(current.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
assert.deepEqual(Object.keys(projection.hosts).sort(), [...EXPECTED_HOSTS].sort());

for (const host of EXPECTED_HOSTS) {
  assert.equal(projection.hosts[host].status, 'NOT_RUN');
  assert.equal(projection.hosts[host].host_version, null);
  assert.equal(projection.hosts[host].verified_at, null);
  assert.equal(projection.hosts[host].evidence_ref, null);
}
assert.match(projection.source_policy, /beta\.1 evidence is preserved under conformance\/history/i);

const historical = validateProjection(beta1History, '1.0.0-beta.1');
assert.equal(historical.ok, true, historical.errors.join('\n'));
assert.equal(historical.overall_status, 'PASS');
for (const host of EXPECTED_HOSTS) assert.equal(beta1History.hosts[host].status, 'PASS');
assert.equal(beta1History.hosts.opencode.host_version, '1.17.13');
assert.equal(beta1History.hosts.opencode.verified_at, '2026-07-26');
assert.equal(
  beta1History.hosts.opencode.evidence_ref,
  'https://github.com/Habib1001-m/hakim/pull/21#issuecomment-5080940335',
);

const accepted = structuredClone(projection);
for (const host of EXPECTED_HOSTS) {
  accepted.hosts[host] = {
    ...accepted.hosts[host],
    status: 'PASS',
    host_version: 'test-host-1.0.0',
    verified_at: '2026-07-27',
    evidence_ref: `public-evidence:${host}`,
  };
}
accepted.overall_status = computeOverall(accepted.hosts);
const acceptedResult = validateProjection(accepted, version);
assert.equal(acceptedResult.ok, true, acceptedResult.errors.join('\n'));
assert.equal(acceptedResult.overall_status, 'PASS');

const unsupportedPass = structuredClone(accepted);
unsupportedPass.hosts.codex.evidence_ref = null;
const unsupportedPassResult = validateProjection(unsupportedPass, version);
assert.equal(unsupportedPassResult.ok, false);
assert.ok(unsupportedPassResult.errors.some((error) => /codex PASS requires evidence_ref/.test(error)));

const legacy = structuredClone(projection);
legacy.source_policy = 'legacy 23/30 evidence';
const legacyResult = validateProjection(legacy, version);
assert.equal(legacyResult.ok, false);
assert.ok(legacyResult.errors.some((error) => /legacy acceptance marker/.test(error)));

console.log('native host acceptance projection preserves current-candidate truth while retaining prior accepted evidence historically');
