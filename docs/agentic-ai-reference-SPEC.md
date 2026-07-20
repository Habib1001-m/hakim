# Specification: agentic-ai-reference Skill

**Status**: SPEC — awaiting approval before implementation
**Source**: Roitman, H. (2026) *The Hitchhiker's Guide to Agentic AI: From Foundations to Systems*, v1.2.2
**PONYTAIL Ladder**: Pre-implementation gate applied below

---

## 0. Ladder Gate — Does This Need to Exist?

**Answer**: YES. Three reasons:

1. **Coverage gap**: No existing Hermes skill covers RL alignment (GRPO, DPO, KTO), agentic training patterns (STaR, Reflexion, AgentQ), or system architecture (3D parallelism, roofline model). The `evaluating-llms-harness` skill covers benchmarks but not agent metrics (TSR, Trajectory Efficiency, Tool-Use Accuracy).

2. **Decision frequency**: These concepts are hit every time we choose a model provider, design a reward signal, debug inference latency, evaluate agent performance, or extend Hermes capabilities. A quick-reference skill avoids re-searching a 29K-line book.

3. **Source authority**: The book is a 2026 comprehensive reference by an IBM Research principal scientist. It maps directly to Hermes architecture (MCP, skills, A2A, memory taxonomy).

### What It Does NOT Replace

| Existing skill | Covers | Not replaced by this |
|---|---|---|
| `ponytail-mode` | Implementation discipline | N/A — orthogonal |
| `hermes-agent` | Hermes CLI, config, spawning | N/A — separate layer |
| `evaluating-llms-harness` | Academic benchmarks (MMLU, GSM8K) | Agent metrics are a different category |
| `serving-llms-vllm` | vLLM deployment | This skill references PagedAttention conceptually, vLLM skill handles deployment |
| `llama-cpp` | Local GGUF inference | Separate inference backend |

---

## 1. Skill Identity

```
name: agentic-ai-reference
category: mlops
path: ~/.hermes/skills/mlops/agentic-ai-reference/SKILL.md
```

### YAML Frontmatter

```yaml
---
name: agentic-ai-reference
description: >-
  Quick-reference to 20 highest-leverage concepts from Roitman's "Hitchhiker's
  Guide to Agentic AI" (2026). Covers RL alignment, agentic training, evaluation,
  MCP/A2A, system architecture, and reasoning. Use when making architectural
  decisions, evaluating agents, choosing RL methods, or designing multi-agent systems.
version: 1.0.0
author: hermology
license: MIT
metadata:
  hermes:
    tags: [agentic-ai, rl, alignment, evaluation, systems, reference]
    related_skills: [ponytail-mode, hermes-agent, evaluating-llms-harness, serving-llms-vllm, llama-cpp]
    source: "Roitman, H. (2026) The Hitchhiker's Guide to Agentic AI: From Foundations to Systems, v1.2.2"
    ponytail: "reference-only skill; implement per ponytail-mode ladder when applying any concept"
---
```

### Trigger Conditions (when Hermes auto-loads this skill)

The skill is tagged `rl`, `alignment`, `agentic-ai`, `evaluation`, `systems`. Hermes should load it when the conversation enters any of these domains:

- User asks about RL methods, fine-tuning, alignment
- User mentions GRPO, DPO, PPO, KTO, RLHF
- User asks about agent performance metrics
- User discusses inference latency, GPU optimization
- User designs new Hermes tools/capabilities
- User references MCP/A2A protocols
- User asks about multi-agent coordination

---

## 2. Content Architecture — 20 Concepts

Each concept follows a fixed 4-field template:

```
### N. CONCEPT NAME (Chapter Reference)

**Formula / Pattern**: Mathematical definition or architectural pattern.

**Why it matters**: One-paragraph significance summary.

**Hermes application**: Concrete mapping to existing Hermes workflows.

**Trigger**: When to apply this concept in a session.
```

### Concept Selection Criteria

Selected from 29 chapters. Each concept must satisfy ALL three:
1. Has a **formula or pattern** that is directly applicable (not just descriptive)
2. Maps to a **specific Hermes workflow or decision** (not abstract theory)
3. Has a **clear trigger condition** (when to load/apply)

### The 20 Concepts (Ordered by Hermes Relevance)

