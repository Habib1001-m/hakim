#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CANONICAL = path.join(ROOT, 'core/hakim-skill/SKILL.md');
const VERSION_FILE = path.join(ROOT, 'core/hakim-skill/VERSION');
const PROJECTION = path.join(ROOT, 'plugins/claude-code/skills/hakim/SKILL.md');
const MANIFEST = path.join(ROOT, 'plugins/claude-code/.claude-plugin/plugin.json');
const HOOKS = path.join(ROOT, 'plugins/claude-code/hooks/hooks.json');
const HOOK_HANDLER = path.join(ROOT, 'plugins/claude-code/hooks/post_tool_use_diagnostic.mjs');

const REQUIRED_PHRASES = [
  'Hakim for Claude Code',
  'Operating mode',
  'The 7-level ladder',
  'Does this need to exist',
  'already in this codebase',
  'stdlib',
  'native platform',
  'already-installed dependency',
  'one line',
  'minimum code that works',
  'Safety boundary',
  'Technical debt format',
  'Output discipline',
  'release readiness',
  'runtime validation',
];

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function extractMarker(text) {
  const match = text.match(/hakim-canonical-sha256:\s*([a-f0-9]{64})/i);
  return match ? match[1].toLowerCase() : null;
}

function parseJson(filePath, errors) {
  try {
    return JSON.parse(readUtf8(filePath));
  } catch (error) {
    errors.push(`invalid JSON in ${path.relative(ROOT, filePath)}: ${error.message}`);
    return null;
  }
}

function validateHookConfig(errors) {
  if (!exists(HOOKS)) {
    errors.push('Claude adapter must include hooks/hooks.json for the diagnostic prototype');
    return null;
  }

  if (!exists(HOOK_HANDLER)) {
    errors.push('Claude diagnostic hook handler missing');
  }

  const hooksConfig = parseJson(HOOKS, errors);
  if (!hooksConfig) return null;

  const events = Object.keys(hooksConfig.hooks || {});
  if (events.length !== 1 || events[0] !== 'PostToolUse') {
    errors.push('Claude hook must define PostToolUse only');
    return hooksConfig;
  }

  const groups = hooksConfig.hooks.PostToolUse;
  if (!Array.isArray(groups) || groups.length !== 1) {
    errors.push('Claude hook must define exactly one PostToolUse matcher group');
    return hooksConfig;
  }

  const group = groups[0];
  if (group.matcher !== 'Edit|Write') {
    errors.push('Claude hook matcher must be Edit|Write');
  }

  if (!Array.isArray(group.hooks) || group.hooks.length !== 1) {
    errors.push('Claude hook must define exactly one handler');
    return hooksConfig;
  }

  const handler = group.hooks[0];
  if (handler.type !== 'command') errors.push('Claude hook handler must be command type');
  if (handler.command !== 'node') errors.push('Claude hook handler must invoke node');
  if (!Array.isArray(handler.args) || handler.args.length !== 1 || handler.args[0] !== '${CLAUDE_PLUGIN_ROOT}/hooks/post_tool_use_diagnostic.mjs') {
    errors.push('Claude hook handler must point to the bundled diagnostic handler');
  }
  if (handler.timeout !== 5) errors.push('Claude hook timeout must remain 5 seconds');
  if (Object.prototype.hasOwnProperty.call(handler, 'if')) errors.push('Claude hook must not add extra conditional ambiguity');

  const handlerText = exists(HOOK_HANDLER) ? readUtf8(HOOK_HANDLER) : '';
  if (!handlerText.includes('HAKIM_CLAUDE_DIAGNOSTIC_HOOK')) {
    errors.push('Claude diagnostic hook must remain gated by HAKIM_CLAUDE_DIAGNOSTIC_HOOK');
  }
  if (!handlerText.includes('HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG')) {
    errors.push('Claude observable signal must be gated by HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG');
  }
  if (!handlerText.includes('systemMessage')) {
    errors.push('Claude observable signal must use systemMessage for visible runtime evidence');
  }
  if (handlerText.includes('updatedToolOutput')) {
    errors.push('Claude diagnostic hook handler must not emit updatedToolOutput');
  }
  if (handlerText.includes('updatedMCPToolOutput')) {
    errors.push('Claude diagnostic hook handler must not emit updatedMCPToolOutput');
  }
  if (handlerText.includes('permissionDecision')) {
    errors.push('Claude diagnostic hook handler must not emit permissionDecision');
  }

  return hooksConfig;
}

function main() {
  const errors = [];

  const canonical = readUtf8(CANONICAL);
  const expectedVersion = readUtf8(VERSION_FILE).trim();
  const projection = readUtf8(PROJECTION);
  const canonicalHash = sha256(canonical);
  const projectionMarker = extractMarker(projection);
  const manifest = parseJson(MANIFEST, errors);
  validateHookConfig(errors);

  if (!projectionMarker) {
    errors.push('missing hakim-canonical-sha256 marker in Claude compact skill');
  } else if (projectionMarker !== canonicalHash) {
    errors.push(`canonical hash drift: projection=${projectionMarker} canonical=${canonicalHash}`);
  }

  for (const phrase of REQUIRED_PHRASES) {
    if (!projection.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(`missing required projection phrase: ${phrase}`);
    }
  }

  if (manifest) {
    if (manifest.name !== 'hakim') errors.push('manifest name must be hakim');
    if (manifest.version !== expectedVersion) errors.push(`manifest version must be ${expectedVersion}`);
    if (!manifest.description || !manifest.description.toLowerCase().includes('smallest safe diff')) {
      errors.push('manifest description must describe Hakim behavior');
    }
  }

  const payload = {
    canonical: path.relative(ROOT, CANONICAL),
    projection: path.relative(ROOT, PROJECTION),
    manifest: path.relative(ROOT, MANIFEST),
    hooks: path.relative(ROOT, HOOKS),
    diagnostic_handler: path.relative(ROOT, HOOK_HANDLER),
    hook_event: 'PostToolUse',
    hook_matcher: 'Edit|Write',
    hook_opt_in_env: 'HAKIM_CLAUDE_DIAGNOSTIC_HOOK',
    hook_debug_env: 'HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG',
    expected_version: expectedVersion,
    canonical_hash: canonicalHash,
    projection_marker: projectionMarker,
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (payload.ok) {
    console.log(`Claude compact skill projection OK (${canonicalHash.slice(0, 12)})`);
  } else {
    console.error('Claude compact skill projection drift detected:');
    for (const error of errors) console.error(`- ${error}`);
  }

  process.exit(payload.ok ? 0 : 1);
}

main();
