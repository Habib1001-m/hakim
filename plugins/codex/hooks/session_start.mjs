#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(__dirname, '..');
const manifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const mode = (process.env.HAKIM_DEFAULT_MODE || 'full').toLowerCase();

const validModes = new Set(['lite', 'full', 'ultra', 'off']);
const resolvedMode = validModes.has(mode) ? mode : 'full';

let version = 'unknown';
try {
  version = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version || version;
} catch {
  // Activation guidance must never block Codex startup.
}

if (resolvedMode === 'off') {
  process.stdout.write('Hakim guidance is disabled for this Codex session.\n');
  process.exit(0);
}

const modeGuidance = {
  lite: 'Lite mode: implement the request and mention the smaller alternative.',
  full: 'Full mode: apply the complete Hakim ladder; reuse first and prefer stdlib/native capabilities.',
  ultra: 'Ultra mode: challenge additions aggressively and prefer safe deletion before new code.',
}[resolvedMode];

process.stdout.write([
  `Hakim ${version} is active in ${resolvedMode} mode.`,
  modeGuidance,
  'Use the installed Hakim skills progressively when their descriptions match the task; do not preload the full skill body into every session.',
  'Preserve Codex approval, sandbox, plugin, and hook trust controls.',
  'Use $hakim:hakim-help when explicit Hakim usage guidance is needed.',
].join(' ') + '\n');
