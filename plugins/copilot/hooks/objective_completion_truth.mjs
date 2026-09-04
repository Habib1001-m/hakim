#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MAX_TRANSCRIPT_BYTES = 16 * 1024 * 1024;
const MAX_REASON_PATHS = 12;
const TRANSCRIPT_VISIBILITY_RETRIES = 8;
const TRANSCRIPT_VISIBILITY_RETRY_MS = 25;
const SLEEP_ARRAY = new Int32Array(new SharedArrayBuffer(4));

const CHECKPOINT_FIELDS = Object.freeze([
  'FINAL_GIT_STATUS',
  'SETUP_ARTIFACTS',
  'UNRELATED_MUTATIONS',
]);

const SETUP_ARTIFACT_PATTERNS = Object.freeze([
  /(^|\/)\.venv(?:\/|$)/i,
  /(^|\/)venv(?:\/|$)/i,
  /(^|\/)[^/]+\.egg-info(?:\/|$)/i,
  /(^|\/)\.pytest_cache(?:\/|$)/i,
  /(^|\/)\.mypy_cache(?:\/|$)/i,
  /(^|\/)\.ruff_cache(?:\/|$)/i,
  /(^|\/)__pycache__(?:\/|$)/i,
  /\.pyc$/i,
]);

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) {
    if (content && typeof content === 'object' && typeof content.text === 'string') return content.text;
    return '';
  }

  return content
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';
      if (typeof item.text === 'string') return item.text;
      if (typeof item.content === 'string') return item.content;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function assistantTextFromObject(value) {
  if (!value || typeof value !== 'object') return '';

  if (value.role === 'assistant') return textFromContent(value.content ?? value.text ?? '');

  if (value.message && typeof value.message === 'object' && value.message.role === 'assistant') {
    return textFromContent(value.message.content ?? value.message.text ?? '');
  }

  if (value.type === 'assistant' || value.type === 'assistant_message') {
    if (value.message && typeof value.message === 'object') {
      return textFromContent(value.message.content ?? value.message.text ?? '');
    }
    return textFromContent(value.content ?? value.text ?? '');
  }

  if (value.type === 'assistant.message' && value.data && typeof value.data === 'object') {
    return textFromContent(value.data.content ?? value.data.text ?? '');
  }

  return '';
}

function* walk(value) {
  if (Array.isArray(value)) {
    for (const item of value) yield* walk(item);
    return;
  }
  if (!value || typeof value !== 'object') return;
  yield value;
  for (const nested of Object.values(value)) yield* walk(nested);
}

export function extractLastAssistantText(transcriptText) {
  const roots = [];
  const trimmed = String(transcriptText ?? '').trim();
  if (!trimmed) return '';

  try {
    roots.push(JSON.parse(trimmed));
  } catch {
    for (const line of trimmed.split(/\r?\n/)) {
      const candidate = line.trim();
      if (!candidate) continue;
      try { roots.push(JSON.parse(candidate)); }
      catch { /* Ignore non-JSON transcript noise. */ }
    }
  }

  let last = '';
  for (const root of roots) {
    for (const object of walk(root)) {
      const text = assistantTextFromObject(object).trim();
      if (text) last = text;
    }
  }
  return last;
}

