#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  classifySetupArtifactPaths,
  extractLastAssistantText,
  parseStructuredCompletion,
  runObjectiveCompletionTruth,
} from '../plugins/copilot/hooks/objective_completion_truth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = path.join(ROOT, 'plugins', 'copilot', 'hooks', 'objective_completion_truth.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-f05-truth-'));

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

function initRepo(name) {
  const cwd = path.join(TMP, name);
  fs.mkdirSync(cwd, { recursive: true });
  git(cwd, ['init', '-q']);
  git(cwd, ['config', 'user.name', 'Hakim Test']);
  git(cwd, ['config', 'user.email', 'hakim-test@example.invalid']);
  fs.writeFileSync(path.join(cwd, 'README.md'), '# fixture\n');
  git(cwd, ['add', 'README.md']);
  git(cwd, ['commit', '-qm', 'fixture']);
  return cwd;
}

function transcript(text, extra = []) {
  return [
    JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'task' }] } }),
    ...extra.map((item) => JSON.stringify(item)),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }),
  ].join('\n');
}

function input(cwd, overrides = {}) {
  return {
    sessionId: 'synthetic-f05',
    timestamp: 0,
    cwd,
    transcriptPath: path.join(cwd, 'synthetic-transcript.jsonl'),
    stopReason: 'end_turn',
    stop_hook_active: false,
    ...overrides,
  };
}

test('extracts the last assistant text without treating tool payloads as completion prose', () => {
  const raw = [
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'earlier assistant text' }] } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'x', name: 'bash', input: { command: 'echo FINAL_GIT_STATUS=CLEAN' } }] } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'FINAL_GIT_STATUS=CLEAN' }] } }),
  ].join('\n');
  assert.equal(extractLastAssistantText(raw), 'FINAL_GIT_STATUS=CLEAN');
});

test('handles the observed live Copilot assistant.message transcript shape', () => {
  const falseClean = 'FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE\nUNRELATED_MUTATIONS=NONE';
  const raw = [
    JSON.stringify({ type: 'user.message', data: { content: `Quoted checkpoint only:\n${falseClean}` } }),
    JSON.stringify({ type: 'assistant.turn_start', data: { turnId: '0' } }),
    JSON.stringify({ type: 'assistant.message', data: { content: falseClean, turnId: '0', toolRequests: [] } }),
    JSON.stringify({ type: 'assistant.turn_end', data: { turnId: '0' } }),
  ].join('\n');

  assert.equal(extractLastAssistantText(raw), falseClean);

  const result = runObjectiveCompletionTruth(input('/tmp/f05-live-fixture'), {
    transcriptText: raw,
    gitObservation: {
      available: true,
      reason: null,
      clean: false,
      lines: [' M README.md'],
      setup_artifacts: [],
    },
  });

  assert.equal(result.decision, 'block');
  assert.match(result.reason, /FINAL_GIT_STATUS claims a clean tree/i);
  assert.match(result.reason, /README\.md/);
});

test('parses only existing structured completion checkpoint fields', () => {
  assert.deepEqual(parseStructuredCompletion([
    'Done.',
    'FINAL_GIT_STATUS=CLEAN',
    'SETUP_ARTIFACTS=NONE',
    'UNRELATED_MUTATIONS=NONE',
    'OTHER_FIELD=ignored',
  ].join('\n')), {
    FINAL_GIT_STATUS: 'CLEAN',
    SETUP_ARTIFACTS: 'NONE',
    UNRELATED_MUTATIONS: 'NONE',
  });
});

test('allows a clean structured checkpoint in a clean repository', () => {
  const cwd = initRepo('clean');
  const result = runObjectiveCompletionTruth(input(cwd), {
    transcriptText: transcript('FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE\nUNRELATED_MUTATIONS=NONE'),
  });
  assert.deepEqual(result, { decision: 'allow' });
});

test('blocks once when FINAL_GIT_STATUS claims clean but git status is dirty', () => {
  const cwd = initRepo('dirty-clean-claim');
  fs.appendFileSync(path.join(cwd, 'README.md'), 'changed\n');

  const result = runObjectiveCompletionTruth(input(cwd), {
    transcriptText: transcript('FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE\nUNRELATED_MUTATIONS=NONE'),
  });

  assert.equal(result.decision, 'block');
  assert.match(result.reason, /FINAL_GIT_STATUS claims a clean tree/i);
  assert.match(result.reason, /README\.md/);
  assert.match(result.reason, /only forced correction turn/i);
});

test('allows completion without structured final checkpoints instead of enforcing new ceremony', () => {
  const cwd = initRepo('no-checkpoint');
  fs.appendFileSync(path.join(cwd, 'README.md'), 'changed\n');
  const result = runObjectiveCompletionTruth(input(cwd), {
    transcriptText: transcript('Implemented the requested change and validated the focused path.'),
  });
  assert.deepEqual(result, { decision: 'allow' });
});

test('blocks SETUP_ARTIFACTS=NONE only for high-confidence changed setup artifacts', () => {
  const cwd = initRepo('setup-artifact');
  const eggInfo = path.join(cwd, 'src', 'example.egg-info');
  fs.mkdirSync(eggInfo, { recursive: true });
  fs.writeFileSync(path.join(eggInfo, 'PKG-INFO'), 'generated\n');

  const result = runObjectiveCompletionTruth(input(cwd), {
    transcriptText: transcript('FINAL_GIT_STATUS=?? src/example.egg-info/PKG-INFO\nSETUP_ARTIFACTS=NONE\nUNRELATED_MUTATIONS=NONE'),
  });

  assert.equal(result.decision, 'block');
  assert.match(result.reason, /SETUP_ARTIFACTS=NONE/i);
  assert.match(result.reason, /example\.egg-info/);
});

