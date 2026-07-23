#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPABILITY_IDS = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
const EXACT_ADJUNCT_HOSTS = ['codex', 'copilot'];
const errors = [];

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const parseSkillName = (text) => text.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim() || null;

const capabilities = JSON.parse(read('core/hakim-skill/capabilities.json'));
const ids = capabilities.capabilities.map((item) => item.id);
if (JSON.stringify(ids) !== JSON.stringify(CAPABILITY_IDS)) errors.push(`capability registry mismatch: ${JSON.stringify(ids)}`);

for (const capability of capabilities.capabilities) {
  if (!capability.canonical_path || !exists(capability.canonical_path)) errors.push(`${capability.id} canonical path missing`);
  for (const host of ['codex', 'claude-code', 'github-copilot', 'opencode']) {
    const surface = capability.hosts?.[host];
    if (!surface?.path || !exists(surface.path)) errors.push(`${capability.id} missing ${host} product path`);
    if (!surface?.invocation) errors.push(`${capability.id} missing ${host} invocation`);
  }
}

const canonicalMain = read('core/hakim-skill/SKILL.md');
for (const id of CAPABILITY_IDS) {
  if (!canonicalMain.includes(`| \`${id}\` |`)) errors.push(`canonical capability table missing ${id}`);
}
for (const phrase of ['repository-hosted native plugin marketplaces', 'OpenCode uses', 'Host-native installation']) {
  if (!canonicalMain.includes(phrase)) errors.push(`canonical native distribution truth missing: ${phrase}`);
}

for (const id of CAPABILITY_IDS.slice(1)) {
  const canonicalPath = `core/hakim-skill/skills/${id}/SKILL.md`;
  const canonical = read(canonicalPath);
  if (parseSkillName(canonical) !== id) errors.push(`${canonicalPath} name mismatch`);

  for (const host of EXACT_ADJUNCT_HOSTS) {
    const hostPath = `plugins/${host}/skills/${id}/SKILL.md`;
    if (!exists(hostPath)) errors.push(`${hostPath} missing`);
    else if (read(hostPath) !== canonical) errors.push(`${host} ${id} canonical projection drift`);
  }

  const claudePath = `plugins/claude-code/skills/${id}/SKILL.md`;
  if (!exists(claudePath)) errors.push(`${claudePath} missing`);
  else {
    const text = read(claudePath);
    if (parseSkillName(text) !== id) errors.push(`Claude ${id} name mismatch`);
    if (!text.includes('user-invocable: false')) errors.push(`Claude ${id} must remain hidden from duplicate slash-menu exposure`);
  }
}

const mainSkills = [
  ['codex', read('plugins/codex/skills/hakim/SKILL.md')],
  ['claude-code', read('plugins/claude-code/skills/hakim/SKILL.md')],
  ['github-copilot', read('plugins/copilot/skills/hakim/SKILL.md')],
];
for (const [host, text] of mainSkills) {
  if (parseSkillName(text) !== 'hakim') errors.push(`${host} main skill name mismatch`);
  for (const phrase of ['stdlib', 'native', 'dependency', 'minimum']) {
    if (!text.toLowerCase().includes(phrase)) errors.push(`${host} main skill missing Hakim ladder phrase: ${phrase}`);
  }
}
if (!mainSkills[1][1].includes('user-invocable: false')) errors.push('Claude canonical hakim skill must remain hidden from duplicate slash-menu exposure');

const copilotInstructions = read('.github/copilot-instructions.md');
for (const id of CAPABILITY_IDS) {
  if (!copilotInstructions.includes(`\`${id}\``)) errors.push(`Copilot baseline missing capability ${id}`);
}
if (!copilotInstructions.includes('native `hakim` Copilot plugin')) errors.push('Copilot baseline must prefer the native plugin when installed');
if (!copilotInstructions.includes('not universal slash-command claims')) errors.push('Copilot baseline must preserve host-specific invocation boundary');

