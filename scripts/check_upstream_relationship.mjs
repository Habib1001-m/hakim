#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const read = (relativePath) => {
  try {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  } catch (error) {
    errors.push(`cannot read ${relativePath}: ${error.message}`);
    return '';
  }
};

const readJson = (relativePath) => {
  const text = read(relativePath);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`invalid JSON in ${relativePath}: ${error.message}`);
    return {};
  }
};

const compact = (text) => text.replace(/\s+/g, ' ').trim();

const record = readJson('upstream/ponytail.json');
const upstreamDoc = read('UPSTREAM.md');
const notices = read('THIRD_PARTY_NOTICES.md');
const packagedNotices = read('core/hakim-skill/THIRD_PARTY_NOTICES.md');
const rootLicense = read('LICENSE');
const coreLicense = read('core/hakim-skill/LICENSE');
const readme = read('README.md');
const compactReadme = compact(readme);

const expected = {
  name: 'Ponytail',
  repository: 'https://github.com/DietrichGebert/ponytail',
  license: 'MIT',
  reviewed_release: 'v4.8.4',
  reviewed_release_commit: 'bc9ee94',
};

for (const [key, value] of Object.entries(expected)) {
  if (record.upstream?.[key] !== value) {
    errors.push(`upstream.${key} ${JSON.stringify(record.upstream?.[key])} != ${JSON.stringify(value)}`);
  }
}

for (const [key, value] of Object.entries({
  classification: 'governance-focused derivative',
  git_fork: false,
  official_upstream_project: false,
  automatic_compatibility: false,
  automatic_sync: false,
  performance_equivalence: false,
  distribution_equivalence: false,
})) {
  if (record.relationship?.[key] !== value) {
    errors.push(`relationship.${key} ${JSON.stringify(record.relationship?.[key])} != ${JSON.stringify(value)}`);
  }
}

for (const concept of [
  'seven-level smallest-safe-change decision ladder',
  'reuse-first and YAGNI enforcement',
  'lite/full/ultra intensity model',
  'lazy-not-negligent safety boundary',
]) {
  if (!(record.inherited_concepts || []).includes(concept)) {
    errors.push(`missing inherited concept: ${concept}`);
  }
}

for (const differentiation of [
  'evidence-bound PASS/HOLD claim governance',
  'machine-readable cross-host capability contract and parity gates',
  'runtime evidence acceptance packets',
  'metadata and product-truth consistency checks',
  'live-versus-synthetic debt provenance',
  'archive authority boundaries',
  'read-only local startup diagnostics',
]) {
  if (!(record.hakim_implemented_differentiation || []).includes(differentiation)) {
    errors.push(`missing implemented differentiation: ${differentiation}`);
  }
}

if (record.sync_policy?.mode !== 'manual evidence-gated review') {
  errors.push('sync policy must be manual evidence-gated review');
}
if (record.sync_policy?.direct_cherry_pick_without_review !== false) {
  errors.push('direct cherry-pick policy must be false');
}
for (const decision of ['adopt', 'adapt', 'reject', 'defer']) {
  if (!(record.sync_policy?.candidate_decisions || []).includes(decision)) {
    errors.push(`missing upstream decision class: ${decision}`);
  }
}

for (const phrase of [
  'RELATIONSHIP=GOVERNANCE_FOCUSED_DERIVATIVE',
  'GIT_FORK=NO',
  'AUTOMATIC_COMPATIBILITY=NO',
  'UPSTREAM_BENCHMARK_TRANSFER=NO',
  'A Ponytail PASS does not imply a Hakim PASS',
  'Direct cherry-picking without this review is prohibited by policy',
]) {
  if (!upstreamDoc.includes(phrase)) errors.push(`UPSTREAM.md missing: ${phrase}`);
}

for (const text of [notices, packagedNotices]) {
  for (const phrase of [
    'Copyright (c) 2026 DietrichGebert',
    'Permission is hereby granted, free of charge',
    'Ponytail benchmark',
    'do not transfer to Hakim',
  ]) {
    if (!compact(text).includes(phrase)) errors.push(`third-party notice missing: ${phrase}`);
  }
}

if (rootLicense !== coreLicense) {
  errors.push('root and packaged Hakim LICENSE files differ');
}
if (!rootLicense.includes('Copyright (c) 2026 Habib')) {
  errors.push('Hakim license copyright is missing');
}
if (/DietrichGebert/.test(rootLicense)) {
  errors.push('third-party attribution must not be embedded in the Hakim license text');
}

for (const phrase of [
  'governance-focused derivative',
  'not a GitHub fork',
  'UPSTREAM.md',
  'THIRD_PARTY_NOTICES.md',
]) {
  if (!compactReadme.includes(phrase)) errors.push(`README missing relationship phrase: ${phrase}`);
}

for (const forbidden of [
  'official Ponytail fork',
  'fully compatible with Ponytail',
  'Ponytail benchmark applies to Hakim',
  'drop-in replacement for Ponytail',
]) {
  if ([upstreamDoc, notices, packagedNotices, readme].some((text) => compact(text).includes(forbidden))) {
    errors.push(`unsupported upstream claim present: ${forbidden}`);
  }
}

const result = {
  upstream: record.upstream || null,
  relationship: record.relationship || null,
  implemented_differentiation_count: (record.hakim_implemented_differentiation || []).length,
  sync_policy: record.sync_policy?.mode || null,
  notices_checked: 2,
  licenses_match: rootLicense === coreLicense,
  ok: errors.length === 0,
  errors,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
