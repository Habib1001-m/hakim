#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

function frontmatterName(text, relativePath) {
  const match = text.match(/^name:\s*([a-z0-9-]+)$/m);
  assert.ok(match, `${relativePath} must declare a valid skill name`);
  return match[1];
}

const canonicalPath = 'core/hakim-skill/skills/review/SKILL.md';
const copilotPath = 'plugins/copilot/skills/review/SKILL.md';
const canonical = read(canonicalPath);
const copilot = read(copilotPath);

assert.equal(frontmatterName(canonical, canonicalPath), 'review', 'canonical capability ID must remain review');
assert.equal(
  frontmatterName(copilot, copilotPath),
  'hakim-copilot-review',
  'Copilot review projection must use a host-local routing ID that cannot be shadowed by a generic higher-precedence review skill',
);
assert.equal(
  copilot.replace(/^name:\s*hakim-copilot-review$/m, 'name: review'),
  canonical,
  'Copilot review projection may differ from the canonical review contract only by the host-local routing ID',
);

for (const capability of ['hakim', 'audit', 'debt', 'status', 'help']) {
  const relativePath = `plugins/copilot/skills/${capability}/SKILL.md`;
  assert.equal(
    frontmatterName(read(relativePath), relativePath),
    capability,
    `${relativePath} must not be renamed without a proven collision`,
  );
}

const reviewer = read('plugins/copilot/agents/hakim-reviewer.agent.md');
assert.match(
  reviewer,
  /Load and follow the installed `hakim-copilot-review` skill as the canonical `review` contract\./,
  'Copilot reviewer agent must route through the collision-safe review skill ID while preserving canonical review semantics',
);
assert.doesNotMatch(
  reviewer,
  /Load and follow the installed `review` skill/,
  'Copilot reviewer agent must not route through the shadowable generic review skill ID',
);

const help = read('core/hakim-skill/skills/help/SKILL.md');
assert.match(
  help,
  /GitHub Copilot CLI\n\s+\/hakim\/hakim\n\s+\/hakim\/hakim-copilot-review\n\s+\/hakim\/audit/m,
  'public help must advertise the collision-safe Copilot review route',
);

console.log('test_copilot_skill_collision_contract.mjs: collision-safe review routing contract OK');
