# Lesson: Cross-Repo Renames Need Grep Verification

**Date**: 2026-04-24
**Source**: rrr: emily-oracle

When renaming or consolidating concepts that span multiple repos (e.g., principles shared across kappa-genome, Adams-kappa, kappa-brain), always grep all repos for old names before committing. Manual file-by-file checking is error-prone and can leave stale references.

**Pattern**: `grep -r "old name" /path/to/repo1 /path/to/repo2` before final commit
**Why**: Three repos all reference the same principles; a rename in one requires updates in all three. No automated test catches broken cross-references in markdown content.
**How to apply**: After any structural rename across repos, run a targeted grep for old names across all affected repos before the final commit.