#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installCopilotInstructions } from './hakim_copilot_install.mjs';
import { removeCopilotInstructions } from './hakim_copilot_remove.mjs';
import {
  buildReviewReport,
  parseArgs as parseReviewArgs,
} from './hakim_review_pr.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const FIXTURE_REPOSITORY = 'example/hakim-evaluator-fixture';

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  }).trim();
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function commit(root, files, message) {
  git(root, ['add', '--', ...files]);
  git(root, ['commit', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function requireState(condition, message) {
  if (!condition) throw new Error(message);
}

export function runCleanEvaluatorJourney(options = {}) {
  const hakimRoot = path.resolve(options.hakimRoot || ROOT);
  const suppliedWorkspace = options.workspace ? path.resolve(options.workspace) : null;
  const fixture = suppliedWorkspace || fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-evaluator-'));
  const ownsWorkspace = suppliedWorkspace === null;

  try {
    git(fixture, ['init', '-b', 'main']);
    git(fixture, ['config', 'user.name', 'Hakim Evaluator']);
    git(fixture, ['config', 'user.email', 'hakim-evaluator@example.invalid']);
    git(fixture, ['remote', 'add', 'origin', `https://github.com/${FIXTURE_REPOSITORY}.git`]);

    write(fixture, 'package.json', `${JSON.stringify({
      name: 'hakim-evaluator-fixture',
      version: '1.0.0',
      private: true,
      engines: { node: '>=18' },
    }, null, 2)}\n`);
    write(fixture, 'README.md', '# Hakim Evaluator Fixture\n\nSmall evidence-bound baseline.\n');
    const baseSha = commit(fixture, ['package.json', 'README.md'], 'Create evaluator baseline');
    const initialStatus = git(fixture, ['status', '--porcelain=v1']);
    requireState(initialStatus === '', 'evaluator fixture must start clean');

    const activationPreview = installCopilotInstructions({
      target: fixture,
      apply: false,
      json: true,
      help: false,
    }, hakimRoot);
    requireState(
      activationPreview.status === 'PASS'
        && activationPreview.state === 'READY_TO_CREATE'
        && activationPreview.filesystem_changed === false,
      'Copilot activation dry-run did not reach READY_TO_CREATE without mutation',
    );

    const activation = installCopilotInstructions({
      target: fixture,
      apply: true,
      json: true,
      help: false,
    }, hakimRoot);
    requireState(
      activation.status === 'PASS'
        && activation.state === 'CREATED'
        && activation.write_performed === true
        && activation.source_sha256 === activation.target_sha256_after,
      'Copilot activation did not create an exact canonical instruction file',
    );

    const instructionPath = path.join(fixture, '.github', 'copilot-instructions.md');
    const instructionBytes = fs.readFileSync(instructionPath);
    requireState(
      sha256(instructionBytes) === activation.source_sha256,
      'activated instruction hash does not match the canonical source',
    );

    write(fixture, 'src/feature.js', 'export const evaluatorFixture = true;\n');
    const headSha = commit(fixture, ['src/feature.js'], 'Add one lean evaluator change');
    const statusBeforeReview = git(fixture, ['status', '--porcelain=v1']);

    const reviewOptions = parseReviewArgs([
      '--host', 'github-copilot',
      '--target', fixture,
      '--repository', FIXTURE_REPOSITORY,
      '--pr', '1',
      '--base-sha', baseSha,
      '--head-sha', headSha,
    ]);
    const review = buildReviewReport(reviewOptions, hakimRoot);
    const statusAfterReview = git(fixture, ['status', '--porcelain=v1']);
    requireState(statusBeforeReview === statusAfterReview, 'minimal review changed fixture state');
    requireState(
      review.overall_status === 'PASS'
        && review.review_executed === true
        && review.mutation_performed === false
        && review.merge_blocking === false
        && review.scope.fallback_used === false
        && review.guardian.review.outcome === 'NO_FINDINGS_FROM_ENABLED_RULES'
        && review.guardian.review.findings_count === 0
        && review.guardian.coverage.correctness_review === 'NOT_PERFORMED'
        && review.guardian.coverage.security_review === 'NOT_PERFORMED'
        && review.guardian.coverage.semantic_code_review === 'NOT_PERFORMED',
      'first evaluator review did not complete with bounded clean coverage and explicit non-review fields',
    );

    const removalPreview = removeCopilotInstructions({
      target: fixture,
      apply: false,
      json: true,
      help: false,
    }, hakimRoot);
    requireState(
      removalPreview.status === 'PASS'
        && removalPreview.state === 'READY_TO_REMOVE'
        && removalPreview.target_sha256_before === activation.source_sha256,
      'Copilot removal dry-run did not confirm an exact canonical match',
    );

    const removal = removeCopilotInstructions({
      target: fixture,
      apply: true,
      json: true,
      help: false,
    }, hakimRoot);
    requireState(
      removal.status === 'PASS'
        && removal.state === 'REMOVED'
        && removal.removal_performed === true
        && removal.quarantine_retained === false
        && !fs.existsSync(instructionPath),
      'Copilot exact-match removal did not complete safely',
    );

    const finalStatus = git(fixture, ['status', '--porcelain=v1']);
    requireState(finalStatus === '', 'evaluator fixture retained unexpected Git-visible state');
    requireState(
      fs.existsSync(path.join(fixture, '.github')),
      'removal must preserve the target .github directory',
    );

    const hakimVersion = fs.readFileSync(
      path.join(hakimRoot, 'core', 'hakim-skill', 'VERSION'),
      'utf8',
    ).trim();

    return {
      schema_version: 1,
      task_id: 'W1-T05',
      status: 'PASS',
      evaluator_role: 'INTERNAL_MAINTAINER',
      journey_type: 'CLEAN_ISOLATED_REPOSITORY',
      host_surface: 'GITHUB_COPILOT_REPOSITORY_INSTRUCTIONS',
      hakim_version: hakimVersion,
      evaluation_source: 'APPROVED_SOURCE_CHECKOUT',
      privacy: {
        private_source_included: false,
        raw_prompts_included: false,
        credentials_included: false,
        personal_data_included: false,
        unsanitized_logs_included: false,
      },
      fixture: {
        repository: FIXTURE_REPOSITORY,
        base_sha: baseSha,
        head_sha: headSha,
        initial_git_status_clean: initialStatus === '',
        final_git_status_clean: finalStatus === '',
      },
      activation: {
        result: 'PASS',
        dry_run_state: activationPreview.state,
        apply_state: activation.state,
        source_sha256: activation.source_sha256,
        target_sha256_after: activation.target_sha256_after,
        exact_canonical_match: activation.source_sha256 === activation.target_sha256_after,
        undocumented_manual_steps: [],
      },
      first_review: {
        result: 'NO_FINDINGS_FROM_ENABLED_RULES',
        overall_status: review.overall_status,
        files_inspected: review.guardian.review.files_inspected,
        added_lines_inspected: review.guardian.review.added_lines_inspected,
        findings_count: review.guardian.review.findings_count,
        enabled_rule_ids: review.guardian.coverage.enabled_rule_ids,
        correctness_review: review.guardian.coverage.correctness_review,
        security_review: review.guardian.coverage.security_review,
        semantic_code_review: review.guardian.coverage.semantic_code_review,
        fallback_used: review.scope.fallback_used,
        mutation_performed: review.mutation_performed,
        merge_blocking: review.merge_blocking,
        usefulness: '4_USEFUL_WITH_MINOR_INTERPRETATION',
        false_positive_level: 'NONE_OBSERVED',
      },
      removal: {
        result: 'PASS',
        dry_run_state: removalPreview.state,
        apply_state: removal.state,
        exact_hash_match_before_removal:
          removalPreview.target_sha256_before === activation.source_sha256,
        instruction_present_after: fs.existsSync(instructionPath),
        github_directory_preserved: fs.existsSync(path.join(fixture, '.github')),
        quarantine_retained: removal.quarantine_retained,
      },
      unexpected_mutation: 'EXPECTED_APPROVED_MUTATION_ONLY',
      evaluator_verdict: 'CONTINUE_BETA',
      next_action: 'Proceed to W2-T01 unified guarded development session without changing release or benchmark claims.',
      claim_boundaries: {
        external_evaluator: false,
        live_copilot_agent_behavior_proven: false,
        benchmark_established: false,
        runtime_verdicts_changed: false,
        public_release_readiness: 'HOLD',
      },
    };
  } finally {
    if (ownsWorkspace && !options.keepWorkspace) {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  }
}

function parseCli(args) {
  const options = { output: null, keepWorkspace: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--keep-workspace') options.keepWorkspace = true;
    else if (arg === '--output') {
      if (!args[index + 1]) throw new Error('--output requires a path');
      options.output = args[index + 1];
      index += 1;
    } else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length);
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

function usage() {
  return [
    'Usage:',
    '  npm run evaluate:clean-journey',
    '  npm run evaluate:clean-journey -- --output dist/w1-clean-evaluator-journey.json',
    '',
    'Runs one isolated internal-maintainer lifecycle journey using the existing Copilot',
    'activation, minimal PR review, and exact-match removal commands. No network access,',
    'private source, raw prompts, credentials, telemetry, benchmark, or release promotion',
    'is involved.',
  ].join('\n');
}

function main() {
  try {
    const options = parseCli(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const evidence = runCleanEvaluatorJourney({ keepWorkspace: options.keepWorkspace });
    const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
    if (options.output) {
      const output = path.resolve(options.output);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, serialized, 'utf8');
    }
    process.stdout.write(serialized);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main();
