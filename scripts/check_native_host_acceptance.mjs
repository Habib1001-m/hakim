#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export const EXPECTED_HOSTS = Object.freeze([
  'codex',
  'claude-code',
  'github-copilot',
  'opencode',
]);

export const ALLOWED_HOST_STATUSES = Object.freeze([
  'PASS',
  'NOT_RUN',
  'FAIL',
  'BLOCKED',
]);

export function computeOverall(hosts) {
  const statuses = EXPECTED_HOSTS.map((host) => hosts?.[host]?.status);
  if (statuses.some((status) => status === 'FAIL')) return 'FAIL';
  if (statuses.every((status) => status === 'PASS')) return 'PASS';
  return 'HOLD_FOR_LIVE_HOST_EVIDENCE';
}

export function validateProjection(projection, productVersion) {
  const errors = [];
  if (projection?.schema_version !== 1) errors.push('schema_version must be 1');
  if (projection?.product_version !== productVersion) {
    errors.push(`product_version ${JSON.stringify(projection?.product_version)} != ${JSON.stringify(productVersion)}`);
  }
  if (projection?.scope !== 'current-native-product-paths') errors.push('scope must be current-native-product-paths');

  const hostKeys = Object.keys(projection?.hosts || {}).sort();
  const expectedKeys = [...EXPECTED_HOSTS].sort();
  if (JSON.stringify(hostKeys) !== JSON.stringify(expectedKeys)) {
    errors.push(`hosts ${JSON.stringify(hostKeys)} != ${JSON.stringify(expectedKeys)}`);
  }

  for (const host of EXPECTED_HOSTS) {
    const entry = projection?.hosts?.[host];
    if (!entry) continue;
    if (!ALLOWED_HOST_STATUSES.includes(entry.status)) errors.push(`${host} has invalid status ${JSON.stringify(entry.status)}`);
    if (typeof entry.product_path !== 'string' || !entry.product_path.trim()) errors.push(`${host} product_path must be nonempty`);

    if (entry.status === 'NOT_RUN') {
      if (entry.host_version !== null || entry.verified_at !== null || entry.evidence_ref !== null) {
        errors.push(`${host} NOT_RUN must not carry host_version, verified_at, or evidence_ref`);
      }
      continue;
    }

    if (typeof entry.host_version !== 'string' || !entry.host_version.trim()) errors.push(`${host} ${entry.status} requires host_version`);
    if (typeof entry.verified_at !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*Z)?$/.test(entry.verified_at)) {
      errors.push(`${host} ${entry.status} requires an ISO-like verified_at date/timestamp`);
    }
    if (typeof entry.evidence_ref !== 'string' || !entry.evidence_ref.trim()) errors.push(`${host} ${entry.status} requires evidence_ref`);
  }

  const expectedOverall = computeOverall(projection?.hosts || {});
  if (projection?.overall_status !== expectedOverall) {
    errors.push(`overall_status ${JSON.stringify(projection?.overall_status)} != computed ${JSON.stringify(expectedOverall)}`);
  }

  const serialized = JSON.stringify(projection);
  for (const stale of ['23/30', 'RUNTIME_VERDICTS=', 'PUBLIC_RELEASE_READINESS=HOLD']) {
    if (serialized.includes(stale)) errors.push(`legacy acceptance marker is forbidden: ${stale}`);
  }

  return {
    schema_version: projection?.schema_version ?? null,
    product_version: projection?.product_version ?? null,
    scope: projection?.scope ?? null,
    host_statuses: Object.fromEntries(EXPECTED_HOSTS.map((host) => [host, projection?.hosts?.[host]?.status ?? null])),
    overall_status: expectedOverall,
    ok: errors.length === 0,
    errors,
  };
}

function main() {
  const version = fs.readFileSync(path.join(ROOT, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
  const projection = JSON.parse(fs.readFileSync(path.join(ROOT, 'conformance', 'native-host-acceptance.json'), 'utf8'));
  const result = validateProjection(projection, version);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
