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

const current = validateProjection(projection, version);
assert.equal(current.ok, true, current.errors.join('\n'));
assert.equal(current.overall_status, 'PASS');
assert.deepEqual(Object.keys(projection.hosts).sort(), [...EXPECTED_HOSTS].sort());

for (const host of EXPECTED_HOSTS) {
  assert.equal(projection.hosts[host].status, 'PASS');
  assert.equal(typeof projection.hosts[host].host_version, 'string');
  assert.ok(projection.hosts[host].host_version.length > 0);
  assert.equal(typeof projection.hosts[host].verified_at, 'string');
  assert.ok(projection.hosts[host].verified_at.length > 0);
  assert.equal(typeof projection.hosts[host].evidence_ref, 'string');
  assert.ok(projection.hosts[host].evidence_ref.length > 0);
}

assert.match(projection.hosts.opencode.product_path, /managed project-local install\/adopt\/upgrade/);
assert.equal(projection.hosts.opencode.host_version, '1.18.5');
assert.equal(projection.hosts.opencode.verified_at, '2026-07-25T19:10:17.917Z');
assert.equal(
  projection.hosts.opencode.evidence_ref,
  'https://github.com/Habib1001-m/hakim/issues/18#issuecomment-5080155506',
);
assert.ok(!JSON.stringify(projection.hosts.opencode).includes('5078407875'), 'current OpenCode path must not reuse earlier evidence');

const blank = structuredClone(projection);
for (const host of EXPECTED_HOSTS) {
  blank.hosts[host] = {
    ...blank.hosts[host],
    status: 'NOT_RUN',
    host_version: null,
    verified_at: null,
    evidence_ref: null,
  };
}
blank.overall_status = computeOverall(blank.hosts);
const blankResult = validateProjection(blank, version);
assert.equal(blankResult.ok, true, blankResult.errors.join('\n'));
assert.equal(blankResult.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');

const accepted = structuredClone(projection);
for (const host of EXPECTED_HOSTS) {
  accepted.hosts[host] = {
    ...accepted.hosts[host],
    status: 'PASS',
    host_version: 'test-host-1.0.0',
    verified_at: '2026-07-25',
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

console.log('native host acceptance projection preserves current-path evidence boundaries and accepted hardened OpenCode state');
