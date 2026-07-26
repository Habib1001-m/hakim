export function summarizeSession(session) {
  const totalSeconds = Math.floor(session.durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duration = `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return `${session.id} · ${duration} · ${session.status}`;
}
