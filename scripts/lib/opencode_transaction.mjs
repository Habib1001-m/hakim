import fs from 'node:fs';
import path from 'node:path';

import {
  createPrivateWorkRoot,
  inspectEntry,
  moveVerifiedRecordToWorkRoot,
  sha256,
} from './opencode_bundle.mjs';

function verifyBytes(pathname, expectedSize, expectedHash) {
  const bytes = fs.readFileSync(pathname);
  return bytes.length === expectedSize && sha256(bytes) === expectedHash;
}

/**
 * Restore the exact bytes currently held in quarantine, not the older expected
 * ownership hash. This is intentional: if an external actor changed a file in
 * the verification→rename window, Hakim must preserve those changed bytes.
 * The original path is restored only when absent; an independently reappeared
 * path is never overwritten.
 */
export function restoreQuarantinedBytesNoClobber(items) {
  const errors = [];
  const restored = [];

  for (const item of [...items].reverse()) {
    const quarantineState = inspectEntry(item.quarantine_path, 'file');
    if (!quarantineState.ok) {
      errors.push(`${item.record.target_relative}: quarantine is ${quarantineState.state}`);
      continue;
    }

    let bytes;
    try {
      bytes = fs.readFileSync(item.quarantine_path);
    } catch (error) {
      errors.push(`${item.record.target_relative}: cannot read quarantine: ${error.message}`);
      continue;
    }
    const actualSize = bytes.length;
    const actualHash = sha256(bytes);

    const targetState = inspectEntry(item.source_path, 'file');
    if (targetState.state !== 'MISSING') {
      errors.push(`${item.record.target_relative}: target reappeared; quarantined bytes retained and target was not overwritten`);
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(item.source_path), { recursive: true, mode: 0o755 });
      fs.copyFileSync(item.quarantine_path, item.source_path, fs.constants.COPYFILE_EXCL);
      if (!verifyBytes(item.source_path, actualSize, actualHash)) {
        errors.push(`${item.record.target_relative}: restored bytes do not match quarantine`);
        continue;
      }
      fs.unlinkSync(item.quarantine_path);
      restored.push(item.record.target_relative);
    } catch (error) {
      errors.push(`${item.record.target_relative}: ${error.message}`);
    }
  }

  return { errors, restored };
}

function removeEmptyCreatedDirectories(targetRoot, createdDirectories, errors) {
  for (const relative of [...createdDirectories].reverse()) {
    try {
      fs.rmdirSync(path.join(targetRoot, relative));
    } catch (error) {
      if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) errors.push(`${relative}: ${error.message}`);
    }
  }
}

/**
 * Roll back files created by Hakim without ever performing hash→unlink on the
 * live path. Each unchanged Hakim-created file is renamed into a private
 * same-filesystem work root and re-hashed after the move before it is discarded.
 * If the bytes changed before or during the move, those user/external bytes are
 * preserved in place or restored from quarantine and rollback is reported as
 * incomplete rather than deleting them.
 */
export function rollbackCreatedRecordsNoClobber(targetRoot, createdRecords, createdDirectories = []) {
  const errors = [];
  const movedOwned = [];
  const movedChanged = [];
  let workRoot = null;

  if (createdRecords.length > 0) {
    try {
      workRoot = createPrivateWorkRoot(targetRoot, 'hakim-rollback');
    } catch (error) {
      errors.push(`rollback work root: ${error.message}`);
    }
  }

  if (workRoot) {
    for (const record of [...createdRecords].reverse()) {
      try {
        movedOwned.push(moveVerifiedRecordToWorkRoot(targetRoot, workRoot, record));
      } catch (error) {
        if (error.quarantined_record) {
          movedChanged.push(error.quarantined_record);
          const recovery = restoreQuarantinedBytesNoClobber([error.quarantined_record]);
          if (recovery.errors.length > 0) errors.push(...recovery.errors);
          errors.push(`${record.target_relative}: changed during rollback; changed bytes were preserved rather than deleted`);
        } else {
          // A changed live file is deliberately preserved in place.
          errors.push(`${record.target_relative}: ${error.message}`);
        }
      }
    }
  }

  // Exact Hakim-created bytes have already left the live namespace and were
  // post-move verified. Deleting the private root now cannot delete a concurrent
  // replacement at the original path.
  let quarantineRetained = false;
  if (workRoot) {
    try {
      fs.rmSync(workRoot, { recursive: true });
    } catch (error) {
      quarantineRetained = true;
      errors.push(`rollback work-root cleanup: ${error.message}`);
    }
  }

  removeEmptyCreatedDirectories(targetRoot, createdDirectories, errors);

  return {
    errors,
    rollback_complete: errors.length === 0,
    quarantine_retained: quarantineRetained,
    quarantine_path: quarantineRetained ? workRoot : null,
    removed_owned_files: movedOwned.map((item) => item.record.target_relative),
    preserved_changed_files: movedChanged.map((item) => item.record.target_relative),
  };
}
