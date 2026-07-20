# Hakim Benchmark Evidence Status

**Version:** 2.0.0-provenance-reset  
**Reset date:** 2026-07-10  
**Classification:** provenance record and future benchmark contract  
**Accepted independent Hakim benchmark:** no

## Decision

The benchmark material previously stored in this file is not accepted as independent Hakim performance evidence.

Its headline values, task design, model choice, target repository, and example reductions originated from Ponytail-derived prototype material. The repository did not contain the raw runs, prompts, patches, scoring artifacts, model responses, environment capture, or reproducible harness required to establish those values as measurements produced independently for Hakim.

Accordingly:

```text
INDEPENDENT_HAKIM_BENCHMARK=NOT_ESTABLISHED
PREVIOUS_HAKIM_PERFORMANCE_CLAIMS=WITHDRAWN
PREVIOUS_STATISTICAL_CLAIMS=WITHDRAWN
RUNTIME_ADAPTER_PASS_IMPLIES_BENCHMARK_PASS=NO
PUBLIC_PERFORMANCE_OR_ROI_CLAIMS=HOLD
```

## What was removed from accepted evidence

The previous asset included unsupported Hakim-specific claims covering:

- lines-of-code reduction;
- token reduction;
- cost reduction;
- execution-time improvement;
- safety retention;
- p-values;
- confidence intervals;
- statistical power;
- effect sizes;
- per-task benchmark tables.

Those claims must not be repeated as Hakim results unless they are reproduced through the evidence contract below.

## Upstream relationship

Ponytail is acknowledged in the repository license and acknowledgments as a source of the minimalist coding methodology and prototype benchmark material.

Upstream or inherited evidence may be cited only when all of these are true:

1. it is labeled as upstream or inherited evidence;
2. it is attributed to its actual source;
3. it is not rewritten as an independent Hakim result;
4. its methodology and limitations are preserved;
5. no Hakim-specific product claim is inferred from it without a Hakim reproduction.

## Minimum contract for a future Hakim benchmark

A future benchmark may be accepted only when the repository records:

### Identity and environment

- Hakim commit SHA;
- adapter and projection versions;
- host product and version;
- model identifier and version;
- model parameters where available;
- operating system and runtime versions;
- dependency and tool versions;
- benchmark execution date.

### Inputs

- exact task prompts;
- source repository and pinned commit;
- baseline instructions;
- Hakim instructions;
- intensity mode;
- random seeds where supported;
- inclusion and exclusion rules.

### Raw outputs

- complete model responses;
- generated patches or files;
- token and latency metadata from the provider or host;
- command transcripts;
- validation output;
- safety or correctness findings;
- failed and excluded runs with reasons.

### Scoring

- metric definitions;
- deterministic scoring scripts where possible;
- human-judge rubric where needed;
- judge identities or model versions;
- disagreement handling;
- treatment of failed runs;
- statistical method chosen after inspecting the actual sample design.

### Reproducibility

- runnable benchmark command;
- stdlib-first harness or explicitly justified dependencies;
- raw machine-readable results;
- generated summary derived from raw results;
- checksum or manifest for evidence artifacts;
- documented limitations and known confounders.

## Claim levels

Future benchmark statements must use one of these levels:

```text
LEVEL 0 — hypothesis only; no runs
LEVEL 1 — exploratory local runs; not public evidence
LEVEL 2 — reproducible pilot with raw artifacts
LEVEL 3 — repeated cross-model or cross-host evidence
LEVEL 4 — independently reproduced evidence
```

Only Level 2 or higher may support a bounded public statement. The claim must name the level, environment, sample size, and limitations.

## Relationship to runtime evidence

The accepted Codex, Claude Code, and GitHub Copilot evidence proves only that the relevant adapter surface loaded or influenced behavior within its documented scope.

It does not prove:

- code reduction;
- cost reduction;
- speed improvement;
- improved correctness;
- safety superiority;
- marketplace readiness;
- enterprise readiness.

## Current safe product statement

The strongest currently supported statement is:

> Hakim has a canonical skill with CI-gated projections and accepted runtime evidence for Codex, a local Claude Code adapter, and GitHub Copilot repository instructions.

No quantified performance or ROI statement is currently accepted.

## Next benchmark phase

The next evidence-producing benchmark phase should be a small pilot, not a large marketing benchmark:

1. choose three representative coding tasks;
2. pin one public repository commit;
3. run baseline and Hakim under the same model and parameters;
4. retain every raw response and patch;
5. score correctness before code size;
6. publish the harness and raw results;
7. report descriptive results without inferential statistics unless the sample design supports them.
