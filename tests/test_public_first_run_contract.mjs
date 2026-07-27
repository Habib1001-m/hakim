import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_HOSTS } from '../scripts/hakim_install_plan.mjs';
import { parseTomlScalarTables } from '../scripts/lib/structured_metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const packageJson = JSON.parse(read('package.json'));
const pyproject = parseTomlScalarTables(read('pyproject.toml'));
const version = read('core/hakim-skill/VERSION').trim();
const readme = read('README.md');
const install = read('core/hakim-skill/INSTALL.md');
const changelog = read('CHANGELOG.md');
const security = read('SECURITY.md');
const limitations = read('KNOWN_LIMITATIONS.md');
const liveAcceptance = read('docs/LIVE_HOST_ACCEPTANCE.md');
const canonicalSkill = read('core/hakim-skill/SKILL.md');
const nativeAcceptance = JSON.parse(read('conformance/native-host-acceptance.json'));
const beta1Acceptance = JSON.parse(read('conformance/history/native-host-acceptance-1.0.0-beta.1.json'));
const codexManifest = JSON.parse(read('plugins/codex/.codex-plugin/plugin.json'));
const claudeManifest = JSON.parse(read('plugins/claude-code/.claude-plugin/plugin.json'));
const copilotManifest = JSON.parse(read('plugins/copilot/plugin.json'));
const claudeMarketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
const codexMarketplace = JSON.parse(read('.agents/plugins/marketplace.json'));
const copilotMarketplace = JSON.parse(read('.github/plugin/marketplace.json'));

const expectedHosts = ['codex', 'claude-code', 'github-copilot', 'opencode'];
const opencodeBootstrap = 'npx --yes --package=github:Habib1001-m/hakim hakim-opencode install';
assert.deepEqual(SUPPORTED_HOSTS, expectedHosts);

assert.equal(version, '1.0.0-beta.4');
assert.equal(packageJson.version, version);
assert.equal(packageJson.private, true);
assert.equal(packageJson.engines?.node, '>=22');
assert.equal(packageJson.bin['hakim-opencode'], 'scripts/hakim_opencode_cli.mjs');
assert.ok(packageJson.files.includes('plugins/opencode/hakim.mjs'));
assert.ok(packageJson.files.includes('core/hakim-skill/skills'));
assert.ok(packageJson.files.includes('core/hakim-skill/VERSION'));
assert.ok(packageJson.files.includes('scripts/lib/opencode_prior_manifests.mjs'));
assert.equal(pyproject.project.version, version);
assert.equal(pyproject['tool.hakim'].release_channel, 'public-beta');
assert.equal(pyproject['tool.hakim'].product_telemetry, 'NOT_IMPLEMENTED');
assert.equal(pyproject['tool.hakim'].phase, undefined);
assert.equal(pyproject['tool.hakim'].telemetry_default, undefined);

// Current host-acceptance truth is structural. A new prerelease candidate starts
// from NOT_RUN rather than inheriting accepted evidence from a prior version.
assert.equal(nativeAcceptance.product_version, version);
assert.equal(nativeAcceptance.overall_status, 'HOLD_FOR_LIVE_HOST_EVIDENCE');
assert.deepEqual(Object.keys(nativeAcceptance.hosts).sort(), [...expectedHosts].sort());
for (const host of expectedHosts) {
  assert.equal(nativeAcceptance.hosts[host].status, 'NOT_RUN');
  assert.equal(nativeAcceptance.hosts[host].host_version, null);
  assert.equal(nativeAcceptance.hosts[host].verified_at, null);
  assert.equal(nativeAcceptance.hosts[host].evidence_ref, null);
}
assert.equal(beta1Acceptance.product_version, '1.0.0-beta.1');
assert.equal(beta1Acceptance.overall_status, 'PASS');
for (const host of expectedHosts) assert.equal(beta1Acceptance.hosts[host].status, 'PASS');
assert.equal(beta1Acceptance.hosts.opencode.host_version, '1.17.13');
assert.equal(beta1Acceptance.hosts.opencode.verified_at, '2026-07-26');
assert.equal(beta1Acceptance.hosts.opencode.evidence_ref, 'https://github.com/Habib1001-m/hakim/pull/21#issuecomment-5080940335');

