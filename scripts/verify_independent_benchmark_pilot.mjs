#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const PILOT = path.join(ROOT, 'benchmarks', 'w2-pilot');
const SOURCE_FILES = ['index.js', 'index.d.ts', 'license'];
const ALLOWED_CHANGED_FILES = new Set(['index.js', 'index.d.ts']);

function sha256(value) {
	return crypto.createHash('sha256').update(value).digest('hex');
}

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
	}
	return value;
}

function canonicalJson(value) {
	return JSON.stringify(canonical(value));
}

export function applyOperations(source, operations) {
	const files = {...source};
	const changed = new Set();
	for (const operation of operations) {
		if (!ALLOWED_CHANGED_FILES.has(operation.path)) {
			throw new Error(`operation changes disallowed file: ${operation.path}`);
		}
		if (typeof operation.search !== 'string' || operation.search.length === 0) {
			throw new Error(`operation search must be non-empty: ${operation.path}`);
		}
		if (typeof operation.replace !== 'string') {
			throw new Error(`operation replacement must be text: ${operation.path}`);
		}
		const current = files[operation.path];
		const first = current.indexOf(operation.search);
		if (first < 0) throw new Error(`operation search not found: ${operation.path}`);
		if (current.indexOf(operation.search, first + operation.search.length) >= 0) {
			throw new Error(`operation search is ambiguous: ${operation.path}`);
		}
		files[operation.path] = current.slice(0, first) + operation.replace + current.slice(first + operation.search.length);
		changed.add(operation.path);
	}
	return {files, changed: [...changed].sort()};
}

export function lineDiffMetrics(before, after) {
	const left = before.split('\n');
	const right = after.split('\n');
	const rows = Array.from({length: left.length + 1}, () => new Uint16Array(right.length + 1));
	for (let i = left.length - 1; i >= 0; i -= 1) {
		for (let j = right.length - 1; j >= 0; j -= 1) {
			rows[i][j] = left[i] === right[j]
				? rows[i + 1][j + 1] + 1
				: Math.max(rows[i + 1][j], rows[i][j + 1]);
		}
	}
	const common = rows[0][0];
	return {added: right.length - common, removed: left.length - common};
}

function sourceSnapshot(pilotRoot) {
	return Object.fromEntries(SOURCE_FILES.map(file => [
		file,
		fs.readFileSync(path.join(pilotRoot, 'source', file), 'utf8'),
	]));
}

function verifySource(manifest, source) {
	const checks = {};
	for (const file of SOURCE_FILES) {
		const actual = sha256(source[file]);
		const expected = manifest.source.snapshot_files[file]?.sha256;
		checks[file] = {expected_sha256: expected, actual_sha256: actual, status: actual === expected ? 'PASS' : 'FAIL'};
	}
	return checks;
}

async function loadQueue(workspace) {
	const moduleUrl = `${pathToFileURL(path.join(workspace, 'index.js')).href}?v=${crypto.randomUUID()}`;
	return (await import(moduleUrl)).default;
}

function assertTypeDeclaration(taskId, declaration) {
	const expected = {
		T1_ENQUEUE_ALL: 'enqueueAll(values: Iterable<ValueType>): void;',
		T2_DEQUEUE_MANY: 'dequeueMany(count: number): ValueType[];',
		T3_TO_ARRAY: 'toArray(): ValueType[];',
	}[taskId];
	assert.ok(declaration.includes(expected), `missing declaration: ${expected}`);
}

export async function runTaskAssertions(taskId, Queue, declaration) {
	assertTypeDeclaration(taskId, declaration);
	if (taskId === 'T1_ENQUEUE_ALL') {
		const queue = new Queue();
		queue.enqueueAll(new Set([1, undefined, 3]));
		assert.deepEqual([...queue], [1, undefined, 3]);
		assert.equal(queue.size, 3);
		assert.equal(queue.enqueueAll([]), undefined);
		queue.enqueue(4);
		assert.deepEqual([...queue], [1, undefined, 3, 4]);
		return 5;
	}
	if (taskId === 'T2_DEQUEUE_MANY') {
		const queue = new Queue();
		queue.enqueue(1);
		queue.enqueue(undefined);
		queue.enqueue(3);
		assert.deepEqual(queue.dequeueMany(2), [1, undefined]);
		assert.equal(queue.size, 1);
		assert.deepEqual(queue.dequeueMany(5), [3]);
		assert.equal(queue.size, 0);
		assert.throws(() => queue.dequeueMany(-1), TypeError);
		assert.throws(() => queue.dequeueMany(1.5), TypeError);
		return 6;
	}
	if (taskId === 'T3_TO_ARRAY') {
		const queue = new Queue();
		queue.enqueue(1);
		queue.enqueue(undefined);
		queue.enqueue(3);
		const snapshot = queue.toArray();
		assert.deepEqual(snapshot, [1, undefined, 3]);
		assert.deepEqual([...queue], [1, undefined, 3]);
		assert.equal(queue.size, 3);
		snapshot.push(4);
		assert.deepEqual([...queue], [1, undefined, 3]);
		return 5;
	}
	throw new Error(`unknown task: ${taskId}`);
}

