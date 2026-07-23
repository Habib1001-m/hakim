#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..');
const MANIFEST = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
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
    // Activation context must never block Claude Code startup.
  }

  const additionalContext = [
    `Hakim ${version} plugin is active for this Claude Code session.`,
    'Apply the hidden Hakim canonical skills automatically when the task matches their descriptions.',
    'User shortcuts are /hakim:full, /hakim:review, /hakim:audit, /hakim:debt, /hakim:gain, and /hakim:help.',
    'Preserve Claude Code permissions and host-native trust controls; never bypass them.',
  ].join(' ');

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext,
    },
  })}\n`);
}

main().catch(() => {
  // Fail open: Hakim activation context is advisory and must not prevent startup.
});
