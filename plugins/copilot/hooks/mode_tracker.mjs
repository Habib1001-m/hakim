#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeModeState } from './mode_state.mjs';

// Copilot 1.0.75 live evidence established persistence for the plugin-qualified
// skill invocation. Keep the parser bounded; ordinary prose is never state.
const MODE_COMMAND = /^\/(?:hakim\/)?hakim(?:\s+(lite|full|ultra|off))?\s*$/i;

export function parseModeCommand(prompt) {
  const match = String(prompt ?? '').trim().match(MODE_COMMAND);
  if (!match) return null;
  return (match[1] || 'full').toLowerCase();
}

export function applyModeCommand(input, options = {}) {
  const mode = parseModeCommand(input?.prompt);
  if (!mode) return { handled: false };

  const pluginDataDir = options.pluginDataDir ?? process.env.COPILOT_PLUGIN_DATA;
  const result = writeModeState(pluginDataDir, mode);
  return { handled: true, mode, persisted: result.persisted };
}

async function readStdin() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

async function main() {
  try {
    const raw = await readStdin();
    const payload = raw.trim() ? JSON.parse(raw.replace(/^\uFEFF/u, '')) : {};
    applyModeCommand(payload);
  } catch {
    // Persistence is best-effort. Failure must not block or rewrite the user's turn.
  }

  // Copilot CLI command hooks ignore userPromptSubmitted output; emit one quiet
  // JSON object to keep the hook contract explicit.
  process.stdout.write('{}\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
