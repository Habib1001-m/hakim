#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PLUGIN_ROOT = path.resolve(HERE, '..');
const MANIFEST_SCHEMA_VERSION = 1;
const MANIFEST_ADAPTER = 'hakim-codex-native-agents';
const MAX_MANIFEST_BYTES = 64 * 1024;

export const MANAGED_MANIFEST_RELATIVE_PATH = 'agents/.hakim-agents-install-manifest.json';

const AGENT_SPECS = Object.freeze([
  { file: 'hakim_reviewer.toml', capability: 'review' },
  { file: 'hakim_auditor.toml', capability: 'audit' },
  { file: 'hakim_debt_analyst.toml', capability: 'debt' },
  { file: 'hakim_evidence_verifier.toml', capability: 'status' },
  { file: 'hakim_implementer.toml', capability: 'hakim' },
]);
const EXPECTED_AGENT_FILES = Object.freeze(AGENT_SPECS.map((spec) => spec.file));
const EXPECTED_AGENT_SET = new Set(EXPECTED_AGENT_FILES);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function inspectEntry(entryPath, expectedType = null) {
  let stat;
  try {
    stat = fs.lstatSync(entryPath);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return { state: 'MISSING', ok: false };
    return { state: 'UNREADABLE', ok: false, error };
  }
  if (stat.isSymbolicLink()) return { state: 'SYMLINK', ok: false, stat };
  if (expectedType === 'file' && !stat.isFile()) return { state: 'NOT_FILE', ok: false, stat };
  if (expectedType === 'directory' && !stat.isDirectory()) return { state: 'NOT_DIRECTORY', ok: false, stat };
  return { state: 'PRESENT', ok: true, stat };
}

