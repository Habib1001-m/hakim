#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

function loadIdentity(root = ROOT) {
  const identityPath = path.join(root, 'conformance', 'distribution-identity.json');
  return JSON.parse(fs.readFileSync(identityPath, 'utf8'));
}

function defaultOptions() {
  return {
    host: null,
    binary: null,
    cwd: null,
    target: null,
    output: null,
    json: false,
    record: false,
    requestedSource: null,
    resolvedSourceSha: null,
    installedProductVersion: null,
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
    else if (arg === '--apply') throw new Error('--apply is intentionally unsupported; this harness never installs or mutates a host');
    else if (arg === '--host') options.host = readValue(index++, '--host');
    else if (arg.startsWith('--host=')) options.host = arg.slice('--host='.length);
    else if (arg === '--binary') options.binary = readValue(index++, '--binary');
    else if (arg.startsWith('--binary=')) options.binary = arg.slice('--binary='.length);
    else if (arg === '--cwd') options.cwd = readValue(index++, '--cwd');
    else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
    else if (arg === '--target') options.target = readValue(index++, '--target');
    else if (arg.startsWith('--target=')) options.target = arg.slice('--target='.length);
    else if (arg === '--output') options.output = readValue(index++, '--output');
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length);
    else if (arg === '--requested-source') options.requestedSource = readValue(index++, '--requested-source');
    else if (arg.startsWith('--requested-source=')) options.requestedSource = arg.slice('--requested-source='.length);
    else if (arg === '--resolved-source-sha') options.resolvedSourceSha = readValue(index++, '--resolved-source-sha').toLowerCase();
    else if (arg.startsWith('--resolved-source-sha=')) options.resolvedSourceSha = arg.slice('--resolved-source-sha='.length).toLowerCase();
    else if (arg === '--installed-product-version') options.installedProductVersion = readValue(index++, '--installed-product-version');
    else if (arg.startsWith('--installed-product-version=')) options.installedProductVersion = arg.slice('--installed-product-version='.length);
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
  if (options.resolvedSourceSha && !/^[0-9a-f]{40}$/.test(options.resolvedSourceSha)) {
    throw new Error('--resolved-source-sha must be a full 40-character lowercase hexadecimal commit SHA');
  }
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
  return String(value || '').split(/\r?\n/).map((item) => item.trim()).find(Boolean)?.slice(0, 200) || '';
}

