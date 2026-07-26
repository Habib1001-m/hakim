#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E2 = path.join(ROOT, 'experiments/post-e1/e2');
const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-e2-materializer-'));
const preparedRoot = path.join(tempParent, 'pair');

try {
  const prepared = spawnSync(process.execPath, [path.join(E2, 'prepare.mjs'), preparedRoot], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(prepared.status, 0, `E2 materializer must succeed:\n${prepared.stdout}\n${prepared.stderr}`);

  const manifest = JSON.parse(fs.readFileSync(path.join(preparedRoot, 'EXPERIMENT_INPUTS.json'), 'utf8'));
  assert.equal(manifest.experiment, 'POST-E1-E2');
  assert.equal(manifest.visible_baseline, 'PASS');
  assert.equal(manifest.hidden_guard_baseline, 'PASS');
  assert.equal(manifest.seeded_hidden_bug, 'PRESENT');
  assert.match(manifest.baseline_sha, /^[a-f0-9]{40}$/);

  const control = path.join(preparedRoot, 'control');
  const treatment = path.join(preparedRoot, 'treatment');
  const controlHead = spawnSync('git', ['-C', control, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  const treatmentHead = spawnSync('git', ['-C', treatment, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  assert.equal(controlHead, manifest.baseline_sha);
  assert.equal(treatmentHead, manifest.baseline_sha);

  assert.equal(spawnSync('git', ['-C', control, 'status', '--porcelain'], { encoding: 'utf8' }).stdout, '');
  assert.equal(spawnSync('git', ['-C', treatment, 'status', '--porcelain'], { encoding: 'utf8' }).stdout, '');
} finally {
  fs.rmSync(tempParent, { recursive: true, force: true });
}

console.log('test_post_e1_e2_materializer.mjs: one immutable baseline commit produces a clean identical pair');
