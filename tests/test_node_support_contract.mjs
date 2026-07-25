#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'public-ci.yml'), 'utf8');

assert.equal(packageJson.engines?.node, '>=22', 'Hakim must not claim EOL Node 18/20 support');
for (const version of ['22', '24', '26']) {
  assert.match(workflow, new RegExp(`node-version: "${version}"`), `Public CI must cover Node ${version}`);
}
assert.match(workflow, /node22-compatibility:/, 'Public CI must keep an explicit minimum-version compatibility job');
assert.match(workflow, /node26-compatibility:/, 'Public CI must keep an explicit current-version compatibility job');
assert.match(workflow, /Run public JavaScript suite on Node 22[\s\S]*npm run test:public:js/, 'Node 22 compatibility job must run the complete public JavaScript suite');
assert.match(workflow, /Run public JavaScript suite on Node 26[\s\S]*npm run test:public:js/, 'Node 26 compatibility job must run the complete public JavaScript suite');

console.log('node support contract OK: engines >=22, CI covers Node 22/24/26');
