---
name: conflict-session-manager
description: |
  Detect and prevent concurrent edit conflicts when multiple Claude Code sessions 
  modify the same files. Manage session locks, enforce branching, and guide 
  conflict resolution without external infrastructure.
---

# Conflict Session Manager

Prevents and resolves file edit conflicts across multiple Claude Code sessions through session locking, git branching, and explicit coordination.

---

## Core Rules

### Rule 1: Always Check Before Editing
Before modifying any file:
1. Look for `<filename>.session.lock` files in the same directory
2. Run `git status` to detect uncommitted changes
3. Run `git stash list` to check for stashed work from other sessions
4. If conflicts detected, report them and request user decision

### Rule 2: Announce Your Session on File Claim
When you intend to edit a file, immediately create a `.session.lock` marker:

**Location:** Same directory as the file  
**Filename format:** `<target-filename>.session.lock`  
**Content:**
```
session_id: <UUID or process ID>
timestamp_start: <ISO 8601 timestamp>
target_file: <absolute path>
task_description: <what this session is doing>
ttl_minutes: 60
```

Example: If editing `/src/app.js`, create `/src/app.js.session.lock`

### Rule 3: Always Work on a Session Branch
- **Branch naming:** `session/<short-task>` (e.g., `session/auth-refactor`)
- **Never commit to main/master directly**
- **Why:** Isolates concurrent work and makes merging explicit

### Rule 4: Refresh Lock During Long Edits
For edits longer than 15 minutes:
- Update the `.session.lock` file's `timestamp_updated: <current ISO time>` field every 10 minutes
- This prevents other sessions from force-releasing a live lock

### Rule 5: Release Locks Cleanly on Completion
When done editing:
1. Delete all `.session.lock` files this session created
2. Commit all changes on the session branch
3. If appropriate, merge or rebase back to main
4. Report which files were locked and released

### Rule 6: Never Force-Write Over Recent Changes
- Compare file's `mtime` (modification time) with your last read
- If newer, re-read before writing
- If modified by another session, alert user and request confirmation

### Rule 7: Detect and Report Stale Locks
If a `.session.lock` file's timestamp is older than 1 hour:
1. It's likely a crashed session
2. Report to user with file age
3. Offer to force-release (requires user confirmation)
4. Never silently delete without notifying

---

## Workflow: Detection & Resolution

### Scenario 1: Lock File Exists, Session Still Active
**Detection:** `.session.lock` exists and timestamp is recent  
**User Message:**
```
⚠️  File locked by another session:
  File: <path>
  Session: <session_id>
  Locked since: <timestamp> (X minutes ago)

Options:
1. Wait for the other session to release
2. Force take over (requires confirmation)
3. Create a copy and merge later
4. Use a different branch

Choose option (1-4):
```

**Action on choice:**
- **1 (Wait):** Poll lock file every 30s, resume when released
- **2 (Take over):** Ask "Are you sure? Any unsaved work will be at risk." Then delete lock.
- **3 (Copy):** Create `<filename>.session-<sessionid>.bak`, work on copy
- **4 (Branch):** Create new branch for this work, merge manually later

---

### Scenario 2: Lock File Exists, Session Appears Dead
**Detection:** `.session.lock` timestamp older than 1 hour  
**User Message:**
```
⏱️  Stale lock detected:
  File: <path>
  Lock age: <X hours>
  Last activity: <timestamp>
  
This session appears to have crashed. Proceed?
1. Force-release and edit
2. Keep lock and wait
3. Work on a branch separately

Choose (1-3):
```

**Action on choice:**
- **1 (Force):** Delete lock, create session lock, proceed
- **2 (Wait):** Continue polling
- **3 (Branch):** Create separate branch, manual merge later

---

### Scenario 3: No Lock, But Git Shows Uncommitted Changes
**Detection:** File has no `.session.lock` but `git status` shows uncommitted changes  
**User Message:**
```
⚠️  Uncommitted changes detected:
  File: <path>
  Status: modified, not staged

This file may be in progress by another session.

Options:
1. View the changes first
2. Stash these changes, make mine
3. Proceed anyway (will merge later)

Choose (1-3):
```

**Action:**
- **1 (View):** Run `git diff <file>` to show changes
- **2 (Stash):** Run `git stash` to save the changes
- **3 (Proceed):** Continue; user will handle merge later

---

### Scenario 4: Two Sessions Diverged (Merge Conflict)
**Detection:** After merging two session branches, `git status` shows conflicts  
**User Message:**
```
🔀 Merge conflict detected in <file>:

Conflicting sections:
<<<<<<< HEAD
  (session A's version)
=======
  (session B's version)
>>>>>>> branch

Options:
1. Show full conflict markers
2. View session A's version
3. View session B's version
4. Manual merge (edit conflict markers directly)

Choose (1-4):
```

**Action:**
- **1 (Show):** Print `git diff` around conflict markers
- **2 (A):** Stage session A's version
- **3 (B):** Stage session B's version
- **4 (Manual):** Open editor for manual resolution, then `git add <file>`

---

