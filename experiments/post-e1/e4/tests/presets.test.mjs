import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activatePreset,
  createPresetState,
  getActivePreset,
  listPresets,
  savePreset,
} from '../src/presets.mjs';

test('default preset is active in a fresh state', () => {
  const state = createPresetState();
  assert.equal(state.active, 'default');
  assert.deepEqual(listPresets(state), ['default']);
  assert.deepEqual(getActivePreset(state), { theme: 'system', density: 'comfortable' });
});

test('saved preset can become active without mutating the previous state', () => {
  const base = createPresetState();
  const saved = savePreset(base, 'focus', { theme: 'dark', density: 'compact' });
  const active = activatePreset(saved, 'focus');

  assert.deepEqual(listPresets(base), ['default']);
  assert.equal(active.active, 'focus');
  assert.deepEqual(getActivePreset(active), { theme: 'dark', density: 'compact' });
});

test('activating an unknown preset fails explicitly', () => {
  assert.throws(() => activatePreset(createPresetState(), 'missing'), /unknown preset: missing/);
});
