'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const scriptPath = path.join(repoRoot, 'scripts', 'extract_hakim_outcome_telemetry.mjs');
  const { buildCaseTelemetry, buildPacketTelemetry } = await import(pathToFileURL(scriptPath).href);

  const rootSchemaPath = path.join(repoRoot, 'conformance', 'outcome-telemetry.schema.json');
  const packagedSchemaPath = path.join(repoRoot, 'core', 'hakim-skill', 'conformance', 'outcome-telemetry.schema.json');
  assert.ok(fs.existsSync(rootSchemaPath));
  assert.strictEqual(fs.readFileSync(packagedSchemaPath, 'utf8'), fs.readFileSync(rootSchemaPath, 'utf8'));
  const telemetrySchema = JSON.parse(fs.readFileSync(rootSchemaPath, 'utf8'));
  assert.strictEqual(telemetrySchema.schema_id, 'hakim-outcome-telemetry-v1');
  assert.strictEqual(telemetrySchema.authority.verdict_authority, false);
  assert.strictEqual(telemetrySchema.authority.benchmark_authority, false);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-telemetry-'));
  const packetDir = path.join(tempRoot, 'packet');
  const transcriptDir = path.join(packetDir, 'transcripts');
  fs.mkdirSync(transcriptDir, { recursive: true });

  fs.writeFileSync(path.join(transcriptDir, 'HC-001.txt'), [
    '\u001b]10;rgb:0000/0000/0000\u001b\\',
    'HAKIM_SUMMARY_V1_BEGIN',
    JSON.stringify({
      decision_rung: 3,
      smallest_safe_diff: 'Use one native Set expression.',
      added_artifacts: 'No new files or dependencies.',
      rejected_dependencies: ['lodash'],
      hakim_decision: 'Native Set safely satisfies the request.',
    }),
    'HAKIM_SUMMARY_V1_END',
  ].join('\n'));

  fs.writeFileSync(path.join(transcriptDir, 'HC-002.txt'), [
    '\u001b[32mHakim Summary\u001b[0m',
    'Smallest safe diff: One delegation line.',
    'What was added: Zero dependencies. Zero new files.',
    'Why not lodash: The native platform is sufficient.',
    'hakim: existing behavior is the complete answer.',
    '────────────────────────────────────────',
  ].join('\n'));

  fs.writeFileSync(path.join(transcriptDir, 'HC-003.txt'), [
    'Hakim — HC-003: Disabled Profile',
    'Hakim prescriptive guidance and evaluation are NOT active for this request.',
    'No files are modified.',
    'No smallest-safe-diff evaluation is claimed.',
  ].join('\n'));

  const evidence = {
    schema_version: 2,
    suite_id: 'hakim-cross-adapter-conformance-v1',
    host: 'claude-code',
    adapter_id: 'claude-code-plugin',
    repository_commit: 'a'.repeat(40),
    hakim_version: '1.0.0',
    cases: [
      {
        id: 'HC-001', capability: 'hakim', profile: 'balanced-full', verdict: 'PASS',
        transcript_path: 'transcripts/HC-001.txt', mutation_observed: true,
        fixture_state_after: {
          status: ' M src/cli.js', index_diff: '',
          worktree_diff: '--- a/src/cli.js\n+++ b/src/cli.js\n-old\n+new',
          tests: { command: 'npm test', exit_code: 0 },
        },
      },
      {
        id: 'HC-002', capability: 'hakim', profile: 'ultra-minimal', verdict: 'PASS',
        transcript_path: 'transcripts/HC-002.txt', mutation_observed: true,
        fixture_state_after: {
          status: ' M src/unique.js', index_diff: '',
          worktree_diff: '--- a/src/unique.js\n+++ b/src/unique.js\n-old\n+new',
          tests: { command: 'npm test', exit_code: 0 },
        },
      },
      {
        id: 'HC-003', capability: 'hakim', profile: 'disabled', verdict: 'NOT_RUN',
        transcript_path: '', mutation_observed: false,
        fixture_state_after: { status: '', index_diff: '', worktree_diff: '', tests: null },
      },
      {
        id: 'HC-004', capability: 'hakim', profile: 'disabled', verdict: 'NOT_RUN',
        transcript_path: '', mutation_observed: false, fixture_state_after: null,
      },
    ],
  };

  const evidencePath = path.join(packetDir, 'evidence.json');
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  const evidenceHashBefore = crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex');

  const structured = buildCaseTelemetry(evidence.cases[0], packetDir);
  assert.strictEqual(structured.summary.extraction_method, 'structured_json_v1');
  assert.strictEqual(structured.reported.decision_rung, 3);
  assert.deepStrictEqual(structured.objective.changed_paths, ['src/cli.js']);

  const legacy = buildCaseTelemetry(evidence.cases[1], packetDir);
  assert.strictEqual(legacy.summary.extraction_method, 'legacy_hakim_summary_regex');
  assert.deepStrictEqual(legacy.reported.rejected_dependencies, ['lodash']);

  const conventional = buildCaseTelemetry(evidence.cases[2], packetDir);
  assert.strictEqual(conventional.transcript.status, 'FOUND');
  assert.strictEqual(conventional.transcript.path, 'transcripts/HC-003.txt');
  assert.strictEqual(conventional.summary.extraction_method, 'full_transcript_fallback');
  assert.strictEqual(conventional.summary.extraction_status, 'NO_SUMMARY');
  assert.strictEqual(conventional.objective.mutation_observed, false);

  const missing = buildCaseTelemetry(evidence.cases[3], packetDir);
  assert.strictEqual(missing.summary.extraction_status, 'MISSING_TRANSCRIPT');

  const packet = buildPacketTelemetry(evidence, packetDir);
  assert.strictEqual(packet.authority.verdict_authority, false);
  assert.strictEqual(packet.authority.benchmark_authority, false);
  assert.strictEqual(packet.cases.length, 4);

  const run = spawnSync(process.execPath, [scriptPath, '--packet', packetDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(run.status, 0, run.stderr || run.stdout);
  const output = JSON.parse(fs.readFileSync(path.join(packetDir, 'transcript-telemetry.json'), 'utf8'));
  assert.strictEqual(output.cases[2].transcript.status, 'FOUND');
  assert.strictEqual(output.cases[3].summary.extraction_status, 'MISSING_TRANSCRIPT');

  const evidenceHashAfter = crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex');
  assert.strictEqual(evidenceHashAfter, evidenceHashBefore, 'telemetry extraction must not modify evidence.json');

  fs.rmSync(tempRoot, { recursive: true, force: true });
  console.log('structured Hakim outcome telemetry extraction ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
