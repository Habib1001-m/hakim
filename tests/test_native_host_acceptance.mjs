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
assert.equal(current.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
assert.deepEqual(Object.keys(projection.hosts).sort(), [...EXPECTED_HOSTS].sort());
assert.ok(EXPECTED_HOSTS.every((host) => projection.hosts[host].status === 'NOT_RUN'));

const accepted = structuredClone(projection);
for (const host of EXPECTED_HOSTS) {
  accepted.hosts[host] = {
    ...accepted.hosts[host],
    status: 'PASS',
    host_version: 'test-host-1.0.0',
    verified_at: '2026-07-24',
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

console.log('native host acceptance projection preserves current-product live-evidence boundaries');
