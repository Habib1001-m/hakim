---
name: agentic-ai-reference
description: >-
  Quick-reference to 20 highest-leverage concepts from Roitman's "Hitchhiker's
  Guide to Agentic AI" (2026), fact-checked against current sources as of
  mid-2026: RL alignment (GRPO, DPO, RLVR), agentic training (STaR,
  Reflexion, AgentQ), agent evaluation (TSR, Trajectory Efficiency,
  LLM-as-Judge), systems (PagedAttention, Flash Attention, 3D parallelism,
  roofline), and protocols (MCP, A2A, Skills). Use whenever choosing an
  RL/fine-tuning method, designing a reward signal, evaluating an agent,
  diagnosing inference latency/GPU utilization, or architecting a
  multi-agent/tool integration - even without these exact terms ("why is
  generation slow", "agent repeats the same mistake", "DPO or GRPO here").
license: MIT
metadata:
  hermes:
    version: "1.0.0"
    author: hermology
    category: mlops
    tags: [agentic-ai, rl, alignment, evaluation, systems, reference]
    related_skills: [ponytail-mode, hermes-agent, evaluating-llms-harness, serving-llms-vllm, llama-cpp]
    source: "Roitman, H. (2026) Hitchhiker's Guide to Agentic AI, v1.2.2"
    verified: "Cross-checked Jul 2026, see README"
    ponytail: "reference-only; apply via ponytail-mode ladder when implementing"
---

# Agentic AI Reference

20 concepts, each with a formula, a Hermes use, and a trigger. Start at the
Quick-Action Table; open a numbered concept only for the formula or the
reasoning behind a default.

**No overlap**: ponytail-mode = implementation discipline (apply when
*acting* on a concept below); hermes-agent = CLI/config (this adds the
*why*); evaluating-llms-harness = academic benchmarks (this adds *agent*
metrics, §5); serving-llms-vllm = deployment mechanics (this adds the
*theory*, §6/§15); llama-cpp = separate local backend. Path:
`~/.hermes/skills/mlops/agentic-ai-reference/SKILL.md`.

## The 20 Concepts

### 1. GRPO (Ch.7)
- **Formula**: Â_i=(r_i-μ_G)/σ_G over G=8 samples, no value net; PPO-clip
  update, KL penalty β≈0.04.
- **Why**: No critic to train (2 models not 4); group mean beats an
  undertrained value function. DeepSeek-R1's CoT emerged from this + binary
  reward alone.
- **Hermes**: Default RL for fine-tuning a sub-agent on verifiable tasks.
- **Trigger**: RL method choice w/ verifiable reward. Keep pass-rate 20-80%
  or advantage collapses to 0.

### 2. Agentic (PO)MDP (Ch.12.6)
- **Formula**: (S,A,T,R,Ω,O,γ) - a *POMDP*: agent sees only O(s) via
  truncated tool responses, never true state. γ≈0.99, 10-50 step horizons.
- **Why**: Names partial observability - prevents assuming the agent
  "knows" something a since-truncated tool result held.
- **Hermes**: Skeleton for every session - state=workspace, actions=tool
  calls, observations=truncated responses.
- **Trigger**: New tool/action space, or "agent acted on stale info."

### 3. STaR / Reflexion / AgentQ (Ch.12.5)
- **Formula**: STaR = generate → keep correct → rationalize incorrect → SFT
  → repeat. Reflexion = failure → NL self-critique → next attempt, no
  weight updates. AgentQ = DPO over best-vs-worst rollout pairs.
- **Why**: Three price points - Reflexion is free/in-context; STaR/AgentQ
  need training but give durable gains (AgentQ: real-world booking task
  18.6%→81.7% after one day of data collection, Putta et al. 2024).
- **Hermes**: Reflexion for in-session correction; STaR/AgentQ once a
  mistake pattern recurs across sessions.
- **Trigger**: Repeated mistake → inject a critique before training a fix.

### 4. DPO & β (Ch.6)
- **Formula**: r̂(x,y)=β·log(π_θ(y|x)/π_ref(y|x)); Loss=-log σ(r̂_w-r̂_l).
- **Why**: No reward-model+RL loop. **High β (0.3-1.0)=conservative**
  (near reference); **low β (0.01-0.05)=aggressive** (more deviation, risks
  over-optimizing). Confirmed against the book's own §6.7 table (a stray
  §6.2 line has this backward).
