import fs from 'node:fs';
import path from 'node:path';
import {
  OWNERSHIP_FILE,
  assertSafeRoot,
  assertSafeTarget,
  inspectInstallation,
  packageMetadata,
  readJson,
  sha256,
  verifyFile,
  walkPayload,
} from './ownership.mjs';
import {
  LOCK_FILE,
  acquireOperationLock,
  assertNoOperationLock,
  releaseOperationLock,
  runHook,
} from './transaction.mjs';
import {
  assertContainedDirectoryTarget,
  assertContainedFileTarget,
  assertDirectChildDirectory,
  assertOwnershipPathsContained,
  safeRelativeDirectory,
} from './realpath-containment.mjs';

const REMOVABLE_STATES = new Set([
  'INSTALLED_EXACT_MATCH',
  'INSTALLED_UPGRADE_AVAILABLE',
  'INSTALLED_NEWER_VERSION',
]);

function lifecycleFailure(prefix, primaryError, rollbackIssues, lockError) {
  const details = [primaryError?.message || `${prefix} cleanup failed`];
  if (rollbackIssues.length > 0) details.push(`rollback incomplete: ${rollbackIssues.join('; ')}`);
  if (lockError) details.push(`lock cleanup failed: ${lockError.message}`);
  return new Error(`${prefix} rolled back: ${details.join(' | ')}`);
}

function versionResult(inspected) {
  return {
    installed_version: inspected.actual?.package_version || null,
    package_version: inspected.metadata.version,
  };
}

function inspectContainedInstallation(configDir, fsOps = fs) {
  if (!fsOps.existsSync(configDir)) return inspectInstallation(configDir, fsOps);
  assertSafeRoot(configDir, false, fsOps);
  const ownershipPath = assertContainedFileTarget(configDir, OWNERSHIP_FILE, fsOps);
  let actual = null;
  if (fsOps.existsSync(ownershipPath)) {
    try {
      actual = readJson(ownershipPath, 'Hakim ownership record', fsOps);
      assertOwnershipPathsContained(configDir, actual?.files, fsOps);
    } catch (error) {
      if (error.message.includes('ownership record is missing or malformed')) {
        return inspectInstallation(configDir, fsOps);
      }
      return {
        metadata: packageMetadata(fsOps),
        records: walkPayload(undefined, fsOps),
        ownershipPath,
        actual,
        state: 'INSTALLED_PATH_UNSAFE',
        errors: [error.message],
      };
    }
  }
  return inspectInstallation(configDir, fsOps);
}

function targetForWrite(configDir, relative, fsOps = fs) {
  if (!fsOps.existsSync(configDir)) return assertSafeTarget(configDir, relative, fsOps);
  return assertContainedFileTarget(configDir, relative, fsOps);
}

function preflightNewPayload(configDir, records, ownedPaths = new Set(), fsOps = fs) {
  const conflicts = [];
  for (const record of records) {
    const target = targetForWrite(configDir, record.path, fsOps);
    if (fsOps.existsSync(target) && !ownedPaths.has(record.path)) conflicts.push(record.path);
  }
  if (conflicts.length > 0) throw new Error(`refusing unmanaged or partial existing Hakim state: ${conflicts.join(', ')}`);
}

function verifyContainedFile(root, relative, record, fsOps = fs) {
  const target = assertContainedFileTarget(root, relative, fsOps);
  return { target, error: verifyFile(target, record, fsOps) };
}

