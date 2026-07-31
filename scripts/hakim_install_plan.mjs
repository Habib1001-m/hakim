#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildOpenCodeBundle,
  inspectInstalledBundle,
  validateTargetRoot,
} from './lib/opencode_bundle.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const SUPPORTED_HOSTS = Object.freeze(['codex', 'claude-code', 'github-copilot', 'opencode']);

function readIdentity(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'conformance', 'distribution-identity.json'), 'utf8'));
}

export const OPENCODE_BOOTSTRAP = readIdentity().latest_frozen_candidate.normal_install_commands.opencode;

export function parseArgs(args) {
  const options = { host: 'all', target: null, json: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--host') {
      if (!args[index + 1]) throw new Error('--host requires a value');
      options.host = args[++index];
    } else if (arg.startsWith('--host=')) options.host = arg.slice('--host='.length);
    else if (arg === '--target') {
      if (!args[index + 1]) throw new Error('--target requires a path');
      options.target = args[++index];
    } else if (arg.startsWith('--target=')) options.target = arg.slice('--target='.length);
    else throw new Error(`unknown option: ${arg}`);
  }
  if (options.host !== 'all' && !SUPPORTED_HOSTS.includes(options.host)) throw new Error(`unsupported host: ${options.host}`);
  if (options.target && !['all', 'github-copilot', 'opencode'].includes(options.host)) throw new Error('--target is supported only for github-copilot, opencode, or all');
  return options;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function check(id, ok, actual = null) {
  return { id, status: ok ? 'PASS' : 'FAIL', actual };
}

function summarizeStatus(checks) {
  return checks.every((item) => item.status === 'PASS') ? 'PASS' : 'FAIL';
}

