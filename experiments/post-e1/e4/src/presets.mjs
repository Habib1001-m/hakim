const DEFAULT_PRESET = 'default';

function hasPreset(state, name) {
  return Object.prototype.hasOwnProperty.call(state.presets, name);
}

function requirePreset(state, name) {
  if (!hasPreset(state, name)) {
    throw new RangeError(`unknown preset: ${name}`);
  }
}

export function createPresetState() {
  return {
    active: DEFAULT_PRESET,
    presets: {
      [DEFAULT_PRESET]: { theme: 'system', density: 'comfortable' },
    },
  };
}

export function savePreset(state, name, settings) {
  const trimmed = String(name).trim();
  if (!trimmed) throw new TypeError('preset name is required');

  return {
    ...state,
    presets: {
      ...state.presets,
      [trimmed]: { ...settings },
    },
  };
}

export function activatePreset(state, name) {
  requirePreset(state, name);
  return { ...state, active: name };
}

export function getActivePreset(state) {
  requirePreset(state, state.active);
  return { ...state.presets[state.active] };
}

export function listPresets(state) {
  return Object.keys(state.presets);
}
