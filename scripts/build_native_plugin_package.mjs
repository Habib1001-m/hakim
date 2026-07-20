#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const DEFAULT_OUTPUT = path.join(ROOT, 'dist', 'npm', 'hakim');
const NATIVE_PRERELEASE_SUFFIX = 'beta.1';
const NATIVE_RELEASE_CHANNEL = 'private-prerelease';
const TESTED_OPENCODE_RANGE = '>=1.18.3 <2';
const SOURCE_REPOSITORY = 'https://github.com/Habib1001-m/hakim';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function regularFile(candidate) {
  try {
    const stat = fs.lstatSync(candidate);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function readJson(candidate, label) {
  if (!regularFile(candidate)) throw new Error(`${label} is missing or unsafe: ${path.relative(ROOT, candidate)}`);
  return JSON.parse(fs.readFileSync(candidate, 'utf8'));
}

function prereleaseVersion(version) {
  const value = String(version || '');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error(`root package version is not supported: ${value || 'missing'}`);
  }
  if (value.includes('-')) return value;
  return `${value}-${NATIVE_PRERELEASE_SUFFIX}`;
}

function parseArgs(argv) {
  const args = { output: DEFAULT_OUTPUT, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--output') args.output = path.resolve(argv[++index] || '');
    else if (token === '--json') args.json = true;
    else throw new Error(`unknown argument: ${token}`);
  }
  if (!args.output) throw new Error('--output requires a path');
  return args;
}

function copyFile(source, destination, mode = 0o644) {
  if (!regularFile(source)) throw new Error(`canonical source is missing or unsafe: ${path.relative(ROOT, source)}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(destination, mode);
}

function commandMarkdown(capability) {
  const description = capability.id === 'hakim'
    ? 'Set Hakim mode for this request: lite, full, ultra, or off.'
    : capability.purpose;
  const body = capability.id === 'hakim'
    ? 'Load the `hakim` skill, apply mode `$1` when supplied, and use the remaining arguments as the explicit request. Valid modes are lite, full, ultra, and off.\n\nRequest: $ARGUMENTS'
    : `Load the \`${capability.id}\` skill with OpenCode's native skill tool and apply it only to the explicit scope below.\n\nRequest: $ARGUMENTS`;
  return `---\ndescription: ${description}\n---\n\n${body}\n`;
}

function writeText(destination, content, mode = 0o644) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, { flag: 'wx', mode });
}

function collectFiles(root) {
  const records = [];
  const visit = (directory, prefix = '') => {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const relative = path.posix.join(prefix, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`build output contains a symlink: ${relative}`);
      if (stat.isDirectory()) visit(absolute, relative);
      else if (stat.isFile()) {
        const content = fs.readFileSync(absolute);
        records.push({ path: relative, sha256: sha256(content), size: content.length });
      } else throw new Error(`build output contains a non-regular entry: ${relative}`);
    }
  };
  visit(root);
  return records;
}

