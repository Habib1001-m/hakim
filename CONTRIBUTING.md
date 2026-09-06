# Contributing to Hakim

Thank you for helping improve Hakim.

Hakim is deliberately small and host-native. Contributions should improve the product without adding speculative architecture, duplicated cross-host machinery, or claims stronger than the evidence.

## Principles

- Make the smallest sufficient, coherent, safe change.
- Reuse existing code, standard-library behavior, and native host capabilities before adding custom machinery.
- Preserve material security, privacy, accessibility, data-integrity, migration, rollback, and trust guards.
- Do not add cross-host abstraction merely for symmetry.
- Keep correctness, compatibility, performance, and release claims bounded to what was actually checked.

## Local setup

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

Useful focused checks:

```bash
npm run test:node-compat
npm run package:skill
npm run package:release
node tests/test_hakim_opencode_lifecycle.mjs
```

Repository development requires Node.js 22+ and Python 3.10+.

## Documentation

Update only reader-facing documentation affected by the product change:

- `README.md` — overview and quick start.
- `core/hakim-skill/INSTALL.md` — installation and lifecycle.
- `SUPPORTED_HOSTS.md` — supported host surfaces.
- `docs/ARCHITECTURE.md` — stable product architecture.
- `KNOWN_LIMITATIONS.md`, `VERSIONING.md`, `SUPPORT.md`, `SECURITY.md` — durable product boundaries.

Do not add public taskboards, execution diaries, operator transcripts, private prompts, or phase-specific project-control documents.

## Pull requests

A PR should explain the product problem, the chosen scope, user-visible or contract-visible behavior changes, validation performed, and remaining compatibility or risk boundaries.

Keep PRs reviewable and product-focused.

## Security

Do not include credentials, private prompts, customer source, provider secrets, or sensitive local data in public issues, PRs, fixtures, or logs. Follow [SECURITY.md](SECURITY.md) for vulnerability reports.
