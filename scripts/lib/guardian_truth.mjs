import path from 'node:path';

const DEPENDENCY_GROUPS = Object.freeze([
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]);
const IMPACT_ORDER = Object.freeze({ dependency: 0, claim: 1 });
const EVIDENCE_MARKER = /<!--\s*hakim-evidence:\s*([^#\s]+)#([A-Za-z0-9_.-]+)\s*-->/g;

export const TAXONOMY = Object.freeze([
  'delete', 'reuse', 'stdlib', 'native', 'dependency', 'yagni', 'shrink', 'claim',
]);

export const ENABLED_RULES = Object.freeze([
  Object.freeze({
    id: 'new-direct-dependency',
    tag: 'dependency',
    status: 'ENABLED',
    coverage: 'New direct package.json dependency entries with an added manifest line.',
  }),
  Object.freeze({
    id: 'unsupported-claim-without-linked-evidence',
    tag: 'claim',
    status: 'ENABLED',
    coverage: 'Added high-risk product claims unless the same line links one changed, valid, accepted evidence record.',
  }),
]);

export function parseUnifiedDiff(diffText) {
  const files = [];
  let file = null;
  let oldLine = 0;
  let newLine = 0;
  for (const rawLine of diffText.split('\n')) {
    if (rawLine.startsWith('diff --git ')) {
      file = { path: null, added: [], deleted: false };
      files.push(file);
      continue;
    }
    if (!file) continue;
    if (rawLine.startsWith('+++ ')) {
      const target = rawLine.slice(4);
      if (target === '/dev/null') file.deleted = true;
      else file.path = target.startsWith('b/') ? target.slice(2) : target;
      continue;
    }
    const hunk = rawLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }
    if (!file.path || file.deleted || rawLine.startsWith('--- ')) continue;
    if (rawLine.startsWith('+')) {
      file.added.push({ line: newLine, text: rawLine.slice(1) });
      newLine += 1;
    } else if (rawLine.startsWith('-')) {
      oldLine += 1;
    } else if (rawLine.startsWith(' ')) {
      oldLine += 1;
      newLine += 1;
    }
  }
  return files.filter((entry) => entry.path);
}

function directDependencies(text) {
  if (text === null) return new Map();
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    return new Map();
  }
  const result = new Map();
  for (const group of DEPENDENCY_GROUPS) {
    for (const [name, version] of Object.entries(manifest[group] || {})) {
      result.set(`${group}:${name}`, { group, name, version: String(version) });
    }
  }
  return result;
}

function dependencyFindings({ baseSha, headSha, files, readAt }) {
  const findings = [];
  for (const file of files.filter((entry) => entry.path.endsWith('package.json'))) {
    const before = directDependencies(readAt(baseSha, file.path));
    const after = directDependencies(readAt(headSha, file.path));
    for (const [key, dependency] of after) {
      if (before.has(key)) continue;
      const escaped = dependency.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const evidence = file.added.find((entry) => (
        new RegExp(`^[\\s]*["']${escaped}["']\\s*:`).test(entry.text)
      ));
      if (!evidence) continue;
      findings.push({
        rule_id: 'new-direct-dependency',
        tag: 'dependency',
        file: file.path,
        line: evidence.line,
        impact: 'high',
        what: `new direct ${dependency.group} entry ${dependency.name}@${dependency.version} adds maintenance and supply-chain surface without proof in the diff that existing code, the standard library, or the native platform is insufficient`,
        replacement: 'reuse an existing capability or implement the smallest clear native/stdlib solution; retain the dependency only with repository evidence that it is necessary',
        estimated_lines: 1,
      });
    }
  }
  return findings;
}

function isDocumentation(filename) {
  return /(?:^|\/)(?:README|CHANGELOG|SECURITY|KNOWN_LIMITATIONS|VERSIONING)(?:\.[^/]+)?$/i.test(filename)
    || /\.(?:md|mdx|rst|txt)$/i.test(filename);
}

function claimReason(text) {
  const value = text.trim();
  if (!value || value.startsWith('```') || value.startsWith('>')) return null;
  if (/enterprise[- ]grade|production[- ]ready/i.test(value)) return 'maturity claim';
  if (/PUBLIC_RELEASE_READINESS\s*=\s*(?:PASS|READY)|public release ready/i.test(value)) return 'public-release claim';
  if (/\b30\/30\b.*(?:complete|full|pass)|(?:complete|full).*\b30\/30\b/i.test(value)) return 'complete cross-host claim';
  if (/\b\d+(?:\.\d+)?%\b.*(?:faster|reduction|improvement|less|lower|saved|saving)/i.test(value)) return 'quantified performance claim';
  if (/benchmark.*\b\d+(?:\.\d+)?%\b/i.test(value)) return 'quantified benchmark claim';
  return null;
}

