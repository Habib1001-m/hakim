// Exact persisted manifests for supported prior managed OpenCode installations.
// These records are immutable product-transition authorities. They let a newer
// Hakim CLI recognize only the exact older managed payload that was actually
// shipped, rather than trusting an arbitrary locally forged older-version
// manifest to redefine Hakim-owned bytes.

export const SUPPORTED_PERSISTED_PRIOR_MANIFESTS = Object.freeze([
  Object.freeze({
    schema_version: 1,
    adapter: 'hakim-opencode-project-plugin',
    product_version: '1.0.0-beta.2',
    source_commit: '126a228a4ff9c1afafb6075f81b4e0bbfdf702bf',
    files: Object.freeze([
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/capabilities.json', sha256: '78e4d522c0a7ccf4587687d5db1b2691c97d979cbda507695e8c6439db23fcd5', size: 6001 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/SKILL.md', sha256: 'd6366222e933d63d9acb358a6abfb18b031102e07876067f2777925751b459aa', size: 9039 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-audit/SKILL.md', sha256: '1b3d85a24c67563539e3bbbee7781f604a757c8dcb31e2a212f6c7613ef89527', size: 5563 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-debt/SKILL.md', sha256: 'dc844dba58c727c9b3c607c6553ac13ddb581a30bf840a3d96cdc35476898758', size: 3090 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-gain/SKILL.md', sha256: 'da57ebe377228f0030722bd559aaa359c03ecfa92521ed3342615bae40ce96e9', size: 1797 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-help/SKILL.md', sha256: '1682f75134b6a09760452b359b32d70c9e750ea53b9511e9ceca11f69cddcd58', size: 2533 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-review/SKILL.md', sha256: 'd038acd933184a1dfba15a8310e603187e24f9405bad20f9b648840d3bad80d4', size: 2910 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/loaders/hakim-loader.mjs', sha256: 'c047cfc0cfd78a9bbb1027367e92eaa5b2174eaa3fdb977e26bd1b44f8fa8553', size: 1799 }),
      Object.freeze({ target_relative: '.opencode/plugins/hakim.js', sha256: '029cb4074c1135c31d6d207ddb6e219101f238821b1e4ae6d934921077c0a0df', size: 7503 }),
    ]),
  }),
  Object.freeze({
    schema_version: 1,
    adapter: 'hakim-opencode-project-plugin',
    product_version: '1.0.0-beta.3',
    source_commit: 'a697b5e24d05e38b925d849fee4a02daa623c24b',
    files: Object.freeze([
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/capabilities.json', sha256: '78e4d522c0a7ccf4587687d5db1b2691c97d979cbda507695e8c6439db23fcd5', size: 6001 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/SKILL.md', sha256: '1abb00530a00ac6be2d0437db561d4ba7e5bba7a397ea7323de13fd0e10bb8a1', size: 10449 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-audit/SKILL.md', sha256: '1b3d85a24c67563539e3bbbee7781f604a757c8dcb31e2a212f6c7613ef89527', size: 5563 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-debt/SKILL.md', sha256: 'dc844dba58c727c9b3c607c6553ac13ddb581a30bf840a3d96cdc35476898758', size: 3090 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-gain/SKILL.md', sha256: 'da57ebe377228f0030722bd559aaa359c03ecfa92521ed3342615bae40ce96e9', size: 1797 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-help/SKILL.md', sha256: '1682f75134b6a09760452b359b32d70c9e750ea53b9511e9ceca11f69cddcd58', size: 2533 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/hakim-skill/skills/hakim-review/SKILL.md', sha256: 'd038acd933184a1dfba15a8310e603187e24f9405bad20f9b648840d3bad80d4', size: 2910 }),
      Object.freeze({ target_relative: '.opencode/hakim-runtime/loaders/hakim-loader.mjs', sha256: 'c047cfc0cfd78a9bbb1027367e92eaa5b2174eaa3fdb977e26bd1b44f8fa8553', size: 1799 }),
      Object.freeze({ target_relative: '.opencode/plugins/hakim.js', sha256: '77abfe41c959b9c4f808a3ae00ad1f2495b6cb99861faaecf51ee2e4364484ee', size: 7640 }),
    ]),
  }),
]);
