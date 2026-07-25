#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export const CHECK_DEFINITIONS = Object.freeze([
  {
    id: 'rule_integrity',
    tier: 'integration',
    fast: true,
    script: 'core/hakim-skill/scripts/check_rule_copies.js',
    args: ['core/hakim-skill/SKILL.md', '--json'],
  },
  {
    id: 'upstream_relationship',
    tier: 'integration',
    fast: false,
    script: 'scripts/check_upstream_relationship.mjs',
    args: [],
  },
  {
    id: 'cross_adapter_conformance',
    tier: 'integration',
    fast: false,
    script: 'scripts/check_cross_adapter_conformance.mjs',
    args: [],
  },
  {
    id: 'native_host_acceptance_projection',
    tier: 'integration',
    fast: true,
    script: 'scripts/check_native_host_acceptance.mjs',
    args: [],
  },
  {
    id: 'public_repository_boundary',
    tier: 'integration',
    fast: true,
    script: 'scripts/check_public_repository_boundary.mjs',
    args: [],
  },
  {
    id: 'public_package_surface',
    tier: 'integration',
    fast: true,
    script: 'scripts/check_public_package_surface.mjs',
    args: [],
  },
]);

export function parseArgs(args) {
  const allowed = new Set(['--json', '--fast', '--help', '-h']);
  const unknown = args.filter((arg) => !allowed.has(arg));
  if (unknown.length > 0) throw new Error(`unknown option: ${unknown[0]}`);
  return {
    json: args.includes('--json'),
    fast: args.includes('--fast'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

export function selectChecks(fast, definitions = CHECK_DEFINITIONS) {
  return fast ? definitions.filter((item) => item.fast === true) : [...definitions];
}

export function readVersion(root = ROOT) {
  return fs.readFileSync(
    path.join(root, 'core', 'hakim-skill', 'VERSION'),
    'utf8',
  ).trim();
}

export function readNativeAcceptance(root = ROOT) {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(root, 'conformance', 'native-host-acceptance.json'), 'utf8'),
    );
  } catch {
    return {
      scope: 'current-native-product-paths',
      overall_status: 'UNKNOWN',
      hosts: {},
    };
  }
}

function parseJson(text) {
  const value = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!value) throw new Error('check produced no JSON output');
  return JSON.parse(value);
}

export function runCheck(check, runner = spawnSync) {
  const commandArgs = [check.script, ...(check.args || [])];
  const result = runner(process.execPath, commandArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });

  let data = null;
  let parseError = null;

  try {
    data = parseJson(result.stdout);
  } catch (error) {
    parseError = error.message;
  }

  const payloadErrors = Array.isArray(data?.errors) ? data.errors : [];
  const ok = !result.error
    && result.status === 0
    && data !== null
    && data?.ok !== false;

  const diagnostics = [];
  if (result.error) diagnostics.push(result.error.message);
  if (parseError) diagnostics.push(parseError);
  if (result.stderr?.trim()) diagnostics.push(result.stderr.trim());
  diagnostics.push(...payloadErrors);

  return {
    id: check.id,
    tier: check.tier,
    status: ok ? 'PASS' : 'FAIL',
    exit_code: Number.isInteger(result.status) ? result.status : null,
    command: `node ${commandArgs.join(' ')}`,
    diagnostics,
    data,
  };
}

