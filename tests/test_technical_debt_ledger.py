import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LEDGER_PATH = REPO_ROOT / "core" / "hakim-skill" / "assets" / "technical_debt_ledger.json"


class TechnicalDebtLedgerProvenanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ledger = json.loads(LEDGER_PATH.read_text(encoding="utf-8"))

    def test_ledger_is_explicitly_synthetic(self) -> None:
        metadata = self.ledger["metadata"]
        self.assertEqual(metadata["data_classification"], "synthetic_example")
        self.assertIs(metadata["repository_claims"], False)
        self.assertIn("not claims about this repository", metadata["description"])

    def test_every_entry_inherits_synthetic_evidence_scope(self) -> None:
        entries = self.ledger["entries"]
        self.assertGreater(len(entries), 0)
        self.assertTrue(
            all(entry.get("evidence_scope") == "synthetic_example" for entry in entries)
        )

    def test_td_006_is_not_a_live_repository_claim(self) -> None:
        entry = next(
            item
            for item in self.ledger["entries"]
            if item["entry_id"] == "TD-20260615-006"
        )
        self.assertEqual(entry["evidence_scope"], "synthetic_example")
        self.assertEqual(entry["related_files"], ["src/api/client.py"])
        self.assertIn(
            "Do not treat any entry",
            self.ledger["usage_instructions"]["interpretation"],
        )


if __name__ == "__main__":
    unittest.main()
