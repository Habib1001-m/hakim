#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { applyModeControl, buildModeControlPrompt, parseModeCommand } from '../plugins/copilot/hooks/mode_control.mjs';
import { getModeStatePath, readModeState } from '../plugins/copilot/hooks/mode_state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'mode_control.mjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-mode-control-'));
const pluginData = path.join(root, 'plugin-data');
const repo = path.join(root, 'repo');
fs.mkdirSync(repo, { recursive: true });
fs.writeFileSync(path.join(repo, 'sentinel.txt'), 'unchanged\n');
const repoBefore = fs.readdirSync(repo).sort();

try {
  assert.equal(parseModeCommand('/hakim'), 'full');
  assert.equal(parseModeCommand('/hakim off'), 'off');
  assert.equal(parseModeCommand('/hakim lite'), 'lite');
  assert.equal(parseModeCommand('/hakim ultra'), 'ultra');
  assert.equal(parseModeCommand('/hakim/hakim full'), 'full');
  assert.equal(parseModeCommand('/hakim:hakim off'), 'off');
  assert.equal(parseModeCommand('/HAKIM OFF'), 'off');
  assert.equal(parseModeCommand('please use hakim off'), null);
  assert.equal(parseModeCommand('/hakim off and inspect'), null);
  assert.equal(parseModeCommand('/hakim turbo'), null);

  const ordinary = applyModeControl({
    prompt: 'ordinary coding prompt',
    transformedPrompt: 'ordinary coding prompt',
  }, { pluginDataDir: pluginData });
  assert.deepEqual(ordinary, { handled: false, output: {} });
  assert.equal(fs.existsSync(pluginData), false, 'ordinary prompts must not create mode state');

  const off = applyModeControl({
    prompt: '/hakim off',
    transformedPrompt: 'FULL SKILL BODY THAT MUST NOT WIN THE MODE SWITCH',
  }, { pluginDataDir: pluginData });
  assert.equal(off.handled, true);
  assert.equal(off.mode, 'off');
  assert.equal(off.persisted, true);
  assert.deepEqual(readModeState(pluginData), { mode: 'off', source: 'PLUGIN_DATA' });
  assert.equal(off.output.modifiedTransformedPrompt, buildModeControlPrompt('off'));
  assert.match(off.output.modifiedTransformedPrompt, /selected mode: off/);
  assert.match(off.output.modifiedTransformedPrompt, /Hakim guidance disabled/);
  assert.doesNotMatch(off.output.modifiedTransformedPrompt, /FULL SKILL BODY/);

  for (const mode of ['lite', 'ultra']) {
    const result = applyModeControl({
      prompt: `/hakim ${mode}`,
      transformedPrompt: 'host-transformed skill payload',
    }, { pluginDataDir: pluginData });
    assert.equal(result.handled, true);
    assert.equal(result.mode, mode);
    assert.equal(result.persisted, true);
    assert.deepEqual(readModeState(pluginData), { mode, source: 'PLUGIN_DATA' });
    assert.equal(result.output.modifiedTransformedPrompt, buildModeControlPrompt(mode));
  }

  const full = applyModeControl({
    prompt: '/hakim:hakim full',
    transformedPrompt: 'host-transformed skill payload',
  }, { pluginDataDir: pluginData });
  assert.equal(full.handled, true);
  assert.equal(full.mode, 'full');
  assert.equal(full.persisted, false);
  assert.equal(fs.existsSync(getModeStatePath(pluginData)), false);
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'DEFAULT' });
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore);

  const cliData = path.join(root, 'cli-plugin-data');
  const cli = spawnSync(process.execPath, [script], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, COPILOT_PLUGIN_DATA: cliData },
    input: JSON.stringify({
      sessionId: 'synthetic-session',
      timestamp: 0,
      cwd: repo,
      prompt: '/hakim off',
      transformedPrompt: 'host-expanded Hakim skill content',
    }),
  });
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  assert.equal(cli.stderr, '');
  const output = JSON.parse(cli.stdout);
  assert.equal(output.modifiedTransformedPrompt, buildModeControlPrompt('off'));
  assert.deepEqual(readModeState(cliData), { mode: 'off', source: 'PLUGIN_DATA' });
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore, 'mode control must not create target-repository state');

  const stateText = fs.readFileSync(getModeStatePath(cliData), 'utf8');
  assert.equal(stateText, '{"schema_version":1,"mode":"off"}\n');
  for (const forbidden of ['prompt', 'cwd', 'session', 'timestamp', 'source', 'tool', 'credential']) {
    assert.equal(stateText.toLowerCase().includes(forbidden), false, `mode state must not persist ${forbidden}`);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('test_copilot_mode_control.mjs: transformed-prompt mode control stays bounded and quiet');
