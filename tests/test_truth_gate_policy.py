import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TruthGatePolicyTests(unittest.TestCase):
    def test_structured_authorities_and_reader_facing_projection_policy(self) -> None:
        architecture = (ROOT / "docs" / "ARCHITECTURE.md").read_text(encoding="utf-8")
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        acceptance = json.loads(
            (ROOT / "conformance" / "native-host-acceptance.json").read_text(encoding="utf-8")
        )
        capabilities = json.loads(
            (ROOT / "core" / "hakim-skill" / "capabilities.json").read_text(encoding="utf-8")
        )
        version = (ROOT / "core" / "hakim-skill" / "VERSION").read_text(encoding="utf-8").strip()
        history_dir = ROOT / "conformance" / "history"

        self.assertIn("## Truth-gate policy", architecture)
        self.assertIn("Structured facts have structured authorities", architecture)
        self.assertRegex(architecture, re.compile(r"machine-readable or structural sources", re.I))
        self.assertRegex(architecture, re.compile(r"prose order is not a product invariant", re.I))
        self.assertRegex(
            architecture,
            re.compile(r"structured authority.*focused test", re.I | re.S),
        )

        # Product identity and current acceptance are structural authorities.
        self.assertEqual(package["version"], version)
        self.assertEqual(acceptance["product_version"], version)
        self.assertEqual(acceptance["schema_version"], 1)
        self.assertIn(acceptance["overall_status"], {"PASS", "HOLD_FOR_LIVE_HOST_EVIDENCE"})
        self.assertEqual(capabilities["schema_version"], 1)
        self.assertTrue(capabilities["capabilities"])

        # Historical evidence has its own retained structural surface rather than
        # being inferred from a sentence in current documentation.
        self.assertTrue(history_dir.is_dir())
        history_files = sorted(history_dir.glob("native-host-acceptance-*.json"))
        self.assertTrue(history_files, "historical acceptance authority must remain populated")
        for path in history_files:
            historical = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(historical["schema_version"], 1)
            self.assertNotEqual(historical["product_version"], "")

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

        # The public-doc gate may enforce reader-facing structure and reject stale
        # operational surfaces, but it must not copy-lock one status sentence or
        # milestone ordering into the product contract.
        self.assertIsNone(
            re.search(r"readme\.includes\(['\"]Hakim `['\"]\s*\+\s*version", first_run),
            "first-run gate must not copy-lock README status prose",
        )
        self.assertNotIn("P0 before F05", first_run)
        self.assertIn("retiredOperationalDocs", first_run)


if __name__ == "__main__":
    unittest.main()
