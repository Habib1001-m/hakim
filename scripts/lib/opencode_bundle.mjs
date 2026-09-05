import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const OPENCODE_ROOT = '.opencode';
export const PLUGIN_RELATIVE_PATH = '.opencode/plugins/hakim.js';
export const RUNTIME_RELATIVE_ROOT = '.opencode/hakim-runtime';
export const INSTALL_MANIFEST_RELATIVE_PATH = '.opencode/hakim-runtime/install-manifest.json';

const MANIFEST_SCHEMA_VERSION = 1;
const CAPABILITY_SCHEMA_VERSION = 2;
const MAX_MANIFEST_FILES = 256;
const MAX_MANIFEST_BYTES = 256 * 1024;

// Immutable public-safe evidence from the accepted pre-manifest OpenCode
// journey at b442820d2803955d0f7f33b405bd096f443d4d72. This bounded record
// exists only so that exact already-installed beta.1 payloads are not stranded
// when the manifest-backed lifecycle is introduced.
export const SUPPORTED_LEGACY_MANIFESTS = Object.freeze([
  Object.freeze({
    schema_version: 1,
    adapter: 'hakim-opencode-project-plugin',
    product_version: '1.0.0-beta.1',
    source_commit: 'b442820d2803955d0f7f33b405bd096f443d4d72',
    files: Object.freeze([
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/capabilities.json', sha256: '2a5be5689884d9dec317575713d048df6532a46445f7d2f90cd16fbcdc023847', size: 5899 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/SKILL.md', sha256: 'bc3622f534593772ef1fee0d4c988747886ed1cef3763d48ad4392d9f4807939', size: 5627 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-audit/SKILL.md', sha256: '1b3d85a24c67563539e3bbbee7781f604a757c8dcb31e2a212f6c7613ef89527', size: 5563 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-debt/SKILL.md', sha256: 'dc844dba58c727c9b3c607c6553ac13ddb581a30bf840a3d96cdc35476898758', size: 3090 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-gain/SKILL.md', sha256: '310314029f9741d142614a70c3e6db6ce944696da00b3ba7ecccc3cd95314118', size: 1546 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-help/SKILL.md', sha256: '627ac964eadf714b419d11f49e2dee94642d0251573c141958e5fe8a921eb50f', size: 3496 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-review/SKILL.md', sha256: 'd038acd933184a1dfba15a8310e603187e24f9405bad20f9b648840d3bad80d4', size: 2910 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/loaders/hakim-loader.mjs', sha256: 'c047cfc0cfd78a9bbb1027367e92eaa5b2174eaa3fdb977e26bd1b44f8fa8553', size: 1799 }),
      Object.freeze({ target_relative: '.opencode/plugins/hakim.js', sha256: 'c376602fa072aad4e9fe851c772591801c3cf8479ff518cba308e308c47d9c88', size: 6280 }),
    ]),
  }),
]);

export function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function inspectEntry(entryPath, expectedType = null) {
  let stat;
  try {
    stat = fs.lstatSync(entryPath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return { state: 'MISSING', ok: false };
    return { state: 'UNREADABLE', ok: false, error };
  }

  if (stat.isSymbolicLink()) return { state: 'SYMLINK', ok: false };
  if (expectedType === 'file' && !stat.isFile()) return { state: 'NOT_FILE', ok: false };
  if (expectedType === 'directory' && !stat.isDirectory()) return { state: 'NOT_DIRECTORY', ok: false };
  return { state: 'PRESENT', ok: true, stat };
}

function assertCanonicalSource(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const state = inspectEntry(absolutePath, 'file');
  if (!state.ok) throw new Error(`canonical source ${relativePath} is ${state.state}`);
  return absolutePath;
}

function skillTarget(canonicalPath) {
  const prefix = 'core/hakim-skill/';
  if (!canonicalPath.startsWith(prefix)) {
    throw new Error(`unsupported canonical skill path outside ${prefix}: ${canonicalPath}`);
  }
  return path.posix.join(RUNTIME_RELATIVE_ROOT, 'hakim-skill', canonicalPath.slice(prefix.length));
}

export function buildOpenCodeBundle(root) {
  const capabilitiesRelative = 'core/hakim-skill/capabilities.json';
  const capabilitiesPath = assertCanonicalSource(root, capabilitiesRelative);
  const versionPath = assertCanonicalSource(root, 'core/hakim-skill/VERSION');
  const productVersion = fs.readFileSync(versionPath, 'utf8').trim();
  if (!productVersion) throw new Error('canonical VERSION is empty');

  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8'));
  } catch (error) {
    throw new Error(`invalid capability contract: ${error.message}`);
  }
  if (contract?.schema_version !== CAPABILITY_SCHEMA_VERSION || !Array.isArray(contract.capabilities)) {
    throw new Error('unsupported capability contract');
  }

  const sourceToTarget = new Map([
    ['plugins/opencode/hakim.mjs', PLUGIN_RELATIVE_PATH],
    ['core/loaders/hakim-loader.mjs', path.posix.join(RUNTIME_RELATIVE_ROOT, 'loaders/hakim-loader.mjs')],
    [capabilitiesRelative, path.posix.join(RUNTIME_RELATIVE_ROOT, 'hakim-skill/capabilities.json')],
  ]);

  for (const capability of contract.capabilities) {
    if (!capability?.id || !capability?.canonical_path) throw new Error('malformed capability contract record');
    const target = skillTarget(capability.canonical_path);
    const existing = sourceToTarget.get(capability.canonical_path);
    if (existing && existing !== target) throw new Error(`conflicting target for ${capability.canonical_path}`);
    sourceToTarget.set(capability.canonical_path, target);
  }

  const files = [...sourceToTarget.entries()]
    .map(([sourceRelative, targetRelative]) => {
      const sourcePath = assertCanonicalSource(root, sourceRelative);
      const bytes = fs.readFileSync(sourcePath);
      return {
        source_relative: sourceRelative,
        source_path: sourcePath,
        target_relative: targetRelative,
        bytes,
        sha256: sha256(bytes),
        size: bytes.length,
      };
    })
    .sort((left, right) => left.target_relative.localeCompare(right.target_relative));

  if (new Set(files.map((file) => file.target_relative)).size !== files.length) {
    throw new Error('duplicate OpenCode target path in bundle');
  }

  return {
    schema_version: 1,
    adapter: 'hakim-opencode-project-plugin',
    product_version: productVersion,
    mutation_scope: [PLUGIN_RELATIVE_PATH, RUNTIME_RELATIVE_ROOT],
    opencode_config_mutation: false,
    canonical_capabilities: contract.capabilities.map((capability) => capability.id),
    files,
  };
}

