#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CANONICAL = path.join(ROOT, 'core/hakim-skill/SKILL.md');
const VERSION = path.join(ROOT, 'core/hakim-skill/VERSION');
const PROJECTION = path.join(ROOT, 'plugins/codex/skills/hakim/SKILL.md');
const MANIFEST = path.join(ROOT, 'plugins/codex/.codex-plugin/plugin.json');
const MARKETPLACE = path.join(ROOT, '.agents/plugins/marketplace.json');
const HOOKS = path.join(ROOT, 'plugins/codex/hooks/hooks.json');
const SESSION_HANDLER = path.join(ROOT, 'plugins/codex/hooks/session_start.mjs');

const REQUIRED_PHRASES = [
  'Hakim for Codex', 'Operating mode', 'The 7-level ladder',
  'Does this need to exist', 'already in this codebase', 'stdlib',
  'native platform', 'already-installed dependency', 'one line',
  'minimum code that works', 'Safety boundary', 'Technical debt format',
  'Output discipline',
];

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const read = (filePath) => fs.readFileSync(filePath, 'utf8');

function parseJson(filePath, errors) {
  try { return JSON.parse(read(filePath)); }
  catch (error) {
    errors.push(`invalid JSON in ${path.relative(ROOT, filePath)}: ${error.message}`);
    return null;
  }
}

function marker(text) {
  return text.match(/hakim-canonical-sha256:\s*([a-f0-9]{64})/i)?.[1]?.toLowerCase() || null;
}

function main() {
  const errors = [];
  const canonical = read(CANONICAL);
  const projection = read(PROJECTION);
  const expectedVersion = read(VERSION).trim();
  const canonicalHash = sha256(canonical);
  const projectionMarker = marker(projection);
  const manifest = parseJson(MANIFEST, errors);
  const marketplace = parseJson(MARKETPLACE, errors);
  const hooks = parseJson(HOOKS, errors);

  if (projectionMarker !== canonicalHash) {
    errors.push(`canonical hash drift: projection=${projectionMarker || 'missing'} canonical=${canonicalHash}`);
  }
  for (const phrase of REQUIRED_PHRASES) {
    if (!projection.toLowerCase().includes(phrase.toLowerCase())) errors.push(`missing required projection phrase: ${phrase}`);
  }

  if (manifest) {
    if (manifest.name !== 'hakim') errors.push('Codex manifest name must be hakim');
    if (manifest.version !== expectedVersion) errors.push(`Codex manifest version must be ${expectedVersion}`);
    if (manifest.skills !== './skills/') errors.push('Codex manifest skills path must be ./skills/');
    if (manifest.hooks !== './hooks/hooks.json') errors.push('Codex manifest hooks path must be ./hooks/hooks.json');
    const capabilities = manifest.interface?.capabilities || [];
    for (const capability of ['Interactive', 'Read', 'Write']) {
      if (!capabilities.includes(capability)) errors.push(`Codex interface missing capability: ${capability}`);
    }
    if (manifest.interface?.websiteURL !== 'https://github.com/Habib1001-m/hakim') errors.push('Codex websiteURL mismatch');
  }

  const entry = marketplace?.plugins?.find((item) => item.name === 'hakim');
  if (marketplace?.name !== 'hakim') errors.push('Codex marketplace name must be hakim');
  if (marketplace?.interface?.displayName !== 'Hakim') errors.push('Codex marketplace displayName must be Hakim');
  if (!entry) errors.push('Codex marketplace must expose hakim');
  if (entry?.source?.source !== 'local' || entry?.source?.path !== './plugins/codex') errors.push('Codex marketplace source must remain ./plugins/codex');
  if (entry?.policy?.installation !== 'AVAILABLE') errors.push('Codex marketplace installation policy must be AVAILABLE');

  const sessionGroups = hooks?.hooks?.SessionStart;
  if (!Array.isArray(sessionGroups) || sessionGroups.length !== 1) errors.push('Codex must define exactly one SessionStart hook group');
  const handler = sessionGroups?.[0]?.hooks?.[0];
  if (handler?.command !== 'node ${PLUGIN_ROOT}/hooks/session_start.mjs') errors.push('Codex SessionStart handler path mismatch');

  if (!fs.existsSync(SESSION_HANDLER)) {
    errors.push('Codex SessionStart handler missing');
  } else {
    const sessionText = read(SESSION_HANDLER);
    for (const phrase of ['progressively', 'approval', '$hakim:hakim-help']) {
      if (!sessionText.includes(phrase)) errors.push(`Codex SessionStart activation missing: ${phrase}`);
    }
    if (sessionText.includes("readFileSync(skillPath")) errors.push('Codex SessionStart must not preload the full canonical skill body');
  }

  const payload = {
    canonical: path.relative(ROOT, CANONICAL),
    projection: path.relative(ROOT, PROJECTION),
    manifest: path.relative(ROOT, MANIFEST),
    marketplace: path.relative(ROOT, MARKETPLACE),
    session_handler: path.relative(ROOT, SESSION_HANDLER),
    expected_version: expectedVersion,
    canonical_hash: canonicalHash,
    projection_marker: projectionMarker,
    native_install_identity: 'hakim@hakim',
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) console.log(JSON.stringify(payload, null, 2));
  else if (payload.ok) console.log(`Codex native plugin projection OK (${canonicalHash.slice(0, 12)})`);
  else {
    console.error('Codex native plugin projection drift detected:');
    for (const error of errors) console.error(`- ${error}`);
  }
  process.exit(payload.ok ? 0 : 1);
}

main();
