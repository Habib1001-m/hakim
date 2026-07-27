#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hook = path.join(ROOT, 'plugins/claude-code/hooks/session_start.mjs');
const help = fs.readFileSync(path.join(ROOT, 'plugins/claude-code/skills/help/SKILL.md'), 'utf8');
const version = fs.readFileSync(path.join(ROOT, 'core/hakim-skill/VERSION'), 'utf8').trim();

const result = spawnSync(process.execPath, [hook], {
  cwd: ROOT,
  input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }),
  encoding: 'utf8',
});

assert.equal(result.status, 0, result.stderr || result.stdout);

const parsed = JSON.parse(result.stdout);
const output = parsed.hookSpecificOutput;
assert.equal(output.hookEventName, 'SessionStart');

const context = output.additionalContext;
assert.match(context, new RegExp(`Hakim ${version.replaceAll('.', '\\.')} plugin is active`, 'i'));
assert.match(
  context,
  new RegExp(`active Hakim version[\\s\\S]{0,120}exactly ${version.replaceAll('.', '\\.')}[\\s\\S]{0,240}never infer`, 'i'),
  'Claude runtime kernel must make the manifest-derived active version authoritative over repository history',
);
assert.ok(
  context.length <= 1650,
  `Claude runtime kernel must stay lightweight; got ${context.length} characters`,
);

assert.match(
  help,
  /Version truth is host\/runtime metadata[\s\S]{0,300}Do not infer or restate a Hakim version[\s\S]{0,300}SessionStart activation value/i,
  'Claude help must not infer version identity from repository history or cached prose',
);

// Core coding behavior must be salient before the first model decision. The
// detailed skill body is lazy-loaded, so the startup kernel must explicitly
// require it before mutation rather than merely hoping description matching
// triggers it later.
assert.match(
  context,
  /coding task[\s\S]{0,240}invoke[\s\S]{0,120}hakim:hakim[\s\S]{0,240}before (?:the )?first (?:file )?mutation/i,
  'Claude runtime kernel must require hakim:hakim before the first mutation on coding tasks',
);

// Bounded work should not create orchestration bookkeeping by default when it
// would not change a real implementation, safety, or coordination decision.
assert.match(
  context,
  /bounded[\s\S]{0,240}(?:do not|avoid)[\s\S]{0,120}TaskCreate[\s\S]{0,80}TaskUpdate/i,
  'Claude runtime kernel must suppress task bookkeeping for bounded work by default',
);

assert.match(
  context,
  /representative baseline[\s\S]{0,200}before (?:the )?first (?:file )?mutation/i,
  'Claude runtime kernel must keep the baseline rule visible before skill loading',
);

console.log(`test_claude_runtime_kernel.mjs: Claude startup kernel makes core Hakim ${version} coding behavior and version truth salient`);
