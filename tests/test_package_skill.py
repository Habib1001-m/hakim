from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGER = ROOT / "core/hakim-skill/scripts/package_skill.py"
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
FIXED_ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FIXED_FILE_MODE = 0o100644


def build_package(source: Path, output: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(PACKAGER),
            "--source",
            str(source),
            "--output",
            str(output),
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )


class PackageSkillTests(unittest.TestCase):
    def test_package_builds_and_contains_only_maintained_surface(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "hakim-skill.zip"
            result = build_package(ROOT / "core/hakim-skill", output)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            with zipfile.ZipFile(output) as zf:
                names = set(zf.namelist())
                infos = zf.infolist()

            self.assertTrue(ALLOWED_ROOT_MEMBERS.issubset(names))
            self.assertIn("hakim-skill/conformance/policy-profiles.json", names)
            self.assertIn("hakim-skill/conformance/suite.json", names)
            self.assertIn("hakim-skill/conformance/adapter-bindings.json", names)
            self.assertIn("hakim-skill/conformance/runtime-scenarios.json", names)
            self.assertIn("hakim-skill/conformance/runtime-evidence.schema.json", names)
            self.assertIn("hakim-skill/scripts/check_rule_copies.js", names)

            for info in infos:
                name = info.filename
                parts = Path(name).parts
                self.assertEqual(parts[0], "hakim-skill")
                self.assertEqual(info.date_time, FIXED_ZIP_TIMESTAMP)
                self.assertEqual(info.create_system, 3)
                self.assertEqual(info.external_attr >> 16, FIXED_FILE_MODE)
                if len(parts) == 2:
                    self.assertIn(name, ALLOWED_ROOT_MEMBERS)
                else:
                    self.assertIn(parts[1], ALLOWED_SUBDIRS)

            self.assertNotIn("hakim-skill/assets/benchmark_results.md", names)
            self.assertNotIn("hakim-skill/assets/technical_debt_ledger.json", names)
            self.assertFalse(any(name.startswith("hakim-skill/references/") for name in names))

    def test_package_is_byte_reproducible_across_source_mtime_changes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            source = tmp_root / "source"
            shutil.copytree(ROOT / "core/hakim-skill", source)
            first = tmp_root / "first.zip"
            second = tmp_root / "second.zip"

            first_result = build_package(source, first)
            self.assertEqual(first_result.returncode, 0, first_result.stderr + first_result.stdout)

            touched = source / "SKILL.md"
            stat = touched.stat()
            os.utime(touched, ns=(stat.st_atime_ns, stat.st_mtime_ns + 5_000_000_000))

            second_result = build_package(source, second)
            self.assertEqual(second_result.returncode, 0, second_result.stderr + second_result.stdout)

            first_bytes = first.read_bytes()
            second_bytes = second.read_bytes()
            self.assertEqual(first_bytes, second_bytes)
            self.assertEqual(hashlib.sha256(first_bytes).hexdigest(), hashlib.sha256(second_bytes).hexdigest())


if __name__ == "__main__":
    unittest.main()