- **Hermes**: Default for pairwise feedback without a reward-model
  pipeline.
- **Trigger**: Have pairs, no verifier. β=0.1, LoRA r=16, one epoch only.

### 5. Agent Evaluation Metrics (Ch.14.6)
- **Formula**: TSR=successes/tasks. η=L*/L_agent (0 if failed). Tool-Use
  Accuracy = right tool ∧ valid args ∧ right timing.
- **Why**: Generation metrics miss task completion. 2026 update: SWE-bench
  Verified is now contamination-inflated at the frontier (OpenAI, Feb 2026)
  - SWE-bench Pro is the harder successor, a live Goodhart's-Law case
  (§14.8).
- **Hermes**: Score sessions as TSR+η, not "produced output."
- **Trigger**: Evaluating an agent/session or comparing two approaches.

### 6. PagedAttention / vLLM (Ch.2.2)
- **Formula**: KV cache = 2·L·H·d·n·bytes, paged into 16-token blocks + a
  block-table indirection - virtual memory for the KV cache.
- **Why**: Naive allocation wastes 60-80% of GPU memory to fragmentation;
  paging bounds it to ~15 tokens/seq and enables prefix sharing (~128x on a
  shared system prompt).
- **Hermes**: Why vLLM beats a naive `generate()` loop under concurrency.
- **Trigger**: Diagnosing inference throughput or OOM on a serving backend.

### 7. Flash Attention 1-4 (Ch.1.6)
- **Formula**: Tiling+online softmax avoids materializing the n×n score
  matrix. FA2=causal-skip+seq-parallel. FA3(Hopper)=TMA+warp-specialize.
  FA4(Blackwell)=async MMA+software exp()+conditional rescaling.
- **Why**: Standard attention is memory-bound (~62 FLOP/byte vs. ridge 156);
  Flash Attention makes it compute-bound (~2048). FA4 is real, not book
  speculation - arXiv:2603.05451 (Mar 2026), matches the book's figures
  exactly; shipping in vLLM/SGLang by mid-2026.
- **Hermes**: Which kernel to expect from an inference provider's claims.
- **Trigger**: "Why is generation slow" beyond the roofline check (§15).

### 8. LoRA / QLoRA (Ch.1.9)
- **Formula**: ΔW=B·A, rank r≪d, only B,A trained; scale α/r (fix α, sweep
  r without re-tuning LR).
- **Why**: r=16 @ d=4096 = 131K params/layer vs 16.8M full (128x smaller);
  QLoRA fine-tunes 70B on one GPU.
- **Hermes**: Default path for "specialize a model on our data."
- **Trigger**: GPU-limited fine-tune. Default r=16, α=32; raise r if loss
  plateaus above full-FT loss.

### 9. Forgetting vs. Alignment Tax (Ch.10.5)
- **Formula**: Forgetting=unintentional; task-B gradients overwrite task-A's
  key weights - knowledge **destroyed**. Alignment tax=deliberate; the KL
  leash truncates the output distribution - knowledge **suppressed**.
- **Why**: Different fixes. Forgetting → replay/lower LR. Tax → lower β,
  prompt change, or targeted FT. Confusing them wastes a debug cycle.
- **Hermes**: Baseline perplexity before/after any SFT/DPO pass.
- **Trigger**: Regression after FT - holdout perplexity spike=forgetting;
  capability win-rate drop=tax.

### 10. RLVR (Ch.13.6.5)
- **Formula**: Reward=deterministic_verifier(x,y)∈{0,1} - tests, symbolic
  math, proof checkers, DB lookups. No learned reward model.
- **Why**: Kills reward-model-hacking entirely (DeepSeek-R1's whole reward
  pipeline). Residual risk shifts to gaming the verifier itself.
- **Hermes**: Any task with an executable check skips reward-model
  training.
- **Trigger**: Ground-truth checker exists → prefer RLVR, always.

### 11. MCP Architecture (Ch.21)
- **Formula**: Host↔(1..N)Client↔Server, one stateful session per pair. 4
  primitives: Tools (client→server, side effects), Resources
  (server→client, context), Prompts (templates), Sampling (server asks
  host to run inference). JSON-RPC 2.0.
