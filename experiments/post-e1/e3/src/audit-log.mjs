export function auditEntry(event, subject) {
  return { event, subject, recordedAt: Date.now() };
}
