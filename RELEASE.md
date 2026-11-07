# GitHub-only releases from this fork

This repository is a **public fork** of Jupyter Chat. The workflows below
publish versioned distributions and SHA-256 checksums as **public GitHub
Release assets on this fork only**. They do **not** publish to PyPI or npm.
The fork retains its optional `IChatInputFactory` API; consumers must
select and verify the reviewed fork artifact explicitly.

## Already-versioned maintenance release (0.25.3)

The source on `main` is already at `0.25.3`, and the active changelog
entry is already populated with upstream's 0.25.3 release notes. Do not
pre-bump the version or regenerate that entry.

1. Confirm Build, UI tests and Check Release passed on the selected commit.
2. Run [Step 1: Prep Release](https://github.com/rpwagner/jupyter-chat/actions/workflows/prep-release.yml)
   from `main`: set `version_spec` to `0.25.3`, `branch` to `main`,
   and enable **reuse_existing_changelog**. Leave **silent** off and
   **post_version_spec** empty. This preserves the version and changelog
   and creates a reviewable draft GitHub release with Jupyter Releaser metadata.
3. Review the draft release and its source SHA. Do not merge changes into
   the release branch between Step 1 and Step 2: Jupyter Releaser checks
   that the source still matches the draft metadata.
   If the version and changelog are already committed, the supported
   Jupyter Releaser pre-tag hook records the built distributions' checksums
   in this guide. That tracked provenance forms the release commit without
   changing the package version or weakening the source-SHA gate.
4. Run [Step 2: Publish Release](https://github.com/rpwagner/jupyter-chat/actions/workflows/publish-release.yml)
   from `main` with `branch=main` and the **exact draft release URL**.
   GitHub draft links normally end in `untagged-...`; copied URL tracking
   parameters are removed by the workflow. No extra version edit is needed.
5. Verify the published `v0.25.3` tag, the
   `jupyterlab_chat-0.25.3-py3-none-any.whl` asset, the source distribution,
   and `asset_shas.json`. Record the exact source commit and wheel checksum
   before changing any downstream consumer.

A failed Step 2 may be retried only when its draft is still valid for
the current release-branch SHA. If the branch moved (including after merging a release-workflow correction),
the draft metadata is stale: delete that draft and run Step 1 again for the
current source. Do not bypass Jupyter Releaser's source-integrity check.

## Future releases

Run Step 1 from `main` with an explicit newer `version_spec` (for
example `next`), leaving **reuse_existing_changelog** disabled so
Jupyter Releaser manages the version bump and generates release notes.
If the source is already committed at the chosen version with a populated
active changelog, enable the existing-changelog option instead. Then
review the draft and run Step 2 as above.

Step 2 uses the repository's `GITHUB_TOKEN` for source verification,
package builds, validation, Git tagging and GitHub Release publication.
It always skips Jupyter Releaser's `publish-assets` and
`forwardport-changelog` commands. No GitHub App credentials or registry
publishing tokens are required. The `release` environment may require
an approval under its protection rules.

This is artifact publication only. Installation, combined compatibility,
browser acceptance, and deployment are separate consumer decisions.

## Fork release provenance

### v0.25.3 distribution hashes

Pre-release source commit: `0fceeead5a2a7bd5d8b3ca4445a40f0e4fe060cf`.
The normal Jupyter Releaser build and package checks ran before this record
was generated. Its release commit and GitHub checksum manifest retain
the corresponding distribution checksums.

| Distribution | SHA-256 |
| --- | --- |
| `jupyter-chat-0.25.3.tgz` | `0f4c728df1dac7b2ad639dd7dfb6decde2edb13acf712375b5fcc68042d58b4c` |
| `jupyterlab-chat-0.25.3.tgz` | `465869971c67a5ab7681baa2928375b0ad02f0313defeab339d1e08957478011` |
| `jupyterlab-chat-extension-0.25.3.tgz` | `c84e1ea30dcc8993a532dcb397b013da5621247cfdf1aa8a87fcbf2767ef3c22` |
| `jupyterlab_chat-0.25.3-py3-none-any.whl` | `14c0cfb9e4b79971dc241b9395730dfad236652a1c5f3aaf50e6df5c08c96913` |
| `jupyterlab_chat-0.25.3.tar.gz` | `dc4af40369cd333b863008e4d3170e1137db8c470daee65478db503f8c0fa701` |
