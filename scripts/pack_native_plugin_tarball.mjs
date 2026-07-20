#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build, collectFiles } from './build_native_plugin_package.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const DEFAULT_OUTPUT = path.join(ROOT, 'dist', 'native-plugin');
const PROVENANCE_FILE = 'provenance-manifest.json';
const TARBALL_MANIFEST_FILE = 'tarball-manifest.json';
const CHECKSUMS_FILE = 'SHA256SUMS';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseArgs(argv) {
  const args = { output: DEFAULT_OUTPUT, json: false, sourceCommit: process.env.HAKIM_SOURCE_COMMIT || null };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--output') args.output = path.resolve(argv[++index] || '');
    else if (token === '--source-commit') args.sourceCommit = argv[++index] || null;
    else if (token === '--json') args.json = true;
    else throw new Error(`unknown argument: ${token}`);
  }
  if (!args.output) throw new Error('--output requires a path');
  args.sourceCommit = normalizeSourceCommit(args.sourceCommit);
  return args;
}

function normalizeSourceCommit(value) {
  if (value === null || value === undefined || value === '') {
    throw new Error('source commit is required for private-prerelease PASS evidence');
  }
  const commit = String(value).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('source commit must be a full 40-character Git SHA');
  return commit;
}

function runNpmPack(packageRoot, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const result = spawnSync(
    'npm',
    ['pack', packageRoot, '--pack-destination', destination, '--json', '--ignore-scripts'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_audit: 'false',
        npm_config_fund: 'false',
        npm_config_update_notifier: 'false',
      },
    },
  );
  if (result.error) throw new Error(`npm pack could not start: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`npm pack failed with exit ${result.status}: ${(result.stderr || result.stdout).trim()}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`npm pack returned malformed JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0]?.filename) {
    throw new Error('npm pack must return exactly one package report');
  }
  const tarball = path.join(destination, parsed[0].filename);
  const stat = fs.lstatSync(tarball);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('npm pack output is missing or unsafe');
  return { report: parsed[0], tarball };
}

function normalizedPackFiles(report) {
  if (!Array.isArray(report.files)) throw new Error('npm pack report is missing the file inventory');
  return report.files
    .map((record) => ({
      path: String(record.path || ''),
      size: Number(record.size),
      mode: Number(record.mode),
    }))
    .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

function assertPackageInventory(packageRoot, packReport) {
  const expected = collectFiles(packageRoot).map((record) => record.path);
  const packed = normalizedPackFiles(packReport).map((record) => record.path);
  const expectedSet = new Set(expected);
  const packedSet = new Set(packed);
  const missing = expected.filter((item) => !packedSet.has(item));
  const extra = packed.filter((item) => !expectedSet.has(item));
  const duplicatePackedPaths = packed.filter((item, index) => packed.indexOf(item) !== index);
  if (
    missing.length > 0
    || extra.length > 0
    || expected.length !== packed.length
    || duplicatePackedPaths.length > 0
  ) {
    throw new Error(
      `npm pack inventory mismatch; missing=${missing.join(',') || 'none'}; `
      + `extra=${extra.join(',') || 'none'}; duplicates=${[...new Set(duplicatePackedPaths)].join(',') || 'none'}`,
    );
  }
  for (const forbidden of ['node_modules/', '.git/', 'docs/', 'scripts/', 'tests/']) {
    if (packed.some((item) => item === forbidden.slice(0, -1) || item.startsWith(forbidden))) {
      throw new Error(`npm tarball contains forbidden repository content: ${forbidden}`);
    }
  }
  return normalizedPackFiles(packReport);
}

function writeJson(destination, value) {
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
}

function checksumLine(file, root) {
  const relative = path.basename(file);
  return `${sha256(fs.readFileSync(file))}  ${relative}`;
}

function readChecksums(candidate) {
  const records = new Map();
  for (const line of fs.readFileSync(candidate, 'utf8').trim().split('\n')) {
    const match = /^([0-9a-f]{64})  ([A-Za-z0-9._-]+)$/.exec(line);
    if (!match) throw new Error(`invalid checksum line: ${line}`);
    if (records.has(match[2])) throw new Error(`duplicate checksum entry: ${match[2]}`);
    records.set(match[2], match[1]);
  }
  return records;
}

function verifyPrereleaseEvidence(output) {
  const manifestPath = path.join(output, TARBALL_MANIFEST_FILE);
  const provenancePath = path.join(output, PROVENANCE_FILE);
  const checksumsPath = path.join(output, CHECKSUMS_FILE);
  for (const candidate of [manifestPath, provenancePath, checksumsPath]) {
    const stat = fs.lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`prerelease evidence is missing or unsafe: ${path.basename(candidate)}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
  const sourceCommit = normalizeSourceCommit(manifest.source_commit);
  if (normalizeSourceCommit(provenance.source?.commit) !== sourceCommit) {
    throw new Error('source commit differs across evidence');
  }
  const tarballPath = path.join(output, manifest.tarball_filename);
  const tarballStat = fs.lstatSync(tarballPath);
  if (!tarballStat.isFile() || tarballStat.isSymbolicLink()) throw new Error('manifest tarball is missing or unsafe');

  const expectedFiles = [manifest.tarball_filename, TARBALL_MANIFEST_FILE, PROVENANCE_FILE].sort();
  const checksums = readChecksums(checksumsPath);
  if (checksums.size !== expectedFiles.length || expectedFiles.some((name) => !checksums.has(name))) {
    throw new Error('checksum inventory differs from the exact prerelease evidence set');
  }
  for (const name of expectedFiles) {
    const actual = sha256(fs.readFileSync(path.join(output, name)));
    if (checksums.get(name) !== actual) throw new Error(`checksum mismatch: ${name}`);
  }

  const tarballDigest = sha256(fs.readFileSync(tarballPath));
  const manifestDigest = sha256(fs.readFileSync(manifestPath));
  if (manifest.schema_version !== 2 || manifest.status !== 'PASS') throw new Error('tarball manifest schema is unsupported');
  if (manifest.release_channel !== 'private-prerelease' || manifest.public_publication_authorized !== false) {
    throw new Error('tarball manifest publication boundary is invalid');
  }
  if (manifest.tarball_sha256 !== tarballDigest || manifest.tarball_size !== tarballStat.size) {
    throw new Error('tarball manifest digest or size mismatch');
  }
  if (provenance.schema_version !== 1 || provenance.status !== 'PASS') throw new Error('provenance manifest schema is unsupported');
  if (provenance.subject?.sha256 !== tarballDigest || provenance.subject?.filename !== manifest.tarball_filename) {
    throw new Error('provenance subject differs from the tarball');
  }
  if (provenance.evidence?.tarball_manifest_sha256 !== manifestDigest) {
    throw new Error('provenance tarball-manifest digest mismatch');
  }
  if (
    provenance.policy?.release_channel !== 'private-prerelease'
    || provenance.policy?.public_publication_authorized !== false
    || provenance.policy?.marketplace_publication_authorized !== false
  ) {
    throw new Error('provenance publication boundary is invalid');
  }

  return {
    status: 'PASS',
    package_name: manifest.package_name,
    package_version: manifest.package_version,
    release_channel: manifest.release_channel,
    source_commit: sourceCommit,
    tarball_filename: manifest.tarball_filename,
    tarball_sha256: tarballDigest,
    checksum_entry_count: checksums.size,
  };
}

