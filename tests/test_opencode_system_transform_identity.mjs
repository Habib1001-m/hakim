#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_PATH = path.join(ROOT, 'plugins', 'opencode', 'hakim.mjs');

const module = await import(`${pathToFileURL(PLUGIN_PATH).href}?identity=${Date.now()}`);
const hooks = await module.default({});

const originalSystem = ['BASE'];
const output = { system: originalSystem };

await hooks['experimental.chat.system.transform']({ sessionID: 'fresh-live-shape' }, output);

assert.equal(
  output.system,
  originalSystem,
  'OpenCode system transform must preserve the host-owned output.system array reference',
);
assert.equal(originalSystem.length, 1);
assert.match(originalSystem[0], /^BASE/);
assert.match(originalSystem[0], /<!-- hakim-system:v1 mode=full -->/);
assert.match(originalSystem[0], /## The 7-level decision ladder/);

console.log('test_opencode_system_transform_identity.mjs: host-owned system array is mutated in place');
