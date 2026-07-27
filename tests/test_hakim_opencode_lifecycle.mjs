#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { installOpenCodeAdapter, parseArgs } from '../scripts/hakim_opencode_install.mjs';
import { removeOpenCodeAdapter } from '../scripts/hakim_opencode_remove.mjs';
import { inspectStatus } from '../scripts/hakim_opencode_cli.mjs';
import {
  INSTALL_MANIFEST_RELATIVE_PATH,
  SUPPORTED_LEGACY_MANIFESTS,
  buildOpenCodeBundle,
  inspectInstalledBundle,
  readInstalledManifest,
  validateInstallManifest,
} from '../scripts/lib/opencode_bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURRENT_VERSION = fs.readFileSync(path.join(ROOT, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
const PREVIOUS_SUPPORTED_VERSION = '1.0.0-beta.1';

function withRepository(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-opencode-lifecycle-'));
  const target = path.join(parent, 'repository');
  fs.mkdirSync(target);
  return Promise.resolve()
    .then(() => fn({ parent, target }))
    .finally(() => fs.rmSync(parent, { recursive: true, force: true }));
}

function makeVariantSource(parent, version, marker = '') {
  const root = path.join(parent, `source-${version.replaceAll(/[^A-Za-z0-9.-]/g, '_')}`);
  fs.mkdirSync(path.join(root, 'core'), { recursive: true });
  fs.mkdirSync(path.join(root, 'plugins'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'core', 'hakim-skill'), path.join(root, 'core', 'hakim-skill'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'core', 'loaders'), path.join(root, 'core', 'loaders'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'plugins', 'opencode'), path.join(root, 'plugins', 'opencode'), { recursive: true });
  fs.writeFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), `${version}\n`);
  if (marker) fs.appendFileSync(path.join(root, 'plugins', 'opencode', 'hakim.mjs'), `\n// ${marker}\n`);
  return root;
}

