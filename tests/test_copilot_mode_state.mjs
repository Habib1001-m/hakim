#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getModeStatePath, readModeState, writeModeState } from '../plugins/copilot/hooks/mode_state.mjs';
import { runSessionStart } from '../plugins/copilot/hooks/session_start.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-mode-'));
const pluginData = path.join(root, 'plugin-data');
const repo = path.join(root, 'repo');
fs.mkdirSync(repo, { recursive: true });
fs.writeFileSync(path.join(repo, 'sentinel.txt'), 'unchanged\n');
const repoBefore = fs.readdirSync(repo).sort();

try {
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'DEFAULT' });
  assert.equal(fs.existsSync(pluginData), false, 'default full must not create plugin-data state');

  const fullOutput = runSessionStart({ pluginDataDir: pluginData });
  assert.match(fullOutput.additionalContext, /^HAKIM OPERATIONAL PRESENCE — full mode\./);
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore);

  const stateFile = getModeStatePath(pluginData);
  assert.equal(path.dirname(stateFile), path.resolve(pluginData));

  for (const mode of ['lite', 'ultra', 'off']) {
    assert.deepEqual(writeModeState(pluginData, mode), { mode, persisted: true });
    assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, 'utf8')), { schema_version: 1, mode });
    assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(stateFile, 'utf8'))).sort(), ['mode', 'schema_version']);
    assert.deepEqual(readModeState(pluginData), { mode, source: 'PLUGIN_DATA' });

    const output = runSessionStart({ pluginDataDir: pluginData });
    if (mode === 'off') assert.deepEqual(output, {});
    else assert.match(output.additionalContext, new RegExp(`^HAKIM OPERATIONAL PRESENCE — ${mode} mode\\.`));

    assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore, 'mode state must not touch target repository');
  }

  assert.throws(() => writeModeState(pluginData, 'invalid'), /unsupported Hakim mode/);

  fs.writeFileSync(stateFile, '{not-json\n');
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'INVALID_STATE' });
  assert.match(runSessionStart({ pluginDataDir: pluginData }).additionalContext, /^HAKIM OPERATIONAL PRESENCE — full mode\./);

  fs.writeFileSync(stateFile, JSON.stringify({ schema_version: 1, mode: 'off', prompt: 'must never be stored' }));
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'INVALID_STATE' });

  assert.deepEqual(writeModeState(pluginData, 'full'), { mode: 'full', persisted: false });
  assert.equal(fs.existsSync(stateFile), false, 'default full must remove redundant override');
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'DEFAULT' });
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('test_copilot_mode_state.mjs: bounded plugin-data lite/full/ultra/off state OK');
