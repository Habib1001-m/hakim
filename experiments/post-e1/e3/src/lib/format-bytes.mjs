export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) throw new TypeError('bytes must be non-negative');
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