function readPluginIdentity(pluginRoot) {
  const manifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
  const entry = inspectEntry(manifestPath, 'file');
  if (!entry.ok) throw new Error(`Codex plugin manifest is ${entry.state}`);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Codex plugin manifest is invalid JSON: ${error.message}`);
  }
  if (manifest?.name !== 'hakim') throw new Error('Codex plugin manifest must identify Hakim');
  if (typeof manifest.version !== 'string' || manifest.version.trim().length === 0) {
    throw new Error('Codex plugin manifest version is empty');
  }
  return { product_version: manifest.version.trim(), manifest_path: manifestPath };
}

function readCanonicalSkillBody(pluginRoot, capability) {
  const skillPath = path.join(pluginRoot, 'skills', capability, 'SKILL.md');
  const entry = inspectEntry(skillPath, 'file');
  if (!entry.ok) {
    throw new Error(`canonical skill source ${capability} must be a regular file, not ${entry.state}`);
  }
  const normalized = fs.readFileSync(skillPath, 'utf8').replaceAll('\r\n', '\n');
  const match = normalized.match(/^---\n[\s\S]*?\n---\n([\s\S]+)$/);
  if (!match) throw new Error(`canonical skill source ${capability} must contain YAML frontmatter and a body`);
  const body = match[1].trim();
  if (body.length === 0) throw new Error(`canonical skill source ${capability} body is empty`);
  return { body, source_path: skillPath };
}

function projectCanonicalSkillIntoAgent(templateText, canonicalBody, agentName) {
  const block = templateText.match(/^developer_instructions\s*=\s*"""([\s\S]*?)"""\s*$/m);
  if (!block) throw new Error(`agent source ${agentName} must define multiline developer_instructions`);
  const wrapper = block[1].trim();
  if (wrapper.length === 0) throw new Error(`agent source ${agentName} developer_instructions are empty`);
  const instructions = [
    wrapper,
    '',
    'Canonical Hakim capability contract (mechanically projected from the installed plugin skill bytes):',
    '',
    canonicalBody,
  ].join('\n');
  return templateText.replace(block[0], `developer_instructions = ${JSON.stringify(instructions)}`);
}

function manifestFromBundle(bundle) {
  return {
    schema_version: MANIFEST_SCHEMA_VERSION,
    adapter: MANIFEST_ADAPTER,
    product_version: bundle.product_version,
    files: bundle.files.map((file) => ({
      target_relative: file.target_relative,
      sha256: file.sha256,
      size: file.size,
    })),
  };
}

function manifestBytes(manifest) {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return false;
  if (manifest.schema_version !== MANIFEST_SCHEMA_VERSION || manifest.adapter !== MANIFEST_ADAPTER) return false;
  if (typeof manifest.product_version !== 'string' || manifest.product_version.trim().length === 0) return false;
  if (!Array.isArray(manifest.files) || manifest.files.length !== EXPECTED_AGENT_FILES.length) return false;
  const names = [];
  for (const record of manifest.files) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
    if (!EXPECTED_AGENT_SET.has(record.target_relative)) return false;
    if (!/^[a-f0-9]{64}$/.test(record.sha256 || '')) return false;
    if (!Number.isSafeInteger(record.size) || record.size < 0) return false;
    names.push(record.target_relative);
  }
  return names.length === new Set(names).size && EXPECTED_AGENT_FILES.every((name) => names.includes(name));
}

export function buildCodexAgentBundle(pluginRoot = DEFAULT_PLUGIN_ROOT) {
  const rootEntry = inspectEntry(pluginRoot, 'directory');
  if (!rootEntry.ok) throw new Error(`plugin root is not a regular directory: ${rootEntry.state}`);
  const { product_version } = readPluginIdentity(pluginRoot);
  const agentsDir = path.join(pluginRoot, 'agents');
  const agentsEntry = inspectEntry(agentsDir, 'directory');
  if (!agentsEntry.ok) throw new Error(`agent source inventory is not a regular directory: ${agentsEntry.state}`);

  const inventory = fs.readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.name.endsWith('.toml'))
    .map((entry) => entry.name)
    .sort();
  const expected = [...EXPECTED_AGENT_FILES].sort();
  if (inventory.length !== expected.length || inventory.some((name, index) => name !== expected[index])) {
    throw new Error(`agent source inventory must contain exactly five expected TOML files; found: ${inventory.join(', ')}`);
  }

  const files = AGENT_SPECS.map(({ file: name, capability }) => {
    const sourcePath = path.join(agentsDir, name);
    const entry = inspectEntry(sourcePath, 'file');
    if (!entry.ok) throw new Error(`agent source ${name} must be a regular file, not ${entry.state}`);
    const templateText = fs.readFileSync(sourcePath, 'utf8');
    const canonical = readCanonicalSkillBody(pluginRoot, capability);
    const projectedText = projectCanonicalSkillIntoAgent(templateText, canonical.body, name);
    const bytes = Buffer.from(projectedText, 'utf8');
    return {
      source_relative: path.posix.join('agents', name),
      source_path: sourcePath,
      canonical_skill_relative: path.posix.join('skills', capability, 'SKILL.md'),
      canonical_skill_path: canonical.source_path,
      target_relative: name,
      bytes,
      sha256: sha256(bytes),
      size: bytes.length,
    };
  });

  return {
    schema_version: MANIFEST_SCHEMA_VERSION,
    adapter: MANIFEST_ADAPTER,
    product_version,
    files,
  };
}

function readManagedManifest(codexHome) {
  const manifestPath = path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH);
  const entry = inspectEntry(manifestPath, 'file');
  if (entry.state === 'MISSING') return { state: 'ABSENT', path: manifestPath };
  if (!entry.ok) return { state: entry.state === 'SYMLINK' ? 'TARGET_SYMLINK' : 'INVALID', path: manifestPath };
  if (entry.stat.size > MAX_MANIFEST_BYTES) return { state: 'INVALID', path: manifestPath };
  try {
    const bytes = fs.readFileSync(manifestPath);
    const manifest = JSON.parse(bytes.toString('utf8'));
    if (!validateManifest(manifest)) return { state: 'INVALID', path: manifestPath };
    return { state: 'VALID', path: manifestPath, bytes, manifest, sha256: sha256(bytes) };
  } catch {
    return { state: 'INVALID', path: manifestPath };
  }
}

function inspectTargets(codexHome, bundle) {
  const agentsDir = path.join(codexHome, 'agents');
  const root = inspectEntry(agentsDir, 'directory');
  if (root.state === 'SYMLINK') return { state: 'TARGET_SYMLINK', agents_dir: agentsDir };
  if (!root.ok && root.state !== 'MISSING') return { state: 'TARGET_UNSAFE', agents_dir: agentsDir };

  const entries = new Map();
  let anyPresent = false;
  for (const name of EXPECTED_AGENT_FILES) {
    const targetPath = path.join(agentsDir, name);
    const entry = inspectEntry(targetPath, 'file');
    if (entry.state === 'SYMLINK') return { state: 'TARGET_SYMLINK', agents_dir: agentsDir, target_path: targetPath };
    if (!entry.ok && entry.state !== 'MISSING') return { state: 'TARGET_UNSAFE', agents_dir: agentsDir, target_path: targetPath };
    if (entry.ok) anyPresent = true;
    entries.set(name, { path: targetPath, entry });
  }

  const installed = readManagedManifest(codexHome);
  if (installed.state === 'TARGET_SYMLINK') return { state: 'TARGET_SYMLINK', agents_dir: agentsDir, target_path: installed.path };
  if (installed.state === 'INVALID') return { state: 'PARTIAL_OR_MODIFIED', agents_dir: agentsDir, manifest: installed, entries };
  if (installed.state === 'ABSENT') {
    return { state: anyPresent ? 'UNMANAGED_CONFLICT' : 'ABSENT', agents_dir: agentsDir, manifest: installed, entries };
  }

  const byName = new Map(installed.manifest.files.map((record) => [record.target_relative, record]));
  for (const name of EXPECTED_AGENT_FILES) {
    const record = byName.get(name);
    const target = entries.get(name);
    if (!record || !target?.entry.ok) return { state: 'PARTIAL_OR_MODIFIED', agents_dir: agentsDir, manifest: installed, entries };
    const bytes = fs.readFileSync(target.path);
    if (bytes.length !== record.size || sha256(bytes) !== record.sha256) {
      return { state: 'PARTIAL_OR_MODIFIED', agents_dir: agentsDir, manifest: installed, entries };
    }
  }

  const targetManifest = manifestFromBundle(bundle);
  const installedRecords = [...installed.manifest.files].sort((a, b) => a.target_relative.localeCompare(b.target_relative));
  const targetRecords = [...targetManifest.files].sort((a, b) => a.target_relative.localeCompare(b.target_relative));
  const exactBundle = installed.manifest.product_version === targetManifest.product_version
    && installedRecords.every((record, index) => {
      const other = targetRecords[index];
      return record.target_relative === other.target_relative
        && record.sha256 === other.sha256
        && record.size === other.size;
    });

  return {
    state: exactBundle ? 'EXACT_MATCH' : 'UPGRADE_AVAILABLE',
    agents_dir: agentsDir,
    manifest: installed,
    entries,
    installed_product_version: installed.manifest.product_version,
    target_product_version: bundle.product_version,
  };
}

function statusReport(codexHome, bundle, inspection) {
  return {
    status: ['ABSENT', 'EXACT_MATCH', 'UPGRADE_AVAILABLE'].includes(inspection.state) ? 'PASS' : 'FAIL',
    state: inspection.state,
    codex_home: codexHome,
    installed_product_version: inspection.installed_product_version ?? null,
    target_product_version: bundle.product_version,
  };
}

export function inspectCodexAgentStatus(codexHome, pluginRoot = DEFAULT_PLUGIN_ROOT) {
  const bundle = buildCodexAgentBundle(pluginRoot);
  return statusReport(codexHome, bundle, inspectTargets(codexHome, bundle));
}

function ensureCodexHome(codexHome) {
  const existing = inspectEntry(codexHome, 'directory');
  if (existing.state === 'MISSING') {
    fs.mkdirSync(codexHome, { recursive: true, mode: 0o700 });
    return;
  }
  if (!existing.ok) throw new Error(`CODEX_HOME is not a regular directory: ${existing.state}`);
}

function safeRemoveExact(targetPath, expectedBytes) {
  const entry = inspectEntry(targetPath, 'file');
  if (!entry.ok) return false;
  const current = fs.readFileSync(targetPath);
  if (current.length !== expectedBytes.length || sha256(current) !== sha256(expectedBytes)) return false;
  fs.unlinkSync(targetPath);
  return true;
}

function writeManagedBundle(codexHome, bundle) {
  ensureCodexHome(codexHome);
  const agentsDir = path.join(codexHome, 'agents');
  const root = inspectEntry(agentsDir, 'directory');
  if (root.state === 'SYMLINK') throw new Error('target agents directory is a symlink');
  if (root.state === 'MISSING') fs.mkdirSync(agentsDir, { recursive: false, mode: 0o700 });
  else if (!root.ok) throw new Error(`target agents directory is ${root.state}`);

  const created = [];
  const manifest = manifestFromBundle(bundle);
  const manifestPath = path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH);
  try {
    for (const file of bundle.files) {
      const target = path.join(agentsDir, file.target_relative);
      fs.writeFileSync(target, file.bytes, { flag: 'wx', mode: 0o600 });
      created.push({ path: target, bytes: file.bytes });
    }
    const bytes = manifestBytes(manifest);
    fs.writeFileSync(manifestPath, bytes, { flag: 'wx', mode: 0o600 });
    created.push({ path: manifestPath, bytes });
  } catch (error) {
    for (const item of created.reverse()) safeRemoveExact(item.path, item.bytes);
    throw error;
  }
  return bundle.files.map((file) => path.join(agentsDir, file.target_relative));
}

function restoreQuarantine(quarantineRoot, moved) {
  let complete = true;
  for (const item of [...moved].reverse()) {
    const source = path.join(quarantineRoot, item.quarantine_name);
    if (!fs.existsSync(source)) continue;
    const destinationState = inspectEntry(item.original_path);
    if (destinationState.state !== 'MISSING') {
      complete = false;
      continue;
    }
    fs.renameSync(source, item.original_path);
  }
  return complete;
}

function quarantineVerifiedInstallation(codexHome, inspection) {
  ensureCodexHome(codexHome);
  const quarantineRoot = fs.mkdtempSync(path.join(codexHome, '.hakim-agents-txn-'));
  const moved = [];
  const records = [...inspection.manifest.manifest.files];
  try {
    for (const record of records) {
      const originalPath = path.join(inspection.agents_dir, record.target_relative);
      const entry = inspectEntry(originalPath, 'file');
      if (!entry.ok) throw new Error(`managed file changed before quarantine: ${record.target_relative}`);
      const bytes = fs.readFileSync(originalPath);
      if (bytes.length !== record.size || sha256(bytes) !== record.sha256) {
        throw new Error(`managed file changed before quarantine: ${record.target_relative}`);
      }
      const quarantineName = `file-${moved.length}-${record.target_relative}`;
      fs.renameSync(originalPath, path.join(quarantineRoot, quarantineName));
      moved.push({ original_path: originalPath, quarantine_name: quarantineName });
    }

    const manifestCurrent = fs.readFileSync(inspection.manifest.path);
    if (sha256(manifestCurrent) !== inspection.manifest.sha256) throw new Error('ownership manifest changed before quarantine');
    const manifestName = 'install-manifest.json';
    fs.renameSync(inspection.manifest.path, path.join(quarantineRoot, manifestName));
    moved.push({ original_path: inspection.manifest.path, quarantine_name: manifestName });
    return { quarantine_root: quarantineRoot, moved };
  } catch (error) {
    const complete = restoreQuarantine(quarantineRoot, moved);
    if (complete) fs.rmSync(quarantineRoot, { recursive: true, force: true });
    throw error;
  }
}

function rollbackNewBundle(codexHome, bundle) {
  const manifestPath = path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH);
  safeRemoveExact(manifestPath, manifestBytes(manifestFromBundle(bundle)));
  for (const file of [...bundle.files].reverse()) {
    safeRemoveExact(path.join(codexHome, 'agents', file.target_relative), file.bytes);
  }
}

export function installCodexAgents(options = {}, pluginRoot = DEFAULT_PLUGIN_ROOT) {
  const codexHome = options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex');
  const apply = options.apply === true;
  const bundle = buildCodexAgentBundle(pluginRoot);
  const inspection = inspectTargets(codexHome, bundle);

  if (inspection.state === 'TARGET_SYMLINK') {
    return { status: 'FAIL', state: 'REFUSED_TARGET_SYMLINK', write_attempted: false, filesystem_changed: false };
  }
  if (inspection.state === 'TARGET_UNSAFE' || inspection.state === 'PARTIAL_OR_MODIFIED') {
    return { status: 'FAIL', state: 'REFUSED_PARTIAL_OR_MODIFIED', write_attempted: false, filesystem_changed: false };
  }
  if (inspection.state === 'UNMANAGED_CONFLICT') {
    return { status: 'FAIL', state: 'REFUSED_UNMANAGED_CONFLICT', write_attempted: false, filesystem_changed: false };
  }
  if (inspection.state === 'EXACT_MATCH') {
    return { status: 'PASS', state: 'ALREADY_MATCHES', write_attempted: false, filesystem_changed: false, installed_product_version: bundle.product_version };
  }
  if (inspection.state === 'ABSENT') {
    if (!apply) return { status: 'PASS', state: 'READY_TO_CREATE', write_attempted: false, filesystem_changed: false };
    try {
      const createdFiles = writeManagedBundle(codexHome, bundle);
      const verified = inspectTargets(codexHome, bundle);
      if (verified.state !== 'EXACT_MATCH') throw new Error(`post-install verification failed: ${verified.state}`);
      return {
        status: 'PASS',
        state: 'CREATED',
        write_attempted: true,
        filesystem_changed: true,
        created_files: createdFiles,
        installed_product_version: bundle.product_version,
      };
    } catch (error) {
      rollbackNewBundle(codexHome, bundle);
      return { status: 'FAIL', state: 'WRITE_FAILED', write_attempted: true, filesystem_changed: false, message: error.message };
    }
  }

  if (inspection.state === 'UPGRADE_AVAILABLE') {
    if (!apply) {
      return {
        status: 'PASS',
        state: 'READY_TO_UPGRADE',
        write_attempted: false,
        filesystem_changed: false,
        installed_product_version: inspection.installed_product_version,
        target_product_version: bundle.product_version,
      };
    }

    let quarantined;
    try {
      quarantined = quarantineVerifiedInstallation(codexHome, inspection);
    } catch (error) {
      return { status: 'FAIL', state: 'REFUSED_PARTIAL_OR_MODIFIED', write_attempted: false, filesystem_changed: false, message: error.message };
    }

    try {
      writeManagedBundle(codexHome, bundle);
      const verified = inspectTargets(codexHome, bundle);
      if (verified.state !== 'EXACT_MATCH') throw new Error(`post-upgrade verification failed: ${verified.state}`);
      fs.rmSync(quarantined.quarantine_root, { recursive: true, force: true });
      return {
        status: 'PASS',
        state: 'UPGRADED',
        write_attempted: true,
        filesystem_changed: true,
        previous_product_version: inspection.installed_product_version,
        installed_product_version: bundle.product_version,
      };
    } catch (error) {
      rollbackNewBundle(codexHome, bundle);
      const restored = restoreQuarantine(quarantined.quarantine_root, quarantined.moved);
      if (restored) fs.rmSync(quarantined.quarantine_root, { recursive: true, force: true });
      return {
        status: 'FAIL',
        state: 'UPGRADE_FAILED',
        write_attempted: true,
        filesystem_changed: !restored,
        quarantine_retained: !restored,
        quarantine_path: restored ? null : quarantined.quarantine_root,
        message: error.message,
      };
    }
  }

  return { status: 'FAIL', state: 'REFUSED_UNKNOWN_STATE', write_attempted: false, filesystem_changed: false };
}

export function removeCodexAgents(options = {}, pluginRoot = DEFAULT_PLUGIN_ROOT) {
  const codexHome = options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex');
  const apply = options.apply === true;
  const bundle = buildCodexAgentBundle(pluginRoot);
  const inspection = inspectTargets(codexHome, bundle);

  if (inspection.state === 'ABSENT') {
    return { status: 'PASS', state: 'ALREADY_ABSENT', mutation_attempted: false, filesystem_changed: false };
  }
  if (inspection.state === 'TARGET_SYMLINK') {
    return { status: 'FAIL', state: 'REFUSED_TARGET_SYMLINK', mutation_attempted: false, filesystem_changed: false };
  }
  if (inspection.state === 'UNMANAGED_CONFLICT') {
    return { status: 'FAIL', state: 'REFUSED_UNMANAGED_CONFLICT', mutation_attempted: false, filesystem_changed: false };
  }
  if (inspection.state === 'TARGET_UNSAFE' || inspection.state === 'PARTIAL_OR_MODIFIED') {
    return { status: 'FAIL', state: 'REFUSED_PARTIAL_OR_MODIFIED', mutation_attempted: false, filesystem_changed: false };
  }
  if (!['EXACT_MATCH', 'UPGRADE_AVAILABLE'].includes(inspection.state)) {
    return { status: 'FAIL', state: 'REFUSED_UNKNOWN_STATE', mutation_attempted: false, filesystem_changed: false };
  }
  if (!apply) {
    return {
      status: 'PASS',
      state: 'READY_TO_REMOVE',
      mutation_attempted: false,
      filesystem_changed: false,
      installed_product_version: inspection.installed_product_version,
    };
  }

  let quarantined;
  try {
    quarantined = quarantineVerifiedInstallation(codexHome, inspection);
  } catch (error) {
    return { status: 'FAIL', state: 'REFUSED_PARTIAL_OR_MODIFIED', mutation_attempted: false, filesystem_changed: false, message: error.message };
  }

  const replacement = EXPECTED_AGENT_FILES
    .map((name) => path.join(codexHome, 'agents', name))
    .concat(path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH))
    .find((target) => inspectEntry(target).state !== 'MISSING');
  if (replacement) {
    const restored = restoreQuarantine(quarantined.quarantine_root, quarantined.moved);
    if (restored) fs.rmSync(quarantined.quarantine_root, { recursive: true, force: true });
    return {
      status: 'FAIL',
      state: 'REFUSED_CONCURRENT_REPLACEMENT',
      mutation_attempted: true,
      filesystem_changed: !restored,
      quarantine_retained: !restored,
      quarantine_path: restored ? null : quarantined.quarantine_root,
    };
  }

  fs.rmSync(quarantined.quarantine_root, { recursive: true, force: true });
  return { status: 'PASS', state: 'REMOVED', mutation_attempted: true, filesystem_changed: true };
}

export function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.length === 0) throw new Error('command is required: status, install, or remove');
  const command = argv[0];
  if (!['status', 'install', 'remove'].includes(command)) throw new Error(`unknown command: ${command}`);
  let apply = false;
  let json = false;
  let help = false;
  for (const arg of argv.slice(1)) {
    if (arg === '--apply') apply = true;
    else if (arg === '--json') json = true;
    else if (arg === '--help' || arg === '-h') help = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  if (command === 'status' && apply) throw new Error('status does not accept --apply');
  return { command, apply, json, help };
}

function usage() {
  return [
    'Usage: node hakim_agents.mjs <status|install|remove> [--apply] [--json]',
    '',
    'status          inspect managed Hakim Codex agents; never mutates',
    'install         dry-run install/upgrade; add --apply to mutate',
    'remove          dry-run removal; add --apply to mutate',
  ].join('\n');
}

function runCli() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 2;
    return;
  }
  if (args.help) {
    console.log(usage());
    return;
  }
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  let report;
  try {
    if (args.command === 'status') report = inspectCodexAgentStatus(codexHome, DEFAULT_PLUGIN_ROOT);
    else if (args.command === 'install') report = installCodexAgents({ codexHome, apply: args.apply }, DEFAULT_PLUGIN_ROOT);
    else report = removeCodexAgents({ codexHome, apply: args.apply }, DEFAULT_PLUGIN_ROOT);
  } catch (error) {
    report = { status: 'FAIL', state: 'ERROR', message: error.message };
  }
  if (args.json) console.log(JSON.stringify(report));
  else {
    console.log(`status=${report.status}`);
    console.log(`state=${report.state}`);
    if (report.installed_product_version) console.log(`installed_product_version=${report.installed_product_version}`);
    if (report.target_product_version) console.log(`target_product_version=${report.target_product_version}`);
    if (report.message) console.log(`message=${report.message}`);
  }
  if (report.status !== 'PASS') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
