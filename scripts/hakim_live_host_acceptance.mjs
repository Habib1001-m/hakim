#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  OPENCODE_BOOTSTRAP,
  buildPlan as buildInstallPlan,
} from './hakim_install_plan.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export const SUPPORTED_HOSTS = Object.freeze([
  'codex',
  'claude-code',
  'github-copilot',
  'opencode',
]);

export const OBSERVATION_STATUSES = Object.freeze([
  'PASS',
  'FAIL',
  'BLOCKED',
  'NOT_RECORDED',
]);

const DEFAULT_BINARIES = Object.freeze({
  codex: 'codex',
  'claude-code': 'claude',
  'github-copilot': 'copilot',
  opencode: 'opencode',
});

const JOURNEYS = Object.freeze({
  codex: [
    ['installation', 'Add the Hakim Git marketplace and install hakim@hakim through the Codex plugin surface.'],
    ['activation', 'Review/trust the bundled SessionStart hook and start a new Codex thread with the installed plugin active.'],
    ['invocation', 'Invoke an installed Hakim skill in the new thread and verify that Hakim responds from the installed plugin.'],
  ],
  'claude-code': [
    ['installation', 'Run the Hakim marketplace add/install flow in Claude Code.'],
    ['activation', 'Start Claude Code with the plugin enabled, or reload plugins after installation.'],
    ['invocation', 'Invoke /hakim:help or another Hakim command/agent and verify the installed plugin responds.'],
  ],
  'github-copilot': [
    ['installation', 'Run the Hakim marketplace add/install flow in GitHub Copilot CLI.'],
    ['activation', 'Verify hakim@hakim is installed and Hakim skills/agents are visible to the CLI.'],
    ['invocation', 'Invoke a Hakim skill or agent and verify the installed plugin responds.'],
  ],
  opencode: [
    ['installation', 'Run the Git-backed Hakim bootstrap from the target repository and confirm the guarded project-local bundle reaches an exact installed state.'],
    ['activation', 'Start OpenCode from the target repository so project-local .opencode/plugins content is loaded.'],
    ['invocation', 'Invoke /hakim-help or another Hakim command/skill and verify the project-local plugin responds.'],
  ],
});

const INSTALL_COMMANDS = Object.freeze({
  codex: [
    'codex plugin marketplace add Habib1001-m/hakim',
    'Open /plugins, select the Hakim marketplace, install hakim, review/trust the SessionStart hook, then start a new thread.',
  ],
  'claude-code': [
    'claude plugin marketplace add Habib1001-m/hakim',
    'claude plugin install hakim@hakim',
    'Run /reload-plugins in an active Claude Code session if needed.',
  ],
  'github-copilot': [
    'copilot plugin marketplace add Habib1001-m/hakim',
    'copilot plugin install hakim@hakim',
    'Verify with copilot plugin list, /skills list, and /agent.',
  ],
  opencode: [
    `${OPENCODE_BOOTSTRAP} --target <repository>`,
    `${OPENCODE_BOOTSTRAP} --target <repository> --dry-run`,
    'Start OpenCode from <repository> and invoke /hakim-help.',
    'For acceptance of an unreleased candidate, use an exact Git commit in the package spec and record that immutable commit in the public-safe evidence reference.',
  ],
});

function defaultOptions() {
  return {
    host: null,
    binary: null,
    target: null,
    cwd: null,
    output: null,
    json: false,
    record: false,
    evidenceRef: null,
    verifiedAt: null,
    observations: {
      installation: 'NOT_RECORDED',
      activation: 'NOT_RECORDED',
      invocation: 'NOT_RECORDED',
    },
    help: false,
  };
}

