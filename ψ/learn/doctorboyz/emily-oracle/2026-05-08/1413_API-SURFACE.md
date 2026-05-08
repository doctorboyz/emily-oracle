# API Surface: Emily Oracle Ecosystem

> สำรวจเมื่อ: 2026-05-08 | Mode: deep (5 agents)

## 1. Script API

### dispatch.sh — ส่งข้อความ Telegram
```bash
bash texty/dispatch.sh --message "text" [--poll "question"]
```
Returns: `Message sent: DSP-YYYYMMDD-NNN` | Side effects: dispatch log + Telegram message

### notify-nexus.sh — Oracle → nexus → Telegram
```bash
bash texty/notify-nexus.sh <source_oracle> <event_type> "<message>"
# event_type: escalation, error, session-end, commit, info
```

### query.sh — ค้นหาความรู้
```bash
bash texty/query.sh --scope vault|db|web --keyword "search term"
```

### session-summary.sh — Stop hook
```bash
bash shared/session-summary.sh <source_oracle>
```

### inject-hook.sh — ฉีด Stop hook เข้า oracle อื่น
```bash
bash pm/inject-hook.sh <oracle-name>
```

### inbox-watcher.sh — monitor inbox
```bash
bash pm/inbox-watcher.sh           # start
bash pm/inbox-watcher.sh --stop    # stop
bash pm/inbox-watcher.sh --status  # check
```

## 2. Telegram Bot Commands (nexus-daemon)

| Command | Args | Description |
|---------|------|-------------|
| `/wake` | `<oracle>` | เริ่ม session (maw wake) |
| `/sleep` | `<oracle>` | หยุด session (maw sleep) |
| `/status` | — | fleet status (maw fleet ls) |
| `/inbox` | `<oracle>` | ตรวจ inbox |
| `/send` | `<oracle> <msg>` | ส่งข้อความไป inbox |
| `/goals` | — | ดู active goals |
| `/help` | — | รายการคำสั่ง |

ข้อความธรรมดา → `forward_to_nexus()` → inbox file

## 3. Vault File Formats

### MSG-ACK-RESULT Header
```yaml
---
msg_id: MSG-{SOURCE}-{NNN}
from: {source}
to: {target|nexus|human}
type: escalation|query|task|info
status: pending|acknowledged|completed
sent: YYYY-MM-DDTHH:MM:SSZ
ack_by: -
result: -
reply_file: -
---
```

### Dispatch Log
```yaml
---
dispatch_id: DSP-YYYYMMDD-NNN
from: nexus
to: human (Telegram)
type: info|task|escalation
status: forwarded
sent: YYYY-MM-DDTHH:MM:SSZ
result: awaiting
---
```

### Goal File
```yaml
---
goal_id: GOAL-{PROJECT}-{NNN}
project: {name}
responsible: {oracle}
status: active|completed|at-risk|blocked
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## 4. MSG-Protocol Functions (msg-protocol.sh)

| Function | Purpose |
|----------|---------|
| `msg_generate_id` | สร้าง MSG-NEXUS-NNN ID |
| `msg_timestamp` | ISO timestamp |
| `msg_date` | YYYYMMDD format |
| `msg_time` | HHMM format |
| `msg_send <target> <type> <msg>` | ส่งไป inbox ของ oracle เป้าหมาย |
| `msg_ack <msg_id>` | acknowledge ข้อความ |
| `msg_result <msg_id> <summary>` | เขียนผลลัพธ์ |
| `msg_status <msg_id>` | ตรวจสถานะ (pending/acknowledged/completed/not_found) |

## 5. Extension Points

### เพิ่ม Oracle ใหม่
1. `maw bud <name>` หรือ fork จาก emily
2. เพิ่ม fleet config `~/.config/maw/fleet/{NN}-{name}.json`
3. เพิ่ม vault path ใน `nexus-oracle/shared/vault-paths.sh`
4. เพิ่มใน ORACLES set ใน `nexus-daemon.py`
5. `bash pm/inject-hook.sh <name>`

### เพิ่ม Daemon Command
1. เพิ่ม `elif cmd == "/newcommand":` ใน `handle_command()`
2. เพิ่มใน `commands` list ของ `register_commands()`

### เพิ่ม Hook
```json
{
  "hooks": {
    "Stop": [{"matcher": "*", "hooks": [{"type": "command", "command": "bash /path/to/script.sh"}]}],
    "PostToolUse": [{"matcher": "Write|Edit", "hooks": [{"type": "command", "command": "bash -c '...'"}]}]
  }
}
```

## 6. maw CLI Commands

| Command | Description |
|---------|-------------|
| `maw wake <oracle>` | เริ่ม session |
| `maw sleep <oracle>` | หยุด session |
| `maw peek <oracle>` | ดู output ล่าสุด |
| `maw hey <oracle> "msg"` | ส่ง task message |
| `maw fleet ls` | ดู fleet status |
| `maw inbox send <oracle> "msg"` | ส่ง MSG-ACK-RESULT message |
| `maw inbox ls` | ตรวจ inbox ทุก oracle |
| `maw bud <name>` | สร้าง oracle ใหม่ |

## 7. Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `.claude/settings.json` | per repo | Stop + PostToolUse hooks |
| `fleet/*.json` | `~/.config/maw/fleet/` | Oracle fleet config |
| `telegram.json` | `ψ/credentials/` | Bot token + chat ID (gitignored) |
| `com.nexus-oracle.daemon.plist` | `~/Library/LaunchAgents/` | launchd config |