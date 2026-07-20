from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PackageSkillTests(unittest.TestCase):
    def test_package_builds_and_contains_required_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "hakim-skill.zip"
            result = subprocess.run(
                [sys.executable, str(ROOT / "core/hakim-skill/scripts/package_skill.py"),
                 "--source", str(ROOT / "core/hakim-skill"), "--output", str(output)],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            with zipfile.ZipFile(output) as zf:
                names = set(zf.namelist())
            self.assertIn("hakim-skill/SKILL.md", names)
            self.assertIn("hakim-skill/AGENTS.md", names)
            self.assertIn("hakim-skill/LICENSE", names)
            self.assertIn("hakim-skill/THIRD_PARTY_NOTICES.md", names)
            self.assertIn("hakim-skill/conformance/policy-profiles.json", names)
            self.assertIn("hakim-skill/conformance/suite.json", names)
            self.assertIn("hakim-skill/conformance/adapter-bindings.json", names)
            self.assertIn("hakim-skill/conformance/runtime-scenarios.json", names)
            self.assertIn("hakim-skill/conformance/runtime-evidence.schema.json", names)
            self.assertIn("hakim-skill/scripts/check_rule_copies.js", names)


if __name__ == "__main__":
    unittest.main()
