#!/usr/bin/env node
import assert from 'node:assert/strict';
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
const exactSha = /^[0-9a-f]{40}$/;
const oldUnpinnedRoutes = [
  'codex plugin marketplace add Habib1001-m/hakim',
  'claude plugin marketplace add Habib1001-m/hakim',
  'copilot plugin marketplace add Habib1001-m/hakim',
  'npx --yes --package=github:Habib1001-m/hakim hakim-opencode install',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('distribution identity authority separates moving development from the frozen candidate', () => {
  assert.equal(identity.schema_version, 1);

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

test('moving-main metadata and acceptance report only the development identity', () => {
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

  const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
  const copilotMarketplace = readJson('.github/plugin/marketplace.json');
  assert.equal(claudeMarketplace.plugins.find((item) => item.name === 'hakim')?.version, current.version);
  assert.equal(copilotMarketplace.metadata.version, current.version);
  assert.equal(copilotMarketplace.plugins.find((item) => item.name === 'hakim')?.version, current.version);
});

test('frozen beta4 retains its own machine-readable acceptance projection', () => {
  assert.equal(frozenAcceptance.schema_version, 1);
  assert.equal(frozenAcceptance.product_version, frozen.version);
  assert.equal(frozenAcceptance.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
  assert.match(frozenAcceptance.source_policy, new RegExp(escapeRegExp(frozen.source_sha)));
  assert.match(frozenAcceptance.source_policy, /fresh real-host evidence/i);
  assert.deepEqual(Object.keys(frozenAcceptance.hosts).sort(), ['claude-code', 'codex', 'github-copilot', 'opencode']);

  for (const entry of Object.values(frozenAcceptance.hosts)) {
    assert.equal(entry.status, 'NOT_RUN');
    assert.equal(entry.host_version, null);
    assert.equal(entry.verified_at, null);
    assert.equal(entry.evidence_ref, null);
  }
});

test('normal frozen-candidate install routes resolve one exact source SHA', () => {
  const commands = frozen.normal_install_commands;
  assert.deepEqual(Object.keys(commands).sort(), ['claude-code', 'codex', 'github-copilot', 'opencode']);

  for (const [host, command] of Object.entries(commands)) {
    assert.match(command, new RegExp(escapeRegExp(frozen.source_sha)), `${host} route is not pinned to the frozen SHA`);
    assert.doesNotMatch(command, /(?:#|--ref\s+)(?:main|master)(?:\s|$)/i, `${host} normal route resolves a moving branch`);
    assert.ok(readme.includes(command), `${host} immutable route missing from README.md`);
    assert.ok(install.includes(command), `${host} immutable route missing from INSTALL.md`);
  }

  const normalDocs = installDocs.map((relative) => read(relative)).join('\n');
  for (const oldRoute of oldUnpinnedRoutes) {
    assert.equal(hasExactLine(normalDocs, oldRoute), false, `unpinned normal route remains documented: ${oldRoute}`);
  }
});

test('active authorities keep P0 before F05 and mark main as non-candidate development', () => {
  const activeTruth = `${readme}\n${install}\n${versioning}\n${readiness}\n${operationalPresence}`;
  assert.match(activeTruth, /unreleased development/i);
  assert.match(activeTruth, /moving `?main`?/i);
  assert.match(activeTruth, /not (?:a )?(?:frozen )?candidate/i);
  assert.match(activeTruth, /P0[^\n]*Truthful Immutable Distribution Identity/i);

  for (const text of [readiness, operationalPresence]) {
    const p0Index = text.indexOf('P0');
    const f05Index = text.indexOf('F05');
    assert.ok(p0Index >= 0, 'P0 missing from maintained authority');
    assert.ok(f05Index >= 0, 'F05 missing from maintained authority');
    assert.ok(p0Index < f05Index, 'F05 appears before the P0 distribution-identity gate');
  }
});

console.log('test_distribution_identity_contract.mjs: ok');
