from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "core/hakim-skill"


class CIGateRegressionTests(unittest.TestCase):
    def test_packager_excludes_existing_output_inside_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "skill"
            source.mkdir()
            for directory in ["scripts", "skills", "conformance"]:
                (source / directory).mkdir()

            fixtures = {
                "SKILL.md": "---\nname: hakim\ndescription: test\nargument-hint: x\n---\n",
                "AGENTS.md": "# agents\n",
                "INSTALL.md": "# install\n",
                "README.md": "# readme\n",
                "LICENSE": "MIT\n",
                "THIRD_PARTY_NOTICES.md": "# notices\n",
                "VERSION": "0.0.0-test\n",
                "capabilities.json": "{}\n",
            }
            for name, content in fixtures.items():
                (source / name).write_text(content, encoding="utf-8")

            output = source / "hakim-skill-package.zip"
            output.write_bytes(b"stale package")

            result = subprocess.run(
                [
                    sys.executable,
                    str(SKILL / "scripts/package_skill.py"),
                    "--source",
                    str(source),
                    "--output",
                    str(output),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            with zipfile.ZipFile(output) as archive:
                names = set(archive.namelist())
            self.assertNotIn("hakim-skill/hakim-skill-package.zip", names)

    def test_audit_parse_error_returns_execution_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sample = Path(tmp) / "broken.py"
            sample.write_text("def broken(:\n", encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    str(SKILL / "scripts/audit_complexity.py"),
                    tmp,
                    "--output",
                    "json",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["summary"]["files_with_errors"], 1)


if __name__ == "__main__":
    unittest.main()
