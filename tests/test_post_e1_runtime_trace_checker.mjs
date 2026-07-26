#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKER = path.join(ROOT, 'scripts/check_post_e1_runtime_trace.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-runtime-trace-'));

function writeTrace(name, events) {
  const file = path.join(TMP, `${name}.jsonl`);
  fs.writeFileSync(file, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
  return file;
}

function assistantTool(id, name, input) {
  return {
    type: 'assistant',
    message: {
      content: [{ type: 'tool_use', id, name, input }],
    },
  };
}

function toolResult(id, isError = false) {
  return {
    type: 'user',
    message: {
      content: [{ type: 'tool_result', tool_use_id: id, is_error: isError, content: 'ok' }],
    },
  };
}

function run(trace, extra = []) {
  return spawnSync(process.execPath, [CHECKER, '--stream', trace, ...extra], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

const passing = writeTrace('passing', [
  assistantTool('r1', 'Read', { file_path: 'src/a.js' }),
  toolResult('r1'),
  assistantTool('s1', 'Skill', { skill: 'hakim:hakim' }),
  toolResult('s1'),
  assistantTool('b1', 'Bash', { command: 'node --test tests/a.test.mjs' }),
  toolResult('b1'),
  assistantTool('e1', 'Edit', { file_path: 'src/a.js' }),
  toolResult('e1'),
]);

const passResult = run(passing, ['--require-skill', 'hakim:hakim', '--max-task-bookkeeping', '0']);
assert.equal(passResult.status, 0, passResult.stderr || passResult.stdout);
const passReport = JSON.parse(passResult.stdout);
assert.equal(passReport.status, 'PASS');
assert.equal(passReport.baseline_before_first_mutation, true);
assert.equal(passReport.required_skill_before_first_mutation, true);
assert.equal(passReport.task_bookkeeping_total, 0);

const noBaseline = writeTrace('no-baseline', [
  assistantTool('s1', 'Skill', { skill: 'hakim:hakim' }),
  toolResult('s1'),
  assistantTool('e1', 'Edit', { file_path: 'src/a.js' }),
  toolResult('e1'),
  assistantTool('b1', 'Bash', { command: 'node --test tests/a.test.mjs' }),
  toolResult('b1'),
]);

const noBaselineResult = run(noBaseline, ['--require-skill', 'hakim:hakim']);
assert.notEqual(noBaselineResult.status, 0);
const noBaselineReport = JSON.parse(noBaselineResult.stdout);
assert.equal(noBaselineReport.baseline_before_first_mutation, false);
assert.match(noBaselineReport.failures.join(' '), /baseline did not complete before first mutation/i);

const noSkill = writeTrace('no-skill', [
  assistantTool('b1', 'Bash', { command: 'npm test' }),
  toolResult('b1'),
  assistantTool('e1', 'Edit', { file_path: 'src/a.js' }),
  toolResult('e1'),
]);

const noSkillResult = run(noSkill, ['--require-skill', 'hakim:hakim']);
assert.notEqual(noSkillResult.status, 0);
const noSkillReport = JSON.parse(noSkillResult.stdout);
assert.equal(noSkillReport.baseline_before_first_mutation, true);
assert.equal(noSkillReport.required_skill_before_first_mutation, false);

const bookkeeping = writeTrace('bookkeeping', [
  assistantTool('s1', 'Skill', { skill: 'hakim:hakim' }),
  toolResult('s1'),
  assistantTool('b1', 'Bash', { command: 'node --test tests/a.test.mjs' }),
  toolResult('b1'),
  assistantTool('t1', 'TaskCreate', { subject: 'fix' }),
  toolResult('t1'),
  assistantTool('t2', 'TaskUpdate', { taskId: '1', status: 'in_progress' }),
  toolResult('t2'),
  assistantTool('e1', 'Edit', { file_path: 'src/a.js' }),
  toolResult('e1'),
]);

const bookkeepingResult = run(bookkeeping, ['--require-skill', 'hakim:hakim', '--max-task-bookkeeping', '0']);
assert.notEqual(bookkeepingResult.status, 0);
const bookkeepingReport = JSON.parse(bookkeepingResult.stdout);
assert.equal(bookkeepingReport.task_bookkeeping_total, 2);
assert.match(bookkeepingReport.failures.join(' '), /task bookkeeping 2 exceeds maximum 0/i);

fs.rmSync(TMP, { recursive: true, force: true });
console.log('test_post_e1_runtime_trace_checker.mjs: runtime trace acceptance semantics OK');
