#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../scripts/build_native_plugin_package.mjs';

function args(configDir, action, dryRun = false) {
  return { configDir, action, dryRun, json: true };
}

function configRoot(root, name) {
  return path.join(root, name, '.config', 'opencode');
}

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function snapshotFiles(root) {
  const files = new Map();
  const visit = (directory, prefix = '') => {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const relative = path.posix.join(prefix, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, relative);
      else if (stat.isFile()) files.set(relative, digest(fs.readFileSync(absolute)));
      else throw new Error(`unexpected snapshot entry: ${relative}`);
    }
  };
  visit(root);
  return files;
}

function regenerateIntegrity(packageRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const files = [];
  const visit = (directory, prefix = '') => {
    for (const name of fs.readdirSync(directory).sort()) {
      const relative = path.posix.join(prefix, name);
      if (relative === 'integrity.json') continue;
      const absolute = path.join(directory, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, relative);
      else if (stat.isFile()) {
        const content = fs.readFileSync(absolute);
        files.push({ path: relative, sha256: digest(content), size: content.length });
      }
    }
  };
  visit(packageRoot);
  fs.writeFileSync(path.join(packageRoot, 'integrity.json'), `${JSON.stringify({
    schema_version: 1,
    package_name: manifest.name,
    package_version: manifest.version,
    reproducible: true,
    canonical_capability_count: 6,
    files,
  }, null, 2)}\n`);
}

async function loadCli(packageRoot, label) {
  return import(`${pathToFileURL(path.join(packageRoot, 'bin', 'hakim.mjs')).href}?${label}=${Date.now()}-${Math.random()}`);
}

function replaceParentWithExternalSymlink(config, source, externalBase) {
  const parent = path.dirname(source);
  assert.notEqual(path.resolve(parent), path.resolve(config));
  const relativeParent = path.relative(config, parent);
  const externalParent = path.join(externalBase, relativeParent);
  fs.mkdirSync(path.dirname(externalParent), { recursive: true });
  fs.renameSync(parent, externalParent);
  fs.symlinkSync(externalParent, parent, 'dir');
  return {
    parent,
    externalParent,
    relativeParent,
    snapshot: snapshotFiles(externalParent),
  };
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-realpath-containment-'));
const packageRoot = path.join(root, 'package');
assert.equal(build(packageRoot).status, 'PASS');
assert.equal(fs.existsSync(path.join(packageRoot, 'bin', 'lib', 'realpath-containment.mjs')), true);
const cli = await loadCli(packageRoot, 'containment');

// Exact issue #126 shape: a post-install intermediate parent symlink cannot make
// matching external files appear healthy or removable.
{
  const config = configRoot(root, 'static-escape');
  cli.install(args(config, 'install'));
  const commands = path.join(config, 'commands');
  const externalCommands = path.join(root, 'external-static', 'commands');
  fs.mkdirSync(path.dirname(externalCommands), { recursive: true });
  fs.renameSync(commands, externalCommands);
  fs.symlinkSync(externalCommands, commands, 'dir');
  const before = snapshotFiles(externalCommands);

  const report = cli.status(args(config, 'status'));
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'INSTALLED_PATH_UNSAFE');
  assert.ok(report.errors.some((item) => item.includes('unsafe target directory chain')));
  assert.throws(() => cli.remove(args(config, 'remove', true)), /refusing removal: INSTALLED_PATH_UNSAFE/);
  assert.throws(() => cli.remove(args(config, 'remove')), /INSTALLED_PATH_UNSAFE/);
  assert.deepEqual(snapshotFiles(externalCommands), before);
  assert.equal(fs.existsSync(path.join(config, cli.OWNERSHIP_FILE)), true);
  assert.equal(fs.existsSync(path.join(config, cli.LOCK_FILE)), false);
}

// A parent swap after the initial file verification is refused before rename.
{
  const config = configRoot(root, 'remove-race');
  cli.install(args(config, 'install'));
  const externalBase = path.join(root, 'external-remove-race');
  let attacked = null;

  assert.throws(
    () => cli.remove(args(config, 'remove'), {
      hooks: {
        beforeRemovalPayloadMove({ source }) {
          if (!attacked) attacked = replaceParentWithExternalSymlink(config, source, externalBase);
        },
      },
    }),
    /unsafe target directory chain/,
  );

  assert.ok(attacked);
  assert.deepEqual(snapshotFiles(attacked.externalParent), attacked.snapshot);
  assert.equal(fs.existsSync(path.join(config, cli.LOCK_FILE)), false);
}

// Rollback refuses to restore a quarantined file through a newly substituted
// parent symlink and retains quarantine instead of mutating the external tree.
{
  const config = configRoot(root, 'rollback-race');
  cli.install(args(config, 'install'));
  const externalBase = path.join(root, 'external-rollback-race');
  let attacked = null;
  let movedLabel = null;
  let quarantine = null;

  assert.throws(
    () => cli.remove(args(config, 'remove'), {
      hooks: {
        afterRemovalPayloadMove({ source, record, quarantine: candidate }) {
          if (attacked) return;
          movedLabel = record.path;
          quarantine = candidate;
          attacked = replaceParentWithExternalSymlink(config, source, externalBase);
          throw new Error('injected rollback containment check');
        },
      },
    }),
    (error) => {
      assert.match(error.message, /injected rollback containment check/);
      assert.match(error.message, /unsafe restore path/);
      assert.match(error.message, /quarantine retained at/);
      return true;
    },
  );

  assert.ok(attacked);
  assert.ok(quarantine);
  assert.deepEqual(snapshotFiles(attacked.externalParent), attacked.snapshot);
  const movedName = path.basename(movedLabel);
  assert.equal(fs.existsSync(path.join(attacked.externalParent, movedName)), false);
  assert.equal(fs.existsSync(quarantine), true);
  assert.equal(fs.existsSync(path.join(config, cli.LOCK_FILE)), false);
}

// Upgrade uses the same post-hook containment revalidation as removal.
{
  const newerPackageRoot = path.join(root, 'package-newer');
  fs.cpSync(packageRoot, newerPackageRoot, { recursive: true });
  const manifestPath = path.join(newerPackageRoot, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = '1.0.1';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  regenerateIntegrity(newerPackageRoot);
  const newerCli = await loadCli(newerPackageRoot, 'containment-newer');

  const config = configRoot(root, 'upgrade-race');
  cli.install(args(config, 'install'));
  const externalBase = path.join(root, 'external-upgrade-race');
  let attacked = null;

  assert.throws(
    () => newerCli.install(args(config, 'install'), {
      hooks: {
        beforeUpgradePayloadMove({ source }) {
          if (!attacked) attacked = replaceParentWithExternalSymlink(config, source, externalBase);
        },
      },
    }),
    /unsafe target directory chain/,
  );

  assert.ok(attacked);
  assert.deepEqual(snapshotFiles(attacked.externalParent), attacked.snapshot);
  assert.equal(fs.existsSync(path.join(config, newerCli.LOCK_FILE)), false);
}

console.log('native lifecycle refuses intermediate-parent symlink escape before status, removal, upgrade, quarantine, and rollback mutation with zero external mutation');
