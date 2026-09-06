#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'public-ci.yml'), 'utf8');

assert.equal(packageJson.engines?.node, '>=22', 'Hakim must not claim EOL Node 18/20 support');

const productGate = packageJson.scripts?.test || '';
assert.match(productGate, /npm run test:product/, 'npm test must run the product/runtime suite');
assert.match(productGate, /npm run package:release/, 'npm test must verify the release package');

const compatScript = packageJson.scripts?.['test:node-compat'] || '';
for (const required of [
  'test_node_support_contract.mjs',
  'test_host_runtime_contract.mjs',
  'test_copilot_operational_presence.mjs',
  'test_copilot_objective_completion_truth.mjs',
  'test_copilot_mode_state.mjs',
  'test_copilot_mode_control.mjs',
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

assert.match(
  workflow,
  /name: Test product and release package\s+run: npm test/,
  'Node 24 primary job must invoke the product/runtime plus release-package gate',
);

for (const version of ['22', '26']) {
  assert.match(
    workflow,
    new RegExp(`node${version}-compatibility:[\\s\\S]*name: Test supported runtime[\\s\\S]*run: npm run test:node-compat`),
    `Node ${version} compatibility job must invoke the shared test:node-compat gate`,
  );
}

const duplicateCompatCommands = [
  'node tests/test_host_runtime_contract.mjs',
  'node tests/test_copilot_operational_presence.mjs',
  'node tests/test_copilot_objective_completion_truth.mjs',
  'node tests/test_copilot_mode_state.mjs',
  'node tests/test_copilot_mode_control.mjs',
  'node tests/test_opencode_plugin.mjs',
  'node tests/test_hakim_opencode_lifecycle.mjs',
  'node tests/test_hakim_opencode_adversarial_transactions.mjs',
  'node tests/test_hakim_opencode_cli.mjs',
  'node tests/test_hakim_opencode_package_surface.mjs',
];
for (const command of duplicateCompatCommands) {
  assert.ok(!workflow.includes(command), `Public CI must not duplicate compatibility command outside package.json: ${command}`);
}

console.log('node support contract OK: Node >=22, product/runtime npm test, and shared Node 22/26 compatibility gate');
