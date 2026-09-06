#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_PATH = path.join(ROOT, 'plugins', 'opencode', 'hakim.mjs');
const CAPABILITIES = ['hakim', 'review', 'audit', 'debt', 'status', 'help'];

async function loadPlugin() {
  const url = `${pathToFileURL(PLUGIN_PATH).href}?discoverability=${Date.now()}-${Math.random()}`;
  const module = await import(url);
  return module.default;
}

test('OpenCode slash descriptions make every canonical Hakim command visibly discoverable', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const config = {};

  await hooks.config(config);

  assert.deepEqual(CAPABILITIES.filter((name) => config.command?.[name]), CAPABILITIES);
  for (const capability of CAPABILITIES) {
    const description = config.command[capability]?.description;
    assert.equal(typeof description, 'string', `missing description for /${capability}`);
    assert.match(description, /^Hakim\b/, `/${capability} must be visibly branded as Hakim in slash discovery`);
  }

  for (const alias of ['hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-status', 'hakim-help', 'hakim/review', 'hakim/audit', 'hakim/debt', 'hakim/status', 'hakim/help']) {
    assert.equal(config.command[alias], undefined, `discoverability fix must not add alias command: ${alias}`);
  }
});

console.log('test_opencode_discoverability.mjs: canonical Hakim slash descriptions are visibly branded');
