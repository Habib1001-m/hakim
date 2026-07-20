# Changelog

All notable public changes to Hakim are recorded here.

## Unreleased

### Changed

- Separated the public product repository from local development governance,
  review archives, taskboards, and private evidence records.
- Replaced internal transition reporting with user-facing product,
  installation, security, host-support, and limitation documentation.
- Added a minimal public CI boundary without private evaluator or governance
  artifact uploads.

## 1.0.0-beta.1

### Added

- Canonical evidence-bound coding skill.
- Integrations for Codex, Claude Code, GitHub Copilot, and OpenCode.
- Native OpenCode plugin package with one plugin, six commands, and six skills.
- Doctor, host-preflight, installation planning, review, audit, and PR Guardian
  command surfaces.
- Package integrity records, exact ownership validation, lifecycle locking,
  quarantine, and rollback safeguards.
- Local skill and native-package build and verification tools.

### Security

- Added real-path containment and parent-chain validation.
- Added refusal behavior for unsafe ownership, package mismatch, path escape,
  and unproved restoration.
- Added immutable GitHub Action references and least-privilege permissions.

### Boundaries

- No npm or marketplace package is currently published.
- No signing, notarization, SBOM, external attestation, support SLA, or general
  model-quality claim is provided.
