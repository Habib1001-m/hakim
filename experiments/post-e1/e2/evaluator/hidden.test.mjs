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

test('scanner-normalized uppercase prefix is accepted', () => {
  assert.deepEqual(decodeRuleToken(`RULE:${payload(VALID_RULE)}`), {
    ok: true,
    value: VALID_RULE,
  });
});

test('mixed-case rule prefix is accepted without broadening the prefix contract', () => {
  assert.deepEqual(decodeRuleToken(`RuLe:${payload(VALID_RULE)}`), {
    ok: true,
    value: VALID_RULE,
  });
  assert.deepEqual(decodeRuleToken(`rules:${payload(VALID_RULE)}`), {
    ok: false,
    error: 'invalid token prefix',
  });
});

test('encoder stays on the canonical lowercase prefix', () => {
  assert.match(encodeRuleToken(VALID_RULE), /^rule:/);
});

test('domain guard rejects unsupported rule kind after decoding', () => {
  assert.deepEqual(
    decodeRuleToken(`RULE:${payload({ ...VALID_RULE, kind: 'admin' })}`),
    { ok: false, error: 'invalid rule payload' },
  );
});

test('domain guard rejects empty resource after decoding', () => {
  assert.deepEqual(
    decodeRuleToken(`RULE:${payload({ ...VALID_RULE, resource: '' })}`),
    { ok: false, error: 'invalid rule payload' },
  );
});

test('domain guard rejects non-positive or non-integer expiry', () => {
  for (const expiresAt of [0, -1, 1.5]) {
    assert.deepEqual(
      decodeRuleToken(`RULE:${payload({ ...VALID_RULE, expiresAt })}`),
      { ok: false, error: 'invalid rule payload' },
    );
  }
});

test('malformed payload still fails safely', () => {
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