export function probeVersion(binaryResolved, options = {}, dependencies = {}) {
  if (!binaryResolved) return { status: 'BLOCKED', version: null, exit_code: null, reason: 'BINARY_NOT_FOUND' };
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

function computePacketStatus({ record, observations, versionProbe, expectedSha, resolvedSha, expectedVersion, installedVersion, evidenceRef }) {
  if (!record) return 'INSPECT_ONLY';
  if (resolvedSha && resolvedSha !== expectedSha) return 'FAIL';
  if (installedVersion && installedVersion !== expectedVersion) return 'FAIL';
  const values = Object.values(observations);
  if (values.some((value) => value === 'FAIL')) return 'FAIL';
  if (values.some((value) => value === 'BLOCKED')) return 'BLOCKED';
  const complete = values.every((value) => value === 'PASS')
    && versionProbe.status === 'PASS'
    && resolvedSha === expectedSha
    && installedVersion === expectedVersion
    && Boolean(evidenceRef);
  return complete ? 'PASS' : 'INCOMPLETE';
}

export function buildTransportEvidence(options, root = ROOT, dependencies = {}) {
  const identity = loadIdentity(root);
  const frozen = identity.latest_frozen_candidate;
  const contract = frozen.host_transport_contracts[options.host];
  const requestedSource = options.requestedSource || frozen.normal_install_commands[contract.command_key];
  const binaryRequested = options.binary || DEFAULT_BINARIES[options.host];
  const environment = dependencies.env || process.env;
  const binaryResolved = dependencies.resolveExecutable
    ? dependencies.resolveExecutable(binaryRequested, environment, process.platform)
    : resolveExecutable(binaryRequested, environment, process.platform);
  const versionProbe = dependencies.probeVersion
    ? dependencies.probeVersion(binaryResolved, options, dependencies)
    : probeVersion(binaryResolved, options, dependencies);
  const packetStatus = computePacketStatus({
    record: options.record,
    observations: options.observations,
    versionProbe,
    expectedSha: frozen.source_sha,
    resolvedSha: options.resolvedSourceSha,
    expectedVersion: frozen.version,
    installedVersion: options.installedProductVersion,
    evidenceRef: options.evidenceRef,
  });

  let nextSafeAction = 'Run the declared route in a disposable host home, inspect the actual resolved source and installed version, then rerun this harness with --record.';
  if (packetStatus === 'PASS') nextSafeAction = 'Review this create-only packet. Do not promote the frozen acceptance projection without explicit operator approval and cross-checking the evidence reference.';
  else if (packetStatus === 'FAIL') nextSafeAction = 'Preserve the failed packet, stop promotion, and reconcile the source/version mismatch or failed observed checkpoint.';
  else if (packetStatus === 'BLOCKED') nextSafeAction = 'Preserve the blocker and resolve the host/environment policy issue before rerunning the disposable journey.';
  else if (packetStatus === 'INCOMPLETE') nextSafeAction = 'Record the exact resolved SHA, installed beta.4 version, host version, all three PASS observations, and a public-safe evidence reference.';

  return {
    schema_version: 1,
    packet_type: 'P0_HOST_TRANSPORT_EVIDENCE',
    mode: options.record ? 'CANDIDATE_EVIDENCE' : 'READ_ONLY_INSPECTION',
    packet_status: packetStatus,
    host: options.host,
    expected: {
      product_version: frozen.version,
      source_sha: frozen.source_sha,
      source_ref: frozen.source_ref,
    },
    observed: {
      requested_source: requestedSource,
      resolved_source_sha: options.record ? options.resolvedSourceSha : null,
      installed_product_version: options.record ? options.installedProductVersion : null,
      installation_status: options.observations.installation,
      activation_status: options.observations.activation,
      invocation_status: options.observations.invocation,
    },
    host_binary: {
      requested: binaryRequested,
      resolved: binaryResolved,
      version_probe: versionProbe,
    },
    cwd: path.resolve(options.cwd || process.cwd()),
    target: options.target ? path.resolve(options.target) : null,
    verified_at: options.record ? (options.verifiedAt || new Date().toISOString()) : null,
    evidence_ref: options.record ? options.evidenceRef : null,
    safety: {
      host_installation_performed: false,
      host_configuration_mutated: false,
      acceptance_projection_mutated: false,
      raw_host_output_captured: false,
      output_is_create_only: true,
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
  return [
    'Hakim P0 Host Transport Evidence',
    `MODE=${report.mode}`,
    `HOST=${report.host}`,
    `PACKET_STATUS=${report.packet_status}`,
    `EXPECTED_PRODUCT_VERSION=${report.expected.product_version}`,
    `EXPECTED_SOURCE_SHA=${report.expected.source_sha}`,
    `REQUESTED_SOURCE=${report.observed.requested_source}`,
    `RESOLVED_SOURCE_SHA=${report.observed.resolved_source_sha || 'NOT_RECORDED'}`,
    `INSTALLED_PRODUCT_VERSION=${report.observed.installed_product_version || 'NOT_RECORDED'}`,
    `HOST_BINARY=${report.host_binary.resolved || 'NOT_FOUND'}`,
    `HOST_VERSION=${report.host_binary.version_probe.version || 'UNKNOWN'}`,
    `INSTALLATION_STATUS=${report.observed.installation_status}`,
    `ACTIVATION_STATUS=${report.observed.activation_status}`,
    `INVOCATION_STATUS=${report.observed.invocation_status}`,
    `EVIDENCE_REF=${report.evidence_ref || 'NOT_RECORDED'}`,
    `VERIFIED_AT=${report.verified_at || 'NOT_RECORDED'}`,
    'HOST_MUTATION_PERFORMED_BY_HARNESS=NO',
    'ACCEPTANCE_PROJECTION_MUTATED_BY_HARNESS=NO',
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run capture:transport -- --host <codex|claude-code|github-copilot|opencode> [--binary <path>] [--cwd <path>] [--target <path>] [--json]',
    '  npm run capture:transport -- --host <host> --record --resolved-source-sha <40-char-sha> --installed-product-version <version> --installation <PASS|FAIL|BLOCKED|NOT_RECORDED> --activation <...> --invocation <...> --evidence-ref <public-safe-ref> [--requested-source <text>] [--verified-at <ISO-8601>] [--output <path>] [--json]',
    '',
    'The harness is read-only and create-only. It never installs, changes host configuration, captures raw host output, or mutates acceptance projections.',
    '`--apply` is intentionally refused. A PASS packet requires the exact frozen source SHA, exact frozen product version, detected host version, all three PASS observations, and an evidence reference.',
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

  const report = buildTransportEvidence(options);
  const rendered = options.json ? JSON.stringify(report, null, 2) : formatText(report);
  if (options.output) {
    const outputPath = validateOutputPath(options.output);
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
  console.log(rendered);
  process.exit(report.packet_status === 'FAIL' ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
