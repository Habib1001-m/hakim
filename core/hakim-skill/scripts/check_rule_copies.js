#!/usr/bin/env node
/**
 * Hakim rule integrity checker.
 *
 * Stdlib-only Node.js script that validates canonical SKILL.md frontmatter and
 * critical sections, and optionally compares two copies for drift.
 */
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const VERSION = '1.1.2';
const REQUIRED_YAML_FIELDS = ['name', 'description', 'argument-hint'];
const CRITICAL_SECTIONS = [
  { id: 'ladder', header: '## The Ladder' },
  { id: 'intensity', header: '## Intensity Levels' },
  { id: 'persistence', header: '## Persistence' },
  { id: 'commands', header: '## Commands' },
  { id: 'debt_ledger', header: '## Deliberate Technical Debt Ledger' },
  { id: 'lazy_not_negligent', header: '## Lazy, Not Negligent' },
];

function normalizeFrontmatterStart(content) {
  return String(content).replace(/^\uFEFF/, '').replace(/^(?:[ \t]*\r?\n)+/, '');
}

function extractFrontmatter(content) {
  const normalized = normalizeFrontmatterStart(content);
  const match = normalized.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) return null;

  const fields = {};
  let currentKey = null;
  let currentValue = '';

  for (const line of match[1].split('\n')) {
    if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(line)) {
      if (currentKey) fields[currentKey] = currentValue.trim();
      const index = line.indexOf(':');
      currentKey = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      currentValue = (value === '>' || value === '|') ? '' : value;
    } else if (currentKey && /^\s+/.test(line)) {
      currentValue += ` ${line.trim()}`;
    }
  }
  if (currentKey) fields[currentKey] = currentValue.trim();
  return { raw: match[1], fields };
}

