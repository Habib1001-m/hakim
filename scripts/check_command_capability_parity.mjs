#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = path.join(ROOT, 'core/hakim-skill/capabilities.json');
const CANONICAL_MAIN = path.join(ROOT, 'core/hakim-skill/SKILL.md');
const COPILOT_PATH = path.join(ROOT, '.github/copilot-instructions.md');

const EXPECTED_IDS = [
  'hakim',
  'hakim-review',
  'hakim-audit',
  'hakim-debt',
  'hakim-gain',
  'hakim-help',
];

const ADJUNCT_HOSTS = ['codex', 'claude-code'];
const WITHDRAWN_GAIN_PATTERNS = [
  /-54%/i,
  /-22%/i,
  /-20%/i,
  /-27%/i,
  /100%\s+(?:safe|safety)/i,
  /statistically significant/i,
  /p\s*<\s*0\.001/i,
];

const REVIEW_SCOPE_PATHS = [
  'core/hakim-skill/skills/hakim-review/SKILL.md',
  'plugins/codex/skills/hakim-review/SKILL.md',
  'plugins/claude-code/skills/hakim-review/SKILL.md',
];

const REVIEW_SCOPE_PHRASES = [
  'git diff --no-ext-diff --',
  'git diff --cached --no-ext-diff --',
  'if both diffs are empty, report that no current diff exists',
  'Do not silently substitute `HEAD~1`',
  'only when the user explicitly chooses that scope',
];

const AUDIT_CONTRACT_PATHS = [
  'core/hakim-skill/skills/hakim-audit/SKILL.md',
  'plugins/codex/skills/hakim-audit/SKILL.md',
  'plugins/claude-code/skills/hakim-audit/SKILL.md',
];

const AUDIT_CONTRACT_PHRASES = [
  'manual repository review contract',
  'Python heuristic scan',
  'known-third-party-import-review',
  'too-many-positional-parameters',
  'PROVENANCE_LABEL_ONLY',
  'repository-wide complexity, dead-code analysis, duplication analysis, correctness review, and security review as `NOT_PERFORMED`',
  'python core/hakim-skill/scripts/audit_complexity.py',
  '--output json',
  'Do not use `npm run audit:ci` for a read-only request',
  'Do not create, update, delete, format, or stage repository files during a read-only audit',
  'No evidence-backed reductions found in the inspected scope. Correctness and security review were not performed.',
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function readUtf8(filePath, errors) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    errors.push(`cannot read ${rel(filePath)}: ${error.message}`);
    return null;
  }
}

function parseSkillName(text) {
  const match = text?.match(/^---\s*\r?\n[\s\S]*?^name:\s*([^\r\n]+)\s*$[\s\S]*?^---\s*$/m);
  return match ? match[1].trim() : null;
}

