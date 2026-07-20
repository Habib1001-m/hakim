#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  CHECKSUMS_FILE,
  PROVENANCE_FILE,
  TARBALL_MANIFEST_FILE,
  packTarball,
  verifyPrereleaseEvidence,
} from '../scripts/pack_native_plugin_tarball.mjs';

function parseJsonReport(stdout) {
  const text = String(stdout || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}

  const end = text.lastIndexOf('}');
  if (end < 0) return null;
  for (let start = text.lastIndexOf('{', end); start >= 0; start = text.lastIndexOf('{', start - 1)) {
    try {
      const candidate = JSON.parse(text.slice(start, end + 1));
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) return candidate;
    } catch {}
  }
  return null;
}

function runArtifact(tarball, args, environment) {
  const result = spawnSync(
    'npm',
    ['exec', '--yes', `--package=${tarball}`, '--', 'hakim', ...args, '--json'],
    {
      cwd: environment.cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: environment.home,
        XDG_CONFIG_HOME: path.join(environment.home, '.config'),
        npm_config_cache: environment.cache,
        npm_config_audit: 'false',
        npm_config_fund: 'false',
        npm_config_loglevel: 'silent',
        npm_config_progress: 'false',
        npm_config_update_notifier: 'false',
      },
    },
  );
  return { ...result, report: parseJsonReport(result.stdout) };
}

function commandEvidence(command) {
  return [
    `exit=${command.status}`,
    `stdout=${JSON.stringify(command.stdout)}`,
    `stderr=${JSON.stringify(command.stderr)}`,
  ].join('\n');
}

function snapshotFiles(root) {
  const files = new Map();
  const visit = (directory, prefix = '') => {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const relative = path.posix.join(prefix, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, relative);
      else if (stat.isFile()) files.set(relative, fs.readFileSync(absolute).toString('hex'));
      else throw new Error(`unexpected tarball test entry: ${relative}`);
    }
  };
  visit(root);
  return files;
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-native-tarball-'));
const output = path.join(root, 'artifact');
const sourceCommit = 'a'.repeat(40);
const report = packTarball(output, { sourceCommit });

assert.equal(report.status, 'PASS');
assert.equal(report.package_name, '@habib/hakim');
assert.equal(report.package_version, '1.0.0-beta.1');
assert.equal(report.release_channel, 'private-prerelease');
assert.equal(report.public_publication_authorized, false);
assert.equal(report.marketplace_publication_authorized, false);
assert.equal(report.node_engine, '>=18');
assert.equal(report.tested_opencode_range, '>=1.18.3 <2');
assert.equal(report.source_commit, sourceCommit);
assert.equal(report.reproducible_npm_pack, true);
assert.equal(report.source_checkout_required_for_use, false);
assert.equal(report.install_command_count, 1);
assert.equal(fs.existsSync(report.tarball), true);
assert.equal(fs.existsSync(report.manifest), true);
assert.equal(fs.existsSync(report.provenance), true);
assert.equal(fs.existsSync(report.checksums), true);
assert.equal(path.dirname(report.tarball), output);
assert.equal(report.package_file_count > 10, true);
assert.equal(report.files.some((record) => record.path === 'package.json'), true);
assert.equal(report.files.some((record) => record.path === 'bin/hakim.mjs'), true);
assert.equal(report.files.some((record) => record.path === 'bin/lib/realpath-containment.mjs'), true);
assert.equal(report.files.some((record) => record.path === 'payload/plugins/hakim.mjs'), true);
assert.equal(report.files.some((record) => record.path.startsWith('tests/')), false);
assert.equal(report.files.some((record) => record.path.startsWith('scripts/')), false);

const manifest = JSON.parse(fs.readFileSync(report.manifest, 'utf8'));
assert.equal(manifest.schema_version, 2);
assert.equal(manifest.tarball_sha256, report.tarball_sha256);
assert.equal(manifest.tarball_filename, path.basename(report.tarball));
assert.equal(manifest.reproducible_npm_pack, true);
assert.equal(manifest.source_commit, sourceCommit);
assert.equal(manifest.release_channel, 'private-prerelease');
assert.equal(manifest.public_publication_authorized, false);
assert.equal(manifest.marketplace_publication_authorized, false);

const provenance = JSON.parse(fs.readFileSync(report.provenance, 'utf8'));
assert.equal(provenance.schema_version, 1);
assert.equal(provenance.status, 'PASS');
assert.equal(provenance.subject.filename, path.basename(report.tarball));
assert.equal(provenance.subject.sha256, report.tarball_sha256);
assert.equal(provenance.source.commit, sourceCommit);
assert.equal(provenance.policy.release_channel, 'private-prerelease');
assert.equal(provenance.policy.public_publication_authorized, false);
assert.equal(provenance.policy.marketplace_publication_authorized, false);
assert.equal(provenance.build.tested_opencode_range, '>=1.18.3 <2');

const checksumLines = fs.readFileSync(report.checksums, 'utf8').trim().split('\n');
assert.equal(checksumLines.length, 3);
for (const name of [path.basename(report.tarball), TARBALL_MANIFEST_FILE, PROVENANCE_FILE]) {
  assert.equal(checksumLines.some((line) => line.endsWith(`  ${name}`)), true, `missing checksum for ${name}`);
}
assert.equal(path.basename(report.checksums), CHECKSUMS_FILE);