assert.equal(packageJson.scripts['build:native-plugin'], undefined);
assert.equal(packageJson.scripts['verify:native-prerelease'], undefined);
assert.equal(packageJson.scripts['accept:host'], 'node scripts/hakim_live_host_acceptance.mjs');
assert.equal(packageJson.scripts['accept:host:json'], 'node scripts/hakim_live_host_acceptance.mjs --json');
assert.equal(codexManifest.version, version);
assert.equal(claudeManifest.version, version);
assert.equal(copilotManifest.version, version);
assert.equal(claudeMarketplace.plugins.find((item) => item.name === 'hakim')?.version, version);
assert.equal(copilotMarketplace.plugins.find((item) => item.name === 'hakim')?.version, version);
assert.equal(codexMarketplace.name, 'hakim');
assert.match(canonicalSkill, new RegExp(`^version:\\s*${escapeRegExp(version)}$`, 'm'));
assert.ok(readme.includes('Hakim `' + version + '` is public beta software'));
assert.match(security, new RegExp(escapeRegExp(version)));
assert.match(limitations, new RegExp(escapeRegExp(version)));
assert.match(changelog, /^## Unreleased$/m);
assert.match(changelog, /^## 1\.0\.0-beta\.1$/m);
assert.match(changelog, /Withdrew the premature External Public-Beta Evaluator Campaign/);
assert.match(changelog, /private-prerelease/);
assert.match(changelog, /accepted real-host evidence for the Git-backed OpenCode/i);

for (const obsolete of [
  'scripts/check_product_state_truth.mjs',
  'scripts/check_transition_state_truth.mjs',
  'scripts/check_runtime_conformance_readiness.mjs',
  'scripts/build_native_plugin_package.mjs',
  'scripts/pack_native_plugin_tarball.mjs',
  'scripts/verify_native_plugin_prerelease.mjs',
  'scripts/run_native_plugin_opencode_smoke.sh',
  'tests/verify_native_plugin_opencode_smoke.mjs',
  'tests/test_native_plugin_tarball.mjs',
  'tests/test_native_plugin_realpath_containment.mjs',
  'tests/test_native_plugin_transactional_lifecycle.mjs',
  'packaging/native-plugin',
  'docs/agentic-ai-reference-SPEC.md',
  'docs/theoretical-reference',
  'plugins/hermes',
  'plugins/gemini-antigravity',
]) {
  assert.equal(fs.existsSync(path.join(root, obsolete)), false, `retired public surface still exists: ${obsolete}`);
}

assert.equal(fs.existsSync(path.join(root, 'docs/EXTERNAL_BETA_EVALUATION.md')), false, 'suspended evaluator guide must not remain active');
assert.equal(fs.existsSync(path.join(root, '.github/ISSUE_TEMPLATE/public-beta-feedback.yml')), false, 'suspended evaluator issue form must not remain active');

assert.match(readme, /^## What changes with Hakim$/m);
assert.match(readme, /need\? → reuse existing code\?/);
assert.match(readme, /^## Quick start$/m);
assert.match(readme, /npm run plan:install -- --host all/);
assert.match(install, /npm run plan:install -- --host all/);
assert.match(`${readme}\n${install}\n${limitations}`, /Codex `0\.131\.0`/);
assert.match(liveAcceptance, /npm run accept:host -- --host codex/);
assert.match(liveAcceptance, /--apply.*intentionally refused/);
assert.match(liveAcceptance, /candidate evidence packet/i);
assert.match(liveAcceptance, /npm install --prefix "\$NPM11_ROOT" --no-save --ignore-scripts --no-audit --no-fund npm@11/);
assert.match(liveAcceptance, /node_modules\/npm\/bin\/npx-cli\.js/);
assert.match(liveAcceptance, /node "\$NPM11_NPX" --yes/);
assert.match(liveAcceptance, /github:Habib1001-m\/hakim#\$SOURCE_SHA/);
assert.match(liveAcceptance, /npm\/cli#6723/);
assert.ok(!liveAcceptance.includes('npx --yes --package=npm@11 npm exec --yes'), 'acceptance docs must not use the nested npm exec wrapper');
assert.match(liveAcceptance, /does not upgrade or replace the system npm/);
assert.match(readme, /^## Product readiness$/m);
assert.match(readme, /External evaluator recruitment remains suspended/i);

const hostSurfaces = new Map([
  ['codex', 'Codex'],
  ['claude-code', 'Claude Code'],
  ['github-copilot', 'GitHub Copilot'],
  ['opencode', 'OpenCode'],
]);
for (const host of expectedHosts) {
  const displayName = hostSurfaces.get(host);
  assert.match(readme, new RegExp(`^### ${escapeRegExp(displayName)}$`, 'm'), `${displayName} missing from README Quick start`);
  assert.match(install, new RegExp(`^## ${escapeRegExp(displayName)}$`, 'm'), `${displayName} missing from INSTALL.md`);
}

const combinedFirstRun = `${readme}\n${install}`;
assert.match(combinedFirstRun, /codex plugin marketplace add Habib1001-m\/hakim/);
assert.match(combinedFirstRun, /hakim@hakim/);
assert.match(combinedFirstRun, /claude plugin marketplace add Habib1001-m\/hakim/);
assert.match(combinedFirstRun, /claude plugin install hakim@hakim/);
assert.match(combinedFirstRun, /\/hakim:full/);
assert.match(combinedFirstRun, /copilot plugin marketplace add Habib1001-m\/hakim/);
assert.match(combinedFirstRun, /copilot plugin install hakim@hakim/);
assert.match(combinedFirstRun, /\/skills list/);
assert.match(combinedFirstRun, /\/agent/);
assert.ok(combinedFirstRun.includes(opencodeBootstrap));
assert.ok(!combinedFirstRun.includes('--package=npm@11'), 'normal OpenCode first-run must not require the npm 11 acceptance wrapper');
assert.match(combinedFirstRun, /Git-backed bootstrap/);
assert.match(combinedFirstRun, /does not edit `opencode\.json`/);

const opencodeReadme = read('plugins/opencode/README.md');
assert.ok(opencodeReadme.includes(opencodeBootstrap));
assert.match(opencodeReadme, /Source-checkout fallback/);
assert.match(opencodeReadme, /^## Evidence boundaries$/m);
assert.match(opencodeReadme, /mode-selection turn itself is intentionally not a repository task/i);
for (const text of [readme, install, opencodeReadme]) {
  assert.ok(!/npm run plan:install[^\n]*-- --target/.test(text), 'plan:install examples must not contain a second npm separator before --target');
}
assert.ok(install.includes('npm run plan:install -- --host opencode --target /path/to/repository'));
assert.ok(opencodeReadme.includes('npm run plan:install -- --host opencode --target /path/to/repository'));

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
  'docs/LIVE_HOST_ACCEPTANCE.md',
  'docs/PRODUCT_READINESS.md',
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
const activeTruthDocs = productDocs.filter((relative) => relative !== 'CHANGELOG.md');

const documentedScripts = new Set();
const stalePublicTokens = [
  'PUBLIC_RELEASE_READINESS=HOLD',
  'RUNTIME_VERDICTS=',
  'OPENCODE_LIVE_RUNTIME_VALIDATION=NOT_PERFORMED',
  'Phase D',
  'hakim-local',
  'DIRECT_PLUGIN_DIR_ONLY',
  'REPOSITORY_INSTRUCTIONS_ONLY',
  'private-prerelease',
  'private pre-release',
  'npx /absolute/path/to/habib-hakim-',
  'build:native-plugin',
  'verify:native-prerelease',
  'OPEN FOR EXTERNAL EVALUATOR SUBMISSIONS',
  'five independent accepted evaluator reports',
  'SUSPENDED_FOR_PRODUCT_REMEDIATION',
];

for (const relative of productDocs) {
  const text = read(relative);
  for (const match of text.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)) documentedScripts.add(match[1]);
}
for (const relative of activeTruthDocs) {
  const text = read(relative);
  for (const token of stalePublicTokens) assert.ok(!text.includes(token), `${relative} contains stale active-product token ${token}`);
}

for (const script of [...documentedScripts].sort()) {
  assert.ok(packageJson.scripts[script], `documented npm script is missing from package.json: ${script}`);
}

console.log(`public first-run contract OK: ${expectedHosts.length} maintained hosts, current acceptance ${nativeAcceptance.overall_status}, ${documentedScripts.size} documented npm scripts, version ${version}`);
