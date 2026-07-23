'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const hooksPath = path.join(root, 'plugins/claude-code/hooks/hooks.json');
const sessionHandlerPath = path.join(root, 'plugins/claude-code/hooks/session_start.mjs');
const diagnosticHandlerPath = path.join(root, 'plugins/claude-code/hooks/post_tool_use_diagnostic.mjs');

const hooksConfig = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
assert.match(hooksConfig.description, /session activation/i);
assert.deepEqual(Object.keys(hooksConfig.hooks).sort(), ['PostToolUse', 'SessionStart']);

const sessionGroups = hooksConfig.hooks.SessionStart;
assert.equal(sessionGroups.length, 1);
assert.equal(sessionGroups[0].matcher, 'startup|resume|clear');
assert.equal(sessionGroups[0].hooks.length, 1);
const sessionHook = sessionGroups[0].hooks[0];
assert.equal(sessionHook.type, 'command');
assert.equal(sessionHook.command, 'node');
assert.deepEqual(sessionHook.args, ['${CLAUDE_PLUGIN_ROOT}/hooks/session_start.mjs']);
assert.equal(sessionHook.timeout, 5);

const sessionInput = JSON.stringify({
  hook_event_name: 'SessionStart',
  source: 'startup',
  cwd: '/tmp/hakim-project',
});
const session = spawnSync(process.execPath, [sessionHandlerPath], {
  cwd: root,
  input: sessionInput,
  encoding: 'utf8',
});
assert.equal(session.status, 0, session.stderr);
const sessionOutput = JSON.parse(session.stdout);
assert.equal(sessionOutput.hookSpecificOutput.hookEventName, 'SessionStart');
assert.match(sessionOutput.hookSpecificOutput.additionalContext, /Hakim 1\.0\.0-beta\.1 plugin is active/i);
assert.match(sessionOutput.hookSpecificOutput.additionalContext, /\/hakim:full/);
assert.match(sessionOutput.hookSpecificOutput.additionalContext, /permissions/i);
assert.ok(!Object.prototype.hasOwnProperty.call(sessionOutput, 'decision'));
assert.ok(!Object.prototype.hasOwnProperty.call(sessionOutput.hookSpecificOutput, 'permissionDecision'));

const unrelatedSession = spawnSync(process.execPath, [sessionHandlerPath], {
  cwd: root,
  input: JSON.stringify({ hook_event_name: 'PostToolUse' }),
  encoding: 'utf8',
});
assert.equal(unrelatedSession.status, 0, unrelatedSession.stderr);
assert.equal(unrelatedSession.stdout, '');

const groups = hooksConfig.hooks.PostToolUse;
assert.equal(groups.length, 1);
const group = groups[0];
assert.equal(group.matcher, 'Edit|Write');
assert.equal(group.hooks.length, 1);

const hook = group.hooks[0];
assert.equal(hook.type, 'command');
assert.equal(hook.command, 'node');
assert.deepEqual(hook.args, ['${CLAUDE_PLUGIN_ROOT}/hooks/post_tool_use_diagnostic.mjs']);
assert.equal(hook.timeout, 5);
assert.ok(!Object.prototype.hasOwnProperty.call(hook, 'if'));

const input = JSON.stringify({
  hook_event_name: 'PostToolUse',
  tool_name: 'Write',
  tool_input: { file_path: '/tmp/example.txt', content: 'hello' },
  tool_response: { filePath: '/tmp/example.txt', success: true },
});

const disabled = spawnSync(process.execPath, [diagnosticHandlerPath], {
  cwd: root,
  input,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_CLAUDE_DIAGNOSTIC_HOOK: '', HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG: '' },
});
assert.equal(disabled.status, 0, disabled.stderr);
assert.equal(disabled.stdout, '');

const enabled = spawnSync(process.execPath, [diagnosticHandlerPath], {
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
assert.ok(!Object.prototype.hasOwnProperty.call(output, 'systemMessage'));
assert.ok(!Object.prototype.hasOwnProperty.call(output, 'decision'));
assert.ok(!Object.prototype.hasOwnProperty.call(output.hookSpecificOutput, 'updatedToolOutput'));
assert.ok(!Object.prototype.hasOwnProperty.call(output.hookSpecificOutput, 'updatedMCPToolOutput'));

const debug = spawnSync(process.execPath, [diagnosticHandlerPath], {
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
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput, 'decision'));
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput, 'continue'));
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput.hookSpecificOutput, 'updatedToolOutput'));
assert.ok(!Object.prototype.hasOwnProperty.call(debugOutput.hookSpecificOutput, 'updatedMCPToolOutput'));

const readInput = JSON.stringify({
  hook_event_name: 'PostToolUse',
  tool_name: 'Read',
  tool_input: { file_path: '/tmp/example.txt' },
  tool_response: 'hello',
});
const ignored = spawnSync(process.execPath, [diagnosticHandlerPath], {
  cwd: root,
  input: readInput,
  encoding: 'utf8',
  env: { ...process.env, HAKIM_CLAUDE_DIAGNOSTIC_HOOK: '1', HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG: '1' },
});
assert.equal(ignored.status, 0, ignored.stderr);
assert.equal(ignored.stdout, '');

console.log('test_claude_diagnostic_hook.js: native Claude lifecycle hooks ok');
