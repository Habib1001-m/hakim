#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { installOpenCodeAdapter, parseArgs } from '../scripts/hakim_opencode_install.mjs';
import { removeOpenCodeAdapter } from '../scripts/hakim_opencode_remove.mjs';
import { buildOpenCodeBundle, inspectInstalledBundle } from '../scripts/lib/opencode_bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function withRepository(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-opencode-lifecycle-'));
  const target = path.join(parent, 'repository');
  fs.mkdirSync(target);
  return Promise.resolve()
    .then(() => fn({ parent, target }))
    .finally(() => fs.rmSync(parent, { recursive: true, force: true }));
}

test('argument parser requires target and preserves dry-run default', () => {
  assert.deepEqual(parseArgs(['--target', '/tmp/example', '--json']), {
    target: '/tmp/example',
    apply: false,
    json: true,
    help: false,
  });
  assert.throws(() => parseArgs([]), /--target is required/);
  assert.throws(() => parseArgs(['--unknown']), /unknown option/);
});

test('installer dry-run is non-mutating, apply creates exact bundle, and repeat is idempotent', async () => withRepository(({ target }) => {
  const bundle = buildOpenCodeBundle(ROOT);

  const dryRun = installOpenCodeAdapter({ target, apply: false }, ROOT);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_CREATE');
  assert.equal(dryRun.filesystem_changed, false);
  assert.equal(fs.existsSync(path.join(target, '.opencode')), false);

  const applied = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(applied.status, 'PASS');
  assert.equal(applied.state, 'CREATED');
  assert.equal(applied.write_performed, true);
  assert.equal(applied.filesystem_changed, true);
  assert.equal(applied.created_files.length, bundle.files.length);
  assert.equal(inspectInstalledBundle(target, bundle).aggregate_state, 'EXACT_MATCH');
  assert.equal(fs.existsSync(path.join(target, 'opencode.json')), false, 'installer must not create or edit opencode.json');

  const repeated = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(repeated.status, 'PASS');
  assert.equal(repeated.state, 'ALREADY_MATCHES');
  assert.equal(repeated.write_attempted, false);
  assert.equal(repeated.filesystem_changed, false);
}));

test('installer refuses a conflicting pre-existing plugin without modifying it', async () => withRepository(({ target }) => {
  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.mjs');
  fs.mkdirSync(path.dirname(plugin), { recursive: true });
  fs.writeFileSync(plugin, 'export default () => ({ custom: true });\n');
  const before = fs.readFileSync(plugin, 'utf8');

  const report = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_DIFFERENT');
  assert.equal(report.write_attempted, false);
  assert.equal(fs.readFileSync(plugin, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'hakim-runtime')), false);
}));

test('installer refuses partial exact bundle instead of repairing it', async () => withRepository(({ target }) => {
  const bundle = buildOpenCodeBundle(ROOT);
  const one = bundle.files[0];
  const targetPath = path.join(target, one.target_relative);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, one.bytes);

  const report = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_DIFFERENT');
  assert.equal(report.inspection.exact, 1);
  assert.equal(report.write_attempted, false);
}));

test('installer refuses symlink target roots', async (t) => {
  if (process.platform === 'win32') return t.skip('symlink behavior differs on Windows');
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-opencode-symlink-'));
  const real = path.join(parent, 'real');
  const link = path.join(parent, 'link');
  fs.mkdirSync(real);
  fs.symlinkSync(real, link, 'dir');
  try {
    const report = installOpenCodeAdapter({ target: link, apply: true }, ROOT);
    assert.equal(report.status, 'FAIL');
    assert.equal(report.state, 'REFUSED_TARGET_SYMLINK');
    assert.equal(fs.existsSync(path.join(real, '.opencode')), false);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('remover dry-run is non-mutating and exact removal preserves unrelated OpenCode content', async () => withRepository(({ target }) => {
  const unrelated = path.join(target, '.opencode', 'keep.txt');
  fs.mkdirSync(path.dirname(unrelated), { recursive: true });
  fs.writeFileSync(unrelated, 'preserve me\n');

  const installed = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(installed.state, 'CREATED');

  const dryRun = removeOpenCodeAdapter({ target, apply: false }, ROOT);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_REMOVE');
  assert.equal(dryRun.filesystem_changed, false);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'plugins', 'hakim.mjs')), true);

  const removed = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(removed.status, 'PASS');
  assert.equal(removed.state, 'REMOVED');
  assert.equal(removed.removal_performed, true);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'preserve me\n');
  assert.equal(fs.existsSync(path.join(target, '.opencode')), true);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'plugins', 'hakim.mjs')), false);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'hakim-runtime')), false);

  const repeated = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(repeated.status, 'PASS');
  assert.equal(repeated.state, 'ALREADY_ABSENT');
  assert.equal(repeated.mutation_attempted, false);
}));

test('remover refuses a modified file and leaves the full bundle untouched', async () => withRepository(({ target }) => {
  const installed = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(installed.state, 'CREATED');
  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.mjs');
  fs.appendFileSync(plugin, '\n// local customization\n');
  const before = fs.readFileSync(plugin, 'utf8');

  const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(report.mutation_attempted, false);
  assert.equal(fs.readFileSync(plugin, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'hakim-runtime')), true);
}));

test('remover refuses a partial bundle without deleting remaining canonical files', async () => withRepository(({ target }) => {
  const installed = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(installed.state, 'CREATED');
  const bundle = buildOpenCodeBundle(ROOT);
  const removedPath = path.join(target, bundle.files[0].target_relative);
  fs.unlinkSync(removedPath);
  const survivor = path.join(target, bundle.files[1].target_relative);
  const survivorBefore = fs.readFileSync(survivor);

  const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(report.mutation_attempted, false);
  assert.deepEqual(fs.readFileSync(survivor), survivorBefore);
}));

console.log('test_hakim_opencode_lifecycle.mjs: ok');
