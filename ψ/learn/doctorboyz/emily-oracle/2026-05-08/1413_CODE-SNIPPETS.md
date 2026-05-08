# Code Snippets: Emily Oracle Ecosystem

> สำรวจเมื่อ: 2026-05-08 | Mode: deep (5 agents)

## 1. dispatch.sh — ส่งข้อความ Telegram

```bash
# Usage: dispatch.sh --message "text" [--poll "question"]
bash texty/dispatch.sh --message "nexus online test"
# Output: Message sent: DSP-20260508-202
```

Key patterns: อ่าน credentials จาก `ψ/credentials/telegram.json`, เขียน dispatch log, ใช้ `curl` เรียก Telegram Bot API

## 2. notify-nexus.sh — Oracle อื่นส่ง event ไป nexus

```bash
bash texty/notify-nexus.sh emily test "hello from test"
# Output: notify-nexus: MSG-EMILY-395 → Telegram (test from emily)
```

Event types: `escalation`, `error`, `session-end`, `commit`, `info` — แต่ละ type มี emoji prefix

## 3. session-summary.sh — Stop hook ส่งรายงาน session

```bash
bash shared/session-summary.sh emily
# Output: session-summary: MSG-EMILY-396 → Telegram (emily)
```

Captures tmux output (last 10 lines), writes inbox + dispatch log, sends Telegram

## 4. nexus-daemon.py — Telegram Bot

```python
# Key constants
ORACLES = {"emily", "god-port", "nexus", "mkt", "dev", "kappy"}
POLL_INTERVAL = 5  # seconds
CHAT_ID = 8705040053

# Command handlers
elif cmd == "/wake":
    output = run_cmd(f"maw wake {args}")
elif cmd == "/goals":
    goals_dir = os.path.join(PSI_DIR, "goals", "active")
    # ... list goal files
```

Uses `curl` for Telegram API (avoids Python SSL issues), `subprocess.run` with 15s timeout for maw commands

## 5. vault-paths.sh — Path Resolution

```bash
NEXUS_ROOT="/Users/doctorboyz/Code/github.com/doctorboyz/nexus-oracle"
NEXUS_INBOX="$PSI_DIR/inbox"
NEXUS_MSG_PREFIX="MSG-NEXUS"
# Cross-oracle paths (read-only):
EMILY_VAULT="$EMILY_ROOT/ψ"
GODPORT_VAULT="$GODPORT_ROOT/ψ"
```

Handles Unicode psi (ψ/psi) directory names with fallback

## 6. msg-protocol.sh — MSG-ACK-RESULT Helpers

```bash
msg_send "god-port" "task" "Analyze M5 chart for XAUUSD"
msg_ack "MSG-GP-177"
msg_result "MSG-GP-177" "Analysis complete, signal found"
msg_status "MSG-GP-177"  # → "acknowledged"
```

## 7. inject-hook.sh — ฉีด Stop hook เข้า oracle อื่น

```bash
bash pm/inject-hook.sh kappy
# Creates: kappy-oracle/scripts/session-report-to-nexus.sh
# Updates: kappy-oracle/.claude/settings.json
```

Reads fleet config, creates template script with path substitution, merges into settings.json with idempotency check

## 8. Error Handling Patterns

```bash
# Graceful degradation (notify-nexus.sh, session-summary.sh)
curl -s -X POST "${API_URL}/sendMessage" ... > /dev/null 2>&1 || echo "Warning: Telegram send failed"

# Strict mode (dispatch.sh)
set -euo pipefail

# Python daemon resilience (nexus-daemon.py)
except Exception as e:
    print(f"Poll error: {e}")
    # continues polling
```

## 9. Hook System

| Oracle | Hook | Target |
|--------|------|--------|
| emily, god-port | `session-summary.sh {name}` | nexus inbox + Telegram |
| kappy, mkt, dev, fammee | `session-report-to-nexus.sh` | nexus inbox only |
| nexus | `session-summary.sh nexus` + PostToolUse inbox check | own inbox + Telegram |

## 10. MSG-ACK-RESULT Message Format

```yaml
---
msg_id: MSG-NEXUS-001
from: nexus
to: god-port
type: escalation|query|task|info
status: pending|acknowledged|completed
sent: 2026-05-08T12:00:00Z
ack_by: "-"
result: "-"
reply_file: "-"
---

Message body here
```

Filename: `{YYYYMMDD}_{HH-MM}_{sender}_{msg_id}.md`