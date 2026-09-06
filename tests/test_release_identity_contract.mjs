#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));
const version = read('core/hakim-skill/VERSION').trim();

assert.equal(readJson('package.json').version, version, 'package.json version must match canonical VERSION');

const pyprojectVersion = read('pyproject.toml').match(/^version\s*=\s*"([^"]+)"\s*$/m)?.[1];
assert.equal(pyprojectVersion, version, 'pyproject.toml version must match canonical VERSION');

const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
assert.equal(claudeMarketplace.plugins?.[0]?.version, version, 'Claude marketplace version must match canonical VERSION');

const copilotMarketplace = readJson('.github/plugin/marketplace.json');
assert.equal(copilotMarketplace.metadata?.version, version, 'Copilot marketplace metadata version must match canonical VERSION');
assert.equal(copilotMarketplace.plugins?.[0]?.version, version, 'Copilot marketplace plugin version must match canonical VERSION');

console.log(`test_release_identity_contract.mjs: distributed metadata agrees on ${version}`);
