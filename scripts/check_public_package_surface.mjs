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
  if (pkg.scripts?.test !== 'npm run test:public') {
    errors.push('test must route to test:public');
  }
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
    if (pkg.scripts?.[internalScript]) {
      errors.push(`internal package script remains: ${internalScript}`);
    }
  }

  for (const obsoleteDistributionScript of [
    'build:native-plugin',
    'verify:native-prerelease',
  ]) {
    if (pkg.scripts?.[obsoleteDistributionScript]) {
      errors.push(`obsolete distribution script remains: ${obsoleteDistributionScript}`);
    }
  }
}

for (const relative of [
  'core/hakim-skill/SKILL.md',
  'core/hakim-skill/AGENTS.md',
  'scripts/hakim_doctor.mjs',
  'scripts/verify_package.py',
]) {
  if (!fs.existsSync(path.join(root, relative))) {
    errors.push(`missing required public file: ${relative}`);
  }
}

const payload = { ok: errors.length === 0, errors };
console.log(JSON.stringify(payload, null, 2));
process.exit(payload.ok ? 0 : 1);
