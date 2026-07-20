# agentic-ai-reference — Skill Package

Built from `agentic-ai-reference-SPEC.md` (v1.2.2 approval draft) against the
source book, then fact-checked against current external sources as of
**July 2026**. This README is the audit trail; the skill itself
(`agentic-ai-reference/SKILL.md`) stays a lean, citation-free lookup card by
design — that's the whole point of a "quick reference."

## Contents

```
agentic-ai-reference/
└── SKILL.md                  ← the actual skill (289 lines, 14.7 KB)
agentic-ai-reference-SPEC.md  ← original spec, kept for provenance
README.md                     ← this file
```

## Install

Copy the `agentic-ai-reference/` folder as-is to:
```
~/.hermes/skills/mlops/agentic-ai-reference/
```
No build step, no dependencies — it's a single Markdown file with YAML
frontmatter.

## Validation run in this environment

| Check | Method | Result |
|---|---|---|
| Frontmatter parses | `yaml.safe_load` | ✅ OK |
| Frontmatter keys legal | `quick_validate.py` (Anthropic's own Agent-Skills validator) | ✅ "Skill is valid!" |
| `name` kebab-case, ≤64 chars | `quick_validate.py` | ✅ `agentic-ai-reference` (20) |
| `description` ≤1024 chars, no `<>` | `quick_validate.py` | ✅ 702 chars |
| Exactly one `SKILL.md` | `quick_validate.py` | ✅ |
| Size budget ≤350 lines / ≤15KB | `wc -l` / `wc -c` | ✅ 289 lines / 15,086 B (14.73 KiB) |
| All 20 concepts present | `grep -c '^###'` | ✅ 20/20 |
| Spot-check: 3 quick-action rows trace to a matching §-entry | manual | ✅ §1/§4/§20 checked |

**Not runnable here** (need your local Hermes install, not this sandbox):
`hermes skills inspect`, `hermes skills list --category mlops`, and the
cross-skill `grep` against your other `~/.hermes/skills/*/SKILL.md` files
(Verify 2/4/5 in the SPEC). Those should take seconds once you drop the
folder in.

## Fix to the SPEC itself

The SPEC's draft frontmatter had `version:` and `author:` as **top-level**
YAML keys. Anthropic's Agent Skills spec only allows `name`, `description`,
`license`, `allowed-tools`, `metadata`, `compatibility` at the top level —
anything else fails validation. Moved both under `metadata.hermes.*`
(alongside `tags`, `related_skills`, `source`), which is unrestricted
free-form space. Confirmed via `quick_validate.py`, not guesswork.

## Research & correction log

Everything below was either confirmed accurate, or corrected, against
current sources rather than taken on the book's word alone.

1. **DPO β direction (§4)** — the book contradicts itself: §6.2's prose says
   large β → "moves aggressively," but §6.7's own worked table says β=0.5 is
   "very conservative" and β=0.01 is "very aggressive." Checked 5 external
   sources (Rafailov et al.'s framing as reproduced by ML educators, OpenAI's
   DPO fine-tuning docs, and three independent technical write-ups) — all
   agree with §6.7: **high β = conservative, low β = aggressive**. The skill
   uses the verified direction and flags it in Common Pitfall #5 since it's
   an easy one to get backward.

2. **AgentQ figure (§3)** — a mid-session draft of this skill cited AgentQ's
   real-world booking result as "50%→82%, 3 rounds." That doesn't match the
   source. Putta et al. (2024) report **18.6%→81.7%** success rate after one
   day of data collection (→95.4% with online search added at inference
   time). Re-checked against the paper directly and corrected before
   shipping — the kind of small, confident-sounding number that's easy to
   let slide if you don't verify it.

3. **Flash Attention 4 (§7)** — this looked like it might be 2026-book
   speculation dressed as fact. It isn't: arXiv:2603.05451 (Tri Dao et al.,
   published Mar 2026) confirms the exact figures the book cites (1613
   TFLOP/s, 71% of B200 peak, CuTe-DSL implementation). Went a step further
   than the book: confirmed FA4 is now actually shipped and auto-detected in
   both vLLM (v0.17+) and SGLang (v0.4+) on Blackwell hardware, not just
   published as a paper.