| # | Name | Chapter | Core Insight | Direct Hermes Use |
|---|---|---|---|---|
| 1 | GRPO | 7 | Group-relative advantage; no value function | RL method selection for fine-tuning |
| 2 | Agentic MDP | 12.6 | Productivity co-pilot MDP formulation | Architecture of every Hermes session |
| 3 | STaR/Reflexion/AgentQ | 12.5 | Agentic training techniques | Our existing reflect/learn loop |
| 4 | DPO & β | 6 | Direct preference optimization loss | Pairwise feedback alignment |
| 5 | Agent Evaluation Metrics | 14.6 | TSR, Trajectory Efficiency, Tool-Use Accuracy | Session quality measurement |
| 6 | PagedAttention/vLLM | 2.2 | Virtual memory for KV cache | Inference backend understanding |
| 7 | Flash Attention 1-4 | 1.6 | Tiling + online softmax | Provider capability evaluation |
| 8 | LoRA/QLoRA | 1.9 | Low-rank adaptation; PEFT | Fine-tuning on single GPU |
| 9 | Forgetting vs Alignment Tax | 10.5 | Two distinct degradation modes | Safe fine-tuning baseline checks |
| 10 | RLVR | 13.6.5 | Verifiable rewards without RM | Code/math verification tasks |
| 11 | MCP Architecture | 21 | Tools/Resources/Prompts primitives | Tool integration design |
| 12 | Orchestration Patterns | 18 | ReAct, Plan-Execute, LLM Compiler | Agent loop optimization |
| 13 | Memory Taxonomy | 17 | Working/Episodic/Semantic/Procedural | Our memory architecture rationale |
| 14 | RAG Architecture | 16 | Index → Retrieve → Generate pipeline | Knowledge search optimization |
| 15 | Roofline Model | 2.1.7, 11.3 | 156 FLOP/byte crossover; 99.4% idle | Inference latency diagnosis |
| 16 | 3D Parallelism | 11.2.6 | TP+PP+DP flowchart | Hardware sizing decisions |
| 17 | Bradley-Terry/Plackett-Luce | 9.1, 9.7 | Pairwise→Listwise preference models | Reward model training design |
| 18 | Multi-Objective Rewards | 9.6 | 5 combination strategies | Multi-signal reward fusion |
| 19 | LLM-as-Judge | 14.7 | Position bias, swap mitigation | Output quality assessment |
| 20 | Skills & A2A | 22-23 | Agent Card + task lifecycle | Multi-agent coordination |

---

## 3. Quick-Action Table (Decision Matrix)

16-row lookup table: "When facing decision X → open concept Y → default choice Z"

| Decision | Concept | Default Choice |
|---|---|---|
| Choose RL method | §1 GRPO | GRPO (online), DPO (offline) |
| Design agent action space | §2 Agentic MDP | Tool call + response + clarify + delegate |
| Debug repeated failures | §3 Reflexion | Reflect → adjust → retry |
| Collect preference data | §4 DPO | β=0.1, LoRA rank=16 |
| Evaluate agent performance | §5 Metrics | TSR + Trajectory Efficiency |
| Optimize inference latency | §6-7, §15 | PagedAttention + batching |
| Fine-tune for domain | §8-9 LoRA | QLoRA, r=16, α=32 |
| Verify reward source | §10 RLVR | Deterministic verifier if possible |
| Add external integration | §11 MCP | MCP server over REST |
| Speed up agent loop | §12 Orchestration | ReAct default, Plan-Execute for complex |
| Design new memory | §13 Taxonomy | Classify type first |
| Fix knowledge search | §14 RAG | Check chunking + hybrid fusion |
| Size training hardware | §15-16 Systems | Apply parallelism flowchart |
| Train reward model | §17-18 Rewards | Normalize-then-sum, PL for rankings |
| Judge output quality | §19 LLM-as-Judge | Swap + 3 judges |
| Connect to other agents | §20 A2A | Agent Card + task lifecycle |

---

## 4. Common Pitfalls (7 Items)

1. **Using PPO when GRPO suffices** — PPO needs 4 models; GRPO needs 2
2. **Treating episodic memory as semantic** — don't store task progress in persistent memory
3. **Ignoring batching for inference latency** — single-stream generation is 99% memory-idle
4. **Position bias in LLM-as-judge** — always swap positions; 10-15pp error without swap
5. **β too high in DPO** — β > 0.3 suppresses capability; β ∈ [0.05, 0.2] is working range
6. **Catastrophic forgetting from full fine-tuning** — baseline perplexity before full FT
7. **Reward hacking against learned reward models** — prefer RLVR when ground-truth exists

