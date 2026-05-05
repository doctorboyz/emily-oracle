# Lesson: maw inbox writes to self, not target

**Date**: 2026-04-29
**Source**: Testing maw inbox write
**Context**: Trying to send messages between oracles

## Finding

`maw inbox write "message"` writes to the **current oracle's own** `ψ/inbox/`, not the target oracle's inbox. There is no `--to` flag. This means maw inbox is a self-notice board, not inter-oracle mail.

## Also: `maw hey` does not exist

The command `maw hey <oracle> "message"` referenced in documentation is not a real maw command. The actual inter-oracle communication commands are:
- `maw inbox write` — self-only messages
- `maw peek <oracle>` — read another oracle's tmux output (read-only)
- `maw broadcast <message>` — send to all agents (but still writes to self inbox)

## Solution: Direct vault file writes

To send a message to another oracle, write directly to their `ψ/inbox/` directory:
```bash
# Write to target oracle's inbox
cat > /path/to/target-oracle/ψ/inbox/{date}_{time}_{sender}_{msg_id}.md << 'EOF'
---
msg_id: MSG-PM-001
from: pm
to: target
status: pending
---
message content
EOF
```

## Why This Matters

Any documentation referencing `maw hey` should be updated. The MSG-ACK-RESULT protocol uses direct vault writes instead of maw inbox.