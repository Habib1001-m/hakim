# Hakim for Codex

Hakim is a native Codex plugin with six reusable skills and a SessionStart hook. The repository also acts as a Codex Git marketplace.

## Compatibility

Use Codex `0.131.0` or newer for the maintained native plugin-hook path. Host-native hook discovery, trust, approvals, sandboxing, and managed policy remain authoritative.

## Install frozen beta.4

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

Open `/plugins`, select the **Hakim** marketplace, install `hakim`, review/trust the SessionStart hook in `/hooks`, then start a new thread.

Installed identity:

```text
hakim@hakim
```

## Native usage

- `$hakim:hakim` — full smallest-safe-diff workflow.
- `$hakim:hakim-review` — bounded removable-complexity review.
- `$hakim:hakim-audit` — evidence-backed audit.
- `$hakim:hakim-debt` — technical-debt provenance.
- `$hakim:hakim-gain` — evidence-status verification.
- `$hakim:hakim-help` — usage guidance and boundaries.

Natural-language invocation remains valid when Codex discovers the matching skill from its description.

## Startup behavior

The SessionStart hook injects only compact activation context; it does not paste the full canonical skill into every session. Codex loads matching skills progressively when needed.

`HAKIM_DEFAULT_MODE` may be `lite`, `full`, `ultra`, or `off`; `full` is the default. The hook never bypasses Codex approval or sandbox policy.

## Validation

```bash
npm test
npm run check:distribution-identity
npm run check:conformance
npm run check:capability-parity
npm run check:codex-projection
node plugins/codex/hooks/session_start.mjs
```

## Development fallback

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run launch:codex -- --binary codex --cwd /path/to/workspace
```

This path follows moving development rather than the frozen product identity.

## Troubleshooting

If multiple old local registrations exist, inspect them before deleting anything:

```bash
bash scripts/codex_startup_doctor.sh
```

Retain one intended Hakim installation and preserve user configuration until a duplicate source is identified.