4. **MCP spec currency (§11)** — the book's own text only carried the
   protocol history through the 2025-03-26 revision. Current as of this
   week: stable is **2025-11-25**; **2026-07-28** is in its release-candidate
   window and ships as final within the month (makes the protocol layer
   stateless, adds an MCP Apps extension for interactive UI). MCP has also
   been under the Linux Foundation's new Agentic AI Foundation since Dec
   2025 — not in the book at all. Added.

5. **A2A protocol (§20)** — book's Agent Card path (`/.well-known/agent.json`)
   is the pre-v1.0 path. A2A v1.0 shipped April 2026 with **Signed Agent
   Cards** and moved to `/.well-known/agent-card.json`. The book's "150+
   supporting organizations" figure checked out exactly against current
   reporting. Path updated, v1.0 details added.

6. **LLM Compiler (§12)** — the SPEC's own concept table names this
   alongside ReAct/Plan-Execute, but the book's Ch.18.5 doesn't actually
   cover it (only ReAct, Plan-and-Execute, multi-agent, human-in-the-loop,
   workflow graphs). Sourced directly from the primary paper (Kim et al.,
   *An LLM Compiler for Parallel Function Calling*, ICML 2024) and added as
   a third pattern, marked as not-from-the-book in the skill itself.

7. **Agent evaluation currency (§5)** — added a 2026 development the book
   predates: OpenAI's Feb-2026 analysis found SWE-bench Verified is now
   contamination-inflated at the frontier (gold patches leak into training
   data), with **SWE-bench Pro** (Scale AI) emerging as the harder,
   contamination-resistant successor. Kept as a concrete, current instance
   of the book's own Goodhart's-Law warning (§14.8) rather than swapping in
   a specific leaderboard number, since those are moving weekly right now.

8. **Agentic MDP → (PO)MDP (§2)** — the book's own §12.6 formalizes this
   with an observation function Ω/O, i.e. a POMDP, not a fully-observable
   MDP. Relabeled for accuracy; the partial-observability point is actually
   the more useful half of this concept for debugging agents.

Concepts not listed above (GRPO, LoRA/QLoRA, PagedAttention, Bradley-Terry/
Plackett-Luce, roofline model, 3D parallelism, memory taxonomy, RAG, STaR/
Reflexion, RLVR, forgetting-vs-tax, multi-objective rewards) were checked
against the book's formulas and, where I have strong independent grounding
(these are stable, well-established results), against that knowledge — no
discrepancies found.

## Primary sources consulted this session

- GitHub — DietrichGebert/ponytail (the ladder + Hermes plugin integration
  the SPEC's "ponytail ceilings" convention is built on)
- Putta, P. et al., *Agent Q: Advanced Reasoning and Learning for Autonomous
  AI Agents* (arXiv:2408.07199) — corrected the §3 statistic
- arXiv:2603.05451 — FlashAttention-4 (Mar 2026); Spheron/SGLang release
  notes — confirmed FA4 shipped in vLLM 0.17+/SGLang 0.4+
- OpenAI — "Why SWE-bench Verified no longer measures frontier coding
  progress" (Feb 2026)
- Linux Foundation / Agentic AI Foundation announcements — A2A v1.0 (Apr
  2026) and MCP governance (Dec 2025)
- modelcontextprotocol.io spec history (2024-11-05 → 2026-07-28)
- Kim, S. et al., *An LLM Compiler for Parallel Function Calling*, ICML 2024
- 5 independent sources on DPO β direction (incl. OpenAI's fine-tuning docs)

## What this doesn't include (by design, not oversight)

Per the SPEC's own ponytail gate: no per-concept deep-dive files, no code
snippets, no test-prompt eval suite. This is a reference card, not a
tutorial — the SPEC was explicit that upgrading past that is a deliberate
future decision, not a default. If you want a lightweight "does this
actually trigger and read right in a live Hermes session" pass next, say
the word and I'll run a few sample queries against it.
