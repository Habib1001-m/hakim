#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { applyModeCommand, parseModeCommand } from '../plugins/copilot/hooks/mode_tracker.mjs';
import { getModeStatePath, readModeState } from '../plugins/copilot/hooks/mode_state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'mode_tracker.mjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-mode-tracker-'));
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
  assert.equal(parseModeCommand('/HAKIM OFF'), 'off');
  assert.equal(parseModeCommand('please use hakim off'), null);
  assert.equal(parseModeCommand('/hakim off and inspect'), null);
  assert.equal(parseModeCommand('/hakim turbo'), null);

  assert.deepEqual(applyModeCommand({ prompt: 'ordinary coding prompt' }, { pluginDataDir: pluginData }), { handled: false });
  assert.equal(fs.existsSync(pluginData), false, 'ordinary prompts must not create mode state');

  assert.deepEqual(applyModeCommand({ prompt: '/hakim off' }, { pluginDataDir: pluginData }), {
    handled: true,
    mode: 'off',
    persisted: true,
  });
  assert.deepEqual(readModeState(pluginData), { mode: 'off', source: 'PLUGIN_DATA' });

  assert.deepEqual(applyModeCommand({ prompt: '/hakim lite' }, { pluginDataDir: pluginData }), {
    handled: true,
    mode: 'lite',
    persisted: true,
  });
  assert.deepEqual(readModeState(pluginData), { mode: 'lite', source: 'PLUGIN_DATA' });

  assert.deepEqual(applyModeCommand({ prompt: '/hakim ultra' }, { pluginDataDir: pluginData }), {
    handled: true,
    mode: 'ultra',
    persisted: true,
  });
  assert.deepEqual(readModeState(pluginData), { mode: 'ultra', source: 'PLUGIN_DATA' });

  assert.deepEqual(applyModeCommand({ prompt: '/hakim/hakim full' }, { pluginDataDir: pluginData }), {
    handled: true,
    mode: 'full',
    persisted: false,
  });
  assert.equal(fs.existsSync(getModeStatePath(pluginData)), false);
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'DEFAULT' });
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore);

  const cliData = path.join(root, 'cli-plugin-data');
  const result = spawnSync(process.execPath, [script], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, COPILOT_PLUGIN_DATA: cliData },
    input: JSON.stringify({
      sessionId: 'synthetic-session',
      timestamp: 0,
      cwd: repo,
      prompt: '/hakim off',
    }),
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {});
  assert.deepEqual(readModeState(cliData), { mode: 'off', source: 'PLUGIN_DATA' });
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore, 'mode tracker must not create target-repository state');

  const stateText = fs.readFileSync(getModeStatePath(cliData), 'utf8');
  assert.equal(stateText, '{"schema_version":1,"mode":"off"}\n');
  for (const forbidden of ['prompt', 'cwd', 'session', 'timestamp', 'source', 'tool', 'credential']) {
    assert.equal(stateText.toLowerCase().includes(forbidden), false, `mode state must not persist ${forbidden}`);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('test_copilot_mode_tracker.mjs: native /hakim mode control stays bounded and quiet');
