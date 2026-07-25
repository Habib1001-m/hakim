#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const errors = [];

if (!fs.existsSync(packagePath)) {
  errors.push('missing package.json');
} else {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.private !== true) errors.push('package.json must remain private');
  if (pkg.engines?.node !== '>=22') errors.push('public Node support contract must be >=22');
  if (pkg.bin?.['hakim-opencode'] !== 'scripts/hakim_opencode_cli.mjs') {
    errors.push('Git-backed OpenCode bootstrap bin is missing or unexpected');
  }
  const expectedBootstrapFiles = [
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
  if (!Array.isArray(pkg.files) || pkg.files.length !== expectedBootstrapFiles.length) {
    errors.push('Git-backed bootstrap package files allowlist has unexpected size');
  } else {
    for (const relative of expectedBootstrapFiles) {
      if (!pkg.files.includes(relative)) errors.push(`Git-backed bootstrap package missing allowlisted path: ${relative}`);
    }
  }
  if (pkg.scripts?.test !== 'npm run test:public') errors.push('test must route to test:public');
  for (const script of [
    'test:public',
    'test:public:js',
    'test:public:py',
    'doctor',
    'doctor:json',
    'doctor:fast',
    'package:skill',
    'install:opencode',
    'remove:opencode',
  ]) {
    if (!pkg.scripts?.[script]) errors.push(`missing package script: ${script}`);
  }

  for (const internalScript of [
    'check:product-state',
    'check:transition-state',
    'check:metadata',
    'check:taskboard',
    'check:beta-feedback-form',
    'evidence:guarded-session',
    'benchmark:verify',
    'evaluate:clean-journey',
  ]) {
    if (pkg.scripts?.[internalScript]) errors.push(`internal package script remains: ${internalScript}`);
  }

  for (const obsoleteDistributionScript of ['build:native-plugin', 'verify:native-prerelease']) {
    if (pkg.scripts?.[obsoleteDistributionScript]) errors.push(`obsolete distribution script remains: ${obsoleteDistributionScript}`);
  }
}

for (const relative of [
  'core/hakim-skill/SKILL.md',
  'core/hakim-skill/AGENTS.md',
  'scripts/hakim_doctor.mjs',
  'scripts/hakim_opencode_cli.mjs',
  'scripts/lib/opencode_transaction.mjs',
  'scripts/verify_package.py',
]) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`missing required public file: ${relative}`);
}

for (const relative of [
  'docs/EXTERNAL_BETA_EVALUATION.md',
  '.github/ISSUE_TEMPLATE/public-beta-feedback.yml',
  'docs/agentic-ai-reference-SPEC.md',
  'docs/theoretical-reference',
  'plugins/hermes',
  'plugins/gemini-antigravity',
  'packaging/native-plugin',
  'scripts/build_native_plugin_package.mjs',
  'scripts/pack_native_plugin_tarball.mjs',
  'scripts/verify_native_plugin_prerelease.mjs',
  'scripts/run_native_plugin_opencode_smoke.sh',
  'tests/verify_native_plugin_opencode_smoke.mjs',
  'tests/test_native_plugin_tarball.mjs',
  'tests/test_native_plugin_realpath_containment.mjs',
  'tests/test_native_plugin_transactional_lifecycle.mjs',
]) {
  if (fs.existsSync(path.join(root, relative))) errors.push(`retired public product surface remains: ${relative}`);
}

const payload = { ok: errors.length === 0, errors };
console.log(JSON.stringify(payload, null, 2));
process.exit(payload.ok ? 0 : 1);
