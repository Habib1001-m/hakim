import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LEGACY_LEDGER = REPO_ROOT / "core" / "hakim-skill" / "assets" / "technical_debt_ledger.json"
CANONICAL_DEBT = REPO_ROOT / "core" / "hakim-skill" / "skills" / "hakim-debt" / "SKILL.md"


class TechnicalDebtLedgerProvenanceTests(unittest.TestCase):
    def test_synthetic_example_ledger_is_not_shipped(self) -> None:
        self.assertFalse(
            LEGACY_LEDGER.exists(),
            "synthetic debt example dataset must not return to the active skill package",
        )

    def test_debt_capability_does_not_require_example_ledger(self) -> None:
        text = CANONICAL_DEBT.read_text(encoding="utf-8")
        self.assertIn("live-source scan is the capability", text)
        self.assertIn("ledger is optional context", text)
        self.assertIn("ledger: not bundled", text)
        self.assertIn("synthetic_example", text)

    def test_debt_capability_does_not_assume_source_checkout_path(self) -> None:
        text = CANONICAL_DEBT.read_text(encoding="utf-8")
        self.assertIn("source-repository path", text)
        self.assertIn("installed plugin", text)
        self.assertIn("Do not convert examples into live debt", text)


if __name__ == "__main__":
    unittest.main()