function build(output) {
  const rootPackage = readJson(path.join(ROOT, 'package.json'), 'root package manifest');
  const capabilitiesContract = readJson(
    path.join(ROOT, 'core', 'hakim-skill', 'capabilities.json'),
    'canonical capability contract',
  );
  if (rootPackage.name !== '@habib/hakim' || typeof rootPackage.version !== 'string') {
    throw new Error('root package identity is unsupported');
  }
  if (capabilitiesContract.schema_version !== 1 || !Array.isArray(capabilitiesContract.capabilities)) {
    throw new Error('canonical capability contract is unsupported');
  }
  const capabilities = capabilitiesContract.capabilities;
  const ids = capabilities.map((item) => item.id);
  if (new Set(ids).size !== ids.length || ids.length !== 6 || !ids.includes('hakim')) {
    throw new Error('native package requires the six canonical Hakim capabilities');
  }

  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  const packageManifest = {
    name: rootPackage.name,
    version: prereleaseVersion(rootPackage.version),
    description: 'Install Hakim as an always-on safe simplification and review companion for OpenCode.',
    keywords: ['opencode', 'ai-coding', 'code-review', 'minimalism', 'developer-tools'],
    type: 'module',
    bin: { hakim: 'bin/hakim.mjs' },
    exports: { '.': './payload/plugins/hakim.mjs' },
    files: ['bin', 'payload', 'integrity.json', 'README.md'],
    engines: { node: '>=18' },
    repository: { type: 'git', url: 'git+https://github.com/Habib1001-m/hakim.git' },
    homepage: `${SOURCE_REPOSITORY}#readme`,
    bugs: { url: `${SOURCE_REPOSITORY}/issues` },
    hakim: {
      release_channel: NATIVE_RELEASE_CHANNEL,
      public_publication_authorized: false,
      marketplace_publication_authorized: false,
      tested_opencode_range: TESTED_OPENCODE_RANGE,
      provenance_evidence: 'external-artifact-manifests',
    },
    license: rootPackage.license || 'MIT',
  };
  writeText(path.join(output, 'package.json'), `${JSON.stringify(packageManifest, null, 2)}\n`);
  copyFile(
    path.join(ROOT, 'packaging', 'native-plugin', 'hakim-cli.mjs'),
    path.join(output, 'bin', 'hakim.mjs'),
    0o755,
  );
  for (const name of ['ownership.mjs', 'transaction.mjs', 'realpath-containment.mjs', 'lifecycle.mjs']) {
    copyFile(
      path.join(ROOT, 'packaging', 'native-plugin', 'lib', name),
      path.join(output, 'bin', 'lib', name),
    );
  }
  copyFile(
    path.join(ROOT, 'packaging', 'native-plugin', 'opencode-plugin.mjs'),
    path.join(output, 'payload', 'plugins', 'hakim.mjs'),
  );
  copyFile(
    path.join(ROOT, 'core', 'loaders', 'hakim-loader.mjs'),
    path.join(output, 'payload', 'hakim-runtime', 'loaders', 'hakim-loader.mjs'),
  );
  copyFile(
    path.join(ROOT, 'core', 'hakim-skill', 'SKILL.md'),
    path.join(output, 'payload', 'hakim-runtime', 'hakim-skill', 'SKILL.md'),
  );
  copyFile(
    path.join(ROOT, 'core', 'hakim-skill', 'capabilities.json'),
    path.join(output, 'payload', 'hakim-runtime', 'hakim-skill', 'capabilities.json'),
  );

  for (const capability of capabilities) {
    const canonical = path.join(ROOT, ...capability.canonical_path.split('/'));
    const skillDestination = path.join(output, 'payload', 'skills', capability.id, 'SKILL.md');
    if (capability.id === 'hakim') copyFile(path.join(ROOT, 'core', 'hakim-skill', 'SKILL.md'), skillDestination);
    else copyFile(canonical, skillDestination);
    writeText(path.join(output, 'payload', 'commands', `${capability.id}.md`), commandMarkdown(capability));
    if (capability.id !== 'hakim') {
      copyFile(
        canonical,
        path.join(output, 'payload', 'hakim-runtime', 'hakim-skill', 'skills', capability.id, 'SKILL.md'),
      );
    }
  }

  const readme = `# Hakim Native Plugin\n\nThis is a verified private prerelease candidate. Public npm and marketplace publication remain unauthorized.\n\nInstall from a verified package artifact:\n\n\`\`\`bash\nnpx /absolute/path/to/habib-hakim-*.tgz install\n\`\`\`\n\nRestart OpenCode or open a new session. Hakim runs in \`full\` mode by default. Use \`/hakim-help\` for the quick reference and run the same verified artifact with \`remove\` to remove only Hakim-owned state.\n\nThe installer writes only to OpenCode's global config directory, records SHA-256 ownership, refuses partial or conflicting state, and never edits \`opencode.json\`.\n`;
  writeText(path.join(output, 'README.md'), readme);

  const beforeIntegrity = collectFiles(output);
  const integrity = {
    schema_version: 1,
    package_name: packageManifest.name,
    package_version: packageManifest.version,
    reproducible: true,
    canonical_capability_count: capabilities.length,
    files: beforeIntegrity,
  };
  writeText(path.join(output, 'integrity.json'), `${JSON.stringify(integrity, null, 2)}\n`);

  const finalFiles = collectFiles(output);
  return {
    status: 'PASS',
    output,
    package_name: packageManifest.name,
    package_version: packageManifest.version,
    release_channel: NATIVE_RELEASE_CHANNEL,
    public_publication_authorized: false,
    marketplace_publication_authorized: false,
    node_engine: packageManifest.engines.node,
    tested_opencode_range: TESTED_OPENCODE_RANGE,
    source_repository: SOURCE_REPOSITORY,
    dependency_count: 0,
    capability_count: capabilities.length,
    command_count: capabilities.length,
    skill_count: capabilities.length,
    payload_file_count: finalFiles.filter((record) => record.path.startsWith('payload/')).length,
    package_file_count: finalFiles.length,
    integrity_sha256: sha256(fs.readFileSync(path.join(output, 'integrity.json'))),
  };
}

function main() {
  let json = process.argv.includes('--json');
  try {
    const args = parseArgs(process.argv.slice(2));
    json = args.json;
    const result = build(args.output);
    if (json) console.log(JSON.stringify(result, null, 2));
    else for (const [key, value] of Object.entries(result)) console.log(`${key.toUpperCase()}=${value}`);
  } catch (error) {
    if (json) console.log(JSON.stringify({ status: 'FAIL', error: error.message }, null, 2));
    else console.error(`STATUS=FAIL\nERROR=${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();

export {
  NATIVE_PRERELEASE_SUFFIX,
  NATIVE_RELEASE_CHANNEL,
  SOURCE_REPOSITORY,
  TESTED_OPENCODE_RANGE,
  build,
  collectFiles,
  commandMarkdown,
  parseArgs,
  prereleaseVersion,
};