export function buildReport(results, version, scope = 'FULL', nativeAcceptance = readNativeAcceptance()) {
  const failed = results.filter((item) => item.status !== 'PASS');
  const doctorHealth = failed.length === 0 ? 'PASS' : 'FAIL';
  const nativeOverall = nativeAcceptance?.overall_status || 'UNKNOWN';
  const nativeHostStatuses = Object.fromEntries(
    Object.entries(nativeAcceptance?.hosts || {}).map(([host, value]) => [host, value?.status || null]),
  );
  const nativeHostsNeedingEvidence = Object.entries(nativeHostStatuses)
    .filter(([, status]) => status !== 'PASS')
    .map(([host]) => host);
  const externalEvaluation = 'SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION';

  let nextSafeAction;
  if (failed.length > 0) {
    nextSafeAction = `Run the first failing check directly: ${failed[0].command}`;
  } else if (nativeOverall !== 'PASS') {
    nextSafeAction = nativeHostsNeedingEvidence.length > 0
      ? `Capture and accept fresh real-host evidence for the non-PASS native host path(s): ${nativeHostsNeedingEvidence.join(', ')}, then reconcile the native-host projection. External evaluator relaunch remains a separate explicit product decision.`
      : 'Reconcile the native-host acceptance projection: overall status is not PASS but no non-PASS host detail is recorded. External evaluator relaunch remains a separate explicit product decision.';
  } else {
    nextSafeAction = 'Current maintained doctor checks and native-host evidence are reconciled. Do not relaunch external evaluator recruitment without a separate explicit product decision.';
  }

  return {
    schema_version: 1,
    mode: 'READ_ONLY',
    scope,
    mutation_performed: false,
    hakim_version: version,
    doctor_health: doctorHealth,
    repository_health: 'OUT_OF_SCOPE_DOCTOR',
    check_summary: {
      passed: results.length - failed.length,
      total: results.length,
      failed: failed.map((item) => item.id),
    },
    runtime: {
      acceptance_status: 'OUT_OF_SCOPE_PUBLIC_REPOSITORY',
      accepted_verdicts: null,
    },
    public_release_readiness: 'OUT_OF_SCOPE_PUBLIC_REPOSITORY',
    native_host_acceptance: {
      scope: nativeAcceptance?.scope || null,
      overall_status: nativeOverall,
      hosts: nativeHostStatuses,
    },
    external_beta_promotion: externalEvaluation,
    next_safe_action: nextSafeAction,
    checks: results,
  };
}

export function formatText(report) {
  const lines = [
    'Hakim Doctor',
    'MODE=READ_ONLY',
    `SCOPE=${report.scope}`,
    'MUTATION_PERFORMED=NO',
    `HAKIM_VERSION=${report.hakim_version}`,
    `DOCTOR_HEALTH=${report.doctor_health}`,
    `REPOSITORY_HEALTH=${report.repository_health}`,
    `CHECKS=${report.check_summary.passed}/${report.check_summary.total} PASS`,
    'RUNTIME_ACCEPTANCE=OUT_OF_SCOPE_PUBLIC_REPOSITORY',
    'PUBLIC_RELEASE_READINESS=OUT_OF_SCOPE_PUBLIC_REPOSITORY',
    `NATIVE_HOST_ACCEPTANCE=${report.native_host_acceptance.overall_status}`,
    `EXTERNAL_BETA_PROMOTION=${report.external_beta_promotion}`,
    '',
    '[Checks]',
  ];

  for (const check of report.checks) {
    lines.push(`${check.id}=${check.status}`);
    if (check.status === 'FAIL') {
      for (const diagnostic of check.diagnostics) {
        lines.push(`  ${diagnostic}`);
      }
    }
  }

  lines.push('', `NEXT_SAFE_ACTION=${report.next_safe_action}`);
  return lines.join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run doctor',
    '  npm run doctor:json',
    '  npm run doctor:fast',
    '  node scripts/hakim_doctor.mjs [--fast] [--json]',
    '',
    'Runs Hakim\'s bounded maintained public doctor checks in read-only mode.',
    '`--fast` runs the lightweight integrity, native-acceptance, and public-boundary subset.',
    'Whole-repository health, private runtime acceptance, and release authorization are outside',
    'this doctor result. Current native live-host status is reported separately from',
    'conformance/native-host-acceptance.json. External evaluator recruitment remains',
    'suspended pending a separate explicit product decision. The doctor never changes',
    'repository or host state.',
  ].join('\n');
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  const scope = options.fast ? 'FAST' : 'FULL';
  const results = selectChecks(options.fast).map((check) => runCheck(check));
  const report = buildReport(results, readVersion(), scope, readNativeAcceptance());

  console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
  process.exit(report.doctor_health === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main();
}
