#!/usr/bin/env node
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
    lite: 'Build what is asked, then name the lazier alternative in one line.',
    full: 'Enforce the Hakim ladder. Prefer reuse, stdlib, native platform features, and shortest safe diffs.',
    ultra: 'YAGNI extremist mode: delete before adding, challenge abstractions, and ship the minimum safe change.',
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
    'Canonical source: core/hakim-skill/SKILL.md',
    '',
    skill,
  ].join('\n');
}

export default { normalizeMode, getCanonicalSkillPath, loadSkillContent, getModeDirective, getRules };
