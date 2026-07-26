#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E2 = path.join(ROOT, 'experiments/post-e1/e2');
const fixtureModule = await import(fileURLToPath(new URL('../experiments/post-e1/e2/src/rule-token.mjs', import.meta.url)));
const { decodeRuleToken, encodeRuleToken } = fixtureModule;

const rule = {
  kind: 'allow',
  resource: 'invoices.read',
  expiresAt: 2_000_000_000,
};
const payload = Buffer.from(JSON.stringify(rule), 'utf8').toString('base64url');

const visible = spawnSync(process.execPath, ['--test', 'tests/*.test.mjs'], {
  cwd: E2,
  encoding: 'utf8',
  shell: true,
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
]) {
  assert.ok(fs.statSync(path.join(E2, required)).isFile(), `missing frozen E2 artifact: ${required}`);
}

console.log('test_post_e1_e2_fixture.mjs: visible baseline green, seeded bug present, domain guards intact');
