from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "build_release_checksums.py"
SPEC = importlib.util.spec_from_file_location("build_release_checksums", SCRIPT_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReleaseChecksumTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.version_file = self.root / "VERSION"
        self.version_file.write_text("1.0.0\n", encoding="utf-8")
        self.artifact = self.root / "hakim-skill.zip"
        self.artifact.write_bytes(b"deterministic-hakim-release-artifact")
        self.checksums = self.root / "SHA256SUMS"
        self.manifest = self.root / "release-manifest.json"

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_generate_and_verify_bundle(self) -> None:
        generated = MODULE.generate_bundle(
            [self.artifact],
            self.version_file,
            self.checksums,
            self.manifest,
        )
        self.assertEqual(generated["status"], "PASS")
        self.assertEqual(generated["mode"], "GENERATE")
        self.assertEqual(generated["artifact_count"], 1)

        checksum_line = self.checksums.read_text(encoding="utf-8")
        self.assertRegex(checksum_line, r"^[0-9a-f]{64}  hakim-skill\.zip\n$")
        manifest = json.loads(self.manifest.read_text(encoding="utf-8"))
        self.assertEqual(manifest["schema_version"], 1)
        self.assertEqual(manifest["hakim_version"], "1.0.0")
        self.assertEqual(manifest["algorithm"], "sha256")
        self.assertEqual(manifest["artifact_count"], 1)
        self.assertEqual(manifest["artifacts"][0]["filename"], "hakim-skill.zip")
        self.assertEqual(manifest["artifacts"][0]["size_bytes"], self.artifact.stat().st_size)

        verified = MODULE.verify_bundle(
            [self.artifact],
            self.version_file,
            self.checksums,
            self.manifest,
        )
        self.assertEqual(verified["mode"], "VERIFY")
        self.assertEqual(verified["artifacts"], manifest["artifacts"])

    def test_tampered_artifact_fails_verification(self) -> None:
        MODULE.generate_bundle(
            [self.artifact],
            self.version_file,
            self.checksums,
            self.manifest,
        )
        self.artifact.write_bytes(b"tampered")
        with self.assertRaises(MODULE.VerificationError):
            MODULE.verify_bundle(
                [self.artifact],
                self.version_file,
                self.checksums,
                self.manifest,
            )

    def test_tampered_manifest_fails_verification(self) -> None:
        MODULE.generate_bundle(
            [self.artifact],
            self.version_file,
            self.checksums,
            self.manifest,
        )
        payload = json.loads(self.manifest.read_text(encoding="utf-8"))
        payload["hakim_version"] = "9.9.9"
        self.manifest.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaises(MODULE.VerificationError):
            MODULE.verify_bundle(
                [self.artifact],
                self.version_file,
                self.checksums,
                self.manifest,
            )

    def test_duplicate_basenames_are_refused(self) -> None:
        second_directory = self.root / "other"
        second_directory.mkdir()
        second_artifact = second_directory / self.artifact.name
        second_artifact.write_bytes(b"different")
        with self.assertRaises(MODULE.ContractError):
            MODULE.generate_bundle(
                [self.artifact, second_artifact],
                self.version_file,
                self.checksums,
                self.manifest,
            )

    def test_symlink_artifact_is_refused(self) -> None:
        link = self.root / "linked.zip"
        try:
            link.symlink_to(self.artifact)
        except (OSError, NotImplementedError):
            self.skipTest("symlinks are unavailable")
        with self.assertRaises(MODULE.ContractError):
            MODULE.generate_bundle(
                [link],
                self.version_file,
                self.checksums,
                self.manifest,
            )

    def test_symlink_output_is_refused(self) -> None:
        real_checksums = self.root / "real-checksums"
        real_checksums.write_text("preserve me", encoding="utf-8")
        try:
            self.checksums.symlink_to(real_checksums)
        except (OSError, NotImplementedError):
            self.skipTest("symlinks are unavailable")
        with self.assertRaises(MODULE.ContractError):
            MODULE.generate_bundle(
                [self.artifact],
                self.version_file,
                self.checksums,
                self.manifest,
            )
        self.assertEqual(real_checksums.read_text(encoding="utf-8"), "preserve me")

    def test_cli_generate_and_verify(self) -> None:
        common = [
            sys.executable,
            str(SCRIPT_PATH),
            "--artifact",
            str(self.artifact),
            "--version-file",
            str(self.version_file),
            "--checksums",
            str(self.checksums),
            "--manifest",
            str(self.manifest),
            "--json",
        ]
        generated = subprocess.run(common, capture_output=True, text=True, check=False)
        self.assertEqual(generated.returncode, 0, generated.stderr)
        self.assertEqual(json.loads(generated.stdout)["mode"], "GENERATE")

        verified = subprocess.run(
            [*common, "--verify"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(verified.returncode, 0, verified.stderr)
        self.assertEqual(json.loads(verified.stdout)["mode"], "VERIFY")


if __name__ == "__main__":
    unittest.main()
