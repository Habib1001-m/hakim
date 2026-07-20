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

function ownershipPath(cli, config) {
  return path.join(config, cli.OWNERSHIP_FILE);
}

function firstPayload(cli, config) {
  const data = JSON.parse(fs.readFileSync(ownershipPath(cli, config), 'utf8'));
  return { record: data.files[0], target: path.join(config, ...data.files[0].path.split('/')) };
}

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-native-transaction-'));
const packageRoot = path.join(root, 'package');
const buildReport = build(packageRoot);
assert.equal(buildReport.status, 'PASS');
assert.equal(fs.existsSync(path.join(packageRoot, 'bin', 'lib', 'ownership.mjs')), true);
assert.equal(fs.existsSync(path.join(packageRoot, 'bin', 'lib', 'transaction.mjs')), true);
assert.equal(fs.existsSync(path.join(packageRoot, 'bin', 'lib', 'realpath-containment.mjs')), true);
assert.equal(fs.existsSync(path.join(packageRoot, 'bin', 'lib', 'lifecycle.mjs')), true);

const cli = await loadCli(packageRoot, 'transaction');
const currentPackageVersion = cli.packageMetadata().version;
assert.deepEqual(
  [...cli.SUPPORTED_OWNED_PATHS],
  cli.walkPayload().map((record) => record.path).sort(),
  'the supported ownership allowlist must exactly match the packaged payload path set',
);

// Preserve the ordinary install/status/reinstall/remove lifecycle.
{
  const config = configRoot(root, 'happy');
  let report = cli.install(args(config, 'install'));
  assert.equal(report.state, 'INSTALLED');
  report = cli.status(args(config, 'status'));
  assert.equal(report.state, 'INSTALLED_EXACT_MATCH');
  report = cli.install(args(config, 'install'));
  assert.equal(report.state, 'ALREADY_MATCHES');
  assert.equal(report.filesystem_changed, false);
  report = cli.remove(args(config, 'remove'));
  assert.equal(report.state, 'REMOVED');
  assert.equal(fs.existsSync(ownershipPath(cli, config)), false);
}

// A forged empty ownership record cannot become an exact-match status.
{
  const config = configRoot(root, 'forged');
  fs.mkdirSync(config, { recursive: true });
  fs.writeFileSync(ownershipPath(cli, config), JSON.stringify({
    schema_version: 999,
    package_name: 'evil',
    package_version: '0',
    host: 'other',
    install_scope: 'other',
    files: [],
  }));
  const report = cli.status(args(config, 'status'));
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'OWNERSHIP_RECORD_INVALID');
  assert.ok(report.errors.some((item) => item.includes('non-empty')));
}

// A valid-hash forged record cannot claim or remove opencode.json.
{
  const config = configRoot(root, 'forged-opencode-json');
  fs.mkdirSync(config, { recursive: true });
  const unrelated = path.join(config, 'opencode.json');
  const content = Buffer.from('{"plugin":["other"]}\n');
  fs.writeFileSync(unrelated, content);
  fs.writeFileSync(ownershipPath(cli, config), `${JSON.stringify({
    schema_version: 1,
    package_name: '@habib/hakim',
    package_version: cli.packageMetadata().version,
    host: 'opencode',
    install_scope: 'global-user-config',
    files: [{ path: 'opencode.json', sha256: digest(content), size: content.length }],
  }, null, 2)}\n`);
  const report = cli.status(args(config, 'status'));
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'OWNERSHIP_RECORD_INVALID');
  assert.ok(report.errors.some((item) => item.includes('outside the supported Hakim-owned inventory')));
  assert.throws(() => cli.remove(args(config, 'remove')), /refusing removal: OWNERSHIP_RECORD_INVALID/);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), content.toString('utf8'));
  assert.equal(fs.existsSync(ownershipPath(cli, config)), true);
}

