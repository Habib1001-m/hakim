# Hakim GitHub Copilot Integration

Hakim's maintained GitHub Copilot surface is the repository instruction file at:

```text
.github/copilot-instructions.md
```

This directory is retained as a host-integration placeholder only; it is not a
separate installable Copilot plugin and does not contain another copy of Hakim's
canonical rules.

Use the guarded repository instruction installer from the Hakim source checkout:

```bash
npm run plan:install -- --host github-copilot --target /path/to/repository
npm run install:copilot -- --target /path/to/repository
npm run install:copilot -- --target /path/to/repository --apply
```

The installer is create-only. It never overwrites or merges an existing Copilot
instruction file. Review and commit any newly created target instruction file
deliberately.

Repository instructions do not bypass GitHub Copilot permissions, repository
policies, or other host-native controls.
