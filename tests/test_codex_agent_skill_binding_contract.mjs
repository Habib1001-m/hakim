#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_ROOT = path.join(ROOT, 'plugins', 'codex');
const LIFECYCLE = path.join(PLUGIN_ROOT, 'scripts', 'hakim_agents.mjs');

const AGENTS = [
  ['hakim_reviewer.toml', 'review'],
  ['hakim_auditor.toml', 'audit'],
  ['hakim_debt_analyst.toml', 'debt'],
  ['hakim_evidence_verifier.toml', 'status'],
  ['hakim_implementer.toml', 'hakim'],
];

function stripSkillFrontmatter(text, relativePath) {
  const normalized = text.replaceAll('\r\n', '\n');
  const match = normalized.match(/^---\n[\s\S]*?\n---\n([\s\S]+)$/);
  assert.ok(match, `${relativePath} must contain YAML frontmatter followed by a canonical skill body`);
  return match[1].trim();
}

function parseDeveloperInstructions(text, relativePath) {
  const triple = text.match(/^developer_instructions\s*=\s*"""([\s\S]*?)"""\s*$/m);
  if (triple) return triple[1].trim();

  const basic = text.match(/^developer_instructions\s*=\s*("(?:\\.|[^"\\])*")\s*$/m);
  assert.ok(basic, `${relativePath} must contain parseable developer_instructions`);
  return JSON.parse(basic[1]).trim();
}

test('Codex managed agent bundles embed their canonical Hakim skill bodies instead of relying on runtime skill-resource lookup', async () => {
  const { buildCodexAgentBundle } = await import(pathToFileURL(LIFECYCLE).href);
  const bundle = buildCodexAgentBundle(PLUGIN_ROOT);
  const byName = new Map(bundle.files.map((file) => [file.target_relative, file]));

  for (const [agentFile, capability] of AGENTS) {
    const skillRelative = `plugins/codex/skills/${capability}/SKILL.md`;
    const skillText = fs.readFileSync(path.join(ROOT, skillRelative), 'utf8');
    const canonicalBody = stripSkillFrontmatter(skillText, skillRelative);
    const projected = byName.get(agentFile);

    assert.ok(projected, `${agentFile} must be present in the managed Codex agent bundle`);
    const generated = Buffer.from(projected.bytes).toString('utf8');
    const instructions = parseDeveloperInstructions(generated, agentFile);

    assert.ok(
      instructions.includes(canonicalBody),
      `${agentFile} must embed the exact canonical ${capability} skill body so the child role does not depend on unsupported skill preload`,
    );
    assert.doesNotMatch(
      instructions,
      /(?:skill|resource|file|local):\/\//i,
      `${agentFile} must not depend on guessed skill/resource URI schemes`,
    );
    assert.doesNotMatch(
      instructions,
      /resources\/read/i,
      `${agentFile} must not depend on MCP resources/read to obtain its canonical contract`,
    );
    assert.match(
      instructions,
      new RegExp(`\\$hakim:${capability}\\b`, 'i'),
      `${agentFile} must retain the Hakim capability identity as its activation guard`,
    );
    assert.match(
      instructions,
      /HAKIM_PLUGIN_SKILL_UNAVAILABLE/,
      `${agentFile} must retain fail-closed behavior when the Hakim capability is no longer exposed by the host`,
    );
  }
});

console.log('test_codex_agent_skill_binding_contract.mjs: contract loaded');