export function parseStructuredCompletion(text) {
  const fields = {};
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^(?:[-*]\s*)?`?(FINAL_GIT_STATUS|SETUP_ARTIFACTS|UNRELATED_MUTATIONS)`?\s*=\s*(.*?)\s*$/i);
    if (!match) continue;
    const key = match[1].toUpperCase();
    if (!CHECKPOINT_FIELDS.includes(key)) continue;
    fields[key] = match[2].replace(/`+$/g, '').trim();
  }
  return fields;
}

function normalizeClaim(value) {
  return String(value ?? '')
    .trim()
    .replace(/^\((.*)\)$/s, '$1')
    .replace(/^\[(.*)\]$/s, '$1')
    .trim()
    .toUpperCase();
}

export function claimsCleanGitStatus(value) {
  const normalized = normalizeClaim(value);
  return normalized === ''
    || normalized === 'CLEAN'
    || normalized === 'NONE'
    || normalized === 'NO_CHANGES'
    || normalized === 'NO CHANGES'
    || normalized === 'WORKING TREE CLEAN';
}

export function claimsNoSetupArtifacts(value) {
  const normalized = normalizeClaim(value);
  return normalized === 'NONE'
    || normalized === 'NO'
    || normalized === 'NO_ARTIFACTS'
    || normalized === 'NO ARTIFACTS';
}

function statusPath(line) {
  let value = String(line ?? '').slice(3).trim();
  if (!value) return '';
  if (value.includes(' -> ')) value = value.split(' -> ').pop().trim();
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  return value.replace(/\\/g, '/');
}

export function classifySetupArtifactPaths(statusLines) {
  const paths = [];
  for (const line of statusLines ?? []) {
    const candidate = statusPath(line);
    if (!candidate) continue;
    if (SETUP_ARTIFACT_PATTERNS.some((pattern) => pattern.test(candidate))) paths.push(candidate);
  }
  return [...new Set(paths)];
}

export function observeGitStatus(cwd, options = {}) {
  const spawn = options.spawn ?? spawnSync;
  if (!cwd || !path.isAbsolute(cwd)) {
    return { available: false, reason: 'INVALID_CWD', clean: null, lines: [], setup_artifacts: [] };
  }

  const result = spawn('git', ['-C', cwd, 'status', '--porcelain=v1', '--untracked-files=all'], {
    encoding: 'utf8',
    timeout: 2_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    return { available: false, reason: 'GIT_STATUS_UNAVAILABLE', clean: null, lines: [], setup_artifacts: [] };
  }

  const lines = String(result.stdout ?? '').split(/\r?\n/).filter(Boolean);
  return {
    available: true,
    reason: null,
    clean: lines.length === 0,
    lines,
    setup_artifacts: classifySetupArtifactPaths(lines),
  };
}

function allow() {
  return { decision: 'allow' };
}

function buildReason(contradictions, observation) {
  const details = [];
  if (observation.lines.length > 0) {
    const paths = observation.lines.map(statusPath).filter(Boolean).slice(0, MAX_REASON_PATHS);
    if (paths.length > 0) details.push(`Observed changed paths: ${paths.join(', ')}`);
  }

  return [
    'Hakim objective completion truth found an objective contradiction in the structured final checkpoint.',
    ...contradictions.map((item) => `- ${item}`),
    ...details,
    'Re-observe the final repository/setup state and correct only the completion checkpoint/report. Do not undo intended product changes merely to satisfy this hook.',
    'This is the only forced correction turn for this completion attempt.',
  ].join('\n');
}

export function evaluateObjectiveCompletion({ hookInput, finalAssistantText, gitObservation }) {
  if (hookInput?.stop_hook_active === true) return allow();

  const checkpoints = parseStructuredCompletion(finalAssistantText);
  const hasRelevantCheckpoint = Object.keys(checkpoints).length > 0;
  if (!hasRelevantCheckpoint || !gitObservation?.available) return allow();

  const contradictions = [];

  if (Object.hasOwn(checkpoints, 'FINAL_GIT_STATUS')
      && claimsCleanGitStatus(checkpoints.FINAL_GIT_STATUS)
      && gitObservation.clean === false) {
    contradictions.push('FINAL_GIT_STATUS claims a clean tree, but current git status --porcelain is non-empty.');
  }

  if (Object.hasOwn(checkpoints, 'SETUP_ARTIFACTS')
      && claimsNoSetupArtifacts(checkpoints.SETUP_ARTIFACTS)
      && gitObservation.setup_artifacts.length > 0) {
    contradictions.push(`SETUP_ARTIFACTS=NONE, but changed setup-artifact paths are visible: ${gitObservation.setup_artifacts.slice(0, MAX_REASON_PATHS).join(', ')}.`);
  }

  if (contradictions.length === 0) return allow();
  return {
    decision: 'block',
    reason: buildReason(contradictions, gitObservation),
  };
}

function readTranscript(transcriptPath) {
  if (!transcriptPath || !path.isAbsolute(transcriptPath)) return null;
  const stat = fs.statSync(transcriptPath);
  if (!stat.isFile() || stat.size > MAX_TRANSCRIPT_BYTES) return null;
  return fs.readFileSync(transcriptPath, 'utf8');
}

function sleepMs(ms) {
  Atomics.wait(SLEEP_ARRAY, 0, 0, ms);
}

function readVisibleAssistantText(transcriptPath, options = {}) {
  const read = options.readTranscript ?? readTranscript;
  const sleep = options.sleep ?? sleepMs;

  for (let attempt = 0; attempt <= TRANSCRIPT_VISIBILITY_RETRIES; attempt += 1) {
    const transcriptText = read(transcriptPath);
    if (transcriptText === null || transcriptText === undefined) return '';

    const finalAssistantText = extractLastAssistantText(transcriptText);
    if (finalAssistantText) return finalAssistantText;

    if (attempt < TRANSCRIPT_VISIBILITY_RETRIES) sleep(TRANSCRIPT_VISIBILITY_RETRY_MS);
  }

  return '';
}

export function runObjectiveCompletionTruth(hookInput, options = {}) {
  try {
    if (hookInput?.stop_hook_active === true) return allow();

    let finalAssistantText;
    if (options.transcriptText !== null && options.transcriptText !== undefined) {
      finalAssistantText = extractLastAssistantText(options.transcriptText);
    } else {
      finalAssistantText = readVisibleAssistantText(
        hookInput?.transcriptPath ?? hookInput?.transcript_path,
        options,
      );
    }
    if (!finalAssistantText) return allow();

    const gitObservation = options.gitObservation ?? observeGitStatus(hookInput?.cwd, options);
    return evaluateObjectiveCompletion({ hookInput, finalAssistantText, gitObservation });
  } catch {
    // F05 is a bounded truth correction layer, not a session-availability gate.
    // Unknown transcript/git/runtime state fails soft rather than trapping the agent.
    return allow();
  }
}

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    const input = raw ? JSON.parse(raw) : {};
    process.stdout.write(`${JSON.stringify(runObjectiveCompletionTruth(input))}\n`);
  } catch {
    process.stdout.write('{"decision":"allow"}\n');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
