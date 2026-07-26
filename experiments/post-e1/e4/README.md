# Preset Store

A tiny immutable preset-state helper used by the POST-E1 feature experiment.

## Existing public API

- `createPresetState()` creates the state with a permanent `default` preset.
- `savePreset(state, name, settings)` returns a new state containing the saved preset.
- `activatePreset(state, name)` makes an existing preset active.
- `getActivePreset(state)` returns a copy of the active settings.
- `listPresets(state)` lists saved preset names.

## State invariants

- The `default` preset always exists.
- `state.active` always names a preset that exists in `state.presets`.
- Operations that require an existing preset fail explicitly for an unknown name.
- Public state helpers return new state/setting objects instead of mutating caller-owned input.

Keep new public behavior consistent with these invariants.
