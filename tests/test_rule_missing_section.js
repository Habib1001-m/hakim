'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-rules-'));
const broken = path.join(tmp, 'SKILL.md');

fs.writeFileSync(broken, `---
name: hakim
description: broken
argument-hint: "[lite|full|ultra|off]"
---

# Broken Skill

## Intensity Levels
full
`, 'utf8');

const result = spawnSync(
  process.execPath,
  [path.join(root, 'core/hakim-skill/scripts/check_rule_copies.js'), broken, '--json'],
  { cwd: root, encoding: 'utf8' },
);

assert.equal(result.status, 1, result.stderr + result.stdout);
assert.match(result.stdout, /missing_sections/);
console.log('test_rule_missing_section.js: ok');
