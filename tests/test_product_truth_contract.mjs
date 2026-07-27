#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { CHECK_DEFINITIONS, buildReport, formatText } from '../scripts/hakim_doctor.mjs';
import { installOpenCodeAdapter } from '../scripts/hakim_opencode_install.mjs';
import { inspectStatus } from '../scripts/hakim_opencode_cli.mjs';
import { readInstalledManifest } from '../scripts/lib/opencode_bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURRENT_VERSION = fs.readFileSync(path.join(ROOT, 'core', 'hakim-skill', 'VERSION'), 'utf8').trim();
const PREVIOUS_SUPPORTED_VERSION = '1.0.0-beta.1';

function passingDoctorResults() {
  return CHECK_DEFINITIONS.map((definition) => ({
    id: definition.id,
    tier: definition.tier,
    status: 'PASS',
    exit_code: 0,
    command: `node ${definition.script}`,
    diagnostics: [],
    data: { ok: true },
  }));
}

function makeVariantSource(parent, version, marker = '') {
  const root = path.join(parent, `source-${version.replaceAll(/[^A-Za-z0-9.-]/g, '_')}`);
  fs.mkdirSync(path.join(root, 'core'), { recursive: true });
  fs.mkdirSync(path.join(root, 'plugins'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'core', 'hakim-skill'), path.join(root, 'core', 'hakim-skill'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'core', 'loaders'), path.join(root, 'core', 'loaders'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'plugins', 'opencode'), path.join(root, 'plugins', 'opencode'), { recursive: true });
  fs.writeFileSync(path.join(root, 'core', 'hakim-skill', 'VERSION'), `${version}\n`);
  if (marker) fs.appendFileSync(path.join(root, 'plugins', 'opencode', 'hakim.mjs'), `\n// ${marker}\n`);
  return root;
}

test('doctor reports bounded check health without claiming whole-repository health', () => {
  const nativeAcceptance = {
    scope: 'current-native-product-paths',
    overall_status: 'PASS',
    hosts: {
      codex: { status: 'PASS' },
      'claude-code': { status: 'PASS' },
      'github-copilot': { status: 'PASS' },
      opencode: { status: 'PASS' },
    },
  };

  const report = buildReport(passingDoctorResults(), CURRENT_VERSION, 'FULL', nativeAcceptance);
  assert.equal(report.doctor_health, 'PASS');
  assert.equal(report.repository_health, 'OUT_OF_SCOPE_DOCTOR');

  const text = formatText(report);
  assert.match(text, /DOCTOR_HEALTH=PASS/);
  assert.match(text, /REPOSITORY_HEALTH=OUT_OF_SCOPE_DOCTOR/);
});

test('doctor derives native-host recovery guidance from the host that actually failed', () => {
  const nativeAcceptance = {
    scope: 'current-native-product-paths',
    overall_status: 'FAIL',
    hosts: {
      codex: { status: 'FAIL' },
      'claude-code': { status: 'PASS' },
      'github-copilot': { status: 'PASS' },
      opencode: { status: 'PASS' },
    },
  };

  const report = buildReport(passingDoctorResults(), CURRENT_VERSION, 'FULL', nativeAcceptance);
  assert.match(report.next_safe_action, /codex/i);
  assert.doesNotMatch(report.next_safe_action, /issue #18/i);
  assert.doesNotMatch(report.next_safe_action, /current OpenCode managed lifecycle/i);
});

test('failed supported beta.1 to current upgrade reports the version actually restored after complete rollback', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hakim-product-truth-upgrade-'));
  const target = path.join(parent, 'repository');
  fs.mkdirSync(target);

  try {
    const olderSource = makeVariantSource(parent, PREVIOUS_SUPPORTED_VERSION, 'synthetic-persisted-beta1-product-truth');
    const initial = installOpenCodeAdapter({ target, apply: true }, olderSource);
    assert.equal(initial.state, 'CREATED');
    assert.equal(initial.installed_product_version, PREVIOUS_SUPPORTED_VERSION);

    const originalCopy = fs.copyFileSync;
    let injected = false;

    fs.copyFileSync = function patchedCopy(from, to, mode) {
      if (!injected && String(to).startsWith(path.join(target, '.opencode'))) {
        injected = true;
        throw new Error('fault injection after old installation quarantine');
      }
      return originalCopy.call(this, from, to, mode);
    };

    let report;
    try {
      report = installOpenCodeAdapter({ target, apply: true }, ROOT);
    } finally {
      fs.copyFileSync = originalCopy;
    }

    assert.equal(injected, true);
    assert.equal(report.status, 'FAIL');
    assert.equal(report.state, 'UPGRADE_FAILED_ROLLED_BACK');
    assert.equal(report.rollback_attempted, true);
    assert.equal(report.rollback_complete, true);
    assert.equal(report.previous_product_version, PREVIOUS_SUPPORTED_VERSION);
    assert.equal(report.installed_product_version, PREVIOUS_SUPPORTED_VERSION);

    const manifest = readInstalledManifest(target);
    assert.equal(manifest.state, 'VALID');
    assert.equal(manifest.manifest.product_version, PREVIOUS_SUPPORTED_VERSION);

    const status = inspectStatus(target, ROOT);
    assert.equal(status.status, 'PASS');
    assert.equal(status.state, 'UPGRADE_AVAILABLE');
    assert.equal(status.installed_product_version, PREVIOUS_SUPPORTED_VERSION);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

console.log('test_product_truth_contract.mjs: ok');
