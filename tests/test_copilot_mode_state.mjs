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

  // Never turn an unresolved host placeholder or relative path into repo-local state.
  assert.equal(getModeStatePath('${COPILOT_PLUGIN_DATA}'), null);
  assert.equal(getModeStatePath('relative/plugin-data'), null);
  assert.deepEqual(readModeState('${COPILOT_PLUGIN_DATA}'), { mode: 'full', source: 'DEFAULT' });
  assert.throws(() => writeModeState('${COPILOT_PLUGIN_DATA}', 'off'), /expanded Copilot plugin-data path is unavailable/);
  assert.throws(() => writeModeState('relative/plugin-data', 'off'), /expanded Copilot plugin-data path is unavailable/);
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore);

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

console.log('test_copilot_mode_state.mjs: bounded absolute plugin-data state + fail-soft unresolved paths OK');