function main() {
  const errors = [];
  const contractText = readUtf8(CONTRACT_PATH, errors);
  let contract = null;

  if (contractText) {
    try {
      contract = JSON.parse(contractText);
    } catch (error) {
      errors.push(`invalid JSON in ${rel(CONTRACT_PATH)}: ${error.message}`);
    }
  }

  const canonicalMain = readUtf8(CANONICAL_MAIN, errors);
  const copilot = readUtf8(COPILOT_PATH, errors);
  const checkedFiles = new Set();

  if (contract) {
    if (contract.schema_version !== 1) {
      errors.push(`unsupported capability schema_version: ${contract.schema_version}`);
    }

    const capabilities = Array.isArray(contract.capabilities) ? contract.capabilities : [];
    const ids = capabilities.map((item) => item.id);

    if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_IDS)) {
      errors.push(`capability IDs/order mismatch: ${JSON.stringify(ids)}`);
    }

    for (const capability of capabilities) {
      if (!capability?.id || !capability?.canonical_path || !capability?.hosts) {
        errors.push(`malformed capability record: ${JSON.stringify(capability)}`);
        continue;
      }

      const canonicalPath = path.join(ROOT, capability.canonical_path);
      const canonicalText = readUtf8(canonicalPath, errors);
      checkedFiles.add(rel(canonicalPath));

      if (canonicalText && parseSkillName(canonicalText) !== capability.id) {
        errors.push(`${capability.canonical_path} frontmatter name must be ${capability.id}`);
      }

      for (const host of ['codex', 'claude-code', 'github-copilot']) {
        const surface = capability.hosts[host];
        if (!surface?.path || !surface?.invocation) {
          errors.push(`${capability.id} missing ${host} path or invocation`);
          continue;
        }

        const surfacePath = path.join(ROOT, surface.path);
        const surfaceText = readUtf8(surfacePath, errors);
        checkedFiles.add(rel(surfacePath));

        if (ADJUNCT_HOSTS.includes(host) && capability.id !== 'hakim' && canonicalText && surfaceText) {
          if (surfaceText !== canonicalText) {
            errors.push(`${capability.id} ${host} skill drift: ${surface.path} differs from ${capability.canonical_path}`);
          }
          if (parseSkillName(surfaceText) !== capability.id) {
            errors.push(`${surface.path} frontmatter name must be ${capability.id}`);
          }
        }
      }

      if (canonicalMain && !canonicalMain.includes(`/${capability.id}`)) {
        errors.push(`canonical command table does not advertise /${capability.id}`);
      }

      if (copilot && !copilot.includes(`\`${capability.id}\``)) {
        errors.push(`Copilot instructions missing capability routing for ${capability.id}`);
      }
    }
  }

  if (copilot) {
    if (!copilot.includes('Do not promise slash-command support on this surface')) {
      errors.push('Copilot instructions must state the no-slash-command promise boundary');
    }
    if (!copilot.includes('core/hakim-skill/capabilities.json')) {
      errors.push('Copilot instructions must reference the capability contract');
    }
  }

  const gainPaths = [
    'core/hakim-skill/skills/hakim-gain/SKILL.md',
    'plugins/codex/skills/hakim-gain/SKILL.md',
    'plugins/claude-code/skills/hakim-gain/SKILL.md',
  ];

  for (const gainPath of gainPaths) {
    const text = readUtf8(path.join(ROOT, gainPath), errors);
    if (!text) continue;
    for (const phrase of ['NOT ESTABLISHED', 'WITHDRAWN', 'HOLD']) {
      if (!text.includes(phrase)) errors.push(`${gainPath} missing evidence status phrase: ${phrase}`);
    }
    for (const pattern of WITHDRAWN_GAIN_PATTERNS) {
      if (pattern.test(text)) errors.push(`${gainPath} contains withdrawn benchmark claim: ${pattern}`);
    }
  }

  for (const reviewPath of REVIEW_SCOPE_PATHS) {
    const text = readUtf8(path.join(ROOT, reviewPath), errors);
    if (!text) continue;
    for (const phrase of REVIEW_SCOPE_PHRASES) {
      if (!text.includes(phrase)) {
        errors.push(`${reviewPath} missing current-diff scope guard: ${phrase}`);
      }
    }
  }

  for (const auditPath of AUDIT_CONTRACT_PATHS) {
    const text = readUtf8(path.join(ROOT, auditPath), errors);
    if (!text) continue;
    for (const phrase of AUDIT_CONTRACT_PHRASES) {
      if (!text.includes(phrase)) {
        errors.push(`${auditPath} missing bounded audit contract guard: ${phrase}`);
      }
    }
    for (const forbidden of [
      'Perform a repository-wide complexity audit.',
      'whole-codebase over-engineering review',
      'Lean already. Ship.',
    ]) {
      if (text.includes(forbidden)) {
        errors.push(`${auditPath} contains superseded audit contract wording: ${forbidden}`);
      }
    }
  }

  const result = {
    contract: rel(CONTRACT_PATH),
    expected_capabilities: EXPECTED_IDS,
    checked_files: [...checkedFiles].sort(),
    audit_helper_tool_id: 'hakim-python-heuristic-scan',
    audit_supported_language: 'python',
    audit_rule_ids: ['known-third-party-import-review', 'too-many-positional-parameters'],
    audit_intensity_semantics: 'PROVENANCE_LABEL_ONLY',
    ok: errors.length === 0,
    errors,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`Hakim capability parity OK (${EXPECTED_IDS.length} capabilities)`);
  } else {
    console.error('Hakim capability parity failed:');
    for (const error of errors) console.error(`- ${error}`);
  }

  process.exit(result.ok ? 0 : 1);
}

main();
