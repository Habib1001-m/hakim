# Changelog

Hakim records product-facing changes here. Internal acceptance campaigns, private governance, evidence ledgers, candidate SHAs, and operator diaries are intentionally excluded.

## Unreleased

## 1.0.0-beta.8

- Rebuilt the maintained product around exactly six canonical capabilities: `hakim`, `review`, `audit`, `debt`, `status`, and `help`.
- Moved `lite`, `full`, `ultra`, and `off` under the `hakim` capability instead of exposing them as separate skills.
- Retired `gain` and the legacy duplicate `hakim-*` capability layer from the current product surface.
- Replaced fixed checkpoint ceremony with the judgment-first `UNDERSTAND → DECIDE → EXECUTE → VERIFY → CLOSE` model and proportional verification.
- Kept Codex, Claude Code, and GitHub Copilot skill projections aligned with the canonical contracts while preserving host-native hooks, agents, permissions, and trust boundaries.
- Bound installed OpenCode execution to the managed `.opencode/hakim-runtime` bundle so target-repository `core/` files cannot shadow verified managed runtime bytes.
- Preserved the guarded OpenCode create/adopt/upgrade/remove lifecycle, ownership validation, quarantine-backed rollback, no-clobber restoration, and post-remove verification before quarantine destruction.
- Reduced the shared root skill frontmatter to a portable `name` + `description` contract.
- Hardened release packaging so malformed skill frontmatter, capability name/path drift, unexpected skill directories, unsafe structures, or extra specialized-skill files fail before artifact generation.
- Kept release history and acceptance evidence out of installed skill contracts and help content.
