#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E4 = path.join(ROOT, 'experiments/post-e1/e4');
const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-e4-materializer-'));
const preparedRoot = path.join(tempParent, 'pair');

try {
  const prepared = spawnSync(process.execPath, [path.join(E4, 'prepare.mjs'), preparedRoot], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(prepared.status, 0, `E4 materializer must succeed:\n${prepared.stdout}\n${prepared.stderr}`);

  const manifest = JSON.parse(fs.readFileSync(path.join(preparedRoot, 'EXPERIMENT_INPUTS.json'), 'utf8'));
  assert.equal(manifest.experiment, 'POST-E1-E4');
  assert.equal(manifest.visible_baseline, 'PASS');
  assert.equal(manifest.hidden_existing_behavior_baseline, 'PASS');
  assert.equal(manifest.seeded_remove_feature, 'ABSENT');
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

console.log('test_post_e1_e4_materializer.mjs: clean identical E4 pair from one frozen baseline');
