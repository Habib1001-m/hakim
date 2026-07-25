#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'public-ci.yml'), 'utf8');

assert.equal(packageJson.engines?.node, '>=22', 'Hakim must not claim EOL Node 18/20 support');
const compatScript = packageJson.scripts?.['test:node-compat'] || '';
for (const required of [
  'test_opencode_plugin.mjs',
  'test_hakim_opencode_lifecycle.mjs',
  'test_hakim_opencode_adversarial_transactions.mjs',
  'test_hakim_opencode_cli.mjs',
  'test_hakim_opencode_package_surface.mjs',
  'check_public_package_surface.mjs',
]) {
  assert.ok(compatScript.includes(required), `test:node-compat missing ${required}`);
}

for (const version of ['22', '24', '26']) {
  assert.match(workflow, new RegExp(`node-version: "${version}"`), `Public CI must cover Node ${version}`);
}
for (const version of ['22', '26']) {
  assert.match(workflow, new RegExp(`node${version}-compatibility:`), `Public CI must keep Node ${version} compatibility job`);
  for (const step of [
    'support contract',
    'OpenCode plugin runtime',
    'OpenCode lifecycle',
    'adversarial transactions',
    'Git bootstrap CLI',
    'npm package inventory',
    'public package boundary',
  ]) {
    assert.match(workflow, new RegExp(`Node ${version} ${step}`), `Node ${version} compatibility job missing ${step}`);
  }
}
assert.match(workflow, /Verify OpenCode Git bootstrap CLI and package[\s\S]*test_hakim_opencode_cli\.mjs[\s\S]*test_hakim_opencode_package_surface\.mjs/, 'Node 24 primary job must verify CLI and npm package inventory');

console.log('node support contract OK: shipped package engines >=22, CI covers Node 22/24/26');
