#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'public-ci.yml'), 'utf8');

assert.equal(packageJson.engines?.node, '>=22', 'Hakim must not claim EOL Node 18/20 support');
assert.match(workflow, /node-version: "24"/, 'primary Public CI must retain Node 24 LTS coverage');
assert.match(workflow, /node:\s*\["22", "26"\]/, 'compatibility matrix must cover the minimum supported LTS and current Node release');
assert.match(workflow, /node-version: \$\{\{ matrix\.node \}\}/, 'compatibility job must execute the declared matrix');
assert.match(workflow, /npm run test:public:js/, 'compatibility matrix must run the complete public JavaScript suite');

console.log('node support contract OK: engines >=22, CI covers Node 22/24/26');
