# Contributing to Hakim

Thank you for helping improve Hakim.

Hakim is deliberately evidence-bound and host-native. Contributions should improve the product without adding ceremony, speculative architecture, or claims stronger than the evidence.

## Development principles

- Make the smallest sufficient, coherent, safe change.
- Reuse existing code, standard-library behavior, and native host capabilities before adding custom machinery.
- Preserve unrelated files and material security/privacy/integrity/accessibility/migration/trust guards.
- Treat setup mutation separately from product mutation.
- Keep `NO_CHANGE`, correctness, compatibility, performance, and release claims bounded to evidence that establishes them.
- Do not add cross-host abstraction merely for symmetry.
- Do not rewrite historical evidence to match a newer implementation.

## Local setup

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

Useful focused checks:

```bash
npm run doctor
npm run check:evidence-script
npm run package:skill
npm run test:node-compat
```

For OpenCode lifecycle changes:

```bash
node tests/test_hakim_opencode_lifecycle.mjs
```

## Before changing behavior

1. Identify the maintained authority for the behavior being changed.
2. Run the smallest representative existing baseline read-only where practical.
3. Inspect only enough adjacent code/documentation to resolve decision-relevant uncertainty.
4. Add or update focused regression coverage.
5. For decision-logic transformations, test boundary states rather than inferring semantic equivalence from broad-suite green alone.

## Documentation

Public documentation explains the product; it is not a project-control database.

Reconcile only the reader-facing surfaces affected by the change:

- `README.md` — product overview and quick start.
- `core/hakim-skill/INSTALL.md` — installation and lifecycle.
- `SUPPORTED_HOSTS.md` — compatibility/support boundaries.
- `docs/ARCHITECTURE.md` — stable product architecture.
- `KNOWN_LIMITATIONS.md` — current product limitations.
- `VERSIONING.md`, `SUPPORT.md`, `SECURITY.md` — durable contracts when applicable.
- `CHANGELOG.md` — notable user/operator-visible changes.

Prefer machine-readable authorities for mutable identity/evidence facts. Do not create phase-specific status pages or public taskboards to synchronize project execution.

## Pull requests

A PR should state:

- the product problem being solved;
- the chosen scope and why it is sufficient;
- user-visible or contract-visible behavior changes;
- validation performed;
- remaining compatibility or risk boundaries.

Keep PRs reviewable and product-focused. Do not turn PR descriptions into execution diaries.

## Security and private evidence

Do not include credentials, private prompts, customer source, private repository identities, provider secrets, or sensitive local evidence in public issues, PRs, fixtures, or logs.

Do not disclose exploitable security details publicly. Follow [SECURITY.md](SECURITY.md).
