'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const hooksPath = path.join(root, 'plugins/claude-code/hooks/hooks.json');
const handlerPath = path.join(root, 'plugins/claude-code/hooks/post_tool_use_diagnostic.mjs');

const hooksConfig = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
assert.ok(hooksConfig.description.includes('optional non-blocking diagnostics'));
assert.deepEqual(Object.keys(hooksConfig.hooks), ['PostToolUse']);
assert.equal(hooksConfig.hooks.PostToolUse.length, 1);

const group = hooksConfig.hooks.PostToolUse[0];
assert.equal(group.matcher, 'Edit|Write');
assert.equal(group.hooks.length, 1);

const hook = group.hooks[0];
assert.equal(hook.type, 'command');
assert.equal(hook.command, 'node');
assert.deepEqual(hook.args, ['${CLAUDE_PLUGIN_ROOT}/hooks/post_tool_use_diagnostic.mjs']);
assert.equal(hook.timeout, 5);
assert.ok(!Object.prototype.hasOwnProperty.call(hook, 'if'), 'D.2E/D.2G hook must not add extra conditional ambiguity');

const input = JSON.stringify({
  hook_event_name: 'PostToolUse',
  tool_name: 'Write',
  tool_input: { file_path: '/tmp/example.txt', content: 'hello' },
  tool_response: { filePath: '/tmp/example.txt', success: true },
});

const disabled = spawnSync(process.execPath, [handlerPath], {
  cwd: root,
  input,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_CLAUDE_DIAGNOSTIC_HOOK: '', HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG: '' },
});
assert.equal(disabled.status, 0, disabled.stderr);
assert.equal(disabled.stdout, '');

const enabled = spawnSync(process.execPath, [handlerPath], {
  cwd: root,
  input,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_CLAUDE_DIAGNOSTIC_HOOK: '1', HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG: '' },
});
assert.equal(enabled.status, 0, enabled.stderr);
const output = JSON.parse(enabled.stdout);
assert.deepEqual(Object.keys(output), ['hookSpecificOutput']);
assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
assert.match(output.hookSpecificOutput.additionalContext, /smallest safe diff/i);
assert.match(output.hookSpecificOutput.additionalContext, /targeted validation/i);
assert.ok(!Object.prototype.hasOwnProperty.call(output, 'systemMessage'), 'default hook mode must not show a visible system message');
assert.ok(!Object.prototype.hasOwnProperty.call(output, 'decision'), 'D.2E/D.2G hook must not block');
assert.ok(!Object.prototype.hasOwnProperty.call(output.hookSpecificOutput, 'updatedToolOutput'), 'D.2E/D.2G hook must not rewrite tool output');
assert.ok(!Object.prototype.hasOwnProperty.call(output.hookSpecificOutput, 'updatedMCPToolOutput'), 'D.2E/D.2G hook must not rewrite MCP tool output');

const debug = spawnSync(process.execPath, [handlerPath], {
  cwd: root,
  input,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_CLAUDE_DIAGNOSTIC_HOOK: '1', HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG: '1' },
});
assert.equal(debug.status, 0, debug.stderr);
const debugOutput = JSON.parse(debug.stdout);
assert.equal(debugOutput.hookSpecificOutput.hookEventName, 'PostToolUse');
assert.match(debugOutput.hookSpecificOutput.additionalContext, /smallest safe diff/i);
assert.match(debugOutput.systemMessage, /Hakim diagnostic hook observed/i);
assert.match(debugOutput.systemMessage, /Write completed/i);
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput, 'decision'), 'D.2G debug signal must not block');
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput, 'continue'), 'D.2G debug signal must not stop Claude');
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput.hookSpecificOutput, 'updatedToolOutput'), 'D.2G debug signal must not rewrite tool output');
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput.hookSpecificOutput, 'updatedMCPToolOutput'), 'D.2G debug signal must not rewrite MCP tool output');

const readInput = JSON.stringify({
  hook_event_name: 'PostToolUse',
  tool_name: 'Read',
  tool_input: { file_path: '/tmp/example.txt' },
  tool_response: 'hello',
});
const ignored = spawnSync(process.execPath, [handlerPath], {
  cwd: root,
  input: readInput,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_CLAUDE_DIAGNOSTIC_HOOK: '1', HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG: '1' },
});
assert.equal(ignored.status, 0, ignored.stderr);
assert.equal(ignored.stdout, '');

console.log('test_claude_diagnostic_hook.js: ok');
