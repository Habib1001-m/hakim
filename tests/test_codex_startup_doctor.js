'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const hook = path.join(root, 'plugins/codex/hooks/session_start.mjs');

const result = spawnSync(process.execPath, [hook], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    PLUGIN_ROOT: path.join(root, 'plugins/codex'),
    HAKIM_DEFAULT_MODE: 'full',
  },
});

assert.equal(result.status, 0, result.stderr || result.stdout);
const context = result.stdout.trim();

assert.match(context, /Hakim .* is active in full mode/i);
assert.match(
  context,
  /apply .*automatically.*coding work.*without requiring an explicit Hakim invocation/is,
  'Codex SessionStart must make the core Hakim policy plug-and-play',
);
assert.match(
  context,
  /Does this need to exist\?/i,
  'Codex SessionStart must expose the maintained decision ladder before the first model decision',
);
assert.match(
  context,
  /Baseline discovery is read-only by default/i,
  'Codex SessionStart must expose baseline purity without requiring a manual skill invocation',
);
assert.doesNotMatch(
  context,
  /must .*invoke .*hakim.* before .*mutation/i,
  'Codex core behavior must not depend on explicit activation',
);
assert.ok(Buffer.byteLength(context, 'utf8') <= 9000, 'Codex SessionStart context must stay bounded');

console.log('test_codex_startup_doctor.js: Codex plug-and-play runtime kernel contract ok');
