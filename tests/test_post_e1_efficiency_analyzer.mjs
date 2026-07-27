#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const analyzer = path.join(repoRoot, 'scripts', 'analyze_post_e1_efficiency.mjs');

function runAnalyzer({ streamLines, runtimeTrace, elapsedMs = 5000 }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-post-e1-efficiency-'));
  const streamPath = path.join(root, 'stream.jsonl');
  const runtimePath = path.join(root, 'runtime-trace.json');
  const resultPath = path.join(root, 'RESULT.env');

  fs.writeFileSync(streamPath, `${streamLines.map((value) => JSON.stringify(value)).join('\n')}\n`);
  fs.writeFileSync(runtimePath, `${JSON.stringify(runtimeTrace, null, 2)}\n`);
  fs.writeFileSync(resultPath, `ELAPSED_MS=${elapsedMs}\n`);

  const completed = spawnSync(process.execPath, [
    analyzer,
    '--stream', streamPath,
    '--runtime-trace', runtimePath,
    '--result', resultPath,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return {
    ...completed,
    root,
    report: completed.status === 0 ? JSON.parse(completed.stdout) : null,
  };
}

const timestamped = runAnalyzer({
  streamLines: [
    {
      type: 'system',
      subtype: 'init',
      timestamp: '2026-07-26T00:00:00.000Z',
    },
    {
      type: 'assistant',
      timestamp: '2026-07-26T00:00:00.500Z',
      message: {
        content: [{
          type: 'tool_use',
          id: 'skill-1',
          name: 'Skill',
          input: { skill: 'hakim:hakim' },
        }],
      },
    },
    {
      type: 'user',
      timestamp: '2026-07-26T00:00:00.800Z',
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'skill-1',
          is_error: false,
          content: 'loaded',
        }],
      },
    },
    {
      type: 'assistant',
      timestamp: '2026-07-26T00:00:01.000Z',
      message: {
        content: [{
          type: 'tool_use',
          id: 'bash-1',
          name: 'Bash',
          input: { command: 'npm test' },
        }],
      },
    },
    {
      type: 'user',
      timestamp: '2026-07-26T00:00:02.000Z',
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'bash-1',
          is_error: false,
          content: 'pass',
        }],
      },
    },
    {
      type: 'assistant',
      timestamp: '2026-07-26T00:00:02.500Z',
      message: {
        content: [{
          type: 'tool_use',
          id: 'edit-1',
          name: 'Edit',
          input: { file_path: 'src/example.mjs' },
        }],
      },
    },
    {
      type: 'user',
      timestamp: '2026-07-26T00:00:02.800Z',
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'edit-1',
          is_error: false,
          content: 'edited',
        }],
      },
    },
    {
      type: 'assistant',
      timestamp: '2026-07-26T00:00:04.500Z',
      message: { content: [{ type: 'text', text: 'done' }] },
    },
  ],
  runtimeTrace: {
    schema_version: 1,
    status: 'PASS',
    tool_calls_total: 3,
    tool_counts: { Skill: 1, Bash: 1, Edit: 1 },
    first_mutation_index: 3,
    first_mutation_tool: 'Edit',
    baseline_command_count: 1,
    successful_baseline_count: 1,
    baseline_before_first_mutation: true,
    required_skill: 'hakim:hakim',
    required_skill_calls: 1,
    required_skill_before_first_mutation: true,
    task_bookkeeping_total: 0,
    failures: [],
  },
});

assert.equal(timestamped.status, 0, timestamped.stderr);
assert.equal(timestamped.report.schema_version, 1);
assert.equal(timestamped.report.status, 'OK');
assert.equal(timestamped.report.elapsed_ms, 5000);
assert.equal(timestamped.report.tool_calls_total, 3);
assert.equal(timestamped.report.timestamped_tool_calls, 3);
assert.equal(timestamped.report.first_tool_offset_ms, 500);
assert.equal(timestamped.report.required_skill_use_offset_ms, 500);
assert.equal(timestamped.report.successful_baseline_result_offset_ms, 2000);
assert.equal(timestamped.report.first_mutation_offset_ms, 2500);
assert.equal(timestamped.report.post_mutation_observed_ms, 2000);
assert.equal(timestamped.report.observable_tool_execution_sum_ms, 1600);
assert.equal(timestamped.report.observable_tool_execution_union_ms, 1600);
assert.equal(timestamped.report.elapsed_minus_observable_tool_union_ms, 3400);
assert.equal(timestamped.report.task_bookkeeping_total, 0);
assert.equal(timestamped.report.causal_attribution.tool_execution_explains_residual, false);
assert.match(timestamped.report.limitations.join('\n'), /residual/i);

const missingTimestamps = runAnalyzer({
  streamLines: [
    {
      type: 'assistant',
      message: {
        content: [{
          type: 'tool_use',
          id: 'bash-2',
          name: 'Bash',
          input: { command: 'npm test' },
        }],
      },
    },
    {
      type: 'user',
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'bash-2',
          is_error: false,
          content: 'pass',
        }],
      },
    },
  ],
  runtimeTrace: {
    schema_version: 1,
    status: 'PASS',
    tool_calls_total: 1,
    tool_counts: { Bash: 1 },
    first_mutation_index: null,
    first_mutation_tool: null,
    baseline_command_count: 1,
    successful_baseline_count: 1,
    baseline_before_first_mutation: null,
    required_skill: null,
    required_skill_calls: 0,
    required_skill_before_first_mutation: null,
    task_bookkeeping_total: 0,
    failures: [],
  },
});

assert.equal(missingTimestamps.status, 0, missingTimestamps.stderr);
assert.equal(missingTimestamps.report.status, 'PARTIAL');
assert.equal(missingTimestamps.report.first_tool_offset_ms, null);
assert.equal(missingTimestamps.report.observable_tool_execution_union_ms, null);
assert.match(missingTimestamps.report.limitations.join('\n'), /timestamp/i);

console.log('POST_E1_EFFICIENCY_ANALYZER_CONTRACT=PASS');
