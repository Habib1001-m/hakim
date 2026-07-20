#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatText as formatLegacyText,
  parseArgs,
} from './hakim_pr_guardian.mjs';
import { buildGuardianReportBounded } from './lib/guarded_session_integrity.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);

export { parseArgs };
export const buildGuardianReport = buildGuardianReportBounded;

export function formatText(report) {
  if (report.overall_status === 'PASS') return formatLegacyText(report);
  return [
    'Hakim PR Guardian',
    'MODE=READ_ONLY',
    'MUTATION_PERFORMED=NO',
    'BLOCKING=NO',
    `OVERALL_STATUS=${report.overall_status}`,
    `REPOSITORY=${report.scope.repository}`,
    `PR=${report.scope.pull_request}`,
    `BASE_SHA=${report.scope.base_sha}`,
    `HEAD_SHA=${report.scope.head_sha}`,
    `REVIEW_OUTCOME=${report.review.outcome}`,
    `CHANGED_FILES=${report.scope_guard.changed_files}`,
    `CHANGED_LINES=${report.scope_guard.changed_lines}`,
    `BINARY_FILES=${report.scope_guard.binary_files}`,
    `NEXT_SAFE_ACTION=${report.review.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run guardian:pr -- --repository <owner/name> --pr <number> --base-sha <40-hex> --head-sha <40-hex> [--cwd <repository>]',
    '  npm run guardian:pr:json -- <same options>',
    '',
    'The command is advisory, read-only, bounded in time and output, and refuses',
    'oversized scopes instead of reporting a partial review.',
  ].join('\n');
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = buildGuardianReportBounded(options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
    process.exit(report.overall_status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
