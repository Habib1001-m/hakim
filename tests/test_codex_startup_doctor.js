'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const doctor = path.join(root, 'scripts/codex_startup_doctor.sh');
const hooksPayload = JSON.stringify({
  hooks: {
    SessionStart: [
      {
        hooks: [
          {
            type: 'command',
            command: 'node ${PLUGIN_ROOT}/hooks/session_start.mjs',
          },
        ],
      },
    ],
  },
});

function snapshot(directory) {
  return fs.readdirSync(directory, { recursive: true }).sort();
}

function writePlugin(directory, version) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'plugin.json'),
    `${JSON.stringify({ name: 'hakim', version })}\n`,
  );
  fs.writeFileSync(path.join(directory, 'hooks.json'), `${hooksPayload}\n`);
}

function runDoctor(fixture) {
  const before = snapshot(fixture);
  const result = spawnSync('bash', [doctor], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CODEX_HOME: fixture },
  });
  const after = snapshot(fixture);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /MODE=READ_ONLY/);
  assert.match(result.stdout, /NO_AUTOMATIC_CLEANUP_PERFORMED=YES/);
  assert.deepEqual(after, before, 'startup doctor must not mutate CODEX_HOME');
  return result.stdout;
}

{
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-doctor-single-'));
  const plugin = path.join(fixture, 'plugins/cache/hakim');
  writePlugin(plugin, '1.0.0');

  const output = runDoctor(fixture);
  assert.match(output, /HAKIM_PLUGIN_MANIFEST_COUNT=1/);
  assert.match(output, /HAKIM_SESSIONSTART_REGISTRATION_COUNT=1/);
  assert.match(output, /HAKIM_SESSIONSTART_REFERENCE_COUNT=1/);
  assert.match(output, /STARTUP_DUPLICATION_STATUS=NOT_OBSERVED/);
  assert.match(output, /HAKIM_VERSION_STATUS=MATCH/);

  fs.rmSync(fixture, { recursive: true, force: true });
}

{
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-doctor-duplicate-'));
  writePlugin(path.join(fixture, 'plugins/cache/a'), '1.0.0');
  writePlugin(path.join(fixture, 'plugins/cache/b'), '1.0.0');

  const output = runDoctor(fixture);
  assert.match(output, /HAKIM_PLUGIN_MANIFEST_COUNT=2/);
  assert.match(output, /HAKIM_SESSIONSTART_REGISTRATION_COUNT=2/);
  assert.match(output, /STARTUP_DUPLICATION_STATUS=OBSERVED/);
  assert.match(output, /HAKIM_VERSION_STATUS=MATCH/);

  fs.rmSync(fixture, { recursive: true, force: true });
}

{
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-codex-doctor-stale-'));
  writePlugin(path.join(fixture, 'plugins/cache/hakim'), '1.0.0-phase-d.1');

  const output = runDoctor(fixture);
  assert.match(output, /HAKIM_PLUGIN_MANIFEST_COUNT=1/);
  assert.match(output, /HAKIM_SESSIONSTART_REGISTRATION_COUNT=1/);
  assert.match(output, /STARTUP_DUPLICATION_STATUS=NOT_OBSERVED/);
  assert.match(output, /HAKIM_PLUGIN_VERSIONS=1\.0\.0-phase-d\.1/);
  assert.match(output, /HAKIM_VERSION_STATUS=MISMATCH/);
  assert.match(output, /Do not delete cache files directly/);

  fs.rmSync(fixture, { recursive: true, force: true });
}

console.log('test_codex_startup_doctor.js: ok');
