import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const OPENCODE_ROOT = '.opencode';
export const PLUGIN_RELATIVE_PATH = '.opencode/plugins/hakim.js';
export const RUNTIME_RELATIVE_ROOT = '.opencode/hakim-runtime';
export const INSTALL_MANIFEST_RELATIVE_PATH = '.opencode/hakim-runtime/install-manifest.json';
const MANIFEST_SCHEMA_VERSION = 1;
const MAX_MANIFEST_FILES = 256;
const MAX_MANIFEST_BYTES = 256 * 1024;

// Accepted live candidate b442820d2803955d0f7f33b405bd096f443d4d72.
// These hashes came from the immutable public-safe OpenCode acceptance journey.
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
  if (contract?.schema_version !== 1 || !Array.isArray(contract.capabilities)) {
    throw new Error('unsupported capability contract');
  }

  const sourceToTarget = new Map([
    ['plugins/opencode/hakim.mjs', PLUGIN_RELATIVE_PATH],
    ['core/loaders/hakim-loader.mjs', path.posix.join(RUNTIME_RELATIVE_ROOT, 'loaders/hakim-loader.mjs')],
    [capabilitiesRelative, path.posix.join(RUNTIME_RELATIVE_ROOT, 'hakim-skill/capabilities.json')],
  ]);

  for (const capability of contract.capabilities) {
    if (!capability?.id || !capability?.canonical_path) {
      throw new Error('malformed capability contract record');
    }
    const target = skillTarget(capability.canonical_path);
    const existing = sourceToTarget.get(capability.canonical_path);
    if (existing && existing !== target) {
      throw new Error(`conflicting target for ${capability.canonical_path}`);
    }
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

  const targetSet = new Set(files.map((file) => file.target_relative));
  if (targetSet.size !== files.length) throw new Error('duplicate OpenCode target path in bundle');

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
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { ok: false, message: 'install manifest must be an object' };
  if (manifest.schema_version !== MANIFEST_SCHEMA_VERSION) return { ok: false, message: 'unsupported install manifest schema' };
  if (manifest.adapter !== 'hakim-opencode-project-plugin') return { ok: false, message: 'unexpected install manifest adapter' };
  if (typeof manifest.product_version !== 'string' || manifest.product_version.trim().length === 0) return { ok: false, message: 'install manifest product_version is invalid' };
  if (!Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_MANIFEST_FILES) return { ok: false, message: 'install manifest file inventory is invalid' };

  const seen = new Set();
  for (const record of manifest.files) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return { ok: false, message: 'install manifest contains a malformed file record' };
    if (!safeManagedRelative(record.target_relative)) return { ok: false, message: `unsafe install manifest path: ${String(record.target_relative)}` };
    if (seen.has(record.target_relative)) return { ok: false, message: `duplicate install manifest path: ${record.target_relative}` };
    seen.add(record.target_relative);
    if (!/^[a-f0-9]{64}$/.test(record.sha256 || '')) return { ok: false, message: `invalid install manifest sha256 for ${record.target_relative}` };
    if (!Number.isSafeInteger(record.size) || record.size < 0) return { ok: false, message: `invalid install manifest size for ${record.target_relative}` };
  }
  return { ok: true };
}

export function readInstalledManifest(targetRoot) {
  const manifestPath = path.join(targetRoot, INSTALL_MANIFEST_RELATIVE_PATH);
  const state = inspectEntry(manifestPath, 'file');
  if (state.state === 'MISSING') return { state: 'ABSENT', manifest_path: manifestPath };
  if (!state.ok) return { state: 'INVALID', manifest_path: manifestPath, message: `install manifest is ${state.state}` };
  if (state.stat.size > MAX_MANIFEST_BYTES) return { state: 'INVALID', manifest_path: manifestPath, message: 'install manifest is too large' };

  let bytes;
  let manifest;
  try {
    bytes = fs.readFileSync(manifestPath);
    manifest = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    return { state: 'INVALID', manifest_path: manifestPath, message: `install manifest is unreadable: ${error.message}` };
  }
  const validation = validateInstallManifest(manifest);
  if (!validation.ok) return { state: 'INVALID', manifest_path: manifestPath, message: validation.message };
  return {
    state: 'VALID',
    manifest_path: manifestPath,
    manifest,
    raw_sha256: sha256(bytes),
    raw_size: bytes.length,
  };
}

