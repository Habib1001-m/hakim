#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getModeDirective as getCoreModeDirective } from '../core/loaders/hakim-loader.mjs';
import { getModeDirective as getCopilotModeDirective } from '../plugins/copilot/hooks/mode_state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const listDirs = (relativePath) => fs.readdirSync(path.join(ROOT, relativePath), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const CAPABILITIES = ['hakim', 'review', 'audit', 'debt', 'status', 'help'];
const SPECIALIZED = ['audit', 'debt', 'help', 'review', 'status'];
const MODE_DIRECTIVES = Object.freeze({
  lite: 'Lite mode: execute the request and mention a materially smaller safe alternative when one exists.',
  full: 'Full mode: apply the complete Hakim decision model with proportional verification.',
  ultra: 'Ultra mode: challenge additions, abstractions, and dependencies aggressively while preserving the required outcome and real guards.',
  off: 'Hakim guidance disabled for this session.',
});
const canonical = read('core/hakim-skill/SKILL.md');
const canonicalPathFor = (name) => name === 'hakim'
  ? 'core/hakim-skill/SKILL.md'
  : `core/hakim-skill/skills/${name}/SKILL.md`;

for (const [mode, directive] of Object.entries(MODE_DIRECTIVES)) {
  assert.equal(getCoreModeDirective(mode), directive, `shared loader ${mode} directive must match beta6 mode semantics`);
  assert.equal(getCopilotModeDirective(mode), directive, `Copilot ${mode} directive must match beta6 mode semantics`);
}
assert.equal(getCoreModeDirective('unsupported'), MODE_DIRECTIVES.full, 'shared loader invalid mode must fall back to full');
assert.equal(getCopilotModeDirective('unsupported'), MODE_DIRECTIVES.full, 'Copilot invalid mode must fall back to full');

for (const pattern of [
  /smallest sufficient safe change/i,
  /UNDERSTAND -> DECIDE -> EXECUTE -> VERIFY -> CLOSE/,
  /## Understand only what matters/i,
  /## The 7-level decision ladder/i,
  /## Root-cause rule/i,
  /## Proportional verification/i,
  /## Depth is earned/i,
  /## Preserve real guards/i,
  /## Evidence and authority/i,
  /## Outcome-oriented restraint/i,
  /## Bounded no-change truth/i,
  /## Evidence-bound claims/i,
  /ordinary tactics inside the authorized scope/i,
  /Do not emit fixed checkpoint tables/i,
]) {
  assert.match(canonical, pattern, `canonical modern contract missing ${pattern}`);
}

for (const obsolete of [
  /BASELINE_COMMAND/,
  /BASELINE_SOURCE/,
  /SETUP_MUTATION/,
  /PRE_EDIT_GIT_STATUS/,
  /SEMANTIC_CHANGE_CHECK/,
  /FINAL_GIT_STATUS/,
  /SETUP_ARTIFACTS/,
  /UNRELATED_MUTATIONS/,
  /## Observable checkpoints/i,
]) {
  assert.doesNotMatch(canonical, obsolete, `canonical contract retains fixed checkpoint ceremony ${obsolete}`);
}

assert.deepEqual(listDirs('core/hakim-skill/skills'), SPECIALIZED, 'canonical package must expose exactly five specialized skill directories plus root hakim');

const canonicalSkillPaths = [
  'core/hakim-skill/SKILL.md',
  ...SPECIALIZED.map((name) => `core/hakim-skill/skills/${name}/SKILL.md`),
];
for (const relativePath of canonicalSkillPaths) {
  const text = read(relativePath);
  assert.doesNotMatch(text, /\b1\.0\.0-beta\.\d+\b/i, `${relativePath} must not embed release-version history`);
  assert.doesNotMatch(text, /\b[0-9a-f]{40}\b/i, `${relativePath} must not embed commit identity`);
  assert.doesNotMatch(text, /moving\s+main|4\/4\s+PASS|HOLD_FOR_LIVE_HOST_EVIDENCE/i, `${relativePath} must not embed acceptance history`);
}

for (const hostRoot of ['plugins/codex/skills', 'plugins/claude-code/skills', 'plugins/copilot/skills']) {
  assert.deepEqual(listDirs(hostRoot), [...CAPABILITIES].sort(), `${hostRoot} must expose exactly the six canonical skill names`);
  for (const name of CAPABILITIES) {
    const relativePath = `${hostRoot}/${name}/SKILL.md`;
    const text = read(relativePath);
    assert.equal(text, read(canonicalPathFor(name)), `${relativePath} must be an exact projection of canonical ${name}`);
    assert.doesNotMatch(text, /\bhakim-gain\b|\bhakim-review\b|\bhakim-audit\b|\bhakim-debt\b|\bhakim-help\b/i, `${relativePath} must not preserve legacy capability IDs`);
    assert.doesNotMatch(text, /\b1\.0\.0-beta\.\d+\b|\b[0-9a-f]{40}\b/i, `${relativePath} must not carry release-history identity`);
  }
}

for (const [agentPath, expectedSkill] of [
  ['plugins/claude-code/agents/hakim-reviewer.md', 'hakim:review'],
  ['plugins/claude-code/agents/hakim-auditor.md', 'hakim:audit'],
  ['plugins/claude-code/agents/hakim-debt-analyst.md', 'hakim:debt'],
  ['plugins/claude-code/agents/hakim-evidence-verifier.md', 'hakim:status'],
  ['plugins/claude-code/agents/hakim-implementer.md', 'hakim:hakim'],
]) {
  assert.match(read(agentPath), new RegExp(`(?:^|\\n)\\s*-\\s*${expectedSkill.replace(':', '\\:')}\\s*(?:\\n|$)`), `${agentPath} must preload ${expectedSkill}`);
}

for (const [agentPath, capability] of [
  ['plugins/copilot/agents/hakim-reviewer.agent.md', 'review'],
  ['plugins/copilot/agents/hakim-auditor.agent.md', 'audit'],
  ['plugins/copilot/agents/hakim-debt-analyst.agent.md', 'debt'],
  ['plugins/copilot/agents/hakim-evidence-verifier.agent.md', 'status'],
  ['plugins/copilot/agents/hakim-implementer.agent.md', 'hakim'],
]) {
  const text = read(agentPath);
  assert.match(text, new RegExp(`(?:load|use|follow)[^\\n]{0,120}\\b${capability}\\b[^\\n]{0,80}skill`, 'i'), `${agentPath} must route to the ${capability} skill instead of owning another contract`);
  assert.doesNotMatch(text, /## (?:Scope contract|Evidence rule|Audit contract|The 7-level decision ladder)/i, `${agentPath} must stay a thin execution context`);
}

const help = read('core/hakim-skill/skills/help/SKILL.md');
assert.match(help, /Use the current host's plugin\/package\/runtime metadata/i, 'help must route installed identity to runtime metadata');

const status = read('core/hakim-skill/skills/status/SKILL.md');
assert.match(status, /what does the available evidence currently establish/i);
assert.match(status, /NOT_ESTABLISHED/);
assert.doesNotMatch(status, /quantified gain|estimated savings|ROI score/i, 'status must not retain gain semantics');

console.log('test_behavioral_contract.mjs: beta6 six-capability judgment-first contract OK');