function findQuarantinedFile(report, targetRelative) {
  if (!report.quarantine_path) return null;
  const relative = targetRelative.replace(/^\.opencode\//, '');
  const candidates = [
    path.join(report.quarantine_path, relative),
    path.join(report.quarantine_path, 'old', relative),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

test('accepted legacy beta.1 manifest is immutable, bounded, and structurally valid', () => {
  assert.equal(SUPPORTED_LEGACY_MANIFESTS.length, 1);
  const legacy = SUPPORTED_LEGACY_MANIFESTS[0];
  assert.equal(legacy.product_version, PREVIOUS_SUPPORTED_VERSION);
  assert.equal(legacy.source_commit, 'b442820d2803955d0f7f33b405bd096f443d4d72');
  assert.equal(legacy.files.length, 9);
  assert.equal(validateInstallManifest(legacy).ok, true);
  assert.equal(legacy.files.find((record) => record.target_relative === '.opencode/plugins/hakim.js')?.sha256, 'c376602fa072aad4e9fe851c772591801c3cf8479ff518cba308e308c47d9c88');
});

test('argument parser requires target and preserves dry-run default', () => {
  assert.deepEqual(parseArgs(['--target', '/tmp/example', '--json']), { target: '/tmp/example', apply: false, json: true, help: false });
  assert.throws(() => parseArgs([]), /--target is required/);
  assert.throws(() => parseArgs(['--unknown']), /unknown option/);
});

test('installer dry-run is non-mutating, apply creates exact managed bundle, and repeat is idempotent', async () => withRepository(({ target }) => {
  const bundle = buildOpenCodeBundle(ROOT);
  assert.equal(bundle.product_version, CURRENT_VERSION);
  assert.equal(bundle.files.find((file) => file.source_relative === 'plugins/opencode/hakim.mjs')?.target_relative, '.opencode/plugins/hakim.js');

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
  assert.equal(readInstalledManifest(target).state, 'VALID');
  assert.equal(readInstalledManifest(target).manifest.product_version, CURRENT_VERSION);
  assert.equal(fs.existsSync(path.join(target, INSTALL_MANIFEST_RELATIVE_PATH)), true);
  assert.equal(fs.existsSync(path.join(target, 'opencode.json')), false, 'installer must not create or edit opencode.json');
  assert.equal(inspectStatus(target, ROOT).state, 'EXACT_MATCH');

  const repeated = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(repeated.status, 'PASS');
  assert.equal(repeated.state, 'ALREADY_MATCHES');
  assert.equal(repeated.write_attempted, false);
  assert.equal(repeated.filesystem_changed, false);
}));

test('installer refuses a conflicting pre-existing plugin without modifying it', async () => withRepository(({ target }) => {
  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.js');
  fs.mkdirSync(path.dirname(plugin), { recursive: true });
  fs.writeFileSync(plugin, 'export default () => ({ custom: true });\n');
  const before = fs.readFileSync(plugin, 'utf8');

  const report = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_UNMANAGED_CONFLICT');
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
  assert.equal(report.state, 'REFUSED_UNMANAGED_CONFLICT');
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

test('create rollback never deletes a concurrent replacement', async () => withRepository(({ target }) => {
  const bundle = buildOpenCodeBundle(ROOT);
  const first = bundle.files[0];
  const firstPath = path.join(target, first.target_relative);
  const originalWrite = fs.writeFileSync;
  let managedWrites = 0;
  let injected = false;
  fs.writeFileSync = function patchedWrite(file, data, options) {
    const asString = String(file);
    if (asString.startsWith(path.join(target, '.opencode')) && !asString.includes('.hakim-')) {
      managedWrites += 1;
      if (managedWrites === 2) {
        originalWrite(firstPath, 'CONCURRENT USER REPLACEMENT\n');
        injected = true;
        throw new Error('fault injection after first verified create');
      }
    }
    return originalWrite.call(this, file, data, options);
  };
  try {
    const report = installOpenCodeAdapter({ target, apply: true }, ROOT);
    assert.equal(injected, true);
    assert.equal(report.status, 'FAIL');
    assert.equal(report.state, 'CREATE_FAILED_ROLLBACK_INCOMPLETE');
    assert.equal(report.rollback_attempted, true);
    assert.equal(report.rollback_complete, false);
    assert.equal(fs.readFileSync(firstPath, 'utf8'), 'CONCURRENT USER REPLACEMENT\n');
  } finally {
    fs.writeFileSync = originalWrite;
  }
}));

test('remover dry-run is non-mutating and managed removal preserves unrelated OpenCode content', async () => withRepository(({ target }) => {
  const unrelated = path.join(target, '.opencode', 'keep.txt');
  fs.mkdirSync(path.dirname(unrelated), { recursive: true });
  fs.writeFileSync(unrelated, 'preserve me\n');

  assert.equal(installOpenCodeAdapter({ target, apply: true }, ROOT).state, 'CREATED');
  const dryRun = removeOpenCodeAdapter({ target, apply: false }, ROOT);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_REMOVE');
  assert.equal(dryRun.filesystem_changed, false);

  const removed = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(removed.status, 'PASS');
  assert.equal(removed.state, 'REMOVED');
  assert.equal(removed.removal_performed, true);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'preserve me\n');
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'plugins', 'hakim.js')), false);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'hakim-runtime')), false);

  const repeated = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(repeated.status, 'PASS');
  assert.equal(repeated.state, 'ALREADY_ABSENT');
  assert.equal(repeated.mutation_attempted, false);
}));

test('remover refuses a modified managed file and leaves the full bundle untouched', async () => withRepository(({ target }) => {
  assert.equal(installOpenCodeAdapter({ target, apply: true }, ROOT).state, 'CREATED');
  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.js');
  fs.appendFileSync(plugin, '\n// local customization\n');
  const before = fs.readFileSync(plugin, 'utf8');

  const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(report.mutation_attempted, false);
  assert.equal(fs.readFileSync(plugin, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'hakim-runtime')), true);
}));

test('remover refuses a partial managed bundle without deleting remaining files', async () => withRepository(({ target }) => {
  assert.equal(installOpenCodeAdapter({ target, apply: true }, ROOT).state, 'CREATED');
  const bundle = buildOpenCodeBundle(ROOT);
  fs.unlinkSync(path.join(target, bundle.files[0].target_relative));
  const survivor = path.join(target, bundle.files[1].target_relative);
  const survivorBefore = fs.readFileSync(survivor);

  const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'REFUSED_PARTIAL_OR_MODIFIED');
  assert.equal(report.mutation_attempted, false);
  assert.deepEqual(fs.readFileSync(survivor), survivorBefore);
}));

