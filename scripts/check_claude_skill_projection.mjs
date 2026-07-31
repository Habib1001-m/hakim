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
const IDENTITY_FILE = path.join(ROOT, 'conformance/distribution-identity.json');
const PLUGIN_ROOT = path.join(ROOT, 'plugins', 'claude-code');
const PROJECTION = path.join(PLUGIN_ROOT, 'skills', 'hakim', 'SKILL.md');
const MANIFEST = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
const MARKETPLACE = path.join(ROOT, '.claude-plugin', 'marketplace.json');
const HOOKS = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
const SESSION_HANDLER = path.join(PLUGIN_ROOT, 'hooks', 'session_start.mjs');
const DIAGNOSTIC_HANDLER = path.join(PLUGIN_ROOT, 'hooks', 'post_tool_use_diagnostic.mjs');

const NATIVE_SKILLS = ['full', 'review', 'audit', 'debt', 'gain', 'help'];
const CANONICAL_SKILLS = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
const AGENTS = [
  'hakim-reviewer',
  'hakim-auditor',
  'hakim-debt-analyst',
  'hakim-evidence-verifier',
  'hakim-implementer',
];

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

function requireFile(filePath, errors, label) {
  if (!exists(filePath)) {
    errors.push(`${label} missing: ${path.relative(ROOT, filePath)}`);
    return false;
  }
  return true;
}

function validateHookGroup(groups, matcher, expectedHandler, errors, label) {
  if (!Array.isArray(groups) || groups.length !== 1) {
    errors.push(`${label} must define exactly one matcher group`);
    return;
  }
  const group = groups[0];
  if (group.matcher !== matcher) errors.push(`${label} matcher must be ${matcher}`);
  if (!Array.isArray(group.hooks) || group.hooks.length !== 1) {
    errors.push(`${label} must define exactly one handler`);
    return;
  }
  const handler = group.hooks[0];
  if (handler.type !== 'command') errors.push(`${label} handler must be command type`);
  if (handler.command !== 'node') errors.push(`${label} handler must invoke node`);
  if (!Array.isArray(handler.args) || handler.args.length !== 1 || handler.args[0] !== expectedHandler) {
    errors.push(`${label} handler path mismatch`);
  }
  if (handler.timeout !== 5) errors.push(`${label} timeout must remain 5 seconds`);
}

function validateHooks(errors) {
  if (!requireFile(HOOKS, errors, 'Claude hooks manifest')) return;
  requireFile(SESSION_HANDLER, errors, 'Claude SessionStart handler');
  requireFile(DIAGNOSTIC_HANDLER, errors, 'Claude diagnostic handler');

  const hooksConfig = parseJson(HOOKS, errors);
  if (!hooksConfig) return;
  const events = Object.keys(hooksConfig.hooks || {}).sort();
  if (JSON.stringify(events) !== JSON.stringify(['PostToolUse', 'SessionStart'])) {
    errors.push(`Claude hooks must define SessionStart and PostToolUse only; found ${events.join(', ')}`);
    return;
  }

  validateHookGroup(
    hooksConfig.hooks.SessionStart,
    'startup|resume|clear',
    '${CLAUDE_PLUGIN_ROOT}/hooks/session_start.mjs',
    errors,
    'Claude SessionStart hook',
  );
  validateHookGroup(
    hooksConfig.hooks.PostToolUse,
    'Edit|Write',
    '${CLAUDE_PLUGIN_ROOT}/hooks/post_tool_use_diagnostic.mjs',
    errors,
    'Claude PostToolUse hook',
  );

  if (exists(SESSION_HANDLER)) {
    const text = readUtf8(SESSION_HANDLER);
    for (const phrase of ['SessionStart', 'additionalContext', '/hakim:full', 'permissions']) {
      if (!text.includes(phrase)) errors.push(`Claude SessionStart handler missing activation phrase: ${phrase}`);
    }
    for (const forbidden of ['writeFileSync(', 'appendFileSync(', 'rmSync(', 'unlinkSync(']) {
      if (text.includes(forbidden)) errors.push(`Claude SessionStart handler must remain read-only: ${forbidden}`);
    }
  }

  if (exists(DIAGNOSTIC_HANDLER)) {
    const text = readUtf8(DIAGNOSTIC_HANDLER);
    if (!text.includes('HAKIM_CLAUDE_DIAGNOSTIC_HOOK')) errors.push('Claude diagnostic hook must remain opt-in');
    if (text.includes('permissionDecision')) errors.push('Claude post-edit diagnostic must not make permission decisions');
  }
}

