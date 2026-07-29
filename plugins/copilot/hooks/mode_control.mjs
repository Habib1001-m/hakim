#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getModeDirective } from './mode_state.mjs';
import { parseModeCommand } from './mode_tracker.mjs';

export function buildModeControlPrompt(mode) {
  const directive = getModeDirective(mode);
  return [
    `HAKIM MODE CONTROL — selected mode: ${mode}.`,
    directive,
    'This invocation changes Hakim mode only. Do not inspect files, run tools, or mutate the repository merely to switch mode.',
    `Reply only: Hakim mode: ${mode}`,
  ].join('\n');
}

export function applyModeControl(input) {
  const mode = parseModeCommand(input?.prompt);
  if (!mode) return { handled: false, output: {} };

  return {
    handled: true,
    mode,
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
    // Current-turn control is best-effort. Failure must not block or rewrite an ordinary prompt.
    process.stdout.write('{}\n');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
