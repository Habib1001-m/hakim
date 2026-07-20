#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const CHECKSUMS_FILE = 'SHA256SUMS';
const MANIFEST_FILE = 'tarball-manifest.json';
const PROVENANCE_FILE = 'provenance-manifest.json';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseArgs(argv) {
  const args = { directory: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--directory') args.directory = path.resolve(argv[++index] || '');
    else if (token === '--json') args.json = true;
    else throw new Error(`unknown argument: ${token}`);
  }
  if (!args.directory) throw new Error('--directory requires a path');
  return args;
}

function requireRegularFile(candidate, label) {
  let stat;
  try {
    stat = fs.lstatSync(candidate);
  } catch (error) {
    throw new Error(`${label} is missing: ${error.message}`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a safe regular file`);
  return stat;
}

function readJson(candidate, label) {
  requireRegularFile(candidate, label);
  try {
    return JSON.parse(fs.readFileSync(candidate, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is malformed JSON: ${error.message}`);
  }
}

function requireFullCommit(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/.test(value)) {
    throw new Error(`${label} must be a full 40-character lowercase Git SHA`);
  }
  return value;
}

function readChecksums(candidate) {
  requireRegularFile(candidate, CHECKSUMS_FILE);
  const source = fs.readFileSync(candidate, 'utf8');
  if (!source.endsWith('\n')) throw new Error(`${CHECKSUMS_FILE} must end with one newline`);
  const records = new Map();
  for (const line of source.trimEnd().split('\n')) {
    const match = /^([0-9a-f]{64})  ([A-Za-z0-9._-]+)$/.exec(line);
    if (!match) throw new Error(`invalid checksum line: ${line}`);
    if (records.has(match[2])) throw new Error(`duplicate checksum entry: ${match[2]}`);
    records.set(match[2], match[1]);
  }
  return records;
}

function verifyIndependent(directory) {
  const root = path.resolve(directory);
  const manifestPath = path.join(root, MANIFEST_FILE);
  const provenancePath = path.join(root, PROVENANCE_FILE);
  const checksumsPath = path.join(root, CHECKSUMS_FILE);
  const manifest = readJson(manifestPath, MANIFEST_FILE);
  const provenance = readJson(provenancePath, PROVENANCE_FILE);

  if (manifest.schema_version !== 2 || manifest.status !== 'PASS') {
    throw new Error('tarball manifest schema or status is unsupported');
  }
  if (
    manifest.release_channel !== 'private-prerelease'
    || manifest.public_publication_authorized !== false
    || manifest.marketplace_publication_authorized !== false
  ) {
    throw new Error('tarball manifest publication boundary is invalid');
  }
  const sourceCommit = requireFullCommit(manifest.source_commit, 'tarball manifest source_commit');
  if (typeof manifest.tarball_filename !== 'string' || !/^[A-Za-z0-9._-]+\.tgz$/.test(manifest.tarball_filename)) {
    throw new Error('tarball manifest filename is invalid');
  }

  const tarballPath = path.join(root, manifest.tarball_filename);
  const tarballStat = requireRegularFile(tarballPath, 'manifest tarball');
  const tarballDigest = sha256(fs.readFileSync(tarballPath));
  const manifestDigest = sha256(fs.readFileSync(manifestPath));
  if (manifest.tarball_sha256 !== tarballDigest || manifest.tarball_size !== tarballStat.size) {
    throw new Error('tarball manifest digest or size mismatch');
  }

  if (provenance.schema_version !== 1 || provenance.status !== 'PASS') {
    throw new Error('provenance manifest schema or status is unsupported');
  }
  if (
    provenance.policy?.release_channel !== 'private-prerelease'
    || provenance.policy?.public_publication_authorized !== false
    || provenance.policy?.marketplace_publication_authorized !== false
  ) {
    throw new Error('provenance publication boundary is invalid');
  }
  const provenanceCommit = requireFullCommit(provenance.source?.commit, 'provenance source.commit');
  if (provenanceCommit !== sourceCommit) throw new Error('source commit differs across evidence');
  if (
    provenance.subject?.filename !== manifest.tarball_filename
    || provenance.subject?.sha256 !== tarballDigest
    || provenance.subject?.size !== tarballStat.size
    || provenance.subject?.name !== manifest.package_name
    || provenance.subject?.version !== manifest.package_version
  ) {
    throw new Error('provenance subject differs from the tarball manifest');
  }
  if (
    provenance.evidence?.tarball_manifest !== MANIFEST_FILE
    || provenance.evidence?.tarball_manifest_sha256 !== manifestDigest
  ) {
    throw new Error('provenance tarball-manifest evidence mismatch');
  }

  const expectedFiles = [manifest.tarball_filename, MANIFEST_FILE, PROVENANCE_FILE].sort();
  const checksums = readChecksums(checksumsPath);
  if (checksums.size !== expectedFiles.length || expectedFiles.some((name) => !checksums.has(name))) {
    throw new Error('checksum inventory differs from the exact prerelease evidence set');
  }
  for (const name of expectedFiles) {
    const actual = sha256(fs.readFileSync(path.join(root, name)));
    if (checksums.get(name) !== actual) throw new Error(`checksum mismatch: ${name}`);
  }

  return {
    status: 'PASS',
    verification_mode: 'INDEPENDENT_IMPLEMENTATION',
    producer_module_imported: false,
    package_name: manifest.package_name,
    package_version: manifest.package_version,
    release_channel: manifest.release_channel,
    source_commit: sourceCommit,
    tarball_filename: manifest.tarball_filename,
    tarball_sha256: tarballDigest,
    checksum_entry_count: checksums.size,
  };
}

function main() {
  let json = process.argv.includes('--json');
  try {
    const args = parseArgs(process.argv.slice(2));
    json = args.json;
    const result = verifyIndependent(args.directory);
    if (json) console.log(JSON.stringify(result, null, 2));
    else for (const [key, value] of Object.entries(result)) console.log(`${key.toUpperCase()}=${value}`);
  } catch (error) {
    if (json) console.log(JSON.stringify({ status: 'FAIL', error: error.message }, null, 2));
    else console.error(`STATUS=FAIL\nERROR=${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();

export { parseArgs, readChecksums, requireFullCommit, verifyIndependent };
