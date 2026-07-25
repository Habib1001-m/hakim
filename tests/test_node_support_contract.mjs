#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'public-ci.yml'), 'utf8');

assert.equal(packageJson.engines?.node, '>=22', 'Hakim must not claim EOL Node 18/20 support');
assert.match(packageJson.scripts?.['test:node-compat'] || '', /test_opencode_plugin\.mjs/);
assert.match(packageJson.scripts?.['test:node-compat'] || '', /test_hakim_opencode_lifecycle\.mjs/);
assert.match(packageJson.scripts?.['test:node-compat'] || '', /test_hakim_opencode_adversarial_transactions\.mjs/);
assert.match(packageJson.scripts?.['test:node-compat'] || '', /test_hakim_opencode_cli\.mjs/);
assert.match(packageJson.scripts?.['test:node-compat'] || '', /check_public_package_surface\.mjs/);

for (const version of ['22', '24', '26']) {
  assert.match(workflow, new RegExp(`node-version: "${version}"`), `Public CI must cover Node ${version}`);
}
assert.match(workflow, /node22-compatibility:/, 'Public CI must keep an explicit minimum-version compatibility job');
assert.match(workflow, /node26-compatibility:/, 'Public CI must keep an explicit current-version compatibility job');
assert.match(workflow, /Run shipped-package compatibility suite on Node 22[\s\S]*npm run test:node-compat/, 'Node 22 job must run the shipped-package compatibility suite');
assert.match(workflow, /Run shipped-package compatibility suite on Node 26[\s\S]*npm run test:node-compat/, 'Node 26 job must run the shipped-package compatibility suite');

console.log('node support contract OK: shipped package engines >=22, CI covers Node 22/24/26');
