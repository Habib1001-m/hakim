#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowRoot = path.join(root, '.github', 'workflows');
const workflowFiles = fs.readdirSync(workflowRoot)
  .filter((name) => /\.ya?ml$/i.test(name))
  .sort();

assert.ok(workflowFiles.length > 0, 'at least one active workflow is required');

for (const name of workflowFiles) {
  const relative = path.posix.join('.github', 'workflows', name);
  const source = fs.readFileSync(path.join(workflowRoot, name), 'utf8');

  assert.match(
    source,
    /^permissions:\s*\n  contents: read\s*$/m,
    `${relative} must declare top-level contents: read permission`,
  );
  assert.doesNotMatch(source, /^\s+[A-Za-z-]+:\s*write\s*$/m, `${relative} must not grant write permission`);

  const uses = [...source.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)]
    .map((match) => match[1]);
  assert.ok(uses.length > 0, `${relative} must contain at least one action reference`);

  for (const reference of uses) {
    if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
    assert.match(
      reference,
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}$/,
      `${relative} action must be pinned to a full 40-character commit SHA: ${reference}`,
    );
  }

  assert.doesNotMatch(source, /@(?:main|master|v\d+(?:\.\d+){0,2})\b/, `${relative} contains a floating action ref`);
}

console.log(`workflow supply-chain policy PASS: ${workflowFiles.length} active workflows use contents-read only and full-SHA action pins`);