function writeCurrentPackage(locked, configDir, created, options, fsOps = fs) {
  for (const record of locked.records) {
    let target = assertContainedFileTarget(configDir, record.path, fsOps);
    runHook(options, 'beforePayloadWrite', { record, target, created_count: created.length });
    target = assertContainedFileTarget(configDir, record.path, fsOps);
    fsOps.mkdirSync(path.dirname(target), { recursive: true });
    target = assertContainedFileTarget(configDir, record.path, fsOps);
    fsOps.writeFileSync(target, record.content, { flag: 'wx', mode: 0o644 });
    created.push({ target, label: record.path, sha256: record.sha256, size: record.size });
    runHook(options, 'afterPayloadWrite', { record, target, created_count: created.length });
    const written = verifyContainedFile(configDir, record.path, record, fsOps);
    if (written.error) throw new Error(`post-write verification failed: ${written.error}`);
  }

  const ownershipContent = Buffer.from(`${JSON.stringify(locked.expected, null, 2)}\n`);
  let ownershipTarget = assertContainedFileTarget(configDir, OWNERSHIP_FILE, fsOps);
  runHook(options, 'beforeOwnershipWrite', { target: ownershipTarget });
  ownershipTarget = assertContainedFileTarget(configDir, OWNERSHIP_FILE, fsOps);
  fsOps.writeFileSync(ownershipTarget, ownershipContent, { flag: 'wx', mode: 0o600 });
  created.push({
    target: ownershipTarget,
    label: OWNERSHIP_FILE,
    sha256: sha256(ownershipContent),
    size: ownershipContent.length,
  });
  runHook(options, 'afterOwnershipWrite', { target: ownershipTarget });
  const ownershipRecord = { path: OWNERSHIP_FILE, sha256: sha256(ownershipContent), size: ownershipContent.length };
  const ownershipError = verifyContainedFile(configDir, OWNERSHIP_FILE, ownershipRecord, fsOps).error;
  if (ownershipError) throw new Error(`post-write ownership verification failed: ${ownershipError}`);
}

function assertQuarantine(configDir, quarantine, fsOps = fs) {
  return assertDirectChildDirectory(configDir, quarantine, fsOps);
}

function stageInstalled(locked, configDir, quarantine, moved, options, fsOps = fs, hookPrefix = 'Upgrade') {
  assertQuarantine(configDir, quarantine, fsOps);
  fsOps.mkdirSync(quarantine, { mode: 0o700 });
  assertQuarantine(configDir, quarantine, fsOps);

  for (const record of locked.actual.files) {
    let source = assertContainedFileTarget(configDir, record.path, fsOps);
    let destination = assertContainedFileTarget(quarantine, record.path, fsOps);
    let preMoveError = verifyFile(source, record, fsOps);
    if (preMoveError) throw new Error(`pre-quarantine verification failed: ${preMoveError}`);

    runHook(options, `before${hookPrefix}PayloadMove`, { record, source, destination, moved_count: moved.length, quarantine });

    source = assertContainedFileTarget(configDir, record.path, fsOps);
    preMoveError = verifyFile(source, record, fsOps);
    if (preMoveError) throw new Error(`pre-quarantine revalidation failed: ${preMoveError}`);
    destination = assertContainedFileTarget(quarantine, record.path, fsOps);
    fsOps.mkdirSync(path.dirname(destination), { recursive: true });
    destination = assertContainedFileTarget(quarantine, record.path, fsOps);
    fsOps.renameSync(source, destination);
    moved.push({ source, destination, label: record.path, record });

    runHook(options, `after${hookPrefix}PayloadMove`, { record, source, destination, moved_count: moved.length, quarantine });
    const movedFile = verifyContainedFile(quarantine, record.path, record, fsOps);
    if (movedFile.error) throw new Error(`post-quarantine verification failed: ${movedFile.error}`);
  }

  let ownershipSource = assertContainedFileTarget(configDir, OWNERSHIP_FILE, fsOps);
  const ownershipBytes = fsOps.readFileSync(ownershipSource);
  const ownershipRecord = { path: OWNERSHIP_FILE, sha256: sha256(ownershipBytes), size: ownershipBytes.length };
  runHook(options, `before${hookPrefix}OwnershipMove`, { source: ownershipSource, quarantine });
  ownershipSource = assertContainedFileTarget(configDir, OWNERSHIP_FILE, fsOps);
  const currentOwnershipBytes = fsOps.readFileSync(ownershipSource);
  if (currentOwnershipBytes.length !== ownershipRecord.size || sha256(currentOwnershipBytes) !== ownershipRecord.sha256) {
    throw new Error('ownership record changed before quarantine');
  }
  let ownershipDestination = assertContainedFileTarget(quarantine, OWNERSHIP_FILE, fsOps);
  fsOps.renameSync(ownershipSource, ownershipDestination);
  moved.push({ source: ownershipSource, destination: ownershipDestination, label: OWNERSHIP_FILE, record: ownershipRecord });
  runHook(options, `after${hookPrefix}OwnershipMove`, { source: ownershipSource, destination: ownershipDestination, quarantine });
  ownershipDestination = assertContainedFileTarget(quarantine, OWNERSHIP_FILE, fsOps);
  const movedOwnership = fsOps.readFileSync(ownershipDestination);
  if (movedOwnership.length !== ownershipRecord.size || sha256(movedOwnership) !== ownershipRecord.sha256) {
    throw new Error('ownership record changed after quarantine');
  }
}