function packTarball(output, options = {}) {
  const sourceCommit = normalizeSourceCommit(options.sourceCommit ?? process.env.HAKIM_SOURCE_COMMIT ?? null);
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-native-pack-'));
  try {
    const packageRoot = path.join(workspace, 'package');
    const firstDestination = path.join(workspace, 'pack-a');
    const secondDestination = path.join(workspace, 'pack-b');
    const buildReport = build(packageRoot);
    const first = runNpmPack(packageRoot, firstDestination);
    const second = runNpmPack(packageRoot, secondDestination);
    const firstBytes = fs.readFileSync(first.tarball);
    const secondBytes = fs.readFileSync(second.tarball);
    const firstDigest = sha256(firstBytes);
    const secondDigest = sha256(secondBytes);
    if (first.report.filename !== second.report.filename || firstDigest !== secondDigest || !firstBytes.equals(secondBytes)) {
      throw new Error('repeated npm pack output is not byte-identical');
    }

    const files = assertPackageInventory(packageRoot, first.report);
    const finalTarball = path.join(output, first.report.filename);
    fs.copyFileSync(first.tarball, finalTarball, fs.constants.COPYFILE_EXCL);
    const manifest = {
      schema_version: 2,
      status: 'PASS',
      package_name: buildReport.package_name,
      package_version: buildReport.package_version,
      release_channel: buildReport.release_channel,
      public_publication_authorized: false,
      marketplace_publication_authorized: false,
      node_engine: buildReport.node_engine,
      tested_opencode_range: buildReport.tested_opencode_range,
      source_repository: buildReport.source_repository,
      source_commit: sourceCommit,
      tarball_filename: first.report.filename,
      tarball_sha256: firstDigest,
      tarball_size: firstBytes.length,
      npm_shasum: first.report.shasum,
      npm_integrity: first.report.integrity,
      unpacked_size: first.report.unpackedSize,
      package_file_count: files.length,
      reproducible_npm_pack: true,
      source_checkout_required_for_use: false,
      install_command_count: 1,
      files,
    };
    const manifestPath = path.join(output, TARBALL_MANIFEST_FILE);
    writeJson(manifestPath, manifest);

    const provenance = {
      schema_version: 1,
      status: 'PASS',
      subject: {
        name: manifest.package_name,
        version: manifest.package_version,
        filename: manifest.tarball_filename,
        sha256: manifest.tarball_sha256,
        size: manifest.tarball_size,
      },
      source: {
        repository: manifest.source_repository,
        commit: sourceCommit,
      },
      build: {
        builder: 'scripts/pack_native_plugin_tarball.mjs',
        reproducible_npm_pack: true,
        dependency_count: 0,
        node_engine: manifest.node_engine,
        tested_opencode_range: manifest.tested_opencode_range,
      },
      policy: {
        release_channel: manifest.release_channel,
        public_publication_authorized: false,
        marketplace_publication_authorized: false,
      },
      evidence: {
        tarball_manifest: TARBALL_MANIFEST_FILE,
        tarball_manifest_sha256: sha256(fs.readFileSync(manifestPath)),
      },
    };
    const provenancePath = path.join(output, PROVENANCE_FILE);
    writeJson(provenancePath, provenance);

    const checksumTargets = [finalTarball, manifestPath, provenancePath]
      .sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
    const checksumsPath = path.join(output, CHECKSUMS_FILE);
    fs.writeFileSync(checksumsPath, `${checksumTargets.map((candidate) => checksumLine(candidate, output)).join('\n')}\n`, {
      flag: 'wx',
      mode: 0o644,
    });

    const verification = verifyPrereleaseEvidence(output);
    return {
      ...manifest,
      output,
      tarball: finalTarball,
      manifest: manifestPath,
      provenance: provenancePath,
      checksums: checksumsPath,
      verification,
    };
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

function main() {
  let json = process.argv.includes('--json');
  try {
    const args = parseArgs(process.argv.slice(2));
    json = args.json;
    const result = packTarball(args.output, { sourceCommit: args.sourceCommit });
    if (json) console.log(JSON.stringify(result, null, 2));
    else for (const [key, value] of Object.entries(result)) {
      if (!Array.isArray(value) && typeof value !== 'object') console.log(`${key.toUpperCase()}=${value}`);
    }
  } catch (error) {
    if (json) console.log(JSON.stringify({ status: 'FAIL', error: error.message }, null, 2));
    else console.error(`STATUS=FAIL\nERROR=${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();

export {
  CHECKSUMS_FILE,
  PROVENANCE_FILE,
  TARBALL_MANIFEST_FILE,
  assertPackageInventory,
  normalizeSourceCommit,
  normalizedPackFiles,
  packTarball,
  parseArgs,
  readChecksums,
  runNpmPack,
  verifyPrereleaseEvidence,
};
