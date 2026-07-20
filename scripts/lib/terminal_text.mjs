export function stripTerminalControlSequences(text) {
  return String(text ?? '')
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, '')
    .replace(/\u001B[P^_][\s\S]*?\u001B\\/g, '')
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\u001B[@-_]/g, '');
}

export function normalizeTerminalText(text) {
  return stripTerminalControlSequences(text)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeTerminalTextForMatching(text) {
  return stripTerminalControlSequences(text)
    .replace(/\s+/g, ' ')
    .trim();
}
