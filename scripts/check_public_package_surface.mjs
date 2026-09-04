#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = [];

const expectedFiles = [
  'core/hakim-skill/VERSION',
  'core/hakim-skill/SKILL.md',
  'core/hakim-skill/capabilities.json',
  'core/hakim-skill/skills',
  'core/loaders/hakim-loader.mjs',
  'plugins/opencode/hakim.mjs',
  'scripts/hakim_opencode_cli.mjs',
  'scripts/hakim_opencode_install.mjs',
  'scripts/hakim_opencode_remove.mjs',
  'scripts/lib/opencode_bundle.mjs',
  'scripts/lib/opencode_transaction.mjs',
];

if (pkg.private !== true) errors.push('package.json must remain private until registry publication is explicitly enabled');
if (pkg.engines?.node !== '>=22') errors.push('supported Node runtime must be >=22');
if (pkg.bin?.['hakim-opencode'] !== 'scripts/hakim_opencode_cli.mjs') errors.push('OpenCode bootstrap bin is missing');
if (JSON.stringify(pkg.files) !== JSON.stringify(expectedFiles)) errors.push('package files allowlist is unexpected');

for (const relative of expectedFiles) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`package path missing: ${relative}`);
}

for (const script of [
  'test',
  'test:product',
  'test:js',
  'test:py',
  'test:node-compat',
  'package:skill',
  'package:release',
  'release:sbom',
  'release:sbom:verify',
  'release:checksums',
  'release:checksums:verify',
  'install:opencode',
  'remove:opencode',
]) {
  if (!pkg.scripts?.[script]) errors.push(`missing package script: ${script}`);
}

for (const relative of [
  'plugins/codex/.codex-plugin/plugin.json',
  'plugins/codex/hooks/hooks.json',
  'plugins/claude-code/.claude-plugin/plugin.json',
  'plugins/claude-code/hooks/hooks.json',
  'plugins/copilot/plugin.json',
  'plugins/copilot/hooks/hooks.json',
  'plugins/opencode/hakim.mjs',
]) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`runtime surface missing: ${relative}`);
}

if (fs.existsSync(path.join(root, 'scripts/lib/opencode_prior_manifests.mjs'))) {
  errors.push('retired OpenCode beta.2-beta.4 manifest archive must not remain in the product tree');
}

console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
