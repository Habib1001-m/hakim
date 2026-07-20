"""Hakim shared Python loader helpers.

Stdlib-only helpers used by tests, packaging commands, and future adapters.
"""
from __future__ import annotations

from pathlib import Path

VALID_MODES = {"lite", "full", "ultra", "off"}


def normalize_mode(mode: str = "full") -> str:
    value = (mode or "full").strip().lower()
    return value if value in VALID_MODES else "full"


def canonical_skill_path() -> Path:
    return Path(__file__).resolve().parents[1] / "hakim-skill" / "SKILL.md"


def load_skill_content(path: Path | None = None) -> str:
    return (path or canonical_skill_path()).read_text(encoding="utf-8")


def get_mode_directive(mode: str = "full") -> str:
    directives = {
        "lite": "Build what is asked, then name the lazier alternative in one line.",
        "full": "Enforce the Hakim ladder with reuse, stdlib, native platform features, and shortest safe diffs.",
        "ultra": "YAGNI extremist mode: delete before adding and ship the minimum safe change.",
        "off": "Hakim guidance disabled for this session.",
    }
    return directives[normalize_mode(mode)]


def get_rules(mode: str = "full", path: Path | None = None) -> str:
    normalized = normalize_mode(mode)
    if normalized == "off":
        return "# Hakim disabled\n\nHakim guidance is off for this session.\n"
    return "\n".join([
        f"# Hakim activation ({normalized})",
        "",
        get_mode_directive(normalized),
        "",
        "Canonical source: core/hakim-skill/SKILL.md",
        "",
        load_skill_content(path),
    ])
