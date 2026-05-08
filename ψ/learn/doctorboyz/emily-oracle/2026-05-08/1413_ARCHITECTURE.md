# Architecture: Emily Oracle Ecosystem

> สำรวจเมื่อ: 2026-05-08 | Mode: deep (5 agents)

## สรุปสถาปัตยกรรม

Emily Oracle Ecosystem เป็นระบบ multi-agent ที่ใช้ vault-driven architecture — ทุก Oracle ตื่นมาอ่าน `ψ/inbox/`, ประเมิน, ทำงาน, เขียน `ψ/outbox/`, แล้ว sleep ไม่มี main loop ยกเว้น nexus-daemon สำหรับ Telegram

## Oracle Family

```
emily (root seed, born 2026-04-21)
├── god-port (trading, consolidated from broky+metty, born 2026-04-29)
├── nexus (dispatcher+coordinator, consolidated from texty+pm, born 2026-05-07)
├── kappy (knowledge, LINE bot, born 2026-04-30)
├── mkt (marketing, born 2026-05-05)
├── dev (full-stack dev, born 2026-05-07)
└── fammee (family, born 2026-05-07)
```

## Vault Structure (ทุก Oracle ใช้ร่วมกัน)

```
ψ/
├── identity.md          — ตัวตน (IMMUTABLE)
├── inbox/               — ข้อความเข้า (MSG-ACK-RESULT)
├── outbox/              — ข้อความออก (ack, result)
├── memory/
│   ├── learnings/       — บทเรียน (append-only)
│   ├── retrospectives/  — ย้อนดู session (append-only)
│   ├── knowledge/       — ภูมิปัญญา (supersede)
│   └── work/            — บันทึกกิจกรรม (append-only)
├── goals/               — ติดตามเป้าหมาย (nexus extension)
├── dispatch/            — log การส่ง Telegram (nexus extension)
├── channels/            — Telegram config (nexus extension)
└── credentials/         — API keys (gitignored)
```

## Entry Points (ทุกทางที่ Oracle ถูกปลุก)

1. **maw wake** — spawn tmux session + Claude Code
2. **Claude Code Stop hook** — session จบ → `session-summary.sh` → nexus inbox → Telegram
3. **nexus-daemon.py** — Telegram Bot polls ทุก 5s, รับ `/wake`, `/sleep`, `/status`, `/inbox`, `/send`, `/goals`
4. **PostToolUse hook** — แจ้งเตือน inbox ที่ยังไม่ process (nexus เท่านั้น)
5. **fswatch inbox-watcher** — monitor `ψ/inbox/` สำหรับ new messages

## Consolidation Pattern

สอง Oracle → สอง roles ในหนึ่ง agent:
- Code directories แยกกัน (`texty/`, `pm/`, `broky/`, `metty/`)
- Vault รวมเป็นอันเดียว
- Identity เดิมกลายเป็น role identity ใน sub-vault
- CLAUDE.md อธิบาย Role Activation Table
- Fleet config ลดจาก 2 → 1 entry

## Communication (MSG-ACK-RESULT Protocol)

```
pending → acknowledged → completed
```

ไฟล์: `{YYYYMMDD}_{HH-MM}_{sender}_{MSG-ID}.md` ใน `ψ/inbox/`
Dispatch log: `ψ/dispatch/YYYY-MM/DSP-YYYYMMDD-NNN.md`

## Key Dependencies

| Oracle | Dependencies |
|--------|-------------|
| ทุกตัว | Claude Code, maw CLI, Git |
| nexus | Telegram Bot API, Python 3, fswatch, launchd |
| god-port | Python 3.13, Pydantic, pandas, MT5, Docker |
| kappy | Bun, LINE API, Qdrant |

## Fleet Config (`~/.config/maw/fleet/`)

| # | Oracle | sync_peers | budded_from |
|---|--------|-----------|-------------|
| 00 | emily | god-port, nexus | null (root) |
| 01 | god-port | emily, nexus | emily |
| 02 | nexus | emily, god-port | emily |
| 04 | kappy | emily, nexus | emily |
| 05 | fammee | emily, nexus | emily |