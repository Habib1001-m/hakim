import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  formatText,
  parseArgs,
  removeCopilotInstructions,
} from '../scripts/hakim_copilot_remove.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = path.join(repoRoot, '.github', 'copilot-instructions.md');
const canonicalBytes = fs.readFileSync(canonicalPath);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-copilot-remove-'));

function createTarget(name, content = null) {
  const target = path.join(tempRoot, name);
  fs.mkdirSync(target, { recursive: true });
  if (content !== null) {
    fs.mkdirSync(path.join(target, '.github'), { recursive: true });
    fs.writeFileSync(path.join(target, '.github', 'copilot-instructions.md'), content);
  }
  return target;
}

function options(target, apply = false) {
  return { target, apply, json: false, help: false };
}

try {
  assert.deepEqual(parseArgs(['--target', '/tmp/example']), {
    target: '/tmp/example',
    apply: false,
    json: false,
    help: false,
  });
  assert.throws(() => parseArgs([]), /--target is required/);

  const absent = createTarget('absent');
  const absentResult = removeCopilotInstructions(options(absent), repoRoot);
  assert.equal(absentResult.status, 'PASS');
  assert.equal(absentResult.state, 'ALREADY_ABSENT');
  assert.equal(absentResult.mutation_attempted, false);

  const exact = createTarget('exact', canonicalBytes);
  const exactPath = path.join(exact, '.github', 'copilot-instructions.md');
  const dryRun = removeCopilotInstructions(options(exact), repoRoot);
  assert.equal(dryRun.status, 'PASS');
  assert.equal(dryRun.state, 'READY_TO_REMOVE');
  assert.equal(dryRun.removal_performed, false);
  assert.equal(fs.readFileSync(exactPath, 'utf8'), canonicalBytes.toString('utf8'));
  assert.match(formatText(dryRun), /MODIFIED_TARGET_REMOVAL_ALLOWED=NO/);

  const modified = createTarget('modified', '# local instructions\n');
  const modifiedResult = removeCopilotInstructions(options(modified, true), repoRoot);
  assert.equal(modifiedResult.status, 'FAIL');
  assert.equal(modifiedResult.state, 'REFUSED_MODIFIED_TARGET');
  assert.equal(modifiedResult.mutation_attempted, false);

  const brokenSymlinkTarget = createTarget('broken-symlink');
  const brokenSymlinkPath = path.join(brokenSymlinkTarget, '.github', 'copilot-instructions.md');
  fs.mkdirSync(path.dirname(brokenSymlinkPath), { recursive: true });
  fs.symlinkSync(path.join(tempRoot, 'missing-instructions.md'), brokenSymlinkPath);
  const brokenSymlinkResult = removeCopilotInstructions(options(brokenSymlinkTarget, true), repoRoot);
  assert.equal(brokenSymlinkResult.status, 'FAIL');
  assert.equal(brokenSymlinkResult.state, 'REFUSED_TARGET_FILE_SYMLINK');
  assert.equal(fs.lstatSync(brokenSymlinkPath).isSymbolicLink(), true);

  const removable = createTarget('removable', canonicalBytes);
  const removableDirectory = path.join(removable, '.github');
  const removed = removeCopilotInstructions(options(removable, true), repoRoot, {
    randomBytes: () => Buffer.from('0000000000000001', 'hex'),
  });
  assert.equal(removed.status, 'PASS');
  assert.equal(removed.state, 'REMOVED');
  assert.equal(removed.removal_performed, true);
  assert.equal(fs.existsSync(path.join(removableDirectory, 'copilot-instructions.md')), false);
  assert.equal(fs.existsSync(removableDirectory), true);
  assert.deepEqual(fs.readdirSync(removableDirectory), []);

  const deleteFailure = createTarget('delete-failure', canonicalBytes);
  const deleteFailurePath = path.join(deleteFailure, '.github', 'copilot-instructions.md');
  const deleteFailureResult = removeCopilotInstructions(options(deleteFailure, true), repoRoot, {
    randomBytes: () => Buffer.from('0000000000000002', 'hex'),
    unlinkSync: () => {
      throw new Error('simulated delete failure');
    },
  });
  assert.equal(deleteFailureResult.status, 'FAIL');
  assert.equal(deleteFailureResult.state, 'REMOVE_FAILED_RESTORED');
  assert.equal(deleteFailureResult.restoration_performed, true);
  assert.equal(deleteFailureResult.filesystem_changed, false);
  assert.equal(fs.readFileSync(deleteFailurePath, 'utf8'), canonicalBytes.toString('utf8'));

  const recreated = createTarget('recreated', canonicalBytes);
  const recreatedPath = path.join(recreated, '.github', 'copilot-instructions.md');
  const recreatedResult = removeCopilotInstructions(options(recreated, true), repoRoot, {
    randomBytes: () => Buffer.from('0000000000000003', 'hex'),
    unlinkSync: (quarantinePath) => {
      fs.unlinkSync(quarantinePath);
      fs.writeFileSync(recreatedPath, '# replacement created concurrently\n');
    },
  });
  assert.equal(recreatedResult.status, 'FAIL');
  assert.equal(recreatedResult.state, 'TARGET_RECREATED_CONCURRENTLY');
  assert.equal(recreatedResult.removal_performed, true);
  assert.equal(fs.readFileSync(recreatedPath, 'utf8'), '# replacement created concurrently\n');

  const cliTarget = createTarget('cli', canonicalBytes);
  const cli = spawnSync(
    process.execPath,
    ['scripts/hakim_copilot_remove.mjs', '--target', cliTarget, '--json'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(cli.status, 0, cli.stderr);
  const cliResult = JSON.parse(cli.stdout);
  assert.equal(cliResult.state, 'READY_TO_REMOVE');
  assert.equal(cliResult.mutation_attempted, false);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['remove:copilot'], 'node scripts/hakim_copilot_remove.mjs');
assert.equal(packageJson.scripts['remove:copilot:json'], 'node scripts/hakim_copilot_remove.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_copilot_remove\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_copilot_remove\.mjs/);

console.log('guarded Copilot removal deletes only an exact canonical match with rollback-safe quarantine');
