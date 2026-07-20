import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildClaudeLaunchPlan,
  formatText,
  launchClaude,
  parseArgs,
  resolveExecutable,
} from '../scripts/hakim_claude_launch.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-claude-cwd-'));
const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-claude-bin-'));
const capturePath = path.join(binDir, 'capture.json');
const fakeBinary = path.join(binDir, 'claude');
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
    binary: 'claude',
    cwd: null,
    passthrough: [],
  });
  assert.deepEqual(parseArgs(['--apply', '--binary', fakeBinary, '--cwd', cwd, '--', '--model', 'opus']), {
    apply: true,
    json: false,
    help: false,
    binary: fakeBinary,
    cwd,
    passthrough: ['--model', 'opus'],
  });
  assert.throws(() => parseArgs(['--apply', '--json']), /cannot be combined/);
  assert.throws(() => parseArgs(['--', '--plugin-dir', '/tmp/other']), /controlled by Hakim/);
  assert.throws(() => parseArgs(['--', '--plugin-dir=/tmp/other']), /controlled by Hakim/);
  assert.throws(() => parseArgs(['--binary']), /requires a value/);
  assert.throws(() => parseArgs(['--unknown']), /unknown option/);

  const env = {
    ...process.env,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    HAKIM_CAPTURE: capturePath,
  };
  assert.equal(resolveExecutable('claude', env), fakeBinary);
  assert.equal(resolveExecutable(fakeBinary, env), fakeBinary);
  assert.equal(resolveExecutable('missing-hakim-binary', env), null);

  const dryRun = launchClaude(
    { apply: false, json: false, help: false, binary: 'claude', cwd, passthrough: ['--model', 'opus'] },
    repoRoot,
    { env },
  );
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_LAUNCH');
  assert.equal(dryRun.execution_attempted, false);
  assert.equal(dryRun.child_process_started, false);
  assert.equal(dryRun.launcher_write_attempted, false);
  assert.equal(dryRun.launcher_filesystem_changed, false);
  assert.deepEqual(dryRun.argv, [
    '--plugin-dir',
    path.join(repoRoot, 'plugins', 'claude-code'),
    '--model',
    'opus',
  ]);
  assert.equal(fs.existsSync(capturePath), false);
  assert.match(formatText(dryRun), /MODE=DRY_RUN/);
  assert.match(formatText(dryRun), /EXECUTION_ATTEMPTED=NO/);
  assert.match(formatText(dryRun), /PERSISTENT_INSTALLATION_CLAIMED=NO/);

  const applied = launchClaude(
    { apply: true, json: false, help: false, binary: fakeBinary, cwd, passthrough: ['--model', 'opus'] },
    repoRoot,
    { env },
  );
  assert.equal(applied.status, 'PASS');
  assert.equal(applied.state, 'CHILD_EXIT_ZERO');
  assert.equal(applied.execution_attempted, true);
  assert.equal(applied.child_process_started, true);
  assert.equal(applied.exit_code, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(capturePath, 'utf8')), [
    '--plugin-dir',
    path.join(repoRoot, 'plugins', 'claude-code'),
    '--model',
    'opus',
  ]);

  const nonzero = launchClaude(
    { apply: true, json: false, help: false, binary: fakeBinary, cwd, passthrough: [] },
    repoRoot,
    { env: { ...env, HAKIM_EXIT: '7' } },
  );
  assert.equal(nonzero.status, 'FAIL');
  assert.equal(nonzero.state, 'CHILD_EXIT_NONZERO');
  assert.equal(nonzero.exit_code, 7);

  const missingBinary = buildClaudeLaunchPlan(
    { apply: false, binary: 'missing-hakim-binary', cwd, passthrough: [] },
    repoRoot,
    env,
  );
  assert.equal(missingBinary.status, 'FAIL');
  assert.equal(missingBinary.state, 'BINARY_NOT_FOUND');

  const badRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-claude-bad-root-'));
  try {
    fs.mkdirSync(path.join(badRoot, 'plugins'), { recursive: true });
    fs.symlinkSync(
      path.join(repoRoot, 'plugins', 'claude-code'),
      path.join(badRoot, 'plugins', 'claude-code'),
    );
    fs.mkdirSync(path.join(badRoot, 'core', 'hakim-skill'), { recursive: true });
    fs.writeFileSync(path.join(badRoot, 'core', 'hakim-skill', 'VERSION'), '1.0.0\n');
    const refused = buildClaudeLaunchPlan(
      { apply: false, binary: fakeBinary, cwd, passthrough: [] },
      badRoot,
      env,
    );
    assert.equal(refused.status, 'FAIL');
    assert.equal(refused.state, 'PLUGIN_SYMLINK');
  } finally {
    fs.rmSync(badRoot, { recursive: true, force: true });
  }

  const cli = spawnSync(
    process.execPath,
    [
      'scripts/hakim_claude_launch.mjs',
      '--binary',
      fakeBinary,
      '--cwd',
      cwd,
      '--json',
      '--',
      '--model',
      'sonnet',
    ],
    { cwd: repoRoot, env, encoding: 'utf8' },
  );
  assert.equal(cli.status, 0, cli.stderr);
  const cliResult = JSON.parse(cli.stdout);
  assert.equal(cliResult.state, 'READY_TO_LAUNCH');
  assert.equal(cliResult.execution_attempted, false);
  assert.deepEqual(cliResult.argv.slice(-2), ['--model', 'sonnet']);
} finally {
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(binDir, { recursive: true, force: true });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['launch:claude'], 'node scripts/hakim_claude_launch.mjs');
assert.equal(packageJson.scripts['launch:claude:json'], 'node scripts/hakim_claude_launch.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_claude_launch\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_claude_launch\.mjs/);

console.log('guarded Claude launcher validates plugin and binary before shell-free execution');
