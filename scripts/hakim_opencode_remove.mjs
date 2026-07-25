#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './hakim_opencode_install.mjs';
import {
  INSTALL_MANIFEST_RELATIVE_PATH,
  buildOpenCodeBundle,
  bundleDirectories,
  createPrivateWorkRoot,
  detectManagedInstallation,
  moveVerifiedRecordToWorkRoot,
  removeEmptyDirectories,
  validateDirectoryChain,
  validateTargetRoot,
} from './lib/opencode_bundle.mjs';
import { restoreQuarantinedBytesNoClobber } from './lib/opencode_transaction.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

function publicManifest(manifest) {
  return manifest?.files?.map((file) => ({
    target_relative: file.target_relative,
    sha256: file.sha256,
    size: file.size,
  })) || [];
}

function result(base, status, state, nextSafeAction, mutation = {}) {
  return {
    ...base,
    status,
    state,
    mutation_attempted: mutation.mutation_attempted ?? false,
    removal_performed: mutation.removal_performed ?? false,
    filesystem_changed: mutation.filesystem_changed ?? false,
    rollback_attempted: mutation.rollback_attempted ?? false,
    rollback_complete: mutation.rollback_complete ?? true,
    quarantine_retained: mutation.quarantine_retained ?? false,
    quarantine_path: mutation.quarantine_path ?? null,
    removed_files: mutation.removed_files || [],
    removed_directories: mutation.removed_directories || [],
    installed_product_version: mutation.installed_product_version ?? null,
    next_safe_action: nextSafeAction,
  };
}

function installedManifestRecord(managed) {
  if (managed.manifest_source !== 'INSTALLED_MANIFEST' || !managed.manifest_record) return null;
  return {
    target_relative: INSTALL_MANIFEST_RELATIVE_PATH,
    sha256: managed.manifest_record.raw_sha256,
    size: managed.manifest_record.raw_size,
  };
}

function moveManagedInstallation(targetRoot, managed, workRoot) {
  const moved = [];
  try {
    for (const record of managed.manifest.files) moved.push(moveVerifiedRecordToWorkRoot(targetRoot, workRoot, record));
    const manifest = installedManifestRecord(managed);
    if (manifest) moved.push(moveVerifiedRecordToWorkRoot(targetRoot, workRoot, manifest));
    return moved;
  } catch (error) {
    if (error.quarantined_record) moved.push(error.quarantined_record);
    error.moved_records = moved;
    throw error;
  }
}

