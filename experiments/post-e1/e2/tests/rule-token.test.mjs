import assert from 'node:assert/strict';
import test from 'node:test';

import { decodeRuleToken, encodeRuleToken } from '../src/rule-token.mjs';

const RULE = {
  kind: 'allow',
  resource: 'invoices.read',
  expiresAt: 2_000_000_000,
};

test('lowercase rule token round-trips', () => {
  const token = encodeRuleToken(RULE);
  assert.match(token, /^rule:/);
  assert.deepEqual(decodeRuleToken(token), { ok: true, value: RULE });
});

test('wrong token prefix is rejected', () => {
  const payload = Buffer.from(JSON.stringify(RULE), 'utf8').toString('base64url');
  assert.deepEqual(decodeRuleToken(`other:${payload}`), {
    ok: false,
    error: 'invalid token prefix',
  });
});

test('decoded payload must still satisfy the rule domain', () => {
  const invalid = {
    kind: 'admin',
    resource: 'invoices.read',
    expiresAt: 2_000_000_000,
  };
  const payload = Buffer.from(JSON.stringify(invalid), 'utf8').toString('base64url');
  assert.deepEqual(decodeRuleToken(`rule:${payload}`), {
    ok: false,
    error: 'invalid rule payload',
  });
});

test('malformed token fails safely', () => {
  assert.deepEqual(decodeRuleToken('rule:not-json'), {
    ok: false,
    error: 'malformed rule token',
  });
});
