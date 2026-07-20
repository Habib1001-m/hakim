#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const evidenceDir = process.env.HAKIM_SMOKE_EVIDENCE_DIR;
const configDir = process.env.OPENCODE_CONFIG_DIR;
const projectDir = process.env.HAKIM_SMOKE_PROJECT;
const reportPath = process.env.HAKIM_SMOKE_REPORT_PATH || path.join(evidenceDir || '.', 'opencode-smoke-report.json');

if (!evidenceDir || !configDir || !projectDir) {
  throw new Error('HAKIM_SMOKE_EVIDENCE_DIR, OPENCODE_CONFIG_DIR, and HAKIM_SMOKE_PROJECT are required');
}

function read(name) {
  return fs.readFileSync(path.join(evidenceDir, name), 'utf8');
}

function readJson(name) {
  return JSON.parse(read(name));
}

function sha256File(candidate) {
  return crypto.createHash('sha256').update(fs.readFileSync(candidate)).digest('hex');
}

const capabilityIds = ['hakim', 'hakim-help', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain'];
const versionText = read('opencode-version.txt').trim();
assert.match(versionText, /^1\.18\.3$/m, 'OpenCode version must be pinned to 1.18.3');

const install = readJson('hakim-install.json');
assert.equal(install.status, 'PASS');
assert.equal(install.state, 'INSTALLED');
assert.equal(install.source_checkout_required, false);
assert.equal(install.target_path_argument_required, false);
assert.equal(install.installed_file_count, 21);

const skillOutput = read('opencode-debug-skill.txt');
for (const id of capabilityIds) assert.match(skillOutput, new RegExp(`(^|[^a-z0-9-])${id}([^a-z0-9-]|$)`, 'i'), `missing discovered skill ${id}`);

const configOutput = read('opencode-debug-config.txt');
for (const id of capabilityIds) assert.match(configOutput, new RegExp(`(^|[^a-z0-9-])${id}([^a-z0-9-]|$)`, 'i'), `missing discovered command ${id}`);

const capture = readJson('provider-capture.json');
assert.ok(Array.isArray(capture.requests) && capture.requests.length >= 1, 'real OpenCode process must reach the provider');
const serializedRequests = JSON.stringify(capture.requests);
assert.match(serializedRequests, /Hakim activation|SMALLEST_SAFE_DIFF|smallest safe diff|evidence-bound/i, 'Hakim system injection was not observed at the provider boundary');
assert.match(serializedRequests, /hakim-help|hakim full|Review sample\.js/i, 'Hakim command context was not observed at the provider boundary');

const runOutput = `${read('opencode-run.stdout.txt')}\n${read('opencode-run.stderr.txt')}`;
assert.match(runOutput, /HAKIM_LIVE_SMOKE_OK/);
assert.match(runOutput, /HAKIM_SYSTEM_INSTRUCTIONS_OBSERVED=true/);
assert.match(runOutput, /HAKIM_COMMAND_CONTEXT_OBSERVED=true/);
assert.match(runOutput, /BOUNDED_RESULT=/);

const repeat = readJson('hakim-reinstall.json');
assert.equal(repeat.status, 'PASS');
assert.equal(repeat.state, 'ALREADY_MATCHES');
assert.equal(repeat.filesystem_changed, false);

const removal = readJson('hakim-remove.json');
assert.equal(removal.status, 'PASS');
assert.equal(removal.state, 'REMOVED');
assert.equal(removal.filesystem_changed, true);
assert.equal(fs.existsSync(path.join(configDir, '.hakim-install.json')), false);
assert.equal(fs.existsSync(path.join(configDir, 'unrelated.keep')), true);
assert.equal(read('opencode-config.before.sha256').trim(), read('opencode-config.after.sha256').trim());

const elapsed = Number(read('elapsed-seconds.txt').trim());
assert.ok(Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= 300, `smoke elapsed time exceeds five-minute contract: ${elapsed}`);

const tarballPath = read('tarball-path.txt').trim();
const tarballSha = sha256File(tarballPath);
assert.equal(tarballSha, read('tarball.sha256').trim());

const report = {
  status: 'PASS',
  classification: 'REAL_OPENCODE_PROCESS_WITH_DETERMINISTIC_LOCAL_PROVIDER',
  opencode_version: versionText,
  tarball_sha256: tarballSha,
  source_checkout_required_for_use: false,
  activation_command_count: 1,
  undocumented_manual_steps: 0,
  elapsed_seconds: elapsed,
  plugin_system_injection_observed: true,
  command_discovery_count: capabilityIds.length,
  skill_discovery_count: capabilityIds.length,
  provider_request_count: capture.requests.length,
  bounded_result_observed: true,
  model_quality_evaluated: false,
  repeat_install: 'ALREADY_MATCHES',
  removal: 'PASS',
  unrelated_state_preserved: true,
  opencode_json_unchanged: true,
  counts_as_external: false,
  counts_as_vibe_coder: false,
  counts_as_safe_removal: false,
  counts_as_accepted_opencode_live_journey: false,
  public_release_readiness: 'HOLD',
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