- **Why**: The exact shape of every Hermes tool integration. Stable spec is
  2025-11-25; 2026-07-28 ships as final this month (stateless protocol,
  MCP Apps extension). LF-governed (Agentic AI Foundation) since Dec 2025.
- **Hermes**: Direct spec for registering any new tool.
- **Trigger**: New external integration → MCP server over ad-hoc REST.

### 12. Orchestration Patterns (Ch.18.5)
- **Formula**: ReAct=Thought→Action→Observation, serial. Plan-and-Execute=
  plan fully, then run. LLM Compiler (Kim et al., ICML 2024 - not in the
  book, added from the primary paper)=DAG of tool deps, independent
  branches run in parallel.
- **Why**: ReAct is adaptive but serial - slow for independent calls in one
  turn. LLM Compiler recovers that latency.
- **Hermes**: Default shape of the agent loop.
- **Trigger**: ReAct by default; Plan-and-Execute for long horizons; LLM
  Compiler when a turn needs several independent calls.

### 13. Memory Taxonomy (Ch.17)
- **Formula**: Working (in-context, volatile) / Episodic (past trajectories,
  vector retrieval) / Semantic (context-independent facts) / Procedural
  (tool-use patterns, ultimately in weights).
- **Why**: Each wants a different store/write policy. Conflating them is
  the #1 memory bug - e.g. task progress written into a "semantic" store.
- **Hermes**: Rationale behind Hermes's own memory split.
- **Trigger**: New memory feature - classify type first, then pick a store.

### 14. RAG Architecture (Ch.16)
- **Formula**: Index (chunk+embed) → Retrieve (sparse/dense/hybrid, e.g.
  BM25+dense via Reciprocal Rank Fusion) → Generate (top-k into context).
- **Why**: Most "RAG is bad" complaints are chunking or fusion bugs, not
  the retrieval architecture or embedding model.
- **Hermes**: Knowledge-search layer behind "search past chats/skills."
- **Trigger**: Search misses docs - check chunking + fusion weights first.

### 15. Roofline Model (Ch.2.1.7, 11.3)
- **Formula**: I_ridge = peak FLOP/s ÷ peak bandwidth = 156 FLOP/byte (A100
  BF16). Memory-bound if I<156, compute-bound if I>156.
- **Why**: Batch=1 generation runs at I≈1 FLOP/byte → GPU is 99.4% idle,
  waiting on memory, not compute. This is why batching, not a faster GPU,
  is the lever.
- **Hermes**: First diagnostic for a self-hosted backend that "feels slow."
- **Trigger**: Latency issue - compute arithmetic intensity before buying
  hardware.

### 16. 3D Parallelism (Ch.11.2.6)
- **Formula**: Fits 1 GPU?→DDP. Fits 1 node w/FSDP?→FSDP/ZeRO-3. Fits 1
  node w/TP+FSDP?→TP intra-node+FSDP inter-node. Still too big?→add PP
  (last resort, 10-30% bubble overhead).
- **Why**: Reaching for PP first is the most common over-engineering
  mistake in distributed training - the same YAGNI error ponytail-mode
  targets, applied to hardware.
- **Hermes**: Sizing hardware for any training job.
- **Trigger**: Provisioning hardware - walk the ladder top-down.

### 17. Bradley-Terry / Plackett-Luce (Ch.9.1, 9.7)
- **Formula**: BT: P(y_w≻y_l)=σ(r(y_w)-r(y_l)). PL (listwise, reduces to BT
  at K=2): sequential softmax-without-replacement over a full ranking.
- **Why**: Pairwise BT only learns a difference; PL learns the actual
  reward scale and fits GRPO's group-of-N workflow natively.
- **Hermes**: How to structure preference data for a reward/critic model.
- **Trigger**: Ranked groups already exist (e.g. GRPO rollouts) → use PL;
  simple pairs → BT.

### 18. Multi-Objective Rewards (Ch.9.6)
- **Formula**: weighted sum (scale-sensitive) / normalize-then-sum a.k.a.
  GDPO (z-score, scale-invariant) / lexicographic (priority order) /
  constrained (primary s.t. floors) / Pareto front.
