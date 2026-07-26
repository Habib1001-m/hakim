export function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError('durationMs must be a non-negative finite number');
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}
