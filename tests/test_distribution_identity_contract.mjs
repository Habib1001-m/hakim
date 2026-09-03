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
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
const copilotMarketplace = readJson('.github/plugin/marketplace.json');

const expectedHosts = ['claude-code', 'codex', 'github-copilot', 'opencode'];
const exactSha = /^[0-9a-f]{40}$/;
const exactSha256 = /^[0-9a-f]{64}$/;
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
const expectedRawPacketHashes = {
  codex: 'fb7cf6909fea2c901d8b940519f248539ec7b8d67cfe8ae13a1d6f9812d09cb3',
  'claude-code': '107a56c43f24c838b1a3e120a881bedea9618bb3636aeafecb4e54cdf63992e4',
  'github-copilot': '60d7121c671e7f279a7435f07b5028827fe9113249dab09ec661f31f0c9809a6',
  opencode: '899e1d6cf15b4c94710438a0585fd7635fa9568d9d8622df2e90cff1347b7304',
};

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

  assert.equal(packet.public_projection?.local_execution_paths, 'REDACTED');
  assert.equal(packet.public_projection?.raw_packet_sha256, expectedRawPacketHashes[expectedHost]);
  assert.equal(packet.public_projection?.redaction_scope, 'host_binary.requested, host_binary.resolved, cwd, target');
  assert.equal(packet.host_binary?.requested, null);
  assert.equal(packet.host_binary?.resolved, null);
  assert.equal(packet.cwd, null);
  assert.equal(packet.target, null);
  assert.doesNotMatch(packetText, /(?:\/home\/|\/tmp\/|[A-Za-z]:\\\\)/, `${expectedHost} public packet leaks a local execution path`);
}

test('distribution identity separates moving development from the frozen candidate', () => {
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
  assert.equal(frozen.source_sha, '5d00039479f2f11b7fe30ccf2385e70ce24553c3');
  assert.match(frozen.source_sha, exactSha);
  assert.equal(frozen.frozen, true);
  assert.equal(frozen.candidate, true);
  assert.equal(frozen.native_acceptance_projection, 'conformance/history/native-host-acceptance-1.0.0-beta.4.json');

  assert.notEqual(current.version, frozen.version);
  assert.notEqual(current.native_acceptance_projection, frozen.native_acceptance_projection);
  assert.equal(identity.next_candidate.version, '1.0.0-beta.5');
  assert.equal(identity.next_candidate.status, 'NOT_CUT');
});

test('moving metadata stays development while frozen catalogs stay pinned', () => {
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

test('frozen beta4 acceptance remains fully machine-readable', () => {
  assert.equal(frozenAcceptance.schema_version, 1);
  assert.equal(frozenAcceptance.product_version, frozen.version);
  assert.equal(frozenAcceptance.overall_status, 'PASS');
  assert.deepEqual(Object.keys(frozenAcceptance.hosts).sort(), expectedHosts);

  const expected = {
    codex: ['codex-cli 0.145.0', 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5136341471'],
    'claude-code': ['2.1.220 (Claude Code)', 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5137151921'],
    'github-copilot': ['GitHub Copilot CLI 1.0.71.', 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5142910571'],
    opencode: ['1.18.5', 'https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5143738204'],
  };

  for (const [host, [hostVersion, evidenceRef]] of Object.entries(expected)) {
    assert.equal(frozenAcceptance.hosts[host].status, 'PASS');
    assert.equal(frozenAcceptance.hosts[host].host_version, hostVersion);
    assert.equal(frozenAcceptance.hosts[host].evidence_ref, evidenceRef);
  }
});

test('normal frozen routes use exact host-native pins and remain documented', () => {
  const commands = frozen.normal_install_commands;
  assert.deepEqual(Object.keys(commands).sort(), expectedHosts);
  assert.match(commands.codex, new RegExp(escapeRegExp(frozen.source_sha)));
  assert.match(commands.opencode, new RegExp(escapeRegExp(frozen.source_sha)));
  assert.equal(commands['claude-code'], 'claude plugin marketplace add Habib1001-m/hakim');
  assert.equal(commands['github-copilot'], 'copilot plugin marketplace add Habib1001-m/hakim');

  const claudeSource = claudeMarketplace.plugins.find((item) => item.name === 'hakim')?.source;
  assert.equal(claudeSource?.source, 'git-subdir');
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
  const invalidExactLines = [
    'codex plugin marketplace add Habib1001-m/hakim',
    'npx --yes --package=github:Habib1001-m/hakim hakim-opencode install',
    `claude plugin marketplace add https://github.com/Habib1001-m/hakim.git#${frozen.source_sha}`,
    `copilot plugin marketplace add Habib1001-m/hakim#${frozen.source_sha}`,
  ];
  for (const line of invalidExactLines) {
    assert.equal(hasExactLine(normalDocs, line), false, `obsolete or invalid normal route remains documented: ${line}`);
  }
});

test('transport reconciliation is packet-backed, not prose-backed', () => {
  const reconciliation = frozen.transport_reconciliation;
  const contracts = frozen.host_transport_contracts;

  assert.equal(reconciliation.status, 'PASS');
  assert.equal(reconciliation.verified_hosts, 4);
  assert.equal(reconciliation.required_hosts, 4);
  assert.equal(Object.hasOwn(reconciliation, 'authority'), false);
  assert.deepEqual(Object.keys(contracts).sort(), expectedHosts);

  const expectedPacketHashes = {
    codex: '16670650069254350272664e3a8f3211d45fc8297ddbe5e04c15791d551ee4c0',
    'claude-code': '33fed855492fc10417500dc338292b25e4b2ee27a5073ad5a133770bd46d5b9a',
    'github-copilot': 'c1225d4a400d791fb8f8b27e1819ea6d0a22a1a3d57326a40cfd529805683424',
    opencode: 'a2e829030f1abf1ea146f730020975fca9ffc1d5c9fd71da17aa66306e36e344',
  };

  for (const host of expectedHosts) {
    const contract = contracts[host];
    assert.equal(contract.command_key, host);
    assert.equal(contract.expected_source_sha, frozen.source_sha);
    assert.equal(contract.live_resolution_status, 'PASS');
    assert.equal(contract.resolved_source_sha, frozen.source_sha);
    assert.equal(contract.installed_product_version, frozen.version);
    assert.equal(contract.candidate_evidence_eligible, true);
    assert.equal(contract.packet_sha256, expectedPacketHashes[host]);
    assertAcceptedPacket(contract, host);
  }

  assert.equal(contracts['claude-code'].superseded_failed_attempt.reason, 'MARKETPLACE_SOURCE_SHA_TREATED_AS_BRANCH');
  assert.equal(contracts['github-copilot'].superseded_failed_attempt.reason, 'MARKETPLACE_REF_SHA_TREATED_AS_BRANCH');
  assert.equal(contracts['github-copilot'].repair_probe.status, 'PASS');
  assert.equal(contracts['github-copilot'].repair_probe.candidate_evidence_eligible, false);

  assert.equal(identity.policy.command_text_is_not_runtime_proof, true);
  assert.equal(identity.policy.host_verification_requires_resolved_source_sha, true);
  assert.equal(identity.policy.effective_pin_may_be_declared_in_host_native_catalog, true);
});

console.log('test_distribution_identity_contract.mjs: ok');
