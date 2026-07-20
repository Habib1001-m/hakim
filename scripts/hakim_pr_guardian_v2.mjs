#!/usr/bin/env node
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ENABLED_RULES,
  TAXONOMY,
  parseUnifiedDiff,
  reviewDiff,
} from './lib/guardian_truth.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const FULL_SHA = /^[0-9a-f]{40}$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function runGit(root, args, options = {}) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw new Error(`cannot execute git: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function gitText(root, args) {
  return runGit(root, args).stdout.trimEnd();
}

function normalizeOrigin(url) {
  const value = url.trim();
  for (const pattern of [
    /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i,
    /^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i,
    /^ssh:\/\/git@github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i,
  ]) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseArgs(args) {
  const options = {
    repository: null,
    pr: null,
    baseSha: null,
    headSha: null,
    cwd: process.cwd(),
    json: false,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--apply') throw new Error('--apply is not supported; PR Guardian is read-only');
    else if (arg === '--repository') options.repository = args[++index] || null;
    else if (arg.startsWith('--repository=')) options.repository = arg.slice('--repository='.length);
    else if (arg === '--pr') options.pr = args[++index] || null;
    else if (arg.startsWith('--pr=')) options.pr = arg.slice('--pr='.length);
    else if (arg === '--base-sha') options.baseSha = args[++index] || null;
    else if (arg.startsWith('--base-sha=')) options.baseSha = arg.slice('--base-sha='.length);
    else if (arg === '--head-sha') options.headSha = args[++index] || null;
    else if (arg.startsWith('--head-sha=')) options.headSha = arg.slice('--head-sha='.length);
    else if (arg === '--cwd') options.cwd = args[++index] || null;
    else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
    else throw new Error(`unknown option: ${arg}`);
  }
  if (options.help) return options;
  if (!REPOSITORY.test(options.repository || '')) throw new Error('--repository must be an explicit owner/name');
  if (!/^[1-9][0-9]*$/.test(String(options.pr || ''))) throw new Error('--pr must be a positive integer');
  if (!FULL_SHA.test(options.baseSha || '')) throw new Error('--base-sha must be a full lowercase 40-character commit SHA');
  if (!FULL_SHA.test(options.headSha || '')) throw new Error('--head-sha must be a full lowercase 40-character commit SHA');
  if (options.baseSha === options.headSha) throw new Error('--base-sha and --head-sha must identify different commits');
  if (!options.cwd) throw new Error('--cwd requires a repository path');
  options.pr = Number(options.pr);
  return options;
}

function resolveRepository(options) {
  const requested = path.resolve(options.cwd);
  const root = path.resolve(runGit(requested, ['rev-parse', '--show-toplevel']).stdout.trim());
  const originRepository = normalizeOrigin(runGit(root, ['remote', 'get-url', 'origin']).stdout);
  if (!originRepository) throw new Error('origin must be a supported github.com repository URL');
  if (originRepository.toLowerCase() !== options.repository.toLowerCase()) {
    throw new Error(`repository scope mismatch: origin is ${originRepository}, requested ${options.repository}`);
  }
  return root;
}

function verifyCommit(root, sha, label) {
  const result = runGit(root, ['cat-file', '-e', `${sha}^{commit}`], { allowFailure: true });
  if (result.status !== 0) throw new Error(`${label} commit is not available locally: ${sha}`);
}

function readAt(root, sha, filename) {
  const result = runGit(root, ['show', `${sha}:${filename}`], { allowFailure: true });
  return result.status === 0 ? result.stdout : null;
}

export { ENABLED_RULES, TAXONOMY, parseUnifiedDiff };

export function buildGuardianReport(options) {
  const root = resolveRepository(options);
  verifyCommit(root, options.baseSha, 'base');
  verifyCommit(root, options.headSha, 'head');
  const mergeBase = gitText(root, ['merge-base', options.baseSha, options.headSha]);
  if (!FULL_SHA.test(mergeBase)) throw new Error('cannot resolve one explicit merge base');

  const beforeStatus = runGit(root, ['status', '--porcelain=v1', '-z']).stdout;
  const diffText = execFileSync(
    'git',
    ['-C', root, 'diff', '--no-ext-diff', '--unified=3', '--no-renames', `${options.baseSha}...${options.headSha}`, '--'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  const result = reviewDiff({
    baseSha: options.baseSha,
    headSha: options.headSha,
    diffText,
    readAt: (sha, filename) => readAt(root, sha, filename),
  });
  const afterStatus = runGit(root, ['status', '--porcelain=v1', '-z']).stdout;
  if (beforeStatus !== afterStatus) throw new Error('repository state changed during read-only review');

  const estimatedLines = result.findings.reduce((sum, finding) => sum + finding.estimated_lines, 0);
  const acceptedEvidenceLinks = result.claim_evidence_validations.filter((entry) => entry.evidence.accepted).length;
  return {
    schema_version: 2,
    mode: 'READ_ONLY',
    mutation_performed: false,
    blocking: false,
    scope: {
      repository: options.repository,
      pull_request: options.pr,
      base_sha: options.baseSha,
      head_sha: options.headSha,
      merge_base_sha: mergeBase,
      diff_expression: `${options.baseSha}...${options.headSha}`,
      fallback_used: false,
    },
    taxonomy: TAXONOMY,
    coverage: {
      enabled_rules: ENABLED_RULES,
      enabled_rule_ids: ENABLED_RULES.map((rule) => rule.id),
      correctness_review: 'NOT_PERFORMED',
      security_review: 'NOT_PERFORMED',
      semantic_code_review: 'NOT_PERFORMED',
      clean_outcome_scope: 'NO_FINDINGS_FROM_ENABLED_DETERMINISTIC_RULES',
    },
    claim_evidence: {
      contract: 'SAME_LINE_MARKER_TO_CHANGED_ACCEPTED_JSON_RECORD',
      marker_format: '<!-- hakim-evidence: path/to/evidence.json#claim-id -->',
      claims_evaluated: result.claim_evidence_validations.length,
      accepted_links: acceptedEvidenceLinks,
      rejected_links: result.claim_evidence_validations.length - acceptedEvidenceLinks,
      validations: result.claim_evidence_validations,
    },
    review: {
      files_inspected: result.files.length,
      added_lines_inspected: result.files.reduce((sum, file) => sum + file.added.length, 0),
      findings_count: result.findings.length,
      findings: result.findings,
      estimated_removable_lines: estimatedLines,
      outcome: result.findings.length === 0 ? 'NO_FINDINGS_FROM_ENABLED_RULES' : 'ADVISORY_FINDINGS',
      clean_statement: result.findings.length === 0
        ? 'No findings from enabled deterministic rules. Correctness and security review were not performed.'
        : null,
    },
    limitations: [
      'Conservative deterministic core; it does not replace a general correctness, security, or semantic code review.',
      'Only the listed enabled dependency and claim rules are executed.',
      'Claim evidence affects only the exact linked claim and must be changed, accepted, text-matched, and limitation-bearing.',
      'No GitHub check, comment, code, branch, setting, or merge state is mutated.',
    ],
  };
}

export function formatText(report) {
  const lines = [
    'Hakim PR Guardian',
    'MODE=READ_ONLY',
    'MUTATION_PERFORMED=NO',
    'BLOCKING=NO',
    `REPOSITORY=${report.scope.repository}`,
    `PR=${report.scope.pull_request}`,
    `BASE_SHA=${report.scope.base_sha}`,
    `HEAD_SHA=${report.scope.head_sha}`,
    `MERGE_BASE_SHA=${report.scope.merge_base_sha}`,
    `ENABLED_RULES=${report.coverage.enabled_rule_ids.join(',')}`,
    `CORRECTNESS_REVIEW=${report.coverage.correctness_review}`,
    `SECURITY_REVIEW=${report.coverage.security_review}`,
    `SEMANTIC_CODE_REVIEW=${report.coverage.semantic_code_review}`,
    `FILES_INSPECTED=${report.review.files_inspected}`,
    `ADDED_LINES_INSPECTED=${report.review.added_lines_inspected}`,
    `CLAIMS_EVALUATED=${report.claim_evidence.claims_evaluated}`,
    `ACCEPTED_CLAIM_EVIDENCE_LINKS=${report.claim_evidence.accepted_links}`,
    `REJECTED_CLAIM_EVIDENCE_LINKS=${report.claim_evidence.rejected_links}`,
    `FINDINGS=${report.review.findings_count}`,
    `OUTCOME=${report.review.outcome}`,
    '',
  ];
  if (report.review.findings.length === 0) {
    lines.push(report.review.clean_statement);
  } else {
    for (const finding of report.review.findings) {
      lines.push(`${finding.file}:L${finding.line} ${finding.tag}: ${finding.what}. ${finding.replacement}.`);
    }
    lines.push('', `net: approximately -${report.review.estimated_removable_lines} lines possible.`);
  }
  return lines.join('\n');
}

export function usage() {
  return [
    'Usage:',
    '  npm run guardian:pr -- --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [--cwd <repository>]',
    '  npm run guardian:pr:json -- --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [--cwd <repository>]',
    '',
    'The command is advisory and read-only. It reports only enabled deterministic-rule',
    'coverage; correctness, security, and general semantic code review are not performed.',
  ].join('\n');
}

export function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = buildGuardianReport(options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
