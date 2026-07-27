#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

const canonical = read('core/hakim-skill/SKILL.md');
const canonicalHash = sha256(canonical);

const canonicalGroups = {
  baseline: [
    /## Pre-mutation baseline/i,
    /before the first mutation/i,
    /representative baseline/i,
    /pre-existing green state/i,
  ],
  sufficiency: [
    /## Evidence sufficiency/i,
    /affected implementation path/i,
    /concrete unresolved question/i,
    /whole-repository exploration/i,
  ],
  guards: [
    /## Domain-guard preservation/i,
    /domain-level validation/i,
    /protected invariant/i,
    /simplification must not remove/i,
    /preserved elsewhere/i,
  ],
  restraint: [
    /## Outcome-oriented restraint/i,
    /smallest sufficient, coherent, safe change/i,
    /fewest lines or files/i,
    /installed dependency/i,
    /speculative architecture/i,
  ],
  claims: [
    /## Evidence and Evaluation Boundaries/i,
    /Public CI proves only/i,
    /without\s+separate\s+accepted\s+evidence/i,
    /runtime validation/i,
  ],
};

for (const [group, patterns] of Object.entries(canonicalGroups)) {
  for (const pattern of patterns) {
    assert.match(canonical, pattern, `canonical ${group} contract missing ${pattern}`);
  }
}

const projections = [
  'plugins/codex/skills/hakim/SKILL.md',
  'plugins/claude-code/skills/hakim/SKILL.md',
  'plugins/copilot/skills/hakim/SKILL.md',
  '.github/copilot-instructions.md',
];

for (const relativePath of projections) {
  const text = read(relativePath);
  const marker = text.match(/hakim-canonical-sha256:\s*([a-f0-9]{64})/i)?.[1]?.toLowerCase();
  assert.equal(marker, canonicalHash, `${relativePath} canonical hash marker drift`);

  for (const pattern of [
    /pre-mutation baseline|before the first mutation/i,
    /evidence sufficiency|stop inspecting/i,
    /protected invariant|domain-guard preservation/i,
    /smallest sufficient, coherent, safe change/i,
    /dependenc(?:y|ies)/i,
    /evidence|inspectable/i,
  ]) {
    assert.match(text, pattern, `${relativePath} missing behavioral projection semantic ${pattern}`);
  }
}

console.log(`test_behavioral_contract.mjs: semantic behavior contract OK (${canonicalHash.slice(0, 12)})`);
