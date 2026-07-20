import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildCodexLaunchPlan,
  formatText,
  launchCodex,
  parseArgs,
  resolveExecutable,
} from '../scripts/hakim_codex_launch.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-cwd-'));
const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-bin-'));
const capturePath = path.join(binDir, 'capture.json');
const fakeBinary = path.join(binDir, 'codex');
fs.writeFileSync(
  fakeBinary,
  "#!/usr/bin/env node\nconst fs=require('node:fs'); fs.writeFileSync(process.env.HAKIM_CAPTURE, JSON.stringify(process.argv.slice(2))); process.exit(Number(process.env.HAKIM_EXIT || 0));\n",
  { mode: 0o755 },
);

try {
  assert.deepEqual(parseArgs([]), {
    apply: false,
    json: false,
    help: false,
    binary: 'codex',
    cwd: null,
    passthrough: [],
  });
  assert.deepEqual(parseArgs(['--apply', '--binary', fakeBinary, '--cwd', cwd, '--', '--model', 'gpt-5.6']), {
    apply: true,
    json: false,
    help: false,
    binary: fakeBinary,
    cwd,
    passthrough: ['--model', 'gpt-5.6'],
  });
  assert.throws(() => parseArgs(['--apply', '--json']), /cannot be combined/);
  assert.throws(() => parseArgs(['--', '--cd', '/tmp/other']), /controlled by Hakim/);
  assert.throws(() => parseArgs(['--', '-C', '/tmp/other']), /controlled by Hakim/);
  assert.throws(() => parseArgs(['--', '--cd=/tmp/other']), /controlled by Hakim/);
  assert.throws(() => parseArgs(['--', '--yolo']), /bypass flags are refused/);
  assert.throws(() => parseArgs(['--', '--dangerously-bypass-approvals-and-sandbox']), /bypass flags are refused/);
  assert.throws(() => parseArgs(['--binary']), /requires a value/);
  assert.throws(() => parseArgs(['--unknown']), /unknown option/);

  const env = {
    ...process.env,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    HAKIM_CAPTURE: capturePath,
  };
  assert.equal(resolveExecutable('codex', env), fakeBinary);
  assert.equal(resolveExecutable(fakeBinary, env), fakeBinary);
  assert.equal(resolveExecutable('missing-hakim-binary', env), null);

  const dryRun = launchCodex(
    { apply: false, json: false, help: false, binary: 'codex', cwd, passthrough: ['--model', 'gpt-5.6'] },
    repoRoot,
    { env },
  );
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_LAUNCH');
  assert.equal(dryRun.execution_attempted, false);
  assert.equal(dryRun.child_process_started, false);
  assert.equal(dryRun.launcher_write_attempted, false);
  assert.equal(dryRun.launcher_filesystem_changed, false);
  assert.equal(dryRun.host_ui_managed, true);
  assert.equal(dryRun.plugin_installation_claimed, false);
  assert.equal(dryRun.plugin_activation_claimed, false);
  assert.equal(dryRun.marketplace_name, 'hakim-local');
  assert.equal(dryRun.marketplace_source_path, './plugins/codex');
  assert.deepEqual(dryRun.argv, ['--model', 'gpt-5.6']);
  assert.equal(fs.existsSync(capturePath), false);
  assert.match(formatText(dryRun), /MODE=DRY_RUN/);
  assert.match(formatText(dryRun), /HOST_UI_MANAGED=YES/);
  assert.match(formatText(dryRun), /PLUGIN_INSTALLATION_CLAIMED=NO/);

  const applied = launchCodex(
    { apply: true, json: false, help: false, binary: fakeBinary, cwd, passthrough: ['--model', 'gpt-5.6'] },
    repoRoot,
    { env },
  );
  assert.equal(applied.status, 'PASS');
  assert.equal(applied.state, 'CHILD_EXIT_ZERO');
  assert.equal(applied.execution_attempted, true);
  assert.equal(applied.child_process_started, true);
  assert.equal(applied.exit_code, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(capturePath, 'utf8')), ['--model', 'gpt-5.6']);

  const nonzero = launchCodex(
    { apply: true, json: false, help: false, binary: fakeBinary, cwd, passthrough: [] },
    repoRoot,
    { env: { ...env, HAKIM_EXIT: '7' } },
  );
  assert.equal(nonzero.status, 'FAIL');
  assert.equal(nonzero.state, 'CHILD_EXIT_NONZERO');
  assert.equal(nonzero.exit_code, 7);

  const missingBinary = buildCodexLaunchPlan(
    { apply: false, binary: 'missing-hakim-binary', cwd, passthrough: [] },
    repoRoot,
    env,
  );
  assert.equal(missingBinary.status, 'FAIL');
  assert.equal(missingBinary.state, 'BINARY_NOT_FOUND');

  const badRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-bad-root-'));
  try {
    fs.mkdirSync(path.join(badRoot, 'plugins', 'codex', '.codex-plugin'), { recursive: true });
    fs.mkdirSync(path.join(badRoot, 'plugins', 'codex', 'skills'), { recursive: true });
    fs.mkdirSync(path.join(badRoot, 'plugins', 'codex', 'hooks'), { recursive: true });
    fs.mkdirSync(path.join(badRoot, '.agents', 'plugins'), { recursive: true });
    fs.mkdirSync(path.join(badRoot, 'core', 'hakim-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(badRoot, 'plugins', 'codex', '.codex-plugin', 'plugin.json'),
      JSON.stringify({ name: 'hakim', version: '1.0.0' }),
    );
    fs.writeFileSync(path.join(badRoot, 'plugins', 'codex', 'hooks', 'hooks.json'), '{}');
    fs.writeFileSync(
      path.join(badRoot, '.agents', 'plugins', 'marketplace.json'),
      JSON.stringify({
        name: 'hakim-local',
        plugins: [{
          name: 'hakim',
          source: { source: 'local', path: './plugins/wrong' },
          policy: { installation: 'AVAILABLE' },
        }],
      }),
    );
    fs.writeFileSync(path.join(badRoot, 'core', 'hakim-skill', 'VERSION'), '1.0.0\n');
    const refused = buildCodexLaunchPlan(
      { apply: false, binary: fakeBinary, cwd, passthrough: [] },
      badRoot,
      env,
    );
    assert.equal(refused.status, 'FAIL');
    assert.equal(refused.state, 'MARKETPLACE_SOURCE_MISMATCH');
  } finally {
    fs.rmSync(badRoot, { recursive: true, force: true });
  }

  const cli = spawnSync(
    process.execPath,
    [
      'scripts/hakim_codex_launch.mjs',
      '--binary',
      fakeBinary,
      '--cwd',
      cwd,
      '--json',
      '--',
      '--model',
      'gpt-5.6',
    ],
    { cwd: repoRoot, env, encoding: 'utf8' },
  );
  assert.equal(cli.status, 0, cli.stderr);
  const cliResult = JSON.parse(cli.stdout);
  assert.equal(cliResult.state, 'READY_TO_LAUNCH');
  assert.equal(cliResult.execution_attempted, false);
  assert.deepEqual(cliResult.argv.slice(-2), ['--model', 'gpt-5.6']);
} finally {
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(binDir, { recursive: true, force: true });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['launch:codex'], 'node scripts/hakim_codex_launch.mjs');
assert.equal(packageJson.scripts['launch:codex:json'], 'node scripts/hakim_codex_launch.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_codex_launch\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_codex_launch\.mjs/);

console.log('guarded Codex launcher validates marketplace contracts before shell-free execution');
