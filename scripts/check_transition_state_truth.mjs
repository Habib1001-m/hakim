#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCanonicalTransitionTruth } from './lib/transition_state_truth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = validateCanonicalTransitionTruth(ROOT);

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