export function parseArgs(args) {
  const options = defaultOptions();
  const readValue = (index, flag) => {
    if (!args[index + 1]) throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--record') options.record = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--apply') throw new Error('--apply is intentionally unsupported; live host installation remains an explicit operator action');
    else if (arg === '--host') options.host = readValue(index++, '--host');
    else if (arg.startsWith('--host=')) options.host = arg.slice('--host='.length);
    else if (arg === '--binary') options.binary = readValue(index++, '--binary');
    else if (arg.startsWith('--binary=')) options.binary = arg.slice('--binary='.length);
    else if (arg === '--target') options.target = readValue(index++, '--target');
    else if (arg.startsWith('--target=')) options.target = arg.slice('--target='.length);
    else if (arg === '--cwd') options.cwd = readValue(index++, '--cwd');
    else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
    else if (arg === '--output') options.output = readValue(index++, '--output');
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length);
    else if (arg === '--evidence-ref') options.evidenceRef = readValue(index++, '--evidence-ref');
    else if (arg.startsWith('--evidence-ref=')) options.evidenceRef = arg.slice('--evidence-ref='.length);
    else if (arg === '--verified-at') options.verifiedAt = readValue(index++, '--verified-at');
    else if (arg.startsWith('--verified-at=')) options.verifiedAt = arg.slice('--verified-at='.length);
    else if (arg === '--installation') options.observations.installation = readValue(index++, '--installation').toUpperCase();
    else if (arg.startsWith('--installation=')) options.observations.installation = arg.slice('--installation='.length).toUpperCase();
    else if (arg === '--activation') options.observations.activation = readValue(index++, '--activation').toUpperCase();
    else if (arg.startsWith('--activation=')) options.observations.activation = arg.slice('--activation='.length).toUpperCase();
    else if (arg === '--invocation') options.observations.invocation = readValue(index++, '--invocation').toUpperCase();
    else if (arg.startsWith('--invocation=')) options.observations.invocation = arg.slice('--invocation='.length).toUpperCase();
    else throw new Error(`unknown option: ${arg}`);
  }

  if (options.help) return options;
  if (!SUPPORTED_HOSTS.includes(options.host)) throw new Error(`--host must be one of: ${SUPPORTED_HOSTS.join(', ')}`);
  for (const [name, status] of Object.entries(options.observations)) {
    if (!OBSERVATION_STATUSES.includes(status)) throw new Error(`--${name} must be one of: ${OBSERVATION_STATUSES.join(', ')}`);
  }
  if (options.host !== 'opencode' && options.target) throw new Error('--target is supported only for opencode live acceptance');
  if (options.record && options.host === 'opencode' && !options.target) throw new Error('--target is required when recording opencode live acceptance');
  if (options.record && !options.evidenceRef) throw new Error('--record requires --evidence-ref');
  if (!options.record && options.evidenceRef) throw new Error('--evidence-ref requires --record');
  return options;
}

function executableCandidates(binary, env = process.env, platform = process.platform) {
  if (binary.includes('/') || binary.includes('\\')) return [path.resolve(binary)];
  const pathEntries = (env.PATH || '').split(path.delimiter).filter(Boolean);
  const extensions = platform === 'win32' ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean) : [''];
  return pathEntries.flatMap((entry) => extensions.map((extension) => path.join(entry, `${binary}${extension}`)));
}

export function resolveExecutable(binary, env = process.env, platform = process.platform) {
  for (const candidate of executableCandidates(binary, env, platform)) {
    try {
      const stat = fs.statSync(candidate);
      if (!stat.isFile()) continue;
      if (platform !== 'win32') fs.accessSync(candidate, fs.constants.X_OK);
      return path.resolve(candidate);
    } catch {
      // Try the next PATH candidate.
    }
  }
  return null;
}

function firstLine(value) {
  const line = String(value || '').split(/\r?\n/).map((item) => item.trim()).find(Boolean) || '';
  return line.slice(0, 200);
}

