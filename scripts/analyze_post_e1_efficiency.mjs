#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function take(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  if (index + 1 >= args.length) throw new Error(`${flag} requires a value`);
  return args[index + 1];
}

const streamPath = take('--stream');
const runtimeTracePath = take('--runtime-trace');
const resultPath = take('--result');

if (!streamPath || !runtimeTracePath || !resultPath) {
  throw new Error(
    'usage: node scripts/analyze_post_e1_efficiency.mjs --stream <stream.jsonl> --runtime-trace <runtime-trace.json> --result <RESULT.env>',
  );
}

const BASELINE_PATTERNS = [
  /(?:^|\s)npm\s+(?:run\s+)?test(?:\s|$)/i,
  /(?:^|\s)node\s+--test(?:\s|$)/i,
  /(?:^|\s)pytest(?:\s|$)/i,
  /(?:^|\s)python(?:3)?\s+-m\s+pytest(?:\s|$)/i,
  /(?:^|\s)pnpm\s+(?:run\s+)?test(?:\s|$)/i,
  /(?:^|\s)yarn\s+(?:run\s+)?test(?:\s|$)/i,
  /(?:^|\s)npm\s+run\s+(?:build|typecheck|lint)(?:\s|$)/i,
  /(?:^|\s)pnpm\s+(?:run\s+)?(?:build|typecheck|lint)(?:\s|$)/i,
  /(?:^|\s)yarn\s+(?:run\s+)?(?:build|typecheck|lint)(?:\s|$)/i,
];

function* walk(value) {
  if (Array.isArray(value)) {
    for (const item of value) yield* walk(item);
    return;
  }

  if (value && typeof value === 'object') {
    yield value;
    for (const nested of Object.values(value)) yield* walk(nested);
  }
}

function parseTimestamp(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function lineTimestamp(payload) {
  const direct = parseTimestamp(payload?.timestamp);
  if (direct !== null) return direct;

  const message = parseTimestamp(payload?.message?.timestamp);
  if (message !== null) return message;

  for (const object of walk(payload)) {
    const nested = parseTimestamp(object?.timestamp);
    if (nested !== null) return nested;
  }

  return null;
}

function isBaselineCommand(command) {
  return BASELINE_PATTERNS.some((pattern) => pattern.test(command));
}

function skillName(input) {
  if (!input || typeof input !== 'object') return '';
  return String(input.skill ?? input.name ?? input.command ?? '');
}

function readResultEnv(filePath) {
  const values = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const equals = line.indexOf('=');
    if (equals <= 0) continue;
    values[line.slice(0, equals)] = line.slice(equals + 1);
  }
  return values;
}

function finiteInteger(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function offset(timestamp, start) {
  if (timestamp === null || start === null) return null;
  return timestamp - start;
}

function intervalUnionMs(intervals) {
  if (intervals.length === 0) return null;
  const ordered = intervals
    .map(([start, end]) => [Math.min(start, end), Math.max(start, end)])
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let [currentStart, currentEnd] = ordered[0];

  for (let index = 1; index < ordered.length; index += 1) {
    const [nextStart, nextEnd] = ordered[index];
    if (nextStart <= currentEnd) {
      currentEnd = Math.max(currentEnd, nextEnd);
      continue;
    }
    total += currentEnd - currentStart;
    currentStart = nextStart;
    currentEnd = nextEnd;
  }

  return total + (currentEnd - currentStart);
}

function summarizeInput(event) {
  if (event.name === 'Bash') {
    return String(event.input?.command ?? '').replace(/\s+/g, ' ').trim().slice(0, 220);
  }
  if (event.name === 'Skill') return skillName(event.input);
  return String(event.input?.file_path ?? event.input?.path ?? event.input?.pattern ?? '');
}

const absoluteStream = path.resolve(streamPath);
const absoluteRuntime = path.resolve(runtimeTracePath);
const absoluteResult = path.resolve(resultPath);

const runtimeTrace = JSON.parse(fs.readFileSync(absoluteRuntime, 'utf8'));
const resultEnv = readResultEnv(absoluteResult);
const elapsedMs = finiteInteger(resultEnv.ELAPSED_MS);

const lines = fs.readFileSync(absoluteStream, 'utf8').split(/\r?\n/).filter(Boolean);
const toolUses = [];
const resultsById = new Map();
const seenToolIds = new Set();
const observedTimestamps = [];

for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
  let payload;
  try {
    payload = JSON.parse(lines[lineIndex]);
  } catch {
    continue;
  }

  const timestampMs = lineTimestamp(payload);
  if (timestampMs !== null) observedTimestamps.push(timestampMs);

  for (const object of walk(payload)) {
    if (object.type === 'tool_use') {
      const id = object.id ?? null;
      if (id && seenToolIds.has(id)) continue;
      if (id) seenToolIds.add(id);

      toolUses.push({
        index: toolUses.length + 1,
        line: lineIndex + 1,
        id,
        name: String(object.name ?? 'UNKNOWN'),
        input: object.input ?? {},
        timestamp_ms: timestampMs,
      });
    }

    if (object.type === 'tool_result' && object.tool_use_id) {
      if (!resultsById.has(object.tool_use_id)) {
        resultsById.set(object.tool_use_id, {
          line: lineIndex + 1,
          success: object.is_error !== true,
          timestamp_ms: timestampMs,
        });
      }
    }
  }
}

