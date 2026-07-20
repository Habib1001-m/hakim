#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  buildGuardianReport,
  formatText,
  parseArgs,
  parseUnifiedDiff,
} from '../scripts/hakim_pr_guardian.mjs';

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function commit(root, message) {
  git(root, ['add', '--all']);
  git(root, ['commit', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

function options(root, baseSha, headSha, pr = 7) {
  return {
    repository: 'example/repo',
    pr,
    baseSha,
    headSha,
    cwd: root,
    json: false,
    help: false,
  };
}

function acceptedEvidence(claimId, claimText) {
  return `${JSON.stringify({
    schema_version: 1,
    claims: {
      [claimId]: {
        status: 'ACCEPTED',
        claim_text: claimText,
        limitations: ['Accepted only within the named evidence boundary.'],
        evidence_refs: ['fixture://accepted-proof'],
      },
    },
  }, null, 2)}\n`;
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-pr-guardian-'));
try {
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.name', 'Hakim Test']);
  git(root, ['config', 'user.email', 'hakim@example.invalid']);
  git(root, ['remote', 'add', 'origin', 'https://github.com/example/repo.git']);

  write(root, 'package.json', `${JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    private: true,
    engines: { node: '>=18' },
  }, null, 2)}\n`);
  write(root, 'README.md', '# Fixture\n\nEvidence-bound baseline.\n');
  write(root, 'src/index.js', 'export const answer = 42;\n');
  const baseSha = commit(root, 'base');

  write(root, 'package.json', `${JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    private: true,
    engines: { node: '>=18' },
    dependencies: { 'left-pad': '1.3.0' },
  }, null, 2)}\n`);
  write(root, 'README.md', '# Fixture\n\nEvidence-bound baseline.\n\nHakim is enterprise-grade and production-ready.\n');
  write(root, 'docs/evidence/unrelated.json', '{"schema_version":1,"claims":{}}\n');
  const findingsHead = commit(root, 'add unsupported dependency claim and unrelated evidence');

  const statusBefore = git(root, ['status', '--porcelain=v1']);
  const report = buildGuardianReport(options(root, baseSha, findingsHead));
  const statusAfter = git(root, ['status', '--porcelain=v1']);

  assert.equal(statusBefore, statusAfter);
  assert.equal(report.schema_version, 2);
  assert.equal(report.mode, 'READ_ONLY');
  assert.equal(report.mutation_performed, false);
  assert.equal(report.blocking, false);
  assert.equal(report.scope.repository, 'example/repo');
  assert.equal(report.scope.pull_request, 7);
  assert.equal(report.scope.base_sha, baseSha);
  assert.equal(report.scope.head_sha, findingsHead);
  assert.equal(report.scope.fallback_used, false);
  assert.deepEqual(report.coverage.enabled_rule_ids, [
    'new-direct-dependency',
    'unsupported-claim-without-linked-evidence',
  ]);
  assert.equal(report.coverage.correctness_review, 'NOT_PERFORMED');
  assert.equal(report.coverage.security_review, 'NOT_PERFORMED');
  assert.equal(report.coverage.semantic_code_review, 'NOT_PERFORMED');
  assert.equal(report.review.outcome, 'ADVISORY_FINDINGS');
  assert.equal(report.review.findings_count, 2);
  assert.deepEqual(report.review.findings.map((finding) => finding.tag), ['dependency', 'claim']);
  assert.equal(report.review.findings[1].evidence.status, 'MISSING');
  assert.equal(report.claim_evidence.claims_evaluated, 1);
  assert.equal(report.claim_evidence.accepted_links, 0);
  assert.equal(report.claim_evidence.rejected_links, 1);
  for (const finding of report.review.findings) {
    assert.ok(finding.rule_id);
    assert.ok(finding.file);
    assert.ok(Number.isInteger(finding.line) && finding.line > 0);
    assert.ok(finding.what);
    assert.ok(finding.replacement);
  }

  const findingsText = formatText(report);
  assert.match(findingsText, /ENABLED_RULES=new-direct-dependency,unsupported-claim-without-linked-evidence/);
  assert.match(findingsText, /CORRECTNESS_REVIEW=NOT_PERFORMED/);
  assert.match(findingsText, /SECURITY_REVIEW=NOT_PERFORMED/);
  assert.match(findingsText, /package\.json:L\d+ dependency:/);
  assert.match(findingsText, /README\.md:L\d+ claim:/);
  assert.doesNotMatch(findingsText, /Lean already\. Ship\./);

  const linkedClaim = 'Hakim is enterprise-grade and production-ready.';
  write(
    root,
    'README.md',
    `# Fixture\n\n${linkedClaim} <!-- hakim-evidence: docs/evidence/release.json#release-ready -->\n`,
  );
  write(root, 'docs/evidence/release.json', acceptedEvidence('release-ready', linkedClaim));
  const acceptedHead = commit(root, 'add one claim with exact linked evidence');
  const accepted = buildGuardianReport(options(root, findingsHead, acceptedHead, 8));
  assert.equal(accepted.review.findings_count, 0);
  assert.equal(accepted.review.outcome, 'NO_FINDINGS_FROM_ENABLED_RULES');
  assert.equal(accepted.claim_evidence.claims_evaluated, 1);
  assert.equal(accepted.claim_evidence.accepted_links, 1);
  assert.equal(accepted.claim_evidence.rejected_links, 0);
  assert.equal(accepted.claim_evidence.validations[0].evidence.status, 'ACCEPTED');
  const acceptedText = formatText(accepted);
  assert.match(acceptedText, /OUTCOME=NO_FINDINGS_FROM_ENABLED_RULES/);
  assert.match(acceptedText, /No findings from enabled deterministic rules\./);
  assert.match(acceptedText, /Correctness and security review were not performed\./);
  assert.doesNotMatch(acceptedText, /\bShip\b/);

  write(
    root,
    'README.md',
    '# Fixture\n\nHakim is production-ready. <!-- hakim-evidence: docs/evidence/release.json#release-ready -->\n',
  );
  write(root, 'docs/evidence/other.json', acceptedEvidence('other', 'Unrelated accepted statement.'));
  const staleLinkHead = commit(root, 'change claim but only unrelated evidence');
  const staleLink = buildGuardianReport(options(root, acceptedHead, staleLinkHead, 9));
  assert.equal(staleLink.review.findings_count, 1);
  assert.equal(staleLink.review.findings[0].evidence.status, 'NOT_CHANGED');

  write(
    root,
    'README.md',
    '# Fixture\n\nHakim is production-ready with enterprise controls. <!-- hakim-evidence: docs/evidence/release.json#release-ready -->\n\nHakim is enterprise-grade.\n',
  );
  write(root, 'docs/evidence/release.json', acceptedEvidence('release-ready', 'Hakim is production-ready with enterprise controls.'));
  const partialEvidenceHead = commit(root, 'support one claim but leave another unsupported');
  const partialEvidence = buildGuardianReport(options(root, staleLinkHead, partialEvidenceHead, 10));
  assert.equal(partialEvidence.claim_evidence.claims_evaluated, 2);
  assert.equal(partialEvidence.claim_evidence.accepted_links, 1);
  assert.equal(partialEvidence.claim_evidence.rejected_links, 1);
  assert.equal(partialEvidence.review.findings_count, 1);
  assert.match(partialEvidence.review.findings[0].what, /MISSING/);

  write(
    root,
    'README.md',
    '# Fixture\n\nHakim is production-ready. <!-- hakim-evidence: ../outside.json#bad -->\n',
  );
  const malformedHead = commit(root, 'add malformed claim link');
  const malformed = buildGuardianReport(options(root, partialEvidenceHead, malformedHead, 11));
  assert.equal(malformed.review.findings_count, 1);
  assert.equal(malformed.review.findings[0].evidence.status, 'MALFORMED');

  write(root, 'src/clean.js', 'export const clean = true;\n');
  const cleanHead = commit(root, 'add lean code');
  const clean = buildGuardianReport(options(root, malformedHead, cleanHead, 12));
  assert.equal(clean.review.findings_count, 0);
  assert.equal(clean.review.outcome, 'NO_FINDINGS_FROM_ENABLED_RULES');
  assert.equal(clean.claim_evidence.claims_evaluated, 0);
  assert.match(formatText(clean), /CORRECTNESS_REVIEW=NOT_PERFORMED/);
  assert.match(formatText(clean), /SECURITY_REVIEW=NOT_PERFORMED/);

  assert.throws(
    () => parseArgs(['--repository', 'example/repo', '--pr', '1', '--base-sha', 'abc', '--head-sha', cleanHead]),
    /full lowercase 40-character commit SHA/,
  );
  assert.throws(() => parseArgs(['--apply']), /read-only/);
  assert.throws(
    () => buildGuardianReport({ ...options(root, malformedHead, cleanHead), repository: 'other/repo' }),
    /repository scope mismatch/,
  );
  assert.throws(
    () => parseArgs([
      '--repository', 'example/repo',
      '--pr', '1',
      '--base-sha', baseSha,
      '--head-sha', baseSha,
    ]),
    /different commits/,
  );

  const parsed = parseUnifiedDiff([
    'diff --git a/demo.js b/demo.js',
    '--- a/demo.js',
    '+++ b/demo.js',
    '@@ -1,1 +1,2 @@',
    ' const a = 1;',
    '+const b = 2;',
  ].join('\n'));
  assert.deepEqual(parsed[0].added, [{ line: 2, text: 'const b = 2;' }]);

  console.log('PR Guardian reports bounded rule coverage and validates evidence per claim without unrelated-path bypass');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