function verifyQuarantine(moved, quarantine, options, fsOps = fs, invokeHooks = true) {
  for (const entry of moved) {
    if (invokeHooks) runHook(options, 'beforeQuarantineDelete', { entry, quarantine });
    const verified = verifyContainedFile(quarantine, entry.label, entry.record, fsOps);
    if (verified.error) throw new Error(`pre-delete quarantine verification failed: ${verified.error}`);
  }
}

function removeEmptyOwnedDirectoriesSecure(root, records, fsOps = fs) {
  const directories = new Set();
  for (const record of records) {
    const relative = record.path || record.relative;
    const directory = safeRelativeDirectory(relative);
    if (!directory) continue;
    let current = directory;
    while (current && current !== '.') {
      directories.add(current);
      current = path.posix.dirname(current);
      if (current === '.') break;
    }
  }
  for (const relative of [...directories].sort((left, right) => right.length - left.length)) {
    try {
      let directory = assertContainedDirectoryTarget(root, relative, fsOps);
      if (!fsOps.existsSync(directory) || fsOps.readdirSync(directory).length !== 0) continue;
      directory = assertContainedDirectoryTarget(root, relative, fsOps);
      fsOps.rmdirSync(directory);
    } catch {
      // Unsafe, unrelated, or concurrent state is preserved.
    }
  }
}

function rollbackCreatedSecure(created, root, records, fsOps = fs) {
  const issues = [];
  for (const entry of [...created].reverse()) {
    try {
      let target = assertContainedFileTarget(root, entry.label, fsOps);
      if (!fsOps.existsSync(target)) continue;
      const record = { path: entry.label, sha256: entry.sha256, size: entry.size };
      let error = verifyFile(target, record, fsOps);
      if (error) {
        issues.push(`${entry.label}: changed after creation; preserved`);
        continue;
      }
      target = assertContainedFileTarget(root, entry.label, fsOps);
      error = verifyFile(target, record, fsOps);
      if (error) {
        issues.push(`${entry.label}: changed before cleanup; preserved`);
        continue;
      }
      fsOps.unlinkSync(target);
    } catch (error) {
      issues.push(`${entry.label}: unsafe cleanup path preserved: ${error.message}`);
    }
  }
  removeEmptyOwnedDirectoriesSecure(root, records, fsOps);
  return issues;
}

