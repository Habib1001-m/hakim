import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  PACKAGE_NAME,
  packageMetadata,
  readJson,
  regularFile,
  safeRelativePath,
  sha256,
} from './ownership.mjs';

export const LOCK_FILE = '.hakim-operation.lock';

export function runHook(options, name, details) {
  const candidate = options?.hooks?.[name];
  if (typeof candidate === 'function') candidate(details);
}

export function acquireOperationLock(root, action, options = {}) {
  const fsOps = options.fs || fs;
  const metadata = packageMetadata(fsOps);
  const token = options.lockToken || crypto.randomUUID();
  const lockPath = path.join(root, LOCK_FILE);
  const record = {
    schema_version: 1,
    package_name: PACKAGE_NAME,
    package_version: metadata.version,
    action,
    pid: options.pid || process.pid,
    token,
  };
  try {
    fsOps.writeFileSync(lockPath, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error('another Hakim lifecycle operation is active');
    throw new Error(`could not acquire Hakim lifecycle lock: ${error.message}`);
  }
  return { path: lockPath, token };
}

export function releaseOperationLock(lock, options = {}) {
  const fsOps = options.fs || fs;
  if (!regularFile(lock.path, fsOps)) throw new Error('Hakim lifecycle lock disappeared or became unsafe');
  const actual = readJson(lock.path, 'Hakim lifecycle lock', fsOps);
  if (actual?.token !== lock.token) throw new Error('Hakim lifecycle lock ownership changed');
  fsOps.unlinkSync(lock.path);
}

export function assertNoOperationLock(root, fsOps = fs) {
  if (fsOps.existsSync(path.join(root, LOCK_FILE))) throw new Error('another Hakim lifecycle operation is active');
}

export function removeEmptyOwnedDirectories(root, records, fsOps = fs) {
  const directories = new Set();
  for (const record of records) {
    const relative = record.path || record.relative;
    if (!safeRelativePath(relative)) continue;
    let current = path.dirname(path.join(root, ...relative.split('/')));
    while (current.startsWith(`${root}${path.sep}`)) {
      directories.add(current);
      current = path.dirname(current);
    }
  }
  for (const directory of [...directories].sort((left, right) => right.length - left.length)) {
    try {
      if (fsOps.readdirSync(directory).length === 0) fsOps.rmdirSync(directory);
    } catch {
      // Unrelated or concurrent state keeps the directory in place.
    }
  }
}

function exactCreatedFile(entry, fsOps = fs) {
  if (!regularFile(entry.target, fsOps)) return false;
  const content = fsOps.readFileSync(entry.target);
  return content.length === entry.size && sha256(content) === entry.sha256;
}

export function rollbackCreated(created, root, records, fsOps = fs) {
  const issues = [];
  for (const entry of [...created].reverse()) {
    try {
      if (!fsOps.existsSync(entry.target)) continue;
      if (!exactCreatedFile(entry, fsOps)) {
        issues.push(`${entry.label}: changed after creation; preserved`);
        continue;
      }
      fsOps.unlinkSync(entry.target);
    } catch (error) {
      issues.push(`${entry.label}: cleanup failed: ${error.message}`);
    }
  }
  removeEmptyOwnedDirectories(root, records, fsOps);
  return issues;
}

export function restoreMoved(moved, quarantine, fsOps = fs) {
  const issues = [];
  for (const entry of [...moved].reverse()) {
    try {
      if (!fsOps.existsSync(entry.destination)) continue;
      if (fsOps.existsSync(entry.source)) {
        issues.push(`${entry.label}: source occupied; quarantine retained`);
        continue;
      }
      fsOps.mkdirSync(path.dirname(entry.source), { recursive: true });
      fsOps.renameSync(entry.destination, entry.source);
    } catch (error) {
      issues.push(`${entry.label}: restore failed: ${error.message}`);
    }
  }
  try {
    if (fsOps.existsSync(quarantine) && fsOps.readdirSync(quarantine).length === 0) fsOps.rmdirSync(quarantine);
  } catch {
    // Nested retained directories are reported below.
  }
  if (fsOps.existsSync(quarantine)) issues.push(`quarantine retained at ${quarantine}`);
  return issues;
}
