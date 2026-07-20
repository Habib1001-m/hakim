'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-no-git-'));

try {
  const scriptsDir = path.join(temp, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.copyFileSync(
    path.join(root, 'scripts', 'generate_conformance_packets.mjs'),
    path.join(scriptsDir, 'generate_conformance_packets.mjs'),
  );

  const result = spawnSync(
    process.execPath,
    [path.join(scriptsDir, 'generate_conformance_packets.mjs')],
    { cwd: temp, encoding: 'utf8' },
  );

  assert.strictEqual(result.status, 2, result.stderr + result.stdout);
  assert.match(
    result.stderr,
    /requires a git repository \(run inside a git clone or working tree\)/,
  );
  assert.ok(!result.stderr.includes('AssertionError'));
  assert.ok(!result.stderr.includes('at run'));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('conformance packet generator reports a clear missing-git error');
