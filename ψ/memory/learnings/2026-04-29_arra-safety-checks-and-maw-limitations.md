# Arra Safety Checks and maw Limitations

> Lessons from knowledge framework installation

## Arra Indexer Safety Check

The arra indexer has a >50% deletion safety check. When switching ORACLE_REPO_ROOT
between different vaults, the indexer sees that most existing docs' source files
don't exist at the new root and flags a potential data loss scenario.

**Correct approach**: Investigate why the mismatch exists before using ORACLE_FORCE_REINDEX=1.
The force flag exists for legitimate vault switches, but always confirm the reason first.

**Root cause**: Switching ORACLE_REPO_ROOT from emily-oracle to pm-oracle and back caused
the DB to contain docs whose source files were in a different vault location.

## maw Inbox Writes to Self Only

`maw inbox write` writes to the CURRENT oracle's own ψ/inbox/, not the target's.
There is no `maw hey` command. Inter-oracle communication requires direct vault file writes
or the MSG-ACK-RESULT protocol.

## MCP Tools Require Session Restart

arra-oracle MCP tools (`arra_search`, `arra_learn`, `arra_supersede`, etc.) only appear
in Claude Code after restarting the session. Adding them to settings.json mid-session
doesn't make them available until next session.

## Cross-Oracle Knowledge: Temporary Hack

Copying oracle-specific files with prefix (pm-*) into another oracle's vault works but
doesn't scale. The `origin` field in arra documents enables filtered search, but the
actual files still live in one vault. Proper multi-vault support needs arra code changes.