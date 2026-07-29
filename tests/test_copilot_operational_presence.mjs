#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { buildOperationalContext } from '../plugins/copilot/hooks/session_start.mjs';
import { applyModeControl } from '../plugins/copilot/hooks/mode_control.mjs';
import { applyModeCommand, parseModeCommand } from '../plugins/copilot/hooks/mode_tracker.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const manifest = JSON.parse(read('plugins/copilot/plugin.json'));
const hookConfig = JSON.parse(read('plugins/copilot/hooks/hooks.json'));
const skill = read('plugins/copilot/skills/hakim/SKILL.md');
const sessionScript = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'session_start.mjs');

assert.equal(manifest.hooks, 'hooks/hooks.json');
assert.equal(hookConfig.version, 1);
assert.deepEqual(Object.keys(hookConfig.hooks).sort(), [
  'sessionStart',
  'userPromptSubmitted',
  'userPromptTransformed',
]);
assert.equal(hookConfig.hooks.sessionStart.length, 1);
assert.equal(hookConfig.hooks.userPromptSubmitted.length, 1);
assert.equal(hookConfig.hooks.userPromptTransformed.length, 1);

const sessionStart = hookConfig.hooks.sessionStart[0];
assert.equal(sessionStart.type, 'command');
assert.match(sessionStart.command, /\$\{PLUGIN_ROOT\}\/hooks\/session_start\.mjs/);
assert.equal(sessionStart.env, undefined);
assert.equal(sessionStart.timeoutSec, 5);

const modeTracker = hookConfig.hooks.userPromptSubmitted[0];
assert.equal(modeTracker.type, 'command');
assert.match(modeTracker.command, /\$\{PLUGIN_ROOT\}\/hooks\/mode_tracker\.mjs/);
assert.equal(modeTracker.env, undefined);
assert.equal(modeTracker.timeoutSec, 2);

const modeControl = hookConfig.hooks.userPromptTransformed[0];
assert.equal(modeControl.type, 'command');
assert.match(modeControl.command, /\$\{PLUGIN_ROOT\}\/hooks\/mode_control\.mjs/);
assert.equal(modeControl.env, undefined);
assert.equal(modeControl.timeoutSec, 2);

for (const forbidden of ['preToolUse', 'postToolUse', 'agentStop', 'subagentStart', 'subagentStop']) {
  assert.equal(hookConfig.hooks[forbidden], undefined, `operational presence must not add hook ${forbidden}`);
}

for (const [input, expected] of [
  ['/hakim', 'full'],
  ['/hakim off', 'off'],
  ['/hakim/hakim ultra', 'ultra'],
]) {
  assert.equal(parseModeCommand(input), expected, `mode parser mismatch for ${input}`);
}
for (const input of [
  '/hakim:hakim off',
  'please use hakim off for this task',
  '/hakim-review',
  'ordinary coding prompt',
]) {
  assert.equal(parseModeCommand(input), null, `ordinary/unsupported prompt must stay outside mode parser: ${input}`);
}

const modeTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-mode-'));
try {
  const prompt = '/hakim/hakim off';
  const persisted = applyModeCommand({ prompt }, { pluginDataDir: modeTemp });
  assert.deepEqual(persisted, { handled: true, mode: 'off', persisted: true });

  const transformed = applyModeControl({ prompt, transformedPrompt: 'host-expanded skill body' });
  assert.equal(transformed.handled, true);
  assert.equal(transformed.mode, 'off');
  assert.match(transformed.output.modifiedTransformedPrompt, /selected mode: off/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(modeTemp, 'mode.json'), 'utf8')), {
    schema_version: 1,
    mode: 'off',
  });
} finally {
  fs.rmSync(modeTemp, { recursive: true, force: true });
}

for (const mode of ['lite', 'full', 'ultra']) {
  const context = buildOperationalContext(skill, mode);
  assert.match(context, new RegExp(`^HAKIM OPERATIONAL PRESENCE — ${mode} mode\.`));
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
}

assert.match(buildOperationalContext(skill, 'lite'), /Build what is asked, then name the lazier alternative in one line\./);
assert.match(buildOperationalContext(skill, 'full'), /Enforce the Hakim ladder\./);
assert.match(buildOperationalContext(skill, 'ultra'), /YAGNI extremist mode: delete before adding/);

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
  assert.equal(output.additionalContext, buildOperationalContext(skill, 'full'));
  assert.deepEqual(fs.readdirSync(temp), [], 'session presence must not create target-repository state');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('test_copilot_operational_presence.mjs: silent presence + submitted persistence + transformed control topology OK');