export function probeVersion(binaryResolved, options = {}, dependencies = {}) {
  if (!binaryResolved) {
    return { status: 'BLOCKED', version: null, exit_code: null, reason: 'BINARY_NOT_FOUND' };
  }
  const run = dependencies.spawnSync || spawnSync;
  const result = run(binaryResolved, ['--version'], {
    cwd: options.cwd || process.cwd(),
    env: dependencies.env || process.env,
    encoding: 'utf8',
    shell: false,
    timeout: 15000,
  });
  if (result.error) return { status: 'BLOCKED', version: null, exit_code: null, reason: `VERSION_PROBE_ERROR:${result.error.message}` };
  if (result.signal) return { status: 'BLOCKED', version: null, exit_code: result.status, reason: `VERSION_PROBE_SIGNAL:${result.signal}` };
  if (result.status !== 0) return { status: 'BLOCKED', version: null, exit_code: result.status, reason: 'VERSION_PROBE_NONZERO' };
  const version = firstLine(result.stdout) || firstLine(result.stderr);
  if (!version) return { status: 'BLOCKED', version: null, exit_code: 0, reason: 'VERSION_PROBE_EMPTY' };
  return { status: 'PASS', version, exit_code: 0, reason: null };
}

function summarizeInstallPlan(plan) {
  const entry = plan?.plans?.[0] || null;
  return {
    status: plan?.overall_status || 'FAIL',
    distribution_mode: entry?.distribution_mode || null,
    target_state: entry?.target_state || null,
    install_identity: entry?.install_identity || null,
    next_safe_action: entry?.next_safe_action || plan?.next_safe_action || null,
  };
}

function computeCandidateStatus(record, observations, versionProbe, evidenceRef) {
  if (!record) return 'INSPECT_ONLY';
  const values = Object.values(observations);
  if (values.some((value) => value === 'FAIL')) return 'FAIL';
  if (values.some((value) => value === 'BLOCKED')) return 'BLOCKED';
  const allPass = values.every((value) => value === 'PASS');
  if (allPass && versionProbe.status === 'PASS' && evidenceRef) return 'PASS';
  return 'INCOMPLETE';
}

export function buildLiveAcceptance(options, root = ROOT, dependencies = {}) {
  const binaryRequested = options.binary || DEFAULT_BINARIES[options.host];
  const environment = dependencies.env || process.env;
  const binaryResolved = dependencies.resolveExecutable
    ? dependencies.resolveExecutable(binaryRequested, environment, process.platform)
    : resolveExecutable(binaryRequested, environment, process.platform);
  const versionProbe = dependencies.probeVersion
    ? dependencies.probeVersion(binaryResolved, options, dependencies)
    : probeVersion(binaryResolved, options, dependencies);
  const installPlan = buildInstallPlan({ host: options.host, target: options.target, json: false, help: false }, root);
  const installSummary = summarizeInstallPlan(installPlan);
  const candidateStatus = computeCandidateStatus(options.record, options.observations, versionProbe, options.evidenceRef);
  const verifiedAt = options.record ? (options.verifiedAt || new Date().toISOString()) : null;
  const journey = JOURNEYS[options.host].map(([id, description]) => ({
    id,
    description,
    observation: options.observations[id],
  }));

  let nextSafeAction = 'Run the listed current-native journey on a real supported host, then rerun with --record and public-safe evidence after observing every checkpoint.';
  if (candidateStatus === 'PASS') nextSafeAction = 'Review this candidate packet before promoting the host entry in conformance/native-host-acceptance.json. This command does not modify the projection.';
  else if (candidateStatus === 'FAIL') nextSafeAction = 'Preserve the failed evidence reference, diagnose the observed live-host failure, and do not promote the host to PASS.';
  else if (candidateStatus === 'BLOCKED') nextSafeAction = 'Preserve the blocking evidence reference, resolve the host/environment policy blocker, and rerun the live journey.';
  else if (candidateStatus === 'INCOMPLETE') nextSafeAction = 'Complete all three observed checkpoints with a detectable host version before requesting projection promotion.';
  else if (versionProbe.status !== 'PASS') nextSafeAction = `Install or expose the ${binaryRequested} binary first; no live acceptance can be recorded without a detected host version.`;

  return {
    schema_version: 1,
    product_version: fs.readFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim(),
    mode: options.record ? 'CANDIDATE_EVIDENCE' : 'READ_ONLY_INSPECTION',
    host: options.host,
    candidate_status: candidateStatus,
    host_binary: {
      requested: binaryRequested,
      resolved: binaryResolved,
      version_probe: versionProbe,
    },
    target: options.target ? path.resolve(options.target) : null,
    cwd: path.resolve(options.cwd || process.cwd()),
    install_plan: installSummary,
    install_commands: INSTALL_COMMANDS[options.host],
    journey,
    verified_at: verifiedAt,
    evidence_ref: options.record ? options.evidenceRef : null,
    safety: {
      host_installation_performed: false,
      host_configuration_mutated: false,
      acceptance_projection_mutated: false,
      raw_host_output_captured: false,
      secrets_or_private_prompts_requested: false,
    },
    next_safe_action: nextSafeAction,
  };
}

