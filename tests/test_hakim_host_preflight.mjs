import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildHostPreflight, formatText, parseArgs } from '../scripts/hakim_host_preflight.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-preflight-cwd-'));
const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-preflight-target-'));
const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-preflight-bin-'));
for (const binary of ['codex', 'claude']) fs.writeFileSync(path.join(binDir, binary), '#!/bin/sh\nexit 0\n', { mode: 0o755 });

const passingDoctor = { schema_version: 1, mode: 'READ_ONLY', scope: 'FAST', mutation_performed: false, repository_health: 'PASS', next_safe_action: 'Continue normal development.', checks: [] };
const failingDoctor = { ...passingDoctor, repository_health: 'FAIL', next_safe_action: 'Run the first failing doctor check directly.' };
const env = { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}` };

try {
  assert.deepEqual(parseArgs(['--host', 'codex']), { host: 'codex', target: null, cwd: null, binary: null, full: false, json: false, help: false, passthrough: [] });
  assert.deepEqual(parseArgs(['--host=claude-code', '--cwd', cwd, '--binary', 'claude', '--full', '--', '--model', 'opus']), {
    host: 'claude-code', target: null, cwd, binary: 'claude', full: true, json: false, help: false, passthrough: ['--model', 'opus'],
  });
  assert.deepEqual(parseArgs(['--host', 'github-copilot']), { host: 'github-copilot', target: null, cwd: null, binary: null, full: false, json: false, help: false, passthrough: [] });
  assert.throws(() => parseArgs([]), /--host must be one of/);
  assert.throws(() => parseArgs(['--host', 'github-copilot', '--cwd', cwd]), /not supported/);
  assert.throws(() => parseArgs(['--host', 'codex', '--target', target]), /baseline comparison/);
  assert.throws(() => parseArgs(['--host', 'codex', '--apply']), /read-only/);

  const codex = buildHostPreflight(parseArgs(['--host', 'codex', '--cwd', cwd, '--binary', 'codex', '--', '--model', 'gpt-5.6']), repoRoot, { doctorReport: passingDoctor, env });
  assert.equal(codex.overall_status, 'PASS');
  assert.equal(codex.schema_version, 2);
  assert.equal(codex.mode, 'READ_ONLY');
  assert.equal(codex.mutation_performed, false);
  assert.equal(codex.components.doctor, 'PASS');
  assert.equal(codex.components.install_plan, 'PASS');
  assert.equal(codex.components.host_surface, 'PASS');
  assert.equal(codex.host_surface.state, 'READY_TO_LAUNCH');
  assert.equal(codex.host_surface.execution_attempted, false);
  assert.deepEqual(codex.host_surface.argv, ['--model', 'gpt-5.6']);
  assert.match(formatText(codex), /HOST=codex/);
  assert.match(formatText(codex), /HOST_SURFACE_STATUS=PASS/);

  const claude = buildHostPreflight(parseArgs(['--host', 'claude-code', '--cwd', cwd, '--binary', 'claude']), repoRoot, { doctorReport: passingDoctor, env });
  assert.equal(claude.overall_status, 'PASS');
  assert.equal(claude.host_surface.state, 'READY_TO_LAUNCH');
  assert.equal(claude.host_surface.execution_attempted, false);

  const copilot = buildHostPreflight(parseArgs(['--host', 'github-copilot']), repoRoot, { doctorReport: passingDoctor, env });
  assert.equal(copilot.overall_status, 'PASS');
  assert.equal(copilot.host_surface.state, 'READY_FOR_NATIVE_INSTALL');
  assert.equal(copilot.host_surface.install_identity, 'hakim@hakim');
  assert.equal(copilot.host_surface.write_attempted, false);
  assert.equal(copilot.host_surface.filesystem_changed, false);

  const copilotWithBaseline = buildHostPreflight(parseArgs(['--host', 'github-copilot', '--target', target]), repoRoot, { doctorReport: passingDoctor, env });
  assert.equal(copilotWithBaseline.overall_status, 'PASS');
  assert.equal(copilotWithBaseline.host_surface.baseline_state, 'ABSENT');
  assert.equal(fs.existsSync(path.join(target, '.github', 'copilot-instructions.md')), false);

  const blocked = buildHostPreflight(parseArgs(['--host', 'codex', '--cwd', cwd, '--binary', 'codex']), repoRoot, { doctorReport: failingDoctor, env });
  assert.equal(blocked.overall_status, 'FAIL');
  assert.equal(blocked.components.doctor, 'FAIL');
  assert.equal(blocked.next_safe_action, failingDoctor.next_safe_action);

  const help = spawnSync(process.execPath, ['scripts/hakim_host_preflight.mjs', '--help'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /npm run preflight:host/);
  assert.match(help.stdout, /never applies, installs, launches/);
} finally {
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(binDir, { recursive: true, force: true });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
assert.equal(packageJson.scripts['preflight:host'], 'node scripts/hakim_host_preflight.mjs');
assert.equal(packageJson.scripts['preflight:host:json'], 'node scripts/hakim_host_preflight.mjs --json');
assert.match(packageJson.scripts['test:integration:js'], /tests\/test_hakim_host_preflight\.mjs/);
assert.match(packageJson.scripts['check:evidence-script'], /node --check scripts\/hakim_host_preflight\.mjs/);

console.log('native host preflight combines doctor, install plan, and read-only host-surface validation');
