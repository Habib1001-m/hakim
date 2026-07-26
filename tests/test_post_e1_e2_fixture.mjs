#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E2 = path.join(ROOT, 'experiments/post-e1/e2');
const fixtureModule = await import(new URL('../experiments/post-e1/e2/src/rule-token.mjs', import.meta.url));
const { decodeRuleToken, encodeRuleToken } = fixtureModule;

const rule = {
  kind: 'allow',
  resource: 'invoices.read',
  expiresAt: 2_000_000_000,
};
const payload = Buffer.from(JSON.stringify(rule), 'utf8').toString('base64url');

const visible = spawnSync(process.execPath, ['--test', 'tests/rule-token.test.mjs'], {
  cwd: E2,
  encoding: 'utf8',
});
assert.equal(visible.status, 0, `E2 visible baseline tests must pass before execution:\n${visible.stdout}\n${visible.stderr}`);

assert.deepEqual(decodeRuleToken(encodeRuleToken(rule)), { ok: true, value: rule });

// The frozen pre-agent fixture must still contain the intended bug. If this starts
// passing on the phase branch, the candidate baseline has drifted and E2 is invalid.
assert.deepEqual(decodeRuleToken(`RULE:${payload}`), {
  ok: false,
  error: 'invalid token prefix',
});

for (const invalid of [
  { ...rule, kind: 'admin' },
  { ...rule, resource: '' },
  { ...rule, expiresAt: 0 },
  { ...rule, expiresAt: 1.5 },
]) {
  const invalidPayload = Buffer.from(JSON.stringify(invalid), 'utf8').toString('base64url');
  assert.deepEqual(decodeRuleToken(`rule:${invalidPayload}`), {
    ok: false,
    error: 'invalid rule payload',
  });
}

assert.deepEqual(decodeRuleToken(`other:${payload}`), {
  ok: false,
  error: 'invalid token prefix',
});
assert.deepEqual(decodeRuleToken('rule:not-json'), {
  ok: false,
  error: 'malformed rule token',
});

for (const required of [
  'TASK_PROMPT.txt',
  'README.md',
  'evaluator/hidden.test.mjs',
  'prepare.mjs',
]) {
  assert.ok(fs.statSync(path.join(E2, required)).isFile(), `missing frozen E2 artifact: ${required}`);
}

const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-e2-fixture-test-'));
const preparedRoot = path.join(tempParent, 'pair');
try {
  const prepared = spawnSync(process.execPath, [path.join(E2, 'prepare.mjs'), preparedRoot], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(prepared.status, 0, `E2 materializer must succeed:\n${prepared.stdout}\n${prepared.stderr}`);

  const manifest = JSON.parse(fs.readFileSync(path.join(preparedRoot, 'EXPERIMENT_INPUTS.json'), 'utf8'));
  assert.equal(manifest.experiment, 'POST-E1-E2');
  assert.equal(manifest.visible_baseline, 'PASS');
  assert.equal(manifest.hidden_guard_baseline, 'PASS');
  assert.equal(manifest.seeded_hidden_bug, 'PRESENT');
  assert.match(manifest.baseline_sha, /^[a-f0-9]{40}$/);
  assert.equal(
    spawnSync('git', ['-C', path.join(preparedRoot, 'control'), 'status', '--porcelain'], { encoding: 'utf8' }).stdout,
    '',
  );
  assert.equal(
    spawnSync('git', ['-C', path.join(preparedRoot, 'treatment'), 'status', '--porcelain'], { encoding: 'utf8' }).stdout,
    '',
  );
} finally {
  fs.rmSync(tempParent, { recursive: true, force: true });
}

console.log('test_post_e1_e2_fixture.mjs: frozen fixture, guards, seeded bug, and paired materializer OK');
