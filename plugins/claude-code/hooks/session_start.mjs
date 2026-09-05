#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..');
const MANIFEST = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
const SKILL = path.join(PLUGIN_ROOT, 'skills', 'hakim', 'SKILL.md');
const MAX_CONTEXT_BYTES = 9_000;
const OPERATIONAL_SECTIONS = Object.freeze([
  'Understand only what matters',
  'The 7-level decision ladder',
  'Proportional verification',
  'Depth is earned',
  'Preserve real guards',
  'Evidence and authority',
  'Evidence-bound claims',
]);

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function extractSection(markdown, heading) {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start < 0) throw new Error(`missing maintained Hakim section: ${heading}`);
  const next = markdown.indexOf('\n## ', start + marker.length);
  return markdown.slice(start, next < 0 ? markdown.length : next).trim();
}

async function main() {
  let payload = {};
  try {
    const raw = await readStdin();
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  if (payload.hook_event_name && payload.hook_event_name !== 'SessionStart') return;

  let version = 'unknown';
  try {
    version = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).version || version;
  } catch {
    // Hakim must never prevent Claude Code startup.
  }

  let additionalContext;
  try {
    const skillText = fs.readFileSync(SKILL, 'utf8');
    const policy = OPERATIONAL_SECTIONS.map((heading) => extractSection(skillText, heading)).join('\n\n');
    additionalContext = [
      `Hakim ${version} plugin is active for this Claude Code session.`,
      `The active Hakim version is ${version}.`,
      'Apply the maintained Hakim core automatically to coding work without requiring an explicit Hakim invocation.',
      'Choose ordinary tactics inside the authorized scope; add process only when it changes a decision, protects a real boundary, or makes material evidence observable.',
      'Specialized capabilities remain available for review, audit, debt, evidence status, help, and explicit mode control.',
      'Preserve Claude Code permissions and host-native trust controls; never bypass them.',
      '',
      policy,
    ].join('\n');
    if (Buffer.byteLength(additionalContext, 'utf8') > MAX_CONTEXT_BYTES) throw new Error('Hakim SessionStart context exceeds its size bound');
  } catch {
    additionalContext = `Hakim ${version} plugin is active for this Claude Code session. Preserve Claude Code permissions and host-native trust controls.`;
  }

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext,
    },
  })}\n`);
}

main().catch(() => {
  // Fail open: Hakim must not prevent Claude Code startup.
});
