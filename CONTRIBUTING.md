# Contributing to Hakim

Thank you for helping improve Hakim.

## Development principles

Contributions should make the smallest safe change, preserve unrelated files,
separate evidence from inference, avoid unsupported claims, include tests for
changed behavior, and document meaningful user-visible changes.

## Local setup

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

Additional checks may include:

```bash
npm run doctor
npm run check:evidence-script
npm run package:skill
```

For OpenCode lifecycle changes, validate the maintained project-local path with:

```bash
node tests/test_hakim_opencode_lifecycle.mjs
```

## Pull requests

Explain the problem, chosen scope, changed behavior, validation, and remaining
risks. Do not include credentials, private prompts, sensitive evidence, or
customer source code.

## Security findings

Do not disclose exploitable security details publicly. Follow
[SECURITY.md](SECURITY.md).
