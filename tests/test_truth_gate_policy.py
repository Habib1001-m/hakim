import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TruthGatePolicyTests(unittest.TestCase):
    def test_structured_authorities_and_negative_tripwire_policy(self) -> None:
        architecture = (ROOT / "docs" / "ARCHITECTURE.md").read_text(encoding="utf-8")
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        acceptance = json.loads(
            (ROOT / "conformance" / "native-host-acceptance.json").read_text(encoding="utf-8")
        )
        capabilities = json.loads(
            (ROOT / "core" / "hakim-skill" / "capabilities.json").read_text(encoding="utf-8")
        )
        version = (ROOT / "core" / "hakim-skill" / "VERSION").read_text(encoding="utf-8").strip()

        self.assertIn("## Truth-gate policy", architecture)
        self.assertIn("Structured facts have structured authorities", architecture)
        self.assertRegex(architecture, re.compile(r"negative tripwires", re.I))
        self.assertRegex(architecture, re.compile(r"not semantic proof", re.I))
        self.assertRegex(architecture, re.compile(r"cannot promote acceptance or release state", re.I))
        self.assertRegex(architecture, re.compile(r"prefer adding or reusing a structured authority", re.I))

        self.assertEqual(package["version"], version)
        self.assertEqual(acceptance["product_version"], version)
        self.assertEqual(acceptance["schema_version"], 1)
        self.assertIn(acceptance["overall_status"], {"PASS", "HOLD_FOR_LIVE_HOST_EVIDENCE"})
        self.assertEqual(capabilities["schema_version"], 1)
        self.assertTrue(capabilities["capabilities"])

        for retired in (
            "scripts/check_metadata_truth_consistency.mjs",
            "scripts/check_current_truth_consistency.mjs",
        ):
            self.assertFalse((ROOT / retired).exists(), f"retired prose-oracle returned: {retired}")

        first_run = (ROOT / "tests" / "test_public_first_run_contract.mjs").read_text(encoding="utf-8")
        self.assertIsNone(
            re.search(r"README[^\n]{0,120}[a-f0-9]{40}", first_run, re.I),
            "first-run gate must not require a hardcoded commit SHA inside README prose",
        )


if __name__ == "__main__":
    unittest.main()
