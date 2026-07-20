#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatText as formatLegacyText,
  parseArgs,
} from './hakim_review_pr.mjs';
import { buildReviewReportBounded } from './lib/guarded_session_integrity.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);

export { parseArgs };
export const buildReviewReport = buildReviewReportBounded;

export function formatText(report) {
  if (report.overall_status !== 'BLOCKED' || !report.guardian) {
    return formatLegacyText(report);
  }
  return [
    'Hakim Minimal PR Review',
    'MODE=READ_ONLY',
    'MUTATION_PERFORMED=NO',
    'MERGE_BLOCKING=NO',
    `HOST=${report.selected_host}`,
    'OVERALL_STATUS=BLOCKED',
    `PREFLIGHT_STATUS=${report.components.preflight}`,
    `GUARDIAN_STATUS=${report.components.guardian}`,
    'REVIEW_EXECUTED=NO',
    `REPOSITORY=${report.scope.repository}`,
    `PR=${report.scope.pull_request}`,
    `BASE_SHA=${report.scope.base_sha}`,
    `HEAD_SHA=${report.scope.head_sha}`,
    `REVIEW_OUTCOME=${report.guardian.review.outcome}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run review:pr -- --host codex --cwd <repository> [--binary <path-or-name>] --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [-- <codex-args...>]',
    '  npm run review:pr -- --host claude-code --cwd <repository> [--binary <path-or-name>] --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [-- <claude-args...>]',
    '  npm run review:pr -- --host github-copilot --target <repository> --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex>',
    '',
    'Runs bounded host preflight and deterministic review. Oversized or timed-out',
    'review scopes are returned as explicit BLOCKED evidence, never partial PASS.',
  ].join('\n');
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = buildReviewReportBounded(options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
    process.exit(report.overall_status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
