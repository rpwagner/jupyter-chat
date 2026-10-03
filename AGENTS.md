# Maintained Beauty-system fork guidance

For maintained Beauty-system work in `rpwagner/jupyter-chat`, read and apply the
current canonical Beauty-system policy at
`https://github.com/rpwagner/beauty-runtime/blob/main/AGENTS.md` (authorized access
required). Follow its applicability and design/implementation distinctions. Use its release-stage
and branch/PR-readiness guidance for required pre-merge checks, preservation of
blocked work in a pushed branch/draft PR, and pending post-release/live `v0.x`
evaluation; pending post-release evidence alone does not keep completed work in
draft. Record live acceptance as pending until performed.

This routing applies only to maintained Beauty-system work in this fork. It does
not impose Beauty policy or version conventions on upstream `jupyterlab/jupyter-chat`.
Preserve upstream architecture, compatibility, contribution, validation, and
release requirements in `README.md`, `docs/source/developers/contributing/`,
package metadata, and `.github/workflows/`. Keep fork changes focused and retain
existing upstream extension points.

Merge, publication, deployment, and rollback require their existing authority;
this reference grants none and creates no package/runtime dependency. Report an
unavailable canonical source or unresolved local/upstream conflict rather than
reconstructing policy or silently choosing precedence. Do not copy general policy here.
