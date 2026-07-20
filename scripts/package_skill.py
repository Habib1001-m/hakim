#!/usr/bin/env python3
"""Root wrapper for the canonical Hakim skill packager."""
from __future__ import annotations

import runpy
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "core" / "hakim-skill" / "scripts" / "package_skill.py"
runpy.run_path(str(SCRIPT), run_name="__main__")
