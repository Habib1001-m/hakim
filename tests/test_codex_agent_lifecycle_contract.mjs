#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULE_PATH = path.join(ROOT, 'plugins', 'codex', 'scripts', 'hakim_agents.mjs');
const MODULE_AVAILABLE = fs.existsSync(MODULE_PATH);

const AGENTS = [
  ['hakim_reviewer.toml', 'hakim_reviewer', 'review'],
  ['hakim_auditor.toml', 'hakim_auditor', 'audit'],
  ['hakim_debt_analyst.toml', 'hakim_debt_analyst', 'debt'],
  ['hakim_evidence_verifier.toml', 'hakim_evidence_verifier', 'status'],
  ['hakim_implementer.toml', 'hakim_implementer', 'hakim'],
];

let lifecyclePromise;
function loadLifecycle() {
  lifecyclePromise ??= import(pathToFileURL(MODULE_PATH).href);
  return lifecyclePromise;
}

function withCodexHome(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-agents-'));
  const codexHome = path.join(parent, 'codex-home');
  fs.mkdirSync(codexHome);
  return Promise.resolve()
    .then(() => fn({ parent, codexHome }))
    .finally(() => fs.rmSync(parent, { recursive: true, force: true }));
}

function agentText(name, capability, marker = '') {
  return [
    `name = "${name}"`,
    `description = "Hakim — Use when delegated ${capability} work needs a bounded execution context."`,
    'developer_instructions = """',
    `Use the installed $hakim:${capability} skill as the canonical contract.`,
    'If it is unavailable, report HAKIM_PLUGIN_SKILL_UNAVAILABLE and stop.',
    'Do not substitute generic behavior.',
    'Preserve parent authority and report evidence gaps to the parent.',
    marker,
    '"""',
    '',
  ].join('\n');
}

function makePluginSource(parent, version, marker = '') {
  const pluginRoot = path.join(parent, `plugin-${version.replaceAll(/[^A-Za-z0-9.-]/g, '_')}-${marker || 'plain'}`);
  fs.mkdirSync(path.join(pluginRoot, '.codex-plugin'), { recursive: true });
  fs.mkdirSync(path.join(pluginRoot, 'agents'), { recursive: true });
  fs.writeFileSync(
    path.join(pluginRoot, '.codex-plugin', 'plugin.json'),
    `${JSON.stringify({ name: 'hakim', version, description: 'Hakim test fixture' }, null, 2)}\n`,
  );
  for (const [file, name, capability] of AGENTS) {
    fs.writeFileSync(path.join(pluginRoot, 'agents', file), agentText(name, capability, marker));
  }
  return pluginRoot;
}

function targetAgent(codexHome, file) {
  return path.join(codexHome, 'agents', file);
}

test('Codex Hakim managed-agent lifecycle module exists', () => {
  assert.equal(
    MODULE_AVAILABLE,
    true,
    'plugins/codex/scripts/hakim_agents.mjs must provide the explicit managed Codex-agent lifecycle',
  );
});

test('lifecycle module exports the bounded public contract', { skip: !MODULE_AVAILABLE }, async () => {
  const lifecycle = await loadLifecycle();
  for (const name of [
    'MANAGED_MANIFEST_RELATIVE_PATH',
    'buildCodexAgentBundle',
    'inspectCodexAgentStatus',
    'installCodexAgents',
    'removeCodexAgents',
    'parseArgs',
  ]) {
    assert.ok(name in lifecycle, `lifecycle module must export ${name}`);
  }
});

test('CLI parser keeps status non-mutating and install/remove dry-run by default', { skip: !MODULE_AVAILABLE }, async () => {
  const { parseArgs } = await loadLifecycle();
  assert.deepEqual(parseArgs(['status', '--json']), {
    command: 'status',
    apply: false,
    json: true,
    help: false,
  });
  assert.deepEqual(parseArgs(['install', '--json']), {
    command: 'install',
    apply: false,
    json: true,
    help: false,
  });
  assert.deepEqual(parseArgs(['install', '--apply', '--json']), {
    command: 'install',
    apply: true,
    json: true,
    help: false,
  });
  assert.deepEqual(parseArgs(['remove', '--apply']), {
    command: 'remove',
    apply: true,
    json: false,
    help: false,
  });
  assert.throws(() => parseArgs([]), /command.*required/i);
  assert.throws(() => parseArgs(['status', '--apply']), /status.*--apply|--apply.*status/i);
  assert.throws(() => parseArgs(['unknown']), /unknown command/i);
  assert.throws(() => parseArgs(['install', '--unknown']), /unknown option/i);
});

