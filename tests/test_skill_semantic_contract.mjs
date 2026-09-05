#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const CAPABILITIES = ['hakim', 'review', 'audit', 'debt', 'status', 'help'];
const canonicalPathFor = (name) => name === 'hakim'
  ? 'core/hakim-skill/SKILL.md'
  : `core/hakim-skill/skills/${name}/SKILL.md`;

function frontmatterDescription(text, relativePath) {
  const match = text.match(/^description:\s*(.+)$/m);
  assert.ok(match, `${relativePath} must have a description field`);
  const raw = match[1].trim();
  const description = raw.startsWith('"') ? JSON.parse(raw) : raw;
  assert.ok(description.length > 0 && description.length <= 1024, `${relativePath} description must fit the Agent Skills catalog contract`);
  return description;
}

for (const name of CAPABILITIES) {
  const relativePath = canonicalPathFor(name);
  const description = frontmatterDescription(read(relativePath), relativePath);
  assert.match(
    description,
    /^Hakim — Use\b/u,
    `${relativePath} description must visibly identify Hakim and state when the skill should be used`,
  );
}

const audit = read(canonicalPathFor('audit'));
assert.doesNotMatch(
  audit,
  /<severity>/i,
  'audit output contract must not require an undefined severity classification',
);

const help = read(canonicalPathFor('help'));
assert.match(
  help,
  /GitHub Copilot CLI\n\s+\/hakim\/hakim\n\s+\/hakim\/review\n\s+\/hakim\/audit\n\s+\/hakim\/debt\n\s+\/hakim\/status\n\s+\/hakim\/help/m,
  'help must show collision-safe plugin-qualified Copilot skill invocation',
);
assert.match(
  help,
  /OpenCode\n\s+\/hakim\n\s+\/review\n\s+\/audit\n\s+\/debt\n\s+\/status\n\s+\/help/m,
  'help must show the current OpenCode native command surface',
);

console.log('test_skill_semantic_contract.mjs: discovery and invocation contract OK');
