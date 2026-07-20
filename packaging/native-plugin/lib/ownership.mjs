import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE_NAME = '@habib/hakim';
export const HOST = 'opencode';
export const INSTALL_SCOPE = 'global-user-config';
export const SCHEMA_VERSION = 1;
export const OWNERSHIP_FILE = '.hakim-install.json';
export const INTEGRITY_FILE = 'integrity.json';
export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PAYLOAD_ROOT = path.join(PACKAGE_ROOT, 'payload');

const CAPABILITY_IDS = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
export const SUPPORTED_OWNED_PATHS = Object.freeze([
  'plugins/hakim.mjs',
  'hakim-runtime/loaders/hakim-loader.mjs',
  'hakim-runtime/hakim-skill/SKILL.md',
  'hakim-runtime/hakim-skill/capabilities.json',
  ...CAPABILITY_IDS.map((id) => `commands/${id}.md`),
  ...CAPABILITY_IDS.map((id) => `skills/${id}/SKILL.md`),
  ...CAPABILITY_IDS.filter((id) => id !== 'hakim')
    .map((id) => `hakim-runtime/hakim-skill/skills/${id}/SKILL.md`),
].sort());
const SUPPORTED_OWNED_PATH_SET = new Set(SUPPORTED_OWNED_PATHS);

