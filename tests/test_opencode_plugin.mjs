#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_PATH = path.join(ROOT, 'plugins', 'opencode', 'hakim.mjs');
const SENTINEL = '<!-- hakim-system:v1 mode=';

async function loadPlugin(pluginPath = PLUGIN_PATH) {
  const url = `${pathToFileURL(pluginPath).href}?test=${Date.now()}-${Math.random()}`;
  const module = await import(url);
  return module.default;
}

function createClient(logs) {
  return {
    app: {
      async log({ body }) {
        logs.push(body);
      },
    },
  };
}

async function applyTransform(hooks, output, sessionID = 'session-1') {
  await hooks['experimental.chat.system.transform']({ sessionID }, output);
  return output.system;
}

async function transform(hooks, sessionID = 'session-1', initial = []) {
  const output = { system: [...initial] };
  await applyTransform(hooks, output, sessionID);
  return output.system;
}

function occurrences(text, needle) {
  return text.split(needle).length - 1;
}

test('OpenCode plugin registers canonical commands and skills path without overwrite', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const existing = { description: 'keep me', template: 'existing' };
  const config = { command: { 'hakim-review': existing } };

  await hooks.config(config);

  assert.equal(config.command['hakim-review'], existing, 'existing host command must not be overwritten');
  assert.deepEqual(
    ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help']
      .filter((name) => config.command[name]),
    ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'],
  );
  assert.match(config.command.hakim.template, /\$1/);
  assert.match(config.command['hakim-audit'].template, /native skill tool/);
  assert.match(config.command['hakim-help'].template, /show the Hakim quick reference/);
  assert.match(config.command['hakim-help'].template, /Do not require additional arguments/);
  assert.equal(config.skills.paths.length, 1);
  assert.equal(config.skills.paths[0], path.join(ROOT, 'core', 'hakim-skill', 'skills'));

  await hooks.config(config);
  assert.equal(config.skills.paths.length, 1, 'skills path registration must be idempotent');
});

test('system transform injects canonical full rules into one system entry', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const system = await transform(hooks, 'full-session', ['BASE']);

  assert.equal(system.length, 1);
  assert.match(system[0], /^BASE/);
  assert.match(system[0], /<!-- hakim-system:v1 mode=full -->/);
  assert.match(system[0], /# Hakim activation \(full\)/);
  assert.match(system[0], /Canonical Hakim policy loaded from the active distribution\./);
  assert.doesNotMatch(system[0], /Canonical source: core\/hakim-skill\/SKILL\.md/);
  assert.match(system[0], /## The Ladder/);
});

test('system transform is idempotent on reused output and replaces mode blocks instead of duplicating them', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const output = { system: ['BASE'] };

  await applyTransform(hooks, output, 'same-session');
  await applyTransform(hooks, output, 'same-session');
  assert.equal(output.system.length, 1);
  assert.equal(occurrences(output.system[0], SENTINEL), 1);
  assert.equal(occurrences(output.system[0], '# Hakim activation (full)'), 1);

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'ultra', sessionID: 'same-session' });
  await applyTransform(hooks, output, 'same-session');
  assert.equal(occurrences(output.system[0], SENTINEL), 1);
  assert.doesNotMatch(output.system[0], /# Hakim activation \(full\)/);
  assert.match(output.system[0], /# Hakim activation \(ultra\)/);

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'off', sessionID: 'same-session' });
  await applyTransform(hooks, output, 'same-session');
  assert.deepEqual(output.system, ['BASE']);
});

test('system transform preserves foreign trailing system content when reconciling or disabling Hakim', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const output = { system: ['BASE'] };
  const foreign = '<!-- foreign-plugin -->\nFOREIGN SYSTEM CONTENT';

  await applyTransform(hooks, output, 'coexistence');
  output.system[0] += `\n\n${foreign}`;

  await applyTransform(hooks, output, 'coexistence');
  assert.match(output.system[0], /FOREIGN SYSTEM CONTENT/, 'Hakim reconciliation must not delete trailing system content it does not own');
  assert.equal(occurrences(output.system[0], SENTINEL), 1);
  assert.equal(occurrences(output.system[0], 'FOREIGN SYSTEM CONTENT'), 1);

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'off', sessionID: 'coexistence' });
  await applyTransform(hooks, output, 'coexistence');
  assert.equal(occurrences(output.system[0], SENTINEL), 0);
  assert.match(output.system[0], /FOREIGN SYSTEM CONTENT/, 'disabling Hakim must remove only Hakim-owned content');
});