function extractSection(content, header) {
  const start = content.indexOf(header);
  if (start === -1) return null;
  const rest = content.slice(start + header.length);
  const next = rest.match(/\r?\n## /);
  const end = next ? start + header.length + next.index : content.length;
  return content.slice(start, end);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function shortHash(text) {
  return sha256(text).slice(0, 16);
}

function analyzeSkill(content) {
  const result = {
    file_hash: sha256(content),
    file_hash_short: shortHash(content),
    total_chars: content.length,
    total_lines: content.split(/\r?\n/).length,
    frontmatter: null,
    sections: {},
    missing_sections: [],
    missing_yaml_fields: [],
  };

  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    result.missing_yaml_fields.push('(entire frontmatter)');
  } else {
    result.frontmatter = { raw_hash: shortHash(frontmatter.raw), fields: {} };
    for (const field of REQUIRED_YAML_FIELDS) {
      const value = frontmatter.fields[field];
      if (value) {
        result.frontmatter.fields[field] = {
          value_preview: value.slice(0, 60),
          hash: shortHash(value),
        };
      } else {
        result.missing_yaml_fields.push(field);
      }
    }
  }

  for (const section of CRITICAL_SECTIONS) {
    const text = extractSection(content, section.header);
    if (!text) {
      result.missing_sections.push(section.id);
    } else {
      result.sections[section.id] = {
        hash: shortHash(text),
        char_count: text.length,
        line_count: text.split(/\r?\n/).length,
      };
    }
  }

  return result;
}

function compare(original, copy) {
  const diffs = [];
  if (original.file_hash !== copy.file_hash) {
    diffs.push({ level: 'file', issue: 'file_hash_mismatch', original: original.file_hash_short, copy: copy.file_hash_short });
  }
  for (const field of REQUIRED_YAML_FIELDS) {
    const left = original.frontmatter?.fields?.[field];
    const right = copy.frontmatter?.fields?.[field];
    if (left && !right) diffs.push({ level: 'yaml', issue: `field_missing_in_copy:${field}` });
    if (left && right && left.hash !== right.hash) {
      diffs.push({ level: 'yaml', issue: `field_changed:${field}`, original_hash: left.hash, copy_hash: right.hash });
    }
  }
  for (const section of CRITICAL_SECTIONS) {
    const left = original.sections[section.id];
    const right = copy.sections[section.id];
    if (left && !right) diffs.push({ level: 'section', issue: `section_missing:${section.id}` });
    if (left && right && left.hash !== right.hash) {
      diffs.push({ level: 'section', issue: `section_drift:${section.id}`, original_hash: left.hash, copy_hash: right.hash });
    }
  }
  return diffs;
}

function isMalformed(analysis) {
  return analysis.missing_sections.length > 0 || analysis.missing_yaml_fields.length > 0;
}

function parseArgs(args) {
  const compareIdx = args.indexOf('--compare');
  if (compareIdx !== -1) {
    return {
      jsonMode: args.includes('--json'),
      primaryPath: args[0] && !args[0].startsWith('--') ? args[0] : null,
      comparePath: args[compareIdx + 1] || null,
    };
  }
  return {
    jsonMode: args.includes('--json'),
    primaryPath: args.find((arg) => !arg.startsWith('--')) || null,
    comparePath: null,
  };
}

function formatAnalysisText(analysis, filePath) {
  const lines = [
    '='.repeat(70),
    'HAKIM RULE COPY ANALYSIS',
    '='.repeat(70),
    '',
    `File:        ${filePath}`,
    `File hash:   ${analysis.file_hash}`,
    `Total lines: ${analysis.total_lines}`,
    '',
    'Critical sections:',
  ];
  for (const [id, data] of Object.entries(analysis.sections)) {
    lines.push(`  ${id}: ${data.hash}`);
  }
  if (analysis.missing_sections.length) lines.push(`MISSING SECTIONS: ${analysis.missing_sections.join(', ')}`);
  if (analysis.missing_yaml_fields.length) lines.push(`MISSING YAML FIELDS: ${analysis.missing_yaml_fields.join(', ')}`);
  return lines.join('\n');
}

function formatComparisonText(diffs, origPath, copyPath) {
  if (diffs.length === 0) return `Hakim rule copy comparison passed: ${origPath} == ${copyPath}`;
  return `Hakim rule copy drift detected (${diffs.length}):\n${JSON.stringify(diffs, null, 2)}`;
}

function printUsage() {
  console.log(`check_rule_copies.js v${VERSION}\n\nUsage:\n  node check_rule_copies.js <skill-md> [--json]\n  node check_rule_copies.js <original> --compare <copy> [--json]`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const { jsonMode, primaryPath, comparePath } = parseArgs(args);

  if (!primaryPath || (args.includes('--compare') && !comparePath)) {
    console.error('Error: invalid arguments');
    process.exit(2);
  }

  let primaryContent;
  try {
    primaryContent = fs.readFileSync(primaryPath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${primaryPath}: ${error.message}`);
    process.exit(2);
  }

  const primaryAnalysis = analyzeSkill(primaryContent);
  if (!comparePath) {
    console.log(jsonMode ? JSON.stringify(primaryAnalysis, null, 2) : formatAnalysisText(primaryAnalysis, primaryPath));
    process.exit(isMalformed(primaryAnalysis) ? 1 : 0);
  }

  let copyContent;
  try {
    copyContent = fs.readFileSync(comparePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${comparePath}: ${error.message}`);
    process.exit(2);
  }

  const copyAnalysis = analyzeSkill(copyContent);
  const diffs = compare(primaryAnalysis, copyAnalysis);
  const result = { original: { path: primaryPath, hash: primaryAnalysis.file_hash_short }, copy: { path: comparePath, hash: copyAnalysis.file_hash_short }, identical: diffs.length === 0, diff_count: diffs.length, diffs };
  console.log(jsonMode ? JSON.stringify(result, null, 2) : formatComparisonText(diffs, primaryPath, comparePath));
  process.exit(diffs.length === 0 ? 0 : 1);
}

if (require.main === module) main();

module.exports = {
  VERSION,
  REQUIRED_YAML_FIELDS,
  CRITICAL_SECTIONS,
  normalizeFrontmatterStart,
  extractFrontmatter,
  extractSection,
  analyzeSkill,
  compare,
  sha256,
  shortHash,
  parseArgs,
};
