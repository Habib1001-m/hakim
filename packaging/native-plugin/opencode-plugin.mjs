// Hakim OpenCode plugin for the distributable native package.
//
// The package builder places this module at payload/plugins/hakim.mjs and the
// canonical runtime at payload/hakim-runtime/. The plugin contains no copied
// Hakim policy text; it loads the packaged canonical SKILL.md at runtime.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALID_MODES = new Set(['lite', 'full', 'ultra', 'off']);

function regularFile(candidate) {
  try {
    const stat = fs.lstatSync(candidate);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function resolveBundle() {
  const runtimeRoot = path.resolve(__dirname, '../hakim-runtime');
  const bundle = {
    kind: 'NATIVE_PACKAGE_GLOBAL_INSTALL',
    loaderPath: path.join(runtimeRoot, 'loaders', 'hakim-loader.mjs'),
    skillPath: path.join(runtimeRoot, 'hakim-skill', 'SKILL.md'),
    capabilitiesPath: path.join(runtimeRoot, 'hakim-skill', 'capabilities.json'),
  };
  if (!regularFile(bundle.loaderPath) || !regularFile(bundle.skillPath) || !regularFile(bundle.capabilitiesPath)) {
    throw new Error('Hakim packaged runtime is missing or unsafe. Run `hakim remove`, then reinstall the package.');
  }
  return bundle;
}

function firstArgument(value) {
  return String(value || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
}

function alreadyContainsRules(system, instructions) {
  return system.some((entry) => typeof entry === 'string' && entry.includes(instructions));
}

async function createHakimHooks({ client } = {}) {
  const bundle = resolveBundle();
  const loader = await import(pathToFileURL(bundle.loaderPath).href);
  const configuredDefault = loader.normalizeMode(process.env.HAKIM_DEFAULT_MODE || 'full');
  const sessionModes = new Map();
  let fallbackMode = configuredDefault;

  const log = async (level, message, extra = {}) => {
    try {
      await client?.app?.log?.({
        body: {
          service: 'hakim-opencode',
          level,
          message,
          extra: { bundle_kind: bundle.kind, ...extra },
        },
      });
    } catch {
      // Host logging must never break the coding session.
    }
  };

  return {
    'command.execute.before': async (input) => {
      if (!input || input.command !== 'hakim') return;
      const requested = firstArgument(input.arguments);
      const mode = requested ? (VALID_MODES.has(requested) ? requested : null) : configuredDefault;
      if (!mode) {
        await log('warn', 'Ignored unsupported Hakim mode.', { requested_mode: requested });
        return;
      }
      if (input.sessionID) sessionModes.set(input.sessionID, mode);
      else fallbackMode = mode;
      await log('info', `Hakim mode set to ${mode}.`, { session_id_present: Boolean(input.sessionID) });
    },

    'experimental.chat.system.transform': async (input, output) => {
      const mode = input?.sessionID && sessionModes.has(input.sessionID)
        ? sessionModes.get(input.sessionID)
        : fallbackMode;
      if (mode === 'off') return;
      const instructions = loader.getRules(mode, { skillPath: bundle.skillPath });
      if (!Array.isArray(output.system)) output.system = [];
      if (alreadyContainsRules(output.system, instructions)) return;
      if (output.system.length > 0) output.system[output.system.length - 1] += `\n\n${instructions}`;
      else output.system.push(instructions);
    },

    event: async (payload = {}) => {
      const event = payload?.event || payload;
      if (event?.type !== 'session.deleted') return;
      const sessionID = event?.properties?.info?.id || event?.properties?.sessionID;
      if (sessionID) sessionModes.delete(sessionID);
    },
  };
}

// OpenCode enumerates named exported plugin functions. Keep the default alias
// only for direct import tests and compatible consumers.
export const HakimPlugin = createHakimHooks;
export default HakimPlugin;