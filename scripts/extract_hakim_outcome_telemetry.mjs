#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeTerminalText } from './lib/terminal_text.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);

function sha256(text) {
  return crypto.createHash('sha256').update(String(text ?? '')).digest('hex');
}

function valueAfter(args, flag, fallback = null) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function lastMatch(text, regex) {
  const matches = [...String(text ?? '').matchAll(regex)];
  return matches.length ? matches.at(-1) : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePacketPath(value) {
  return String(value ?? '').split(path.sep).join('/');
}

function resolveTranscript(result, packetDir) {
  const explicit = typeof result.transcript_path === 'string'
    ? result.transcript_path.trim()
    : '';
  const candidates = [];
  if (explicit) candidates.push({ relativePath: explicit, source: 'evidence' });
  if (result.id) {
    candidates.push({
      relativePath: path.join('transcripts', `${result.id}.txt`),
      source: 'conventional_case_path',
    });
  }

  for (const candidate of candidates) {
    const absolutePath = path.resolve(packetDir, candidate.relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    return {
      absolutePath,
      relativePath: normalizePacketPath(path.relative(packetDir, absolutePath)),
      source: candidate.source,
    };
  }

  return {
    absolutePath: null,
    relativePath: explicit || null,
    source: null,
  };
}

function parseStructuredSummary(cleanText) {
  const match = cleanText.match(
    /HAKIM_SUMMARY_V1_BEGIN\s*([\s\S]*?)\s*HAKIM_SUMMARY_V1_END/i,
  );
  if (!match) return { status: 'NOT_FOUND', summary: null, error: null };

  try {
    return { status: 'FOUND', summary: JSON.parse(match[1]), error: null };
  } catch (error) {
    return { status: 'INVALID', summary: null, error: error.message };
  }
}

function extractLegacySummary(cleanText) {
  const match = cleanText.match(
    /(?:^|\n)\s*(?:#{1,6}\s*)?Hakim Summary\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:✻|─{6,}|❯\s*\/exit|Token usage:|To continue this session|Resume this session with:)|$)/i,
  );
  return match?.[1]?.trim() || null;
}

function parseReportedSignals(text) {
  const source = String(text ?? '');
  const diffMatch = lastMatch(source, /Smallest safe diff:\s*(.*?)(?:\n|$)/gi);
  const addedMatch = lastMatch(source, /What was added:\s*(.*?)(?:\n|$)/gi);
  const decisionMatch = lastMatch(source, /^\s*hakim:\s*(.*?)(?:\n|$)/gim);
  const rungMatch = lastMatch(source, /\b(?:rung|level)\s*([1-7])\b/gi);

  const rejected = [];
  for (const match of source.matchAll(/Why not ([a-zA-Z0-9_.-]+):/gi)) rejected.push(match[1]);
  for (const match of source.matchAll(/\bno ([a-zA-Z0-9_.-]+) dependency (?:needed|required|added)\b/gi)) rejected.push(match[1]);

  return {
    smallest_safe_diff: diffMatch?.[1]?.trim() || null,
    added_artifacts: addedMatch?.[1]?.trim() || null,
    rejected_dependencies: unique(rejected.map((item) => item.trim())),
    hakim_decision: decisionMatch?.[1]?.trim() || null,
    decision_rung: rungMatch ? Number(rungMatch[1]) : null,
  };
}

function parseChangedPaths(statusText) {
  return unique(
    String(statusText ?? '')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3).replace(/^.* -> /, '').trim())
      .filter(Boolean),
  );
}

function countUnifiedDiff(diffText) {
  let additions = 0;
  let deletions = 0;
  for (const line of String(diffText ?? '').split(/\r?\n/)) {
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+')) additions += 1;
    if (line.startsWith('-')) deletions += 1;
  }
  return { additions, deletions };
}

function buildObjectiveMetrics(result) {
  const after = result.fixture_state_after || null;
  if (!after) {
    return {
      capture_status: 'MISSING_FIXTURE_STATE_AFTER',
      mutation_observed: result.mutation_observed ?? null,
      changed_paths: [],
      diff: { additions: null, deletions: null },
      dependency_manifest_changed: null,
      tests: null,
    };
  }

  const changedPaths = parseChangedPaths(after.status);
  const staged = countUnifiedDiff(after.index_diff);
  const unstaged = countUnifiedDiff(after.worktree_diff);
  const dependencyFiles = new Set([
    'package.json',
    'package-lock.json',
    'npm-shrinkwrap.json',
    'pnpm-lock.yaml',
    'yarn.lock',
  ]);

  return {
    capture_status: 'CAPTURED',
    mutation_observed: result.mutation_observed ?? null,
    changed_paths: changedPaths,
    diff: {
      additions: staged.additions + unstaged.additions,
      deletions: staged.deletions + unstaged.deletions,
    },
    dependency_manifest_changed: changedPaths.some((item) => dependencyFiles.has(item)),
    tests: after.tests
      ? { command: after.tests.command || null, exit_code: after.tests.exit_code }
      : null,
  };
}

export function buildCaseTelemetry(result, packetDir) {
  const resolvedTranscript = resolveTranscript(result, packetDir);

  if (!resolvedTranscript.absolutePath) {
    return {
      case_id: result.id,
      capability: result.capability,
      profile: result.profile,
      verdict: result.verdict,
      objective: buildObjectiveMetrics(result),
      transcript: {
        path: resolvedTranscript.relativePath,
        status: 'MISSING',
        sha256: null,
        clean_sha256: null,
      },
      summary: {
        extraction_status: 'MISSING_TRANSCRIPT',
        extraction_method: null,
        raw_summary_sha256: null,
        structured_error: null,
      },
      reported: parseReportedSignals(''),
    };
  }

  const rawText = fs.readFileSync(resolvedTranscript.absolutePath, 'utf8');
  const cleanText = normalizeTerminalText(rawText);
  const structured = parseStructuredSummary(cleanText);
  const legacySummary = structured.status === 'NOT_FOUND'
    ? extractLegacySummary(cleanText)
    : null;

  let extractionStatus = 'NO_SUMMARY';
  let extractionMethod = 'full_transcript_fallback';
  let summaryText = null;
  let reportedSource = cleanText;

  if (structured.status === 'FOUND') {
    extractionStatus = 'FOUND';
    extractionMethod = 'structured_json_v1';
    summaryText = JSON.stringify(structured.summary);
    reportedSource = summaryText;
  } else if (structured.status === 'INVALID') {
    extractionStatus = 'INVALID_STRUCTURED_SUMMARY';
    extractionMethod = 'structured_json_v1';
  } else if (legacySummary) {
    extractionStatus = 'FOUND';
    extractionMethod = 'legacy_hakim_summary_regex';
    summaryText = legacySummary;
    reportedSource = legacySummary;
  }

  const reported = structured.status === 'FOUND'
    ? {
        smallest_safe_diff: structured.summary.smallest_safe_diff ?? null,
        added_artifacts: structured.summary.added_artifacts ?? null,
        rejected_dependencies: Array.isArray(structured.summary.rejected_dependencies)
          ? unique(structured.summary.rejected_dependencies.map(String))
          : [],
        hakim_decision: structured.summary.hakim_decision ?? null,
        decision_rung: Number.isInteger(structured.summary.decision_rung)
          ? structured.summary.decision_rung
          : null,
      }
    : parseReportedSignals(reportedSource);

  return {
    case_id: result.id,
    capability: result.capability,
    profile: result.profile,
    verdict: result.verdict,
    objective: buildObjectiveMetrics(result),
    transcript: {
      path: resolvedTranscript.relativePath,
      status: 'FOUND',
      sha256: sha256(rawText),
      clean_sha256: sha256(cleanText),
    },
    summary: {
      extraction_status: extractionStatus,
      extraction_method: extractionMethod,
      raw_summary_sha256: summaryText ? sha256(summaryText) : null,
      structured_error: structured.error,
    },
    reported,
  };
}

export function buildPacketTelemetry(evidence, packetDir) {
  return {
    schema_version: 1,
    schema_id: 'hakim-outcome-telemetry-v1',
    authority: {
      objective_source: 'fixture_state_after',
      reported_source: 'agent_transcript',
      verdict_authority: false,
      benchmark_authority: false,
    },
    suite_id: evidence.suite_id || null,
    host: evidence.host || null,
    adapter_id: evidence.adapter_id || null,
    repository_commit: evidence.repository_commit || null,
    hakim_version: evidence.hakim_version || null,
    generated_at: new Date().toISOString(),
    cases: (evidence.cases || []).map((result) => buildCaseTelemetry(result, packetDir)),
  };
}

export function runCli(args = process.argv.slice(2)) {
  const packetArg = valueAfter(args, '--packet');
  if (!packetArg) {
    console.error('usage: node scripts/extract_hakim_outcome_telemetry.mjs --packet <host-packet-directory> [--output <file>]');
    return 2;
  }

  const packetDir = path.resolve(process.cwd(), packetArg);
  const evidencePath = path.join(packetDir, 'evidence.json');
  if (!fs.existsSync(evidencePath)) {
    console.error(`missing evidence file: ${evidencePath}`);
    return 2;
  }

  const outputArg = valueAfter(args, '--output');
  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : path.join(packetDir, 'transcript-telemetry.json');

  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const evidenceBefore = fs.readFileSync(evidencePath);
  const telemetry = buildPacketTelemetry(evidence, packetDir);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(telemetry, null, 2)}\n`);

  const evidenceAfter = fs.readFileSync(evidencePath);
  if (!evidenceBefore.equals(evidenceAfter)) {
    throw new Error('telemetry extraction must not modify evidence.json');
  }

  console.log(JSON.stringify({
    schema_id: telemetry.schema_id,
    host: telemetry.host,
    case_count: telemetry.cases.length,
    summaries_found: telemetry.cases.filter((item) => item.summary.extraction_status === 'FOUND').length,
    output: path.relative(process.cwd(), outputPath),
    verdict_authority: false,
  }, null, 2));
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  process.exitCode = runCli();
}
