#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hook = path.join(ROOT, 'plugins/claude-code/hooks/session_start.mjs');
const hooks = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/claude-code/hooks/hooks.json'), 'utf8'));
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
  /apply .*automatically.*coding work.*without requiring an explicit Hakim invocation/is,
  'Claude SessionStart must make the core Hakim policy plug-and-play',
);
assert.match(context, /## Understand only what matters/i, 'Claude SessionStart must expose the stop-inspecting rule');
assert.match(context, /## The 7-level decision ladder/i, 'Claude SessionStart must expose the decision ladder');
assert.match(context, /## Proportional verification/i, 'Claude SessionStart must expose proportional verification');
assert.match(context, /## Depth is earned/i, 'Claude SessionStart must make deeper process evidence-driven');
assert.match(context, /## Preserve real guards/i, 'Claude SessionStart must preserve material guards');
assert.match(context, /## Evidence and authority/i, 'Claude SessionStart must separate evidence from authority');
assert.match(context, /## Evidence-bound claims/i, 'Claude SessionStart must bound completion/runtime/release claims');
assert.match(context, /ordinary tactics inside the authorized scope/i, 'Claude SessionStart must avoid turning normal work into ceremony');
assert.doesNotMatch(context, /BASELINE_COMMAND|PRE_EDIT_GIT_STATUS|SEMANTIC_CHANGE_CHECK|FINAL_GIT_STATUS/);
assert.doesNotMatch(context, /release history|candidate SHA|4\/4 PASS/i);
assert.ok(Buffer.byteLength(context, 'utf8') <= 9000, 'Claude SessionStart context must stay bounded');

assert.ok(Array.isArray(hooks.hooks.SessionStart), 'Claude SessionStart hook must remain registered');
assert.equal(
  Object.prototype.hasOwnProperty.call(hooks.hooks, 'PostToolUse'),
  false,
  'Normal Claude runtime must not ship an advisory post-edit diagnostic hook',
);

console.log(`test_claude_runtime_kernel.mjs: compact judgment-first runtime kernel OK for ${version}`);
