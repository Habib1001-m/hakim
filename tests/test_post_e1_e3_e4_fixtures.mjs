#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNode(args, { cwd, env = {} } = {}) {
  return spawnSync(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

function requirePass(result, label) {
  assert.equal(result.status, 0, `${label} must pass:\n${result.stdout}\n${result.stderr}`);
}

function requireFail(result, label) {
  assert.notEqual(result.status, 0, `${label} must fail on the untouched seeded condition`);
}

// E3 — visible behavior is green, hidden behavioral invariants are green, but
// structural reuse is intentionally absent before the agent refactor.
{
  const root = path.join(ROOT, 'experiments/post-e1/e3');
  requirePass(runNode(['--test', 'tests/session-summary.test.mjs'], { cwd: root }), 'E3 visible baseline');

  const hidden = path.join(root, 'evaluator/hidden.test.mjs');
  requirePass(runNode([
    '--test',
    '--test-name-pattern=output remains|validation behavior|dependency-free',
    hidden,
  ], { cwd: root, env: { E3_CANDIDATE_ROOT: root } }), 'E3 hidden behavior baseline');

  requireFail(runNode([
    '--test',
    '--test-name-pattern=reuses the existing maintained duration formatter|no longer carries its own duration-formatting algorithm',
    hidden,
  ], { cwd: root, env: { E3_CANDIDATE_ROOT: root } }), 'E3 seeded duplicate-formatting condition');

  const target = fs.readFileSync(path.join(root, 'src/session-summary.mjs'), 'utf8');
  assert.doesNotMatch(target, /format-duration\.mjs/);
  assert.match(target, /Math\.floor\s*\(\s*session\.durationMs\s*\/\s*1000/);

  for (const required of ['TASK_PROMPT.txt', 'README.md', 'evaluator/hidden.test.mjs']) {
    assert.ok(fs.statSync(path.join(root, required)).isFile(), `missing frozen E3 artifact: ${required}`);
  }
}

// E4 — existing API/invariants are green and the requested removePreset public
// operation is intentionally absent before feature implementation.
{
  const root = path.join(ROOT, 'experiments/post-e1/e4');
  requirePass(runNode(['--test', 'tests/presets.test.mjs'], { cwd: root }), 'E4 visible baseline');

  const hidden = path.join(root, 'evaluator/hidden.test.mjs');
  requirePass(runNode([
    '--test',
    '--test-name-pattern=existing public behavior remains intact|dependency-free',
    hidden,
  ], { cwd: root, env: { E4_CANDIDATE_ROOT: root } }), 'E4 hidden existing-behavior baseline');

  requireFail(runNode([
    '--test',
    '--test-name-pattern=removePreset is exported as the requested public operation',
    hidden,
  ], { cwd: root, env: { E4_CANDIDATE_ROOT: root } }), 'E4 seeded missing feature');

  const moduleText = fs.readFileSync(path.join(root, 'src/presets.mjs'), 'utf8');
  assert.doesNotMatch(moduleText, /export function removePreset/);

  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /default preset always exists/i);
  assert.match(readme, /state\.active.*exists/i);

  for (const required of ['TASK_PROMPT.txt', 'README.md', 'evaluator/hidden.test.mjs']) {
    assert.ok(fs.statSync(path.join(root, required)).isFile(), `missing frozen E4 artifact: ${required}`);
  }
}

console.log('test_post_e1_e3_e4_fixtures.mjs: E3/E4 baselines, seeded conditions, and hidden invariants OK');
