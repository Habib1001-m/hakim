import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  formatText,
  installCopilotInstructions,
  parseArgs,
} from '../scripts/hakim_copilot_install.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(repoRoot, '.github', 'copilot-instructions.md');
const sourceBytes = fs.readFileSync(sourcePath);

assert.deepEqual(parseArgs(['--target', '/tmp/example']), {
  target: '/tmp/example',
  apply: false,
  json: false,
  help: false,
});
assert.deepEqual(parseArgs(['--target=/tmp/example', '--apply', '--json']), {
  target: '/tmp/example',
  apply: true,
  json: true,
  help: false,
});
assert.deepEqual(parseArgs(['--help']), {
  target: null,
  apply: false,
  json: false,
  help: true,
});
assert.throws(() => parseArgs([]), /--target is required/);
assert.throws(() => parseArgs(['--target']), /requires a path/);
assert.throws(() => parseArgs(['--force']), /unknown option/);

const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-install-'));
try {
  const targetRoot = path.join(tempParent, 'target');
  fs.mkdirSync(targetRoot);
  const targetPath = path.join(targetRoot, '.github', 'copilot-instructions.md');

  const dryRun = installCopilotInstructions({ target: targetRoot, apply: false }, repoRoot);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_CREATE');
  assert.equal(dryRun.mode, 'DRY_RUN');
  assert.equal(dryRun.write_attempted, false);
  assert.equal(dryRun.write_performed, false);
  assert.equal(dryRun.filesystem_changed, false);
  assert.equal(dryRun.overwrite_allowed, false);
  assert.equal(fs.existsSync(targetPath), false);
  assert.match(formatText(dryRun), /WRITE_ATTEMPTED=NO/);
  assert.match(formatText(dryRun), /WRITE_PERFORMED=NO/);
  assert.match(formatText(dryRun), /FILESYSTEM_CHANGED=NO/);
  assert.match(formatText(dryRun), /OVERWRITE_ALLOWED=NO/);

  const created = installCopilotInstructions({ target: targetRoot, apply: true }, repoRoot);
  assert.equal(created.status, 'PASS');
  assert.equal(created.state, 'CREATED');
  assert.equal(created.mode, 'APPLY_CREATE_ONLY');
  assert.equal(created.write_attempted, true);
  assert.equal(created.write_performed, true);
  assert.equal(created.filesystem_changed, true);
  assert.deepEqual(fs.readFileSync(targetPath), sourceBytes);
  assert.equal(created.source_sha256, created.target_sha256_after);

  const statBefore = fs.statSync(targetPath);
  const alreadyMatches = installCopilotInstructions({ target: targetRoot, apply: true }, repoRoot);
  const statAfter = fs.statSync(targetPath);
  assert.equal(alreadyMatches.status, 'PASS');
  assert.equal(alreadyMatches.state, 'ALREADY_MATCHES');
  assert.equal(alreadyMatches.write_attempted, false);
  assert.equal(alreadyMatches.write_performed, false);
  assert.equal(alreadyMatches.filesystem_changed, false);
  assert.equal(statAfter.mtimeMs, statBefore.mtimeMs);
  assert.deepEqual(fs.readFileSync(targetPath), sourceBytes);

  const localContent = '# Existing project instructions\n';
  fs.writeFileSync(targetPath, localContent);
  const refused = installCopilotInstructions({ target: targetRoot, apply: true }, repoRoot);
  assert.equal(refused.status, 'FAIL');
  assert.equal(refused.state, 'REFUSED_EXISTING_DIFF');
  assert.equal(refused.write_attempted, false);
  assert.equal(refused.write_performed, false);
  assert.equal(refused.filesystem_changed, false);
  assert.equal(fs.readFileSync(targetPath, 'utf8'), localContent);

  fs.unlinkSync(targetPath);
  const linkedFile = path.join(tempParent, 'linked-instructions.md');
  fs.writeFileSync(linkedFile, sourceBytes);
  fs.symlinkSync(linkedFile, targetPath);
  const symlinkRefusal = installCopilotInstructions({ target: targetRoot, apply: true }, repoRoot);
  assert.equal(symlinkRefusal.status, 'FAIL');
  assert.equal(symlinkRefusal.state, 'REFUSED_TARGET_FILE_SYMLINK');
  assert.equal(symlinkRefusal.write_attempted, false);
  assert.equal(symlinkRefusal.write_performed, false);
  assert.equal(symlinkRefusal.filesystem_changed, false);
  assert.deepEqual(fs.readFileSync(linkedFile), sourceBytes);

  const missingTarget = installCopilotInstructions(
    { target: path.join(tempParent, 'missing'), apply: true },
    repoRoot,
  );
  assert.equal(missingTarget.status, 'FAIL');
  assert.equal(missingTarget.state, 'TARGET_NOT_FOUND');
  assert.equal(missingTarget.write_attempted, false);
  assert.equal(missingTarget.write_performed, false);
  assert.equal(missingTarget.filesystem_changed, false);

  const cliTarget = path.join(tempParent, 'cli-target');
  fs.mkdirSync(cliTarget);
  const cli = spawnSync(
    process.execPath,
    ['scripts/hakim_copilot_install.mjs', '--target', cliTarget, '--json'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(cli.status, 0, cli.stderr);
  const cliResult = JSON.parse(cli.stdout);
  assert.equal(cliResult.state, 'READY_TO_CREATE');
  assert.equal(cliResult.write_attempted, false);
  assert.equal(cliResult.write_performed, false);
  assert.equal(cliResult.filesystem_changed, false);
  assert.equal(fs.existsSync(path.join(cliTarget, '.github', 'copilot-instructions.md')), false);
} finally {
  fs.rmSync(tempParent, { recursive: true, force: true });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['install:copilot'], 'node scripts/hakim_copilot_install.mjs');
assert.equal(packageJson.scripts['install:copilot:json'], 'node scripts/hakim_copilot_install.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_copilot_install\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_copilot_install\.mjs/);

console.log('guarded Copilot installer is dry-run-first, create-only, and telemetry-accurate');