### Scenario 5: File Recently Modified (Unknown Editor)
**Detection:** File has no lock, but `git log -1 -- <file>` is recent  
**User Message:**
```
ℹ️  File recently modified:
  File: <path>
  Last commit: <message>
  Author: <git config user>
  Date: <timestamp> (X minutes ago)

Is this your work, or another session's?
1. Mine (proceed)
2. Not mine (check before editing)

Choose (1-2):
```

**Action:**
- **1 (Mine):** Create lock, proceed
- **2 (Not mine):** Show full commit with `git show <commit>:<file>`, offer to wait or branch

---

## Commands

### `/conflict-check`
**Behavior:**
- Scan working directory for all `.session.lock` files
- Run `git status` and summarize uncommitted changes
- Run `git stash list` and list all stashes
- Report current branch
- Output summary of conflict risks

**Example output:**
```
📊 Conflict Check Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current branch: main

🔒 Active locks:
  • src/app.js.session.lock (15 min old)
  • src/utils.js.session.lock (2 min old)

📝 Uncommitted changes:
  • src/config.js (modified)
  • src/test.js (new file)

📦 Stashed work:
  • stash@{0}: WIP on session/auth (2 hours ago)
  • stash@{1}: WIP on session/db (1 day ago)

⚠️  Recommended action:
  You have active locks. Release or resolve before switching branches.
```

---

### `/session-lock <file>`
**Behavior:**
- Create `<file>.session.lock` with current timestamp
- Generate unique session ID
- Output confirmation with lock details
- Add file to `.gitignore` if not present

**Example:**
```
✅ Lock acquired:
  File: src/app.js
  Lock: src/app.js.session.lock
  Session ID: a7d2f9e4
  Expires: 60 minutes from now
  Branch: session/app-refactor

Release with: /release-locks
```

---

### `/check-sessions`
**Behavior:**
- List all `.session.lock` files in the project
- For each, parse and display session info
- Calculate age and TTL remaining
- Flag stale locks (> 1 hour)

**Example output:**
```
🔍 Active Sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session A (3e8f2d1a):
  File: src/auth.js
  Started: 10 min ago
  TTL: 50 min remaining
  Status: ✅ Active

Session B (9c4f1b7e):
  File: src/db.js
  Started: 125 min ago
  TTL: ⚠️ EXPIRED
  Status: 🔴 Stale (force-release available)
```

---

### `/release-locks [--all]`
**Behavior:**
- Delete all `.session.lock` files created by this session (default)
- With `--all`, delete all locks (requires user confirmation)
- Report which files were released
- Remind user to merge if on a session branch

**Example:**
```
✅ Locks released:
  • src/app.js.session.lock
  • src/auth.js.session.lock

📌 Reminder:
  You're on branch session/refactor
  Merge back to main when ready:
  git checkout main && git merge session/refactor
```

---

## Best Practices

1. **Start sessions with a clear branch name** — `session/fix-login` is better than `session/work`
2. **Check locks before starting heavy edits** — run `/conflict-check` first
3. **Commit small changes frequently** — reduces conflict resolution scope
4. **Never edit main/master directly** — always use a session branch
5. **Announce before claiming files** — use `/session-lock` proactively
6. **Clean up after yourself** — `/release-locks` before exiting
7. **Merge explicitly** — don't assume changes are safe; review diffs before merging

---

## Edge Cases

| Case | Action |
|------|--------|
| Lock file corrupted or unreadable | Warn user, offer to delete and reclaim |
| Two sessions claim same lock file | Last write wins; losing session should re-read and retry |
| File renamed while locked | Suggest creating new lock for renamed file, deleting old lock |
| Session crashes mid-edit | Stale lock remains; will be detected as expired after TTL |
| User manually deletes .session.lock | No error; next session claims normally |
| Network outage (if using shared storage) | Locks still visible; may require manual cleanup |
| Circular dependency (A waits for B, B waits for A) | Detect via lock chain, suggest resolving one manually |

---

## Integration with Edit Tools

When this skill is active and the user attempts a file edit via the Edit tool:
1. **Pre-check:** Call `/conflict-check` implicitly
2. **Lock acquisition:** Create `.session.lock` before writing
3. **Conflict warning:** If lock exists, pause and ask user for resolution
4. **Post-edit:** Update lock timestamp if edit took > 15 minutes
5. **On error:** Keep lock open; user must manually `/release-locks` if abandoning

---

## Troubleshooting

**Q: Lock file won't disappear**  
A: Run `/release-locks --all` to force cleanup, or manually delete `.session.lock` files in your project

**Q: Two sessions fighting over same lock**  
A: Stale lock likely. Run `/check-sessions` to verify age, then `/release-locks` on the dead session's lock

**Q: I want to edit main directly without a branch**  
A: Not recommended, but possible. Create lock manually and merge session branch to main after review

**Q: How do I know my branch is safe to merge?**  
A: Run `git diff main..` to review all changes, confirm no locks remain for those files, then merge

---

## Related Commands

- `git status` — Check uncommitted changes
- `git stash` — Temporarily save work for another session
- `git log -1 -- <file>` — See who last modified a file
- `git diff <branch>` — Review changes before merging
- `.gitignore` — Add `*.session.lock` to ignore lock files in commits
