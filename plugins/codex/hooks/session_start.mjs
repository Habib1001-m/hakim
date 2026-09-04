#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(__dirname, '..');
const manifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const skillPath = path.join(pluginRoot, 'skills', 'hakim', 'SKILL.md');
const mode = (process.env.HAKIM_DEFAULT_MODE || 'full').toLowerCase();
const MAX_CONTEXT_BYTES = 9_000;

const validModes = new Set(['lite', 'full', 'ultra', 'off']);
const resolvedMode = validModes.has(mode) ? mode : 'full';
const operationalSections = Object.freeze([
  'The 7-level ladder',
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
  lite: 'Lite mode: implement the request and mention the smaller safe alternative.',
  full: 'Full mode: apply the complete Hakim ladder; reuse first and prefer stdlib/native capabilities.',
  ultra: 'Ultra mode: challenge additions aggressively and prefer safe deletion before new code.',
}[resolvedMode];

try {
  const skillText = fs.readFileSync(skillPath, 'utf8');
  const policy = operationalSections.map((heading) => extractSection(skillText, heading)).join('\n\n');
  const context = [
    `Hakim ${version} is active in ${resolvedMode} mode.`,
    modeGuidance,
    'Apply the maintained Hakim policy automatically to coding work without requiring an explicit Hakim invocation.',
    'Specialized Hakim skills remain available when the user asks for review, audit, debt, evidence status, or help.',
    'Preserve Codex approval, sandbox, plugin, and hook trust controls.',
    '',
    policy,
  ].join('\n');

  if (Buffer.byteLength(context, 'utf8') > MAX_CONTEXT_BYTES) throw new Error('Hakim SessionStart context exceeds its size bound');
  process.stdout.write(`${context}\n`);
} catch {
  // Fail soft: Codex remains usable even if Hakim context cannot be loaded.
  process.stdout.write(`Hakim ${version} is active in ${resolvedMode} mode. ${modeGuidance} Preserve Codex approval and sandbox controls.\n`);
}