test('removal detects a change between final verification and quarantine move without deleting the changed bytes', async () => withRepository(({ target }) => {
  assert.equal(installOpenCodeAdapter({ target, apply: true }, ROOT).state, 'CREATED');
  const plugin = path.join(target, '.opencode', 'plugins', 'hakim.js');
  const changed = `${fs.readFileSync(plugin, 'utf8')}\n// concurrent change during removal\n`;
  const originalRename = fs.renameSync;
  let injected = false;
  fs.renameSync = function patchedRename(from, to) {
    if (!injected && path.resolve(String(from)) === path.resolve(plugin)) {
      fs.writeFileSync(plugin, changed);
      injected = true;
    }
    return originalRename.call(this, from, to);
  };
  try {
    const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
    assert.equal(injected, true);
    assert.equal(report.status, 'FAIL');
    assert.match(report.state, /^REMOVE_FAILED_/);
    const quarantined = findQuarantinedFile(report, '.opencode/plugins/hakim.js');
    if (fs.existsSync(plugin)) {
      assert.equal(fs.readFileSync(plugin, 'utf8'), changed, 'changed bytes must be restored without clobber');
    } else {
      assert.ok(quarantined, 'changed bytes must remain recoverable in retained quarantine');
      assert.equal(fs.readFileSync(quarantined, 'utf8'), changed);
    }
  } finally {
    fs.renameSync = originalRename;
  }
}));

test('current CLI transactionally upgrades a complete persisted supported beta.1 installation', async () => withRepository(({ parent, target }) => {
  const olderSource = makeVariantSource(parent, PREVIOUS_SUPPORTED_VERSION, 'synthetic-persisted-beta1');
  const installed = installOpenCodeAdapter({ target, apply: true }, olderSource);
  assert.equal(installed.state, 'CREATED');
  assert.equal(installed.installed_product_version, PREVIOUS_SUPPORTED_VERSION);

  const statusBefore = inspectStatus(target, ROOT);
  assert.equal(statusBefore.status, 'PASS');
  assert.equal(statusBefore.state, 'UPGRADE_AVAILABLE');
  assert.equal(statusBefore.installed_product_version, PREVIOUS_SUPPORTED_VERSION);

  const dryRun = installOpenCodeAdapter({ target, apply: false }, ROOT);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_UPGRADE');
  assert.equal(dryRun.filesystem_changed, false);

  const upgraded = installOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(upgraded.status, 'PASS');
  assert.equal(upgraded.state, 'UPGRADED');
  assert.equal(upgraded.previous_product_version, PREVIOUS_SUPPORTED_VERSION);
  assert.equal(upgraded.installed_product_version, CURRENT_VERSION);
  assert.equal(readInstalledManifest(target).manifest.product_version, CURRENT_VERSION);
  assert.equal(inspectStatus(target, ROOT).state, 'EXACT_MATCH');
}));

test('current CLI can remove a complete persisted supported beta.1 installation', async () => withRepository(({ parent, target }) => {
  const olderSource = makeVariantSource(parent, PREVIOUS_SUPPORTED_VERSION, 'synthetic-persisted-beta1-remove');
  assert.equal(installOpenCodeAdapter({ target, apply: true }, olderSource).state, 'CREATED');

  const report = removeOpenCodeAdapter({ target, apply: true }, ROOT);
  assert.equal(report.status, 'PASS');
  assert.equal(report.state, 'REMOVED');
  assert.equal(report.installed_product_version, PREVIOUS_SUPPORTED_VERSION);
  assert.equal(fs.existsSync(path.join(target, '.opencode', 'plugins', 'hakim.js')), false);
  assert.equal(fs.existsSync(path.join(target, INSTALL_MANIFEST_RELATIVE_PATH)), false);
}));

console.log('test_hakim_opencode_lifecycle.mjs: ok');