export function inspectCodex(root = ROOT, version = null) {
  const identity = readIdentity(root);
  const expectedVersion = version || fs.readFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
  const sourcePath = path.join(root, 'plugins', 'codex');
  const manifestPath = path.join(sourcePath, '.codex-plugin', 'plugin.json');
  const marketplacePath = path.join(root, '.agents', 'plugins', 'marketplace.json');
  const skillsPath = path.join(sourcePath, 'skills');
  const hooksPath = path.join(sourcePath, 'hooks', 'hooks.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const marketplace = fs.existsSync(marketplacePath) ? JSON.parse(fs.readFileSync(marketplacePath, 'utf8')) : {};
  const entry = (marketplace.plugins || []).find((item) => item.name === 'hakim');
  const checks = [
    check('source_directory_present', fs.existsSync(sourcePath), path.relative(root, sourcePath)),
    check('manifest_present', fs.existsSync(manifestPath), path.relative(root, manifestPath)),
    check('manifest_version_matches', manifest.version === expectedVersion, manifest.version || null),
    check('skills_directory_present', fs.existsSync(skillsPath), path.relative(root, skillsPath)),
    check('hooks_manifest_present', fs.existsSync(hooksPath), path.relative(root, hooksPath)),
    check('marketplace_present', fs.existsSync(marketplacePath), path.relative(root, marketplacePath)),
    check('marketplace_name_matches', marketplace.name === 'hakim', marketplace.name || null),
    check('marketplace_entry_present', Boolean(entry), entry?.name || null),
    check('marketplace_source_matches', entry?.source?.path === './plugins/codex', entry?.source?.path || null),
    check('marketplace_install_available', entry?.policy?.installation === 'AVAILABLE', entry?.policy?.installation || null),
  ];
  const invocation = identity.latest_frozen_candidate.normal_install_commands.codex;
  return {
    host: 'codex',
    status: summarizeStatus(checks),
    support_boundary: 'HOST_NATIVE_PLUGIN',
    distribution_mode: 'NATIVE_GIT_MARKETPLACE',
    source_path: 'plugins/codex',
    marketplace_path: '.agents/plugins/marketplace.json',
    invocation,
    install_identity: 'hakim@hakim',
    target_state: 'READY_FOR_NATIVE_INSTALL',
    persistent_installation: 'SUPPORTED_BY_HOST',
    automatic_changes: false,
    checks,
    next_safe_action: `Run \`${invocation}\`, open /plugins, select Hakim, install \`hakim\`, review/trust SessionStart, then start a new thread.`,
  };
}

export function inspectClaude(root = ROOT, version = null) {
  const identity = readIdentity(root);
  const frozen = identity.latest_frozen_candidate;
  const expectedVersion = version || fs.readFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
  const sourcePath = path.join(root, 'plugins', 'claude-code');
  const manifestPath = path.join(sourcePath, '.claude-plugin', 'plugin.json');
  const marketplacePath = path.join(root, '.claude-plugin', 'marketplace.json');
  const skillsPath = path.join(sourcePath, 'skills');
  const agentsPath = path.join(sourcePath, 'agents');
  const hooksPath = path.join(sourcePath, 'hooks', 'hooks.json');
  const nativeSkills = ['full', 'review', 'audit', 'debt', 'gain', 'help'];
  const nativeAgents = ['hakim-reviewer', 'hakim-auditor', 'hakim-debt-analyst', 'hakim-evidence-verifier', 'hakim-implementer'];
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const marketplace = fs.existsSync(marketplacePath) ? JSON.parse(fs.readFileSync(marketplacePath, 'utf8')) : {};
  const entry = (marketplace.plugins || []).find((item) => item.name === 'hakim');
  const source = entry?.source;
  const checks = [
    check('source_directory_present', fs.existsSync(sourcePath), path.relative(root, sourcePath)),
    check('manifest_present', fs.existsSync(manifestPath), path.relative(root, manifestPath)),
    check('source_tree_manifest_version_matches', manifest.version === expectedVersion, manifest.version || null),
    check('marketplace_present', fs.existsSync(marketplacePath), path.relative(root, marketplacePath)),
    check('marketplace_entry_present', Boolean(entry), entry?.name || null),
    check('catalog_version_matches_frozen_candidate', entry?.version === frozen.version, entry?.version || null),
    check('catalog_source_type_matches', source?.source === 'git-subdir', source?.source || null),
    check('catalog_source_url_matches', source?.url === 'https://github.com/Habib1001-m/hakim.git', source?.url || null),
    check('catalog_source_path_matches', source?.path === 'plugins/claude-code', source?.path || null),
    check('catalog_source_sha_matches', source?.sha === frozen.source_sha, source?.sha || null),
    check('catalog_source_ref_absent', source && !Object.hasOwn(source, 'ref'), source?.ref || null),
    check('skills_directory_present', fs.existsSync(skillsPath), path.relative(root, skillsPath)),
    check('native_user_skills_present', nativeSkills.every((name) => fs.existsSync(path.join(skillsPath, name, 'SKILL.md'))), nativeSkills),
    check('agents_directory_present', fs.existsSync(agentsPath), path.relative(root, agentsPath)),
    check('native_agents_present', nativeAgents.every((name) => fs.existsSync(path.join(agentsPath, `${name}.md`))), nativeAgents),
    check('hooks_manifest_present', fs.existsSync(hooksPath), path.relative(root, hooksPath)),
  ];
  const marketplaceCommand = frozen.normal_install_commands['claude-code'];
  const invocation = `${marketplaceCommand} && claude plugin install hakim@hakim`;
  return {
    host: 'claude-code',
    status: summarizeStatus(checks),
    support_boundary: 'HOST_NATIVE_PLUGIN',
    distribution_mode: 'NATIVE_MARKETPLACE_EXACT_SHA_PLUGIN_SOURCE',
    source_path: 'plugins/claude-code',
    marketplace_path: '.claude-plugin/marketplace.json',
    invocation,
    install_identity: 'hakim@hakim',
    catalog_version: entry?.version || null,
    catalog_source_sha: source?.sha || null,
    target_state: 'READY_FOR_NATIVE_INSTALL',
    persistent_installation: 'SUPPORTED_BY_HOST',
    automatic_changes: false,
    native_user_skills: nativeSkills,
    native_agents: nativeAgents,
    checks,
    next_safe_action: `Run \`${marketplaceCommand}\` then \`claude plugin install hakim@hakim\`; the catalog entry pins ${frozen.version} to ${frozen.source_sha}.`,
  };
}

export function compareCopilotTarget(targetRoot, root = ROOT) {
  const sourcePath = path.join(root, '.github', 'copilot-instructions.md');
  if (!targetRoot) {
    return {
      target_root: null,
      target_path: null,
      target_state: 'NOT_COMPARED',
      source_sha256: sha256File(sourcePath),
      target_sha256: null,
      next_safe_action: 'Native plugin installation does not require copying repository instructions. Provide --target only to compare the optional baseline instruction file.',
    };
  }
  const resolvedTarget = path.resolve(targetRoot);
  if (!fs.existsSync(resolvedTarget) || !fs.statSync(resolvedTarget).isDirectory()) {
    return {
      target_root: resolvedTarget,
      target_path: path.join(resolvedTarget, '.github', 'copilot-instructions.md'),
      target_state: 'TARGET_NOT_FOUND',
      source_sha256: sha256File(sourcePath),
      target_sha256: null,
      next_safe_action: 'Provide an existing target repository directory. No files were changed.',
    };
  }
  const targetPath = path.join(resolvedTarget, '.github', 'copilot-instructions.md');
  const sourceHash = sha256File(sourcePath);
  if (!fs.existsSync(targetPath)) {
    return {
      target_root: resolvedTarget,
      target_path: targetPath,
      target_state: 'ABSENT',
      source_sha256: sourceHash,
      target_sha256: null,
      next_safe_action: 'The optional Hakim baseline instruction file is absent. Native plugin installation can proceed without copying it.',
    };
  }
  const targetHash = sha256File(targetPath);
  const matches = sourceHash === targetHash;
  return {
    target_root: resolvedTarget,
    target_path: targetPath,
    target_state: matches ? 'MATCH' : 'DIFF',
    source_sha256: sourceHash,
    target_sha256: targetHash,
    next_safe_action: matches
      ? 'The optional baseline instructions already match Hakim.'
      : 'Preserve the existing target instructions and merge deliberately; do not overwrite them automatically.',
  };
}

export function inspectCopilot(targetRoot = null, root = ROOT, version = null) {
  const identity = readIdentity(root);
  const frozen = identity.latest_frozen_candidate;
  const expectedVersion = version || fs.readFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
  const sourcePath = path.join(root, 'plugins', 'copilot');
  const manifestPath = path.join(sourcePath, 'plugin.json');
  const marketplacePath = path.join(root, '.github', 'plugin', 'marketplace.json');
  const skills = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
  const agents = ['hakim-reviewer', 'hakim-auditor', 'hakim-debt-analyst', 'hakim-evidence-verifier', 'hakim-implementer'];
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const marketplace = fs.existsSync(marketplacePath) ? JSON.parse(fs.readFileSync(marketplacePath, 'utf8')) : {};
  const entry = (marketplace.plugins || []).find((item) => item.name === 'hakim');
  const source = entry?.source;
  const checks = [
    check('plugin_manifest_present', fs.existsSync(manifestPath), path.relative(root, manifestPath)),
    check('source_tree_manifest_version_matches', manifest.version === expectedVersion, manifest.version || null),
    check('marketplace_present', fs.existsSync(marketplacePath), path.relative(root, marketplacePath)),
    check('marketplace_name_matches', marketplace.name === 'hakim', marketplace.name || null),
    check('marketplace_entry_present', Boolean(entry), entry?.name || null),
    check('catalog_version_matches_frozen_candidate', entry?.version === frozen.version, entry?.version || null),
    check('catalog_source_type_matches', source?.source === 'github', source?.source || null),
    check('catalog_source_repo_matches', source?.repo === 'Habib1001-m/hakim', source?.repo || null),
    check('catalog_source_path_matches', source?.path === 'plugins/copilot', source?.path || null),
    check('catalog_source_sha_matches', source?.sha === frozen.source_sha, source?.sha || null),
    check('catalog_source_ref_absent', source && !Object.hasOwn(source, 'ref'), source?.ref || null),
    check('native_skills_present', skills.every((name) => fs.existsSync(path.join(sourcePath, 'skills', name, 'SKILL.md'))), skills),
    check('native_agents_present', agents.every((name) => fs.existsSync(path.join(sourcePath, 'agents', `${name}.agent.md`))), agents),
    check('baseline_instruction_present', fs.existsSync(path.join(root, '.github', 'copilot-instructions.md')), '.github/copilot-instructions.md'),
  ];
  const comparison = compareCopilotTarget(targetRoot, root);
  const explicitTargetFailure = targetRoot && comparison.target_state === 'TARGET_NOT_FOUND';
  const marketplaceCommand = frozen.normal_install_commands['github-copilot'];
  const invocation = `${marketplaceCommand} && copilot plugin install hakim@hakim`;
  return {
    host: 'github-copilot',
    status: summarizeStatus(checks) === 'PASS' && !explicitTargetFailure ? 'PASS' : 'FAIL',
    support_boundary: 'HOST_NATIVE_PLUGIN',
    distribution_mode: 'NATIVE_MARKETPLACE_EXACT_SHA_PLUGIN_SOURCE',
    source_path: 'plugins/copilot',
    marketplace_path: '.github/plugin/marketplace.json',
    invocation,
    install_identity: 'hakim@hakim',
    catalog_version: entry?.version || null,
    catalog_source_sha: source?.sha || null,
    target_state: 'READY_FOR_NATIVE_INSTALL',
    persistent_installation: 'SUPPORTED_BY_HOST',
    automatic_changes: false,
    native_skills: skills,
    native_agents: agents,
    baseline_role: 'OPTIONAL_FALLBACK',
    comparison,
    checks,
    next_safe_action: `Run \`${marketplaceCommand}\` then \`copilot plugin install hakim@hakim\`; the catalog entry pins ${frozen.version} to ${frozen.source_sha}. Verify with \`copilot plugin list\`, /skills list, and /agent.`,
  };
}

export function inspectOpenCode(targetRoot = null, root = ROOT) {
  const identity = readIdentity(root);
  const bootstrap = identity.latest_frozen_candidate.normal_install_commands.opencode;
  let bundle;
  try {
    bundle = buildOpenCodeBundle(root);
  } catch (error) {
    return {
      host: 'opencode',
      status: 'FAIL',
      support_boundary: 'PROJECT_LOCAL_NATIVE_PLUGIN',
      distribution_mode: 'GIT_BACKED_PROJECT_LOCAL_INSTALLER',
      source_path: 'plugins/opencode',
      invocation: bootstrap,
      target_root: targetRoot ? path.resolve(targetRoot) : null,
      target_state: 'SOURCE_INVALID',
      persistent_installation: 'PROJECT_LOCAL',
      automatic_changes: false,
      checks: [check('canonical_bundle_valid', false, error.message)],
      next_safe_action: `Repair the canonical OpenCode bundle before planning installation: ${error.message}`,
    };
  }

  const checks = [
    check('canonical_bundle_valid', true, `${bundle.files.length} files`),
    check('opencode_config_mutation_disabled', bundle.opencode_config_mutation === false, bundle.opencode_config_mutation),
    check('git_bootstrap_cli_present', fs.existsSync(path.join(root, 'scripts', 'hakim_opencode_cli.mjs')), 'scripts/hakim_opencode_cli.mjs'),
  ];

  if (!targetRoot) {
    return {
      host: 'opencode',
      status: summarizeStatus(checks),
      support_boundary: 'PROJECT_LOCAL_NATIVE_PLUGIN',
      distribution_mode: 'GIT_BACKED_PROJECT_LOCAL_INSTALLER',
      source_path: 'plugins/opencode',
      invocation: bootstrap,
      target_root: null,
      target_state: 'READY_FOR_GIT_BOOTSTRAP',
      persistent_installation: 'PROJECT_LOCAL',
      automatic_changes: false,
      checks,
      next_safe_action: `From the target repository run \`${bootstrap}\`; add --dry-run to inspect the manifest without writing.`,
    };
  }

  const target = validateTargetRoot(targetRoot);
  if (!target.ok) {
    return {
      host: 'opencode',
      status: 'FAIL',
      support_boundary: 'PROJECT_LOCAL_NATIVE_PLUGIN',
      distribution_mode: 'GIT_BACKED_PROJECT_LOCAL_INSTALLER',
      source_path: 'plugins/opencode',
      invocation: bootstrap,
      target_root: target.target_root,
      target_state: target.state,
      persistent_installation: 'PROJECT_LOCAL',
      automatic_changes: false,
      checks: [...checks, check('target_root_valid', false, target.state)],
      next_safe_action: target.message,
    };
  }

  const installed = inspectInstalledBundle(target.target_root, bundle);
  let nextSafeAction = 'Review the OpenCode target state before any mutation.';
  if (installed.aggregate_state === 'ABSENT') {
    nextSafeAction = `Run \`${bootstrap} --target ${target.target_root}\`; add --dry-run first when inspection is desired.`;
  } else if (installed.aggregate_state === 'EXACT_MATCH') {
    nextSafeAction = 'The project-local OpenCode adapter already matches the canonical Hakim bundle; no installation change is needed.';
  } else {
    nextSafeAction = 'Preserve the existing OpenCode paths and reconcile them manually; automatic overwrite or partial repair is prohibited.';
  }

  return {
    host: 'opencode',
    status: summarizeStatus(checks),
    support_boundary: 'PROJECT_LOCAL_NATIVE_PLUGIN',
    distribution_mode: 'GIT_BACKED_PROJECT_LOCAL_INSTALLER',
    source_path: 'plugins/opencode',
    invocation: bootstrap,
    target_root: target.target_root,
    target_state: installed.aggregate_state,
    persistent_installation: 'PROJECT_LOCAL',
    automatic_changes: false,
    checks: [...checks, check('target_root_valid', true, target.target_root)],
    inspection: installed.counts,
    next_safe_action: nextSafeAction,
  };
}

export function buildPlan(options, root = ROOT) {
  const version = fs.readFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
  const requestedHosts = options.host === 'all' ? SUPPORTED_HOSTS : [options.host];
  const plans = requestedHosts.map((host) => {
    if (host === 'codex') return inspectCodex(root, version);
    if (host === 'claude-code') return inspectClaude(root, version);
    if (host === 'github-copilot') return inspectCopilot(options.target, root, version);
    return inspectOpenCode(options.target, root);
  });
  const failed = plans.filter((plan) => plan.status !== 'PASS');
  return {
    schema_version: 1,
    mode: 'READ_ONLY',
    mutation_performed: false,
    hakim_version: version,
    selected_host: options.host,
    target_root: options.target ? path.resolve(options.target) : null,
    overall_status: failed.length === 0 ? 'PASS' : 'FAIL',
    persistent_installation_claimed: false,
    plans,
    next_safe_action: failed.length > 0
      ? failed[0].next_safe_action
      : plans.map((plan) => `${plan.host}: ${plan.next_safe_action}`).join(' | '),
  };
}

export function formatText(plan) {
  const lines = [
    'Hakim Installation Plan',
    'MODE=READ_ONLY',
    'MUTATION_PERFORMED=NO',
    `HAKIM_VERSION=${plan.hakim_version}`,
    `OVERALL_STATUS=${plan.overall_status}`,
  ];
  for (const hostPlan of plan.plans) {
    lines.push('', `[${hostPlan.host}]`, `STATUS=${hostPlan.status}`, `MODE=${hostPlan.distribution_mode}`, `SOURCE=${hostPlan.source_path}`);
    if (hostPlan.invocation) lines.push(`INVOCATION=${hostPlan.invocation}`);
    if (hostPlan.install_identity) lines.push(`INSTALL_IDENTITY=${hostPlan.install_identity}`);
    if (hostPlan.catalog_source_sha) lines.push(`CATALOG_SOURCE_SHA=${hostPlan.catalog_source_sha}`);
    if (hostPlan.comparison) {
      lines.push(`BASELINE_TARGET_STATE=${hostPlan.comparison.target_state}`);
      if (hostPlan.comparison.target_path) lines.push(`BASELINE_TARGET=${hostPlan.comparison.target_path}`);
    }
    if (hostPlan.target_state) lines.push(`TARGET_STATE=${hostPlan.target_state}`);
    if (hostPlan.target_root) lines.push(`TARGET=${hostPlan.target_root}`);
    lines.push(`NEXT_SAFE_ACTION=${hostPlan.next_safe_action}`);
  }
  lines.push('', `NEXT_SAFE_ACTION=${plan.next_safe_action}`);
  return lines.join('\n');
}

function usage() {
  return [
    'Usage:',
    '  npm run plan:install -- --host <codex|claude-code|github-copilot|opencode|all>',
    '  npm run plan:install:json -- --host all',
    '  node scripts/hakim_install_plan.mjs --host <github-copilot|opencode> --target <repository> [--json]',
    '',
    'Produces a read-only, repository-backed installation plan. It never copies, deletes, overwrites, or edits host or target-repository files.',
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
  const plan = buildPlan(options);
  console.log(options.json ? JSON.stringify(plan, null, 2) : formatText(plan));
  process.exit(plan.overall_status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();