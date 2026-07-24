import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const OPENCODE_ROOT = '.opencode';
export const PLUGIN_RELATIVE_PATH = '.opencode/plugins/hakim.js';
export const RUNTIME_RELATIVE_ROOT = '.opencode/hakim-runtime';

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
    mutation_scope: [PLUGIN_RELATIVE_PATH, RUNTIME_RELATIVE_ROOT],
    opencode_config_mutation: false,
    canonical_capabilities: contract.capabilities.map((capability) => capability.id),
    files,
  };
}

export function validateTargetRoot(target) {
  const targetRoot = path.resolve(target);
  const state = inspectEntry(targetRoot, 'directory');
  if (!state.ok) {
    return {
      ok: false,
      target_root: targetRoot,
      state: `REFUSED_TARGET_${state.state}`,
      message: 'Use the real path to an existing repository directory.',
    };
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
  const entries = bundle.files.map((file) => {
    const targetPath = path.join(targetRoot, file.target_relative);
    const state = inspectEntry(targetPath, 'file');
    if (!state.ok) {
      return {
        ...file,
        target_path: targetPath,
        target_state: state.state,
        target_sha256: null,
        exact_match: false,
      };
    }
    const bytes = fs.readFileSync(targetPath);
    const targetHash = sha256(bytes);
    return {
      ...file,
      target_path: targetPath,
      target_state: 'PRESENT',
      target_sha256: targetHash,
      exact_match: targetHash === file.sha256,
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
    counts: {
      total: entries.length,
      missing: missing.length,
      exact: exact.length,
      different: different.length,
      unsafe: unsafe.length,
    },
  };
}

export function bundleDirectories(bundle) {
  const directories = new Set([OPENCODE_ROOT]);
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
