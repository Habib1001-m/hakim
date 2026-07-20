import fs from 'node:fs';
import path from 'node:path';

function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0')) return false;
  if (path.posix.isAbsolute(value) || path.posix.normalize(value) !== value) return false;
  return value.split('/').every((segment) => segment && segment !== '.' && segment !== '..');
}

function realpathSync(candidate, fsOps) {
  const operation = fsOps.realpathSync || fs.realpathSync;
  return operation.call(fsOps, candidate);
}

function contained(rootReal, candidateReal) {
  return candidateReal === rootReal || candidateReal.startsWith(`${rootReal}${path.sep}`);
}

function assertRealRoot(root, fsOps = fs) {
  const stat = fsOps.lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error('OpenCode config root must remain a real directory');
  }
  return realpathSync(root, fsOps);
}

function assertParentChain(root, relative, fsOps = fs) {
  if (!safeRelativePath(relative)) throw new Error(`unsafe target path: ${relative}`);
  const rootReal = assertRealRoot(root, fsOps);
  const segments = relative.split('/');
  let current = root;

  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    if (!fsOps.existsSync(current)) break;
    const stat = fsOps.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`unsafe target directory chain: ${relative}`);
    }
    const currentReal = realpathSync(current, fsOps);
    if (!contained(rootReal, currentReal)) {
      throw new Error(`target directory chain escapes configured root: ${relative}`);
    }
  }

  return { rootReal, target: path.join(root, ...segments) };
}

export function assertContainedFileTarget(root, relative, fsOps = fs) {
  const { rootReal, target } = assertParentChain(root, relative, fsOps);
  if (fsOps.existsSync(target)) {
    const stat = fsOps.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`unsafe existing target: ${relative}`);
    const targetReal = realpathSync(target, fsOps);
    if (!contained(rootReal, targetReal)) throw new Error(`target escapes configured root: ${relative}`);
  }
  return target;
}

export function assertContainedDirectoryTarget(root, relative, fsOps = fs) {
  const { rootReal } = assertParentChain(root, `${relative}/.sentinel`, fsOps);
  const target = path.join(root, ...relative.split('/'));
  if (fsOps.existsSync(target)) {
    const stat = fsOps.lstatSync(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`unsafe existing directory target: ${relative}`);
    const targetReal = realpathSync(target, fsOps);
    if (!contained(rootReal, targetReal)) throw new Error(`directory target escapes configured root: ${relative}`);
  }
  return target;
}

export function assertDirectChildDirectory(root, candidate, fsOps = fs) {
  if (path.resolve(path.dirname(candidate)) !== path.resolve(root)) {
    throw new Error('quarantine path must be a direct child of the configured root');
  }
  const relative = path.basename(candidate);
  if (!safeRelativePath(relative)) throw new Error('quarantine path is unsafe');
  return assertContainedDirectoryTarget(root, relative, fsOps);
}

export function assertOwnershipPathsContained(root, files, fsOps = fs) {
  if (!Array.isArray(files)) return;
  for (const record of files) {
    if (!record || typeof record.path !== 'string') continue;
    assertContainedFileTarget(root, record.path, fsOps);
  }
}

export function safeRelativeDirectory(relative) {
  const directory = path.posix.dirname(relative);
  return directory === '.' ? null : directory;
}
