import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const candidateRoot = process.env.E3_CANDIDATE_ROOT;
assert.ok(candidateRoot, 'E3_CANDIDATE_ROOT is required');

const sourcePath = path.join(candidateRoot, 'src/session-summary.mjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const { summarizeSession } = await import(pathToFileURL(sourcePath));

const cases = [
  [{ id: 'a', durationMs: 0, status: 'done' }, 'a · 0m 00s · done'],
  [{ id: 'b', durationMs: 59_999, status: 'running' }, 'b · 0m 59s · running'],
  [{ id: 'c', durationMs: 60_000, status: 'done' }, 'c · 1m 00s · done'],
  [{ id: 'd', durationMs: 3_661_999, status: 'done' }, 'd · 61m 01s · done'],
];

test('session summary output remains unchanged across duration boundaries', () => {
  for (const [input, expected] of cases) {
    assert.equal(summarizeSession(input), expected);
  }
});

test('duration validation behavior remains unchanged', () => {
  for (const durationMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => summarizeSession({ id: 'bad', durationMs, status: 'done' }),
      /durationMs must be a non-negative finite number/,
    );
  }
});

test('target reuses the existing maintained duration formatter', () => {
  assert.match(source, /\.\/lib\/format-duration\.mjs/);
  assert.match(source, /formatDuration\s*\(/);
});

test('target no longer carries its own duration-formatting algorithm', () => {
  assert.doesNotMatch(source, /Math\.floor\s*\(\s*session\.durationMs\s*\/\s*1000/);
  assert.doesNotMatch(source, /String\(seconds\)\.padStart/);
});

test('fixture remains dependency-free', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});
