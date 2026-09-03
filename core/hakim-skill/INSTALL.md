# Install Hakim

Hakim is public beta software distributed from the public repository and native Git marketplace surfaces.

Frozen product identity: `1.0.0-beta.4` at exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

Moving `main` is unreleased development (`1.0.0-beta.4.post1`) and is not a frozen candidate.

## Codex

Use Codex `0.131.0` or newer for the maintained native plugin-hook path.

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

Open `/plugins`, select **Hakim**, install `hakim`, review/trust the SessionStart hook, then start a new thread.

Useful skills:

```text
$hakim:hakim
$hakim:hakim-review
$hakim:hakim-audit
$hakim:hakim-debt
$hakim:hakim-gain
$hakim:hakim-help
```

`hakim-gain` is an evidence-status compatibility name, not a quantified-gain claim.

## Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Marketplace registration selects a catalog; it is not the immutable product pin. The Claude catalog entry uses an exact SHA for `plugins/claude-code`.

If Hakim was installed while a session was already open, use `/reload-plugins`.

Maintained commands include:

```text
/hakim:full
/hakim:review
/hakim:audit
/hakim:debt
/hakim:gain
/hakim:help
```

Claude Code's own installation scope, approval, permissions, cache, managed policy, and trust controls remain authoritative.

## GitHub Copilot

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Marketplace registration selects a catalog; it is not the immutable product pin. The Copilot catalog entry uses an exact SHA for `plugins/copilot`.

Verify installation:

```bash
copilot plugin list
```

Moving development supports explicit mode control:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

`.github/copilot-instructions.md` is an optional repository baseline, not the primary product distribution.

## OpenCode

Hakim is a guarded project-local OpenCode plugin. Normal installation does not require cloning Hakim first.

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install
```

Read-only inspection:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode status
```

The lifecycle supports bounded create/adopt/upgrade flows, validates Hakim-owned files and manifests, refuses partial/modified/unsafe/conflicting state, and does not edit `opencode.json`.

After installation, start OpenCode from the target repository and use `/hakim-help` or `/hakim full ...`.

Remove Hakim-managed project-local state with:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode remove
```

Removal and rollback use bounded ownership, same-filesystem quarantine, post-move verification, and no-clobber restoration.

### npm 10 exact-Git transport issue

Some npm 10 environments can fail exact-Git package transport with `GitFetcher requires an Arborist constructor to pack a tarball`. This is an npm transport issue, not a different Hakim source requirement. Use npm 11+ for that exact-Git bootstrap when the npm 10 bug is present.

## Source-checkout development

For development or manual lifecycle inspection:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

The source-checkout install script defaults to dry-run; `--apply` performs the installation. The product-facing `hakim-opencode install` command applies by default and supports `--dry-run` for inspection.

## Inspect maintained surfaces

```bash
npm run doctor:fast
npm run plan:install -- --host all
npm run check:distribution-identity
```

## Source validation

```bash
npm test
npm run doctor
npm run package:skill
```

Generated packages, SBOMs, checksums, and local tests prove only their checked scope. Host-native approval, trust, sandboxing, permissions, managed policy, and removal remain authoritative.