- **Why**: Weighted sum is the default everyone reaches for, and the one
  most likely to let one signal dominate by scale, not importance.
- **Hermes**: Combining correctness+format+efficiency+safety signals.
- **Trigger**: Fusing >1 reward - normalize-then-sum by default;
  lexicographic/constrained when one signal is a hard safety floor.

### 19. LLM-as-Judge (Ch.14.7)
- **Formula**: Pointwise (1-10) / Pairwise ([[A]]/[[B]]/[[C]] tie, both
  orderings) / Reference-guided.
- **Why**: Position bias costs 10-15pp without swapping A/B (confirmed
  figure). Verbosity bias (longer≠better) is the next most common silent
  failure.
- **Hermes**: How a "simulated expert committee" pattern stays trustworthy.
- **Trigger**: Judging quality - swap positions, ≥3 judges, different
  families; a 3-way tie is low-confidence, not a verdict.

### 20. Skills & A2A (Ch.22-23)
- **Formula**: Agent Card = signed JSON at `/.well-known/agent-card.json`
  (updated under A2A v1.0; book's `/agent.json` is pre-v1.0). Task
  lifecycle: submitted→working→(input-required)→completed/failed/rejected/
  canceled.
- **Why**: MCP is *vertical* (agent↔tool, one side); A2A is
  *horizontal* (agent↔agent, both reason) - they compose, not compete.
  A2A v1.0 (Apr 2026) added Signed Agent Cards; LF-governed, 150+ orgs.
- **Hermes**: Delegating to a *reasoning* peer, not a tool, is A2A's job.
- **Trigger**: Multi-agent coordination - MCP for tools, A2A for peers.

## Quick-Action Table

| Decision | Concept | Default Choice |
|---|---|---|
| Choose RL method | §1 GRPO | GRPO (online, verifiable), DPO (offline) |
| Design agent action space | §2 (PO)MDP | Tool call + response + clarify + delegate |
| Debug repeated failures | §3 Reflexion | Reflect → adjust → retry (in-context first) |
| Collect preference data | §4 DPO | β=0.1, LoRA r=16 |
| Evaluate agent performance | §5 Metrics | TSR + Trajectory Efficiency |
| Optimize inference latency | §6-7, §15 | PagedAttention + batching |
| Fine-tune for a domain | §8 LoRA | QLoRA, r=16, α=32 |
| Verify a reward source | §10 RLVR | Deterministic verifier if one exists |
| Add external integration | §11 MCP | MCP server over ad-hoc REST |
| Speed up agent loop | §12 Orchestration | ReAct default, LLM Compiler for parallel calls |
| Design new memory | §13 Taxonomy | Classify type first |
| Fix knowledge search | §14 RAG | Check chunking + hybrid fusion |
| Size training hardware | §15-16 Systems | Walk the parallelism ladder top-down |
| Train a reward model | §17-18 Rewards | Normalize-then-sum; PL if groups exist |
| Judge output quality | §19 LLM-as-Judge | Swap positions + 3 judges |
| Connect to another agent | §20 A2A | Agent Card + task lifecycle |

## Common Pitfalls

1. **PPO when GRPO suffices** - PPO needs 4 models in memory; GRPO needs 2.
2. **Episodic memory treated as semantic** - don't persist task progress as
   knowledge.
3. **Ignoring batching for latency** - single-stream generation is ~99%
   memory-idle; batching is the lever, not a faster GPU.
4. **Position bias in LLM-as-judge** - always swap positions; 10-15pp error
   without it.
5. **β miscalibrated in DPO** - β>0.3 suppresses capability change; β∈
   [0.05,0.2] works. High=conservative, low=aggressive - easy to get
   backward, double-check §4.
6. **Forgetting from full fine-tuning** - baseline holdout perplexity
   before any full FT run.
7. **Reward hacking a learned RM** - prefer RLVR (§10) when a ground-truth
   verifier exists.

## Ponytail Ceilings

```
single-skill quick-reference; upgrade a concept to its own deep-dive skill
(code + verification scripts) only when it must go from "look up the
default" to "implement from scratch."

GRPO-only depth, no PPO derivation; upgrade when agent training explicitly
needs PPO's on-policy value function.

§2's (PO)MDP is read-only; upgrade when a real pipeline gets built
against this spec.
```
