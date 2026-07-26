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

// POST-E1 T01: a runnable repository should establish a bounded baseline before
// the first mutation when reasonably available. The contract must also preserve
// proportionality and truthful reporting when no baseline can be run.
for (const phrase of [
  'Pre-mutation baseline',
  'before the first mutation',
  'representative baseline',
  'record why no baseline was run',
  'pre-existing green state',
]) {
  assert.match(canonical, new RegExp(phrase, 'i'), `canonical Hakim contract missing T01 phrase: ${phrase}`);
}

const projections = [
  'plugins/codex/skills/hakim/SKILL.md',
  'plugins/claude-code/skills/hakim/SKILL.md',
  'plugins/copilot/skills/hakim/SKILL.md',
];

for (const relativePath of projections) {
  const projection = fs.readFileSync(path.join(root, relativePath), 'utf8');
  assert.match(projection, /pre-mutation baseline/i, `${relativePath} missing T01 baseline semantics`);
  assert.match(projection, /before the first mutation/i, `${relativePath} missing T01 ordering semantics`);
  assert.match(projection, /record why no baseline was run/i, `${relativePath} missing T01 no-baseline truth boundary`);
}

console.log('test_rule_copies.js: fixture, canonical integrity, and T01 baseline contract ok');
