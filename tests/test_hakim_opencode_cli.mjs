#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseCliArgs, runAction } from '../scripts/hakim_opencode_cli.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const parsed = parseCliArgs(['install'], '/tmp/example-target');
assert.equal(parsed.action, 'install');
assert.equal(parsed.target, '/tmp/example-target');
assert.equal(parsed.dryRun, false);
assert.throws(() => parseCliArgs([]), /action is required/);
assert.throws(() => parseCliArgs(['install', '--unknown']), /unknown argument/);

const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-opencode-cli-'));
try {
  const before = runAction({ action: 'status', target, dryRun: false, json: true }, ROOT);
  assert.equal(before.status, 'PASS');
  assert.equal(before.state, 'ABSENT');
  assert.equal(before.filesystem_changed, false);

  const dryRun = runAction({ action: 'install', target, dryRun: true, json: true }, ROOT);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_CREATE');
  assert.equal(dryRun.filesystem_changed, false);

  const installed = runAction({ action: 'install', target, dryRun: false, json: true }, ROOT);
  assert.equal(installed.status, 'PASS');
  assert.equal(installed.state, 'CREATED');
  assert.equal(installed.filesystem_changed, true);

  const afterInstall = runAction({ action: 'status', target, dryRun: false, json: true }, ROOT);
  assert.equal(afterInstall.status, 'PASS');
  assert.equal(afterInstall.state, 'EXACT_MATCH');

  const repeat = runAction({ action: 'install', target, dryRun: false, json: true }, ROOT);
  assert.equal(repeat.status, 'PASS');
  assert.equal(repeat.state, 'ALREADY_MATCHES');
  assert.equal(repeat.filesystem_changed, false);

  const removed = runAction({ action: 'remove', target, dryRun: false, json: true }, ROOT);
  assert.equal(removed.status, 'PASS');
  assert.equal(removed.state, 'REMOVED');
  assert.equal(removed.filesystem_changed, true);

  const afterRemove = runAction({ action: 'status', target, dryRun: false, json: true }, ROOT);
  assert.equal(afterRemove.status, 'PASS');
  assert.equal(afterRemove.state, 'ABSENT');
} finally {
  fs.rmSync(target, { recursive: true, force: true });
}

const help = spawnSync(process.execPath, ['scripts/hakim_opencode_cli.mjs', '--help'], {
  cwd: ROOT,
  encoding: 'utf8',
});
assert.equal(help.status, 0, help.stderr);
assert.match(help.stdout, /hakim-opencode install/);
assert.match(help.stdout, /current directory/);
assert.match(help.stdout, /create-only mutation/);
assert.match(help.stdout, /No command edits opencode\.json/);

const packed = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: ROOT,
  encoding: 'utf8',
  env: {
    ...process.env,
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  },
});
assert.equal(packed.status, 0, packed.stderr || packed.stdout);
const packReport = JSON.parse(packed.stdout);
assert.ok(Array.isArray(packReport) && packReport.length === 1);
const packedPaths = new Set(packReport[0].files.map((entry) => entry.path));
for (const required of [
  'package.json',
  'scripts/hakim_opencode_cli.mjs',
  'scripts/hakim_opencode_install.mjs',
  'scripts/hakim_opencode_remove.mjs',
  'scripts/lib/opencode_bundle.mjs',
  'plugins/opencode/hakim.mjs',
  'core/loaders/hakim-loader.mjs',
  'core/hakim-skill/SKILL.md',
  'core/hakim-skill/capabilities.json',
  'core/hakim-skill/skills/hakim-help/SKILL.md',
]) {
  assert.ok(packedPaths.has(required), `Git-backed bootstrap package missing ${required}`);
}
for (const forbiddenPrefix of ['tests/', 'docs/', '.github/', 'plugins/codex/', 'plugins/claude-code/', 'plugins/copilot/']) {
  assert.ok(![...packedPaths].some((entry) => entry.startsWith(forbiddenPrefix)), `bootstrap package contains unrelated ${forbiddenPrefix} content`);
}

console.log(`test_hakim_opencode_cli.mjs: one-command project-local lifecycle ok; npm pack files=${packedPaths.size}`);
