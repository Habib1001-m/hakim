# AGENTS.md: Global Rules for Repository Agents

**Version:** 1.0.0  
**Last Updated:** 2026-07-09  
**Scope:** All agents working on this repository  
**Authority:** This file takes precedence over SKILL.md for repository operations.

---

## Purpose

This file defines the global rules for any AI agent (Claude, GPT, Gemini, local models) that modifies, tests, or deploys the Hakim skill package. These rules apply to the **repository itself**, not to the skill's behavior when activated in user contexts.

**Key Distinction:**
- `SKILL.md` → Rules the agent follows when *using* the skill
- `AGENTS.md` → Rules the agent follows when *building* the skill

---

## Core Principles

### Principle 1: Self-Application

This repository must follow Hakim principles. Every file in this repo is subject to the 7-level ladder. If you find bloat in the skill package itself, fix it.

**Examples:**
- ❌ Adding a `utils/helpers.py` for a 3-line function
- ✅ Inlining the function where it's used
- ❌ Importing `requests` for a single HTTP call
- ✅ Using `urllib.request` from stdlib

### Principle 2: Minimal Context Footprint

Every addition to this repo increases the context agents must load. Before adding a file, ask:
1. Does this need to exist? (YAGNI)
2. Can this content live in an existing file?
3. Can this be generated on-demand instead of stored?

### Principle 3: Single Source of Truth

Each concept has exactly one authoritative location:
- **Skill behavior** → `SKILL.md`
- **Repository rules** → `AGENTS.md` (this file)
- **Mathematical derivations** → `references/grpo_mathematics.md`
- **Stdlib replacements** → `references/yagni_guidelines.md`
- **Workflow patterns** → `references/workflow_patterns.md`
- **Progressive disclosure** → `references/progressive_disclosure.md`
- **Complexity auditing** → `scripts/audit_complexity.py`
- **Packaging** → `scripts/package_skill.py`
- **Technical debt** → `assets/technical_debt_ledger.json`
- **Benchmarks** → `assets/benchmark_results.md`

Never duplicate content across files.

### Principle 4: Backward Compatibility

Do not break existing integrations:
- MCP namespace must remain `hakim.*`
- A2A message schema must remain stable
- YAML frontmatter fields must not be removed (only added)
- Slash commands (`/hakim`, `/hakim-review`, etc.) must not change semantics

### Principle 5: Audit Everything

Every change must pass the quality gates before merging:
- G1-G7 gates must all pass
- T-YAML-001 through T-BENCH-006 must all pass
- R1-R6 reviews must achieve ≥85% weighted score

---

## File Modification Rules

### Adding Files

**Before adding any file, answer:**
1. Does this functionality already exist in the repo?
2. Can this be a section in an existing file instead of a new file?
3. Is this file required for L1/L2/L3 Progressive Disclosure?

**Allowed additions:**
- New reference files in `/references` (with justification)
- New scripts in `/scripts` (must use stdlib only)
- New assets in `/assets` (must be referenced by SKILL.md)

**Forbidden additions:**
- Top-level files beyond `SKILL.md` and `AGENTS.md`
- New subdirectories beyond `/scripts`, `/references`, `/assets`
- README files in subdirectories (use main AGENTS.md)
- License files beyond the root `LICENSE`

### Modifying SKILL.md

**Mandatory checks before modifying:**
1. YAML frontmatter remains valid (G1)
2. 7-level ladder remains complete and ordered (G2)
3. Token budgets not exceeded (L1 ≤150, L2 ≤3000)
4. All 6 slash commands preserved
5. Persistence mechanism preserved

**Forbidden modifications:**
- Removing ladder rungs
- Reordering ladder rungs
- Changing skill name from `hakim`
- Removing intensity levels
- Removing empirical results table

### Modifying Scripts

**Mandatory checks:**
1. All imports remain stdlib-only (G4)
2. Function signatures remain backward-compatible
3. CLI arguments preserved
4. Exit codes preserved (0=success, 1=failure)

**Required after modification:**
- Run the script against itself: `python scripts/audit_complexity.py scripts/`
- Verify no new violations introduced
- Update docstrings if behavior changes

---

## Testing Before Commit

### Pre-Commit Checklist

Every commit must pass these checks:

```bash
# 1. YAML validation
python -c "import yaml; yaml.safe_load(open('SKILL.md').read().split('---')[1])"

# 2. Ladder completeness
grep -c "Does this need to exist" SKILL.md  # must be 1
grep -c "Already in this codebase" SKILL.md  # must be 1
grep -c "Stdlib does it" SKILL.md  # must be 1
grep -c "Native platform feature" SKILL.md  # must be 1
grep -c "Already-installed dependency" SKILL.md  # must be 1
grep -c "Can it be one line" SKILL.md  # must be 1
grep -c "Only then" SKILL.md  # must be 1

# 3. Stdlib compliance
python -c "
import ast, sys
for f in ['scripts/audit_complexity.py', 'scripts/package_skill.py']:
    tree = ast.parse(open(f).read())
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            print(f'{f}: {ast.unparse(node)}')
"

# 4. Package test
python scripts/package_skill.py --source . --output /tmp/test-hakim.zip
unzip -l /tmp/test-hakim.zip | grep -v '__pycache__' | grep -v '\.pyc'

# 5. Self-audit
python scripts/audit_complexity.py . --output json > /tmp/audit.json
python -c "import json; d=json.load(open('/tmp/audit.json')); exit(0 if d['summary']['total_violations'] == 0 else 1)"
```

### Continuous Integration Requirements

