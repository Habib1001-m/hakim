#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CANONICAL = path.join(ROOT, 'core/hakim-skill/SKILL.md');
const PROJECTION = path.join(ROOT, 'plugins/codex/skills/hakim/SKILL.md');

const REQUIRED_PHRASES = [
  'Hakim for Codex',
  'Operating mode',
  'The 7-level ladder',
  'Does this need to exist',
  'already in this codebase',
  'stdlib',
  'native platform',
  'already-installed dependency',
  'one line',
  'minimum code that works',
  'Safety boundary',
  'Technical debt format',
  'Output discipline',
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
  const canonical = readUtf8(CANONICAL);
  const projection = readUtf8(PROJECTION);
  const canonicalHash = sha256(canonical);
  const projectionMarker = extractMarker(projection);
  const errors = [];

  if (!projectionMarker) {
    errors.push('missing hakim-canonical-sha256 marker in Codex compact skill');
  } else if (projectionMarker !== canonicalHash) {
    errors.push(`canonical hash drift: projection=${projectionMarker} canonical=${canonicalHash}`);
  }

  for (const phrase of REQUIRED_PHRASES) {
    if (!projection.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(`missing required projection phrase: ${phrase}`);
    }
  }

  const payload = {
    canonical: path.relative(ROOT, CANONICAL),
    projection: path.relative(ROOT, PROJECTION),
    canonical_hash: canonicalHash,
    projection_marker: projectionMarker,
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (payload.ok) {
    console.log(`Codex compact skill projection OK (${canonicalHash.slice(0, 12)})`);
  } else {
    console.error('Codex compact skill projection drift detected:');
    for (const error of errors) console.error(`- ${error}`);
  }

  process.exit(payload.ok ? 0 : 1);
}

main();
