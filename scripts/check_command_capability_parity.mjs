#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
const errors = [];
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const nameOf = (text) => text.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim() || null;
const requireText = (text, terms, label) => {
  for (const term of terms) if (!text.includes(term)) errors.push(`${label} missing: ${term}`);
};

const registry = JSON.parse(read('core/hakim-skill/capabilities.json'));
if (JSON.stringify(registry.capabilities.map((x) => x.id)) !== JSON.stringify(IDS)) errors.push('capability registry mismatch');
for (const capability of registry.capabilities) {
  if (!capability.canonical_path || !exists(capability.canonical_path)) errors.push(`${capability.id} canonical path missing`);
  for (const host of ['codex', 'claude-code', 'github-copilot', 'opencode']) {
    const surface = capability.hosts?.[host];
    if (!surface?.path || !exists(surface.path)) errors.push(`${capability.id} missing ${host} product path`);
    if (!surface?.invocation) errors.push(`${capability.id} missing ${host} invocation`);
  }
}

const canonicalMain = read('core/hakim-skill/SKILL.md');
for (const id of IDS) if (!canonicalMain.includes(`| \`${id}\` |`)) errors.push(`canonical capability table missing ${id}`);
requireText(canonicalMain, ['repository-hosted native plugin marketplaces', 'OpenCode uses', 'Host-native installation'], 'canonical native distribution truth');

for (const id of IDS.slice(1)) {
  const canonicalPath = `core/hakim-skill/skills/${id}/SKILL.md`;
  const canonical = read(canonicalPath);
  if (nameOf(canonical) !== id) errors.push(`${canonicalPath} name mismatch`);
  for (const host of ['codex', 'copilot']) {
    const hostPath = `plugins/${host}/skills/${id}/SKILL.md`;
    if (!exists(hostPath) || read(hostPath) !== canonical) errors.push(`${host} ${id} canonical projection drift`);
  }
  const claudePath = `plugins/claude-code/skills/${id}/SKILL.md`;
  if (!exists(claudePath)) errors.push(`${claudePath} missing`);
  else {
    const text = read(claudePath);
    if (nameOf(text) !== id) errors.push(`Claude ${id} name mismatch`);
    if (!text.includes('user-invocable: false')) errors.push(`Claude ${id} visibility drift`);
  }
}

for (const [host, file] of [
  ['codex', 'plugins/codex/skills/hakim/SKILL.md'],
  ['claude-code', 'plugins/claude-code/skills/hakim/SKILL.md'],
  ['github-copilot', 'plugins/copilot/skills/hakim/SKILL.md'],
]) {
  const text = read(file);
  if (nameOf(text) !== 'hakim') errors.push(`${host} main skill name mismatch`);
  for (const phrase of ['stdlib', 'native', 'dependency', 'minimum']) if (!text.toLowerCase().includes(phrase)) errors.push(`${host} main skill missing ${phrase}`);
  if (host === 'claude-code' && !text.includes('user-invocable: false')) errors.push('Claude main skill visibility drift');
}

const copilotBaseline = read('.github/copilot-instructions.md');
for (const id of IDS) if (!copilotBaseline.includes(`\`${id}\``)) errors.push(`Copilot baseline missing ${id}`);
requireText(copilotBaseline, ['native `hakim` Copilot plugin', 'not universal slash-command claims'], 'Copilot baseline');

for (const file of [
  'core/hakim-skill/skills/hakim-gain/SKILL.md', 'plugins/codex/skills/hakim-gain/SKILL.md',
  'plugins/claude-code/skills/hakim-gain/SKILL.md', 'plugins/copilot/skills/hakim-gain/SKILL.md',
]) {
  const text = read(file);
  if (!text.includes('NOT_ESTABLISHED')) errors.push(`${file} missing NOT_ESTABLISHED`);
  for (const pattern of [/-54%/i, /-22%/i, /-20%/i, /-27%/i, /100%\s+(?:safe|safety)/i, /statistically significant/i, /p\s*<\s*0\.001/i]) {
    if (pattern.test(text)) errors.push(`${file} contains withdrawn benchmark claim`);
  }
}

for (const file of [
  'core/hakim-skill/skills/hakim-review/SKILL.md', 'plugins/codex/skills/hakim-review/SKILL.md',
  'plugins/claude-code/skills/hakim-review/SKILL.md', 'plugins/copilot/skills/hakim-review/SKILL.md',
]) requireText(read(file), ['git diff --no-ext-diff --', 'git diff --cached --no-ext-diff --', 'no current diff exists', 'Do not silently substitute `HEAD~1`'], file);

for (const file of [
  'core/hakim-skill/skills/hakim-audit/SKILL.md', 'plugins/codex/skills/hakim-audit/SKILL.md',
  'plugins/claude-code/skills/hakim-audit/SKILL.md', 'plugins/copilot/skills/hakim-audit/SKILL.md',
]) {
  const text = read(file);
  requireText(text, ['Python heuristic scan', 'known-third-party-import-review', 'too-many-positional-parameters', 'PROVENANCE_LABEL_ONLY', 'NOT_PERFORMED', 'Keep any helper output on stdout or outside the target repository'], file);
  if (text.includes('npm run audit:ci')) errors.push(`${file} contains source-repository-only audit command`);
}

for (const file of [
  'core/hakim-skill/skills/hakim-help/SKILL.md', 'plugins/codex/skills/hakim-help/SKILL.md',
  'plugins/claude-code/skills/hakim-help/SKILL.md', 'plugins/copilot/skills/hakim-help/SKILL.md',
]) {
  const text = read(file);
  for (const id of IDS) if (!text.includes(`\`${id}\``)) errors.push(`${file} help surface missing ${id}`);
  if (!text.includes('NOT_ESTABLISHED')) errors.push(`${file} help surface missing evidence boundary`);
}

const opencode = read('plugins/opencode/hakim.mjs');
requireText(opencode, [
  'function loadCapabilities(capabilitiesPath)', 'config.command[capability.id] = commandDefinition(capability)',
  'config.skills.paths.push(bundle.skillsDir)', "'command.execute.before'", "'experimental.chat.system.transform'",
  'loader.getRules(mode, { skillPath: bundle.skillPath })', "const VALID_MODES = new Set(['lite', 'full', 'ultra', 'off'])",
  "event?.type !== 'session.deleted'",
], 'OpenCode native capability contract');
if (opencode.includes('const NATIVE_SKILL_MANIFEST = Object.freeze([')) errors.push('OpenCode embedded native-skill manifest restored');

console.log(JSON.stringify({
  capabilities: IDS,
  exact_projection_hosts: ['codex', 'copilot'],
  native_hosts: ['codex', 'claude-code', 'github-copilot', 'opencode'],
  capability_registry: 'core/hakim-skill/capabilities.json',
  opencode_capability_loading: 'REGISTRY_DRIVEN',
  status: errors.length ? 'FAIL' : 'PASS',
  errors,
}, null, 2));
process.exit(errors.length ? 1 : 0);
