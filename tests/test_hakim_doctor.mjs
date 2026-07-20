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
  selectChecks,
} from '../scripts/hakim_doctor.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(CHECK_DEFINITIONS.length, 5);
assert.equal(
  new Set(CHECK_DEFINITIONS.map((item) => item.id)).size,
  CHECK_DEFINITIONS.length,
);
assert.equal(selectChecks(true).length, 5);
assert.equal(selectChecks(false).length, 5);
assert.ok(selectChecks(true).every((item) => item.tier === 'integration'));
assert.ok(!selectChecks(false).some((item) => item.id === 'runtime_readiness'));

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

const report = buildReport(passingResults, '1.0.0', 'FULL');
assert.equal(report.mode, 'READ_ONLY');
assert.equal(report.repository_health, 'PASS');
assert.deepEqual(report.check_summary, {
  passed: 5,
  total: 5,
  failed: [],
});
assert.equal(report.runtime.acceptance_status, 'NOT_EVALUATED');
assert.equal(report.runtime.accepted_verdicts, null);
assert.equal(report.public_release_readiness, 'NOT_EVALUATED');
assert.match(report.next_safe_action, /npm test/);

const text = formatText(report);
assert.match(text, /MODE=READ_ONLY/);
assert.match(text, /CHECKS=5\/5 PASS/);
assert.match(text, /RUNTIME_ACCEPTANCE=NOT_EVALUATED/);
assert.match(text, /PUBLIC_RELEASE_READINESS=NOT_EVALUATED/);

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

console.log('public Hakim doctor preserves bounded read-only repository checks');
