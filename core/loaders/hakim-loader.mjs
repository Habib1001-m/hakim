import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VALID_MODES = new Set(['lite', 'full', 'ultra', 'off']);

export function normalizeMode(mode = 'full') {
  const value = String(mode || 'full').trim().toLowerCase();
  return VALID_MODES.has(value) ? value : 'full';
}

export function getCanonicalSkillPath() {
  return path.resolve(__dirname, '..', 'hakim-skill', 'SKILL.md');
}

export function loadSkillContent(skillPath = getCanonicalSkillPath()) {
  return fs.readFileSync(skillPath, 'utf8');
}

export function getModeDirective(mode = 'full') {
  const normalized = normalizeMode(mode);
  const directives = {
    lite: 'Lite mode: execute the request and mention a materially smaller safe alternative when one exists.',
    full: 'Full mode: apply the complete Hakim decision model with proportional verification.',
    ultra: 'Ultra mode: challenge additions, abstractions, and dependencies aggressively while preserving the required outcome and real guards.',
    off: 'Hakim guidance disabled for this session.',
  };
  return directives[normalized];
}

export function getRules(mode = 'full', options = {}) {
  const normalized = normalizeMode(mode);
  if (normalized === 'off') {
    return '# Hakim disabled\n\nHakim guidance is off for this session.\n';
  }
  const skillPath = options.skillPath || getCanonicalSkillPath();
  const skill = loadSkillContent(skillPath);
  return [
    `# Hakim activation (${normalized})`,
    '',
    getModeDirective(normalized),
    '',
    'Canonical Hakim policy loaded from the active distribution.',
    '',
    skill,
  ].join('\n');
}

export default { normalizeMode, getCanonicalSkillPath, loadSkillContent, getModeDirective, getRules };
