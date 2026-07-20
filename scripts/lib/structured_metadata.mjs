function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (!value) return undefined;
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); }
    catch { return undefined; }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return undefined;
}

export function parseTomlScalarTables(text) {
  const tables = { '': {} };
  let currentTable = tables[''];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const tableMatch = line.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (tableMatch) {
      currentTable = tables[tableMatch[1]] ||= {};
      continue;
    }

    const assignment = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!assignment) continue;
    const parsed = parseScalar(assignment[2]);
    if (parsed !== undefined) currentTable[assignment[1]] = parsed;
  }

  return tables;
}

export function parseYamlFrontmatterScalars(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return {};
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end < 0) return {};

  const values = {};
  for (const rawLine of lines.slice(1, end)) {
    if (!rawLine || /^\s/.test(rawLine)) continue;
    const assignment = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!assignment) continue;
    const rawValue = assignment[2].trim();
    if (!rawValue || rawValue === '>' || rawValue === '|') continue;
    const parsed = parseScalar(rawValue);
    values[assignment[1]] = parsed === undefined ? rawValue : parsed;
  }

  return values;
}
