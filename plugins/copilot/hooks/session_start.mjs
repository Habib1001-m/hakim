#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getModeDirective, readModeState } from './mode_state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(HERE, '..', 'skills', 'hakim', 'SKILL.md');
const MAX_CONTEXT_BYTES = 9_000;

const OPERATIONAL_SECTIONS = Object.freeze([
  'Decision ladder',
  'Pre-mutation baseline',
  'Evidence sufficiency',
  'Domain-guard preservation',
  'Outcome-oriented restraint',
  'Bounded `NO_CHANGE` truth',
]);

function extractSection(markdown, heading) {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start < 0) throw new Error(`missing maintained Hakim section: ${heading}`);

  const next = markdown.indexOf('\n## ', start + marker.length);
  return markdown.slice(start, next < 0 ? markdown.length : next).trim();
}

export function buildOperationalContext(markdown, mode = 'full') {
  const body = OPERATIONAL_SECTIONS.map((heading) => extractSection(markdown, heading)).join('\n\n');
  const context = [
    `HAKIM OPERATIONAL PRESENCE — ${mode} mode.`,
    getModeDirective(mode),
    'Hakim is already available for this Copilot session. Apply the maintained decision policy automatically to coding work without requiring an explicit Hakim invocation.',
    'Preserve model reasoning freedom: these rules govern engineering decisions, evidence, and consequential claims; they are not a fixed reasoning recipe or tool sequence.',
    '',
    body,
  ].join('\n');

  if (Buffer.byteLength(context, 'utf8') > MAX_CONTEXT_BYTES) {
    throw new Error('operational context exceeds bounded session-start size');
  }
  return context;
}

export function buildSessionStartOutput(skillText, mode = 'full') {
  if (mode === 'off') return {};
  return { additionalContext: buildOperationalContext(skillText, mode) };
}

export function resolvePluginDataDir(options = {}) {
  return options.pluginDataDir ?? process.env.HAKIM_PLUGIN_DATA ?? process.env.COPILOT_PLUGIN_DATA;
}

export function runSessionStart(options = {}) {
  const pluginDataDir = resolvePluginDataDir(options);
  const modeState = readModeState(pluginDataDir);
  if (modeState.mode === 'off') return {};

  const skillText = options.skillText ?? fs.readFileSync(SKILL_PATH, 'utf8');
  return buildSessionStartOutput(skillText, modeState.mode);
}

function main() {
  try {
    process.stdout.write(`${JSON.stringify(runSessionStart())}\n`);
  } catch {
    // Presence remains fail-soft. Invalid or missing state falls back to full;
    // unexpected hook/runtime failures must not break an otherwise usable session.
    process.stdout.write('{}\n');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
