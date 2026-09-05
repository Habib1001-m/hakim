#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const pairs = [
  ['reviewer', 'review'],
  ['auditor', 'audit'],
  ['debt-analyst', 'debt'],
  ['evidence-verifier', 'status'],
  ['implementer', 'hakim'],
];

function description(text, relativePath) {
  const match = text.match(/^description:\s*(.+)$/m);
  assert.ok(match, `${relativePath} must declare a description`);
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

for (const [agent, capability] of pairs) {
  for (const relativePath of [
    `plugins/claude-code/agents/hakim-${agent}.md`,
    `plugins/copilot/agents/hakim-${agent}.agent.md`,
  ]) {
    const text = read(relativePath);
    assert.match(
      description(text, relativePath),
      /\bUse when\b/i,
      `${relativePath} description must tell the host when to delegate`,
    );
    assert.match(text, new RegExp(`\\b${capability}\\b`, 'i'), `${relativePath} must route to ${capability}`);
    assert.doesNotMatch(
      text,
      /## (?:Scope contract|Audit contract|Evidence rule|The 7-level decision ladder)/i,
      `${relativePath} must remain a thin host execution context`,
    );
  }
}

for (const agent of ['reviewer', 'auditor', 'debt-analyst', 'evidence-verifier']) {
  const claudePath = `plugins/claude-code/agents/hakim-${agent}.md`;
  const copilotPath = `plugins/copilot/agents/hakim-${agent}.agent.md`;
  const claude = read(claudePath);
  const copilot = read(copilotPath);

  assert.match(claude, /^tools: Read, Grep, Glob$/m, `${claudePath} must stay tool-enforced read/search only`);
  assert.match(copilot, /^tools: \["read", "search"\]$/m, `${copilotPath} must stay tool-enforced read/search only`);
  assert.match(claude, /evidence gap[^\n]*parent/i, `${claudePath} must return unavailable evidence to the parent instead of approximating it`);
  assert.match(copilot, /evidence gap[^\n]*parent/i, `${copilotPath} must return unavailable evidence to the parent instead of approximating it`);
}

for (const agent of ['reviewer', 'auditor', 'debt-analyst', 'evidence-verifier', 'implementer']) {
  const relativePath = `plugins/claude-code/agents/hakim-${agent}.md`;
  const text = read(relativePath);
  assert.doesNotMatch(text, /^model:\s*inherit$/m, `${relativePath} must not override the host/user subagent model route`);
  assert.doesNotMatch(text, /^effort:/m, `${relativePath} must inherit host/session effort`);
  assert.doesNotMatch(text, /^maxTurns:/m, `${relativePath} must not impose a fixed turn ceiling`);
  assert.doesNotMatch(text, /^disallowedTools:/m, `${relativePath} must not duplicate an existing tool allowlist`);
}

const claudeImplementer = read('plugins/claude-code/agents/hakim-implementer.md');
assert.match(claudeImplementer, /^isolation: worktree$/m, 'Claude implementer must retain worktree isolation');
assert.match(claudeImplementer, /default branch/i, 'Claude implementer must disclose worktree base semantics');
assert.match(claudeImplementer, /uncommitted/i, 'Claude implementer must reject unseen parent working-tree state');
assert.match(claudeImplementer, /REVISION_CONTEXT_MISMATCH/, 'Claude implementer must fail closed on revision-context drift');

console.log('test_agent_semantic_contract.mjs: thin trigger-oriented host agents OK');