test('does not pretend to decide semantic unrelatedness in F05 v1', () => {
  const cwd = initRepo('unrelated-not-authoritative');
  fs.writeFileSync(path.join(cwd, 'notes.txt'), 'untracked\n');

  const result = runObjectiveCompletionTruth(input(cwd), {
    transcriptText: transcript('FINAL_GIT_STATUS=?? notes.txt\nUNRELATED_MUTATIONS=NONE'),
  });
  assert.deepEqual(result, { decision: 'allow' });
});

test('stop_hook_active makes correction strictly one-shot', () => {
  const cwd = initRepo('one-shot');
  fs.appendFileSync(path.join(cwd, 'README.md'), 'changed\n');

  const result = runObjectiveCompletionTruth(input(cwd, { stop_hook_active: true }), {
    transcriptText: transcript('FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE'),
  });
  assert.deepEqual(result, { decision: 'allow' });
});

test('git-unavailable and transcript-unavailable states fail soft', () => {
  const cwd = path.join(TMP, 'not-a-repo');
  fs.mkdirSync(cwd, { recursive: true });
  assert.deepEqual(runObjectiveCompletionTruth(input(cwd), {
    transcriptText: transcript('FINAL_GIT_STATUS=CLEAN'),
  }), { decision: 'allow' });

  assert.deepEqual(runObjectiveCompletionTruth(input(cwd, { transcriptPath: path.join(cwd, 'missing.jsonl') })), {
    decision: 'allow',
  });
});

test('retries a readable live transcript when assistant completion is not visible yet', () => {
  const cwd = initRepo('visibility-lag');
  fs.appendFileSync(path.join(cwd, 'README.md'), 'changed\n');
  const falseClean = 'FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE\nUNRELATED_MUTATIONS=NONE';
  const promptOnly = [
    JSON.stringify({ type: 'user.message', data: { content: `Quoted checkpoint only:\n${falseClean}` } }),
    JSON.stringify({ type: 'assistant.turn_start', data: { turnId: '0' } }),
  ].join('\n');
  const complete = [
    promptOnly,
    JSON.stringify({ type: 'assistant.message', data: { content: falseClean, turnId: '0', toolRequests: [] } }),
    JSON.stringify({ type: 'assistant.turn_end', data: { turnId: '0' } }),
  ].join('\n');

  const snapshots = [promptOnly, complete];
  let reads = 0;
  const waits = [];
  const result = runObjectiveCompletionTruth(input(cwd), {
    readTranscript: () => snapshots[Math.min(reads++, snapshots.length - 1)],
    sleep: (ms) => waits.push(ms),
  });

  assert.equal(result.decision, 'block');
  assert.equal(reads, 2);
  assert.deepEqual(waits, [25]);
  assert.match(result.reason, /README\.md/);
});

test('transcript visibility retry stays bounded and fails soft when completion never appears', () => {
  const cwd = initRepo('visibility-never-arrives');
  fs.appendFileSync(path.join(cwd, 'README.md'), 'changed\n');
  const promptOnly = JSON.stringify({
    type: 'user.message',
    data: { content: 'FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE\nUNRELATED_MUTATIONS=NONE' },
  });

  let reads = 0;
  const waits = [];
  const result = runObjectiveCompletionTruth(input(cwd), {
    readTranscript: () => {
      reads += 1;
      return promptOnly;
    },
    sleep: (ms) => waits.push(ms),
  });

  assert.deepEqual(result, { decision: 'allow' });
  assert.equal(reads, 9);
  assert.equal(waits.length, 8);
  assert.ok(waits.every((ms) => ms === 25));
});

test('setup artifact classifier stays intentionally narrow', () => {
  assert.deepEqual(classifySetupArtifactPaths([
    '?? src/pkg.egg-info/PKG-INFO',
    '?? .venv/pyvenv.cfg',
    '?? uv.lock',
    '?? src/product.js',
  ]), ['src/pkg.egg-info/PKG-INFO', '.venv/pyvenv.cfg']);
});

test('command-hook entrypoint emits one compact decision object and creates no repository state', () => {
  const cwd = initRepo('entrypoint');
  fs.appendFileSync(path.join(cwd, 'README.md'), 'changed\n');
  const transcriptPath = path.join(cwd, 'synthetic-transcript.jsonl');
  fs.writeFileSync(transcriptPath, `${transcript('FINAL_GIT_STATUS=CLEAN\nSETUP_ARTIFACTS=NONE')}\n`);

  const before = git(cwd, ['status', '--porcelain=v1', '--untracked-files=all']);
  const result = spawnSync(process.execPath, [HOOK], {
    cwd,
    encoding: 'utf8',
    input: JSON.stringify(input(cwd, { transcriptPath })),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, 'block');
  const after = git(cwd, ['status', '--porcelain=v1', '--untracked-files=all']);
  assert.equal(after, before, 'objective completion hook must not mutate the target repository');
});

test.after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

console.log('test_copilot_objective_completion_truth.mjs: one-shot structured contradiction gate OK');