async function verifyCandidate(taskId, candidate, source) {
	let materialized;
	try {
		materialized = applyOperations(source, candidate.operations);
	} catch (error) {
		return {run_id: candidate.run_id, surface: candidate.surface, status: 'FAIL', diagnostics: [error.message]};
	}
	const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-benchmark-'));
	try {
		for (const [file, content] of Object.entries(materialized.files)) {
			fs.writeFileSync(path.join(workspace, file), content, 'utf8');
		}
		fs.writeFileSync(path.join(workspace, 'package.json'), '{"type":"module"}\n', 'utf8');
		let assertionCount = 0;
		let diagnostics = [];
		try {
			const Queue = await loadQueue(workspace);
			assertionCount = await runTaskAssertions(taskId, Queue, materialized.files['index.d.ts']);
		} catch (error) {
			diagnostics = [error.message];
		}
		const metrics = {files_changed: materialized.changed.length, added_lines: 0, removed_lines: 0};
		for (const file of materialized.changed) {
			const diff = lineDiffMetrics(source[file], materialized.files[file]);
			metrics.added_lines += diff.added;
			metrics.removed_lines += diff.removed;
		}
		return {
			run_id: candidate.run_id,
			surface: candidate.surface,
			status: diagnostics.length === 0 ? 'PASS' : 'FAIL',
			assertions_passed: diagnostics.length === 0 ? assertionCount : 0,
			diagnostics,
			changed_files: materialized.changed,
			metrics,
			candidate_sha256: sha256(canonicalJson({taskId, operations: candidate.operations})),
		};
	} finally {
		fs.rmSync(workspace, {recursive: true, force: true});
	}
}

function aggregate(results, surface) {
	const selected = results.filter(result => result.surface === surface);
	return {
		correct_runs: selected.filter(result => result.status === 'PASS').length,
		total_runs: selected.length,
		files_changed: selected.reduce((sum, result) => sum + (result.metrics?.files_changed || 0), 0),
		added_lines: selected.reduce((sum, result) => sum + (result.metrics?.added_lines || 0), 0),
		removed_lines: selected.reduce((sum, result) => sum + (result.metrics?.removed_lines || 0), 0),
	};
}

export async function verifyPilot(pilotRoot = PILOT) {
	const manifestPath = path.join(pilotRoot, 'manifest.json');
	const runsPath = path.join(pilotRoot, 'runs.json');
	const manifestText = fs.readFileSync(manifestPath, 'utf8');
	const runsText = fs.readFileSync(runsPath, 'utf8');
	const manifest = JSON.parse(manifestText);
	const runs = JSON.parse(runsText);
	const source = sourceSnapshot(pilotRoot);
	const sourceChecks = verifySource(manifest, source);
	const sourcePass = Object.values(sourceChecks).every(check => check.status === 'PASS');
	const acceptedRuns = [];
	for (const task of runs.tasks) {
		for (const candidate of task.candidates) {
			acceptedRuns.push({task_id: task.id, ...(await verifyCandidate(task.id, candidate, source))});
		}
	}
	const failedRuns = [];
	for (const candidate of runs.failed_runs) {
		failedRuns.push({
			task_id: candidate.task_id,
			expected_status: candidate.expected_status,
			excluded_from_pair_scoring: candidate.excluded_from_pair_scoring,
			...(await verifyCandidate(candidate.task_id, candidate, source)),
		});
	}
	const baseline = aggregate(acceptedRuns, 'BASELINE_WITHOUT_HAKIM_POLICY');
	const hakim = aggregate(acceptedRuns, 'HAKIM_POLICY_APPLIED');
	const allAcceptedPass = acceptedRuns.length === 6 && acceptedRuns.every(run => run.status === 'PASS');
	const retainedFailurePass = failedRuns.length === 1
		&& failedRuns.every(run => run.status === 'FAIL' && run.expected_status === 'FAIL' && run.excluded_from_pair_scoring === true);
	const level2 = sourcePass
		&& runs.tasks.length === 3
		&& allAcceptedPass
		&& retainedFailurePass
		&& manifest.execution.network_required_for_verification === false;
	const evidence = {
		schema_version: 1,
		task_id: 'W2-T02',
		benchmark_id: manifest.benchmark_id,
		status: level2 ? 'PASS' : 'FAIL',
		reproducibility_level: level2 ? 2 : 1,
		execution_mode: manifest.execution.mode,
		source: {
			repository: manifest.source.repository,
			commit: manifest.source.commit,
			release: manifest.source.release,
			license: manifest.source.license,
			checks: sourceChecks,
		},
		input_checksums: {
			manifest_sha256: sha256(manifestText),
			runs_sha256: sha256(runsText),
			snapshot_sha256: sha256(SOURCE_FILES.map(file => `${file}\0${source[file]}`).join('\0')),
		},
		accepted_runs: acceptedRuns,
		failed_runs: failedRuns,
		aggregate: {
			correctness_first: true,
			baseline,
			hakim,
			observed_structural_delta: {
				added_lines: hakim.added_lines - baseline.added_lines,
				removed_lines: hakim.removed_lines - baseline.removed_lines,
			},
			interpretation: 'Recorded corpus observation only; not a generalized performance or live-agent causality claim.',
		},
		retention: {
			raw_prompts_retained: true,
			raw_candidate_operations_retained: true,
			failed_runs_retained: true,
		},
		claim_boundaries: manifest.claim_boundaries,
	};
	evidence.evidence_sha256 = sha256(canonicalJson(evidence));
	return evidence;
}

function parseArgs(args) {
	let output = null;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '--output') {
			if (!args[index + 1]) throw new Error('--output requires a path');
			output = args[index + 1];
			index += 1;
		} else if (arg.startsWith('--output=')) output = arg.slice(9);
		else throw new Error(`unknown option: ${arg}`);
	}
	return {output};
}

async function main() {
	try {
		const {output} = parseArgs(process.argv.slice(2));
		const evidence = await verifyPilot();
		const text = `${JSON.stringify(evidence, null, 2)}\n`;
		if (output) {
			const target = path.resolve(output);
			fs.mkdirSync(path.dirname(target), {recursive: true});
			fs.writeFileSync(target, text, {flag: 'wx'});
		}
		process.stdout.write(text);
		process.exit(evidence.status === 'PASS' ? 0 : 1);
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(2);
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