const streamStartMs = observedTimestamps.length > 0 ? Math.min(...observedTimestamps) : null;
const streamEndMs = observedTimestamps.length > 0 ? Math.max(...observedTimestamps) : null;
const streamObservedSpanMs = streamStartMs !== null && streamEndMs !== null
  ? streamEndMs - streamStartMs
  : null;

const firstTool = toolUses[0] ?? null;
const firstMutationIndex = Number.isInteger(runtimeTrace.first_mutation_index)
  ? runtimeTrace.first_mutation_index
  : null;
const firstMutation = firstMutationIndex === null
  ? null
  : toolUses.find((event) => event.index === firstMutationIndex) ?? null;

const requiredSkill = runtimeTrace.required_skill ?? null;
const requiredSkillUse = requiredSkill
  ? toolUses.find((event) => event.name === 'Skill' && skillName(event.input) === requiredSkill) ?? null
  : null;

const baselineUses = toolUses.filter((event) => {
  if (event.name !== 'Bash') return false;
  return isBaselineCommand(String(event.input?.command ?? ''));
});

const successfulBaselineUses = baselineUses.filter((event) => {
  if (!event.id) return false;
  return resultsById.get(event.id)?.success === true;
});

const successfulBaselineBeforeMutation = successfulBaselineUses.filter((event) => {
  if (!firstMutation) return true;
  const result = event.id ? resultsById.get(event.id) : null;
  if (!result) return false;
  return event.index < firstMutation.index && result.line < firstMutation.line;
});

const firstSuccessfulBaseline = successfulBaselineBeforeMutation[0] ?? successfulBaselineUses[0] ?? null;
const firstSuccessfulBaselineResult = firstSuccessfulBaseline?.id
  ? resultsById.get(firstSuccessfulBaseline.id) ?? null
  : null;

const toolIntervals = [];
const toolSequence = toolUses.map((event) => {
  const result = event.id ? resultsById.get(event.id) ?? null : null;
  let durationMs = null;

  if (event.timestamp_ms !== null && result?.timestamp_ms !== null) {
    durationMs = Math.max(0, result.timestamp_ms - event.timestamp_ms);
    toolIntervals.push([event.timestamp_ms, result.timestamp_ms]);
  }

  return {
    index: event.index,
    name: event.name,
    use_offset_ms: offset(event.timestamp_ms, streamStartMs),
    result_offset_ms: offset(result?.timestamp_ms ?? null, streamStartMs),
    observable_duration_ms: durationMs,
    success: result ? result.success : null,
    summary: summarizeInput(event),
  };
});

const observableToolExecutionSumMs = toolSequence.some((event) => event.observable_duration_ms !== null)
  ? toolSequence.reduce((sum, event) => sum + (event.observable_duration_ms ?? 0), 0)
  : null;
