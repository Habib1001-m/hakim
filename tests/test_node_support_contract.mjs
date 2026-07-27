#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'public-ci.yml'), 'utf8');

assert.equal(packageJson.engines?.node, '>=22', 'Hakim must not claim EOL Node 18/20 support');

const repoGate = packageJson.scripts?.test || '';
assert.equal(repoGate, 'npm run test:repo', 'npm test must delegate to the canonical repository gate');
assert.match(packageJson.scripts?.['test:repo'] || '', /npm run test:public/);
assert.match(packageJson.scripts?.['test:repo'] || '', /npm run package:release/);

const compatScript = packageJson.scripts?.['test:node-compat'] || '';
for (const required of [
  'test_node_support_contract.mjs',
  'test_opencode_plugin.mjs',
  'test_hakim_opencode_lifecycle.mjs',
  'test_product_truth_contract.mjs',
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

assert.match(
  workflow,
  /name: Run canonical repository gate\s+run: npm test/,
  'Node 24 primary job must invoke the canonical npm test repository gate',
);

for (const version of ['22', '26']) {
  assert.match(
    workflow,
    new RegExp(`node${version}-compatibility:[\\s\\S]*name: Run Node ${version} compatibility gate[\\s\\S]*run: npm run test:node-compat`),
    `Node ${version} compatibility job must invoke the shared test:node-compat gate`,
  );
}

const duplicateCompatCommands = [
  'node tests/test_opencode_plugin.mjs',
  'node tests/test_hakim_opencode_lifecycle.mjs',
  'node tests/test_hakim_opencode_adversarial_transactions.mjs',
  'node tests/test_hakim_opencode_cli.mjs',
  'node tests/test_hakim_opencode_package_surface.mjs',
];
for (const command of duplicateCompatCommands) {
  assert.ok(!workflow.includes(command), `Public CI must not duplicate compatibility command outside package.json: ${command}`);
}

console.log('node support contract OK: shipped package engines >=22, canonical Node 24 gate plus shared Node 22/26 compatibility gate');
