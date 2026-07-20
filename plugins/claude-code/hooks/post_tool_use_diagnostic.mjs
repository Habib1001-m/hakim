#!/usr/bin/env node
'use strict';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isEnabled(value) {
  return ENABLED_VALUES.has(String(value || '').trim().toLowerCase());
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function parseJson(text) {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function getFilePath(payload) {
  const input = payload && typeof payload.tool_input === 'object' && payload.tool_input ? payload.tool_input : {};
  const response = payload && typeof payload.tool_response === 'object' && payload.tool_response ? payload.tool_response : {};
  return input.file_path || input.filePath || input.path || response.filePath || response.file_path || response.path || 'unknown file';
}

function buildOutput(payload, options = {}) {
  const toolName = payload.tool_name || 'unknown tool';
  const filePath = getFilePath(payload);
  const additionalContext = [
    `Hakim diagnostic: ${toolName} completed for ${filePath}.`,
    'Continue with the smallest safe diff, reuse existing code first, avoid speculative architecture, and run targeted validation before claiming completion.',
  ].join(' ');

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext,
    },
  };

  if (options.debugVisible) {
    output.systemMessage = `Hakim diagnostic hook observed: ${toolName} completed for ${filePath}.`;
  }

  return output;
}

async function main() {
  if (!isEnabled(process.env.HAKIM_CLAUDE_DIAGNOSTIC_HOOK)) {
    return;
  }

  let payload;
  try {
    payload = parseJson(await readStdin());
  } catch (error) {
    // Diagnostic-only hook: never block Claude or change tool output on malformed input.
    return;
  }

  if (payload.hook_event_name !== 'PostToolUse') return;
  if (!['Edit', 'Write'].includes(payload.tool_name)) return;

  const output = buildOutput(payload, {
    debugVisible: isEnabled(process.env.HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG),
  });
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

main().catch(() => {
  // Diagnostic-only hook: fail closed to silence, not to interruption.
});