const gainPaths = [
  'core/hakim-skill/skills/hakim-gain/SKILL.md',
  'plugins/codex/skills/hakim-gain/SKILL.md',
  'plugins/claude-code/skills/hakim-gain/SKILL.md',
  'plugins/copilot/skills/hakim-gain/SKILL.md',
];
const forbiddenGainPatterns = [/-54%/i, /-22%/i, /-20%/i, /-27%/i, /100%\s+(?:safe|safety)/i, /statistically significant/i, /p\s*<\s*0\.001/i];
for (const relative of gainPaths) {
  const text = read(relative);
  if (!text.includes('NOT_ESTABLISHED')) errors.push(`${relative} missing NOT_ESTABLISHED evidence boundary`);
  for (const pattern of forbiddenGainPatterns) if (pattern.test(text)) errors.push(`${relative} contains withdrawn benchmark claim: ${pattern}`);
}

for (const relative of [
  'core/hakim-skill/skills/hakim-review/SKILL.md',
  'plugins/codex/skills/hakim-review/SKILL.md',
  'plugins/claude-code/skills/hakim-review/SKILL.md',
  'plugins/copilot/skills/hakim-review/SKILL.md',
]) {
  const text = read(relative);
  for (const required of ['git diff --no-ext-diff --', 'git diff --cached --no-ext-diff --', 'no current diff exists']) {
    if (!text.includes(required)) errors.push(`${relative} missing diff-scope rule: ${required}`);
  }
  if (!text.includes('Do not silently substitute `HEAD~1`')) errors.push(`${relative} missing HEAD~1 refusal`);
}

for (const relative of [
  'core/hakim-skill/skills/hakim-audit/SKILL.md',
  'plugins/codex/skills/hakim-audit/SKILL.md',
  'plugins/claude-code/skills/hakim-audit/SKILL.md',
  'plugins/copilot/skills/hakim-audit/SKILL.md',
]) {
  const text = read(relative);
  for (const required of ['Python heuristic scan', 'known-third-party-import-review', 'too-many-positional-parameters', 'PROVENANCE_LABEL_ONLY', 'NOT_PERFORMED']) {
    if (!text.includes(required)) errors.push(`${relative} missing audit coverage boundary: ${required}`);
  }
  if (!text.includes('Do not use `npm run audit:ci` for a read-only request')) errors.push(`${relative} missing read-only artifact-write refusal`);
}

for (const relative of [
  'core/hakim-skill/skills/hakim-help/SKILL.md',
  'plugins/codex/skills/hakim-help/SKILL.md',
  'plugins/claude-code/skills/hakim-help/SKILL.md',
  'plugins/copilot/skills/hakim-help/SKILL.md',
]) {
  const text = read(relative);
  for (const id of CAPABILITY_IDS) if (!text.includes(`\`${id}\``)) errors.push(`${relative} help surface missing ${id}`);
  if (!text.includes('NOT_ESTABLISHED')) errors.push(`${relative} help surface missing evidence boundary`);
}

const opencode = read('plugins/opencode/hakim.mjs');
if (!opencode.includes('const NATIVE_SKILL_MANIFEST = Object.freeze([')) errors.push('OpenCode native skill manifest missing');
if (!opencode.includes('export const createHakimPlugin = async')) errors.push('OpenCode plugin export missing');
for (const id of CAPABILITY_IDS) if (!opencode.includes(`capability_id: '${id}'`)) errors.push(`OpenCode missing capability ${id}`);
for (const marker of ['lazy_strength: 100', "intensity: 'ultra'", "intensity: 'off'", 'read_only: true', 'write_capable: true']) {
  if (!opencode.includes(marker)) errors.push(`OpenCode policy-profile binding missing: ${marker}`);
}

const result = {
  capabilities: CAPABILITY_IDS,
  exact_projection_hosts: EXACT_ADJUNCT_HOSTS,
  native_hosts: ['codex', 'claude-code', 'github-copilot', 'opencode'],
  capability_registry: 'core/hakim-skill/capabilities.json',
  status: errors.length === 0 ? 'PASS' : 'FAIL',
  errors,
};
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
