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
  inspectCopilot,
  inspectOpenCode,
  parseArgs,
} from '../scripts/hakim_install_plan.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceCopilot = path.join(repoRoot, '.github', 'copilot-instructions.md');
const expectedVersion = fs.readFileSync(path.join(repoRoot, 'core/hakim-skill/VERSION'), 'utf8').trim();

assert.deepEqual(SUPPORTED_HOSTS, ['codex', 'claude-code', 'github-copilot', 'opencode']);
assert.deepEqual(parseArgs([]), { host: 'all', target: null, json: false, help: false });
assert.deepEqual(parseArgs(['--host', 'codex', '--json']), { host: 'codex', target: null, json: true, help: false });
assert.deepEqual(parseArgs(['--host=github-copilot', '--target=/tmp/example']), { host: 'github-copilot', target: '/tmp/example', json: false, help: false });
assert.deepEqual(parseArgs(['--host=opencode', '--target=/tmp/example']), { host: 'opencode', target: '/tmp/example', json: false, help: false });
assert.throws(() => parseArgs(['--host', 'unknown']), /unsupported host/);
assert.throws(() => parseArgs(['--host', 'codex', '--target', '/tmp/example']), /supported only/);
assert.throws(() => parseArgs(['--target']), /requires a path/);

const codex = inspectCodex(repoRoot, expectedVersion);
assert.equal(codex.status, 'PASS');
assert.equal(codex.support_boundary, 'HOST_NATIVE_PLUGIN');
assert.equal(codex.distribution_mode, 'NATIVE_GIT_MARKETPLACE');
assert.equal(codex.target_state, 'READY_FOR_NATIVE_INSTALL');
assert.equal(codex.persistent_installation, 'SUPPORTED_BY_HOST');
assert.equal(codex.install_identity, 'hakim@hakim');
assert.match(codex.invocation, /codex plugin marketplace add Habib1001-m\/hakim/);
assert.match(codex.next_safe_action, /open \/plugins/);

const claude = inspectClaude(repoRoot, expectedVersion);
assert.equal(claude.status, 'PASS');
assert.equal(claude.support_boundary, 'HOST_NATIVE_PLUGIN');
assert.equal(claude.distribution_mode, 'NATIVE_MARKETPLACE');
assert.equal(claude.target_state, 'READY_FOR_NATIVE_INSTALL');
assert.equal(claude.persistent_installation, 'SUPPORTED_BY_HOST');
assert.match(claude.invocation, /claude plugin marketplace add Habib1001-m\/hakim/);
assert.match(claude.invocation, /claude plugin install hakim@hakim/);
assert.deepEqual(claude.native_user_skills, ['full', 'review', 'audit', 'debt', 'gain', 'help']);
assert.deepEqual(claude.native_agents, ['hakim-reviewer', 'hakim-auditor', 'hakim-debt-analyst', 'hakim-evidence-verifier', 'hakim-implementer']);

const copilot = inspectCopilot(null, repoRoot, expectedVersion);
assert.equal(copilot.status, 'PASS');
assert.equal(copilot.support_boundary, 'HOST_NATIVE_PLUGIN');
assert.equal(copilot.distribution_mode, 'NATIVE_MARKETPLACE');
assert.equal(copilot.target_state, 'READY_FOR_NATIVE_INSTALL');
assert.equal(copilot.persistent_installation, 'SUPPORTED_BY_HOST');
assert.equal(copilot.install_identity, 'hakim@hakim');
assert.equal(copilot.baseline_role, 'OPTIONAL_FALLBACK');
assert.match(copilot.invocation, /copilot plugin marketplace add Habib1001-m\/hakim/);
assert.match(copilot.invocation, /copilot plugin install hakim@hakim/);
assert.deepEqual(copilot.native_skills, ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help']);
assert.deepEqual(copilot.native_agents, ['hakim-reviewer', 'hakim-auditor', 'hakim-debt-analyst', 'hakim-evidence-verifier', 'hakim-implementer']);

const opencodeNoTarget = inspectOpenCode(null, repoRoot);
assert.equal(opencodeNoTarget.status, 'PASS');
assert.equal(opencodeNoTarget.distribution_mode, 'PROJECT_LOCAL_INSTALLER');
assert.equal(opencodeNoTarget.target_state, 'NOT_COMPARED');
assert.match(opencodeNoTarget.next_safe_action, /install:opencode/);

const noTarget = compareCopilotTarget(null, repoRoot);
assert.equal(noTarget.target_state, 'NOT_COMPARED');
assert.match(noTarget.source_sha256, /^[a-f0-9]{64}$/);
assert.match(noTarget.next_safe_action, /Native plugin installation does not require copying/);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-install-plan-'));
try {
  const absent = compareCopilotTarget(tempRoot, repoRoot);
  assert.equal(absent.target_state, 'ABSENT');
  assert.match(absent.next_safe_action, /Native plugin installation can proceed/);
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
assert.equal(plan.plans.length, 4);
const formatted = formatText(plan);
assert.match(formatted, /MUTATION_PERFORMED=NO/);
assert.match(formatted, /\[codex\]/);
assert.match(formatted, /MODE=NATIVE_GIT_MARKETPLACE/);
assert.match(formatted, /\[claude-code\]/);
assert.match(formatted, /MODE=NATIVE_MARKETPLACE/);
assert.match(formatted, /\[github-copilot\]/);
assert.match(formatted, /copilot plugin install hakim@hakim/);
assert.match(formatted, /INSTALL_IDENTITY=hakim@hakim/);
assert.match(formatted, /\[opencode\]/);

const cli = spawnSync(process.execPath, ['scripts/hakim_install_plan.mjs', '--host', 'all', '--json'], { cwd: repoRoot, encoding: 'utf8' });
assert.equal(cli.status, 0, cli.stderr);
const cliPlan = JSON.parse(cli.stdout);
assert.equal(cliPlan.overall_status, 'PASS');
assert.equal(cliPlan.plans.length, 4);
assert.equal(cliPlan.mutation_performed, false);
assert.equal(cliPlan.hakim_version, expectedVersion);
assert.equal(cliPlan.plans.find((item) => item.host === 'codex').distribution_mode, 'NATIVE_GIT_MARKETPLACE');
assert.equal(cliPlan.plans.find((item) => item.host === 'claude-code').distribution_mode, 'NATIVE_MARKETPLACE');
assert.equal(cliPlan.plans.find((item) => item.host === 'github-copilot').distribution_mode, 'NATIVE_MARKETPLACE');

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['plan:install'], 'node scripts/hakim_install_plan.mjs');
assert.equal(packageJson.scripts['plan:install:json'], 'node scripts/hakim_install_plan.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_install_plan\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_install_plan\.mjs/);

console.log('read-only Hakim installation planning covers native Codex, Claude, and Copilot marketplaces plus OpenCode project-local install');
