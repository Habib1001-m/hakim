from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "build_release_sbom.py"
VERSION = (ROOT / "core" / "hakim-skill" / "VERSION").read_text(encoding="utf-8").strip()


class ReleaseSbomTests(unittest.TestCase):
    def run_builder(self, output: Path, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--root", str(ROOT), "--output", str(output), *extra],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_build_is_deterministic_and_verifiable(self) -> None:
        with tempfile.TemporaryDirectory(prefix="hakim-sbom-") as temporary:
            first = Path(temporary) / "first.cdx.json"
            second = Path(temporary) / "second.cdx.json"

            first_run = self.run_builder(first)
            self.assertEqual(first_run.returncode, 0, first_run.stderr)
            second_run = self.run_builder(second)
            self.assertEqual(second_run.returncode, 0, second_run.stderr)
            self.assertEqual(first.read_bytes(), second.read_bytes())

            verify = self.run_builder(first, "--verify")
            self.assertEqual(verify.returncode, 0, verify.stderr)

            payload = json.loads(first.read_text(encoding="utf-8"))
            self.assertEqual(payload["bomFormat"], "CycloneDX")
            self.assertEqual(payload["specVersion"], "1.5")
            self.assertEqual(payload["metadata"]["component"]["version"], VERSION)
            self.assertTrue(payload["serialNumber"].startswith("urn:uuid:"))

            components = payload["components"]
            names = {component["name"] for component in components}
            self.assertIn("package.json", names)
            self.assertIn("core/hakim-skill/SKILL.md", names)
            self.assertIn("plugins/opencode/hakim.mjs", names)
            self.assertNotIn("dist/hakim-sbom.cdx.json", names)
            self.assertTrue(all(component["type"] == "file" for component in components))
            self.assertTrue(
                all(component["hashes"][0]["alg"] == "SHA-256" for component in components)
            )

    def test_verify_rejects_modified_sbom(self) -> None:
        with tempfile.TemporaryDirectory(prefix="hakim-sbom-tamper-") as temporary:
            output = Path(temporary) / "hakim.cdx.json"
            build = self.run_builder(output)
            self.assertEqual(build.returncode, 0, build.stderr)
            output.write_text("{}\n", encoding="utf-8")

            verify = self.run_builder(output, "--verify")
            self.assertNotEqual(verify.returncode, 0)
            self.assertIn("does not match", verify.stderr)


if __name__ == "__main__":
    unittest.main()
