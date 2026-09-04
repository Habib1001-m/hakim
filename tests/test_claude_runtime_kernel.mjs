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
assert.match(
  context,
  /Does this need to exist(?: at all)?\?/i,
  'Claude SessionStart must expose the maintained decision ladder before the first model decision',
);
assert.match(
  context,
  /Baseline discovery is read-only by default/i,
  'Claude SessionStart must expose baseline purity without requiring a manual skill invocation',
);
assert.doesNotMatch(
  context,
  /invoke .*hakim:hakim.*before .*mutation/is,
  'Claude core behavior must not depend on invoking the hidden skill before work',
);
assert.ok(Buffer.byteLength(context, 'utf8') <= 9000, 'Claude SessionStart context must stay bounded');

assert.ok(Array.isArray(hooks.hooks.SessionStart), 'Claude SessionStart hook must remain registered');
assert.equal(
  Object.prototype.hasOwnProperty.call(hooks.hooks, 'PostToolUse'),
  false,
  'Normal Claude runtime must not ship an advisory post-edit diagnostic hook',
);

console.log(`test_claude_runtime_kernel.mjs: Claude plug-and-play runtime kernel contract ok for ${version}`);
