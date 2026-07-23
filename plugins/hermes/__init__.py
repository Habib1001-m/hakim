"""Native Hermes Agent integration for Hakim.

This plugin deliberately adds no tools, MCP servers, or built-in tool overrides.
It registers Hakim as namespaced read-only skill content plus ergonomic slash
commands. Hermes remains authoritative for plugin enablement and permissions.
"""

from pathlib import Path
from typing import Any

_PLUGIN_DIR = Path(__file__).parent
_SKILLS_DIR = _PLUGIN_DIR / "skills"

_CAPABILITIES = {
    "hakim": "hakim",
    "hakim-review": "hakim-review",
    "hakim-audit": "hakim-audit",
    "hakim-debt": "hakim-debt",
    "hakim-gain": "hakim-gain",
    "hakim-help": "hakim-help",
}

_DESCRIPTIONS = {
    "hakim": "Apply Hakim's smallest-safe-diff workflow.",
    "hakim-review": "Review the requested diff or files for removable complexity.",
    "hakim-audit": "Run an evidence-bound read-only complexity audit.",
    "hakim-debt": "Inspect live Hakim technical-debt markers and provenance.",
    "hakim-gain": "Report what current Hakim evidence actually establishes.",
    "hakim-help": "Show Hakim modes, capabilities, host UX, and evidence boundaries.",
}


def _qualified(skill_name: str) -> str:
    return f"hakim:{skill_name}"


def _activation_prompt(command: str, raw_args: str = "") -> str:
    skill_name = _CAPABILITIES[command]
    qualified = _qualified(skill_name)
    task = (raw_args or "").strip()
    instruction = (
        f'Load the Hermes plugin skill "{qualified}" with skill_view("{qualified}") '
        "and follow that skill for this turn."
    )
    if task:
        instruction += f" User request: {task}"
    elif command == "hakim-help":
        instruction += " Show the host-aware Hakim quick reference."
    else:
        instruction += " Apply it to the user's current requested scope; do not invent missing scope."
    return instruction


def _make_command_handler(ctx: Any, command: str):
    def handler(raw_args: str):
        prompt = _activation_prompt(command, raw_args)
        # In the interactive CLI, queue a real agent turn instead of merely
        # printing command help. Gateway messages are rewritten by the hook
        # below before slash-command dispatch, so this fallback remains safe.
        if ctx.inject_message(prompt, role="user"):
            return f"⚡ /{command}: queued {_qualified(_CAPABILITIES[command])}."
        return prompt

    return handler


def _rewrite_gateway_command(**kwargs):
    event = kwargs.get("event")
    text = getattr(event, "text", "") or ""
    if not isinstance(text, str) or not text.startswith("/"):
        return None

    head, _, tail = text[1:].partition(" ")
    command = head.strip().lower().replace("_", "-")
    if command not in _CAPABILITIES:
        return None
    return {"action": "rewrite", "text": _activation_prompt(command, tail)}


def _first_turn_context(**kwargs):
    if not kwargs.get("is_first_turn"):
        return None
    return {
        "context": (
            "Hakim is installed as the enabled Hermes plugin `hakim`. "
            "Its six workflows are namespaced skills (`hakim:hakim`, "
            "`hakim:hakim-review`, `hakim:hakim-audit`, `hakim:hakim-debt`, "
            "`hakim:hakim-gain`, `hakim:hakim-help`) and matching `/hakim*` "
            "commands. Load a skill only when its workflow is relevant; do not "
            "preload all Hakim instructions."
        )
    }


def register(ctx):
    for skill_name in _CAPABILITIES.values():
        skill_md = _SKILLS_DIR / skill_name / "SKILL.md"
        ctx.register_skill(skill_name, skill_md, _DESCRIPTIONS[skill_name])

    for command in _CAPABILITIES:
        args_hint = "[lite|full|ultra|off] [task]" if command == "hakim" else "[task or scope]"
        ctx.register_command(
            command,
            _make_command_handler(ctx, command),
            _DESCRIPTIONS[command],
            args_hint=args_hint,
        )

    ctx.register_hook("pre_gateway_dispatch", _rewrite_gateway_command)
    ctx.register_hook("pre_llm_call", _first_turn_context)
