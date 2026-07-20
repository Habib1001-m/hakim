from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDITOR = ROOT / "core/hakim-skill/scripts/audit_complexity.py"


class AuditComplexityTests(unittest.TestCase):
    def run_target(
        self,
        target: Path,
        intensity: str = "full",
        output: str = "json",
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(AUDITOR),
                str(target),
                "--intensity",
                intensity,
                "--output",
                output,
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )

    def run_audit(self, source: str, intensity: str = "full") -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as tmp:
            sample = Path(tmp) / "sample.py"
            sample.write_text(source, encoding="utf-8")
            return self.run_target(Path(tmp), intensity)

    def test_report_names_bounded_python_coverage(self) -> None:
        result = self.run_audit(
            "import requests\n\ndef use():\n    return requests.get('https://example.com')\n"
        )
        self.assertEqual(result.returncode, 1, result.stderr + result.stdout)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["tool"], "hakim-python-heuristic-scan")
        self.assertEqual(payload["mode"], "READ_ONLY_DETERMINISTIC")
        self.assertEqual(payload["coverage"]["language"], "python")
        self.assertEqual(payload["coverage"]["file_extensions"], [".py"])
        self.assertFalse(payload["coverage"]["repository_wide_complexity_audit"])
        self.assertEqual(payload["coverage"]["correctness_review"], "NOT_PERFORMED")
        self.assertEqual(payload["coverage"]["security_review"], "NOT_PERFORMED")
        self.assertTrue(payload["coverage"]["manual_verification_required"])
        self.assertEqual(
            [rule["id"] for rule in payload["coverage"]["rules"]],
            ["known-third-party-import-review", "too-many-positional-parameters"],
        )
        finding = payload["violations"][0]
        self.assertEqual(finding["rule_id"], "known-third-party-import-review")
        self.assertEqual(finding["type"], "third_party_import_review")
        self.assertIn("does not prove it is removable", finding["message"])
        self.assertEqual(payload["summary"]["total_findings"], 1)

    def test_intensity_is_explicitly_provenance_only(self) -> None:
        source = "def use(a, b, c, d, e, f, g):\n    return a\n"
        lite = self.run_audit(source, "lite")
        ultra = self.run_audit(source, "ultra")
        self.assertEqual(lite.returncode, 1, lite.stderr + lite.stdout)
        self.assertEqual(ultra.returncode, 1, ultra.stderr + ultra.stdout)
        lite_payload = json.loads(lite.stdout)
        ultra_payload = json.loads(ultra.stdout)
        self.assertEqual(lite_payload["intensity_semantics"], "PROVENANCE_LABEL_ONLY")
        self.assertEqual(ultra_payload["intensity_semantics"], "PROVENANCE_LABEL_ONLY")
        self.assertFalse(lite_payload["intensity_applies_to_rules"])
        self.assertFalse(ultra_payload["intensity_applies_to_rules"])
        self.assertEqual(lite_payload["coverage"], ultra_payload["coverage"])
        self.assertEqual(lite_payload["violations"], ultra_payload["violations"])

    def test_only_python_files_are_scanned(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "sample.py").write_text("def ok():\n    return 1\n", encoding="utf-8")
            (root / "sample.js").write_text("import requests from 'requests';\n", encoding="utf-8")
            result = self.run_target(root)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["summary"]["files_scanned"], 1)
        self.assertEqual(payload["summary"]["total_findings"], 0)

    def test_non_python_file_target_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "sample.js"
            target.write_text("export default 1;\n", encoding="utf-8")
            result = self.run_target(target)
        self.assertEqual(result.returncode, 2)
        self.assertIn("target file must use the .py suffix", result.stderr)
        self.assertEqual(result.stdout, "")

    def test_missing_target_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = self.run_target(Path(tmp) / "missing")
        self.assertEqual(result.returncode, 2)
        self.assertIn("target does not exist", result.stderr)
        self.assertEqual(result.stdout, "")

    def test_text_output_cannot_be_mistaken_for_repository_wide_audit(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "sample.py"
            target.write_text("def ok():\n    return 1\n", encoding="utf-8")
            result = self.run_target(target, output="text")
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        self.assertIn("HAKIM PYTHON HEURISTIC SCAN", result.stdout)
        self.assertIn("Repository-wide complexity audit: NOT_PERFORMED", result.stdout)
        self.assertIn("Correctness review: NOT_PERFORMED", result.stdout)
        self.assertIn("Security review: NOT_PERFORMED", result.stdout)
        self.assertNotIn("Lean already. Ship.", result.stdout)


if __name__ == "__main__":
    unittest.main()
