'use strict';

const assert = require('assert');

(async () => {
  const {
    parseTomlScalarTables,
    parseYamlFrontmatterScalars,
  } = await import('../scripts/lib/structured_metadata.mjs');

  const toml = parseTomlScalarTables(`
[project]
name = "hakim"
version = "1.0.0"

[tool.hakim]
phase = "P1.1A cross-host runtime conformance execution and acceptance"
telemetry_default = false
`);

  assert.strictEqual(toml.project.name, 'hakim');
  assert.strictEqual(toml.project.version, '1.0.0');
  assert.strictEqual(
    toml['tool.hakim'].phase,
    'P1.1A cross-host runtime conformance execution and acceptance',
  );
  assert.strictEqual(toml['tool.hakim'].telemetry_default, false);

  const frontmatter = parseYamlFrontmatterScalars(`---
name: hakim
version: 1.0.0
repository: https://github.com/Habib1001-m/hakim
description: >
  Rewording this prose must not affect structured metadata checks.
tags:
  - minimalism
---

The body may mention another repository without changing the authoritative field.
`);

  assert.deepStrictEqual(frontmatter, {
    name: 'hakim',
    version: '1.0.0',
    repository: 'https://github.com/Habib1001-m/hakim',
  });

  assert.deepStrictEqual(parseYamlFrontmatterScalars('# no frontmatter'), {});

  console.log('structured TOML and YAML frontmatter metadata parsing ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
