#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = fs.readFileSync(path.join(ROOT, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();

const packed = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: ROOT,
  encoding: 'utf8',
  env: {
    ...process.env,
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  },
});
assert.equal(packed.status, 0, packed.stderr || packed.stdout);

let packReport;
try {
  packReport = JSON.parse(packed.stdout);
} catch (error) {
  throw new Error(`npm pack did not return JSON: ${error.message}\nSTDOUT:\n${packed.stdout}\nSTDERR:\n${packed.stderr}`);
}
assert.ok(Array.isArray(packReport) && packReport.length === 1);
const packedPaths = new Set(packReport[0].files.map((entry) => entry.path));

for (const required of [
  'package.json',
  'scripts/hakim_opencode_cli.mjs',
  'scripts/hakim_opencode_install.mjs',
  'scripts/hakim_opencode_remove.mjs',
  'scripts/lib/opencode_bundle.mjs',
  'scripts/lib/opencode_prior_manifests.mjs',
  'scripts/lib/opencode_transaction.mjs',
  'plugins/opencode/hakim.mjs',
  'core/loaders/hakim-loader.mjs',
  'core/hakim-skill/VERSION',
  'core/hakim-skill/SKILL.md',
  'core/hakim-skill/capabilities.json',
  'core/hakim-skill/skills/review/SKILL.md',
  'core/hakim-skill/skills/audit/SKILL.md',
  'core/hakim-skill/skills/debt/SKILL.md',
  'core/hakim-skill/skills/status/SKILL.md',
  'core/hakim-skill/skills/help/SKILL.md',
]) {
  assert.ok(packedPaths.has(required), `Git-backed bootstrap package missing ${required}`);
}

for (const legacy of [
  'core/hakim-skill/skills/hakim-review/SKILL.md',
  'core/hakim-skill/skills/hakim-audit/SKILL.md',
  'core/hakim-skill/skills/hakim-debt/SKILL.md',
  'core/hakim-skill/skills/hakim-gain/SKILL.md',
  'core/hakim-skill/skills/hakim-help/SKILL.md',
]) {
  assert.equal(packedPaths.has(legacy), false, `Git-backed bootstrap package must not contain legacy skill ${legacy}`);
}

for (const forbiddenPrefix of ['tests/', 'docs/', '.github/', 'plugins/codex/', 'plugins/claude-code/', 'plugins/copilot/']) {
  assert.ok(![...packedPaths].some((entry) => entry.startsWith(forbiddenPrefix)), `bootstrap package contains unrelated ${forbiddenPrefix} content`);
}

console.log(`test_hakim_opencode_package_surface.mjs: npm pack surface ok for ${VERSION}; files=${packedPaths.size}; npm=${process.env.npm_config_user_agent || 'unknown'}`);