test('bundle builder accepts exactly five regular source TOMLs and binds plugin version identity', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent }) => {
  const { buildCodexAgentBundle } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'bundle-marker');
  const bundle = buildCodexAgentBundle(source);

  assert.equal(bundle.product_version, '1.2.3');
  assert.equal(bundle.files.length, 5);
  assert.deepEqual(
    bundle.files.map((file) => file.target_relative).sort(),
    AGENTS.map(([file]) => file).sort(),
  );
  for (const file of bundle.files) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.bytes instanceof Uint8Array, `${file.target_relative} must carry exact bytes`);
  }
}));

test('bundle builder rejects incomplete or extra TOML inventories before target mutation', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent }) => {
  const { buildCodexAgentBundle } = await loadLifecycle();

  const missing = makePluginSource(parent, '1.2.3', 'missing');
  fs.unlinkSync(path.join(missing, 'agents', AGENTS[0][0]));
  assert.throws(() => buildCodexAgentBundle(missing), /exactly five|inventory|missing/i);

  const extra = makePluginSource(parent, '1.2.3', 'extra');
  fs.writeFileSync(path.join(extra, 'agents', 'other.toml'), 'name = "other"\n');
  assert.throws(() => buildCodexAgentBundle(extra), /exactly five|inventory|unexpected/i);
}));

test('bundle builder rejects symlinked source agent projections', { skip: !MODULE_AVAILABLE || process.platform === 'win32' }, async () => withCodexHome(async ({ parent }) => {
  const { buildCodexAgentBundle } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'source-symlink');
  const file = path.join(source, 'agents', AGENTS[0][0]);
  const real = `${file}.real`;
  fs.renameSync(file, real);
  fs.symlinkSync(real, file);
  assert.throws(() => buildCodexAgentBundle(source), /symlink|regular file/i);
}));

test('dry-run create is non-mutating; apply installs exact bytes; repeat is idempotent', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const {
    MANAGED_MANIFEST_RELATIVE_PATH,
    buildCodexAgentBundle,
    inspectCodexAgentStatus,
    installCodexAgents,
  } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'current');
  const bundle = buildCodexAgentBundle(source);

  const before = inspectCodexAgentStatus(codexHome, source);
  assert.equal(before.status, 'PASS');
  assert.equal(before.state, 'ABSENT');

  const dryRun = installCodexAgents({ codexHome, apply: false }, source);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_CREATE');
  assert.equal(dryRun.filesystem_changed, false);
  assert.equal(fs.existsSync(path.join(codexHome, 'agents')), false);

  const applied = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(applied.status, 'PASS');
  assert.equal(applied.state, 'CREATED');
  assert.equal(applied.filesystem_changed, true);
  assert.equal(applied.created_files.length, 5);

  for (const file of bundle.files) {
    assert.deepEqual(fs.readFileSync(targetAgent(codexHome, file.target_relative)), file.bytes);
  }
  assert.equal(fs.existsSync(path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH)), true);
  assert.equal(inspectCodexAgentStatus(codexHome, source).state, 'EXACT_MATCH');

  const repeated = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(repeated.status, 'PASS');
  assert.equal(repeated.state, 'ALREADY_MATCHES');
  assert.equal(repeated.write_attempted, false);
  assert.equal(repeated.filesystem_changed, false);
}));

test('installer preserves unrelated user agents and never treats them as Hakim inventory', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { installCodexAgents } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'unrelated');
  const unrelated = path.join(codexHome, 'agents', 'my_personal_agent.toml');
  fs.mkdirSync(path.dirname(unrelated), { recursive: true });
  fs.writeFileSync(unrelated, 'name = "my_personal_agent"\n');

  assert.equal(installCodexAgents({ codexHome, apply: true }, source).state, 'CREATED');
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'name = "my_personal_agent"\n');
}));

