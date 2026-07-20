#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(__dirname, '..');
const skillPath = path.join(pluginRoot, 'skills', 'hakim', 'SKILL.md');
const mode = (process.env.HAKIM_DEFAULT_MODE || 'full').toLowerCase();

const modeLine = {
  lite: 'Hakim mode: lite — implement the request and mention the lazier alternative.',
  full: 'Hakim mode: full — enforce reuse, stdlib/native first, and shortest safe diff.',
  ultra: 'Hakim mode: ultra — challenge additions and prefer deletion before new code.',
  off: 'Hakim mode: off — guidance disabled.',
}[mode] || 'Hakim mode: full — enforce reuse, stdlib/native first, and shortest safe diff.';

if (mode === 'off') {
  process.stdout.write('Hakim guidance disabled for this session.\n');
  process.exit(0);
}

const skill = fs.readFileSync(skillPath, 'utf8');
process.stdout.write(`\n${modeLine}\n\n${skill}\n`);
