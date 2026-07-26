import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const candidateRoot = process.env.E4_CANDIDATE_ROOT;
assert.ok(candidateRoot, 'E4_CANDIDATE_ROOT is required');

const modulePath = path.join(candidateRoot, 'src/presets.mjs');
const api = await import(pathToFileURL(modulePath));
const {
  activatePreset,
  createPresetState,
  getActivePreset,
  listPresets,
  removePreset,
  savePreset,
} = api;

test('removePreset is exported as the requested public operation', () => {
  assert.equal(typeof removePreset, 'function');
});

test('removing an inactive preset preserves active state and input immutability', () => {
  const base = savePreset(createPresetState(), 'focus', { theme: 'dark' });
  const before = structuredClone(base);
  const result = removePreset(base, 'focus');

  assert.deepEqual(base, before);
  assert.deepEqual(listPresets(result), ['default']);
  assert.equal(result.active, 'default');
});

test('removing the active preset falls back coherently to default', () => {
  const saved = savePreset(createPresetState(), 'focus', { theme: 'dark' });
  const active = activatePreset(saved, 'focus');
  const result = removePreset(active, 'focus');

  assert.equal(result.active, 'default');
  assert.deepEqual(listPresets(result), ['default']);
  assert.deepEqual(getActivePreset(result), { theme: 'system', density: 'comfortable' });
});

test('permanent default preset cannot be removed', () => {
  assert.throws(() => removePreset(createPresetState(), 'default'), /default/i);
});

test('unknown preset removal follows the existing explicit error convention', () => {
  assert.throws(() => removePreset(createPresetState(), 'missing'), /unknown preset: missing/);
});

test('existing public behavior remains intact', () => {
  const base = createPresetState();
  const saved = savePreset(base, 'focus', { theme: 'dark', density: 'compact' });
  const active = activatePreset(saved, 'focus');
  assert.deepEqual(getActivePreset(active), { theme: 'dark', density: 'compact' });
});

test('README documents the new public operation', () => {
  const readme = fs.readFileSync(path.join(candidateRoot, 'README.md'), 'utf8');
  assert.match(readme, /removePreset\s*\(/);
});

test('fixture remains dependency-free', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});
