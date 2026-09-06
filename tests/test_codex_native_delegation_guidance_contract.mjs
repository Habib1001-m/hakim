import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pluginRoot = path.join(repoRoot, 'plugins', 'codex');
const hookPath = path.join(pluginRoot, 'hooks', 'session_start.mjs');

test('SessionStart preserves specialized Hakim capability across existing delegation without causing or contaminating delegation', () => {
  const output = execFileSync(process.execPath, [hookPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PLUGIN_ROOT: pluginRoot,
      HAKIM_DEFAULT_MODE: 'full',
    },
  });

  assert.match(output, /When delegation already exists/);
  assert.match(output, /whether Codex chose it or the user requested it/);
  assert.match(
    output,
    /include that same capability in the child task using Codex's native skill selection/,
  );
  assert.match(
    output,
    /Hakim must not cause delegation or add a specialized capability to unrelated delegated work/,
  );
});