function validateMarketplace(frozen, errors) {
  if (!requireFile(MARKETPLACE, errors, 'Claude marketplace manifest')) return null;
  const marketplace = parseJson(MARKETPLACE, errors);
  if (!marketplace) return null;
  if (marketplace.name !== 'hakim') errors.push('Claude marketplace name must be hakim');
  const plugin = Array.isArray(marketplace.plugins)
    ? marketplace.plugins.find((item) => item.name === 'hakim')
    : null;
  if (!plugin) {
    errors.push('Claude marketplace must expose the hakim plugin');
    return null;
  }

  const source = plugin.source;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    errors.push('Claude marketplace source must be an exact-SHA git-subdir object');
  } else {
    if (source.source !== 'git-subdir') errors.push('Claude marketplace plugin source type must be git-subdir');
    if (source.url !== 'https://github.com/Habib1001-m/hakim.git') errors.push('Claude marketplace plugin source URL mismatch');
    if (source.path !== 'plugins/claude-code') errors.push('Claude marketplace plugin source path must be plugins/claude-code');
    if (source.sha !== frozen.source_sha) errors.push(`Claude marketplace plugin source SHA must be ${frozen.source_sha}`);
    if (Object.hasOwn(source, 'ref')) errors.push('Claude marketplace exact-SHA source must not also declare ref');
  }
  if (plugin.version !== frozen.version) errors.push(`Claude marketplace version must be frozen ${frozen.version}`);
  return plugin;
}

function validateNativeSurface(errors) {
  for (const skill of NATIVE_SKILLS) {
    const filePath = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
    if (!requireFile(filePath, errors, `Claude native skill ${skill}`)) continue;
    if (!readUtf8(filePath).includes('disable-model-invocation: true')) {
      errors.push(`Claude native skill ${skill} must be user-controlled`);
    }
  }

  for (const skill of CANONICAL_SKILLS) {
    const filePath = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
    if (!requireFile(filePath, errors, `Claude canonical skill ${skill}`)) continue;
    if (!readUtf8(filePath).includes('user-invocable: false')) {
      errors.push(`Claude canonical skill ${skill} must be hidden from the slash menu`);
    }
  }

  for (const agent of AGENTS) {
    requireFile(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), errors, `Claude plugin agent ${agent}`);
  }

  const implementer = path.join(PLUGIN_ROOT, 'agents', 'hakim-implementer.md');
  if (exists(implementer) && !readUtf8(implementer).includes('isolation: worktree')) {
    errors.push('Claude Hakim implementer must preserve worktree isolation');
  }
}

function main() {
  const errors = [];
  const canonical = readUtf8(CANONICAL);
  const expectedVersion = readUtf8(VERSION_FILE).trim();
  const identity = parseJson(IDENTITY_FILE, errors);
  const frozen = identity?.latest_frozen_candidate;
  const projection = readUtf8(PROJECTION);
  const canonicalHash = sha256(canonical);
  const projectionMarker = extractMarker(projection);
  const manifest = parseJson(MANIFEST, errors);

  validateHooks(errors);
  const catalogPlugin = frozen ? validateMarketplace(frozen, errors) : null;
  validateNativeSurface(errors);

  if (!projectionMarker) errors.push('missing hakim-canonical-sha256 marker in Claude compact skill');
  else if (projectionMarker !== canonicalHash) errors.push(`canonical hash drift: projection=${projectionMarker} canonical=${canonicalHash}`);

  for (const phrase of REQUIRED_PHRASES) {
    if (!projection.toLowerCase().includes(phrase.toLowerCase())) errors.push(`missing required projection phrase: ${phrase}`);
  }

  if (manifest) {
    if (manifest.name !== 'hakim') errors.push('manifest name must be hakim');
    if (manifest.version !== expectedVersion) errors.push(`source-tree Claude manifest version must be ${expectedVersion}`);
    if (!manifest.description || !manifest.description.toLowerCase().includes('smallest safe diff')) {
      errors.push('manifest description must describe Hakim behavior');
    }
  }

  const payload = {
    canonical: path.relative(ROOT, CANONICAL),
    projection: path.relative(ROOT, PROJECTION),
    manifest: path.relative(ROOT, MANIFEST),
    marketplace: path.relative(ROOT, MARKETPLACE),
    hooks: path.relative(ROOT, HOOKS),
    session_handler: path.relative(ROOT, SESSION_HANDLER),
    diagnostic_handler: path.relative(ROOT, DIAGNOSTIC_HANDLER),
    native_skills: NATIVE_SKILLS,
    canonical_skills: CANONICAL_SKILLS,
    plugin_agents: AGENTS,
    source_tree_version: expectedVersion,
    catalog_version: catalogPlugin?.version || null,
    catalog_source_sha: catalogPlugin?.source?.sha || null,
    canonical_hash: canonicalHash,
    projection_marker: projectionMarker,
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) console.log(JSON.stringify(payload, null, 2));
  else if (payload.ok) console.log(`Claude native plugin projection OK (${canonicalHash.slice(0, 12)})`);
  else {
    console.error('Claude native plugin projection drift detected:');
    for (const error of errors) console.error(`- ${error}`);
  }
  process.exit(payload.ok ? 0 : 1);
}

main();
