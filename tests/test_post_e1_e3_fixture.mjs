#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(ROOT, 'experiments/post-e1/e3');
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

requirePass(runNode(['--test', 'tests/session-summary.test.mjs']), 'E3 visible baseline');
requirePass(runNode([
  '--test',
  '--test-name-pattern=output remains|validation behavior|dependency-free',
  hidden,
], { E3_CANDIDATE_ROOT: root }), 'E3 hidden behavior baseline');

const seeded = runNode([
  '--test',
  '--test-name-pattern=reuses the existing maintained duration formatter|no longer carries its own duration-formatting algorithm',
  hidden,
], { E3_CANDIDATE_ROOT: root });
assert.notEqual(seeded.status, 0, 'E3 untouched fixture must still contain duplicate duration formatting');

const target = fs.readFileSync(path.join(root, 'src/session-summary.mjs'), 'utf8');
assert.doesNotMatch(target, /format-duration\.mjs/);
assert.match(target, /Math\.floor\s*\(\s*session\.durationMs\s*\/\s*1000/);

for (const required of ['TASK_PROMPT.txt', 'README.md', 'evaluator/hidden.test.mjs']) {
  assert.ok(fs.statSync(path.join(root, required)).isFile(), `missing frozen E3 artifact: ${required}`);
}

console.log('test_post_e1_e3_fixture.mjs: visible behavior green, seeded duplication present, hidden invariants intact');
