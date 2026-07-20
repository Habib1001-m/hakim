#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CANONICAL = path.join(ROOT, 'core/hakim-skill/SKILL.md');
const PROJECTION = path.join(ROOT, '.github/copilot-instructions.md');

const REQUIRED_PHRASES = [
  'Hakim for GitHub Copilot',
  'Repository map',
  'Operating mode',
  'The 7-level ladder',
  'Does this need to exist',
  'already in this codebase',
  'standard library',
  'native platform',
  'already-installed dependency',
  'one line',
  'minimum code that works',
  'Repository validation',
  'npm test',
  'check:rules',
  'check:codex-projection',
  'check:claude-projection',
  'check:copilot-projection',
  'Safety boundary',
  'Technical debt format',
  'Output discipline',
  'release readiness',
  'runtime validation',
  'marketplace readiness',
];

const FORBIDDEN_PHRASES = [
  'Copilot Extension is supported',
  'marketplace-ready',
  'release-ready',
  'persistent install is supported',
  'runtime validation PASS',
];

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractMarker(text) {
  const match = text.match(/hakim-canonical-sha256:\s*([a-f0-9]{64})/i);
  return match ? match[1].toLowerCase() : null;
}

function main() {
  const errors = [];

  if (!fs.existsSync(PROJECTION)) {
    errors.push('missing .github/copilot-instructions.md');
  }

  const canonical = readUtf8(CANONICAL);
  const projection = fs.existsSync(PROJECTION) ? readUtf8(PROJECTION) : '';
  const canonicalHash = sha256(canonical);
  const projectionMarker = extractMarker(projection);

  if (!projectionMarker) {
    errors.push('missing hakim-canonical-sha256 marker in Copilot instructions');
  } else if (projectionMarker !== canonicalHash) {
    errors.push(`canonical hash drift: projection=${projectionMarker} canonical=${canonicalHash}`);
  }

  if (/^---\s*$/m.test(projection.slice(0, 200))) {
    errors.push('repository-wide copilot-instructions.md must not use path-specific frontmatter');
  }

  for (const phrase of REQUIRED_PHRASES) {
    if (!projection.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(`missing required Copilot instruction phrase: ${phrase}`);
    }
  }

  for (const phrase of FORBIDDEN_PHRASES) {
    if (projection.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(`forbidden unsupported Copilot claim: ${phrase}`);
    }
  }

  const payload = {
    canonical: path.relative(ROOT, CANONICAL),
    projection: path.relative(ROOT, PROJECTION),
    projection_type: 'github-copilot-repository-instructions',
    canonical_hash: canonicalHash,
    projection_marker: projectionMarker,
    supported_surface: '.github/copilot-instructions.md',
    deferred_surfaces: [
      '.github/instructions/**/*.instructions.md',
      'AGENTS.md',
      '.github/agents/*.agent.md',
      'Copilot MCP repository configuration',
      'Copilot Extension/GitHub App code',
      'Copilot CLI plugin/hooks/skills',
    ],
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (payload.ok) {
    console.log(`Copilot instruction projection OK (${canonicalHash.slice(0, 12)})`);
  } else {
    console.error('Copilot instruction projection drift detected:');
    for (const error of errors) console.error(`- ${error}`);
  }

  process.exit(payload.ok ? 0 : 1);
}

main();