function restoreMovedSecure(moved, quarantine, root, fsOps = fs) {
  const issues = [];
  try {
    assertQuarantine(root, quarantine, fsOps);
  } catch (error) {
    return [`quarantine is unsafe and retained: ${error.message}`];
  }

  for (const entry of [...moved].reverse()) {
    try {
      let destination = assertContainedFileTarget(quarantine, entry.label, fsOps);
      const destinationError = verifyFile(destination, entry.record, fsOps);
      if (destinationError) {
        issues.push(`${entry.label}: quarantine changed; retained`);
        continue;
      }
      let source = assertContainedFileTarget(root, entry.label, fsOps);
      if (fsOps.existsSync(source)) {
        issues.push(`${entry.label}: source occupied; quarantine retained`);
        continue;
      }
      fsOps.mkdirSync(path.dirname(source), { recursive: true });
      source = assertContainedFileTarget(root, entry.label, fsOps);
      destination = assertContainedFileTarget(quarantine, entry.label, fsOps);
      const revalidatedError = verifyFile(destination, entry.record, fsOps);
      if (revalidatedError) {
        issues.push(`${entry.label}: quarantine changed before restore; retained`);
        continue;
      }
      fsOps.renameSync(destination, source);
      const restored = verifyContainedFile(root, entry.label, entry.record, fsOps);
      if (restored.error) issues.push(`${entry.label}: restored bytes failed verification`);
    } catch (error) {
      issues.push(`${entry.label}: unsafe restore path; quarantine retained: ${error.message}`);
    }
  }

  try {
    const safeQuarantine = assertQuarantine(root, quarantine, fsOps);
    if (fsOps.existsSync(safeQuarantine) && fsOps.readdirSync(safeQuarantine).length === 0) fsOps.rmdirSync(safeQuarantine);
  } catch {
    // Retained below.
  }
  if (fsOps.existsSync(quarantine)) issues.push(`quarantine retained at ${quarantine}`);
  return issues;
}

function rollbackUpgrade(created, moved, configDir, quarantine, records, fsOps = fs) {
  const issues = rollbackCreatedSecure(created, configDir, records, fsOps);
  issues.push(...restoreMovedSecure(moved, quarantine, configDir, fsOps));
  return issues;
}

function commitQuarantine(configDir, quarantine, moved, options, hookName, fsOps = fs) {
  verifyQuarantine(moved, quarantine, options, fsOps, true);
  runHook(options, hookName, { moved, quarantine });
  const safeQuarantine = assertQuarantine(configDir, quarantine, fsOps);
  verifyQuarantine(moved, quarantine, options, fsOps, false);
  fsOps.rmSync(safeQuarantine, { recursive: true, force: false });
}

