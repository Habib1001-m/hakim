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
    canonical_hash: canonicalHash,
    expected_version: expectedVersion,
    native_install: 'copilot plugin marketplace add Habib1001-m/hakim && copilot plugin install hakim@hakim',
    skills: SKILLS,
    agents: ALL_AGENTS,
    baseline_role: 'FALLBACK_ONLY',
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
