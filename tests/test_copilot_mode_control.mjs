#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { applyModeControl, buildModeControlPrompt } from '../plugins/copilot/hooks/mode_control.mjs';
import { applyModeCommand, parseModeCommand } from '../plugins/copilot/hooks/mode_tracker.mjs';
import { getModeStatePath, readModeState } from '../plugins/copilot/hooks/mode_state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trackerScript = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'mode_tracker.mjs');
const controlScript = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'mode_control.mjs');
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
  assert.equal(parseModeCommand('/HAKIM/HAKIM OFF'), 'off');
  assert.equal(parseModeCommand('/hakim:hakim off'), null);
  assert.equal(parseModeCommand('please use hakim off'), null);
  assert.equal(parseModeCommand('/hakim off and inspect'), null);
  assert.equal(parseModeCommand('/hakim turbo'), null);

  const ordinaryPersist = applyModeCommand({ prompt: 'ordinary coding prompt' }, { pluginDataDir: pluginData });
  assert.deepEqual(ordinaryPersist, { handled: false });
  const ordinaryTransform = applyModeControl({
    prompt: 'ordinary coding prompt',
    transformedPrompt: 'ordinary coding prompt',
  });
  assert.deepEqual(ordinaryTransform, { handled: false, output: {} });
  assert.equal(fs.existsSync(pluginData), false, 'ordinary prompts must not create mode state');

  const qualifiedOff = '/hakim/hakim off';
  const persistedOff = applyModeCommand({ prompt: qualifiedOff }, { pluginDataDir: pluginData });
  assert.deepEqual(persistedOff, { handled: true, mode: 'off', persisted: true });
  assert.deepEqual(readModeState(pluginData), { mode: 'off', source: 'PLUGIN_DATA' });

  const transformedOff = applyModeControl({
    prompt: qualifiedOff,
    transformedPrompt: 'FULL SKILL BODY THAT MUST NOT WIN THE MODE SWITCH',
  });
  assert.equal(transformedOff.handled, true);
  assert.equal(transformedOff.mode, 'off');
  assert.equal(transformedOff.output.modifiedTransformedPrompt, buildModeControlPrompt('off'));
  assert.match(transformedOff.output.modifiedTransformedPrompt, /selected mode: off/);
  assert.match(transformedOff.output.modifiedTransformedPrompt, /Hakim guidance disabled/);
  assert.doesNotMatch(transformedOff.output.modifiedTransformedPrompt, /FULL SKILL BODY/);
  assert.deepEqual(readModeState(pluginData), { mode: 'off', source: 'PLUGIN_DATA' }, 'transformed hook must not own persistence');

  for (const mode of ['lite', 'ultra']) {
    const prompt = `/hakim/hakim ${mode}`;
    const persisted = applyModeCommand({ prompt }, { pluginDataDir: pluginData });
    assert.equal(persisted.handled, true);
    assert.equal(persisted.mode, mode);
    assert.equal(persisted.persisted, true);
    assert.deepEqual(readModeState(pluginData), { mode, source: 'PLUGIN_DATA' });

    const transformed = applyModeControl({ prompt, transformedPrompt: 'host-transformed skill payload' });
    assert.equal(transformed.handled, true);
    assert.equal(transformed.mode, mode);
    assert.equal(transformed.output.modifiedTransformedPrompt, buildModeControlPrompt(mode));
  }

  const persistedFull = applyModeCommand({ prompt: '/hakim/hakim full' }, { pluginDataDir: pluginData });
  assert.deepEqual(persistedFull, { handled: true, mode: 'full', persisted: false });
  assert.equal(fs.existsSync(getModeStatePath(pluginData)), false);
  assert.deepEqual(readModeState(pluginData), { mode: 'full', source: 'DEFAULT' });
  const transformedFull = applyModeControl({
    prompt: '/hakim/hakim full',
    transformedPrompt: 'host-transformed skill payload',
  });
  assert.equal(transformedFull.output.modifiedTransformedPrompt, buildModeControlPrompt('full'));
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore);

  // Reproduce the documented event order on the live-proven qualified command:
  // userPromptSubmitted persists through COPILOT_PLUGIN_DATA, then
  // userPromptTransformed rewrites only model-facing content and needs no state path.
  const cliData = path.join(root, 'cli-plugin-data');
  const submitted = spawnSync(process.execPath, [trackerScript], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, COPILOT_PLUGIN_DATA: cliData },
    input: JSON.stringify({
      sessionId: 'synthetic-session',
      timestamp: 0,
      cwd: repo,
      prompt: qualifiedOff,
    }),
  });
  assert.equal(submitted.status, 0, submitted.stderr || submitted.stdout);
  assert.equal(submitted.stderr, '');
  assert.deepEqual(JSON.parse(submitted.stdout), {});
  assert.deepEqual(readModeState(cliData), { mode: 'off', source: 'PLUGIN_DATA' });

  const transformedEnv = { ...process.env };
  delete transformedEnv.COPILOT_PLUGIN_DATA;
  delete transformedEnv.HAKIM_PLUGIN_DATA;
  const transformed = spawnSync(process.execPath, [controlScript], {
    cwd: repo,
    encoding: 'utf8',
    env: transformedEnv,
    input: JSON.stringify({
      sessionId: 'synthetic-session',
      timestamp: 1,
      cwd: repo,
      prompt: qualifiedOff,
      transformedPrompt: 'host-expanded Hakim skill content',
    }),
  });
  assert.equal(transformed.status, 0, transformed.stderr || transformed.stdout);
  assert.equal(transformed.stderr, '');
  const output = JSON.parse(transformed.stdout);
  assert.equal(output.modifiedTransformedPrompt, buildModeControlPrompt('off'));
  assert.deepEqual(readModeState(cliData), { mode: 'off', source: 'PLUGIN_DATA' });
  assert.deepEqual(fs.readdirSync(repo).sort(), repoBefore, 'mode lifecycle must not create target-repository state');

  const stateText = fs.readFileSync(getModeStatePath(cliData), 'utf8');
  assert.equal(stateText, '{"schema_version":1,"mode":"off"}\n');
  for (const forbidden of ['prompt', 'cwd', 'session', 'timestamp', 'source', 'tool', 'credential']) {
    assert.equal(stateText.toLowerCase().includes(forbidden), false, `mode state must not persist ${forbidden}`);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('test_copilot_mode_control.mjs: submitted persistence + transformed current-turn control stay separated and bounded');
