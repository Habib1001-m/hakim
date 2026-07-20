#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const forbiddenPaths = [
  ['docs', 'phase-d'].join('/'),
  'status',
  'ARCHIVE_POLICY.md',
  'REVIEW-GUIDE.md',
  'conformance/runtime-acceptance-ledger.json',
];

const publicSurfaces = [
  'README.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'SUPPORTED_HOSTS.md',
  'KNOWN_LIMITATIONS.md',
  'CONTRIBUTING.md',
  '.github/copilot-instructions.md',
];

const forbiddenMarkers = [
  ['GOV', 'W2.5'].join('-'),
  ['PRE', 'CLAUDE'].join('_'),
  ['R1', 'HIGH', '01'].join('_'),
  ['PUBLICATION', 'AUTHORIZED'].join('_'),
  ['CURRENT', 'EXECUTION', 'WAVE'].join('_'),
  ['EVALUATOR', 'JOURNEYS', 'ACCEPTED'].join('_'),
  ['docs', 'phase-d'].join('/'),
  ['status', 'product-state.json'].join('/'),
  ['status', 'transition-state.json'].join('/'),
];

const errors = [];

for (const relative of forbiddenPaths) {
  if (fs.existsSync(path.join(root, relative))) {
    errors.push(`forbidden public path exists: ${relative}`);
  }
}

for (const relative of publicSurfaces) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) {
    errors.push(`missing public surface: ${relative}`);
    continue;
  }
  const text = fs.readFileSync(absolute, 'utf8');
  for (const marker of forbiddenMarkers) {
    if (text.includes(marker)) {
      errors.push(`internal marker in ${relative}: ${marker}`);
    }
  }
}

const workflow = path.join(root, '.github', 'workflows', 'public-ci.yml');
if (!fs.existsSync(workflow)) {
  errors.push('missing public CI workflow');
} else {
  const text = fs.readFileSync(workflow, 'utf8');
  if (!text.includes('permissions:\n  contents: read')) {
    errors.push('public CI must declare contents: read');
  }
  if (text.includes('pull_request_target')) {
    errors.push('public CI must not use pull_request_target');
  }
  if (text.includes('upload-artifact')) {
    errors.push('public CI must not upload internal artifacts');
  }
}

const payload = { ok: errors.length === 0, errors };
console.log(JSON.stringify(payload, null, 2));
process.exit(payload.ok ? 0 : 1);