export function manifestFromBundle(bundle) {
  return {
    schema_version: MANIFEST_SCHEMA_VERSION,
    adapter: bundle.adapter,
    product_version: bundle.product_version,
    files: bundle.files.map((file) => ({
      target_relative: file.target_relative,
      sha256: file.sha256,
      size: file.size,
    })),
  };
}

export function manifestBytes(manifest) {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function safeManagedRelative(relative) {
  if (typeof relative !== 'string' || relative.length === 0 || relative.includes('\\') || relative.includes('\0')) return false;
  if (path.posix.isAbsolute(relative)) return false;
  const normalized = path.posix.normalize(relative);
  if (normalized !== relative || relative === INSTALL_MANIFEST_RELATIVE_PATH) return false;
  if (relative === PLUGIN_RELATIVE_PATH) return true;
  return relative.startsWith(`${RUNTIME_RELATIVE_ROOT}/`);
}

export function validateInstallManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, message: 'install manifest must be an object' };
  }
  if (manifest.schema_version !== MANIFEST_SCHEMA_VERSION) {
    return { ok: false, message: 'unsupported install manifest schema' };
  }
  if (manifest.adapter !== 'hakim-opencode-project-plugin') {
    return { ok: false, message: 'unexpected install manifest adapter' };
  }
  if (typeof manifest.product_version !== 'string' || manifest.product_version.trim().length === 0) {
    return { ok: false, message: 'install manifest product_version is invalid' };
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_MANIFEST_FILES) {
    return { ok: false, message: 'install manifest file inventory is invalid' };
  }

  const seen = new Set();
  for (const record of manifest.files) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return { ok: false, message: 'install manifest contains a malformed file record' };
    }
    if (!safeManagedRelative(record.target_relative)) {
      return { ok: false, message: `install manifest path is outside managed scope: ${record.target_relative}` };
    }
    if (typeof record.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(record.sha256)) {
      return { ok: false, message: `install manifest sha256 is invalid: ${record.target_relative}` };
    }
    if (!Number.isSafeInteger(record.size) || record.size < 0 || record.size > MAX_MANIFEST_BYTES) {
      return { ok: false, message: `install manifest size is invalid: ${record.target_relative}` };
    }
    if (seen.has(record.target_relative)) {
      return { ok: false, message: `install manifest contains duplicate path: ${record.target_relative}` };
    }
    seen.add(record.target_relative);
  }

  return { ok: true };
}

export function supportedLegacyManifestForState(root) {
  for (const manifest of SUPPORTED_LEGACY_MANIFESTS) {
    if (manifest.files.every((file) => {
      const fullPath = path.join(root, file.target_relative);
      const state = inspectEntry(fullPath, 'file');
      if (!state.ok) return false;
      const bytes = fs.readFileSync(fullPath);
      return bytes.length === file.size && sha256(bytes) === file.sha256;
    })) {
      return manifest;
    }
  }
  return null;
}

export function exactManifestFileMap(manifest) {
  const validation = validateInstallManifest(manifest);
  if (!validation.ok) throw new Error(validation.message);
  return new Map(manifest.files.map((file) => [file.target_relative, file]));
}
