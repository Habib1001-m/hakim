#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));

const version = read('core/hakim-skill/VERSION').trim();
const capabilities = readJson('core/hakim-skill/capabilities.json');
const capabilityIds = capabilities.capabilities.map((item) => item.id);
assert.deepEqual(capabilityIds, ['hakim', 'hakim-review', 'hakim-audit', 'hakim-debt', 'hakim-gain', 'hakim-help']);

for (const manifestPath of [
  'plugins/codex/.codex-plugin/plugin.json',
  'plugins/claude-code/.claude-plugin/plugin.json',
  'plugins/copilot/plugin.json',
]) {
  assert.equal(readJson(manifestPath).version, version, `${manifestPath} version must match canonical VERSION`);
}

for (const capability of capabilities.capabilities) {
  assert.ok(exists(capability.canonical_path), `${capability.id} canonical surface missing`);
  for (const host of ['codex', 'claude-code', 'github-copilot', 'opencode']) {
    assert.ok(exists(capability.hosts[host].path), `${host} ${capability.id} surface missing`);
  }
}

const codexHooks = readJson('plugins/codex/hooks/hooks.json').hooks;
assert.deepEqual(Object.keys(codexHooks), ['SessionStart']);
assert.match(JSON.stringify(codexHooks.SessionStart), /session_start\.mjs/);

const claudeHooks = readJson('plugins/claude-code/hooks/hooks.json').hooks;
assert.deepEqual(Object.keys(claudeHooks), ['SessionStart']);
assert.match(JSON.stringify(claudeHooks.SessionStart), /session_start\.mjs/);

const copilotHooks = readJson('plugins/copilot/hooks/hooks.json').hooks;
assert.deepEqual(
  Object.keys(copilotHooks),
  ['sessionStart', 'subagentStart', 'userPromptSubmitted', 'userPromptTransformed', 'agentStop'],
);
assert.match(JSON.stringify(copilotHooks.sessionStart), /session_start\.mjs/);
assert.match(JSON.stringify(copilotHooks.subagentStart), /session_start\.mjs/);
assert.match(JSON.stringify(copilotHooks.userPromptSubmitted), /mode_tracker\.mjs/);
assert.match(JSON.stringify(copilotHooks.userPromptTransformed), /mode_control\.mjs/);
assert.match(JSON.stringify(copilotHooks.agentStop), /objective_completion_truth\.mjs/);

const codex = spawnSync(process.execPath, [path.join(ROOT, 'plugins/codex/hooks/session_start.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, PLUGIN_ROOT: path.join(ROOT, 'plugins/codex'), HAKIM_DEFAULT_MODE: 'full' },
});
assert.equal(codex.status, 0, codex.stderr || codex.stdout);
assert.match(codex.stdout, /without requiring an explicit Hakim invocation/i);

const claude = spawnSync(process.execPath, [path.join(ROOT, 'plugins/claude-code/hooks/session_start.mjs')], {
  cwd: ROOT,
  input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }),
  encoding: 'utf8',
});
assert.equal(claude.status, 0, claude.stderr || claude.stdout);
assert.match(JSON.parse(claude.stdout).hookSpecificOutput.additionalContext, /without requiring an explicit Hakim invocation/i);

const copilotSession = read('plugins/copilot/hooks/session_start.mjs');
assert.match(copilotSession, /without requiring an explicit Hakim invocation/i);

const opencodePath = path.join(ROOT, 'plugins/opencode/hakim.mjs');
const opencodeModule = await import(`${pathToFileURL(opencodePath).href}?parity=${Date.now()}`);
const opencodeHooks = await opencodeModule.default({});
const opencodeConfig = {};
await opencodeHooks.config(opencodeConfig);
assert.deepEqual(
  capabilityIds.filter((id) => opencodeConfig.command?.[id]),
  capabilityIds,
  'OpenCode must project all canonical capabilities from capabilities.json',
);
assert.match(opencodeHooks['experimental.chat.system.transform'].toString(), /reconcileSystemOutput/);

console.log(`test_host_runtime_contract.mjs: plug-and-play core + six maintained capabilities ok for ${version}`);
