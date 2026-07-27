#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const requested = process.argv[2] ?? path.join(os.tmpdir(), 'hakim-post-e1-e2');
const OUT = path.resolve(requested);

if (OUT === path.parse(OUT).root || OUT === os.homedir()) {
  throw new Error(`refusing unsafe experiment output path: ${OUT}`);
}

const candidateFiles = [
  'package.json',
  'src/rule-token.mjs',
  'tests/rule-token.test.mjs',
];

const sha256File = (filePath) => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    ...options,
  });
}

function mustRun(command, args, options = {}) {
  const result = run(command, args, { ...options, capture: true });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}

function copyCandidate(target) {
  for (const relative of candidateFiles) {
    const source = path.join(HERE, relative);
    const destination = path.join(target, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

function initializeSeed(target) {
  mustRun('git', ['init', '-b', 'main'], { cwd: target });
  mustRun('git', ['add', '.'], { cwd: target });
  mustRun('git', [
    '-c', 'user.name=Hakim E2 Fixture',
    '-c', 'user.email=fixture@hakim.invalid',
    'commit', '-m', 'E2 baseline: rule-token reader',
  ], { cwd: target });
  return mustRun('git', ['rev-parse', 'HEAD'], { cwd: target }).stdout.trim();
}

function verifyVisibleBaseline(target) {
  const result = mustRun(process.execPath, ['--test', 'tests/rule-token.test.mjs'], { cwd: target });
  return result.stdout;
}

function runHidden(target, pattern) {
  return run(process.execPath, [
    '--test',
    `--test-name-pattern=${pattern}`,
    path.join(HERE, 'evaluator/hidden.test.mjs'),
  ], {
    cwd: target,
    capture: true,
    env: { ...process.env, E2_CANDIDATE_ROOT: target },
  });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const seed = path.join(OUT, '_baseline-source');
const control = path.join(OUT, 'control');
const treatment = path.join(OUT, 'treatment');
const protocol = path.join(OUT, 'protocol');
fs.mkdirSync(seed, { recursive: true });
fs.mkdirSync(protocol, { recursive: true });

copyCandidate(seed);
fs.copyFileSync(path.join(HERE, 'TASK_PROMPT.txt'), path.join(protocol, 'TASK_PROMPT.txt'));
fs.copyFileSync(path.join(HERE, 'evaluator/hidden.test.mjs'), path.join(protocol, 'hidden.test.mjs'));

const baselineSha = initializeSeed(seed);
mustRun('git', ['clone', '--quiet', '--no-hardlinks', seed, control]);
mustRun('git', ['clone', '--quiet', '--no-hardlinks', seed, treatment]);
fs.rmSync(seed, { recursive: true, force: true });

const controlHead = mustRun('git', ['rev-parse', 'HEAD'], { cwd: control }).stdout.trim();
const treatmentHead = mustRun('git', ['rev-parse', 'HEAD'], { cwd: treatment }).stdout.trim();
assert.equal(controlHead, baselineSha, 'control must start at the single frozen E2 baseline commit');
assert.equal(treatmentHead, baselineSha, 'treatment must start at the single frozen E2 baseline commit');

verifyVisibleBaseline(control);
verifyVisibleBaseline(treatment);

const hiddenGuards = runHidden(control, 'encoder stays|canonical-prefix domain guard|canonical malformed payload|nearby unsupported prefix');
assert.equal(hiddenGuards.status, 0, `untouched E2 baseline must preserve seeded hidden guards:\n${hiddenGuards.stdout}\n${hiddenGuards.stderr}`);

const hiddenBug = runHidden(control, 'scanner-normalized uppercase prefix');
assert.notEqual(hiddenBug.status, 0, 'untouched E2 baseline must still fail the seeded scanner-prefix bug');

const manifest = {
  schema_version: 1,
  experiment: 'POST-E1-E2',
  control_root: control,
  treatment_root: treatment,
  baseline_sha: baselineSha,
  task_sha256: sha256File(path.join(protocol, 'TASK_PROMPT.txt')),
  evaluator_sha256: sha256File(path.join(protocol, 'hidden.test.mjs')),
  candidate_files: Object.fromEntries(candidateFiles.map((relative) => [
    relative,
    sha256File(path.join(control, relative)),
  ])),
  visible_baseline: 'PASS',
  hidden_guard_baseline: 'PASS',
  seeded_hidden_bug: 'PRESENT',
};

fs.writeFileSync(path.join(OUT, 'EXPERIMENT_INPUTS.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify(manifest, null, 2));
console.log('E2_PREPARE=PASS');
