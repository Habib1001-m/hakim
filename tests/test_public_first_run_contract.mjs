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
const externalBeta = read('docs/EXTERNAL_BETA_EVALUATION.md');
const feedbackForm = read('.github/ISSUE_TEMPLATE/public-beta-feedback.yml');
const canonicalSkill = read('core/hakim-skill/SKILL.md');
const nativeAcceptance = JSON.parse(read('conformance/native-host-acceptance.json'));
const codexManifest = JSON.parse(read('plugins/codex/.codex-plugin/plugin.json'));
const claudeManifest = JSON.parse(read('plugins/claude-code/.claude-plugin/plugin.json'));
const copilotManifest = JSON.parse(read('plugins/copilot/plugin.json'));
const claudeMarketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
const codexMarketplace = JSON.parse(read('.agents/plugins/marketplace.json'));
const copilotMarketplace = JSON.parse(read('.github/plugin/marketplace.json'));

const expectedHosts = ['codex', 'claude-code', 'github-copilot', 'opencode'];
assert.deepEqual(SUPPORTED_HOSTS, expectedHosts);

assert.equal(version, '1.0.0-beta.1');
assert.equal(packageJson.version, version);
assert.equal(packageJson.private, true);
assert.equal(pyproject.project.version, version);
assert.equal(pyproject['tool.hakim'].release_channel, 'public-beta');
assert.equal(pyproject['tool.hakim'].product_telemetry, 'NOT_IMPLEMENTED');
assert.equal(pyproject['tool.hakim'].phase, undefined);
assert.equal(pyproject['tool.hakim'].telemetry_default, undefined);
assert.equal(nativeAcceptance.product_version, version);
assert.equal(nativeAcceptance.overall_status, 'PASS');
assert.deepEqual(Object.keys(nativeAcceptance.hosts).sort(), [...expectedHosts].sort());
for (const host of expectedHosts) assert.equal(nativeAcceptance.hosts[host].status, 'PASS');
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
assert.match(changelog, new RegExp(`^## ${escapeRegExp(version)}$`, 'm'));

for (const obsolete of [
  'scripts/check_product_state_truth.mjs',
  'scripts/check_transition_state_truth.mjs',
  'scripts/check_runtime_conformance_readiness.mjs',
]) {
  assert.equal(fs.existsSync(path.join(root, obsolete)), false, `obsolete public state checker still exists: ${obsolete}`);
}

assert.match(readme, /^## Quick start$/m);
assert.match(readme, /npm run plan:install -- --host all/);
assert.match(install, /npm run plan:install -- --host all/);
assert.match(`${readme}\n${install}\n${limitations}`, /Codex `0\.131\.0`/);
assert.match(liveAcceptance, /npm run accept:host -- --host codex/);
assert.match(liveAcceptance, /--apply.*intentionally refused/);
assert.match(liveAcceptance, /candidate evidence packet/i);
assert.match(readme, /^## External public-beta evaluation$/m);
assert.match(readme, /docs\/EXTERNAL_BETA_EVALUATION\.md/);
assert.match(externalBeta, /five independent accepted evaluator reports/i);
assert.match(externalBeta, /CONTINUE_BETA/);
assert.match(externalBeta, /REMEDIATE/);
assert.match(externalBeta, /HOLD/);
assert.match(feedbackForm, /^name: Hakim public-beta feedback$/m);
assert.match(feedbackForm, /I was not part of Hakim's maintainer live-host acceptance run\./);
assert.match(feedbackForm, /real repository task rather than reviewing documentation only/);
assert.match(feedbackForm, /credentials, secrets, private prompts, customer data, proprietary source code, or private governance material/);
for (const displayName of ['Codex', 'Claude Code', 'GitHub Copilot CLI', 'OpenCode']) {
  assert.match(feedbackForm, new RegExp(`^\\s*- ${escapeRegExp(displayName)}$`, 'm'), `${displayName} missing from public-beta feedback form`);
}

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
assert.match(combinedFirstRun, /npm run install:opencode -- --target \/path\/to\/project --apply/);

const opencodeReadme = read('plugins/opencode/README.md');
for (const text of [readme, install, opencodeReadme]) {
  assert.ok(!/npm run plan:install[^\n]*-- --target/.test(text), 'plan:install examples must not contain a second npm separator before --target');
}
assert.ok(install.includes('npm run plan:install -- --host opencode --target /path/to/project'));
assert.ok(opencodeReadme.includes('npm run plan:install -- --host opencode --target /path/to/repository'));

const productDocs = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SUPPORTED_HOSTS.md',
  'SECURITY.md',
  'KNOWN_LIMITATIONS.md',
  'VERSIONING.md',
  'docs/LIVE_HOST_ACCEPTANCE.md',
  'docs/EXTERNAL_BETA_EVALUATION.md',
  'core/hakim-skill/INSTALL.md',
  'core/hakim-skill/MIGRATION.md',
  'plugins/README.md',
  'plugins/codex/README.md',
  'plugins/claude-code/README.md',
  'plugins/opencode/README.md',
  'plugins/copilot/README.md',
  'plugins/hermes/README.md',
  'plugins/gemini-antigravity/README.md',
];

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
];

for (const relative of productDocs) {
  const text = read(relative);
  for (const match of text.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)) documentedScripts.add(match[1]);
  for (const token of stalePublicTokens) assert.ok(!text.includes(token), `${relative} contains stale public token ${token}`);
}

for (const script of [...documentedScripts].sort()) {
  assert.ok(packageJson.scripts[script], `documented npm script is missing from package.json: ${script}`);
}

console.log(`public first-run contract OK: ${expectedHosts.length} native/product hosts, ${documentedScripts.size} documented npm scripts, version ${version}`);