export function install(args, options = {}) {
  const fsOps = options.fs || fs;
  assertSafeRoot(args.configDir, true, fsOps);

  if (args.dryRun) {
    if (fsOps.existsSync(args.configDir)) assertNoOperationLock(args.configDir, fsOps);
    const inspected = inspectContainedInstallation(args.configDir, fsOps);
    if (inspected.state === 'INSTALLED_EXACT_MATCH') {
      return {
        status: 'PASS', action: 'install', state: 'ALREADY_MATCHES', dry_run: true,
        filesystem_changed: false, source_checkout_required: false, target_path_argument_required: false,
        installed_file_count: inspected.records.length, ...versionResult(inspected),
      };
    }
    if (inspected.state === 'INSTALLED_UPGRADE_AVAILABLE') {
      preflightNewPayload(args.configDir, inspected.records, new Set(inspected.actual.files.map((record) => record.path)), fsOps);
      return {
        status: 'PASS', action: 'install', state: 'READY_TO_UPGRADE', dry_run: true,
        filesystem_changed: false, source_checkout_required: false, target_path_argument_required: false,
        installed_file_count: inspected.records.length, ...versionResult(inspected),
      };
    }
    if (inspected.state === 'INSTALLED_NEWER_VERSION') {
      throw new Error(`refusing package downgrade: ${inspected.errors.join('; ')}`);
    }
    if (inspected.state !== 'NOT_INSTALLED') {
      throw new Error(`existing Hakim installation is not safely upgradeable: ${inspected.state}: ${inspected.errors.join('; ')}`);
    }
    preflightNewPayload(args.configDir, inspected.records, new Set(), fsOps);
    return {
      status: 'PASS', action: 'install', state: 'READY_TO_INSTALL', dry_run: true,
      filesystem_changed: false, source_checkout_required: false, target_path_argument_required: false,
      installed_file_count: inspected.records.length, ...versionResult(inspected),
    };
  }

  fsOps.mkdirSync(args.configDir, { recursive: true });
  assertSafeRoot(args.configDir, false, fsOps);
  const lock = acquireOperationLock(args.configDir, 'install', options);
  assertContainedFileTarget(args.configDir, LOCK_FILE, fsOps);
  const created = [];
  const moved = [];
  let quarantine = null;
  let installedFileCount = 0;
  let resultState = 'INSTALLED';
  let fromVersion = null;
  let primaryError = null;
  let rollbackIssues = [];
  let locked = null;
  try {
    locked = inspectContainedInstallation(args.configDir, fsOps);
    installedFileCount = locked.records.length;
    if (locked.state === 'INSTALLED_EXACT_MATCH') {
      resultState = 'ALREADY_MATCHES';
    } else if (locked.state === 'INSTALLED_NEWER_VERSION') {
      throw new Error(`refusing package downgrade: ${locked.errors.join('; ')}`);
    } else if (locked.state === 'INSTALLED_UPGRADE_AVAILABLE') {
      resultState = 'UPGRADED';
      fromVersion = locked.actual.package_version;
      preflightNewPayload(args.configDir, locked.records, new Set(locked.actual.files.map((record) => record.path)), fsOps);
      quarantine = path.join(args.configDir, `.hakim-upgrade-${options.pid || process.pid}-${options.now ? options.now() : Date.now()}-${lock.token.slice(0, 8)}`);
      stageInstalled(locked, args.configDir, quarantine, moved, options, fsOps, 'Upgrade');
      runHook(options, 'afterUpgradeQuarantine', { moved, quarantine, from_version: fromVersion, to_version: locked.metadata.version });
      writeCurrentPackage(locked, args.configDir, created, options, fsOps);
      commitQuarantine(args.configDir, quarantine, moved, options, 'beforeUpgradeCommit', fsOps);
    } else if (locked.state === 'NOT_INSTALLED') {
      preflightNewPayload(args.configDir, locked.records, new Set(), fsOps);
      writeCurrentPackage(locked, args.configDir, created, options, fsOps);
    } else {
      throw new Error(`existing Hakim installation is not safely upgradeable: ${locked.state}: ${locked.errors.join('; ')}`);
    }
  } catch (error) {
    primaryError = error;
    if (moved.length > 0 || quarantine) rollbackIssues = rollbackUpgrade(created, moved, args.configDir, quarantine, locked?.records || walkPayload(undefined, fsOps), fsOps);
    else rollbackIssues = rollbackCreatedSecure(created, args.configDir, locked?.records || walkPayload(undefined, fsOps), fsOps);
  }

  let lockError = null;
  try {
    assertContainedFileTarget(args.configDir, LOCK_FILE, fsOps);
    releaseOperationLock(lock, options);
  } catch (error) { lockError = error; }
  if (primaryError || rollbackIssues.length > 0 || lockError) {
    throw lifecycleFailure(resultState === 'UPGRADED' ? 'upgrade' : 'installation', primaryError, rollbackIssues, lockError);
  }

  return {
    status: 'PASS', action: 'install', state: resultState, dry_run: false,
    filesystem_changed: resultState !== 'ALREADY_MATCHES', source_checkout_required: false, target_path_argument_required: false,
    installed_file_count: installedFileCount,
    installed_version: locked.metadata.version,
    previous_version: fromVersion,
    package_version: locked.metadata.version,
  };
}

