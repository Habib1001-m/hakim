# Contributing to Hakim

Thank you for helping improve Hakim.

Hakim is deliberately evidence-bound and host-native. Contributions should improve the product without adding ceremony, speculative architecture, or claims stronger than the evidence.

## Development principles

- Make the smallest sufficient, coherent, safe change.
- Reuse existing code, standard-library behavior, and native host capabilities before adding custom machinery.
- Preserve unrelated files and material security/privacy/integrity/accessibility/migration/trust guards.
- Treat setup mutation separately from product mutation.
- Keep `NO_CHANGE`, correctness, compatibility, performance, and release claims bounded to evidence that actually establishes them.
- Do not add cross-host abstraction merely for symmetry.
- Do not rewrite historical evidence to match a newer implementation.

## Local setup

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

Useful focused checks include:

```bash
npm run doctor
npm run check:evidence-script
npm run package:skill
npm run test:node-compat
```

For OpenCode lifecycle changes, also validate the maintained project-local path:

```bash
node tests/test_hakim_opencode_lifecycle.mjs
```

## Before changing behavior

1. Identify the maintained authority for the behavior you are changing.
2. Run the smallest representative existing baseline read-only where practical.
3. Inspect only enough adjacent code/documentation to resolve decision-relevant uncertainty.
4. Add or update focused regression coverage for changed behavior.
5. For decision-logic transformations, test boundary states rather than inferring semantic equivalence from broad-suite green alone.

## Documentation truth

Public documentation is a projection of maintained authorities, not a second product-state database.

When changing version, host support, readiness, lifecycle, or release claims, reconcile the relevant maintained sources together:

- `README.md`
- `docs/PRODUCT_READINESS.md`
- `docs/ARCHITECTURE.md`
- `docs/OPERATIONAL_PRESENCE.md` when applicable
- `SUPPORTED_HOSTS.md`
- `KNOWN_LIMITATIONS.md`
- `VERSIONING.md` / `SUPPORT.md` when the release or support contract changes

Prefer one current authority plus concise links over phase-specific status documents in the primary docs surface.

## Pull requests

A PR should state:

- the problem being solved;
- the chosen scope and why it is sufficient;
- user-visible or contract-visible behavior changes;
- validation performed on the exact proposed head;
- remaining risks or evidence gaps;
- whether the change affects a frozen prerelease identity, unreleased `main` development, or both.

Keep PRs reviewable. Historical experiment refs may remain immutable even when the implementation later changes; do not move or relabel them.

## Security and private evidence

Do not include credentials, private prompts, customer source, private repository identities, private base SHAs, model/provider secrets, or sensitive local evidence in public issues, PRs, fixtures, or logs.

Do not disclose exploitable security details publicly. Follow [SECURITY.md](SECURITY.md).
