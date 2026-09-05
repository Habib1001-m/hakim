#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGENTS_DIR = path.join(ROOT, 'plugins', 'codex', 'agents');

const EXPECTED = [
  { file: 'hakim_reviewer.toml', name: 'hakim_reviewer', capability: 'review', readOnlyIntent: true },
  { file: 'hakim_auditor.toml', name: 'hakim_auditor', capability: 'audit', readOnlyIntent: true },
  { file: 'hakim_debt_analyst.toml', name: 'hakim_debt_analyst', capability: 'debt', readOnlyIntent: true },
  { file: 'hakim_evidence_verifier.toml', name: 'hakim_evidence_verifier', capability: 'status', readOnlyIntent: true },
  { file: 'hakim_implementer.toml', name: 'hakim_implementer', capability: 'hakim', readOnlyIntent: false },
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function parseSingleLineString(text, key, relativePath) {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']\\s*$`, 'm'));
  assert.ok(match, `${relativePath} must define ${key} as a non-empty single-line string`);
  return match[1].trim();
}

function parseDeveloperInstructions(text, relativePath) {
  const triple = text.match(/^developer_instructions\s*=\s*"""([\s\S]*?)"""\s*$/m);
  if (triple) return triple[1].trim();
  const single = text.match(/^developer_instructions\s*=\s*"([^"]+)"\s*$/m);
  assert.ok(single, `${relativePath} must define non-empty developer_instructions`);
  return single[1].trim();
}

test('Codex exposes exactly five Hakim-owned custom-agent TOML projections', () => {
  const actual = fs.existsSync(AGENTS_DIR)
    ? fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() || entry.isSymbolicLink())
        .map((entry) => entry.name)
        .filter((name) => name.endsWith('.toml'))
        .sort()
    : [];
  assert.deepEqual(actual, EXPECTED.map((entry) => entry.file).sort());
});

for (const expected of EXPECTED) {
  const relativePath = `plugins/codex/agents/${expected.file}`;
  test(`${expected.name} is a regular, thin, trigger-oriented native Codex role`, (t) => {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
      t.skip(`${relativePath} is intentionally absent in the RED phase`);
      return;
    }

    const stat = fs.lstatSync(absolutePath);
    assert.equal(stat.isSymbolicLink(), false, `${relativePath} must not be a symlink`);
    assert.equal(stat.isFile(), true, `${relativePath} must be a regular file`);

    const text = read(relativePath);
    assert.equal(parseSingleLineString(text, 'name', relativePath), expected.name);

    const description = parseSingleLineString(text, 'description', relativePath);
    assert.match(description, /\bUse when\b/i, `${relativePath} description must tell Codex when to delegate`);

    const instructions = parseDeveloperInstructions(text, relativePath);
    assert.match(
      instructions,
      new RegExp(`\\$hakim:${expected.capability}\\b`, 'i'),
      `${relativePath} must route through the canonical Hakim ${expected.capability} skill`,
    );
    assert.match(
      instructions,
      /HAKIM_PLUGIN_SKILL_UNAVAILABLE/,
      `${relativePath} must fail closed when the expected Hakim skill is unavailable`,
    );
    assert.match(
      instructions,
      /do not (?:substitute|approximate|fallback|fall back)/i,
      `${relativePath} must not silently substitute generic behavior`,
    );
    assert.doesNotMatch(
      text,
      /## (?:Scope contract|Audit contract|Evidence rule|The 7-level decision ladder)/i,
      `${relativePath} must remain a thin execution context instead of duplicating the skill contract`,
    );

    for (const forbidden of ['model', 'model_reasoning_effort', 'service_tier', 'personality', 'sandbox_mode']) {
      assert.doesNotMatch(
        text,
        new RegExp(`^${forbidden}\\s*=`, 'm'),
        `${relativePath} must inherit parent/user ${forbidden} instead of pinning hidden policy`,
      );
    }

    if (expected.readOnlyIntent) {
      assert.match(
        instructions,
        /\bread[- ]only\b/i,
        `${relativePath} must state read-only intent without claiming stronger host enforcement`,
      );
      assert.match(
        instructions,
        /evidence gap[\s\S]{0,240}\bparent\b/i,
        `${relativePath} must return shell/runtime-only evidence gaps to the parent`,
      );
      assert.match(
        instructions,
        /parent (?:authority|permissions?|sandbox|approval)/i,
        `${relativePath} must acknowledge inherited parent authority`,
      );
    } else {
      for (const mode of ['lite', 'full', 'ultra', 'off']) {
        assert.match(
          instructions,
          new RegExp(`\\b${mode}\\b`, 'i'),
          `${relativePath} must preserve Hakim mode ${mode}`,
        );
      }
      assert.match(
        instructions,
        /parent (?:authority|permissions?|sandbox|approval)/i,
        `${relativePath} must not claim authority beyond the parent session`,
      );
    }
  });
}

console.log('test_codex_agent_projection_contract.mjs: RED contract loaded');
