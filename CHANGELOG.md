# Changelog

Hakim records user-facing product changes here.

## Unreleased

## 1.0.0-beta.11

- Fixed OpenCode automatic Hakim activation by mutating the host-owned system-context array in place, so the maintained Hakim core and session mode reach fresh model requests instead of being silently lost when the transform replaces the array reference.

## 1.0.0-beta.10

- Made GitHub Copilot's canonical `review` capability collision-safe with the host-local routing ID `hakim-copilot-review`, and routed `hakim-reviewer` through that ID so higher-precedence generic `review` skills cannot shadow Hakim's review contract.

## 1.0.0-beta.9

- Made every OpenCode Hakim slash command visibly self-identifying in the TUI by prefixing its description with `Hakim`, so users can discover and filter the six canonical Hakim commands without memorizing generic command names.
- Refined all six canonical skill descriptions for clearer Hakim-owned catalog discovery and activation intent, expanded `help` with current host-native invocation forms, and removed the undefined severity field from the `audit` output contract.
- Refined the maintained Claude Code and GitHub Copilot CLI execution-agent wrappers with trigger-oriented delegation descriptions and explicit evidence-gap behavior; Claude wrappers also stop pinning unnecessary model/effort/turn policy, preserve all non-default Hakim modes, and fail closed on missing delegated revision context.
- Added Codex SessionStart guidance for preserving an already-active specialized Hakim capability across delegation through Codex's native skill selection, without causing delegation or attaching specialized capability behavior to unrelated delegated work.

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
