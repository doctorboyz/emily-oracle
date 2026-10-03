---
superseded_by: pm-coordination-patterns.md
superseded_at: 2026-10-03
status: superseded
---

# April 2026 Learnings Summary

## 2026-04-28 — CSV-in-Markdown Goal Tracking Format
CSV code blocks inside markdown track objective status, not system parameters. Each row is a goal with status (on-track/at-risk/blocked/completed/pending), and evidence lives in an evidence column. This separates project tracking from metric logging. Append-only audit trail below the CSV provides history that CSV alone cannot. One file per project.

## 2026-04-29 — Arra Safety Checks and maw Limitations
The arra indexer has a >50% deletion safety check — switching ORACLE_REPO_ROOT between vaults flags a false-positive data loss scenario. Always investigate before using ORACLE_FORCE_REINDEX=1. MCP tools require session restart to appear in Claude Code. Cross-oracle knowledge via file prefix (pm-*) works but does not scale — proper multi-vault support needs arra code changes.

## 2026-04-29 — maw Inbox Writes to Self Only
`maw inbox write` writes to the current oracle's own ψ/inbox/, not the target's. There is no `maw hey` command or `--to` flag. Inter-oracle communication requires direct vault file writes to the target's ψ/inbox/ directory using the MSG-ACK-RESULT protocol. Documentation referencing `maw hey` should be updated.
