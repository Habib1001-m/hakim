from __future__ import annotations

import hashlib
import importlib.util
import json
import shutil
import stat
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "verify_downloaded_release_bundle.py"
SPEC = importlib.util.spec_from_file_location("verify_downloaded_release_bundle", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

REQUIRED = sorted(MODULE.REQUIRED_MEMBERS)
VERSION = "1.0.0"


def digest(path: Path) -> str:
    value = hashlib.sha256()
    value.update(path.read_bytes())
    return value.hexdigest()


def create_zip(path: Path, *, unsafe: bool = False, symlink: bool = False) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in REQUIRED:
            content = VERSION + "\n" if name == "hakim-skill/VERSION" else f"fixture:{name}\n"
            archive.writestr(name, content)
        if unsafe:
            archive.writestr("../escape.txt", "unsafe")
        if symlink:
            info = zipfile.ZipInfo("hakim-skill/link")
            info.create_system = 3
            info.external_attr = (stat.S_IFLNK | 0o777) << 16
            archive.writestr(info, "target")


def write_metadata(bundle: Path) -> None:
    zip_path = bundle / "hakim-skill.zip"
    sha256 = digest(zip_path)
    size = zip_path.stat().st_size
    (bundle / "SHA256SUMS").write_text(f"{sha256}  hakim-skill.zip\n", encoding="utf-8")
    (bundle / "release-manifest.json").write_text(
        json.dumps(
            {
                "algorithm": "sha256",
                "artifact_count": 1,
                "artifacts": [
                    {
                        "filename": "hakim-skill.zip",
                        "sha256": sha256,
                        "size_bytes": size,
                    }
                ],
                "hakim_version": VERSION,
                "schema_version": 1,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )


def create_bundle(root: Path, *, unsafe: bool = False, symlink: bool = False) -> Path:
    bundle = root / "bundle"
    bundle.mkdir()
    create_zip(bundle / "hakim-skill.zip", unsafe=unsafe, symlink=symlink)
    write_metadata(bundle)
    return bundle


def snapshot(bundle: Path) -> dict[str, tuple[int, str]]:
    return {
        item.name: (item.stat().st_size, digest(item))
        for item in bundle.iterdir()
        if item.is_file()
    }


class DownloadedReleaseBundleTests(unittest.TestCase):
    def test_valid_bundle_passes_without_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp))
            before = snapshot(bundle)
            result = MODULE.verify_downloaded_bundle(bundle, VERSION)
            self.assertEqual(result["status"], "PASS")
            self.assertEqual(result["mode"], "CLEAN_ROOM_VERIFY")
            self.assertFalse(result["mutation_performed"])
            self.assertEqual(result["hakim_version"], VERSION)
            self.assertEqual(result["artifact"]["sha256"], digest(bundle / "hakim-skill.zip"))
            self.assertEqual(result["artifact"]["packaged_version"], VERSION)
            self.assertEqual(before, snapshot(bundle))

    def test_tampered_zip_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp))
            with (bundle / "hakim-skill.zip").open("ab") as handle:
                handle.write(b"tamper")
            with self.assertRaisesRegex(MODULE.VerificationError, "SHA256SUMS"):
                MODULE.verify_downloaded_bundle(bundle, VERSION)

    def test_tampered_manifest_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp))
            manifest_path = bundle / "release-manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["hakim_version"] = "9.9.9"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.assertRaisesRegex(MODULE.VerificationError, "expected"):
                MODULE.verify_downloaded_bundle(bundle, VERSION)

    def test_unsafe_zip_path_is_refused_even_with_matching_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp), unsafe=True)
            with self.assertRaisesRegex(MODULE.VerificationError, "outside hakim-skill"):
                MODULE.verify_downloaded_bundle(bundle, VERSION)

    def test_zip_symlink_is_refused_even_with_matching_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp), symlink=True)
            with self.assertRaisesRegex(MODULE.VerificationError, "symlink"):
                MODULE.verify_downloaded_bundle(bundle, VERSION)

    def test_unexpected_bundle_file_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp))
            (bundle / "extra.txt").write_text("unexpected", encoding="utf-8")
            with self.assertRaisesRegex(MODULE.ContractError, "unexpected files"):
                MODULE.verify_downloaded_bundle(bundle, VERSION)

    def test_bundle_directory_symlink_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bundle = create_bundle(root)
            link = root / "bundle-link"
            try:
                link.symlink_to(bundle, target_is_directory=True)
            except OSError:
                self.skipTest("directory symlinks are not supported on this platform")
            with self.assertRaisesRegex(MODULE.ContractError, "must not be a symlink"):
                MODULE.verify_downloaded_bundle(link, VERSION)

    def test_checksum_requires_canonical_single_line(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            bundle = create_bundle(Path(temp))
            checksum = bundle / "SHA256SUMS"
            checksum.write_text(checksum.read_text(encoding="utf-8") + "\n", encoding="utf-8")
            with self.assertRaisesRegex(MODULE.VerificationError, "exactly one"):
                MODULE.verify_downloaded_bundle(bundle, VERSION)

    def test_copied_bundle_verifies_in_separate_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = create_bundle(root)
            downloaded = root / "downloaded-artifact"
            shutil.copytree(source, downloaded)
            result = MODULE.verify_downloaded_bundle(downloaded, VERSION)
            self.assertEqual(result["checks"]["checksum"], "PASS")
            self.assertEqual(result["checks"]["zip_paths"], "PASS")


if __name__ == "__main__":
    unittest.main()
