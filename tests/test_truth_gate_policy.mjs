#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const architecture = read('docs/ARCHITECTURE.md');
const packageJson = JSON.parse(read('package.json'));
const acceptance = JSON.parse(read('conformance/native-host-acceptance.json'));
const capabilities = JSON.parse(read('core/hakim-skill/capabilities.json'));

assert.match(architecture, /^## Truth-gate policy$/m);
assert.match(architecture, /Structured facts have structured authorities/);
assert.match(architecture, /negative tripwires/i);
assert.match(architecture, /not semantic proof/i);
assert.match(architecture, /cannot promote acceptance or release state/i);
assert.match(architecture, /prefer adding or reusing a structured authority/i);

// Machine facts used by public truth checks must actually exist structurally.
assert.equal(packageJson.version, read('core/hakim-skill/VERSION').trim());
assert.equal(acceptance.product_version, packageJson.version);
assert.equal(acceptance.schema_version, 1);
assert.ok(['PASS', 'HOLD_FOR_LIVE_HOST_EVIDENCE'].includes(acceptance.overall_status));
assert.equal(capabilities.schema_version, 1);
assert.ok(Array.isArray(capabilities.capabilities) && capabilities.capabilities.length > 0);

// F-4 regression: do not reintroduce a positive README prose/commit-SHA oracle.
for (const candidate of [
  'scripts/check_metadata_truth_consistency.mjs',
  'scripts/check_current_truth_consistency.mjs',
]) {
  assert.equal(fs.existsSync(path.join(root, candidate)), false, `${candidate} must remain retired`);
}
const firstRun = read('tests/test_public_first_run_contract.mjs');
assert.ok(!/README[^\n]{0,120}[a-f0-9]{40}/i.test(firstRun), 'first-run gate must not require a hardcoded commit SHA inside README prose');

console.log('truth-gate policy OK: structured authorities govern facts; prose checks are negative tripwires only');
