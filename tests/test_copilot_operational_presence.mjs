#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { buildOperationalContext } from '../plugins/copilot/hooks/session_start.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const manifest = JSON.parse(read('plugins/copilot/plugin.json'));
const hookConfig = JSON.parse(read('plugins/copilot/hooks/hooks.json'));
const skill = read('plugins/copilot/skills/hakim/SKILL.md');
const sessionScript = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'session_start.mjs');

assert.equal(manifest.hooks, 'hooks/hooks.json');
assert.equal(hookConfig.version, 1);
assert.deepEqual(Object.keys(hookConfig.hooks), ['sessionStart']);
assert.equal(hookConfig.hooks.sessionStart.length, 1);

const sessionStart = hookConfig.hooks.sessionStart[0];
assert.equal(sessionStart.type, 'command');
assert.match(sessionStart.command, /\$\{PLUGIN_ROOT\}\/hooks\/session_start\.mjs/);
assert.equal(sessionStart.timeoutSec, 5);

for (const forbidden of ['preToolUse', 'postToolUse', 'agentStop', 'userPromptSubmitted', 'subagentStart']) {
  assert.equal(hookConfig.hooks[forbidden], undefined, `F01 must not add ${forbidden}`);
}

const context = buildOperationalContext(skill);
assert.match(context, /^HAKIM OPERATIONAL PRESENCE — full mode\./);
for (const heading of [
  '## Decision ladder',
  '## Pre-mutation baseline',
  '## Evidence sufficiency',
  '## Domain-guard preservation',
  '## Outcome-oriented restraint',
  '## Bounded `NO_CHANGE` truth',
]) {
  assert.match(context, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.ok(Buffer.byteLength(context, 'utf8') < 9_000);
assert.doesNotMatch(context, /^---$/m);
assert.doesNotMatch(context, /^name:\s*hakim$/m);
assert.doesNotMatch(context, /When the user explicitly invokes Hakim/i);
assert.doesNotMatch(context, /## Observable checkpoints/);
assert.doesNotMatch(context, /BASELINE_COMMAND=/);
assert.doesNotMatch(context, /FINAL_GIT_STATUS=/);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-presence-'));
try {
  assert.deepEqual(fs.readdirSync(temp), []);
  const result = spawnSync(process.execPath, [sessionScript], {
    cwd: temp,
    encoding: 'utf8',
    input: JSON.stringify({
      sessionId: 'synthetic-session',
      timestamp: 0,
      cwd: temp,
      source: 'new',
      initialPrompt: 'ordinary coding request that does not mention Hakim',
    }),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.additionalContext, context);
  assert.deepEqual(fs.readdirSync(temp), [], 'session presence must not create target-repository state');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('test_copilot_operational_presence.mjs: silent sessionStart presence contract OK');
