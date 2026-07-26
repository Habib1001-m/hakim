#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function take(flag, fallback = null) {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  if (index + 1 >= args.length) throw new Error(`${flag} requires a value`);
  return args[index + 1];
}

const streamPath = take('--stream');
const requiredSkill = take('--require-skill');
const maxTaskBookkeepingRaw = take('--max-task-bookkeeping');

if (!streamPath) {
  throw new Error('usage: node scripts/check_post_e1_runtime_trace.mjs --stream <stream.jsonl> [--require-skill hakim:hakim] [--max-task-bookkeeping N]');
}

const maxTaskBookkeeping = maxTaskBookkeepingRaw === null
  ? null
  : Number.parseInt(maxTaskBookkeepingRaw, 10);

if (maxTaskBookkeeping !== null && (!Number.isInteger(maxTaskBookkeeping) || maxTaskBookkeeping < 0)) {
  throw new Error('--max-task-bookkeeping must be a non-negative integer');
}

const MUTATION_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
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

function isBaselineCommand(command) {
  return BASELINE_PATTERNS.some((pattern) => pattern.test(command));
}

function skillName(input) {
  if (!input || typeof input !== 'object') return '';
  return String(input.skill ?? input.name ?? input.command ?? '');
}

const absolute = path.resolve(streamPath);
const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/).filter(Boolean);
const toolUses = [];
const seenToolIds = new Set();
const resultByToolId = new Map();

for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
  let payload;
  try {
    payload = JSON.parse(lines[lineIndex]);
  } catch {
    continue;
  }

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
      });
    }

    if (object.type === 'tool_result' && object.tool_use_id) {
      resultByToolId.set(object.tool_use_id, {
        success: object.is_error !== true,
        line: lineIndex + 1,
      });
    }
  }
}

const toolCounts = {};
for (const event of toolUses) {
  toolCounts[event.name] = (toolCounts[event.name] ?? 0) + 1;
}

const firstMutation = toolUses.find((event) => MUTATION_TOOLS.has(event.name)) ?? null;
const mutationIndex = firstMutation?.index ?? Number.POSITIVE_INFINITY;

const baselineEvents = toolUses.filter((event) => {
  if (event.name !== 'Bash') return false;
  const command = String(event.input?.command ?? '');
  return isBaselineCommand(command);
});

const successfulBaselineEvents = baselineEvents.filter((event) => {
  if (!event.id) return false;
  return resultByToolId.get(event.id)?.success === true;
});

const baselineBeforeFirstMutation = successfulBaselineEvents.some((event) => event.index < mutationIndex);

const matchingSkillEvents = requiredSkill
  ? toolUses.filter((event) => event.name === 'Skill' && skillName(event.input) === requiredSkill)
  : [];
const skillBeforeFirstMutation = requiredSkill
  ? matchingSkillEvents.some((event) => event.index < mutationIndex)
  : null;

const taskBookkeepingTotal = (toolCounts.TaskCreate ?? 0) + (toolCounts.TaskUpdate ?? 0);

const failures = [];
if (firstMutation && !baselineBeforeFirstMutation) {
  failures.push('representative baseline did not complete before first mutation');
}
if (requiredSkill && firstMutation && !skillBeforeFirstMutation) {
  failures.push(`${requiredSkill} was not invoked before first mutation`);
}
if (maxTaskBookkeeping !== null && taskBookkeepingTotal > maxTaskBookkeeping) {
  failures.push(`task bookkeeping ${taskBookkeepingTotal} exceeds maximum ${maxTaskBookkeeping}`);
}

const report = {
  schema_version: 1,
  stream: absolute,
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  tool_calls_total: toolUses.length,
  tool_counts: toolCounts,
  first_mutation_index: firstMutation?.index ?? null,
  first_mutation_tool: firstMutation?.name ?? null,
  baseline_command_count: baselineEvents.length,
  successful_baseline_count: successfulBaselineEvents.length,
  baseline_before_first_mutation: firstMutation ? baselineBeforeFirstMutation : null,
  required_skill: requiredSkill,
  required_skill_calls: matchingSkillEvents.length,
  required_skill_before_first_mutation: requiredSkill && firstMutation ? skillBeforeFirstMutation : null,
  task_bookkeeping_total: taskBookkeepingTotal,
  failures,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = failures.length === 0 ? 0 : 1;
