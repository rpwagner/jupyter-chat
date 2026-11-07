# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
"""Record validated release artifacts when the source is already committed.

Jupyter Releaser's tag-release creates a release commit with `git commit -am`.
An already-versioned fork has no source changes, so make that commit meaningful
by recording its immutable build artifact hashes in the tracked release guide.
This is called by the standard before-tag-release hook, after build/check steps.
"""

import hashlib
import json
import subprocess
from pathlib import Path


def main() -> None:
    status = subprocess.run(
        ["git", "status", "--porcelain", "--untracked-files=no"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    if status.strip():
        # Normal new-version releases have source/changelog changes to commit.
        print("Tracked release changes already exist; keeping the normal release commit.")
        return

    version = json.loads(Path("package.json").read_text(encoding="utf-8"))["version"]
    wheel = f"jupyterlab_chat-{version}-py3-none-any.whl"
    dist = Path("dist")
    if not (dist / wheel).is_file():
        raise SystemExit(f"Expected validated release wheel missing: {dist / wheel}")
    assets = sorted(path for path in dist.iterdir() if path.is_file())
    if not assets:
        raise SystemExit("No distribution artifacts found to record")

    doc = Path("RELEASE.md")
    content = doc.read_text(encoding="utf-8")
    heading = f"### v{version} distribution hashes"
    if heading in content:
        raise SystemExit(f"Release provenance for v{version} already exists")

    source_sha = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    lines = [
        "",
        "## Fork release provenance",
        "",
        heading,
        "",
        f"Pre-release source commit: \`{source_sha}\`.",
        "The normal Jupyter Releaser build and package checks ran before this record",
        "was generated. Its release commit and GitHub checksum manifest retain",
        "the corresponding distribution checksums.",
        "",
        "| Distribution | SHA-256 |",
        "| --- | --- |",
    ]
    for path in assets:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append(f"| \`{path.name}\` | \`{digest}\` |")
    doc.write_text(content.rstrip() + "\n" + "\n".join(lines) + "\n", encoding="utf-8")
    print(f"Recorded {len(assets)} verified distribution hashes for v{version}")


if __name__ == "__main__":
    main()
