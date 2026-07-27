import fs from 'node:fs';
import path from 'node:path';

import {
  SUPPORTED_LEGACY_MANIFESTS,
  createPrivateWorkRoot,
  inspectEntry,
  manifestFromBundle,
  manifestsEquivalent,
  moveVerifiedRecordToWorkRoot,
  sha256,
} from './opencode_bundle.mjs';
import { SUPPORTED_PERSISTED_PRIOR_MANIFESTS } from './opencode_prior_manifests.mjs';

function verifyBytes(pathname, expectedSize, expectedHash) {
  const bytes = fs.readFileSync(pathname);
  return bytes.length === expectedSize && sha256(bytes) === expectedHash;
}

export function validateManagedInstallationAuthority(managed, bundle) {
  if (!managed?.manifest) return { ok: true };
  const supportedVersions = new Set([
    bundle.product_version,
    ...SUPPORTED_LEGACY_MANIFESTS.map((manifest) => manifest.product_version),
    ...SUPPORTED_PERSISTED_PRIOR_MANIFESTS.map((manifest) => manifest.product_version),
  ]);
  if (!supportedVersions.has(managed.manifest.product_version)) {
    return { ok: false, state: 'MANIFEST_UNSUPPORTED', message: `unsupported installed Hakim version: ${managed.manifest.product_version}` };
  }

  const expectedTargets = bundle.files.map((file) => file.target_relative).sort();
  const actualTargets = managed.manifest.files.map((file) => file.target_relative).sort();
  if (actualTargets.length !== expectedTargets.length || actualTargets.some((value, index) => value !== expectedTargets[index])) {
    return { ok: false, state: 'MANIFEST_UNSUPPORTED', message: 'installed manifest inventory does not match the supported Hakim target inventory' };
  }

  // A manifest claiming the currently executing version must be exactly the
  // current canonical manifest. This blocks a forged same-version ownership
  // record from redefining customized bytes as Hakim-owned.
  if (
    managed.manifest_source === 'INSTALLED_MANIFEST'
    && managed.manifest.product_version === bundle.product_version
    && !manifestsEquivalent(managed.manifest, manifestFromBundle(bundle))
  ) {
    return { ok: false, state: 'MANIFEST_UNSUPPORTED', message: 'same-version install manifest does not match the current canonical Hakim manifest' };
  }

  // A persisted prior managed release is accepted only when its complete
  // manifest matches the exact immutable manifest recorded for that release.
  // This preserves beta.2 -> beta.3 upgrade/removal while preventing a forged
  // older-version manifest from redefining arbitrary local bytes as Hakim-owned.
  if (managed.manifest_source === 'INSTALLED_MANIFEST' && managed.manifest.product_version !== bundle.product_version) {
    const prior = SUPPORTED_PERSISTED_PRIOR_MANIFESTS.find(
      (manifest) => manifest.product_version === managed.manifest.product_version,
    );
    if (prior && !manifestsEquivalent(managed.manifest, prior)) {
      return { ok: false, state: 'MANIFEST_UNSUPPORTED', message: `installed Hakim ${managed.manifest.product_version} manifest does not match the exact supported prior manifest` };
    }
  }

  // beta.1 remains the bounded pre-manifest migration exception represented by
  // SUPPORTED_LEGACY_MANIFESTS. Its persisted hashes are still verified before
  // mutation; newer managed prior releases use exact-manifest authority above.
  return { ok: true };
}

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
          errors.push(`${record.target_relative}: ${error.message}`);
        }
      }
    }
  }

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
