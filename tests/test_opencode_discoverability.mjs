#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildOpenCodeBundle } from '../scripts/lib/opencode_bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_PATH = path.join(ROOT, 'plugins', 'opencode', 'hakim.mjs');
const SPECIALIZED = ['review', 'audit', 'debt', 'status', 'help'];

async function loadPlugin() {
  const url = `${pathToFileURL(PLUGIN_PATH).href}?discoverability=${Date.now()}-${Math.random()}`;
  const module = await import(url);
  return module.default;
}

test('OpenCode installed surface exposes Hakim-namespaced Markdown commands for specialized capabilities', () => {
  const bundle = buildOpenCodeBundle(ROOT);
  const byTarget = new Map(bundle.files.map((file) => [file.target_relative, file]));

  for (const capability of SPECIALIZED) {
    const namespaced = `.opencode/commands/hakim/${capability}.md`;
    const flat = `.opencode/commands/${capability}.md`;
    const file = byTarget.get(namespaced);

    assert.ok(file, `managed bundle must include ${namespaced}`);
    assert.equal(byTarget.has(flat), false, `flat unbranded command must not be installed: ${flat}`);
    const text = file.bytes.toString('utf8');
    assert.match(text, /^---\n/m);
    assert.match(text, /description:\s+Hakim\b/i);
    assert.ok(text.includes(`Load the \`${capability}\` skill`), `command must route to native ${capability} skill`);
  }
});

test('OpenCode plugin reserves dynamic slash projection for the Hakim mode controller only', async () => {
  const load = await loadPlugin();
  const hooks = await load({});
  const config = {};

  await hooks.config(config);

  assert.deepEqual(Object.keys(config.command || {}).sort(), ['hakim']);
  assert.match(config.command.hakim.description, /Hakim mode/i);
  for (const capability of SPECIALIZED) {
    assert.equal(config.command[capability], undefined, `specialized command must use /hakim/${capability} Markdown discovery`);
  }
});

console.log('test_opencode_discoverability.mjs: namespaced OpenCode command discovery contract OK');
