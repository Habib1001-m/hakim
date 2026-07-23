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

  for (const dir of ['claude-code', 'codex', 'copilot', 'hermes', 'opencode', 'gemini-antigravity']) {
    assert.ok(fs.existsSync(path.join(root, 'plugins', dir, 'README.md')), `${dir} README missing`);
    assert.ok(!fs.existsSync(path.join(root, 'plugins', dir, 'SKILL.md')), `${dir} must not duplicate canonical SKILL.md at plugin root`);
  }

  const capabilityIds = ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help'];
  for (const host of ['codex', 'claude-code', 'copilot']) {
    for (const capabilityId of capabilityIds) {
      const skillPath = path.join(root, 'plugins', host, 'skills', capabilityId, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `${host} ${capabilityId} skill missing`);
    }
  }

  assert.ok(fs.existsSync(path.join(root, '.agents/plugins/marketplace.json')), 'Codex marketplace missing');
  assert.ok(fs.existsSync(path.join(root, '.claude-plugin/marketplace.json')), 'Claude marketplace missing');
  assert.ok(fs.existsSync(path.join(root, '.github/plugin/marketplace.json')), 'Copilot marketplace missing');

  const codexHook = spawnSync(process.execPath, [path.join(root, 'plugins/codex/hooks/session_start.mjs')], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: path.join(root, 'plugins/codex'), HAKIM_DEFAULT_MODE: 'full' },
  });
  assert.equal(codexHook.status, 0, codexHook.stderr + codexHook.stdout);
  assert.match(codexHook.stdout, /Hakim 1\.0\.0-beta\.1 is active in full mode/);
  assert.match(codexHook.stdout, /progressively/);
  assert.doesNotMatch(codexHook.stdout, /Technical debt format/);

  const claudeHook = spawnSync(process.execPath, [path.join(root, 'plugins/claude-code/hooks/session_start.mjs')], {
    cwd: root,
    input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }),
    encoding: 'utf8',
  });
  assert.equal(claudeHook.status, 0, claudeHook.stderr + claudeHook.stdout);
  const claudeOutput = JSON.parse(claudeHook.stdout);
  assert.equal(claudeOutput.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(claudeOutput.hookSpecificOutput.additionalContext, /Hakim 1\.0\.0-beta\.1 plugin is active/);

  console.log('test_plugin_smoke.js: executable native host surfaces ok');
})();
