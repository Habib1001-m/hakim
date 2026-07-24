from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_ROOT_MEMBERS = {
    "hakim-skill/SKILL.md",
    "hakim-skill/AGENTS.md",
    "hakim-skill/INSTALL.md",
    "hakim-skill/README.md",
    "hakim-skill/LICENSE",
    "hakim-skill/THIRD_PARTY_NOTICES.md",
    "hakim-skill/VERSION",
    "hakim-skill/capabilities.json",
}
ALLOWED_SUBDIRS = {"scripts", "skills", "conformance"}


class PackageSkillTests(unittest.TestCase):
    def test_package_builds_and_contains_only_maintained_surface(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "hakim-skill.zip"
            result = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "core/hakim-skill/scripts/package_skill.py"),
                    "--source",
                    str(ROOT / "core/hakim-skill"),
                    "--output",
                    str(output),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            with zipfile.ZipFile(output) as zf:
                names = set(zf.namelist())

            self.assertTrue(ALLOWED_ROOT_MEMBERS.issubset(names))
            self.assertIn("hakim-skill/conformance/policy-profiles.json", names)
            self.assertIn("hakim-skill/conformance/suite.json", names)
            self.assertIn("hakim-skill/conformance/adapter-bindings.json", names)
            self.assertIn("hakim-skill/conformance/runtime-scenarios.json", names)
            self.assertIn("hakim-skill/conformance/runtime-evidence.schema.json", names)
            self.assertIn("hakim-skill/scripts/check_rule_copies.js", names)

            for name in names:
                parts = Path(name).parts
                self.assertEqual(parts[0], "hakim-skill")
                if len(parts) == 2:
                    self.assertIn(name, ALLOWED_ROOT_MEMBERS)
                else:
                    self.assertIn(parts[1], ALLOWED_SUBDIRS)

            self.assertNotIn("hakim-skill/assets/benchmark_results.md", names)
            self.assertNotIn("hakim-skill/assets/technical_debt_ledger.json", names)
            self.assertFalse(any(name.startswith("hakim-skill/references/") for name in names))


if __name__ == "__main__":
    unittest.main()
