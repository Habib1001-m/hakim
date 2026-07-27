#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E3 = path.join(ROOT, 'experiments/post-e1/e3');
const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-e3-materializer-'));
const preparedRoot = path.join(tempParent, 'pair');

try {
  const prepared = spawnSync(process.execPath, [path.join(E3, 'prepare.mjs'), preparedRoot], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(prepared.status, 0, `E3 materializer must succeed:\n${prepared.stdout}\n${prepared.stderr}`);

  const manifest = JSON.parse(fs.readFileSync(path.join(preparedRoot, 'EXPERIMENT_INPUTS.json'), 'utf8'));
  assert.equal(manifest.experiment, 'POST-E1-E3');
  assert.equal(manifest.visible_baseline, 'PASS');
  assert.equal(manifest.hidden_behavior_baseline, 'PASS');
  assert.equal(manifest.seeded_duplicate_formatter, 'PRESENT');
  assert.match(manifest.baseline_sha, /^[a-f0-9]{40}$/);

  const control = path.join(preparedRoot, 'control');
  const treatment = path.join(preparedRoot, 'treatment');
  for (const candidate of [control, treatment]) {
    assert.equal(spawnSync('git', ['-C', candidate, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), manifest.baseline_sha);
    assert.equal(spawnSync('git', ['-C', candidate, 'status', '--porcelain'], { encoding: 'utf8' }).stdout, '');
  }
} finally {
  fs.rmSync(tempParent, { recursive: true, force: true });
}

console.log('test_post_e1_e3_materializer.mjs: clean identical E3 pair from one frozen baseline');
