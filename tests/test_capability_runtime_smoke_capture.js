'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'capability_runtime_smoke_capture.sh');
const script = fs.readFileSync(scriptPath, 'utf8');

for (const host of ['codex', 'claude', 'copilot']) {
  assert.match(script, new RegExp(`\\b${host}\\b`), `missing ${host} smoke path`);
}

for (const capability of [
  'hakim-help',
  'hakim-review',
  'hakim-audit',
  'hakim-debt',
  'hakim-gain',
]) {
  assert.match(script, new RegExp(capability), `missing ${capability} runtime prompt`);
}

assert.match(script, /Do not invent performance or ROI numbers/);
assert.match(script, /does not drive an interactive host session automatically/);
assert.match(script, /HOST_RUNTIME_PASS=PENDING/);
assert.match(script, /No capability modified repository files without an explicit request/);
assert.match(script, /HAKIM_SMOKE_SKIP_PREFLIGHT/);
assert.doesNotMatch(script, /<<EOF/, 'all heredocs must be quoted to prevent markdown backtick execution');

const run = spawnSync('bash', [scriptPath, 'codex'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_SMOKE_SKIP_PREFLIGHT: '1' },
});

assert.equal(run.status, 0, run.stderr || run.stdout);
const match = run.stdout.match(/Capability runtime evidence packet created: (.+)/);
assert.ok(match, `packet path missing from output: ${run.stdout}`);

const packetDir = match[1].trim();
try {
  const transcript = fs.readFileSync(path.join(packetDir, 'OPERATOR_TRANSCRIPT.md'), 'utf8');
  const readme = fs.readFileSync(path.join(packetDir, 'README.md'), 'utf8');
  const prompts = fs.readFileSync(path.join(packetDir, 'PROMPTS.md'), 'utf8');

  assert.match(transcript, /^Host: codex\s+$/m);
  assert.match(transcript, /^HOST=codex$/m);
  assert.match(transcript, /^HOST_RUNTIME_PASS=PENDING$/m);
  assert.match(transcript, /Repository HEAD: see `git-head\.txt`/);
  assert.match(readme, /`OPERATOR_TRANSCRIPT\.md`/);
  assert.match(prompts, /```text\n@hakim-help\n```/);
} finally {
  fs.rmSync(packetDir, { recursive: true, force: true });
}

console.log('test_capability_runtime_smoke_capture.js: ok');