function normalizeEvidencePath(value) {
  const normalized = String(value || '').replaceAll('\\', '/');
  if (!normalized || path.posix.isAbsolute(normalized)) return null;
  const clean = path.posix.normalize(normalized);
  if (clean === '..' || clean.startsWith('../') || clean.includes('/../')) return null;
  if (!clean.endsWith('.json')) return null;
  if (!/(^|\/)evidence\//i.test(clean)) return null;
  return clean;
}

function evidenceMarkers(text) {
  return [...String(text).matchAll(EVIDENCE_MARKER)].map((match) => ({
    raw: match[0],
    path: match[1],
    claim_id: match[2],
  }));
}

function claimTextWithoutMarker(text) {
  return String(text).replace(EVIDENCE_MARKER, '').trim();
}

function validation(status, marker, errors) {
  return {
    status,
    linked: status !== 'MISSING',
    accepted: status === 'ACCEPTED',
    path: marker?.path || null,
    claim_id: marker?.claim_id || null,
    errors,
  };
}

function validateClaimEvidence({ headSha, files, added, readAt }) {
  const markers = evidenceMarkers(added.text);
  if (markers.length === 0) return validation('MISSING', null, ['claim line has no hakim-evidence marker']);
  if (markers.length !== 1) return validation('MALFORMED', null, ['claim line must contain exactly one hakim-evidence marker']);
  const marker = markers[0];
  const evidencePath = normalizeEvidencePath(marker.path);
  if (!evidencePath) {
    return validation('MALFORMED', marker, ['evidence path must be repository-relative JSON under an evidence directory']);
  }
  marker.path = evidencePath;
  if (!new Set(files.map((file) => file.path)).has(evidencePath)) {
    return validation('NOT_CHANGED', marker, ['linked evidence file is not changed in the inspected PR range']);
  }
  const text = readAt(headSha, evidencePath);
  if (text === null) return validation('MISSING_TARGET', marker, ['linked evidence file does not exist at head']);

  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    return validation('INVALID_JSON', marker, [`linked evidence is invalid JSON: ${error.message}`]);
  }

  const record = document?.schema_version === 1 ? document?.claims?.[marker.claim_id] : null;
  const errors = [];
  if (document?.schema_version !== 1) errors.push('evidence schema_version must equal 1');
  if (!record || typeof record !== 'object' || Array.isArray(record)) errors.push('claim record is missing');
  if (record?.status !== 'ACCEPTED') errors.push('claim record status must be ACCEPTED');
  if (record?.claim_text !== claimTextWithoutMarker(added.text)) {
    errors.push('claim_text must exactly match the added claim line without the marker');
  }
  if (!Array.isArray(record?.limitations) || record.limitations.length === 0
      || record.limitations.some((value) => typeof value !== 'string' || !value.trim())) {
    errors.push('claim record must include at least one non-empty limitation');
  }
  if (!Array.isArray(record?.evidence_refs) || record.evidence_refs.length === 0
      || record.evidence_refs.some((value) => typeof value !== 'string' || !value.trim())) {
    errors.push('claim record must include at least one non-empty evidence_ref');
  }
  return validation(errors.length === 0 ? 'ACCEPTED' : 'INVALID_RECORD', marker, errors);
}

function claimReview({ headSha, files, readAt }) {
  const findings = [];
  const validations = [];
  for (const file of files.filter((entry) => isDocumentation(entry.path))) {
    for (const added of file.added) {
      const reason = claimReason(added.text);
      if (!reason) continue;
      const evidence = validateClaimEvidence({ headSha, files, added, readAt });
      validations.push({
        claim_file: file.path,
        claim_line: added.line,
        claim_type: reason,
        evidence,
      });
      if (evidence.accepted) continue;
      findings.push({
        rule_id: 'unsupported-claim-without-linked-evidence',
        tag: 'claim',
        file: file.path,
        line: added.line,
        impact: 'medium',
        what: `${reason} lacks one changed, valid, claim-linked accepted evidence record (${evidence.status})`,
        replacement: 'state the narrower implemented fact or add one same-line hakim-evidence marker whose changed JSON record exactly matches the claim and records limitations',
        estimated_lines: 1,
        evidence,
      });
    }
  }
  return { findings, validations };
}

function sortFindings(findings) {
  return [...findings].sort((left, right) => (
    (IMPACT_ORDER[left.tag] ?? 99) - (IMPACT_ORDER[right.tag] ?? 99)
    || left.file.localeCompare(right.file)
    || left.line - right.line
  ));
}

export function reviewDiff({ baseSha, headSha, diffText, readAt }) {
  const files = parseUnifiedDiff(diffText);
  const claims = claimReview({ headSha, files, readAt });
  const findings = sortFindings([
    ...dependencyFindings({ baseSha, headSha, files, readAt }),
    ...claims.findings,
  ]);
  return { files, findings, claim_evidence_validations: claims.validations };
}
