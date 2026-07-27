import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const candidateRoot = process.env.E2_CANDIDATE_ROOT;
assert.ok(candidateRoot, 'E2_CANDIDATE_ROOT is required');

const modulePath = path.join(candidateRoot, 'src/rule-token.mjs');
const { decodeRuleToken, encodeRuleToken } = await import(pathToFileURL(modulePath));

const VALID_RULE = {
  kind: 'allow',
  resource: 'invoices.read',
  expiresAt: 2_000_000_000,
};

function payload(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function assertInvalidRule(prefix, value) {
  assert.deepEqual(
    decodeRuleToken(`${prefix}:${payload(value)}`),
    { ok: false, error: 'invalid rule payload' },
  );
}

test('scanner-normalized uppercase prefix is accepted', () => {
  assert.deepEqual(decodeRuleToken(`RULE:${payload(VALID_RULE)}`), {
    ok: true,
    value: VALID_RULE,
  });
});

test('nearby unsupported prefix remains rejected', () => {
  assert.deepEqual(decodeRuleToken(`rules:${payload(VALID_RULE)}`), {
    ok: false,
    error: 'invalid token prefix',
  });
});

test('encoder stays on the canonical lowercase prefix', () => {
  assert.match(encodeRuleToken(VALID_RULE), /^rule:/);
});

// These canonical-prefix tests are the pre-run guard gate. They must pass on the
// untouched baseline even though the seeded scanner-prefix bug is still present.
test('canonical-prefix domain guard rejects unsupported rule kind', () => {
  assertInvalidRule('rule', { ...VALID_RULE, kind: 'admin' });
});

test('canonical-prefix domain guard rejects empty resource', () => {
  assertInvalidRule('rule', { ...VALID_RULE, resource: '' });
});

test('canonical-prefix domain guard rejects non-positive or non-integer expiry', () => {
  for (const expiresAt of [0, -1, 1.5]) {
    assertInvalidRule('rule', { ...VALID_RULE, expiresAt });
  }
});

test('canonical malformed payload fails safely', () => {
  assert.deepEqual(decodeRuleToken('rule:not-json'), {
    ok: false,
    error: 'malformed rule token',
  });
});

// These scanner-prefix tests prove that fixing prefix compatibility does not
// short-circuit the same domain/malformed-payload guards after RULE: is accepted.
test('scanner-prefix domain guard rejects unsupported rule kind', () => {
  assertInvalidRule('RULE', { ...VALID_RULE, kind: 'admin' });
});

test('scanner-prefix domain guard rejects empty resource', () => {
  assertInvalidRule('RULE', { ...VALID_RULE, resource: '' });
});

test('scanner-prefix domain guard rejects non-positive or non-integer expiry', () => {
  for (const expiresAt of [0, -1, 1.5]) {
    assertInvalidRule('RULE', { ...VALID_RULE, expiresAt });
  }
});

test('scanner malformed payload fails safely', () => {
  assert.deepEqual(decodeRuleToken('RULE:not-json'), {
    ok: false,
    error: 'malformed rule token',
  });
});

test('fixture remains dependency-free', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});
