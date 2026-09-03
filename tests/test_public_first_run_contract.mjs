import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_HOSTS } from '../scripts/hakim_install_plan.mjs';
import { parseTomlScalarTables } from '../scripts/lib/structured_metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasExactLine = (text, value) => text.split(/\r?\n/).some((line) => line.trim() === value);

const packageJson = readJson('package.json');
const pyproject = parseTomlScalarTables(read('pyproject.toml'));
const version = read('core/hakim-skill/VERSION').trim();
const identity = readJson('conformance/distribution-identity.json');
const current = identity.current_development;
const frozen = identity.latest_frozen_candidate;
const frozenAcceptance = readJson(frozen.native_acceptance_projection);
const readme = read('README.md');
const install = read('core/hakim-skill/INSTALL.md');
const supportedHosts = read('SUPPORTED_HOSTS.md');
const architecture = read('docs/ARCHITECTURE.md');
const changelog = read('CHANGELOG.md');
const security = read('SECURITY.md');
const limitations = read('KNOWN_LIMITATIONS.md');
const canonicalSkill = read('core/hakim-skill/SKILL.md');
const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
const copilotMarketplace = readJson('.github/plugin/marketplace.json');

const expectedHosts = ['codex', 'claude-code', 'github-copilot', 'opencode'];
assert.deepEqual(SUPPORTED_HOSTS, expectedHosts);

assert.equal(version, '1.0.0-beta.4.post1');
assert.equal(current.version, version);
assert.equal(current.channel, 'unreleased-development');
assert.equal(current.candidate, false);
assert.equal(current.evidence_eligible, false);
assert.equal(frozen.version, '1.0.0-beta.4');
assert.equal(frozen.source_sha, '5d00039479f2f11b7fe30ccf2385e70ce24553c3');
assert.equal(frozen.transport_reconciliation.status, 'PASS');
assert.equal(frozen.transport_reconciliation.verified_hosts, 4);
assert.equal(frozen.transport_reconciliation.required_hosts, 4);
assert.equal(Object.hasOwn(frozen.transport_reconciliation, 'authority'), false);
assert.equal(identity.next_candidate.version, '1.0.0-beta.5');
assert.equal(identity.next_candidate.status, 'NOT_CUT');

assert.equal(packageJson.version, version);
assert.equal(packageJson.private, true);
assert.equal(packageJson.engines?.node, '>=22');
assert.equal(packageJson.bin['hakim-opencode'], 'scripts/hakim_opencode_cli.mjs');
assert.equal(pyproject.project.version, version);
assert.equal(pyproject['tool.hakim'].release_channel, 'unreleased-development');
assert.match(canonicalSkill, new RegExp(`^version:\\s*${escapeRegExp(version)}$`, 'm'));

assert.equal(frozenAcceptance.product_version, frozen.version);
assert.equal(frozenAcceptance.overall_status, 'PASS');
for (const host of expectedHosts) assert.equal(frozenAcceptance.hosts[host].status, 'PASS');

const claude = claudeMarketplace.plugins.find((item) => item.name === 'hakim');
assert.ok(claude);
assert.equal(claude.version, frozen.version);
assert.equal(claude.source.sha, frozen.source_sha);
assert.equal(claude.source.path, 'plugins/claude-code');

const copilot = copilotMarketplace.plugins.find((item) => item.name === 'hakim');
assert.ok(copilot);
assert.equal(copilot.version, frozen.version);
assert.equal(copilot.source.sha, frozen.source_sha);
assert.equal(copilot.source.path, 'plugins/copilot');

