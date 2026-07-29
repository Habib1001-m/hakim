#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANONICAL = path.join(ROOT, 'core/hakim-skill/SKILL.md');
const VERSION = path.join(ROOT, 'core/hakim-skill/VERSION');
const BASELINE = path.join(ROOT, '.github/copilot-instructions.md');
const MARKETPLACE = path.join(ROOT, '.github/plugin/marketplace.json');
const PLUGIN_ROOT = path.join(ROOT, 'plugins/copilot');
const MANIFEST = path.join(PLUGIN_ROOT, 'plugin.json');
const HOOK_CONFIG = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
const SESSION_HOOK = path.join(PLUGIN_ROOT, 'hooks', 'session_start.mjs');
const MODE_STATE = path.join(PLUGIN_ROOT, 'hooks', 'mode_state.mjs');
const MODE_TRACKER = path.join(PLUGIN_ROOT, 'hooks', 'mode_tracker.mjs');
const MODE_CONTROL = path.join(PLUGIN_ROOT, 'hooks', 'mode_control.mjs');

const SKILLS = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
const READ_ONLY_AGENTS = ['hakim-reviewer', 'hakim-auditor', 'hakim-debt-analyst', 'hakim-evidence-verifier'];
const ALL_AGENTS = [...READ_ONLY_AGENTS, 'hakim-implementer'];

const read = (filePath) => fs.readFileSync(filePath, 'utf8');
const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

function parseJson(filePath, errors) {
  try { return JSON.parse(read(filePath)); }
  catch (error) {
    errors.push(`invalid JSON in ${path.relative(ROOT, filePath)}: ${error.message}`);
    return null;
  }
}

function marker(text) {
  return text.match(/hakim-canonical-sha256:\s*([a-f0-9]{64})/i)?.[1]?.toLowerCase() || null;
}

