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
  'Understand only what matters',
  'The 7-level decision ladder',
  'Proportional verification',
  'Depth is earned',
  'Preserve real guards',
  'Evidence and authority',
  'Evidence-bound claims',
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
  lite: 'Lite mode: execute the request and mention a materially smaller safe alternative when one exists.',
  full: 'Full mode: apply the complete Hakim decision model with proportional verification.',
  ultra: 'Ultra mode: challenge additions, abstractions, and dependencies aggressively while preserving the required outcome and real guards.',
}[resolvedMode];

try {
  const skillText = fs.readFileSync(skillPath, 'utf8');
  const policy = operationalSections.map((heading) => extractSection(skillText, heading)).join('\n\n');
  const context = [
    `Hakim ${version} is active in ${resolvedMode} mode.`,
    modeGuidance,
    'Apply the maintained Hakim core automatically to coding work without requiring an explicit Hakim invocation.',
    'Choose ordinary tactics inside the authorized scope; add process only when it changes a decision, protects a real boundary, or makes material evidence observable.',
    'Specialized capabilities remain available for review, audit, debt, evidence status, and help.',
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
