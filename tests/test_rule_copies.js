'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rules = require('../core/hakim-skill/scripts/check_rule_copies.js');

const root = path.resolve(__dirname, '..');
const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/skill_with_bom_and_blank.md'), 'utf8');
const canonical = fs.readFileSync(path.join(root, 'core/hakim-skill/SKILL.md'), 'utf8');
const frontmatter = rules.extractFrontmatter(fixture);

assert.ok(frontmatter, 'frontmatter should be found with BOM and leading blank lines');
assert.equal(frontmatter.fields.name, 'hakim');
assert.equal(frontmatter.fields['argument-hint'], '"[lite|full|ultra|off]"');
assert.match(frontmatter.fields.description, /Test skill fixture/);

const analysis = rules.analyzeSkill(fixture);
assert.deepEqual(analysis.missing_yaml_fields, []);
assert.deepEqual(analysis.missing_sections, []);

const canonicalAnalysis = rules.analyzeSkill(canonical);
assert.deepEqual(canonicalAnalysis.missing_yaml_fields, []);
assert.deepEqual(canonicalAnalysis.missing_sections, []);
assert.ok(canonicalAnalysis.sections.capabilities);

// Permanent behavior contract: a runnable repository should establish a bounded
// baseline before the first mutation when reasonably available. Baseline
// discovery itself must remain read-only unless setup mutation is justified.
for (const phrase of [
  'Pre-mutation baseline',
  'before the first mutation',
  'representative baseline',
  'Baseline discovery is read-only',
  'editable installs',
  'lockfile or package-metadata generation',
  'setup mutation',
  'record why no baseline was run',
  'pre-existing green state',
]) {
  assert.match(canonical, new RegExp(phrase, 'i'), `canonical Hakim contract missing baseline phrase: ${phrase}`);
}

// Permanent evidence-sufficiency contract: repository inspection terminates
// once decision-relevant evidence is sufficient; extra exploration or local
// analysis artifacts need a concrete unresolved question.
for (const phrase of [
  'Evidence sufficiency',
  'affected implementation path',
  'local conventions',
  'material safety',
  'validation surface',
  'concrete unresolved question',
  'whole-repository exploration',
  'planning or analysis artifacts',
  'repeat equivalent analysis',
]) {
  assert.match(canonical, new RegExp(phrase, 'i'), `canonical Hakim contract missing evidence-sufficiency phrase: ${phrase}`);
}

// Permanent guard-preservation contract: simplification must preserve real
// product/domain invariants rather than treating validation as removable weight.
for (const phrase of [
  'Domain-guard preservation',
  'domain-level validation',
  'protected invariant',
  'simplification must not remove',
  'preserved elsewhere',
]) {
  assert.match(canonical, new RegExp(phrase, 'i'), `canonical Hakim contract missing guard-preservation phrase: ${phrase}`);
}

// Permanent outcome-restraint contract: smallest means sufficient/coherent/safe,
// not a line-count target.
for (const phrase of [
  'Outcome-oriented restraint',
  'smallest sufficient, coherent, safe change',
  'fewest lines or files',
  'same bounded change',
  'line count is not the objective',
]) {
  assert.match(canonical, new RegExp(phrase, 'i'), `canonical Hakim contract missing outcome-restraint phrase: ${phrase}`);
}

// Permanent bounded-no-change contract: a no-change decision stays scoped to
// inspected evidence and must not silently become a global minimality claim.
for (const phrase of [
  'Bounded `NO_CHANGE` truth',
  'No justified change found within the inspected scope',
  'globally minimal',
  'remaining uncertainty',
]) {
  assert.match(canonical, new RegExp(phrase, 'i'), `canonical Hakim contract missing bounded no-change phrase: ${phrase}`);
}

const projections = [
  'plugins/codex/skills/hakim/SKILL.md',
  'plugins/claude-code/skills/hakim/SKILL.md',
  'plugins/copilot/skills/hakim/SKILL.md',
];

for (const relativePath of projections) {
  const projection = fs.readFileSync(path.join(root, relativePath), 'utf8');
  assert.match(projection, /pre-mutation baseline/i, `${relativePath} missing baseline semantics`);
  assert.match(projection, /before the first mutation/i, `${relativePath} missing baseline ordering semantics`);
  assert.match(projection, /baseline discovery is read-only/i, `${relativePath} missing baseline-purity semantics`);
  assert.match(projection, /editable\s+installs/i, `${relativePath} missing setup-mutation examples`);
  assert.match(projection, /setup mutation/i, `${relativePath} missing setup-mutation truth boundary`);
  assert.match(projection, /record why no baseline was run/i, `${relativePath} missing no-baseline truth boundary`);
  assert.match(projection, /evidence sufficiency/i, `${relativePath} missing stopping semantics`);
  assert.match(projection, /concrete unresolved question/i, `${relativePath} missing decision-value gate`);
  assert.match(projection, /planning[/-]?analysis artifacts|planning or analysis artifacts/i, `${relativePath} missing anti-ceremony semantics`);
  assert.match(projection, /domain-guard preservation/i, `${relativePath} missing guard-preservation semantics`);
  assert.match(projection, /simplification must not remove/i, `${relativePath} missing simplification boundary`);
  assert.match(projection, /outcome-oriented restraint/i, `${relativePath} missing outcome semantics`);
  assert.match(projection, /smallest sufficient, coherent, safe change/i, `${relativePath} missing sufficient-change semantics`);
  assert.match(projection, /No justified change found within the inspected scope/i, `${relativePath} missing bounded no-change wording`);
  assert.match(projection, /globally minimal/i, `${relativePath} missing no-global-minimality boundary`);
}

console.log('test_rule_copies.js: fixture, canonical integrity, and permanent behavior contracts ok');
