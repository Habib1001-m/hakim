#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseTomlScalarTables } from '../scripts/lib/structured_metadata.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const hasExactLine = (text, value) => text.split(/\r?\n/).some((line) => line.trim() === value);

const identity = readJson('conformance/distribution-identity.json');
const current = identity.current_development;
const frozen = identity.latest_frozen_candidate;
const version = read('core/hakim-skill/VERSION').trim();
const packageJson = readJson('package.json');
const pyproject = parseTomlScalarTables(read('pyproject.toml'));
const nativeAcceptance = readJson(current.native_acceptance_projection);
const frozenAcceptance = readJson(frozen.native_acceptance_projection);
const canonicalSkill = read('core/hakim-skill/SKILL.md');
const readme = read('README.md');
const install = read('core/hakim-skill/INSTALL.md');
const versioning = read('VERSIONING.md');
const readiness = read('docs/PRODUCT_READINESS.md');
const operationalPresence = read('docs/OPERATIONAL_PRESENCE.md');
const transportAuthority = read(frozen.transport_reconciliation.authority);
const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
const copilotMarketplace = readJson('.github/plugin/marketplace.json');

const versionedJsonPaths = [
  'plugins/codex/.codex-plugin/plugin.json',
  'plugins/claude-code/.claude-plugin/plugin.json',
  'plugins/copilot/plugin.json',
];
const installDocs = [
  'README.md',
  'core/hakim-skill/INSTALL.md',
  'plugins/codex/README.md',
  'plugins/claude-code/README.md',
  'plugins/copilot/README.md',
  'plugins/opencode/README.md',
  'core/hakim-skill/skills/hakim-help/SKILL.md',
  'plugins/codex/skills/hakim-help/SKILL.md',
  'plugins/claude-code/skills/hakim-help/SKILL.md',
  'plugins/copilot/skills/hakim-help/SKILL.md',
];
const expectedHosts = ['claude-code', 'codex', 'github-copilot', 'opencode'];
const acceptedHosts = ['codex', 'claude-code'];
const pendingHosts = expectedHosts.filter((host) => !acceptedHosts.includes(host));
const exactSha = /^[0-9a-f]{40}$/;
const exactSha256 = /^[0-9a-f]{64}$/;
const invalidClaudeCommitRef = `claude plugin marketplace add https://github.com/Habib1001-m/hakim.git#${frozen.source_sha}`;
const invalidCopilotCommitRef = `copilot plugin marketplace add Habib1001-m/hakim#${frozen.source_sha}`;
const obsoleteExactLines = [
  'codex plugin marketplace add Habib1001-m/hakim',
  'npx --yes --package=github:Habib1001-m/hakim hakim-opencode install',
  invalidClaudeCommitRef,
  invalidCopilotCommitRef,
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertAcceptedPacket(contract, expectedHost) {
  assert.match(contract.packet_sha256, exactSha256);
  const packetText = read(contract.packet_path);
  const packet = JSON.parse(packetText);
  const packetSha256 = crypto.createHash('sha256').update(packetText).digest('hex');
  assert.equal(packetSha256, contract.packet_sha256);
  assert.equal(packet.packet_type, 'P0_HOST_TRANSPORT_EVIDENCE');
  assert.equal(packet.mode, 'CANDIDATE_EVIDENCE');
  assert.equal(packet.packet_status, 'PASS');
  assert.equal(packet.host, expectedHost);
  assert.equal(packet.expected.source_sha, frozen.source_sha);
  assert.equal(packet.observed.resolved_source_sha, frozen.source_sha);
  assert.equal(packet.observed.installed_product_version, frozen.version);
  assert.equal(packet.observed.installation_status, 'PASS');
  assert.equal(packet.observed.activation_status, 'PASS');
  assert.equal(packet.observed.invocation_status, 'PASS');
  assert.equal(packet.evidence_ref, contract.evidence_ref);
}

test('distribution identity authority separates moving development from the frozen candidate', () => {
  assert.equal(identity.schema_version, 2);
  assert.equal(current.channel, 'unreleased-development');
  assert.equal(current.version, '1.0.0-beta.4.post1');
  assert.equal(current.source_ref, 'main');
  assert.equal(current.frozen, false);
  assert.equal(current.candidate, false);
  assert.equal(current.evidence_eligible, false);
  assert.equal(current.native_acceptance_projection, 'conformance/native-host-acceptance.json');

  assert.equal(frozen.channel, 'public-beta');
  assert.equal(frozen.version, '1.0.0-beta.4');
  assert.equal(frozen.source_ref, 'evidence/beta4-r31-5d00039');
  assert.match(frozen.source_sha, exactSha);
  assert.equal(frozen.source_sha, '5d00039479f2f11b7fe30ccf2385e70ce24553c3');
  assert.equal(frozen.frozen, true);
  assert.equal(frozen.candidate, true);
  assert.equal(frozen.native_acceptance_projection, 'conformance/history/native-host-acceptance-1.0.0-beta.4.json');

  assert.notEqual(current.version, frozen.version);
  assert.notEqual(current.source_ref, frozen.source_ref);
  assert.notEqual(current.native_acceptance_projection, frozen.native_acceptance_projection);
  assert.equal(identity.next_candidate.version, '1.0.0-beta.5');
  assert.equal(identity.next_candidate.status, 'NOT_CUT');
});

test('moving source-tree metadata stays development while Claude and Copilot catalogs advertise frozen beta4', () => {
  assert.equal(version, current.version);
  assert.equal(packageJson.version, current.version);
  assert.equal(pyproject.project.version, current.version);
  assert.equal(pyproject['tool.hakim'].release_channel, current.channel);
  assert.equal(nativeAcceptance.product_version, current.version);
  assert.equal(nativeAcceptance.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
  assert.match(nativeAcceptance.source_policy, /unreleased development/i);
  assert.match(nativeAcceptance.source_policy, /not a frozen candidate/i);
  assert.match(canonicalSkill, new RegExp(`^version:\\s*${escapeRegExp(current.version)}$`, 'm'));

  for (const relative of versionedJsonPaths) {
    assert.equal(readJson(relative).version, current.version, `${relative} does not match current development identity`);
  }

  const claude = claudeMarketplace.plugins.find((item) => item.name === 'hakim');
  assert.ok(claude);
  assert.equal(claude.version, frozen.version);
  assert.deepEqual(claude.source, {
    source: 'git-subdir',
    url: 'https://github.com/Habib1001-m/hakim.git',
    path: 'plugins/claude-code',
    sha: frozen.source_sha,
  });

  const copilot = copilotMarketplace.plugins.find((item) => item.name === 'hakim');
  assert.ok(copilot);
  assert.equal(copilotMarketplace.metadata.version, frozen.version);
  assert.equal(copilot.version, frozen.version);
  assert.deepEqual(copilot.source, {
    source: 'github',
    repo: 'Habib1001-m/hakim',
    sha: frozen.source_sha,
    path: 'plugins/copilot',
  });
});

test('frozen beta4 retains its own partially accepted machine-readable projection', () => {
  assert.equal(frozenAcceptance.schema_version, 1);
  assert.equal(frozenAcceptance.product_version, frozen.version);
  assert.equal(frozenAcceptance.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
  assert.match(frozenAcceptance.source_policy, new RegExp(escapeRegExp(frozen.source_sha)));
  assert.match(frozenAcceptance.source_policy, /Codex and Claude Code exact-SHA transport/i);
  assert.deepEqual(Object.keys(frozenAcceptance.hosts).sort(), expectedHosts);

  const codex = frozenAcceptance.hosts.codex;
  assert.equal(codex.status, 'PASS');
  assert.equal(codex.host_version, 'codex-cli 0.145.0');
  assert.equal(codex.verified_at, '2026-07-30T21:16:31Z');
  assert.equal(codex.evidence_ref, 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5136341471');

  const claude = frozenAcceptance.hosts['claude-code'];
  assert.equal(claude.status, 'PASS');
  assert.equal(claude.host_version, '2.1.220 (Claude Code)');
  assert.equal(claude.verified_at, '2026-07-30T23:15:48.874Z');
  assert.equal(claude.evidence_ref, 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5137151921');

  for (const host of pendingHosts) {
    const entry = frozenAcceptance.hosts[host];
    assert.equal(entry.status, 'NOT_RUN');
    assert.equal(entry.host_version, null);
    assert.equal(entry.verified_at, null);
    assert.equal(entry.evidence_ref, null);
  }
});

test('normal frozen routes use an effective exact pin at the host-native layer', () => {
  const commands = frozen.normal_install_commands;
  assert.deepEqual(Object.keys(commands).sort(), expectedHosts);

  for (const host of ['codex', 'opencode']) {
    assert.match(commands[host], new RegExp(escapeRegExp(frozen.source_sha)), `${host} declaration is not pinned to the frozen SHA`);
  }
  assert.equal(commands['claude-code'], 'claude plugin marketplace add Habib1001-m/hakim');
  assert.equal(commands['github-copilot'], 'copilot plugin marketplace add Habib1001-m/hakim');

  const claudeSource = claudeMarketplace.plugins.find((item) => item.name === 'hakim')?.source;
  assert.equal(claudeSource?.source, 'git-subdir');
  assert.equal(claudeSource?.url, 'https://github.com/Habib1001-m/hakim.git');
  assert.equal(claudeSource?.path, 'plugins/claude-code');
  assert.equal(claudeSource?.sha, frozen.source_sha);
  assert.equal(Object.hasOwn(claudeSource || {}, 'ref'), false);

  const copilotSource = copilotMarketplace.plugins.find((item) => item.name === 'hakim')?.source;
  assert.equal(copilotSource?.source, 'github');
  assert.equal(copilotSource?.repo, 'Habib1001-m/hakim');
  assert.equal(copilotSource?.path, 'plugins/copilot');
  assert.equal(copilotSource?.sha, frozen.source_sha);
  assert.equal(Object.hasOwn(copilotSource || {}, 'ref'), false);

  for (const [host, command] of Object.entries(commands)) {
    assert.ok(readme.includes(command), `${host} frozen declaration missing from README.md`);
    assert.ok(install.includes(command), `${host} frozen declaration missing from INSTALL.md`);
  }

  const normalDocs = installDocs.map((relative) => read(relative)).join('\n');
  for (const obsoleteLine of obsoleteExactLines) {
    assert.equal(hasExactLine(normalDocs, obsoleteLine), false, `obsolete or invalid normal route remains documented: ${obsoleteLine}`);
  }
});

test('transport reconciliation preserves accepted proof and repaired Copilot failure provenance', () => {
  const reconciliation = frozen.transport_reconciliation;
  const contracts = frozen.host_transport_contracts;

  assert.equal(reconciliation.status, 'HOLD_FOR_HOST_NATIVE_PROOF');
  assert.equal(reconciliation.authority, 'docs/P0_HOST_TRANSPORT_RECONCILIATION.md');
  assert.equal(reconciliation.verified_hosts, 2);
  assert.equal(reconciliation.required_hosts, expectedHosts.length);
  assert.match(transportAuthority, /^\*\*Status:\*\* `HOLD_FOR_HOST_NATIVE_PROOF`/m);
  assert.match(transportAuthority, /HOST_RESOLUTION_PROOF\s*= PARTIAL_2_OF_4/);
  assert.match(transportAuthority, /MARKETPLACE_SOURCE_SHA_TREATED_AS_BRANCH/);
  assert.match(transportAuthority, /MARKETPLACE_REF_SHA_TREATED_AS_BRANCH/);
  assert.match(transportAuthority, /git-subdir/);
  assert.match(transportAuthority, /source\.github\.sha|plugin source/i);
  assert.match(transportAuthority, /RESOLVED_SOURCE_SHA/);

  assert.deepEqual(Object.keys(contracts).sort(), expectedHosts);
  for (const host of expectedHosts) {
    const contract = contracts[host];
    assert.equal(contract.command_key, host);
    assert.equal(contract.expected_source_sha, frozen.source_sha);
    assert.match(contract.expected_source_sha, exactSha);
    assert.ok(frozen.normal_install_commands[contract.command_key]);
  }

  const codex = contracts.codex;
  assert.equal(codex.static_contract_status, 'EXACT_SHA_DECLARED');
  assert.equal(codex.live_resolution_status, 'PASS');
  assert.equal(codex.resolved_source_sha, frozen.source_sha);
  assert.equal(codex.installed_product_version, frozen.version);
  assert.equal(codex.host_version, 'codex-cli 0.145.0');
  assert.equal(codex.verified_at, '2026-07-30T21:16:31Z');
  assert.equal(codex.evidence_ref, frozenAcceptance.hosts.codex.evidence_ref);
  assert.equal(codex.candidate_evidence_eligible, true);
  assert.equal(codex.packet_path, 'conformance/history/p0-host-transport/codex-1.0.0-beta.4.json');
  assertAcceptedPacket(codex, 'codex');

  const claude = contracts['claude-code'];
  assert.equal(claude.pin_layer, 'catalog-plugin-source-sha');
  assert.equal(claude.static_contract_status, 'EXACT_SHA_PLUGIN_SOURCE_DECLARED');
  assert.equal(claude.plugin_source_type, 'git-subdir');
  assert.equal(claude.plugin_source_path, 'plugins/claude-code');
  assert.equal(claude.live_resolution_status, 'PASS');
  assert.equal(claude.resolved_source_sha, frozen.source_sha);
  assert.equal(claude.installed_product_version, frozen.version);
  assert.equal(claude.host_version, '2.1.220 (Claude Code)');
  assert.equal(claude.verified_at, '2026-07-30T23:15:48.874Z');
  assert.equal(claude.evidence_ref, frozenAcceptance.hosts['claude-code'].evidence_ref);
  assert.equal(claude.candidate_evidence_eligible, true);
  assert.equal(claude.packet_path, 'conformance/history/p0-host-transport/claude-code-1.0.0-beta.4.json');
  assertAcceptedPacket(claude, 'claude-code');
  assert.equal(claude.superseded_failed_attempt.host_version, '2.1.220 (Claude Code)');
  assert.equal(claude.superseded_failed_attempt.status, 'FAIL');
  assert.equal(claude.superseded_failed_attempt.reason, 'MARKETPLACE_SOURCE_SHA_TREATED_AS_BRANCH');
  assert.equal(claude.superseded_failed_attempt.evidence_ref, 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5136565274');

  const copilot = contracts['github-copilot'];
  assert.equal(copilot.pin_layer, 'catalog-plugin-source-sha');
  assert.equal(copilot.catalog_path, '.github/plugin/marketplace.json');
  assert.equal(copilot.plugin_source_type, 'github');
  assert.equal(copilot.plugin_source_repo, 'Habib1001-m/hakim');
  assert.equal(copilot.plugin_source_path, 'plugins/copilot');
  assert.equal(copilot.static_contract_status, 'EXACT_SHA_PLUGIN_SOURCE_DECLARED');
  assert.equal(copilot.live_resolution_status, 'NOT_RUN');
  assert.equal(copilot.evidence_ref, null);
  assert.equal(copilot.candidate_evidence_eligible, false);
  assert.equal(copilot.superseded_failed_attempt.status, 'FAIL');
  assert.equal(copilot.superseded_failed_attempt.reason, 'MARKETPLACE_REF_SHA_TREATED_AS_BRANCH');
  assert.equal(copilot.superseded_failed_attempt.evidence_ref, 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5142063851');
  assert.equal(copilot.repair_probe.status, 'PASS');
  assert.equal(copilot.repair_probe.probe_scope, 'LOCAL_CATALOG_SOURCE_CONTRACT_ONLY');
  assert.equal(copilot.repair_probe.resolved_source_sha, frozen.source_sha);
  assert.equal(copilot.repair_probe.installed_product_version, frozen.version);
  assert.equal(copilot.repair_probe.source_file_count, 13);
  assert.equal(copilot.repair_probe.installed_file_count, 13);
  assert.equal(copilot.repair_probe.byte_mismatch_count, 0);
  assert.equal(copilot.repair_probe.source_tree_sha256, 'b1d210d97a4d1f5b119667bedf13007cbb0560a6bb1f28bcd3e232ee708d14e2');
  assert.equal(copilot.repair_probe.installed_tree_sha256, copilot.repair_probe.source_tree_sha256);
  assert.equal(copilot.repair_probe.candidate_evidence_eligible, false);

  for (const host of pendingHosts) {
    assert.equal(contracts[host].live_resolution_status, 'NOT_RUN');
    assert.equal(contracts[host].evidence_ref, null);
    assert.equal(contracts[host].candidate_evidence_eligible, false);
  }

  assert.equal(contracts.opencode.static_contract_status, 'EXACT_SHA_DECLARED');
  assert.equal(identity.policy.command_text_is_not_runtime_proof, true);
  assert.equal(identity.policy.host_verification_requires_resolved_source_sha, true);
  assert.equal(identity.policy.effective_pin_may_be_declared_in_host_native_catalog, true);
});

test('active authorities keep P0 before F05 and mark main as non-candidate development', () => {
  const activeTruth = `${readme}\n${install}\n${versioning}\n${readiness}\n${operationalPresence}\n${transportAuthority}`;
  assert.match(activeTruth, /unreleased development/i);
  assert.match(activeTruth, /moving `?main`?/i);
  assert.match(activeTruth, /not (?:a )?(?:frozen )?candidate/i);
  assert.match(activeTruth, /P0[^\n]*Truthful Immutable Distribution Identity/i);
  assert.match(activeTruth, /HOLD_FOR_HOST_NATIVE_PROOF/);

  for (const text of [readiness, operationalPresence]) {
    const p0Index = text.indexOf('P0');
    const f05Index = text.indexOf('F05');
    assert.ok(p0Index >= 0, 'P0 missing from maintained authority');
    assert.ok(f05Index >= 0, 'F05 missing from maintained authority');
    assert.ok(p0Index < f05Index, 'F05 appears before the P0 distribution-identity gate');
  }
});

console.log('test_distribution_identity_contract.mjs: ok');