const OWNERSHIP_KEYS = ['schema_version', 'package_name', 'package_version', 'host', 'install_scope', 'files'];
const FILE_KEYS = ['path', 'sha256', 'size'];
const INTEGRITY_KEYS = [
  'schema_version',
  'package_name',
  'package_version',
  'reproducible',
  'canonical_capability_count',
  'files',
];

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function regularFile(candidate, fsOps = fs) {
  try {
    const stat = fsOps.lstatSync(candidate);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

export function realDirectory(candidate, fsOps = fs) {
  try {
    const stat = fsOps.lstatSync(candidate);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

export function readJson(candidate, label, fsOps = fs) {
  try {
    return JSON.parse(fsOps.readFileSync(candidate, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is missing or malformed: ${error.message}`);
  }
}

export function packageMetadata(fsOps = fs) {
  const manifest = readJson(path.join(PACKAGE_ROOT, 'package.json'), 'package manifest', fsOps);
  if (manifest.name !== PACKAGE_NAME || typeof manifest.version !== 'string' || !manifest.version.trim()) {
    throw new Error('unsupported Hakim package identity');
  }
  return { name: manifest.name, version: manifest.version };
}

export function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0')) return false;
  if (path.posix.isAbsolute(value) || path.posix.normalize(value) !== value) return false;
  return value.split('/').every((segment) => segment && segment !== '.' && segment !== '..');
}

function exactKeys(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function validateFileInventory(
  files,
  label,
  { nonEmpty = true, forbidIntegrity = false, enforceOwnedPaths = false } = {},
) {
  const errors = [];
  if (!Array.isArray(files) || (nonEmpty && files.length === 0)) {
    errors.push(`${label} must be ${nonEmpty ? 'a non-empty' : 'an'} array`);
    return errors;
  }
  const seen = new Set();
  for (const [index, record] of files.entries()) {
    if (!exactKeys(record, FILE_KEYS)) errors.push(`${label}[${index}] keys differ from schema`);
    if (!safeRelativePath(record?.path)) errors.push(`${label}[${index}] has unsafe path`);
    else if (forbidIntegrity && record.path === INTEGRITY_FILE) errors.push(`${label}[${index}] must not self-list ${INTEGRITY_FILE}`);
    else if (enforceOwnedPaths && !SUPPORTED_OWNED_PATH_SET.has(record.path)) {
      errors.push(`${label}[${index}] path is outside the supported Hakim-owned inventory: ${record.path}`);
    } else if (seen.has(record.path)) errors.push(`${label}[${index}] duplicates path ${record.path}`);
    else seen.add(record.path);
    if (!/^[0-9a-f]{64}$/.test(String(record?.sha256 || ''))) errors.push(`${label}[${index}] has invalid sha256`);
    if (!Number.isSafeInteger(record?.size) || record.size < 0) errors.push(`${label}[${index}] has invalid size`);
  }
  return errors;
}

export function validateOwnership(actual) {
  const errors = [];
  if (!exactKeys(actual, OWNERSHIP_KEYS)) errors.push('ownership record keys differ from schema');
  if (actual?.schema_version !== SCHEMA_VERSION) errors.push('unsupported ownership schema version');
  if (actual?.package_name !== PACKAGE_NAME) errors.push('unsupported ownership package name');
  if (typeof actual?.package_version !== 'string' || !actual.package_version.trim()) errors.push('invalid ownership package version');
  if (actual?.host !== HOST) errors.push('unsupported ownership host');
  if (actual?.install_scope !== INSTALL_SCOPE) errors.push('unsupported ownership install scope');
  errors.push(...validateFileInventory(
    actual?.files,
    'ownership file inventory',
    { enforceOwnedPaths: true },
  ));
  return errors;
}

export function ownershipPathSetMatches(actualFiles, expectedFiles) {
  if (!Array.isArray(actualFiles) || !Array.isArray(expectedFiles)) return false;
  const actual = actualFiles.map((record) => record?.path).sort();
  const expected = expectedFiles.map((record) => record?.path).sort();
  return actual.length === expected.length
    && actual.every((candidate, index) => candidate === expected[index]);
}

export function collectPackageFiles(root = PACKAGE_ROOT, fsOps = fs) {
  if (!realDirectory(root, fsOps)) throw new Error('Hakim package root is missing or unsafe');
  const records = [];
  const visit = (directory, prefix = '') => {
    for (const name of fsOps.readdirSync(directory).sort()) {
      const relative = path.posix.join(prefix, name);
      if (relative === INTEGRITY_FILE) continue;
      const absolute = path.join(directory, name);
      const stat = fsOps.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`package contains a symlink: ${relative}`);
      if (stat.isDirectory()) visit(absolute, relative);
      else if (stat.isFile()) {
        const content = fsOps.readFileSync(absolute);
        records.push({ path: relative, sha256: sha256(content), size: content.length });
      } else throw new Error(`package contains a non-regular entry: ${relative}`);
    }
  };
  visit(root);
  return records;
}

export function validatePackageIntegrity(fsOps = fs) {
  const errors = [];
  const metadata = packageMetadata(fsOps);
  const integrityPath = path.join(PACKAGE_ROOT, INTEGRITY_FILE);
  if (!regularFile(integrityPath, fsOps)) return [`${INTEGRITY_FILE} is missing or unsafe`];
  let integrity;
  try {
    integrity = readJson(integrityPath, 'package integrity record', fsOps);
  } catch (error) {
    return [error.message];
  }
  if (!exactKeys(integrity, INTEGRITY_KEYS)) errors.push('package integrity keys differ from schema');
  if (integrity?.schema_version !== 1) errors.push('unsupported package integrity schema version');
  if (integrity?.package_name !== metadata.name) errors.push('package integrity name differs from package manifest');
  if (integrity?.package_version !== metadata.version) errors.push('package integrity version differs from package manifest');
  if (integrity?.reproducible !== true) errors.push('package integrity reproducible flag must be true');
  if (!Number.isSafeInteger(integrity?.canonical_capability_count) || integrity.canonical_capability_count <= 0) {
    errors.push('package integrity capability count is invalid');
  }
  errors.push(...validateFileInventory(integrity?.files, 'package integrity file inventory', { forbidIntegrity: true }));
  if (errors.length > 0) return errors;

  let actual;
  try {
    actual = collectPackageFiles(PACKAGE_ROOT, fsOps);
  } catch (error) {
    return [error.message];
  }
  if (actual.length !== integrity.files.length) {
    errors.push(`package file inventory count differs: expected ${integrity.files.length}; actual ${actual.length}`);
  }
  const expectedByPath = new Map(integrity.files.map((record) => [record.path, record]));
  const actualByPath = new Map(actual.map((record) => [record.path, record]));
  for (const record of integrity.files) {
    const candidate = actualByPath.get(record.path);
    if (!candidate) errors.push(`${record.path}: missing from package`);
    else if (candidate.size !== record.size || candidate.sha256 !== record.sha256) errors.push(`${record.path}: package bytes differ from integrity record`);
  }
  for (const record of actual) {
    if (!expectedByPath.has(record.path)) errors.push(`${record.path}: unexpected package file`);
  }
  return errors;
}

export function assertPackageIntegrity(fsOps = fs) {
  const errors = validatePackageIntegrity(fsOps);
  if (errors.length > 0) throw new Error(`Hakim package integrity verification failed: ${errors.join('; ')}`);
}

export function walkPayload(root = PAYLOAD_ROOT, fsOps = fs) {
  if (!realDirectory(root, fsOps)) throw new Error('packaged Hakim payload is missing or unsafe');
  const records = [];
  const visit = (directory, prefix = '') => {
    for (const name of fsOps.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const relative = path.posix.join(prefix, name);
      const stat = fsOps.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`packaged payload contains a symlink: ${relative}`);
      if (stat.isDirectory()) visit(absolute, relative);
      else if (stat.isFile()) {
        const content = fsOps.readFileSync(absolute);
        records.push({ path: relative, relative, absolute, content, sha256: sha256(content), size: content.length });
      } else throw new Error(`packaged payload contains a non-regular entry: ${relative}`);
    }
  };
  visit(root);
  if (records.length === 0) throw new Error('packaged Hakim payload is empty');
  return records;
}

export function nearestExistingParent(candidate, fsOps = fs) {
  let current = path.resolve(candidate);
  while (!fsOps.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return current;
}

export function assertSafeRoot(root, createAllowed, fsOps = fs) {
  if (fsOps.existsSync(root)) {
    if (!realDirectory(root, fsOps)) throw new Error('OpenCode config root must be a real directory, not a symlink or file');
    return;
  }
  if (!createAllowed) return;
  const parent = nearestExistingParent(root, fsOps);
  if (!realDirectory(parent, fsOps)) throw new Error('nearest existing OpenCode config parent must be a real directory');
}

export function assertSafeTarget(root, relative, fsOps = fs) {
  if (!safeRelativePath(relative)) throw new Error(`unsafe target path: ${relative}`);
  const segments = relative.split('/');
  let current = root;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    if (!fsOps.existsSync(current)) continue;
    const stat = fsOps.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`unsafe target directory chain: ${relative}`);
  }
  const target = path.join(root, ...segments);
  if (fsOps.existsSync(target)) {
    const stat = fsOps.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`unsafe existing target: ${relative}`);
  }
  return target;
}

export function expectedOwnership(records, metadata) {
  return {
    schema_version: SCHEMA_VERSION,
    package_name: metadata.name,
    package_version: metadata.version,
    host: HOST,
    install_scope: INSTALL_SCOPE,
    files: records.map(({ path: relative, sha256: digest, size }) => ({ path: relative, sha256: digest, size })),
  };
}

export function ownershipMatches(actual, expected) {
  if (validateOwnership(actual).length > 0) return false;
  if (
    actual.schema_version !== expected.schema_version
    || actual.package_name !== expected.package_name
    || actual.package_version !== expected.package_version
    || actual.host !== expected.host
    || actual.install_scope !== expected.install_scope
    || actual.files.length !== expected.files.length
  ) return false;
  return expected.files.every((record, index) => {
    const candidate = actual.files[index];
    return candidate.path === record.path && candidate.sha256 === record.sha256 && candidate.size === record.size;
  });
}

export function verifyFile(target, record, fsOps = fs) {
  if (!regularFile(target, fsOps)) return `${record.path}: missing or unsafe`;
  const content = fsOps.readFileSync(target);
  if (content.length !== record.size || sha256(content) !== record.sha256) return `${record.path}: modified`;
  return null;
}

export function verifyInstalledFiles(root, ownership, fsOps = fs) {
  const errors = [];
  for (const record of ownership.files || []) {
    const error = verifyFile(path.join(root, ...record.path.split('/')), record, fsOps);
    if (error) errors.push(error);
  }
  return errors;
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match) return null;
  return {
    core: match.slice(1, 4).map(Number),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

function comparePrerelease(left, right) {
  if (left.length === 0 && right.length === 0) return 0;
  if (left.length === 0) return 1;
  if (right.length === 0) return -1;
  const count = Math.max(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    if (left[index] === undefined) return -1;
    if (right[index] === undefined) return 1;
    const leftNumeric = /^\d+$/.test(left[index]);
    const rightNumeric = /^\d+$/.test(right[index]);
    if (leftNumeric && rightNumeric) {
      const difference = Number(left[index]) - Number(right[index]);
      if (difference !== 0) return Math.sign(difference);
    } else if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    else if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

export function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  if (!left || !right) throw new Error(`unsupported semantic version comparison: ${leftVersion} vs ${rightVersion}`);
  for (let index = 0; index < 3; index += 1) {
    if (left.core[index] !== right.core[index]) return left.core[index] < right.core[index] ? -1 : 1;
  }
  return comparePrerelease(left.prerelease, right.prerelease);
}

export function classifyOwnership(actual, expected) {
  const schemaErrors = validateOwnership(actual);
  if (schemaErrors.length > 0) return { state: 'OWNERSHIP_RECORD_INVALID', errors: schemaErrors };
  if (!ownershipPathSetMatches(actual.files, expected.files)) {
    return {
      state: 'OWNERSHIP_RECORD_INVALID',
      errors: ['ownership inventory differs from the exact supported Hakim-owned path set'],
    };
  }
  let comparison;
  try {
    comparison = compareVersions(actual.package_version, expected.package_version);
  } catch (error) {
    return { state: 'OWNERSHIP_RECORD_INVALID', errors: [error.message] };
  }
  if (comparison < 0) {
    return { state: 'INSTALLED_UPGRADE_AVAILABLE', errors: [`installed ${actual.package_version}; current package ${expected.package_version}`] };
  }
  if (comparison > 0) {
    return { state: 'INSTALLED_NEWER_VERSION', errors: [`installed ${actual.package_version}; current package ${expected.package_version}`] };
  }
  if (!ownershipMatches(actual, expected)) return { state: 'INSTALLED_PACKAGE_MISMATCH', errors: ['ownership inventory differs from this package'] };
  return { state: 'EXACT', errors: [] };
}

export function inspectInstallation(configDir, fsOps = fs) {
  assertPackageIntegrity(fsOps);
  const metadata = packageMetadata(fsOps);
  const records = walkPayload(PAYLOAD_ROOT, fsOps);
  const expected = expectedOwnership(records, metadata);
  const ownershipPath = path.join(configDir, OWNERSHIP_FILE);
  if (!fsOps.existsSync(ownershipPath)) return { metadata, records, expected, ownershipPath, state: 'NOT_INSTALLED', errors: [] };
  if (!regularFile(ownershipPath, fsOps)) return { metadata, records, expected, ownershipPath, state: 'OWNERSHIP_RECORD_UNSAFE', errors: ['ownership record is not a regular file'] };
  let actual;
  try {
    actual = readJson(ownershipPath, 'Hakim ownership record', fsOps);
  } catch (error) {
    return { metadata, records, expected, ownershipPath, state: 'OWNERSHIP_RECORD_INVALID', errors: [error.message] };
  }
  const classification = classifyOwnership(actual, expected);
  if (classification.state === 'OWNERSHIP_RECORD_INVALID') {
    return { metadata, records, expected, ownershipPath, actual, ...classification };
  }
  const fileErrors = verifyInstalledFiles(configDir, actual, fsOps);
  if (fileErrors.length > 0) {
    return { metadata, records, expected, ownershipPath, actual, state: 'INSTALLED_MODIFIED_OR_PARTIAL', errors: fileErrors };
  }
  if (classification.state !== 'EXACT') return { metadata, records, expected, ownershipPath, actual, ...classification };
  return { metadata, records, expected, ownershipPath, actual, state: 'INSTALLED_EXACT_MATCH', errors: [] };
}