---

## 5. Ponytail Ceilings

Three explicit ceilings — marked in the skill with `ponytail:` comments:

```text
ponytail: single-skill quick-reference; upgrade when concepts need per-concept
deep-dive skills with code snippets and verification scripts.

ponytail: GRPO-only (no PPO deep-dive); upgrade when PPO is explicitly needed
for interactive agent training.

ponytail: MDP formulation is read-only reference; upgrade when we build a
training pipeline using this MDP spec.
```

---

## 6. Verification Plan (Post-Implementation)

After writing the skill, run these checks:

### Verify 1: Frontmatter Parse
```bash
python3 -c "
import yaml
with open('$HOME/.hermes/skills/mlops/agentic-ai-reference/SKILL.md') as f:
    content = f.read()
    # Extract YAML block
    _, fm, body = content.split('---', 2)
    yaml.safe_load(fm)
    print('Frontmatter: OK')
"
```

### Verify 2: Skill View Load
```bash
hermes skills inspect agentic-ai-reference
# Must show: name, description, tags, 20 concepts present
```

### Verify 3: Size Budget
```bash
wc -l ~/.hermes/skills/mlops/agentic-ai-reference/SKILL.md
# Target: ≤ 350 lines (under context window budget)
```

### Verify 4: No Overlap with Existing Skills
```bash
# Manual check: no concept duplicates content from ponyytail-mode, hermes-agent, or evaluating-llms-harness
grep -c 'GRPO\|DPO\|PagedAttention\|Flash Attention' ~/.hermes/skills/*/SKILL.md
# Expected: 0 in other skills, >0 in agentic-ai-reference
```

### Verify 5: Trigger Tag Match
```bash
hermes skills list --category mlops
# Must show agentic-ai-reference with tags: agentic-ai, rl, alignment, evaluation, systems
```

---

## 7. What Is Intentionally Skipped

| Skipped | Reason | When to Add |
|---|---|---|
| PPO full derivation (Ch.5) | GRPO is modern default; PPO adds 4-model complexity | When interactive agent training requires PPO |
| Pipeline Parallelism deep-dive (Ch.11.2.4) | Last resort parallelism; TP+FSDP covers 99% of cases | When training 100B+ models |
| MCTS mathematical proofs (Ch.13.6.1) | Research-level; not needed for agent decisions | When building reasoning-specific agents |
| Full TRL code snippets per method | Would exceed size budget; ponytail ceiling | Per-concept deep-dive skills |
| Chapters 25-26 (Frameworks, UI) | Descriptive, not formulaic; lower priority | When evaluating LangGraph vs CrewAI |
| Quiz questions (Ch.27-28) | Reference material, not decision support | Separate quiz skill if needed |
| Multimodal, healthcare, legal (Ch.1 scope) | Book explicitly excludes these | Separate skills if domains arise |

---

## 8. Implementation Instructions

**Single file**: `~/.hermes/skills/mlops/agentic-ai-reference/SKILL.md`

No linked files, no dependencies, no scripts. Skill is pure text reference.

**Size target**: ≤ 350 lines, ≤ 15KB.

**Language**: English (technical terms), with Arabic trigger descriptions where helpful.

**Formatting**: Standard Markdown with code blocks for formulas.

---

## 9. Relationship to Other Skills

```
ponytail-mode (implementation discipline)
    └─ applies when acting on concepts from agentic-ai-reference

hermes-agent (Hermes CLI/config)
    └─ agentic-ai-reference adds the WHY behind tool architecture

evaluating-llms-harness (academic benchmarks)
    └─ agentic-ai-reference adds AGENT metrics (TSR, Efficiency, Tool Accuracy)

serving-llms-vllm (vLLM deployment)
    └─ agentic-ai-reference adds the THEORY (PagedAttention, roofline model)

llama-cpp (local GGUF inference)
    └─ orthogonal — separate inference backend
```

---

## 10. Cost & Risk

| Dimension | Assessment |
|---|---|
| Implementation cost | ~30 minutes to write 350-line SKILL.md |
| Maintenance cost | Near zero — reference content doesn't change unless book gets new edition |
| Bloat risk | Low — no code, no deps, no linked files |
| Obsolescence risk | Low — Roitman 2026; concepts stable for 2-3 years |
| Wrong-decision risk | Medium — this skill influences architectural choices; mitigate with explicit defaults + ponytail ceilings |
| Conflict risk | None — no existing skill covers these concepts |