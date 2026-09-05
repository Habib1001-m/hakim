#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildOpenCodeBundle } from '../scripts/lib/opencode_bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_PATH = path.join(ROOT, 'plugins', 'opencode', 'hakim.mjs');
const CAPABILITIES = ['hakim', 'review', 'audit', 'debt', 'status', 'help'];
const SPECIALIZED = CAPABILITIES.filter((name) => name !== 'hakim');

async function loadPlugin() {
  const url = `${pathToFileURL(PLUGIN_PATH).href}?discoverability=${Date.now()}-${Math.random()}`;
  const module = await import(url);
  return module.default;
}

test('OpenCode installed surface exposes Hakim-namespaced Markdown discovery routes for specialized capabilities', () => {
  const bundle = buildOpenCodeBundle(ROOT);
  const byTarget = new Map(bundle.files.map((file) => [file.target_relative, file]));

  for (const capability of SPECIALIZED) {
    const namespaced = `.opencode/commands/hakim/${capability}.md`;
    const file = byTarget.get(namespaced);

    assert.ok(file, `managed bundle must include ${namespaced}`);
    const text = file.bytes.toString('utf8');
    assert.match(text, /^---\n/m);
    assert.match(text, /description:\s+Hakim\b/i);
    assert.ok(text.includes(`Load the \`${capability}\` skill`), `command must route to native ${capability} skill`);
  }
});

test('OpenCode keeps canonical capability routes while namespaced discovery routes stay file-backed aliases', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const config = {};

  await hooks.config(config);

  assert.deepEqual(CAPABILITIES.filter((name) => config.command?.[name]), CAPABILITIES);
  for (const capability of SPECIALIZED) {
    assert.equal(config.command?.[`hakim/${capability}`], undefined, `discoverability alias must be file-backed: hakim/${capability}`);
  }
});

console.log('test_opencode_discoverability.mjs: namespaced OpenCode command discovery contract OK');
