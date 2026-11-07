# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
"""Focused tests for the clean-source Jupyter Releaser pre-tag hook."""

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("record_release_provenance.py").resolve()


class ReleaseProvenanceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.run_git("init", "-q")
        self.run_git("config", "user.email", "release-tests@example.invalid")
        self.run_git("config", "user.name", "Release Tests")
        (self.root / "package.json").write_text(json.dumps({"version": "0.25.3"}))
        (self.root / "RELEASE.md").write_text("# Release guide\n")
        self.run_git("add", "package.json", "RELEASE.md")
        self.run_git("commit", "-qm", "baseline")

    def run_git(self, *args: str) -> str:
        return subprocess.run(
            ["git", *args], cwd=self.root, check=True, capture_output=True, text=True
        ).stdout.strip()

    def run_hook(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT)], cwd=self.root, capture_output=True, text=True
        )

    def add_dist(self) -> None:
        dist = self.root / "dist"
        dist.mkdir()
        (dist / "jupyterlab_chat-0.25.3-py3-none-any.whl").write_bytes(b"wheel bytes")
        (dist / "jupyterlab_chat-0.25.3.tar.gz").write_bytes(b"sdist bytes")

    def test_clean_source_records_hashes_for_normal_release_commit(self) -> None:
        self.add_dist()
        sha = self.run_git("rev-parse", "HEAD")
        result = self.run_hook()
        self.assertEqual(result.returncode, 0, result.stderr)
        doc = (self.root / "RELEASE.md").read_text()
        self.assertIn("### v0.25.3 distribution hashes", doc)
        self.assertIn(sha, doc)
        self.assertIn(hashlib.sha256(b"wheel bytes").hexdigest(), doc)
        self.assertIn(hashlib.sha256(b"sdist bytes").hexdigest(), doc)
        self.run_git("commit", "-am", "Publish 0.25.3")
        self.assertEqual(self.run_git("status", "--porcelain", "--untracked-files=no"), "")

    def test_dirty_source_keeps_existing_release_changes(self) -> None:
        self.add_dist()
        doc = self.root / "RELEASE.md"
        doc.write_text(doc.read_text() + "\nUpdated changelog or release notes\n")
        before = doc.read_text()
        result = self.run_hook()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(before, doc.read_text())

    def test_missing_wheel_fails_closed(self) -> None:
        result = self.run_hook()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Expected validated release wheel missing", result.stderr)


if __name__ == "__main__":
    unittest.main()
