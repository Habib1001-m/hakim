#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins', 'hermes');
const VERSION = fs.readFileSync(path.join(ROOT, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
const CAPABILITIES = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
const errors = [];

function read(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  try { return fs.readFileSync(absolute, 'utf8'); }
  catch (error) { errors.push(`cannot read ${relativePath}: ${error.message}`); return ''; }
}

const manifest = read('plugins/hermes/plugin.yaml');
const init = read('plugins/hermes/__init__.py');
const handoff = read('plugins/hermes/after-install.md');

for (const [pattern, message] of [
  [new RegExp(`^name:\\s*hakim\\s*$`, 'm'), 'Hermes plugin name must be hakim'],
  [new RegExp(`^version:\\s*${VERSION.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'm'), `Hermes plugin version must be ${VERSION}`],
  [/^kind:\s*standalone\s*$/m, 'Hermes plugin kind must be standalone'],
  [/provides_tools:\s*\[\s*\]/, 'Hermes plugin must register zero tools'],
  [/pre_llm_call/, 'Hermes manifest must declare pre_llm_call'],
  [/pre_gateway_dispatch/, 'Hermes manifest must declare pre_gateway_dispatch'],
]) {
  if (!pattern.test(manifest)) errors.push(message);
}

for (const capability of CAPABILITIES) {
  const pluginSkill = `plugins/hermes/skills/${capability}/SKILL.md`;
  const canonicalSkill = capability === 'hakim'
    ? 'core/hakim-skill/SKILL.md'
    : `core/hakim-skill/skills/${capability}/SKILL.md`;
  const pluginText = read(pluginSkill);
  const canonicalText = read(canonicalSkill);
  if (pluginText !== canonicalText) errors.push(`${pluginSkill} differs from ${canonicalSkill}`);
  if (!new RegExp(`^name:\\s*${capability.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'm').test(pluginText)) {
    errors.push(`${pluginSkill} frontmatter name mismatch`);
  }
  if (!init.includes(`"${capability}"`)) errors.push(`Hermes registration missing capability ${capability}`);
}

for (const command of CAPABILITIES) {
  if (!init.includes(`"${command}"`)) errors.push(`Hermes slash command missing: /${command}`);
}

for (const forbidden of ['register_tool(', 'register_cli_command(', 'register_middleware(', 'register_platform(', 'allow_tool_override', 'mcp']) {
  if (init.toLowerCase().includes(forbidden.toLowerCase())) errors.push(`Hermes plugin contains forbidden expansion surface: ${forbidden}`);
}

for (const required of [
  'ctx.register_skill',
  'ctx.register_command',
  'ctx.register_hook("pre_gateway_dispatch"',
  'ctx.register_hook("pre_llm_call"',
  'ctx.inject_message',
  '"action": "rewrite"',
  'skill_view',
]) {
  if (!init.includes(required)) errors.push(`Hermes native wiring missing: ${required}`);
}

for (const required of [
  'hermes plugins enable hakim',
  '/hakim-help',
  'no tools',
  'no MCP',
  'no built-in tool overrides',
]) {
  if (!handoff.toLowerCase().includes(required.toLowerCase())) errors.push(`Hermes after-install missing boundary: ${required}`);
}

const payload = {
  host: 'hermes',
  support_boundary: 'HOST_NATIVE_PLUGIN',
  distribution_mode: 'NATIVE_GIT_SUBDIRECTORY_PLUGIN',
  install_command: 'hermes plugins install Habib1001-m/hakim/plugins/hermes',
  install_and_enable_command: 'hermes plugins install Habib1001-m/hakim/plugins/hermes --enable',
  plugin_name: 'hakim',
  version: VERSION,
  skills: CAPABILITIES,
  slash_commands: CAPABILITIES.map((name) => `/${name}`),
  hooks: ['pre_gateway_dispatch', 'pre_llm_call'],
  tools: [],
  mcp_servers: [],
  builtin_tool_overrides: [],
  runtime_validation: 'NOT_PERFORMED',
  ok: errors.length === 0,
  errors,
};

if (process.argv.includes('--json')) console.log(JSON.stringify(payload, null, 2));
else if (payload.ok) console.log(`Hermes native plugin contract OK (${CAPABILITIES.length} skills, zero tools)`);
else {
  console.error('Hermes native plugin contract drift detected:');
  for (const error of errors) console.error(`- ${error}`);
}
process.exit(payload.ok ? 0 : 1);