const observableToolExecutionUnionMs = intervalUnionMs(toolIntervals);
const elapsedMinusObservableToolUnionMs = elapsedMs !== null && observableToolExecutionUnionMs !== null
  ? elapsedMs - observableToolExecutionUnionMs
  : null;

const firstMutationOffsetMs = offset(firstMutation?.timestamp_ms ?? null, streamStartMs);
const postMutationObservedMs = firstMutation?.timestamp_ms !== null
  && firstMutation?.timestamp_ms !== undefined
  && streamEndMs !== null
  ? streamEndMs - firstMutation.timestamp_ms
  : null;

const limitations = [];
const timestampedToolCalls = toolUses.filter((event) => event.timestamp_ms !== null).length;
const pairedToolIntervals = toolSequence.filter((event) => event.observable_duration_ms !== null).length;

if (streamStartMs === null || streamEndMs === null) {
  limitations.push('stream records do not expose enough parseable timestamps to compute observed timing offsets');
}
if (timestampedToolCalls !== toolUses.length) {
  limitations.push('one or more tool-use records lack a parseable timestamp; timing coverage is partial');
}
if (pairedToolIntervals !== toolUses.length) {
  limitations.push('one or more tool calls lack a timestamped result; observable tool-execution timing is partial');
}
if (elapsedMinusObservableToolUnionMs !== null) {
  limitations.push(
    'elapsed minus observable tool-execution union is residual/unattributed time; this trace alone cannot assign it causally to model reasoning, Hakim/plugin hooks, provider latency, host scheduling, or other runtime work',
  );
}
if (elapsedMs !== null && streamObservedSpanMs !== null && elapsedMs !== streamObservedSpanMs) {
  limitations.push(
    'runner elapsed time and timestamped stream span have different boundaries; their delta is reported descriptively and is not a causal category',
  );
}

const timingComplete = streamStartMs !== null
  && streamEndMs !== null
  && timestampedToolCalls === toolUses.length
  && pairedToolIntervals === toolUses.length;

const report = {
  schema_version: 1,
  status: timingComplete ? 'OK' : 'PARTIAL',
  stream: absoluteStream,
  runtime_trace: absoluteRuntime,
  result: absoluteResult,
  elapsed_ms: elapsedMs,
  stream_observed_span_ms: streamObservedSpanMs,
  elapsed_minus_stream_span_ms: elapsedMs !== null && streamObservedSpanMs !== null
    ? elapsedMs - streamObservedSpanMs
    : null,
  tool_calls_total: toolUses.length,
  timestamped_tool_calls: timestampedToolCalls,
  paired_tool_intervals: pairedToolIntervals,
  first_tool_offset_ms: offset(firstTool?.timestamp_ms ?? null, streamStartMs),
  required_skill: requiredSkill,
  required_skill_use_offset_ms: offset(requiredSkillUse?.timestamp_ms ?? null, streamStartMs),
  successful_baseline_result_offset_ms: offset(firstSuccessfulBaselineResult?.timestamp_ms ?? null, streamStartMs),
  first_mutation_index: firstMutationIndex,
  first_mutation_tool: firstMutation?.name ?? null,
  first_mutation_offset_ms: firstMutationOffsetMs,
  post_mutation_observed_ms: postMutationObservedMs,
  validation_command_count: baselineUses.length,
  successful_validation_count: successfulBaselineUses.length,
  successful_validation_before_first_mutation_count: successfulBaselineBeforeMutation.length,
  task_bookkeeping_total: runtimeTrace.task_bookkeeping_total ?? null,
  observable_tool_execution_sum_ms: observableToolExecutionSumMs,
  observable_tool_execution_union_ms: observableToolExecutionUnionMs,
  elapsed_minus_observable_tool_union_ms: elapsedMinusObservableToolUnionMs,
  causal_attribution: {
    residual_classification: elapsedMinusObservableToolUnionMs === null ? null : 'UNATTRIBUTED',
    tool_execution_explains_residual: false,
    plugin_or_model_latency_demonstrated: false,
  },
  tool_sequence: toolSequence,
  limitations,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
