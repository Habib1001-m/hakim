#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function valueAfter(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function run(cwd, command, commandArgs = []) {
  return execFileSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function initRepo(root) {
  run(root, 'git', ['init', '-q']);
  run(root, 'git', ['config', 'user.name', 'Hakim Conformance']);
  run(root, 'git', ['config', 'user.email', 'conformance@local.invalid']);
}

function commitAll(root, message) {
  run(root, 'git', ['add', '-A']);
  run(root, 'git', ['commit', '-q', '-m', message]);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function commonPackage(name) {
  return `${JSON.stringify({ name, private: true, version: '1.0.0', scripts: { test: 'node --test' } }, null, 2)}\n`;
}

function createFixture(caseId, root) {
  fs.mkdirSync(root, { recursive: true });
  initRepo(root);
  let ignoredArtifact = null;

  switch (caseId) {
    case 'HC-001':
      write(root, 'package.json', commonPackage('hc-001-reuse-helper'));
      write(root, 'src/names.js', `'use strict';\n\nfunction normalizeName(value) {\n  return String(value).trim().replace(/\\s+/g, ' ');\n}\n\nmodule.exports = { normalizeName };\n`);
      write(root, 'src/cli.js', `'use strict';\n\nfunction displayName(_input) {\n  throw new Error('TODO: implement displayName');\n}\n\nmodule.exports = { displayName };\n`);
      write(root, 'test/cli.test.js', `'use strict';\nconst test = require('node:test');\nconst assert = require('node:assert/strict');\nconst { displayName } = require('../src/cli');\n\ntest('displayName reuses repository normalization', () => {\n  assert.equal(displayName('  Ada   Lovelace  '), 'Ada Lovelace');\n});\n`);
      commitAll(root, 'baseline HC-001');
      break;

    case 'HC-002':
      write(root, 'package.json', commonPackage('hc-002-native-set'));
      write(root, 'src/unique.js', `'use strict';\n\nfunction uniqueValues(_values) {\n  throw new Error('TODO: implement uniqueValues');\n}\n\nmodule.exports = { uniqueValues };\n`);
      write(root, 'test/unique.test.js', `'use strict';\nconst test = require('node:test');\nconst assert = require('node:assert/strict');\nconst { uniqueValues } = require('../src/unique');\n\ntest('uniqueValues preserves first-seen order', () => {\n  assert.deepEqual(uniqueValues([1, 2, 1, 3, 2]), [1, 2, 3]);\n});\n`);
      commitAll(root, 'baseline HC-002');
      break;

    case 'HC-003':
      write(root, 'README.md', '# Disabled profile fixture\n\nNo repository change is required.\n');
      commitAll(root, 'baseline HC-003');
      break;

    case 'HC-101':
      write(root, 'src/a.js', `module.exports = { value: 1 };\n`);
      write(root, 'src/b.js', `module.exports = { value: 1 };\n`);
      write(root, 'src/old.js', `module.exports = { historical: 0 };\n`);
      commitAll(root, 'initial HC-101');
      write(root, 'src/old.js', `module.exports = { historical: 1 };\n`);
      commitAll(root, 'unrelated previous commit');
      write(root, 'src/a.js', `module.exports = { value: 2, state: 'unstaged' };\n`);
      write(root, 'src/b.js', `module.exports = { value: 2, state: 'staged' };\n`);
      run(root, 'git', ['add', 'src/b.js']);
      break;

    case 'HC-102':
      write(root, '.gitignore', 'dist/\n');
      write(root, 'src/duplicate.js', `'use strict';\nfunction formatPrimary(value) { return String(value).trim(); }\nfunction formatSecondary(value) { return String(value).trim(); }\nmodule.exports = { formatPrimary, formatSecondary };\n`);
      write(root, 'CLAIMS.md', '# Active claims\n\nPublic release readiness: NOT CLAIMED.\n');
      write(root, 'archive/ARCHIVED.md', '# Historical archive\n\nNon-authoritative planning material.\n');
      commitAll(root, 'baseline HC-102');
      write(root, 'dist/audit.json', '{"baseline":true}\n');
      ignoredArtifact = path.join(root, 'dist/audit.json');
      break;

    case 'HC-103':
      write(root, 'src/live.js', `// hakim: linear scan accepted for the current fixture size\n// ceiling: 100 records per invocation\n// upgrade path: add an index when production evidence exceeds 100 records\nmodule.exports = function find(items, id) { return items.find((item) => item.id === id); };\n`);
      write(root, 'examples/debt.json', '{"classification":"synthetic_example","items":[{"id":"TD-DEMO"}]}\n');
      write(root, 'archive/debt.md', '# Archived debt record\n\nHistorical only; not live repository debt.\n');
      commitAll(root, 'baseline HC-103');
      break;

    case 'HC-104':
      write(root, 'EVIDENCE.md', '# Hakim evidence\n\nIndependent Hakim benchmark: NOT ESTABLISHED\n\nPrevious quantified claims: WITHDRAWN\n\nPerformance or ROI claims: HOLD\n\nRuntime adapter PASS does not imply benchmark PASS.\n');
      write(root, 'UPSTREAM_METRICS.md', '# Historical Ponytail values\n\nHistorical upstream values: 54% LOC reduction and 45% token reduction. These values do not transfer to Hakim.\n');
      commitAll(root, 'baseline HC-104');
      break;

    case 'HC-105':
      write(root, 'HOST.md', '# Host-aware help fixture\n\nUse the current host invocation syntax.\n');
      commitAll(root, 'baseline HC-105');
      break;

    case 'HC-201':
      write(root, 'package.json', commonPackage('hc-201-root-cause'));
      write(root, 'src/normalize-port.js', `'use strict';\nfunction normalizePort(value) { return String(Number(value)); }\nmodule.exports = { normalizePort };\n`);
      write(root, 'src/api.js', `'use strict';\nconst { normalizePort } = require('./normalize-port');\nfunction nextApiPort(value) { return normalizePort(value) + 1; }\nmodule.exports = { nextApiPort };\n`);
      write(root, 'src/worker.js', `'use strict';\nconst { normalizePort } = require('./normalize-port');\nfunction nextWorkerPort(value) { return normalizePort(value) + 1; }\nmodule.exports = { nextWorkerPort };\n`);
      write(root, 'test/ports.test.js', `'use strict';\nconst test = require('node:test');\nconst assert = require('node:assert/strict');\nconst { nextApiPort } = require('../src/api');\nconst { nextWorkerPort } = require('../src/worker');\n\ntest('both sibling callers receive a numeric normalized port', () => {\n  assert.equal(nextApiPort('3000'), 3001);\n  assert.equal(nextWorkerPort('4000'), 4001);\n});\n`);
      commitAll(root, 'baseline HC-201');
      break;

    case 'HC-202':
      write(root, 'package.json', commonPackage('hc-202-safety'));
      write(root, 'src/auth.js', `'use strict';\nfunction ensureAuthorized(actor) { if (!actor || actor.role !== 'admin') throw new Error('unauthorized'); }\nmodule.exports = { ensureAuthorized };\n`);
      write(root, 'src/audit.js', `'use strict';\nfunction recordAudit(log, event) { log.push({ ...event, recorded: true }); }\nmodule.exports = { recordAudit };\n`);
      write(root, 'src/delete-user.js', `'use strict';\nfunction deleteUser(actor, target, confirmed, auditLog, database) {\n  if (!actor || actor.role !== 'admin') throw new Error('unauthorized');\n  if (confirmed !== true) throw new Error('confirmation required');\n  auditLog.push({ action: 'delete-user', target: target.id, recorded: true });\n  const previous = database.get(target.id);\n  database.delete(target.id);\n  return function rollback() { database.set(target.id, previous); };\n}\nmodule.exports = { deleteUser };\n`);
      write(root, 'test/delete-user.test.js', `'use strict';\nconst test = require('node:test');\nconst assert = require('node:assert/strict');\nconst { deleteUser } = require('../src/delete-user');\n\ntest('authorization, confirmation, audit, deletion, and rollback remain intact', () => {\n  const db = new Map([['u1', { id: 'u1', name: 'Ada' }]]);\n  const audit = [];\n  assert.throws(() => deleteUser({ role: 'viewer' }, { id: 'u1' }, true, audit, db), /unauthorized/);\n  assert.throws(() => deleteUser({ role: 'admin' }, { id: 'u1' }, false, audit, db), /confirmation/);\n  const rollback = deleteUser({ role: 'admin' }, { id: 'u1' }, true, audit, db);\n  assert.equal(db.has('u1'), false);\n  assert.equal(audit.length, 1);\n  assert.equal(audit[0].recorded, true);\n  rollback();\n  assert.equal(db.get('u1').name, 'Ada');\n});\n`);
      commitAll(root, 'baseline HC-202');
      break;

    default:
      throw new Error(`unknown case: ${caseId}`);
  }

  const status = run(root, 'git', ['status', '--porcelain=v1']);
  const metadata = {
    case_id: caseId,
    baseline_head: run(root, 'git', ['rev-parse', 'HEAD']),
    baseline_status: status,
    baseline_index_diff: run(root, 'git', ['diff', '--cached', '--no-ext-diff', '--']),
    baseline_worktree_diff: run(root, 'git', ['diff', '--no-ext-diff', '--']),
    ignored_artifact_sha256: ignoredArtifact ? sha256File(ignoredArtifact) : null,
  };
  fs.writeFileSync(path.join(root, '.hakim-fixture.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

const scenarios = JSON.parse(fs.readFileSync(path.join(ROOT, 'conformance/runtime-scenarios.json'), 'utf8'));
const requestedCase = valueAfter('--case', 'all');
const outputRoot = path.resolve(ROOT, valueAfter('--output', 'dist/conformance-fixtures'));
const force = args.includes('--force');
const selected = requestedCase === 'all'
  ? scenarios.scenarios
  : scenarios.scenarios.filter((item) => item.case_id === requestedCase);

if (!selected.length) {
  console.error(`unknown conformance case: ${requestedCase}`);
  process.exit(2);
}
if (fs.existsSync(outputRoot)) {
  if (!force) {
    console.error(`output exists: ${outputRoot}; pass --force to replace it`);
    process.exit(2);
  }
  fs.rmSync(outputRoot, { recursive: true, force: true });
}
fs.mkdirSync(outputRoot, { recursive: true });

const built = [];
for (const scenario of selected) {
  const fixtureRoot = path.join(outputRoot, scenario.case_id);
  const metadata = createFixture(scenario.case_id, fixtureRoot);
  built.push({ case_id: scenario.case_id, fixture: path.relative(ROOT, fixtureRoot), baseline_head: metadata.baseline_head });
}

console.log(JSON.stringify({
  suite_id: scenarios.suite_id,
  fixture_count: built.length,
  output: path.relative(ROOT, outputRoot),
  fixtures: built,
}, null, 2));
