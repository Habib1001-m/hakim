import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CHECK_DEFINITIONS,
  buildReport,
  formatText,
  parseArgs,
  readNativeAcceptance,
  selectChecks,
} from '../scripts/hakim_doctor.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(CHECK_DEFINITIONS.length, 6);
assert.equal(
  new Set(CHECK_DEFINITIONS.map((item) => item.id)).size,
  CHECK_DEFINITIONS.length,
);
assert.equal(selectChecks(true).length, 6);
assert.equal(selectChecks(false).length, 6);
assert.ok(selectChecks(true).every((item) => item.tier === 'integration'));
assert.ok(!selectChecks(false).some((item) => item.id === 'runtime_readiness'));
assert.ok(selectChecks(false).some((item) => item.id === 'native_host_acceptance_projection'));

assert.deepEqual(parseArgs([]), {
  json: false,
  fast: false,
  help: false,
});
assert.deepEqual(parseArgs(['--json']), {
  json: true,
  fast: false,
  help: false,
});
assert.deepEqual(parseArgs(['--fast', '--json']), {
  json: true,
  fast: true,
  help: false,
});
assert.throws(() => parseArgs(['--write']), /unknown option/);

const passingResults = CHECK_DEFINITIONS.map((definition) => ({
  id: definition.id,
  tier: definition.tier,
  status: 'PASS',
  exit_code: 0,
  command: `node ${definition.script}`,
  diagnostics: [],
  data: { ok: true },
}));

const nativeAcceptance = readNativeAcceptance(repoRoot);
assert.equal(nativeAcceptance.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');

const report = buildReport(passingResults, '1.0.0-beta.1', 'FULL', nativeAcceptance);
assert.equal(report.mode, 'READ_ONLY');
assert.equal(report.repository_health, 'PASS');
assert.deepEqual(report.check_summary, {
  passed: 6,
  total: 6,
  failed: [],
});
assert.equal(report.runtime.acceptance_status, 'OUT_OF_SCOPE_PUBLIC_REPOSITORY');
assert.equal(report.runtime.accepted_verdicts, null);
assert.equal(report.public_release_readiness, 'OUT_OF_SCOPE_PUBLIC_REPOSITORY');
assert.equal(report.native_host_acceptance.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
assert.equal(report.external_beta_promotion, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
assert.match(report.next_safe_action, /native host acceptance journeys/);

const text = formatText(report);
assert.match(text, /MODE=READ_ONLY/);
assert.match(text, /CHECKS=6\/6 PASS/);
assert.match(text, /RUNTIME_ACCEPTANCE=OUT_OF_SCOPE_PUBLIC_REPOSITORY/);
assert.match(text, /PUBLIC_RELEASE_READINESS=OUT_OF_SCOPE_PUBLIC_REPOSITORY/);
assert.match(text, /NATIVE_HOST_ACCEPTANCE=HOLD_FOR_LIVE_HOST_EVIDENCE/);
assert.match(text, /EXTERNAL_BETA_PROMOTION=HOLD_FOR_LIVE_HOST_EVIDENCE/);

const help = spawnSync(
  process.execPath,
  ['scripts/hakim_doctor.mjs', '--help'],
  {
    cwd: repoRoot,
    encoding: 'utf8',
  },
);

assert.equal(help.status, 0, help.stderr);
assert.match(help.stdout, /npm run doctor/);
assert.match(help.stdout, /read-only mode/);
assert.match(help.stdout, /outside the public/);
assert.match(help.stdout, /native live-host status/);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
);

assert.equal(
  packageJson.scripts.doctor,
  'node scripts/hakim_doctor.mjs',
);
assert.equal(
  packageJson.scripts['doctor:json'],
  'node scripts/hakim_doctor.mjs --json',
);
assert.equal(
  packageJson.scripts['doctor:fast'],
  'node scripts/hakim_doctor.mjs --fast --json',
);

console.log('public Hakim doctor separates repository health, private acceptance, and current native live-host evidence');
