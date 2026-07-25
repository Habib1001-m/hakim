#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { inspectStatus } from '../scripts/hakim_opencode_cli.mjs';
import { installOpenCodeAdapter } from '../scripts/hakim_opencode_install.mjs';
import { removeOpenCodeAdapter } from '../scripts/hakim_opencode_remove.mjs';
import {
  INSTALL_MANIFEST_RELATIVE_PATH,
  buildOpenCodeBundle,
  sha256,
} from '../scripts/lib/opencode_bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function withRepository(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-opencode-adversarial-'));
  const target = path.join(parent, 'repository');
  fs.mkdirSync(target);
  return Promise.resolve()
    .then(() => fn({ parent, target }))
    .finally(() => fs.rmSync(parent, { recursive: true, force: true }));
}

test('P0-02: bytes changed in the final verify-to-rename window are restored no-clobber, never deleted', async () => withRepository(({ target }) => {
  assert.equal(installOpenCodeAdapter({ target, apply: true }, ROOT).state, 'CREATED');

  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.js');
  const changedBytes = Buffer.concat([
    fs.readFileSync(plugin),
    Buffer.from('\n// concurrent user change in verify-to-rename window\n'),
  ]);

  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = function patchedRename(from, to) {
    if (!injected && path.resolve(String(from)) === path.resolve(plugin)) {
      fs.writeFileSync(plugin, changedBytes);
      injected = true;
    }
    return originalRename.call(this, from, to);
  };

  try {
    const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
    assert.equal(injected, true, 'fault must occur inside the final verify-to-rename window');
    assert.equal(report.status, 'FAIL');
    assert.equal(report.state, 'REMOVE_FAILED_RESTORED');
    assert.equal(report.rollback_attempted, true);
    assert.equal(report.rollback_complete, true);
    assert.equal(report.quarantine_retained, false);
    assert.equal(fs.existsSync(plugin), true, 'changed file must be restored to its original path');
    assert.deepEqual(fs.readFileSync(plugin), changedBytes, 'the actual changed bytes must be preserved exactly');
  } finally {
    fs.renameSync = originalRename;
  }
}));

test('P0-03: rollback race preserves a concurrent replacement even when it occurs after rollback pre-verification', async () => withRepository(({ target }) => {
  const bundle = buildOpenCodeBundle(ROOT);
  const first = bundle.files[0];
  const firstPath = path.join(target, first.target_relative);
  const replacement = Buffer.from('CONCURRENT REPLACEMENT DURING ROLLBACK\n');

  const originalWrite = fs.writeFileSync;
  const originalRename = fs.renameSync;
  let managedWrites = 0;
  let failureInjected = false;
  let renameRaceInjected = false;

  fs.writeFileSync = function patchedWrite(file, data, options) {
    const filename = path.resolve(String(file));
    if (filename.startsWith(path.resolve(target, '.opencode')) && !filename.includes('.hakim-')) {
      managedWrites += 1;
      if (managedWrites === 2) {
        failureInjected = true;
        throw new Error('fault injection after first verified create');
      }
    }
    return originalWrite.call(this, file, data, options);
  };

  fs.renameSync = function patchedRename(from, to) {
    if (!renameRaceInjected && path.resolve(String(from)) === path.resolve(firstPath)) {
      originalWrite(firstPath, replacement);
      renameRaceInjected = true;
    }
    return originalRename.call(this, from, to);
  };

  try {
    const report = installOpenCodeAdapter({ target, apply: true }, ROOT);
    assert.equal(failureInjected, true);
    assert.equal(renameRaceInjected, true, 'replacement must occur after rollback pre-verification and immediately before rename');
    assert.equal(report.status, 'FAIL');
    assert.equal(report.state, 'CREATE_FAILED_ROLLBACK_INCOMPLETE');
    assert.equal(report.rollback_attempted, true);
    assert.equal(report.rollback_complete, false, 'concurrent user mutation means pristine pre-install state cannot be claimed');
    assert.equal(fs.existsSync(firstPath), true);
    assert.deepEqual(fs.readFileSync(firstPath), replacement, 'rollback must restore/preserve the replacement rather than delete it');
  } finally {
    fs.writeFileSync = originalWrite;
    fs.renameSync = originalRename;
  }
}));

test('forged same-version manifest cannot redefine customized Hakim paths as removable ownership', async () => withRepository(({ target }) => {
  assert.equal(installOpenCodeAdapter({ target, apply: true }, ROOT).state, 'CREATED');

  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.js');
  const customBytes = Buffer.from('export default () => ({ userOwned: true });\n');
  fs.writeFileSync(plugin, customBytes);

  const manifestPath = path.join(target, INSTALL_MANIFEST_RELATIVE_PATH);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pluginRecord = manifest.files.find((record) => record.target_relative === '.opencode/plugins/hakim.js');
  pluginRecord.sha256 = sha256(customBytes);
  pluginRecord.size = customBytes.length;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const status = inspectStatus(target, ROOT);
  assert.equal(status.status, 'FAIL');
  assert.equal(status.state, 'MANIFEST_UNSUPPORTED');

  const remove = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(remove.status, 'FAIL');
  assert.equal(remove.state, 'REFUSED_MANIFEST_UNSUPPORTED');
  assert.deepEqual(fs.readFileSync(plugin), customBytes, 'forged ownership metadata must never authorize deletion');
}));

console.log('test_hakim_opencode_adversarial_transactions.mjs: ok');