export function inspectManifestFiles(targetRoot, manifest) {
  const entries = manifest.files.map((record) => {
    const targetPath = path.join(targetRoot, record.target_relative);
    const state = inspectEntry(targetPath, 'file');
    if (!state.ok) {
      return { ...record, target_path: targetPath, target_state: state.state, target_sha256: null, exact_match: false };
    }
    const bytes = fs.readFileSync(targetPath);
    const targetHash = sha256(bytes);
    return {
      ...record,
      target_path: targetPath,
      target_state: 'PRESENT',
      target_sha256: targetHash,
      exact_match: bytes.length === record.size && targetHash === record.sha256,
    };
  });

  const missing = entries.filter((entry) => entry.target_state === 'MISSING');
  const unsafe = entries.filter((entry) => !['MISSING', 'PRESENT'].includes(entry.target_state));
  const different = entries.filter((entry) => entry.target_state === 'PRESENT' && !entry.exact_match);
  const exact = entries.filter((entry) => entry.exact_match);
  let aggregate_state = 'PARTIAL_OR_DIFFERENT';
  if (missing.length === entries.length) aggregate_state = 'ABSENT';
  else if (exact.length === entries.length) aggregate_state = 'EXACT_MATCH';
  else if (unsafe.length > 0) aggregate_state = 'UNSAFE';

  return {
    entries,
    aggregate_state,
    counts: { total: entries.length, missing: missing.length, exact: exact.length, different: different.length, unsafe: unsafe.length },
  };
}

export function manifestsEquivalent(left, right) {
  if (!left || !right) return false;
  if (left.schema_version !== right.schema_version || left.adapter !== right.adapter || left.product_version !== right.product_version) return false;
  if (!Array.isArray(left.files) || !Array.isArray(right.files) || left.files.length !== right.files.length) return false;
  return left.files.every((record, index) => {
    const other = right.files[index];
    return record.target_relative === other.target_relative && record.sha256 === other.sha256 && record.size === other.size;
  });
}

export function detectManagedInstallation(targetRoot, bundle) {
  const installedManifest = readInstalledManifest(targetRoot);
  if (installedManifest.state === 'INVALID') {
    return { state: 'MANIFEST_INVALID', manifest_source: 'INSTALLED_MANIFEST', message: installedManifest.message, inspection: null };
  }
  if (installedManifest.state === 'VALID') {
    const inspection = inspectManifestFiles(targetRoot, installedManifest.manifest);
    if (inspection.aggregate_state === 'EXACT_MATCH') {
      return { state: 'EXACT_MATCH', manifest_source: 'INSTALLED_MANIFEST', manifest: installedManifest.manifest, manifest_record: installedManifest, inspection };
    }
    return {
      state: inspection.aggregate_state === 'UNSAFE' ? 'UNSAFE' : 'PARTIAL_OR_MODIFIED',
      manifest_source: 'INSTALLED_MANIFEST',
      manifest: installedManifest.manifest,
      manifest_record: installedManifest,
      inspection,
      message: 'Installed manifest exists, but one or more managed files no longer match it.',
    };
  }

  for (const legacy of SUPPORTED_LEGACY_MANIFESTS) {
    const inspection = inspectManifestFiles(targetRoot, legacy);
    if (inspection.aggregate_state === 'EXACT_MATCH') {
      return { state: 'LEGACY_EXACT_MATCH', manifest_source: 'ACCEPTED_LEGACY_MANIFEST', manifest: legacy, inspection };
    }
  }

  const currentManifest = manifestFromBundle(bundle);
  const currentInspection = inspectManifestFiles(targetRoot, currentManifest);
  if (currentInspection.aggregate_state === 'EXACT_MATCH') {
    return { state: 'UNMANIFESTED_CURRENT_EXACT', manifest_source: 'CURRENT_BUNDLE', manifest: currentManifest, inspection: currentInspection };
  }
  if (currentInspection.aggregate_state === 'ABSENT') {
    return { state: 'ABSENT', manifest_source: null, manifest: null, inspection: currentInspection };
  }
  return {
    state: currentInspection.aggregate_state === 'UNSAFE' ? 'UNSAFE' : 'UNMANAGED_CONFLICT',
    manifest_source: null,
    manifest: null,
    inspection: currentInspection,
    message: 'Managed Hakim paths exist without a supported exact manifest.',
  };
}

export function fileRecordMatches(targetRoot, record) {
  const targetPath = path.join(targetRoot, record.target_relative);
  const state = inspectEntry(targetPath, 'file');
  if (!state.ok) return { ok: false, state: state.state, target_path: targetPath };
  const bytes = fs.readFileSync(targetPath);
  return {
    ok: bytes.length === record.size && sha256(bytes) === record.sha256,
    state: 'PRESENT',
    target_path: targetPath,
  };
}

