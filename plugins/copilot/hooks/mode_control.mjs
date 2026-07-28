#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getModeDirective, writeModeState } from './mode_state.mjs';

// Route only the raw submitted control command exposed by userPromptTransformed.
// Never infer mode from the host-expanded transformed prompt or ordinary prose.
const MODE_COMMAND = /^\/(?:hakim[:/])?hakim(?:\s+(lite|full|ultra|off))?\s*$/i;

export function parseModeCommand(prompt) {
  const match = String(prompt ?? '').trim().match(MODE_COMMAND);
  if (!match) return null;
  return (match[1] || 'full').toLowerCase();
}

export function buildModeControlPrompt(mode) {
  const directive = getModeDirective(mode);
  return [
    `HAKIM MODE CONTROL — selected mode: ${mode}.`,
    directive,
    'This invocation changes Hakim mode only. Do not inspect files, run tools, or mutate the repository merely to switch mode.',
    `Reply only: Hakim mode: ${mode}`,
  ].join('\n');
}

export function resolvePluginDataDir(options = {}) {
  return options.pluginDataDir ?? process.env.HAKIM_PLUGIN_DATA ?? process.env.COPILOT_PLUGIN_DATA;
}

export function applyModeControl(input, options = {}) {
  const mode = parseModeCommand(input?.prompt);
  if (!mode) return { handled: false, output: {} };

  const pluginDataDir = resolvePluginDataDir(options);
  const result = writeModeState(pluginDataDir, mode);
  return {
    handled: true,
    mode,
    persisted: result.persisted,
    output: { modifiedTransformedPrompt: buildModeControlPrompt(mode) },
  };
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
    const result = applyModeControl(payload);
    process.stdout.write(`${JSON.stringify(result.output)}\n`);
  } catch {
    // Mode control is best-effort. Failure must not block or rewrite an ordinary prompt.
    process.stdout.write('{}\n');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