test('installer refuses an unmanaged collision without partially creating other Hakim agents', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { MANAGED_MANIFEST_RELATIVE_PATH, installCodexAgents } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'collision');
  const collision = targetAgent(codexHome, AGENTS[0][0]);
  fs.mkdirSync(path.dirname(collision), { recursive: true });
  fs.writeFileSync(collision, 'USER OWNED\n');

  const report = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_UNMANAGED_CONFLICT');
  assert.equal(report.write_attempted, false);
  assert.equal(fs.readFileSync(collision, 'utf8'), 'USER OWNED\n');
  for (const [file] of AGENTS.slice(1)) {
    assert.equal(fs.existsSync(targetAgent(codexHome, file)), false);
  }
  assert.equal(fs.existsSync(path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH)), false);
}));

test('an exact-looking single file without Hakim ownership metadata is still an unmanaged conflict', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { buildCodexAgentBundle, installCodexAgents } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'partial-exact');
  const bundle = buildCodexAgentBundle(source);
  const one = bundle.files[0];
  const target = targetAgent(codexHome, one.target_relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, one.bytes);

  const report = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_UNMANAGED_CONFLICT');
  assert.equal(report.write_attempted, false);
  assert.deepEqual(fs.readFileSync(target), one.bytes);
}));

test('installer refuses symlinked target roots and target agent files', { skip: !MODULE_AVAILABLE || process.platform === 'win32' }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { installCodexAgents } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'target-symlink');

  const outside = path.join(parent, 'outside-agents');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(codexHome, 'agents'), 'dir');
  const rootReport = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(rootReport.status, 'FAIL');
  assert.equal(rootReport.state, 'REFUSED_TARGET_SYMLINK');
  assert.equal(fs.readdirSync(outside).length, 0);

  fs.unlinkSync(path.join(codexHome, 'agents'));
  fs.mkdirSync(path.join(codexHome, 'agents'));
  const externalFile = path.join(parent, 'external-agent.toml');
  fs.writeFileSync(externalFile, 'EXTERNAL\n');
  fs.symlinkSync(externalFile, targetAgent(codexHome, AGENTS[0][0]));
  const fileReport = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(fileReport.status, 'FAIL');
  assert.equal(fileReport.state, 'REFUSED_TARGET_SYMLINK');
  assert.equal(fs.readFileSync(externalFile, 'utf8'), 'EXTERNAL\n');
}));

test('a complete verified prior installation is upgradeable transactionally and status reports the version boundary', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { buildCodexAgentBundle, inspectCodexAgentStatus, installCodexAgents } = await loadLifecycle();
  const oldSource = makePluginSource(parent, '1.1.0', 'old-bytes');
  const newSource = makePluginSource(parent, '1.2.0', 'new-bytes');

  assert.equal(installCodexAgents({ codexHome, apply: true }, oldSource).state, 'CREATED');
  const status = inspectCodexAgentStatus(codexHome, newSource);
  assert.equal(status.status, 'PASS');
  assert.equal(status.state, 'UPGRADE_AVAILABLE');
  assert.equal(status.installed_product_version, '1.1.0');
  assert.equal(status.target_product_version, '1.2.0');

  const dryRun = installCodexAgents({ codexHome, apply: false }, newSource);
  assert.equal(dryRun.state, 'READY_TO_UPGRADE');
  assert.equal(dryRun.filesystem_changed, false);

  const upgraded = installCodexAgents({ codexHome, apply: true }, newSource);
  assert.equal(upgraded.status, 'PASS');
  assert.equal(upgraded.state, 'UPGRADED');
  assert.equal(upgraded.previous_product_version, '1.1.0');
  assert.equal(upgraded.installed_product_version, '1.2.0');

  for (const file of buildCodexAgentBundle(newSource).files) {
    assert.deepEqual(fs.readFileSync(targetAgent(codexHome, file.target_relative)), file.bytes);
  }
  assert.equal(inspectCodexAgentStatus(codexHome, newSource).state, 'EXACT_MATCH');
}));

test('upgrade refuses modified prior managed bytes and leaves the complete prior installation untouched', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { buildCodexAgentBundle, installCodexAgents } = await loadLifecycle();
  const oldSource = makePluginSource(parent, '1.1.0', 'old-safe');
  const newSource = makePluginSource(parent, '1.2.0', 'new-safe');
  assert.equal(installCodexAgents({ codexHome, apply: true }, oldSource).state, 'CREATED');

  const prior = buildCodexAgentBundle(oldSource);
  const changed = targetAgent(codexHome, prior.files[0].target_relative);
  fs.appendFileSync(changed, '\nUSER MODIFICATION\n');
  const snapshot = new Map(AGENTS.map(([file]) => [file, fs.readFileSync(targetAgent(codexHome, file))]));

  const report = installCodexAgents({ codexHome, apply: true }, newSource);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(report.write_attempted, false);
  for (const [file, before] of snapshot) {
    assert.deepEqual(fs.readFileSync(targetAgent(codexHome, file)), before);
  }
}));