export function createPrivateWorkRoot(targetRoot, prefix) {
  const parent = path.join(targetRoot, OPENCODE_ROOT);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = crypto.randomBytes(8).toString('hex');
    const candidate = path.join(parent, `.${prefix}-${process.pid}-${token}`);
    try {
      fs.mkdirSync(candidate, { mode: 0o700 });
      return candidate;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error(`could not allocate a unique ${prefix} directory`);
}

function workRelative(targetRelative) {
  const prefix = `${OPENCODE_ROOT}/`;
  if (!targetRelative.startsWith(prefix)) throw new Error(`unsafe work target: ${targetRelative}`);
  const relative = targetRelative.slice(prefix.length);
  if (!relative || relative.startsWith('..') || path.posix.isAbsolute(relative)) throw new Error(`unsafe work target: ${targetRelative}`);
  return relative;
}

export function moveVerifiedRecordToWorkRoot(targetRoot, workRoot, record) {
  const before = fileRecordMatches(targetRoot, record);
  if (!before.ok) throw new Error(`${record.target_relative} changed before quarantine: ${before.state}`);
  const destination = path.join(workRoot, workRelative(record.target_relative));
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  fs.renameSync(before.target_path, destination);
  const state = inspectEntry(destination, 'file');
  if (!state.ok) throw new Error(`${record.target_relative} quarantine move produced ${state.state}`);
  const bytes = fs.readFileSync(destination);
  if (bytes.length !== record.size || sha256(bytes) !== record.sha256) {
    const error = new Error(`${record.target_relative} changed during quarantine move`);
    error.quarantined_record = { record, source_path: before.target_path, quarantine_path: destination };
    throw error;
  }
  return { record, source_path: before.target_path, quarantine_path: destination };
}

export function restoreQuarantinedRecords(items) {
  const errors = [];
  for (const item of [...items].reverse()) {
    const quarantineState = inspectEntry(item.quarantine_path, 'file');
    if (!quarantineState.ok) {
      errors.push(`${item.record.target_relative}: quarantine is ${quarantineState.state}`);
      continue;
    }
    const bytes = fs.readFileSync(item.quarantine_path);
    if (bytes.length !== item.record.size || sha256(bytes) !== item.record.sha256) {
      errors.push(`${item.record.target_relative}: quarantined bytes no longer match owned record`);
      continue;
    }
    const targetState = inspectEntry(item.source_path, 'file');
    if (targetState.state !== 'MISSING') {
      errors.push(`${item.record.target_relative}: target reappeared; not overwritten`);
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(item.source_path), { recursive: true, mode: 0o755 });
      fs.copyFileSync(item.quarantine_path, item.source_path, fs.constants.COPYFILE_EXCL);
      const restored = fs.readFileSync(item.source_path);
      if (restored.length !== item.record.size || sha256(restored) !== item.record.sha256) {
        errors.push(`${item.record.target_relative}: restored hash mismatch`);
        continue;
      }
      fs.unlinkSync(item.quarantine_path);
    } catch (error) {
      errors.push(`${item.record.target_relative}: ${error.message}`);
    }
  }
  return errors;
}

export function removeCreatedRecordIfUnchanged(targetRoot, record) {
  const match = fileRecordMatches(targetRoot, record);
  if (match.state === 'MISSING') return { ok: true, removed: false };
  if (!match.ok) return { ok: false, removed: false, message: `${record.target_relative}: changed after creation; preserved` };
  fs.unlinkSync(match.target_path);
  return { ok: true, removed: true };
}

export function validateTargetRoot(target) {
  const targetRoot = path.resolve(target);
  const state = inspectEntry(targetRoot, 'directory');
  if (!state.ok) {
    return { ok: false, target_root: targetRoot, state: `REFUSED_TARGET_${state.state}`, message: 'Use the real path to an existing repository directory.' };
  }
  return { ok: true, target_root: targetRoot };
}

export function validateDirectoryChain(targetRoot, relativeDirectories) {
  for (const relative of relativeDirectories) {
    const absolute = path.join(targetRoot, relative);
    const state = inspectEntry(absolute, 'directory');
    if (state.state === 'MISSING') continue;
    if (!state.ok) {
      return {
        ok: false,
        state: `REFUSED_${relative.replaceAll(/[\\/.-]+/g, '_').toUpperCase()}_${state.state}`,
        path: absolute,
        message: `The existing ${relative} path must be a real directory.`,
      };
    }
  }
  return { ok: true };
}

export function inspectInstalledBundle(targetRoot, bundle) {
  return inspectManifestFiles(targetRoot, manifestFromBundle(bundle));
}

export function bundleDirectories(bundle) {
  const directories = new Set([OPENCODE_ROOT, RUNTIME_RELATIVE_ROOT]);
  for (const file of bundle.files) {
    let current = path.posix.dirname(file.target_relative);
    while (current && current !== '.') {
      directories.add(current);
      if (current === OPENCODE_ROOT) break;
      current = path.posix.dirname(current);
    }
  }
  return [...directories].sort((left, right) => {
    const depth = (value) => value.split('/').length;
    return depth(left) - depth(right) || left.localeCompare(right);
  });
}

export function removeEmptyDirectories(targetRoot, relativeDirectories) {
  const ordered = [...relativeDirectories].sort((left, right) => {
    const depth = (value) => value.split('/').length;
    return depth(right) - depth(left) || right.localeCompare(left);
  });
  const removed = [];
  for (const relative of ordered) {
    if (relative === OPENCODE_ROOT) continue;
    const absolute = path.join(targetRoot, relative);
    try {
      fs.rmdirSync(absolute);
      removed.push(relative);
    } catch (error) {
      if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) throw error;
    }
  }
  return removed;
}
