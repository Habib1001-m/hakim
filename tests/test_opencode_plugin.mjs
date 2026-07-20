#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_PATH = path.join(ROOT, 'plugins', 'opencode', 'hakim.mjs');

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

async function transform(hooks, sessionID = 'session-1', initial = []) {
  const output = { system: [...initial] };
  await hooks['experimental.chat.system.transform']({ sessionID }, output);
  return output.system;
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
  assert.match(system[0], /# Hakim activation \(full\)/);
  assert.match(system[0], /Canonical source: core\/hakim-skill\/SKILL\.md/);
  assert.match(system[0], /## The Ladder/);
});

test('session mode command applies ultra, off, invalid-mode refusal, and cleanup', async () => {
  const logs = [];
  const load = await loadPlugin();
  const hooks = await load({ client: createClient(logs) });

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'ultra', sessionID: 's1' });
  const ultra = await transform(hooks, 's1');
  assert.match(ultra[0], /# Hakim activation \(ultra\)/);
  assert.match(ultra[0], /YAGNI extremist mode/);

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'unsupported', sessionID: 's1' });
  const stillUltra = await transform(hooks, 's1');
  assert.match(stillUltra[0], /# Hakim activation \(ultra\)/, 'invalid mode must not reset the session');
  assert.ok(logs.some((entry) => entry.level === 'warn'));

  await hooks['command.execute.before']({ command: 'hakim', arguments: 'off', sessionID: 's1' });
  assert.deepEqual(await transform(hooks, 's1'), []);

  await hooks.event({ type: 'session.deleted', properties: { sessionID: 's1' } });
  const restoredDefault = await transform(hooks, 's1');
  assert.match(restoredDefault[0], /# Hakim activation \(full\)/);
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

  fs.copyFileSync(PLUGIN_PATH, path.join(pluginDir, 'hakim.mjs'));
  fs.copyFileSync(
    path.join(ROOT, 'core', 'loaders', 'hakim-loader.mjs'),
    path.join(runtimeDir, 'loaders', 'hakim-loader.mjs'),
  );
  fs.copyFileSync(
    path.join(ROOT, 'core', 'hakim-skill', 'SKILL.md'),
    path.join(runtimeDir, 'hakim-skill', 'SKILL.md'),
  );
  fs.copyFileSync(
    path.join(ROOT, 'core', 'hakim-skill', 'capabilities.json'),
    path.join(runtimeDir, 'hakim-skill', 'capabilities.json'),
  );
  fs.cpSync(
    path.join(ROOT, 'core', 'hakim-skill', 'skills'),
    path.join(runtimeDir, 'hakim-skill', 'skills'),
    { recursive: true },
  );

  try {
    const load = await loadPlugin(path.join(pluginDir, 'hakim.mjs'));
    const hooks = await load({});
    const config = {};
    await hooks.config(config);
    assert.equal(
      config.skills.paths[0],
      path.join(runtimeDir, 'hakim-skill', 'skills'),
    );
    const system = await transform(hooks, 'installed');
    assert.match(system[0], /# Hakim activation \(full\)/);
    assert.match(system[0], /## The Ladder/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

console.log('test_opencode_plugin.mjs: ok');