test('session mode matrix isolates sessions, fallback state, deletion, invalid requests, and fresh instances', async () => {
  const logs = [];
  const load = await loadPlugin();
  const hooks = await load({ client: createClient(logs) });

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'lite', sessionID: 's1' });
  await hooks['command.execute.before']({ command: 'hakim', arguments: 'ultra', sessionID: 's2' });
  assert.match((await transform(hooks, 's1'))[0], /# Hakim activation \(lite\)/);
  assert.match((await transform(hooks, 's2'))[0], /# Hakim activation \(ultra\)/);
  assert.match((await transform(hooks, 'unconfigured'))[0], /# Hakim activation \(full\)/);

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'lite' });
  assert.match((await transform(hooks, 'unconfigured'))[0], /# Hakim activation \(lite\)/);
  assert.match((await transform(hooks, 's2'))[0], /# Hakim activation \(ultra\)/, 'fallback change must not affect explicit session state');

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'unsupported', sessionID: 's1' });
  assert.match((await transform(hooks, 's1'))[0], /# Hakim activation \(lite\)/, 'invalid mode must not reset the session');
  assert.ok(logs.some((entry) => entry.level === 'warn'));

  await hooks.event({ type: 'session.deleted', properties: { sessionID: 's1' } });
  assert.match((await transform(hooks, 's1'))[0], /# Hakim activation \(lite\)/, 'deleted session must fall back to current fallback mode');
  assert.match((await transform(hooks, 's2'))[0], /# Hakim activation \(ultra\)/, 'deleting one session must not affect another');

  const independent = await load({});
  assert.match((await transform(independent, 's2'))[0], /# Hakim activation \(full\)/, 'plugin instances must not share session/fallback state');
});

test('fresh plugin instance resets to configured default and does not persist prior project/session state', async () => {
  const previous = process.env.HAKIM_DEFAULT_MODE;
  try {
    process.env.HAKIM_DEFAULT_MODE = 'ultra';
    const load = await loadPlugin();
    const first = await load({});
    assert.match((await transform(first, 'fresh'))[0], /# Hakim activation \(ultra\)/);
    await first['command.execute.before']({ command: 'hakim', arguments: 'lite', sessionID: 'fresh' });
    assert.match((await transform(first, 'fresh'))[0], /# Hakim activation \(lite\)/);

    const restarted = await load({});
    assert.match((await transform(restarted, 'fresh'))[0], /# Hakim activation \(ultra\)/, 'fresh host/plugin instance must reset to configured default');
  } finally {
    if (previous === undefined) delete process.env.HAKIM_DEFAULT_MODE;
    else process.env.HAKIM_DEFAULT_MODE = previous;
  }
});

test('unrelated commands do not change Hakim mode', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  await hooks['command.execute.before']({ command: 'hakim', arguments: 'lite', sessionID: 's2' });
  await hooks['command.execute.before']({ command: 'test', arguments: 'off', sessionID: 's2' });
  const system = await transform(hooks, 's2');
  assert.match(system[0], /# Hakim activation \(lite\)/);
});

test('copied project-local bundle resolves without repository-relative imports', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-opencode-plugin-'));
  const pluginDir = path.join(temp, '.opencode', 'plugins');
  const runtimeDir = path.join(temp, '.opencode', 'hakim-runtime');
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.mkdirSync(path.join(runtimeDir, 'loaders'), { recursive: true });
  fs.mkdirSync(path.join(runtimeDir, 'hakim-skill'), { recursive: true });

  fs.copyFileSync(PLUGIN_PATH, path.join(pluginDir, 'hakim.js'));
  fs.copyFileSync(path.join(ROOT, 'core', 'loaders', 'hakim-loader.mjs'), path.join(runtimeDir, 'loaders', 'hakim-loader.mjs'));
  fs.copyFileSync(path.join(ROOT, 'core', 'hakim-skill', 'SKILL.md'), path.join(runtimeDir, 'hakim-skill', 'SKILL.md'));
  fs.copyFileSync(path.join(ROOT, 'core', 'hakim-skill', 'capabilities.json'), path.join(runtimeDir, 'hakim-skill', 'capabilities.json'));
  fs.cpSync(path.join(ROOT, 'core', 'hakim-skill', 'skills'), path.join(runtimeDir, 'hakim-skill', 'skills'), { recursive: true });

  try {
    const load = await loadPlugin(path.join(pluginDir, 'hakim.js'));
    const hooks = await load({});
    const config = {};
    await hooks.config(config);
    assert.equal(config.skills.paths[0], path.join(runtimeDir, 'hakim-skill', 'skills'));
    assert.match(config.command['hakim-help'].template, /Do not require additional arguments/);
    const system = await transform(hooks, 'installed');
    assert.match(system[0], /# Hakim activation \(full\)/);
    assert.match(system[0], /active distribution/);
    assert.match(system[0], /## The Ladder/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

console.log('test_opencode_plugin.mjs: ok');