'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

(async () => {
  const root = path.resolve(__dirname, '..');
  const loader = await import(path.join(root, 'core/loaders/hakim-loader.mjs'));
  assert.equal(loader.normalizeMode('bad-mode'), 'full');
  assert.equal(loader.normalizeMode('ULTRA'), 'ultra');
  assert.match(loader.getRules('off'), /Hakim disabled/);
  assert.match(loader.getRules('full'), /## The Ladder/);

  const pluginDirs = ['claude-code', 'codex', 'copilot', 'hermes', 'opencode', 'gemini-antigravity'];
  for (const dir of pluginDirs) {
    const readme = path.join(root, 'plugins', dir, 'README.md');
    assert.ok(fs.existsSync(readme), `${dir} skeleton README missing`);
    assert.ok(!fs.existsSync(path.join(root, 'plugins', dir, 'SKILL.md')), `${dir} must not duplicate canonical SKILL.md`);
  }

  const capabilityIds = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
  for (const host of ['codex', 'claude-code']) {
    for (const capabilityId of capabilityIds) {
      const skillPath = path.join(root, 'plugins', host, 'skills', capabilityId, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `${host} ${capabilityId} skill missing`);
      const skillText = fs.readFileSync(skillPath, 'utf8');
      assert.match(skillText, new RegExp(`^name:\\s*${capabilityId}$`, 'm'));
    }
  }

  const expectedVersion = fs.readFileSync(path.join(root, 'core/hakim-skill/VERSION'), 'utf8').trim();
  const codexManifest = JSON.parse(fs.readFileSync(path.join(root, 'plugins/codex/.codex-plugin/plugin.json'), 'utf8'));
  assert.equal(codexManifest.name, 'hakim');
  assert.equal(codexManifest.version, expectedVersion);
  assert.equal(codexManifest.skills, './skills/');
  assert.equal(codexManifest.hooks, './hooks/hooks.json');
  assert.deepEqual(codexManifest.interface.capabilities, ['Interactive', 'Read', 'Write']);
  assert.ok(!(codexManifest.keywords || []).includes('enterprise'));

  const claudeManifest = JSON.parse(fs.readFileSync(path.join(root, 'plugins/claude-code/.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(claudeManifest.name, 'hakim');
  assert.equal(claudeManifest.version, expectedVersion);
  assert.match(claudeManifest.description, /smallest safe diff/i);
  assert.ok(fs.existsSync(path.join(root, '.claude-plugin/marketplace.json')), 'Claude native marketplace missing');
  assert.ok(fs.existsSync(path.join(root, 'plugins/claude-code/hooks/session_start.mjs')), 'Claude SessionStart activation missing');
  assert.ok(fs.existsSync(path.join(root, 'plugins/claude-code/hooks/post_tool_use_diagnostic.mjs')), 'Claude diagnostic handler missing');

  const copilotInstructions = fs.readFileSync(path.join(root, '.github/copilot-instructions.md'), 'utf8');
  for (const capabilityId of capabilityIds) {
    assert.match(copilotInstructions, new RegExp(`\\\`${capabilityId}\\\``), `Copilot ${capabilityId} capability routing missing`);
  }
  assert.match(copilotInstructions, /Do not promise slash-command support on this surface/);

  const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.equal(marketplace.name, 'hakim');
  assert.equal(marketplace.interface.displayName, 'Hakim');
  assert.equal(marketplace.plugins[0].source.path, './plugins/codex');

  const hook = spawnSync(process.execPath, [path.join(root, 'plugins/codex/hooks/session_start.mjs')], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: path.join(root, 'plugins/codex'), HAKIM_DEFAULT_MODE: 'full' },
  });
  assert.equal(hook.status, 0, hook.stderr + hook.stdout);
  assert.match(hook.stdout, /Hakim 1\.0\.0-beta\.1 is active in full mode/);
  assert.match(hook.stdout, /progressively/);
  assert.match(hook.stdout, /\$hakim:hakim-help/);
  assert.doesNotMatch(hook.stdout, /The 7-level ladder/);
  assert.doesNotMatch(hook.stdout, /Technical debt format/);

  console.log('test_plugin_smoke.js: native host plugin smoke ok');
})();
