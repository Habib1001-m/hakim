// Hakim OpenCode plugin adapter.
//
// Project-local usage after installation:
//   .opencode/plugins/hakim.js
//
// The adapter does not embed the Hakim ruleset. It resolves the canonical
// loader, capability contract, and skill sources from either this repository
// or the exact install bundle created by scripts/hakim_opencode_install.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALID_MODES = new Set(['lite', 'full', 'ultra', 'off']);
const ACTIVATION_SENTINEL_PREFIX = '<!-- hakim-system:v1 mode=';
const ACTIVATION_SENTINEL_END = '<!-- /hakim-system:v1 -->';

function regularFile(candidate) {
  try {
    const stat = fs.lstatSync(candidate);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function realDirectory(candidate) {
  try {
    const stat = fs.lstatSync(candidate);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function resolveBundle() {
  const candidates = [
    {
      kind: 'REPOSITORY_CANONICAL_SOURCE',
      loaderPath: path.resolve(__dirname, '../../core/loaders/hakim-loader.mjs'),
      skillPath: path.resolve(__dirname, '../../core/hakim-skill/SKILL.md'),
      capabilitiesPath: path.resolve(__dirname, '../../core/hakim-skill/capabilities.json'),
      skillsDir: path.resolve(__dirname, '../../core/hakim-skill/skills'),
    },
    {
      kind: 'PROJECT_LOCAL_INSTALL_BUNDLE',
      loaderPath: path.resolve(__dirname, '../hakim-runtime/loaders/hakim-loader.mjs'),
      skillPath: path.resolve(__dirname, '../hakim-runtime/hakim-skill/SKILL.md'),
      capabilitiesPath: path.resolve(__dirname, '../hakim-runtime/hakim-skill/capabilities.json'),
      skillsDir: path.resolve(__dirname, '../hakim-runtime/hakim-skill/skills'),
    },
  ];

  for (const candidate of candidates) {
    if (
      regularFile(candidate.loaderPath)
      && regularFile(candidate.skillPath)
      && regularFile(candidate.capabilitiesPath)
      && realDirectory(candidate.skillsDir)
    ) {
      return candidate;
    }
  }

  throw new Error('Hakim OpenCode canonical bundle is missing or unsafe. Reinstall the project-local adapter.');
}

function loadCapabilities(capabilitiesPath) {
  const parsed = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8'));
  if (parsed?.schema_version !== 1 || !Array.isArray(parsed.capabilities)) {
    throw new Error('Unsupported Hakim capability contract.');
  }
  for (const capability of parsed.capabilities) {
    if (!capability?.id || !capability?.purpose || !capability?.canonical_path) {
      throw new Error('Malformed Hakim capability record.');
    }
  }
  return parsed.capabilities;
}

function commandDefinition(capability) {
  if (capability.id === 'hakim') {
    return {
      description: 'Set Hakim mode for this OpenCode session: lite, full, ultra, or off.',
      template: 'Apply Hakim mode $1 to this request. Valid modes: lite, full, ultra, off. Request: $ARGUMENTS',
    };
  }
  if (capability.id === 'hakim-help') {
    return {
      description: capability.purpose,
      template: 'Load the `hakim-help` skill with OpenCode\'s native skill tool and show the Hakim quick reference. Do not require additional arguments. Additional user context (optional): $ARGUMENTS',
    };
  }
  return {
    description: capability.purpose,
    template: `Load the \`${capability.id}\` skill with OpenCode's native skill tool and apply it to: $ARGUMENTS`,
  };
}

function firstArgument(value) {
  return String(value || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
}

function stripHakimActivation(value) {
  const text = String(value ?? '');
  const markerIndex = text.lastIndexOf(ACTIVATION_SENTINEL_PREFIX);
  if (markerIndex < 0) return { text, changed: false };

  const endIndex = text.indexOf(ACTIVATION_SENTINEL_END, markerIndex);
  if (endIndex < 0) {
    // An unbounded/legacy marker does not prove ownership of trailing host or plugin text.
    return { text, changed: false };
  }

  const before = text.slice(0, markerIndex).replace(/\s+$/u, '');
  const after = text.slice(endIndex + ACTIVATION_SENTINEL_END.length).replace(/^\s+/u, '');
  return {
    text: [before, after].filter((part) => part.length > 0).join('\n\n'),
    changed: true,
  };
}

function reconcileSystemOutput(output, mode, instructions = null) {
  if (!Array.isArray(output.system)) output.system = [];
  const cleaned = [];
  for (const entry of output.system) {
    const stripped = stripHakimActivation(entry);
    if (stripped.text.length > 0 || !stripped.changed) cleaned.push(stripped.text);
  }
  output.system = cleaned;
  if (mode === 'off') return;

  const block = `${ACTIVATION_SENTINEL_PREFIX}${mode} -->\n${instructions}\n${ACTIVATION_SENTINEL_END}`;
  if (output.system.length > 0) {
    output.system[output.system.length - 1] += `\n\n${block}`;
  } else {
    output.system.push(block);
  }
}

export default async function hakimOpenCodePlugin({ client } = {}) {
  const bundle = resolveBundle();
  const loader = await import(pathToFileURL(bundle.loaderPath).href);
  const capabilities = loadCapabilities(bundle.capabilitiesPath);
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
      // Logging must never break the host session.
    }
  };

  return {
    config: async (config) => {
      config.command = config.command || {};
      for (const capability of capabilities) {
        if (!config.command[capability.id]) config.command[capability.id] = commandDefinition(capability);
      }

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(bundle.skillsDir)) config.skills.paths.push(bundle.skillsDir);
    },

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
      const instructions = mode === 'off' ? null : loader.getRules(mode, { skillPath: bundle.skillPath });
      reconcileSystemOutput(output, mode, instructions);
    },

    event: async (payload = {}) => {
      const event = payload?.event || payload;
      if (event?.type !== 'session.deleted') return;
      const sessionID = event?.properties?.info?.id || event?.properties?.sessionID;
      if (sessionID) sessionModes.delete(sessionID);
    },
  };
}