assert.match(readme, /public beta/i);
assert.match(readme, /Free reasoning\. Safe action\. Evidence-bound claims\./);
assert.match(readme, /need\? → reuse existing code\?/);
assert.match(readme, /^## Quick start$/m);
assert.match(readme, new RegExp(escapeRegExp(frozen.version)));
assert.doesNotMatch(readme, /P0|F0[1-9]|operator acceptance|exact-head Public CI/i);

for (const [host, command] of Object.entries(frozen.normal_install_commands)) {
  assert.ok(hasExactLine(readme, command), `${host} command missing from README`);
  assert.ok(hasExactLine(install, command), `${host} command missing from INSTALL`);
}
assert.match(`${readme}\n${install}`, /claude plugin install hakim@hakim/);
assert.match(`${readme}\n${install}`, /copilot plugin install hakim@hakim/);
assert.match(`${readme}\n${install}`, /\/hakim\/hakim (?:full|lite|ultra|off)/);
assert.match(`${readme}\n${install}`, /does not edit `opencode\.json`/i);

const hostHeadings = ['Codex', 'Claude Code', 'GitHub Copilot CLI', 'OpenCode'];
for (const heading of hostHeadings) assert.match(readme, new RegExp(`^### ${escapeRegExp(heading)}$`, 'm'));
for (const heading of ['Codex', 'Claude Code', 'GitHub Copilot', 'OpenCode']) {
  assert.match(install, new RegExp(`^## ${escapeRegExp(heading)}$`, 'm'));
}

assert.match(supportedHosts, /Codex/);
assert.match(supportedHosts, /Claude Code/);
assert.match(supportedHosts, /GitHub Copilot CLI/);
assert.match(supportedHosts, /OpenCode/);
assert.doesNotMatch(supportedHosts, /P0|F0[1-9]|superseded failure|pre-merge/i);

assert.match(architecture, /one canonical decision policy/i);
assert.match(architecture, /sessionStart/);
assert.match(architecture, /subagentStart/);
assert.match(architecture, /userPromptSubmitted/);
assert.match(architecture, /userPromptTransformed/);
assert.match(architecture, /agentStop/);
assert.doesNotMatch(architecture, /P0|F0[1-9]|PR #|Public CI #/i);

assert.match(security, new RegExp(escapeRegExp(frozen.version)));
assert.match(limitations, /public beta/i);
assert.match(changelog, /^## Unreleased\b/m);
for (const prerelease of ['1.0.0-beta.4', '1.0.0-beta.3', '1.0.0-beta.2', '1.0.0-beta.1']) {
  assert.match(changelog, new RegExp(`^## ${escapeRegExp(prerelease)}\\b`, 'm'));
}

const retiredOperationalDocs = [
  'docs/PRODUCT_READINESS.md',
  'docs/OPERATIONAL_PRESENCE.md',
  'docs/P0_HOST_TRANSPORT_RECONCILIATION.md',
  'docs/LIVE_HOST_ACCEPTANCE.md',
  'docs/F05_START_AND_TASK_BOUNDARY.md',
];
for (const relative of retiredOperationalDocs) {
  assert.equal(fs.existsSync(path.join(root, relative)), false, `operational project document returned to public surface: ${relative}`);
}

const otherRetiredSurfaces = [
  'docs/EXTERNAL_BETA_EVALUATION.md',
  '.github/ISSUE_TEMPLATE/public-beta-feedback.yml',
  'docs/agentic-ai-reference-SPEC.md',
  'docs/theoretical-reference',
  'plugins/hermes',
  'plugins/gemini-antigravity',
  'packaging/native-plugin',
];
for (const relative of otherRetiredSurfaces) {
  assert.equal(fs.existsSync(path.join(root, relative)), false, `retired public surface still exists: ${relative}`);
}

const productDocs = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SUPPORTED_HOSTS.md',
  'SECURITY.md',
  'KNOWN_LIMITATIONS.md',
  'VERSIONING.md',
  'SUPPORT.md',
  'docs/ARCHITECTURE.md',
  'core/hakim-skill/AGENTS.md',
  'core/hakim-skill/INSTALL.md',
  'core/hakim-skill/MIGRATION.md',
  'core/hakim-skill/skills/hakim-help/SKILL.md',
  'plugins/README.md',
  'plugins/codex/README.md',
  'plugins/codex/skills/hakim-help/SKILL.md',
  'plugins/claude-code/README.md',
  'plugins/claude-code/skills/hakim-help/SKILL.md',
  'plugins/opencode/README.md',
  'plugins/copilot/README.md',
  'plugins/copilot/skills/hakim-help/SKILL.md',
];
const documentedScripts = new Set();
for (const relative of productDocs) {
  const text = read(relative);
  for (const match of text.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)) documentedScripts.add(match[1]);
}
for (const script of [...documentedScripts].sort()) {
  assert.ok(packageJson.scripts[script], `documented npm script is missing: ${script}`);
}

console.log(`public first-run contract OK: ${expectedHosts.length} hosts, frozen ${frozen.version}, ${documentedScripts.size} documented npm scripts`);
