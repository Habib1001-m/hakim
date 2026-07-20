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
npm run package:skill
npm run build:native-plugin
```

## Pull requests

Explain the problem, chosen scope, changed behavior, validation, and remaining
risks. Do not include credentials, private prompts, sensitive evidence, or
customer source code.

## Security findings

Do not disclose exploitable security details publicly. Follow
[SECURITY.md](SECURITY.md).
