#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { install, remove, status } from './lib/lifecycle.mjs';
import { packageMetadata } from './lib/ownership.mjs';

const CLI_PATH = fileURLToPath(import.meta.url);
const HELP_TEXT = `Hakim Native Plugin

Usage:
  hakim install [--dry-run] [--config-dir PATH] [--json]
  hakim status [--config-dir PATH] [--json]
  hakim remove [--dry-run] [--config-dir PATH] [--json]
  hakim --help
  hakim --version

Private OpenCode setup:
  1. Obtain the verified habib-hakim-1.0.0-beta.1.tgz artifact.
  2. Run: npx /absolute/path/to/habib-hakim-1.0.0-beta.1.tgz install
  3. Restart OpenCode, then run /hakim-help.

Feedback: use the repository's Hakim Beta Feedback issue form.
Boundary: local .tgz only; public npm and marketplace publication are unauthorized.
Hakim writes only its owned state and never edits opencode.json.`;

export function parseArgs(argv) {
  const args = { action: null, configDir: null, dryRun: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (['--help', '-h', 'help'].includes(token)) {
      if (args.action && args.action !== 'help') throw new Error(`unknown argument: ${token}`);
      args.action = 'help';
    } else if (['--version', '-v', 'version'].includes(token)) {
      if (args.action && args.action !== 'version') throw new Error(`unknown argument: ${token}`);
      args.action = 'version';
    } else if (!args.action && ['install', 'remove', 'status'].includes(token)) args.action = token;
    else if (token === '--config-dir') args.configDir = argv[++index] || null;
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--json') args.json = true;
    else throw new Error(`unknown argument: ${token}`);
  }
  if (!args.action) args.action = 'help';
  if (['help', 'version'].includes(args.action)) {
    if (args.configDir || args.dryRun) throw new Error(`${args.action} does not accept lifecycle options`);
    return args;
  }
  if (args.action === 'status' && args.dryRun) throw new Error('--dry-run is not valid with status');
  const configured = args.configDir || process.env.OPENCODE_CONFIG_DIR;
  args.configDir = path.resolve(configured || path.join(os.homedir(), '.config', 'opencode'));
  return args;
}

function enrichLifecycleResult(result, args) {
  const enriched = { ...result, config_dir: args.configDir };
  if (args.action === 'install' && result.status === 'PASS') {
    enriched.quick_reference = '/hakim-help';
    enriched.next_action = 'Restart OpenCode or open a new session, then run /hakim-help.';
  } else if (args.action === 'remove' && result.status === 'PASS' && result.state === 'REMOVED') {
    enriched.next_action = 'Restart OpenCode or open a new session to finish unloading Hakim.';
  }
  return enriched;
}

function print(result, json) {
  if (json) return console.log(JSON.stringify(result, null, 2));
  if (result.action === 'help') return console.log(result.help);
  if (result.action === 'version') return console.log(result.version);
  console.log('Hakim Native Plugin');
  console.log(`Result: ${result.state || result.status}`);
  if (result.config_dir) console.log(`OpenCode config: ${result.config_dir}`);
  if (result.quick_reference) console.log(`Quick reference: ${result.quick_reference}`);
  if (result.next_action) console.log(`Next: ${result.next_action}`);
  for (const [key, value] of Object.entries(result)) {
    if (['status', 'state', 'config_dir', 'quick_reference', 'next_action'].includes(key)) continue;
    if (Array.isArray(value)) console.log(`${key.toUpperCase()}=${value.join(';')}`);
    else console.log(`${key.toUpperCase()}=${value}`);
  }
}

export function invokedAsCli(argvPath = process.argv[1]) {
  if (!argvPath) return false;
  try {
    return fs.realpathSync(argvPath) === fs.realpathSync(CLI_PATH);
  } catch {
    return path.resolve(argvPath) === path.resolve(CLI_PATH);
  }
}

function main() {
  let json = process.argv.includes('--json');
  try {
    const args = parseArgs(process.argv.slice(2));
    json = args.json;
    let result;
    if (args.action === 'help') result = { status: 'PASS', action: 'help', help: HELP_TEXT };
    else if (args.action === 'version') result = { status: 'PASS', action: 'version', version: packageMetadata().version };
    else {
      const lifecycle = args.action === 'install' ? install(args) : args.action === 'remove' ? remove(args) : status(args);
      result = enrichLifecycleResult(lifecycle, args);
    }
    print(result, json);
    if (result.status === 'FAIL') process.exit(1);
  } catch (error) {
    print({ status: 'FAIL', error: error.message }, json);
    process.exit(1);
  }
}

if (invokedAsCli()) main();

export { HELP_TEXT };
export * from './lib/ownership.mjs';
export * from './lib/transaction.mjs';
export * from './lib/lifecycle.mjs';