export function removeOpenCodeAdapter(options, root = ROOT) {
  let bundle;
  try {
    bundle = buildOpenCodeBundle(root);
  } catch (error) {
    return result({ schema_version: 1, mode: options.apply ? 'APPLY_REMOVE_MANAGED' : 'DRY_RUN' }, 'FAIL', 'SOURCE_INVALID', error.message);
  }

  const target = validateTargetRoot(options.target);
  const base = {
    schema_version: 1,
    adapter: bundle.adapter,
    mode: options.apply ? 'APPLY_REMOVE_MANAGED' : 'DRY_RUN',
    target_root: target.target_root,
    modified_target_removal_allowed: false,
    opencode_config_mutation: false,
    unrelated_path_removal_allowed: false,
    mutation_scope: bundle.mutation_scope,
    install_manifest_path: INSTALL_MANIFEST_RELATIVE_PATH,
  };
  if (!target.ok) return result(base, 'FAIL', target.state, target.message);

  const directories = bundleDirectories(bundle);
  const directoryCheck = validateDirectoryChain(target.target_root, directories);
  if (!directoryCheck.ok) return result({ ...base, refused_path: directoryCheck.path }, 'FAIL', directoryCheck.state, directoryCheck.message);

  const managed = detectManagedInstallation(target.target_root, bundle);
  const withInspection = {
    ...base,
    manifest: publicManifest(managed.manifest),
    inspection: managed.inspection?.counts || null,
    managed_state: managed.state,
    managed_manifest_source: managed.manifest_source,
  };

  if (managed.state === 'ABSENT') {
    return result(withInspection, 'PASS', 'ALREADY_ABSENT', 'No supported managed Hakim OpenCode bundle is present; no change is needed.');
  }
  if (!['EXACT_MATCH', 'LEGACY_EXACT_MATCH', 'UNMANIFESTED_CURRENT_EXACT'].includes(managed.state)) {
    return result(
      withInspection,
      'FAIL',
      `REFUSED_${managed.state}`,
      managed.message || 'Preserve the current OpenCode paths and reconcile them manually; removal is allowed only for a complete byte-verified supported Hakim-owned installation.',
    );
  }
  if (!options.apply) {
    return result(withInspection, 'PASS', 'READY_TO_REMOVE', `Verified Hakim ${managed.manifest.product_version} is removable. Rerun without --dry-run to quarantine, verify, and remove only the owned bytes.`, {
      installed_product_version: managed.manifest.product_version,
    });
  }

  let workRoot = null;
  let moved = [];
  try {
    workRoot = createPrivateWorkRoot(target.target_root, 'hakim-remove');
    moved = moveManagedInstallation(target.target_root, managed, workRoot);

    // Every owned path has left the live namespace and the exact moved bytes
    // have been re-hashed. Only now may quarantine be deleted.
    const removedDirectories = removeEmptyDirectories(target.target_root, directories);
    fs.rmSync(workRoot, { recursive: true });

    const finalState = detectManagedInstallation(target.target_root, bundle);
    if (finalState.state !== 'ABSENT') {
      return result({ ...withInspection, final_managed_state: finalState.state }, 'FAIL', 'POST_REMOVE_VERIFY_FAILED', 'Managed Hakim paths remain after removal; inspect the target manually.', {
        mutation_attempted: true,
        removal_performed: true,
        filesystem_changed: true,
        removed_files: managed.manifest.files.map((file) => file.target_relative),
        removed_directories: removedDirectories,
        installed_product_version: managed.manifest.product_version,
      });
    }

    return result(withInspection, 'PASS', 'REMOVED', `Hakim ${managed.manifest.product_version} was removed after quarantine verification; unrelated .opencode content was preserved.`, {
      mutation_attempted: true,
      removal_performed: true,
      filesystem_changed: true,
      removed_files: managed.manifest.files.map((file) => file.target_relative),
      removed_directories: removedDirectories,
      installed_product_version: managed.manifest.product_version,
    });
  } catch (error) {
    if (error.quarantined_record) moved.push(error.quarantined_record);
    if (error.moved_records) moved = error.moved_records;

    const recovery = restoreQuarantinedBytesNoClobber(moved);
    const rollbackComplete = recovery.errors.length === 0;
    let quarantineRetained = false;
    if (workRoot) {
      try {
        if (rollbackComplete) fs.rmSync(workRoot, { recursive: true, force: true });
        else quarantineRetained = true;
      } catch {
        quarantineRetained = true;
      }
    }

    return result(withInspection, 'FAIL', rollbackComplete ? 'REMOVE_FAILED_RESTORED' : 'REMOVE_FAILED_RESTORE_INCOMPLETE', error.message, {
      mutation_attempted: true,
      removal_performed: moved.length > 0,
      filesystem_changed: !rollbackComplete,
      rollback_attempted: moved.length > 0,
      rollback_complete: rollbackComplete,
      quarantine_retained: quarantineRetained,
      quarantine_path: quarantineRetained ? workRoot : null,
      removed_files: rollbackComplete ? [] : moved.map((item) => item.record.target_relative),
      installed_product_version: managed.manifest.product_version,
    });
  }
}

export function formatText(report) {
  return [
    'Hakim OpenCode Project Remover',
    `MODE=${report.mode}`,
    `STATUS=${report.status}`,
    `STATE=${report.state}`,
    `MUTATION_ATTEMPTED=${report.mutation_attempted ? 'YES' : 'NO'}`,
    `REMOVAL_PERFORMED=${report.removal_performed ? 'YES' : 'NO'}`,
    `FILESYSTEM_CHANGED=${report.filesystem_changed ? 'YES' : 'NO'}`,
    `ROLLBACK_COMPLETE=${report.rollback_complete ? 'YES' : 'NO'}`,
    `QUARANTINE_RETAINED=${report.quarantine_retained ? 'YES' : 'NO'}`,
    'MODIFIED_TARGET_REMOVAL_ALLOWED=NO',
    'OPENCODE_CONFIG_MUTATION=NO',
    `TARGET_ROOT=${report.target_root || 'UNRESOLVED'}`,
    `NEXT_SAFE_ACTION=${report.next_safe_action}`,
  ].join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run remove:opencode -- --target <repository>',
    '  npm run remove:opencode -- --target <repository> --apply',
    '  npm run remove:opencode:json -- --target <repository> [--apply]',
    '',
    'Dry-run is the default. Removal accepts a complete verified supported installed manifest, including an older supported version.',
    'Owned files are moved into same-filesystem quarantine and re-hashed before deletion; rollback restores the actual quarantined bytes no-clobber.',
    'Modified, partial, symlinked, malformed/unsupported-manifest, or unowned OpenCode paths are preserved.',
  ].join('\n');
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  const report = removeOpenCodeAdapter(options);
  console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
