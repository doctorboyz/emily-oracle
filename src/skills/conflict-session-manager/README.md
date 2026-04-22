# Conflict Session Manager — Quick Start

## What This Does

When you run multiple Claude Code sessions editing the same project files, conflicts happen. This skill prevents them through simple, file-based locking and git branch isolation.

**No external infrastructure needed** — just `.lock` files and git branches.

---

## Quick Commands

| Command | What It Does |
|---------|-------------|
| `/conflict-check` | Scan for locks, uncommitted changes, stashes |
| `/session-lock <file>` | Claim a file for editing, create lock |
| `/check-sessions` | List all active session locks |
| `/release-locks` | Clean up locks when done editing |

---

## Typical Workflow

### Session A (editing `src/app.js`)

```bash
# Check for conflicts first
/conflict-check

# Claim the file
/session-lock src/app.js

# Work on a session branch
git checkout -b session/app-refactor

# Edit, commit, etc...
# (lock files auto-created in same dir as target file)

# When done, release locks
/release-locks

# Merge back to main
git checkout main
git merge session/app-refactor
```

### Session B (editing `src/utils.js` at the same time)

```bash
# Check what's locked
/check-sessions

# Session A has src/app.js, so we're safe to edit src/utils.js
/session-lock src/utils.js
git checkout -b session/utils-refactor

# Edit and commit...
# If you try to edit src/app.js:
# ⚠️ File locked by Session A, choose:
#   1. Wait
#   2. Force take over
#   3. Work on copy
#   4. Use different branch
```

---

## Lock File Format

When you `/session-lock <file>`, a file named `<file>.session.lock` is created:

```
session_id: a7d2f9e4-8c3b-4f1a-9e5c-2b6d7a8f9c1e
timestamp_start: 2026-04-01T14:23:45Z
target_file: /path/to/src/app.js
task_description: Refactoring authentication module
ttl_minutes: 60
```

**Stale locks** (older than 1 hour) are flagged by `/check-sessions` and can be force-released.

---

## Rules at a Glance

✅ **Do:**
- Always work on a `session/<task>` branch
- Run `/conflict-check` before starting
- Run `/session-lock` before editing a file
- Commit frequently
- `/release-locks` when done

❌ **Don't:**
- Edit `main` or `master` directly
- Force-write over another session's lock without confirmation
- Ignore lock file warnings
- Leave locks dangling after a crash (they expire in 1 hour)

---

## Common Scenarios

### "Another session is using the same file"
```
⚠️ File locked by another session:
  Session: 9c4f1b7e
  Locked since: 10 minutes ago

Options:
1. Wait
2. Force take over
3. Create a copy and merge later
4. Use a different branch
```

→ Choose **1** if other session will finish soon  
→ Choose **3** or **4** if you need to work in parallel

---

### "File has uncommitted changes (from another session)"
```
⚠️ Uncommitted changes detected:
  File: src/config.js

Options:
1. View the changes first
2. Stash these changes, make mine
3. Proceed anyway
```

→ Choose **1** to see what the other session did  
→ Choose **2** to save their work and edit independently

---

### "Lock file is old (session crashed)"
```
⏱️ Stale lock detected:
  File: src/app.js
  Lock age: 2 hours
  
Options:
1. Force-release and edit
2. Keep lock and wait
3. Work on a branch separately
```

→ Choose **1** to claim the file (old session is dead)

---

## Integration with `.gitignore`

A `.gitignore` file is created in the skill directory. Add to your project `.gitignore`:

```gitignore
*.session.lock
*.session-*.bak
```

This prevents lock files from being committed.

---

## Troubleshooting

**Lock file won't go away?**
```bash
/release-locks --all
# or manually delete the .lock file
rm src/*.session.lock
```

**Can't figure out who locked a file?**
```bash
/check-sessions
# Lists all active locks with session IDs and timestamps
```

**Merged two branches, now have conflicts?**
The skill will guide you through merge conflict resolution with options to view, stage, or manually edit conflicting sections.

---

## Architecture

```
Project root/
├── src/
│   ├── app.js
│   ├── app.js.session.lock           ← Created by session A
│   ├── utils.js
│   └── utils.js.session.lock         ← Created by session B
├── .git/
└── .gitignore                        (add *.session.lock)
```

Each file you claim gets a `.session.lock` neighbor file with metadata. When you release, the lock file is deleted.

---

## See Also

- Full SKILL.md for detailed rules and all commands
- `git branch -a` to see all session branches
- `git stash list` to recover lost work from other sessions

---

## Support

Run `/help` or check the full SKILL.md for edge cases, advanced scenarios, and troubleshooting.