const verified = verifyPrereleaseEvidence(output);
assert.equal(verified.status, 'PASS');
assert.equal(verified.package_version, '1.0.0-beta.1');
assert.equal(verified.release_channel, 'private-prerelease');
assert.equal(verified.source_commit, sourceCommit);
assert.equal(verified.checksum_entry_count, 3);
assert.throws(
  () => packTarball(path.join(root, 'invalid-source'), { sourceCommit: 'not-a-full-sha' }),
  /source commit must be a full 40-character Git SHA/,
);

const home = path.join(root, 'home');
const cwd = path.join(root, 'consumer-project');
const cache = path.join(root, 'npm-cache');
fs.mkdirSync(home, { recursive: true });
fs.mkdirSync(cwd, { recursive: true });
fs.writeFileSync(path.join(cwd, 'package.json'), '{"private":true}\n');
const environment = { home, cwd, cache };
const configRoot = path.join(home, '.config', 'opencode');

let command = runArtifact(report.tarball, ['install'], environment);
assert.equal(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.status, 'PASS', commandEvidence(command));
assert.equal(command.report.state, 'INSTALLED');
assert.equal(command.report.source_checkout_required, false);
assert.equal(command.report.target_path_argument_required, false);

const ids = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
for (const id of ids) {
  assert.equal(fs.existsSync(path.join(configRoot, 'commands', `${id}.md`)), true, `${id} command missing`);
  assert.equal(fs.existsSync(path.join(configRoot, 'skills', id, 'SKILL.md')), true, `${id} skill missing`);
}
const installedPlugin = path.join(configRoot, 'plugins', 'hakim.mjs');
assert.equal(fs.existsSync(installedPlugin), true);
assert.equal(fs.existsSync(path.join(configRoot, '.hakim-install.json')), true);

const pluginModule = await import(`${pathToFileURL(installedPlugin).href}?tarball=1`);
assert.equal(typeof pluginModule.HakimPlugin, 'function');
const hooks = await pluginModule.HakimPlugin({});
const transformed = { system: ['consumer base instructions'] };
await hooks['experimental.chat.system.transform']({ sessionID: 'tarball-smoke' }, transformed);
assert.equal(transformed.system.length, 1);
assert.match(transformed.system[0], /Hakim/i);

command = runArtifact(report.tarball, ['status'], environment);
assert.equal(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.state, 'INSTALLED_EXACT_MATCH');

command = runArtifact(report.tarball, ['install'], environment);
assert.equal(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.state, 'ALREADY_MATCHES');
assert.equal(command.report.filesystem_changed, false);

// Reproduce issue #126 through the actual packed .tgz. The matching external
// tree must remain byte-identical while status and both removal paths refuse.
const commandsDirectory = path.join(configRoot, 'commands');
const externalCommands = path.join(root, 'external-tarball-commands');
fs.renameSync(commandsDirectory, externalCommands);
fs.symlinkSync(externalCommands, commandsDirectory, 'dir');
const externalBefore = snapshotFiles(externalCommands);

command = runArtifact(report.tarball, ['status'], environment);
assert.notEqual(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.status, 'FAIL');
assert.equal(command.report.state, 'INSTALLED_PATH_UNSAFE');

command = runArtifact(report.tarball, ['remove', '--dry-run'], environment);
assert.notEqual(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.status, 'FAIL');
assert.match(command.report.error, /refusing removal: INSTALLED_PATH_UNSAFE/);

command = runArtifact(report.tarball, ['remove'], environment);
assert.notEqual(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.status, 'FAIL');
assert.match(command.report.error, /INSTALLED_PATH_UNSAFE/);
assert.deepEqual(snapshotFiles(externalCommands), externalBefore);
assert.equal(fs.existsSync(path.join(configRoot, '.hakim-install.json')), true);
assert.equal(fs.existsSync(path.join(configRoot, '.hakim-operation.lock')), false);

fs.unlinkSync(commandsDirectory);
fs.renameSync(externalCommands, commandsDirectory);
command = runArtifact(report.tarball, ['status'], environment);
assert.equal(command.status, 0, commandEvidence(command));
assert.equal(command.report.state, 'INSTALLED_EXACT_MATCH');

const unrelated = path.join(configRoot, 'unrelated.txt');
fs.writeFileSync(unrelated, 'preserve tarball consumer state\n');
command = runArtifact(report.tarball, ['remove', '--dry-run'], environment);
assert.equal(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.state, 'READY_TO_REMOVE');
assert.equal(fs.existsSync(installedPlugin), true);

command = runArtifact(report.tarball, ['remove'], environment);
assert.equal(command.status, 0, commandEvidence(command));
assert.ok(command.report, commandEvidence(command));
assert.equal(command.report.state, 'REMOVED');
assert.equal(fs.existsSync(installedPlugin), false);
assert.equal(fs.existsSync(path.join(configRoot, '.hakim-install.json')), false);
assert.equal(fs.readFileSync(unrelated, 'utf8'), 'preserve tarball consumer state\n');

const pristineProvenance = fs.readFileSync(report.provenance);
fs.appendFileSync(report.provenance, ' ');
assert.throws(() => verifyPrereleaseEvidence(output), /checksum mismatch: provenance-manifest\.json/);
fs.writeFileSync(report.provenance, pristineProvenance);
assert.equal(verifyPrereleaseEvidence(output).status, 'PASS');

console.log('native plugin prerelease tarball is reproducible, metadata-complete, provenance-bound, rejects issue #126 with zero external mutation, remains normally removable, and refuses tampering');

export { parseJsonReport, runArtifact };
