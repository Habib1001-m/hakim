import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SUPPORTED_HOSTS,
  buildPlan,
  compareCopilotTarget,
  formatText,
  inspectClaude,
  inspectCodex,
  inspectOpenCode,
  parseArgs,
} from '../scripts/hakim_install_plan.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceCopilot = path.join(repoRoot, '.github', 'copilot-instructions.md');
const expectedVersion = fs.readFileSync(path.join(repoRoot, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();

assert.deepEqual(SUPPORTED_HOSTS, ['codex', 'claude-code', 'github-copilot', 'opencode']);
assert.deepEqual(parseArgs([]), { host: 'all', target: null, json: false, help: false });
assert.deepEqual(parseArgs(['--host', 'codex', '--json']), { host: 'codex', target: null, json: true, help: false });
assert.deepEqual(parseArgs(['--host=github-copilot', '--target=/tmp/example']), {
  host: 'github-copilot',
  target: '/tmp/example',
  json: false,
  help: false,
});
assert.deepEqual(parseArgs(['--host=opencode', '--target=/tmp/example']), {
  host: 'opencode',
  target: '/tmp/example',
  json: false,
  help: false,
});
assert.throws(() => parseArgs(['--host', 'unknown']), /unsupported host/);
assert.throws(() => parseArgs(['--host', 'codex', '--target', '/tmp/example']), /supported only/);
assert.throws(() => parseArgs(['--target']), /requires a path/);

const codex = inspectCodex(repoRoot, expectedVersion);
assert.equal(codex.status, 'PASS');
assert.equal(codex.distribution_mode, 'LOCAL_MARKETPLACE_UI');
assert.equal(codex.persistent_installation, 'NOT_CLAIMED');
assert.equal(codex.automatic_changes, false);

const claude = inspectClaude(repoRoot, expectedVersion);
assert.equal(claude.status, 'PASS');
assert.equal(claude.distribution_mode, 'DIRECT_PLUGIN_DIR');
assert.match(claude.invocation, /claude --plugin-dir/);
assert.equal(claude.automatic_changes, false);

const opencodeNoTarget = inspectOpenCode(null, repoRoot);
assert.equal(opencodeNoTarget.status, 'PASS');
assert.equal(opencodeNoTarget.distribution_mode, 'PROJECT_LOCAL_INSTALLER');
assert.equal(opencodeNoTarget.target_state, 'NOT_COMPARED');
assert.match(opencodeNoTarget.next_safe_action, /install:opencode/);

const noTarget = compareCopilotTarget(null, repoRoot);
assert.equal(noTarget.target_state, 'NOT_COMPARED');
assert.match(noTarget.source_sha256, /^[a-f0-9]{64}$/);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-install-plan-'));
try {
  const absent = compareCopilotTarget(tempRoot, repoRoot);
  assert.equal(absent.target_state, 'ABSENT');
  assert.equal(fs.existsSync(path.join(tempRoot, '.github', 'copilot-instructions.md')), false);

  const opencodeAbsent = inspectOpenCode(tempRoot, repoRoot);
  assert.equal(opencodeAbsent.status, 'PASS');
  assert.equal(opencodeAbsent.target_state, 'ABSENT');
  assert.equal(opencodeAbsent.automatic_changes, false);
  assert.match(opencodeAbsent.next_safe_action, /--apply after review/);

  const targetFile = path.join(tempRoot, '.github', 'copilot-instructions.md');
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.copyFileSync(sourceCopilot, targetFile);
  const match = compareCopilotTarget(tempRoot, repoRoot);
  assert.equal(match.target_state, 'MATCH');
  assert.equal(match.source_sha256, match.target_sha256);

  fs.appendFileSync(targetFile, '\n# local target addition\n');
  const diff = compareCopilotTarget(tempRoot, repoRoot);
  assert.equal(diff.target_state, 'DIFF');
  assert.notEqual(diff.source_sha256, diff.target_sha256);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const plan = buildPlan({ host: 'all', target: null, json: false, help: false }, repoRoot);
assert.equal(plan.mode, 'READ_ONLY');
assert.equal(plan.mutation_performed, false);
assert.equal(plan.hakim_version, expectedVersion);
assert.equal(plan.overall_status, 'PASS');
assert.equal(plan.persistent_installation_claimed, false);
assert.equal(plan.plans.length, 4);
assert.match(formatText(plan), /MUTATION_PERFORMED=NO/);
assert.match(formatText(plan), /\[github-copilot\]/);
assert.match(formatText(plan), /\[opencode\]/);
assert.match(formatText(plan), /TARGET_STATE=NOT_COMPARED/);

const cli = spawnSync(process.execPath, ['scripts/hakim_install_plan.mjs', '--host', 'all', '--json'], {
  cwd: repoRoot,
  encoding: 'utf8',
});
assert.equal(cli.status, 0, cli.stderr);
const cliPlan = JSON.parse(cli.stdout);
assert.equal(cliPlan.overall_status, 'PASS');
assert.equal(cliPlan.plans.length, 4);
assert.equal(cliPlan.mutation_performed, false);
assert.equal(cliPlan.hakim_version, expectedVersion);

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['plan:install'], 'node scripts/hakim_install_plan.mjs');
assert.equal(packageJson.scripts['plan:install:json'], 'node scripts/hakim_install_plan.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_install_plan\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_install_plan\.mjs/);

console.log('read-only Hakim installation planning covers Codex, Claude Code, Copilot, and OpenCode targets');
