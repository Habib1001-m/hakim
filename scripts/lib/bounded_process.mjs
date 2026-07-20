import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

export const DEFAULT_PROCESS_LIMITS = Object.freeze({
  git_timeout_ms: 30_000,
  check_timeout_ms: 120_000,
  review_timeout_ms: 120_000,
  test_timeout_ms: 300_000,
  max_buffer_bytes: 16 * 1024 * 1024,
});

function positiveInteger(value, fallback, label) {
  const candidate = value ?? fallback;
  if (!Number.isInteger(candidate) || candidate <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return candidate;
}

export function runBoundedProcess(command, args = [], options = {}) {
  if (typeof command !== 'string' || command.length === 0) {
    throw new Error('bounded process requires a non-empty command');
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) {
    throw new Error('bounded process arguments must be an array of strings');
  }

  const timeoutMs = positiveInteger(
    options.timeout_ms,
    DEFAULT_PROCESS_LIMITS.check_timeout_ms,
    'timeout_ms',
  );
  const maxBuffer = positiveInteger(
    options.max_buffer_bytes,
    DEFAULT_PROCESS_LIMITS.max_buffer_bytes,
    'max_buffer_bytes',
  );
  const runner = options.runner || spawnSync;
  const started = performance.now();
  const result = runner(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env || { ...process.env, NO_COLOR: '1' },
    shell: false,
    timeout: timeoutMs,
    killSignal: 'SIGTERM',
    maxBuffer,
  });
  const durationMs = Math.max(0, Math.round(performance.now() - started));
  const errorCode = result?.error?.code || null;
  const timedOut = errorCode === 'ETIMEDOUT';
  const outputLimitExceeded = errorCode === 'ENOBUFS';
  let status = 'FAIL';
  if (timedOut) status = 'TIMED_OUT';
  else if (outputLimitExceeded) status = 'OUTPUT_LIMIT_EXCEEDED';
  else if (!result?.error && !result?.signal && result?.status === 0) status = 'PASS';

  return {
    command,
    args: [...args],
    status,
    exit_code: Number.isInteger(result?.status) ? result.status : null,
    signal: result?.signal || null,
    timed_out: timedOut,
    output_limit_exceeded: outputLimitExceeded,
    duration_ms: durationMs,
    timeout_ms: timeoutMs,
    max_buffer_bytes: maxBuffer,
    error_code: errorCode,
    error: result?.error?.message || null,
    stdout: typeof result?.stdout === 'string' ? result.stdout : '',
    stderr: typeof result?.stderr === 'string' ? result.stderr : '',
    shell_used: false,
  };
}

export function processEvidence(result) {
  return {
    status: result.status,
    exit_code: result.exit_code,
    signal: result.signal,
    timed_out: result.timed_out,
    output_limit_exceeded: result.output_limit_exceeded,
    duration_ms: result.duration_ms,
    timeout_ms: result.timeout_ms,
    error_code: result.error_code,
    error: result.error,
    shell_used: false,
  };
}