function requireFile(filePath, label, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${label} missing: ${path.relative(ROOT, filePath)}`);
    return false;
  }
  return true;
}

function frontmatterArray(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (!match) return [];
  return match[1].split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function main() {
  const errors = [];
  const canonical = read(CANONICAL);
  const canonicalHash = sha256(canonical);
  const expectedVersion = read(VERSION).trim();

  requireFile(BASELINE, 'Copilot baseline instructions', errors);
  requireFile(MARKETPLACE, 'Copilot marketplace', errors);
  requireFile(MANIFEST, 'Copilot plugin manifest', errors);
  requireFile(HOOK_CONFIG, 'Copilot operational-presence hook config', errors);
  requireFile(SESSION_HOOK, 'Copilot session/subagent presence hook', errors);
  requireFile(MODE_STATE, 'Copilot bounded mode-state helper', errors);
  requireFile(MODE_TRACKER, 'Copilot submitted-prompt mode tracker', errors);
  requireFile(MODE_CONTROL, 'Copilot transformed mode-control hook', errors);

  const baseline = fs.existsSync(BASELINE) ? read(BASELINE) : '';
  if (marker(baseline) !== canonicalHash) errors.push('Copilot baseline canonical hash drift');
  for (const phrase of ['smallest safe change', 'inspectable evidence', 'native `hakim` Copilot plugin', 'Host-native permissions']) {
    if (!baseline.toLowerCase().includes(phrase.toLowerCase())) errors.push(`Copilot baseline missing phrase: ${phrase}`);
  }

  const marketplace = fs.existsSync(MARKETPLACE) ? parseJson(MARKETPLACE, errors) : null;
  const entry = marketplace?.plugins?.find((item) => item.name === 'hakim');
  if (marketplace?.name !== 'hakim') errors.push('Copilot marketplace name must be hakim');
  if (marketplace?.metadata?.version !== expectedVersion) errors.push(`Copilot marketplace version must be ${expectedVersion}`);
  if (!entry) errors.push('Copilot marketplace must expose hakim');
  if (entry?.version !== expectedVersion) errors.push(`Copilot marketplace plugin version must be ${expectedVersion}`);
  if (entry?.source !== './plugins/copilot') errors.push('Copilot marketplace source must be ./plugins/copilot');

  const manifest = fs.existsSync(MANIFEST) ? parseJson(MANIFEST, errors) : null;
  if (manifest?.name !== 'hakim') errors.push('Copilot plugin manifest name must be hakim');
  if (manifest?.version !== expectedVersion) errors.push(`Copilot plugin manifest version must be ${expectedVersion}`);
  if (manifest?.agents !== 'agents/') errors.push('Copilot plugin agents path must be agents/');
  if (!Array.isArray(manifest?.skills) || !manifest.skills.includes('skills/')) errors.push('Copilot plugin skills path must include skills/');
  if (manifest?.hooks !== 'hooks/hooks.json') errors.push('Copilot plugin hooks path must be hooks/hooks.json during R3.2');

  const hookConfig = fs.existsSync(HOOK_CONFIG) ? parseJson(HOOK_CONFIG, errors) : null;
  if (hookConfig?.version !== 1) errors.push('Copilot hook configuration version must be 1');
  const hookNames = Object.keys(hookConfig?.hooks || {}).sort();
  const expectedHooks = ['sessionStart', 'subagentStart', 'userPromptSubmitted', 'userPromptTransformed'];
  if (JSON.stringify(hookNames) !== JSON.stringify(expectedHooks)) {
    errors.push(`R3.2 operational hooks must be exactly ${expectedHooks.join(' + ')}; found: ${hookNames.join(', ') || 'none'}`);
  }

  const sessionHooks = hookConfig?.hooks?.sessionStart;
  if (!Array.isArray(sessionHooks) || sessionHooks.length !== 1) {
    errors.push('R3.2 must expose exactly one Copilot sessionStart hook');
  } else {
    const hook = sessionHooks[0];
    if (hook?.type !== 'command') errors.push('Copilot sessionStart hook must use the command hook type');
    if (hook?.command !== 'node "${PLUGIN_ROOT}/hooks/session_start.mjs"') errors.push('Copilot sessionStart hook must execute the plugin-local session_start.mjs');
    if (hook?.env !== undefined) errors.push('Copilot sessionStart must rely on the host-owned COPILOT_PLUGIN_DATA runtime instead of a rebinding layer');
    if (hook?.timeoutSec !== 5) errors.push('Copilot sessionStart hook timeoutSec must remain 5');
  }

  const subagentHooks = hookConfig?.hooks?.subagentStart;
  if (!Array.isArray(subagentHooks) || subagentHooks.length !== 1) {
    errors.push('R3.2 F04 must expose exactly one Copilot subagentStart presence hook');
  } else {
    const hook = subagentHooks[0];
    if (hook?.type !== 'command') errors.push('Copilot subagentStart hook must use the command hook type');
    if (hook?.command !== 'node "${PLUGIN_ROOT}/hooks/session_start.mjs"') errors.push('Copilot subagentStart must reuse the plugin-local session_start.mjs presence authority');
    if (hook?.env !== undefined) errors.push('Copilot subagentStart must rely on host-owned COPILOT_PLUGIN_DATA directly');
    if (hook?.timeoutSec !== 5) errors.push('Copilot subagentStart hook timeoutSec must remain 5');
  }

  const submittedHooks = hookConfig?.hooks?.userPromptSubmitted;
  if (!Array.isArray(submittedHooks) || submittedHooks.length !== 1) {
    errors.push('R3.2 F03 must expose exactly one Copilot userPromptSubmitted persistence hook');
  } else {
    const hook = submittedHooks[0];
    if (hook?.type !== 'command') errors.push('Copilot mode tracker must use the command hook type');
    if (hook?.command !== 'node "${PLUGIN_ROOT}/hooks/mode_tracker.mjs"') errors.push('Copilot mode tracker must execute plugin-local mode_tracker.mjs');
    if (hook?.env !== undefined) errors.push('Copilot mode tracker must use host-provided COPILOT_PLUGIN_DATA directly');
    if (hook?.timeoutSec !== 2) errors.push('Copilot mode tracker timeoutSec must remain 2');
  }

  const transformedHooks = hookConfig?.hooks?.userPromptTransformed;
  if (!Array.isArray(transformedHooks) || transformedHooks.length !== 1) {
    errors.push('R3.2 F03 must expose exactly one Copilot userPromptTransformed current-turn hook');
  } else {
    const hook = transformedHooks[0];
    if (hook?.type !== 'command') errors.push('Copilot mode control must use the command hook type');
    if (hook?.command !== 'node "${PLUGIN_ROOT}/hooks/mode_control.mjs"') errors.push('Copilot mode control must execute plugin-local mode_control.mjs');
    if (hook?.env !== undefined) errors.push('Copilot transformed mode control must remain stateless and require no plugin-data binding');
    if (hook?.timeoutSec !== 2) errors.push('Copilot mode control timeoutSec must remain 2');
  }

  if (fs.existsSync(MODE_STATE)) {
    const text = read(MODE_STATE);
    if (!text.includes("VALID_MODES = Object.freeze(['lite', 'full', 'ultra', 'off'])")) errors.push('Copilot mode state must preserve canonical lite/full/ultra/off modes');
    if (!text.includes("const STATE_FILE = 'mode.json'")) errors.push('Copilot mode state must use one bounded mode.json file');
    if (!text.includes('schema_version')) errors.push('Copilot mode state must remain schema-versioned');
    for (const directive of ['Build what is asked', 'Enforce the Hakim ladder', 'YAGNI extremist mode', 'Hakim guidance disabled']) {
      if (!text.includes(directive)) errors.push(`Copilot mode state missing canonical directive fragment: ${directive}`);
    }
  }

  if (fs.existsSync(MODE_TRACKER)) {
    const text = read(MODE_TRACKER);
    if (!text.includes('parseModeCommand')) errors.push('Copilot mode tracker missing bounded command parser');
    if (!text.includes('writeModeState')) errors.push('Copilot mode tracker must own persistent mode writes');
    if (!text.includes('COPILOT_PLUGIN_DATA')) errors.push('Copilot mode tracker must consume host-provided COPILOT_PLUGIN_DATA');
    if (!text.includes('lite|full|ultra|off')) errors.push('Copilot mode tracker must retain the four canonical mode tokens');
    if (/writeFileSync\([^\n]*prompt/i.test(text)) errors.push('Copilot mode tracker must not persist raw prompts');
  }

  if (fs.existsSync(MODE_CONTROL)) {
    const text = read(MODE_CONTROL);
    if (!text.includes('parseModeCommand')) errors.push('Copilot mode control must reuse the bounded command parser');
    if (!text.includes('applyModeControl')) errors.push('Copilot mode control missing bounded mode application');
    if (!text.includes('modifiedTransformedPrompt')) errors.push('Copilot mode control must explicitly rewrite only the transformed control prompt');
    if (text.includes('writeModeState')) errors.push('Copilot transformed mode control must remain stateless');
    if (text.includes('COPILOT_PLUGIN_DATA') || text.includes('HAKIM_PLUGIN_DATA')) errors.push('Copilot transformed mode control must not depend on plugin-data environment');
  }

  for (const skill of SKILLS) {
    const skillPath = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
    if (!requireFile(skillPath, `Copilot skill ${skill}`, errors)) continue;
    const text = read(skillPath);
    if (!text.includes(`name: ${skill}`)) errors.push(`Copilot skill ${skill} name mismatch`);
  }
  const canonicalSkill = path.join(PLUGIN_ROOT, 'skills', 'hakim', 'SKILL.md');
  if (fs.existsSync(canonicalSkill) && marker(read(canonicalSkill)) !== canonicalHash) errors.push('Copilot canonical skill hash drift');

  for (const agent of ALL_AGENTS) {
    const agentPath = path.join(PLUGIN_ROOT, 'agents', `${agent}.agent.md`);
    if (!requireFile(agentPath, `Copilot agent ${agent}`, errors)) continue;
    const text = read(agentPath);
    if (!text.includes(`name: ${agent}`)) errors.push(`Copilot agent ${agent} name mismatch`);
    if (!text.includes('user-invocable: true')) errors.push(`Copilot agent ${agent} must remain user-invocable`);
  }

  for (const agent of READ_ONLY_AGENTS) {
    const agentPath = path.join(PLUGIN_ROOT, 'agents', `${agent}.agent.md`);
    if (!fs.existsSync(agentPath)) continue;
    const tools = frontmatterArray(read(agentPath), 'tools');
    if (JSON.stringify(tools) !== JSON.stringify(['read', 'search'])) {
      errors.push(`Copilot read-only agent ${agent} must expose only read/search tools`);
    }
  }

  const implementer = path.join(PLUGIN_ROOT, 'agents', 'hakim-implementer.agent.md');
  if (fs.existsSync(implementer)) {
    const tools = frontmatterArray(read(implementer), 'tools');
    for (const tool of ['read', 'search', 'edit', 'execute']) {
      if (!tools.includes(tool)) errors.push(`Copilot implementer missing tool: ${tool}`);
    }
  }

  const payload = {
    canonical: path.relative(ROOT, CANONICAL),
    baseline: path.relative(ROOT, BASELINE),
    marketplace: path.relative(ROOT, MARKETPLACE),
    plugin_manifest: path.relative(ROOT, MANIFEST),
    hook_config: path.relative(ROOT, HOOK_CONFIG),
    session_hook: path.relative(ROOT, SESSION_HOOK),
    mode_state: path.relative(ROOT, MODE_STATE),
    mode_tracker: path.relative(ROOT, MODE_TRACKER),
    mode_control: path.relative(ROOT, MODE_CONTROL),
    canonical_hash: canonicalHash,
    expected_version: expectedVersion,
    native_install: 'copilot plugin marketplace add Habib1001-m/hakim && copilot plugin install hakim@hakim',
    skills: SKILLS,
    agents: ALL_AGENTS,
    baseline_role: 'FALLBACK_ONLY',
    operational_presence: 'SESSION_AND_SUBAGENT_PRESENCE_PLUS_SUBMITTED_STATE_PLUS_TRANSFORMED_CONTROL_EXPERIMENTAL',
    persistent_modes: ['lite', 'ultra', 'off'],
    default_mode_state: 'STATELESS_FULL',
    plugin_data_binding: 'DIRECT_HOST_COPILOT_PLUGIN_DATA_IN_PRESENCE_AND_SUBMITTED_HOOKS',
    enforcement_hooks: [],
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) console.log(JSON.stringify(payload, null, 2));
  else if (payload.ok) console.log(`Copilot native plugin contract OK (${canonicalHash.slice(0, 12)})`);
  else {
    console.error('Copilot native plugin contract drift detected:');
    for (const error of errors) console.error(`- ${error}`);
  }
  process.exit(payload.ok ? 0 : 1);
}

main();