test('remover is dry-run by default, removes only verified Hakim bytes, and is idempotent', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { installCodexAgents, removeCodexAgents } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'remove');
  const unrelated = path.join(codexHome, 'agents', 'keep_me.toml');
  fs.mkdirSync(path.dirname(unrelated), { recursive: true });
  fs.writeFileSync(unrelated, 'KEEP\n');

  assert.equal(installCodexAgents({ codexHome, apply: true }, source).state, 'CREATED');

  const dryRun = removeCodexAgents({ codexHome, apply: false }, source);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_REMOVE');
  assert.equal(dryRun.filesystem_changed, false);

  const removed = removeCodexAgents({ codexHome, apply: true }, source);
  assert.equal(removed.status, 'PASS');
  assert.equal(removed.state, 'REMOVED');
  assert.equal(removed.filesystem_changed, true);
  for (const [file] of AGENTS) assert.equal(fs.existsSync(targetAgent(codexHome, file)), false);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'KEEP\n');

  const repeated = removeCodexAgents({ codexHome, apply: true }, source);
  assert.equal(repeated.status, 'PASS');
  assert.equal(repeated.state, 'ALREADY_ABSENT');
  assert.equal(repeated.mutation_attempted, false);
}));

test('remover refuses modified or partial managed state and deletes nothing', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const { installCodexAgents, removeCodexAgents } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'remove-refuse');
  assert.equal(installCodexAgents({ codexHome, apply: true }, source).state, 'CREATED');

  const changed = targetAgent(codexHome, AGENTS[0][0]);
  fs.appendFileSync(changed, '\nLOCAL EDIT\n');
  const snapshot = new Map(AGENTS.map(([file]) => [file, fs.readFileSync(targetAgent(codexHome, file))]));

  const modified = removeCodexAgents({ codexHome, apply: true }, source);
  assert.equal(modified.status, 'FAIL');
  assert.equal(modified.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(modified.mutation_attempted, false);
  for (const [file, before] of snapshot) {
    assert.deepEqual(fs.readFileSync(targetAgent(codexHome, file)), before);
  }

  fs.writeFileSync(changed, 'DIVERGENT MANAGED BYTE\n');
  const survivor = targetAgent(codexHome, AGENTS[1][0]);
  const survivorBefore = fs.readFileSync(survivor);
  fs.unlinkSync(targetAgent(codexHome, AGENTS[2][0]));

  const partial = removeCodexAgents({ codexHome, apply: true }, source);
  assert.equal(partial.status, 'FAIL');
  assert.equal(partial.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(partial.mutation_attempted, false);
  assert.deepEqual(fs.readFileSync(survivor), survivorBefore);
}));

test('missing ownership manifest never authorizes deletion or adoption of existing Hakim-named files', { skip: !MODULE_AVAILABLE }, async () => withCodexHome(async ({ parent, codexHome }) => {
  const {
    MANAGED_MANIFEST_RELATIVE_PATH,
    installCodexAgents,
    removeCodexAgents,
  } = await loadLifecycle();
  const source = makePluginSource(parent, '1.2.3', 'manifest-loss');
  assert.equal(installCodexAgents({ codexHome, apply: true }, source).state, 'CREATED');
  fs.unlinkSync(path.join(codexHome, MANAGED_MANIFEST_RELATIVE_PATH));

  const before = new Map(AGENTS.map(([file]) => [file, fs.readFileSync(targetAgent(codexHome, file))]));
  const reinstall = installCodexAgents({ codexHome, apply: true }, source);
  assert.equal(reinstall.status, 'FAIL');
  assert.match(reinstall.state, /^REFUSED_/);

  const remove = removeCodexAgents({ codexHome, apply: true }, source);
  assert.equal(remove.status, 'FAIL');
  assert.match(remove.state, /^REFUSED_/);

  for (const [file, bytes] of before) {
    assert.deepEqual(fs.readFileSync(targetAgent(codexHome, file)), bytes);
  }
}));

console.log('test_codex_agent_lifecycle_contract.mjs: RED contract loaded');
