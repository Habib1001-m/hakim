#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_MODE = 'full';
export const MODE_SCHEMA_VERSION = 1;
export const VALID_MODES = Object.freeze(['lite', 'full', 'ultra', 'off']);
const VALID_MODE_SET = new Set(VALID_MODES);
const STATE_FILE = 'mode.json';

const MODE_DIRECTIVES = Object.freeze({
  lite: 'Build what is asked, then name the lazier alternative in one line.',
  full: 'Enforce the Hakim ladder. Prefer reuse, stdlib, native platform features, and shortest safe diffs.',
  ultra: 'YAGNI extremist mode: delete before adding, challenge abstractions, and ship the minimum safe change.',
  off: 'Hakim guidance disabled for this session.',
});

function statePath(pluginDataDir) {
  if (!pluginDataDir || !String(pluginDataDir).trim()) return null;
  const raw = String(pluginDataDir).trim();
  // The host-owned plugin-data location must be fully expanded before Hakim
  // writes. A relative path or unresolved placeholder must fail soft rather
  // than becoming repository-local state.
  if (!path.isAbsolute(raw) || raw.includes('${')) return null;
  return path.join(raw, STATE_FILE);
}

function exactState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = Object.keys(value).sort();
  if (JSON.stringify(keys) !== JSON.stringify(['mode', 'schema_version'])) return null;
  if (value.schema_version !== MODE_SCHEMA_VERSION) return null;
  if (!VALID_MODE_SET.has(value.mode)) return null;
  return { schema_version: MODE_SCHEMA_VERSION, mode: value.mode };
}

export function getModeDirective(mode = DEFAULT_MODE) {
  const normalized = VALID_MODE_SET.has(mode) ? mode : DEFAULT_MODE;
  return MODE_DIRECTIVES[normalized];
}

export function readModeState(pluginDataDir) {
  const file = statePath(pluginDataDir);
  if (!file || !fs.existsSync(file)) {
    return { mode: DEFAULT_MODE, source: 'DEFAULT' };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const state = exactState(parsed);
    if (!state) return { mode: DEFAULT_MODE, source: 'INVALID_STATE' };
    return { mode: state.mode, source: 'PLUGIN_DATA' };
  } catch {
    return { mode: DEFAULT_MODE, source: 'INVALID_STATE' };
  }
}

export function writeModeState(pluginDataDir, mode) {
  if (!VALID_MODE_SET.has(mode)) throw new Error(`unsupported Hakim mode: ${mode}`);

  const file = statePath(pluginDataDir);
  if (!file) throw new Error('expanded Copilot plugin-data path is unavailable');

  if (mode === DEFAULT_MODE) {
    try { fs.unlinkSync(file); }
    catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    return { mode: DEFAULT_MODE, persisted: false };
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  const payload = `${JSON.stringify({ schema_version: MODE_SCHEMA_VERSION, mode })}\n`;

  try {
    fs.writeFileSync(temp, payload, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, file);
  } finally {
    try { fs.unlinkSync(temp); }
    catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  return { mode, persisted: true };
}

export function getModeStatePath(pluginDataDir) {
  return statePath(pluginDataDir);
}
