#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hook = path.join(ROOT, 'plugins/claude-code/hooks/session_start.mjs');

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
assert.match(context, /Hakim 1\.0\.0-beta\.1 plugin is active/i);
assert.ok(
  context.length <= 1400,
  `Claude runtime kernel must stay lightweight; got ${context.length} characters`,
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

// E2 showed that a two-file bug fix paid nine task-management calls without
// decision value. Bounded work should not create orchestration bookkeeping by
// default.
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

console.log('test_claude_runtime_kernel.mjs: Claude startup kernel makes core Hakim coding behavior salient');
