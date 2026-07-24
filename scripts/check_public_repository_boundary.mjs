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
  'docs/EXTERNAL_BETA_EVALUATION.md',
  '.github/ISSUE_TEMPLATE/public-beta-feedback.yml',
  'docs/agentic-ai-reference-SPEC.md',
  'docs/theoretical-reference',
  'plugins/hermes',
  'plugins/gemini-antigravity',
  'packaging/native-plugin',
  'scripts/build_native_plugin_package.mjs',
  'scripts/pack_native_plugin_tarball.mjs',
  'scripts/verify_native_plugin_prerelease.mjs',
  'scripts/run_native_plugin_opencode_smoke.sh',
  'tests/verify_native_plugin_opencode_smoke.mjs',
  'tests/test_native_plugin_tarball.mjs',
  'tests/test_native_plugin_realpath_containment.mjs',
  'tests/test_native_plugin_transactional_lifecycle.mjs',
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

const retiredDocumentMarkers = [
  ['private', 'prerelease'].join('-'),
  ['OPEN FOR EXTERNAL', 'EVALUATOR SUBMISSIONS'].join(' '),
  ['docs/EXTERNAL_BETA', 'EVALUATION.md'].join('_'),
  ['public-beta', 'feedback.yml'].join('-'),
  ['agentic-ai', 'reference'].join('-'),
  ['theoretical', 'reference'].join('-'),
  ['~/.', 'hermes/'].join(''),
  ['hermes', 'agent'].join('-'),
  ['ponytail', 'mode'].join('-'),
  ['Private OpenCode', 'setup'].join(' '),
];

const historicalDocumentExceptions = new Set(['CHANGELOG.md']);
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

const documentExtensions = new Set(['.md', '.json', '.toml', '.yml', '.yaml']);
const skippedDirectories = new Set(['.git', 'node_modules', 'dist']);

function scanPublicDocuments(directory, relativeRoot = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.posix.join(relativeRoot, entry.name);
    if (entry.isDirectory()) {
      scanPublicDocuments(absolute, relative);
      continue;
    }
    if (!entry.isFile() || !documentExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    if (historicalDocumentExceptions.has(relative)) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    for (const marker of retiredDocumentMarkers) {
      if (text.includes(marker)) errors.push(`retired active-document marker in ${relative}: ${marker}`);
    }
  }
}

scanPublicDocuments(root);

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
