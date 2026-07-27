const PREFIX = 'rule:';
const ALLOWED_KINDS = new Set(['allow', 'deny']);

function isRuleRecord(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  return ALLOWED_KINDS.has(value.kind)
    && typeof value.resource === 'string'
    && value.resource.length > 0
    && Number.isInteger(value.expiresAt)
    && value.expiresAt > 0;
}

export function encodeRuleToken(rule) {
  if (!isRuleRecord(rule)) {
    throw new TypeError('rule must contain a valid kind, resource, and expiresAt');
  }

  const payload = Buffer.from(JSON.stringify(rule), 'utf8').toString('base64url');
  return `${PREFIX}${payload}`;
}

export function decodeRuleToken(token) {
  if (typeof token !== 'string' || !token.startsWith(PREFIX)) {
    return { ok: false, error: 'invalid token prefix' };
  }

  const payload = token.slice(PREFIX.length);

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded);

    if (!isRuleRecord(parsed)) {
      return { ok: false, error: 'invalid rule payload' };
    }

    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: 'malformed rule token' };
  }
}
