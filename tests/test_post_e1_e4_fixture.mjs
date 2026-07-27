#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(ROOT, 'experiments/post-e1/e4');
const hidden = path.join(root, 'evaluator/hidden.test.mjs');

function runNode(args, env = {}) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

function requirePass(result, label) {
  assert.equal(result.status, 0, `${label} must pass:\n${result.stdout}\n${result.stderr}`);
}

requirePass(runNode(['--test', 'tests/presets.test.mjs']), 'E4 visible baseline');
requirePass(runNode([
  '--test',
  '--test-name-pattern=existing public behavior remains intact|dependency-free',
  hidden,
], { E4_CANDIDATE_ROOT: root }), 'E4 hidden existing-behavior baseline');

const seeded = runNode([
  '--test',
  '--test-name-pattern=removePreset is exported as the requested public operation',
  hidden,
], { E4_CANDIDATE_ROOT: root });
assert.notEqual(seeded.status, 0, 'E4 untouched fixture must still be missing removePreset');

const moduleText = fs.readFileSync(path.join(root, 'src/presets.mjs'), 'utf8');
assert.doesNotMatch(moduleText, /export function removePreset/);

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
assert.match(readme, /default.{0,3}preset\s+always\s+exists/i);
assert.match(readme, /state\.active.*preset.*exists/i);
assert.doesNotMatch(readme, /removePreset\s*\(/);

for (const required of ['TASK_PROMPT.txt', 'README.md', 'evaluator/hidden.test.mjs']) {
  assert.ok(fs.statSync(path.join(root, required)).isFile(), `missing frozen E4 artifact: ${required}`);
}

console.log('test_post_e1_e4_fixture.mjs: existing behavior green, missing feature seeded, documented invariants intact');
