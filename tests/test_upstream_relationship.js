'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'scripts/check_upstream_relationship.mjs')], {
  cwd: root,
  encoding: 'utf8',
});

assert.equal(result.status, 0, result.stderr + result.stdout);
const payload = JSON.parse(result.stdout);
assert.equal(payload.ok, true);
assert.equal(payload.upstream.name, 'Ponytail');
assert.equal(payload.upstream.reviewed_release, 'v4.8.4');
assert.equal(payload.relationship.classification, 'governance-focused derivative');
assert.equal(payload.relationship.git_fork, false);
assert.equal(payload.relationship.automatic_sync, false);
assert.equal(payload.relationship.performance_equivalence, false);
assert.equal(payload.implemented_differentiation_count, 7);
assert.equal(payload.sync_policy, 'manual evidence-gated review');
assert.equal(payload.notices_checked, 2);
assert.equal(payload.licenses_match, true);

const record = JSON.parse(fs.readFileSync(path.join(root, 'upstream/ponytail.json'), 'utf8'));
assert.equal(record.sync_policy.direct_cherry_pick_without_review, false);
assert.deepEqual(record.sync_policy.candidate_decisions, ['adopt', 'adapt', 'reject', 'defer']);

console.log('test_upstream_relationship.js: ok');
