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
EXPECTED = {
    "hakim-skill/SKILL.md",
    "hakim-skill/INSTALL.md",
    "hakim-skill/README.md",
    "hakim-skill/LICENSE",
    "hakim-skill/THIRD_PARTY_NOTICES.md",
    "hakim-skill/VERSION",
    "hakim-skill/capabilities.json",
    "hakim-skill/scripts/audit_complexity.py",
    "hakim-skill/skills/review/SKILL.md",
    "hakim-skill/skills/audit/SKILL.md",
    "hakim-skill/skills/debt/SKILL.md",
    "hakim-skill/skills/status/SKILL.md",
    "hakim-skill/skills/help/SKILL.md",
}
FIXED_ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FIXED_FILE_MODE = 0o100644


def build_package(source: Path, output: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(PACKAGER), "--source", str(source), "--output", str(output)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )


class PackageSkillTests(unittest.TestCase):
    def test_package_contains_exact_product_surface(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "hakim-skill.zip"
            result = build_package(ROOT / "core/hakim-skill", output)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            with zipfile.ZipFile(output) as archive:
                infos = archive.infolist()
                names = {info.filename for info in infos}
            self.assertEqual(names, EXPECTED)
            for info in infos:
                self.assertEqual(info.date_time, FIXED_ZIP_TIMESTAMP)
                self.assertEqual(info.create_system, 3)
                self.assertEqual(info.external_attr >> 16, FIXED_FILE_MODE)
            self.assertFalse(any("conformance/" in name for name in names))
            self.assertFalse(any("hakim-gain" in name or "hakim-review" in name or "hakim-audit" in name or "hakim-debt" in name or "hakim-help" in name for name in names))
            self.assertNotIn("hakim-skill/AGENTS.md", names)
            self.assertNotIn("hakim-skill/MIGRATION.md", names)
            self.assertNotIn("hakim-skill/scripts/package_skill.py", names)

    def test_package_is_byte_reproducible_across_mtime_changes(self) -> None:
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
            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(hashlib.sha256(first.read_bytes()).hexdigest(), hashlib.sha256(second.read_bytes()).hexdigest())

    def test_package_rejects_invalid_skill_frontmatter(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            source = tmp_root / "source"
            shutil.copytree(ROOT / "core/hakim-skill", source)
            skill = source / "skills" / "help" / "SKILL.md"
            text = skill.read_text(encoding="utf-8")
            text = text.replace(
                "description: Show the six Hakim capabilities, modes, host-native invocation patterns, and trust boundaries without embedding release history, candidate SHAs, or stale acceptance state.",
                "description: [broken] trailing-token",
                1,
            )
            skill.write_text(text, encoding="utf-8")
            result = build_package(source, tmp_root / "out.zip")
            self.assertNotEqual(result.returncode, 0, result.stderr + result.stdout)
            self.assertIn("frontmatter", (result.stderr + result.stdout).lower())

    def test_package_rejects_symlinked_required_helper(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            source = tmp_root / "source"
            shutil.copytree(ROOT / "core/hakim-skill", source)
            helper = source / "scripts" / "audit_complexity.py"
            target = tmp_root / "helper.py"
            target.write_text(helper.read_text(encoding="utf-8"), encoding="utf-8")
            helper.unlink()
            helper.symlink_to(target)
            result = build_package(source, tmp_root / "out.zip")
            self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