export function remove(args, options = {}) {
  const fsOps = options.fs || fs;
  assertSafeRoot(args.configDir, false, fsOps);
  if (!fsOps.existsSync(args.configDir)) {
    return { status: 'PASS', action: 'remove', state: 'NOT_INSTALLED', dry_run: args.dryRun, filesystem_changed: false, removed_file_count: 0 };
  }

  if (args.dryRun) {
    assertNoOperationLock(args.configDir, fsOps);
    const inspected = inspectContainedInstallation(args.configDir, fsOps);
    if (inspected.state === 'NOT_INSTALLED') {
      return { status: 'PASS', action: 'remove', state: 'NOT_INSTALLED', dry_run: true, filesystem_changed: false, removed_file_count: 0 };
    }
    if (!REMOVABLE_STATES.has(inspected.state)) throw new Error(`refusing removal: ${inspected.state}: ${inspected.errors.join('; ')}`);
    return {
      status: 'PASS', action: 'remove', state: 'READY_TO_REMOVE', dry_run: true,
      filesystem_changed: false, removed_file_count: inspected.actual.files.length,
      installed_version: inspected.actual.package_version, package_version: inspected.metadata.version,
    };
  }

  const lock = acquireOperationLock(args.configDir, 'remove', options);
  assertContainedFileTarget(args.configDir, LOCK_FILE, fsOps);
  const quarantine = path.join(args.configDir, `.hakim-quarantine-${options.pid || process.pid}-${options.now ? options.now() : Date.now()}-${lock.token.slice(0, 8)}`);
  const moved = [];
  let removedFileCount = 0;
  let removedVersion = null;
  let notInstalled = false;
  let primaryError = null;
  let rollbackIssues = [];
  try {
    const locked = inspectContainedInstallation(args.configDir, fsOps);
    if (locked.state === 'NOT_INSTALLED') {
      notInstalled = true;
    } else {
      if (!REMOVABLE_STATES.has(locked.state)) throw new Error(`refusing removal: ${locked.state}: ${locked.errors.join('; ')}`);
      removedFileCount = locked.actual.files.length;
      removedVersion = locked.actual.package_version;
      stageInstalled(locked, args.configDir, quarantine, moved, options, fsOps, 'Removal');
      commitQuarantine(args.configDir, quarantine, moved, options, 'beforeQuarantineCommit', fsOps);
    }
  } catch (error) {
    primaryError = error;
    rollbackIssues = restoreMovedSecure(moved, quarantine, args.configDir, fsOps);
  }

  let lockError = null;
  try {
    assertContainedFileTarget(args.configDir, LOCK_FILE, fsOps);
    releaseOperationLock(lock, options);
  } catch (error) { lockError = error; }
  if (primaryError || rollbackIssues.length > 0 || lockError) {
    throw lifecycleFailure('removal', primaryError, rollbackIssues, lockError);
  }
  if (notInstalled) return { status: 'PASS', action: 'remove', state: 'NOT_INSTALLED', dry_run: false, filesystem_changed: false, removed_file_count: 0 };
  removeEmptyOwnedDirectoriesSecure(args.configDir, moved.map((entry) => entry.record), fsOps);
  return {
    status: 'PASS', action: 'remove', state: 'REMOVED', dry_run: false,
    filesystem_changed: true, removed_file_count: removedFileCount,
    removed_version: removedVersion,
  };
}

export function status(args, options = {}) {
  const fsOps = options.fs || fs;
  if (fsOps.existsSync(args.configDir)) assertNoOperationLock(args.configDir, fsOps);
  const inspected = inspectContainedInstallation(args.configDir, fsOps);
  if (inspected.state === 'NOT_INSTALLED') return { status: 'PASS', action: 'status', state: 'NOT_INSTALLED', errors: [] };
  const healthy = REMOVABLE_STATES.has(inspected.state);
  return {
    status: healthy ? 'PASS' : 'FAIL',
    action: 'status',
    state: inspected.state,
    errors: inspected.errors,
    installed_version: inspected.actual?.package_version || null,
    package_version: inspected.metadata?.version || null,
    upgrade_available: inspected.state === 'INSTALLED_UPGRADE_AVAILABLE',
  };
}

export { LOCK_FILE, OWNERSHIP_FILE };
