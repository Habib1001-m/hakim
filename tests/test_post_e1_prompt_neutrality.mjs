#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const prompts = [
  'experiments/post-e1/e2/TASK_PROMPT.txt',
  'experiments/post-e1/e3/TASK_PROMPT.txt',
  'experiments/post-e1/e4/TASK_PROMPT.txt',
];

const treatmentDoctrine = [
  ['Hakim identity', /\bhakim\b/i],
  ['smallest-change doctrine', /smallest\s+(?:sufficient|safe|coherent)/i],
  ['reuse-first doctrine', /\breuse\b|reusable\s+code|reuse-first/i],
  ['dependency-restraint doctrine', /do not add\s+(?:new\s+)?dependenc|dependencies,\s*frameworks|frameworks,\s*services/i],
  ['scope-restraint doctrine', /unrelated\s+cleanup|broad\s+repository\s+restructuring/i],
  ['evidence-sufficiency doctrine', /stop\s+inspecting|evidence\s+sufficiency/i],
  ['domain-guard doctrine', /domain[- ]guard|preserve\s+existing\s+validation/i],
];

for (const relative of prompts) {
  const full = path.join(ROOT, relative);
  assert.ok(fs.statSync(full).isFile(), `missing POST-E1 task prompt: ${relative}`);
  const text = fs.readFileSync(full, 'utf8');

  for (const [label, pattern] of treatmentDoctrine) {
    assert.doesNotMatch(
      text,
      pattern,
      `${relative} leaks treatment doctrine into the Control task via ${label}`,
    );
  }

  assert.match(
    text,
    /run the relevant repository validation before reporting completion/i,
    `${relative} must retain task-level completion validation`,
  );
}

console.log('test_post_e1_prompt_neutrality.mjs: Control prompts describe outcomes without leaking Hakim treatment doctrine');