// A same-version exact-path forged inventory with non-package hashes is non-removable.
{
  const config = configRoot(root, 'forged-supported-paths');
  fs.mkdirSync(config, { recursive: true });
  const files = [];
  for (const record of cli.walkPayload()) {
    const target = path.join(config, ...record.path.split('/'));
    const content = Buffer.from(`forged bytes for ${record.path}\n`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    files.push({ path: record.path, sha256: digest(content), size: content.length });
  }
  fs.writeFileSync(ownershipPath(cli, config), `${JSON.stringify({
    schema_version: 1,
    package_name: '@habib/hakim',
    package_version: cli.packageMetadata().version,
    host: 'opencode',
    install_scope: 'global-user-config',
    files,
  }, null, 2)}\n`);
  const report = cli.status(args(config, 'status'));
  assert.equal(report.status, 'FAIL');
  assert.equal(report.state, 'INSTALLED_PACKAGE_MISMATCH');
  assert.throws(() => cli.remove(args(config, 'remove')), /refusing removal: INSTALLED_PACKAGE_MISMATCH/);
  const first = path.join(config, ...files[0].path.split('/'));
  assert.equal(fs.existsSync(first), true);
  assert.equal(fs.existsSync(ownershipPath(cli, config)), true);
}

// A lifecycle lock refuses stale status and a concurrent removal.
{
  const config = configRoot(root, 'lock');
  cli.install(args(config, 'install'));
  fs.writeFileSync(path.join(config, cli.LOCK_FILE), '{}\n', { flag: 'wx' });
  assert.throws(() => cli.status(args(config, 'status')), /lifecycle operation is active/);
  assert.throws(() => cli.remove(args(config, 'remove')), /lifecycle operation is active/);
  fs.unlinkSync(path.join(config, cli.LOCK_FILE));
  cli.remove(args(config, 'remove'));
}

// Install rollback preserves a concurrently changed file and the original error.
{
  const config = configRoot(root, 'install-rollback');
  let writes = 0;
  let changedTarget = null;
  assert.throws(
    () => cli.install(args(config, 'install'), {
      hooks: {
        afterPayloadWrite({ target }) {
          writes += 1;
          if (writes === 1) changedTarget = target;
        },
        beforePayloadWrite() {
          if (writes === 1) {
            fs.writeFileSync(changedTarget, 'concurrent replacement\n');
            throw new Error('injected second-write failure');
          }
        },
      },
    }),
    (error) => {
      assert.match(error.message, /injected second-write failure/);
      assert.match(error.message, /changed after creation; preserved/);
      return true;
    },
  );
  assert.equal(fs.readFileSync(changedTarget, 'utf8'), 'concurrent replacement\n');
  assert.equal(fs.existsSync(ownershipPath(cli, config)), false);
  assert.equal(fs.existsSync(path.join(config, cli.LOCK_FILE)), false);
}

// A source changed after its pre-check is refused before move or detected after
// quarantine; in both cases the changed source is preserved and never deleted.
{
  const config = configRoot(root, 'remove-toctou');
  cli.install(args(config, 'install'));
  let mutated = false;
  assert.throws(
    () => cli.remove(args(config, 'remove'), {
      hooks: {
        beforeRemovalPayloadMove({ source }) {
          if (!mutated) {
            mutated = true;
            fs.writeFileSync(source, 'concurrent user change\n');
          }
        },
      },
    }),
    /pre-quarantine revalidation failed|post-quarantine verification failed/,
  );
  const { target } = firstPayload(cli, config);
  assert.equal(fs.readFileSync(target, 'utf8'), 'concurrent user change\n');
  assert.equal(fs.existsSync(ownershipPath(cli, config)), true);
  assert.equal(fs.existsSync(path.join(config, cli.LOCK_FILE)), false);
}

// Rollback never overwrites a concurrently recreated source.
{
  const config = configRoot(root, 'remove-no-clobber');
  cli.install(args(config, 'install'));
  let injected = false;
  let occupiedSource = null;
  let retainedQuarantine = null;
  assert.throws(
    () => cli.remove(args(config, 'remove'), {
      hooks: {
        afterRemovalPayloadMove({ source, quarantine }) {
          if (!injected) {
            injected = true;
            occupiedSource = source;
            retainedQuarantine = quarantine;
            fs.mkdirSync(path.dirname(source), { recursive: true });
            fs.writeFileSync(source, 'replacement created during rollback\n');
            throw new Error('injected removal failure');
          }
        },
      },
    }),
    (error) => {
      assert.match(error.message, /injected removal failure/);
      assert.match(error.message, /source occupied; quarantine retained/);
      assert.match(error.message, /quarantine retained at/);
      return true;
    },
  );
  assert.equal(fs.readFileSync(occupiedSource, 'utf8'), 'replacement created during rollback\n');
  assert.equal(fs.existsSync(retainedQuarantine), true);
  assert.equal(fs.existsSync(path.join(config, cli.LOCK_FILE)), false);
}

// Unsafe and duplicate ownership paths are rejected structurally.
{
  const base = {
    schema_version: 1,
    package_name: '@habib/hakim',
    package_version: '1.0.0',
    host: 'opencode',
    install_scope: 'global-user-config',
  };
  let errors = cli.validateOwnership({ ...base, files: [{ path: '../escape', sha256: '0'.repeat(64), size: 1 }] });
  assert.ok(errors.some((item) => item.includes('unsafe path')));
  errors = cli.validateOwnership({ ...base, files: [
    { path: 'commands/hakim.md', sha256: '0'.repeat(64), size: 1 },
    { path: 'commands/hakim.md', sha256: '1'.repeat(64), size: 2 },
  ] });
  assert.ok(errors.some((item) => item.includes('duplicates path')));
  errors = cli.validateOwnership({ ...base, files: [
    { path: 'opencode.json', sha256: '0'.repeat(64), size: 1 },
  ] });
  assert.ok(errors.some((item) => item.includes('outside the supported Hakim-owned inventory')));
  errors = cli.validateOwnership({ ...base, files: [
    { path: 'commands/unrelated.md', sha256: '0'.repeat(64), size: 1 },
  ] });
  assert.ok(errors.some((item) => item.includes('outside the supported Hakim-owned inventory')));
}

// T08B: a current package upgrades an older healthy installation and refuses downgrade.
const newerPackageRoot = path.join(root, 'package-1.0.1');
fs.cpSync(packageRoot, newerPackageRoot, { recursive: true });
const newerManifestPath = path.join(newerPackageRoot, 'package.json');
const newerManifest = JSON.parse(fs.readFileSync(newerManifestPath, 'utf8'));
newerManifest.version = '1.0.1';
fs.writeFileSync(newerManifestPath, `${JSON.stringify(newerManifest, null, 2)}\n`);
fs.appendFileSync(path.join(newerPackageRoot, 'payload', 'commands', 'hakim-help.md'), '\nT08B upgrade marker.\n');
regenerateIntegrity(newerPackageRoot);
const newerCli = await loadCli(newerPackageRoot, 'newer');

{
  const config = configRoot(root, 'upgrade');
  cli.install(args(config, 'install'));
  let report = newerCli.status(args(config, 'status'));
  assert.equal(report.status, 'PASS');
  assert.equal(report.state, 'INSTALLED_UPGRADE_AVAILABLE');
  assert.equal(report.upgrade_available, true);
  report = newerCli.install(args(config, 'install'), { pid: 1001, now: () => 2002, lockToken: 'a'.repeat(32) });
  assert.equal(report.state, 'UPGRADED');
  assert.equal(report.previous_version, currentPackageVersion);
  assert.equal(report.installed_version, '1.0.1');
  assert.equal(newerCli.status(args(config, 'status')).state, 'INSTALLED_EXACT_MATCH');
  assert.throws(() => cli.install(args(config, 'install')), /refusing package downgrade/);
  assert.equal(newerCli.remove(args(config, 'remove')).removed_version, '1.0.1');
}

// T08B: the current package removes an older healthy installation using its validated ownership record.
{
  const config = configRoot(root, 'remove-old');
  cli.install(args(config, 'install'));
  const report = newerCli.remove(args(config, 'remove'));
  assert.equal(report.state, 'REMOVED');
  assert.equal(report.removed_version, currentPackageVersion);
}

// T08B: a failed upgrade restores the complete prior installation and preserves the primary failure.
{
  const config = configRoot(root, 'upgrade-rollback');
  cli.install(args(config, 'install'));
  assert.throws(
    () => newerCli.install(args(config, 'install'), {
      pid: 3003,
      now: () => 4004,
      lockToken: 'b'.repeat(32),
      hooks: {
        afterUpgradeQuarantine() { throw new Error('injected upgrade failure'); },
      },
    }),
    /injected upgrade failure/,
  );
  assert.equal(cli.status(args(config, 'status')).state, 'INSTALLED_EXACT_MATCH');
  assert.equal(newerCli.status(args(config, 'status')).state, 'INSTALLED_UPGRADE_AVAILABLE');
}

// T08B: tampered package bytes are rejected before the config root is mutated.
{
  const tamperedPackageRoot = path.join(root, 'package-tampered');
  fs.cpSync(newerPackageRoot, tamperedPackageRoot, { recursive: true });
  fs.appendFileSync(path.join(tamperedPackageRoot, 'payload', 'commands', 'hakim.md'), '\ntampered\n');
  const tamperedCli = await loadCli(tamperedPackageRoot, 'tampered');
  const config = configRoot(root, 'tampered');
  assert.throws(() => tamperedCli.install(args(config, 'install')), /package integrity verification failed/);
  assert.equal(fs.existsSync(ownershipPath(tamperedCli, config)), false);
}

console.log('native plugin transactional lifecycle, package integrity, cross-version upgrade, rollback, downgrade refusal, and old-version removal pass');
