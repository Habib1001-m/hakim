import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
CANONICAL = ROOT / "core" / "hakim-skill" / "SKILL.md"
LEGACY_BENCHMARK = ROOT / "core" / "hakim-skill" / "assets" / "benchmark_results.md"


class BenchmarkProvenanceTests(unittest.TestCase):
    def test_canonical_skill_does_not_claim_withdrawn_metrics(self):
        text = CANONICAL.read_text(encoding="utf-8")
        withdrawn_fragments = (
            "**-54%**",
            "**-22%**",
            "**-20%**",
            "**-27%**",
            "safety 100%",
            "statistically significant improvements",
        )
        for fragment in withdrawn_fragments:
            self.assertNotIn(fragment.lower(), text.lower())

        self.assertIn("does not claim an independent benchmark result", text)
        self.assertIn("return on investment without", text)
        self.assertIn("Ponytail-derived values", text)
        self.assertIn("not accepted as independent Hakim", text)

    def test_legacy_benchmark_asset_is_not_shipped(self):
        self.assertFalse(
            LEGACY_BENCHMARK.exists(),
            "withdrawn benchmark-era documentation must not return to the active skill package",
        )

    def test_runtime_validation_is_not_promoted_to_benchmark_evidence(self):
        text = CANONICAL.read_text(encoding="utf-8")
        self.assertIn("Host runtime validation remains environment-specific", text)
        self.assertIn("does not establish", text)
        self.assertIn("independent benchmark result", text)
        self.assertIn("separate accepted evidence", text)


if __name__ == "__main__":
    unittest.main()
