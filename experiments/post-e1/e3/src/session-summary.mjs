export function summarizeSession(session) {
  if (!Number.isFinite(session.durationMs) || session.durationMs < 0) {
    throw new TypeError('durationMs must be a non-negative finite number');
  }

  const totalSeconds = Math.floor(session.durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duration = `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return `${session.id} · ${duration} · ${session.status}`;
}
