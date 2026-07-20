'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rules = require('../core/hakim-skill/scripts/check_rule_copies.js');

const root = path.resolve(__dirname, '..');
const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/skill_with_bom_and_blank.md'), 'utf8');
const frontmatter = rules.extractFrontmatter(fixture);

assert.ok(frontmatter, 'frontmatter should be found with BOM and leading blank lines');
assert.equal(frontmatter.fields.name, 'hakim');
assert.equal(frontmatter.fields['argument-hint'], '"[lite|full|ultra|off]"');
assert.match(frontmatter.fields.description, /Test skill fixture/);

const analysis = rules.analyzeSkill(fixture);
assert.deepEqual(analysis.missing_yaml_fields, []);
assert.deepEqual(analysis.missing_sections, []);

console.log('test_rule_copies.js: ok');