If this repo has CI configured, the pipeline must:
1. Run all 6 tests (T-YAML-001 → T-BENCH-006)
2. Run all 7 gates (G1-G7)
3. Generate `skill-package.zip` as artifact
4. Fail the build if any gate or test fails

---

## Language & Communication

### Documentation Language

- **SKILL.md**: English (for broad agent compatibility)
- **AGENTS.md**: English (this file)
- **References**: English
- **Code comments**: English
- **Commit messages**: English

### Writing Style

**Required:**
- Concise, direct sentences
- Active voice
- Technical precision
- Concrete examples over abstract descriptions

**Forbidden:**
- Emojis in code or documentation
- Conversational filler ("as you can see", "let's dive in")
- Marketing language ("revolutionary", "cutting-edge")
- Redundant adjectives

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature (new reference, new script)
- `fix`: Bug fix (script error, broken ladder)
- `docs`: Documentation only
- `refactor`: Code change, no feature/fix
- `test`: Test additions/changes
- `chore`: Maintenance

**Examples:**
```
feat(references): add roofline_model.md

Add detailed Roofline Model documentation with A100 metrics.
Supports L3 Progressive Disclosure for performance-related tasks.

Closes #42
```

```
fix(scripts): audit_complexity.py missed nested async functions

The AST walker was skipping AsyncFunctionDef nodes when calculating
nesting depth. Now handles both FunctionDef and AsyncFunctionDef.

Fixes #87
```

---

## Build Process

### Generating the Package

```bash
# From the hakim-skill directory root
python scripts/package_skill.py --source . --output hakim-skill-package.zip
```

### Verifying the Package

```bash
# List contents
unzip -l hakim-skill-package.zip

# Expected structure:
# hakim-skill/SKILL.md
# hakim-skill/AGENTS.md
# hakim-skill/scripts/audit_complexity.py
# hakim-skill/scripts/package_skill.py
# hakim-skill/references/yagni_guidelines.md
# hakim-skill/references/grpo_mathematics.md
# hakim-skill/references/workflow_patterns.md
# hakim-skill/references/progressive_disclosure.md
# hakim-skill/assets/technical_debt_ledger.json
# hakim-skill/assets/benchmark_results.md

# Verify no absolute paths
python -c "
import zipfile
with zipfile.ZipFile('hakim-skill-package.zip', 'r') as zf:
    for name in zf.namelist():
        if name.startswith('/') or ':/' in name or '..' in name:
            raise SystemExit(f'Bad path: {name}')
print('All paths valid')
"
```

### Deploying to MCP Router

```bash
# Assuming mcp CLI is installed
mcp deploy hakim-skill-package.zip --namespace hakim
mcp list-skills | grep hakim
```

---

## Forbidden Actions

The following actions are **strictly prohibited** and will be rejected in code review:

### 1. Adding Third-Party Dependencies

**Forbidden:**
- Adding `requirements.txt` with external packages
- Adding `package.json` with npm dependencies
- Importing non-stdlib modules in scripts

**Exception:** None. Rewrite using stdlib.

### 2. Breaking Progressive Disclosure

**Forbidden:**
- Moving YAML frontmatter to a separate file
- Loading L2 content at L1 stage
- Auto-loading all references at skill activation

### 3. Diluting the Ladder

**Forbidden:**
- Removing any of the 7 rungs
- Reordering rungs
- Adding "escape hatches" that bypass rungs
- Weakening rung descriptions

### 4. Removing Empirical Evidence

**Forbidden:**
- Deleting benchmark results
- Removing the n=4 methodology
- Hiding negative results

### 5. Emoji Pollution

**Forbidden:**
- Emojis in SKILL.md
- Emojis in AGENTS.md
- Emojis in scripts
- Emojis in commit messages
- Emojis in PR descriptions

### 6. Scope Creep

**Forbidden:**
- Adding non-coding features (translation, recipes, prose)
- Adding GUI/visual components
- Adding network-dependent features
- Adding features that require external services

---

## Quick Reference

### File Locations

| Need | Location |
|------|----------|
| Skill behavior | `SKILL.md` |
| Repo rules | `AGENTS.md` (this file) |
| Audit codebase | `scripts/audit_complexity.py` |
| Package skill | `scripts/package_skill.py` |
| Stdlib replacements | `references/yagni_guidelines.md` |
| GRPO equations | `references/grpo_mathematics.md` |
| Workflow patterns | `references/workflow_patterns.md` |
| Progressive disclosure | `references/progressive_disclosure.md` |
| Technical debt | `assets/technical_debt_ledger.json` |
| Benchmarks | `assets/benchmark_results.md` |

### Common Commands

```bash
# Audit the repo itself
python scripts/audit_complexity.py . --intensity ultra

# Package for deployment
python scripts/package_skill.py --source . --output hakim-skill-package.zip

# Validate YAML
python -c "import yaml, re; c=open('SKILL.md').read(); m=re.match(r'^---\n(.*?)\n---', c, re.DOTALL); print(yaml.safe_load(m.group(1))['name'])"

# Check ladder completeness
grep -E "(Does this need|Already in|Stdlib does|Native platform|Already-installed|Can it be one|Only then)" SKILL.md
```

### Emergency Contacts

**If you find:**
- Ladder violation in this repo → Open issue with `[LADDER]` prefix
- Third-party dependency added → Revert immediately, open issue with `[STDLIB]` prefix
- Benchmark manipulation → Open issue with `[INTEGRITY]` prefix
- Security vulnerability → Private report, do not open public issue

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-09 | Initial release |

---

## License

This file is part of the Hakim skill package and is licensed under MIT.
See root `LICENSE` file for full terms.

---

**END OF AGENTS.md**
```
