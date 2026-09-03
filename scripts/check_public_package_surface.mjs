#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const errors = [];

if (!fs.existsSync(packagePath)) {
  errors.push('missing package.json');
} else {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.private !== true) errors.push('package.json must remain private');
  if (pkg.engines?.node !== '>=22') errors.push('public Node support contract must be >=22');
  if (pkg.bin?.['hakim-opencode'] !== 'scripts/hakim_opencode_cli.mjs') {
    errors.push('Git-backed OpenCode bootstrap bin is missing or unexpected');
  }

  const expectedBootstrapFiles = [
    'core/hakim-skill/VERSION',
    'core/hakim-skill/SKILL.md',
    'core/hakim-skill/capabilities.json',
    'core/hakim-skill/skills',
    'core/loaders/hakim-loader.mjs',
    'plugins/opencode/hakim.mjs',
    'scripts/hakim_opencode_cli.mjs',
    'scripts/hakim_opencode_install.mjs',
    'scripts/hakim_opencode_remove.mjs',
    'scripts/lib/opencode_bundle.mjs',
    'scripts/lib/opencode_prior_manifests.mjs',
    'scripts/lib/opencode_transaction.mjs',
  ];
  if (!Array.isArray(pkg.files) || pkg.files.length !== expectedBootstrapFiles.length) {
    errors.push('Git-backed bootstrap package files allowlist has unexpected size');
  } else {
    for (const relative of expectedBootstrapFiles) {
      if (!pkg.files.includes(relative)) errors.push(`Git-backed bootstrap package missing allowlisted path: ${relative}`);
    }
  }

  if (pkg.scripts?.test !== 'npm run test:repo') errors.push('test must route to the canonical test:repo gate');
  const repoGate = pkg.scripts?.['test:repo'] || '';
  if (!repoGate.includes('npm run test:public') || !repoGate.includes('npm run package:release')) {
    errors.push('test:repo must cover permanent public tests and release artifact verification');
  }

  for (const script of [
    'test:repo',
    'test:public',
    'test:public:js',
    'test:public:py',
    'test:node-compat',
    'doctor',
    'doctor:json',
    'doctor:fast',
    'package:skill',
    'package:release',
    'release:sbom',
    'release:sbom:verify',
    'release:checksums',
    'release:checksums:verify',
    'install:opencode',
    'remove:opencode',
  ]) {
    if (!pkg.scripts?.[script]) errors.push(`missing package script: ${script}`);
  }

  const releaseGate = pkg.scripts?.['package:release'] || '';
  for (const required of [
    'npm run package:skill',
    'npm run release:sbom',
    'npm run release:checksums',
    'npm run release:sbom:verify',
    'npm run release:checksums:verify',
  ]) {
    if (!releaseGate.includes(required)) errors.push(`package:release missing ${required}`);
  }

  for (const internalScript of [
    'check:product-state',
    'check:transition-state',
    'check:metadata',
    'check:taskboard',
    'check:beta-feedback-form',
    'evidence:guarded-session',
    'benchmark:verify',
    'evaluate:clean-journey',
    'audit:ci',
    'test:evidence:historical',
  ]) {
    if (pkg.scripts?.[internalScript]) errors.push(`internal package script remains: ${internalScript}`);
  }
}

for (const relative of [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SUPPORTED_HOSTS.md',
  'SECURITY.md',
  'KNOWN_LIMITATIONS.md',
  'VERSIONING.md',
  'SUPPORT.md',
  'docs/ARCHITECTURE.md',
  'core/hakim-skill/VERSION',
  'core/hakim-skill/SKILL.md',
  'core/hakim-skill/AGENTS.md',
  'core/hakim-skill/INSTALL.md',
  'conformance/distribution-identity.json',
  'scripts/hakim_doctor.mjs',
  'scripts/hakim_opencode_cli.mjs',
  'scripts/lib/opencode_prior_manifests.mjs',
  'scripts/lib/opencode_transaction.mjs',
  'scripts/build_release_sbom.py',
  'scripts/verify_package.py',
  'scripts/verify_downloaded_release_bundle.py',
]) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`missing required public file: ${relative}`);
}

for (const relative of [
  'docs/PRODUCT_READINESS.md',
  'docs/OPERATIONAL_PRESENCE.md',
  'docs/P0_HOST_TRANSPORT_RECONCILIATION.md',
  'docs/LIVE_HOST_ACCEPTANCE.md',
  'docs/F05_START_AND_TASK_BOUNDARY.md',
  'docs/EXTERNAL_BETA_EVALUATION.md',
  '.github/ISSUE_TEMPLATE/public-beta-feedback.yml',
  'docs/agentic-ai-reference-SPEC.md',
  'docs/theoretical-reference',
  'docs/The Hitchhiker’s Guide to Agentic AI.md',
  'plugins/hermes',
  'plugins/gemini-antigravity',
  'packaging/native-plugin',
  'scripts/build_native_plugin_package.mjs',
  'scripts/pack_native_plugin_tarball.mjs',
  'scripts/verify_native_plugin_prerelease.mjs',
  'scripts/run_native_plugin_opencode_smoke.sh',
  'tests/verify_native_plugin_opencode_smoke.mjs',
  'tests/test_native_plugin_tarball.mjs',
  'tests/test_native_plugin_realpath_containment.mjs',
  'tests/test_native_plugin_transactional_lifecycle.mjs',
  'scripts/check_post_e1_runtime_trace.mjs',
  'tests/test_post_e1_runtime_trace_checker.mjs',
  'tests/test_post_e1_behavioral_contract.mjs',
  'tests/test_post_beta_r2_p1_truth.mjs',
  'experiments',
  'benchmarks',
  'docs/phase-history',
  'scripts/analyze_post_e1_efficiency.mjs',
  'scripts/audit_complexity.py',
  'scripts/capability_runtime_smoke_capture.sh',
  'scripts/claude_runtime_evidence_capture.sh',
  'scripts/codex_runtime_evidence_capture.sh',
  'scripts/codex_startup_doctor.sh',
  'scripts/copilot_runtime_evidence_capture.sh',
  'scripts/package_skill.py',
  'scripts/print_claude_runtime_commands.sh',
  'scripts/print_codex_runtime_commands.sh',
  'scripts/run_clean_evaluator_journey.mjs',
  'scripts/run_guarded_session_fixture.mjs',
  'scripts/verify_independent_benchmark_pilot.mjs',
  'scripts/hakim_pr_guardian_v2.mjs',
  'scripts/lib/guarded_session_integrity.mjs',
  'tests/test_capability_runtime_smoke_capture.js',
  'tests/test_codex_startup_doctor.js',
  'tests/test_post_e1_prompt_neutrality.mjs',
  'tests/test_post_e1_e2_fixture.mjs',
  'tests/test_post_e1_e2_materializer.mjs',
  'tests/test_post_e1_e3_fixture.mjs',
  'tests/test_post_e1_e3_materializer.mjs',
  'tests/test_post_e1_e4_fixture.mjs',
  'tests/test_post_e1_e4_materializer.mjs',
  'tests/test_post_e1_efficiency_analyzer.mjs',
  'tests/test_runtime_conformance_readiness.js',
  'tests/test_truth_gate_policy.mjs',
]) {
  if (fs.existsSync(path.join(root, relative))) errors.push(`retired public product surface remains: ${relative}`);
}

const payload = { ok: errors.length === 0, errors };
console.log(JSON.stringify(payload, null, 2));
process.exit(payload.ok ? 0 : 1);
