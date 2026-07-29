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
    /baseline discovery is read-only/i,
    /editable\s+installs/i,
    /lockfile|package-metadata/i,
    /setup\s+mutation/i,
    /pre-existing green state/i,
  ],
  checkpoints: [
    /## Observable checkpoints/i,
    /BASELINE_COMMAND/,
    /BASELINE_SOURCE/,
    /SETUP_MUTATION/,
    /PRE_EDIT_GIT_STATUS/,
    /SEMANTIC_CHANGE_CHECK/,
    /existing-suite green is not sufficient/i,
    /boundary states/i,
    /FINAL_GIT_STATUS/,
    /SETUP_ARTIFACTS/,
    /UNRELATED_MUTATIONS/,
    /no artifacts/i,
  ],
  sufficiency: [
    /## Evidence sufficiency/i,
    /affected implementation path/i,
    /concrete unresolved question/i,
    /whole-repository exploration/i,
    /planning\s+or\s+analysis\s+artifacts/i,
    /repeat\s+equivalent\s+analysis/i,
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
  noChangeTruth: [
    /## Bounded `NO_CHANGE` truth/i,
    /No justified change found within the inspected scope/i,
    /globally minimal/i,
    /remaining uncertainty/i,
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
    /baseline discovery is read-only/i,
    /editable\s+installs/i,
    /setup\s+mutation/i,
    /BASELINE_COMMAND/,
    /BASELINE_SOURCE/,
    /SETUP_MUTATION/,
    /PRE_EDIT_GIT_STATUS/,
    /SEMANTIC_CHANGE_CHECK/,
    /existing-suite green/i,
    /boundary states/i,
    /FINAL_GIT_STATUS/,
    /SETUP_ARTIFACTS/,
    /UNRELATED_MUTATIONS/,
    /evidence sufficiency|stop inspecting/i,
    /concrete unresolved question/i,
    /planning[/-]?analysis artifacts|planning or analysis artifacts/i,
    /protected invariant|domain-guard preservation/i,
    /smallest sufficient, coherent, safe change/i,
    /No justified change found within the inspected scope/i,
    /globally minimal/i,
    /dependenc(?:y|ies)/i,
    /evidence|inspectable/i,
  ]) {
    assert.match(text, pattern, `${relativePath} missing behavioral projection semantic ${pattern}`);
  }
}

const copilotInstructions = read('.github/copilot-instructions.md');
assert.match(
  copilotInstructions,
  /explicitly requests Hakim[\s\S]{0,180}before any repository-affecting tool or shell command/i,
  'Copilot repository fallback instructions must retain explicit-routing discipline when they are the active surface',
);
assert.match(
  copilotInstructions,
  /BASELINE_COMMAND[\s\S]{0,240}PRE_EDIT_GIT_STATUS/i,
  'Copilot repository instructions must retain the observable pre-edit checkpoint',
);
assert.match(
  copilotInstructions,
  /SEMANTIC_CHANGE_CHECK[\s\S]{0,260}boundary states/i,
  'Copilot repository instructions must require semantic-change evidence beyond existing-suite green',
);
assert.match(
  copilotInstructions,
  /FINAL_GIT_STATUS[\s\S]{0,220}UNRELATED_MUTATIONS/i,
  'Copilot repository instructions must retain final-state truth reconciliation',
);

const copilotSkill = read('plugins/copilot/skills/hakim/SKILL.md');
assert.match(
  copilotSkill,
  /Hakim is present automatically after plugin installation/i,
  'Copilot native plugin must not depend on explicit Hakim invocation for operational presence',
);
assert.match(
  copilotSkill,
  /mode change, not as a repository task[\s\S]{0,180}Do not inspect files, run tools, or load auxiliary Hakim skills/i,
  'Copilot native mode control must remain zero-ceremony and must not turn a mode switch into repository work',
);
assert.match(
  copilotSkill,
  /BASELINE_COMMAND[\s\S]{0,320}PRE_EDIT_GIT_STATUS/i,
  'Copilot native skill must require an observable baseline checkpoint before product edits when explicitly loaded',
);
assert.match(
  copilotSkill,
  /SEMANTIC_CHANGE_CHECK[\s\S]{0,360}existing-suite green/i,
  'Copilot native skill must reject existing-suite green as sole semantic-equivalence evidence',
);
assert.match(
  copilotSkill,
  /FINAL_GIT_STATUS[\s\S]{0,300}UNRELATED_MUTATIONS/i,
  'Copilot native skill must reconcile final repository state before clean/no-artifact claims',
);

const openCodePlugin = read('plugins/opencode/hakim.mjs');
assert.match(
  openCodePlugin,
  /Mode selection only: do not load auxiliary Hakim skills, inspect the repository, or run tools for this command/i,
  'OpenCode mode command must stay a direct mode switch instead of becoming an auxiliary-skill/repository task',
);

console.log(`test_behavioral_contract.mjs: semantic behavior contract OK (${canonicalHash.slice(0, 12)})`);