export function validateOutputPath(outputPath) {
  const resolved = path.resolve(outputPath);
  if (fs.existsSync(resolved)) throw new Error(`output already exists; refusing overwrite: ${resolved}`);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

function formatText(report) {
  const lines = [
    'Hakim Current-Native Live Host Acceptance',
    `MODE=${report.mode}`,
    `HOST=${report.host}`,
    `CANDIDATE_STATUS=${report.candidate_status}`,
    `HOST_BINARY=${report.host_binary.resolved || 'NOT_FOUND'}`,
    `HOST_VERSION_STATUS=${report.host_binary.version_probe.status}`,
    `HOST_VERSION=${report.host_binary.version_probe.version || 'UNKNOWN'}`,
    `INSTALL_PLAN_STATUS=${report.install_plan.status}`,
    `INSTALL_MODE=${report.install_plan.distribution_mode || 'UNKNOWN'}`,
    `TARGET_STATE=${report.install_plan.target_state || 'UNKNOWN'}`,
    '',
    '[Install / start journey]',
    ...report.install_commands.map((command) => `- ${command}`),
    '',
    '[Observed checkpoints]',
    ...report.journey.map((item) => `- ${item.id}: ${item.observation} — ${item.description}`),
    '',
    `EVIDENCE_REF=${report.evidence_ref || 'NOT_RECORDED'}`,
    `VERIFIED_AT=${report.verified_at || 'NOT_RECORDED'}`,
    'HOST_INSTALLATION_PERFORMED_BY_HARNESS=NO',
    'HOST_CONFIGURATION_MUTATED_BY_HARNESS=NO',
    'ACCEPTANCE_PROJECTION_MUTATED_BY_HARNESS=NO',
    'RAW_HOST_OUTPUT_CAPTURED=NO',
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ];
  return lines.join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run accept:host -- --host <codex|claude-code|github-copilot|opencode> [--binary <path>] [--target <repository>]',
    '  npm run accept:host -- --host <host> --record --installation <PASS|FAIL|BLOCKED|NOT_RECORDED> --activation <...> --invocation <...> --evidence-ref <public-safe-ref> [--verified-at <ISO-8601>] [--output <path>] [--json]',
    '',
    'The harness is read-only with respect to the host and acceptance projection.',
    'It probes only the requested host --version automatically and prints the product journey.',
    'Installation, trust/approval, startup, invocation, and evidence review remain explicit operator actions.',
    'For an unreleased Git-backed OpenCode candidate, test an exact Git commit and include that immutable identity in the public-safe evidence reference.',
    '`--apply` is intentionally refused. `--output` is create-only and writes only a candidate evidence packet.',
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

  const report = buildLiveAcceptance(options);
  const rendered = options.json ? JSON.stringify(report, null, 2) : formatText(report);
  if (options.output) {
    const outputPath = validateOutputPath(options.output);
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
  console.log(rendered);
  process.exit(report.candidate_status === 'FAIL' ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
