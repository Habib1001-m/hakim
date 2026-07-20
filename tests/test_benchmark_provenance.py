import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
CANONICAL = ROOT / "core" / "hakim-skill" / "SKILL.md"
BENCHMARK = ROOT / "core" / "hakim-skill" / "assets" / "benchmark_results.md"


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

        self.assertIn("Independent Hakim benchmark: NOT_ESTABLISHED", text)
        self.assertIn("Quantified performance or ROI claims: HOLD", text)
        self.assertIn("Ponytail-derived values", text)
        self.assertIn("not accepted as independent Hakim", text)

    def test_benchmark_asset_is_a_provenance_contract(self):
        text = BENCHMARK.read_text(encoding="utf-8")
        required = (
            "Accepted independent Hakim benchmark:** no",
            "INDEPENDENT_HAKIM_BENCHMARK=NOT_ESTABLISHED",
            "PREVIOUS_HAKIM_PERFORMANCE_CLAIMS=WITHDRAWN",
            "PREVIOUS_STATISTICAL_CLAIMS=WITHDRAWN",
            "PUBLIC_PERFORMANCE_OR_ROI_CLAIMS=HOLD",
            "Minimum contract for a future Hakim benchmark",
            "No quantified performance or ROI statement is currently accepted.",
        )
        for fragment in required:
            self.assertIn(fragment, text)

        unsupported_claims = (
            "Hakim skill delivers **measurable, statistically significant improvements**",
            "All improvements statistically significant",
            "Cohen's d",
            "True improvement likely",
        )
        for fragment in unsupported_claims:
            self.assertNotIn(fragment, text)

    def test_runtime_validation_is_not_benchmark_validation(self):
        text = BENCHMARK.read_text(encoding="utf-8")
        self.assertIn("RUNTIME_ADAPTER_PASS_IMPLIES_BENCHMARK_PASS=NO", text)
        self.assertIn("does not prove", text)


if __name__ == "__main__":
    unittest.main()
