# Quick Reference: Emily Oracle Ecosystem

> สำรวจเมื่อ: 2026-05-08 | Mode: deep (5 agents)

## เป้าหมายของ Project

**Emily Oracle Ecosystem** — ระบบ multi-agent ที่ทำงานอัตโนมัติผ่านการสื่อสารระหว่าง Oracle และมนุษย์ โดย:

1. **การสื่อสารอัตโนมัติ** — Oracle สื่อสารกันผ่าน vault files (MSG-ACK-RESULT protocol) และกับมนุษย์ผ่าน Telegram
2. **Drive-to-completion** — PM role (nexus) ติดตามเป้าหมาย ไม่ใช่ส่งแล้วลืม แต่ dispatch, monitor, verify
3. **Fleet orchestration** — maw CLI จัดการหลาย Oracle พร้อมกันผ่าน tmux sessions
4. **Consolidation pattern** — สอง Oracle รวมเป็นหนึ่งเมื่อทำงานเสริมกัน (texty+pm→nexus, broky+metty→god-port)

## Key Features

| Feature | Implementation | ผู้รับผิดชอบ |
|---------|---------------|-------------|
| Telegram Bot | nexus-daemon.py polls ทุก 5s | nexus |
| MSG-ACK-RESULT Protocol | vault files with YAML frontmatter | ทุก Oracle |
| Session End Reports | Stop hooks → session-summary.sh | ทุก Oracle |
| Goal Tracking | ψ/goals/active/ directory | nexus (PM role) |
| Cross-Oracle Messaging | maw inbox send + notify-nexus.sh | ทุก Oracle |
| Fleet Management | maw CLI + fleet JSON configs | มนุษย์ |
| Dispatch Logging | ψ/dispatch/YYYY-MM/ append-only logs | nexus |
| Inbox Monitoring | fswatch + macOS notifications | nexus (PM role) |

## การทำงาน (Workflow)

### Oracle ตื่นขึ้น (Wake Protocol)
```
1. READ ψ/identity.md        → รู้จักตัวเอง
2. READ ψ/inbox/              → มีคำขออะไรรอ?
3. READ ψ/goals/active/       → เป้าหมายปัจจุบัน (nexus)
4. DECIDE → ทำอะไรต่อ
5. ACT → ใช้ code tools
6. WRITE ψ/outbox/             → เขียนผลลัพธ์
7. UPDATE inbox msg status     → ack + result
```

### มนุษย์ส่งคำสั่งผ่าน Telegram
```
Human → /wake god-port     → maw wake god-port
Human → /status            → maw fleet ls
Human → /send emily task   → maw inbox send emily "task"
Human → ข้อความธรรมดา     → forward_to_nexus() → ψ/inbox/MSG-HUMAN-*
```

### Session จบ (Stop Protocol)
```
Session ends → Stop hook → session-summary.sh → nexus inbox + Telegram
```

## ติดตั้ง (Setup)

### เพิ่ม Oracle ใหม่
```bash
maw bud <oracle-name>          # สร้างจาก emily template
# เพิ่ม fleet config ที่ ~/.config/maw/fleet/
# เพิ่ม vault path ใน nexus-oracle/shared/vault-paths.sh
# เพิ่มใน ORACLES set ใน nexus-daemon.py
bash nexus-oracle/pm/inject-hook.sh <oracle-name>  # ติดตั้ง Stop hook
```

### ตั้งค่า Telegram Bot
1. สร้าง bot ผ่าน BotFather
2. เขียน credentials ที่ `ψ/credentials/telegram.json`
3. ตั้งค่า launchd plist สำหรับ daemon

## Configuration

| Config | Location | หน้าที่ |
|--------|----------|---------|
| Fleet | `~/.config/maw/fleet/*.json` | กำหนดสมาชิก fleet |
| Hooks | `.claude/settings.json` (per repo) | Stop + PostToolUse hooks |
| Credentials | `ψ/credentials/telegram.json` | Bot token + chat ID |
| Daemon plist | `~/Library/LaunchAgents/com.nexus-oracle.daemon.plist` | launchd config |

## Oracle Roles

| Oracle | บทบาท | ความสามารถหลัก |
|--------|-------|----------------|
| emily | Root seed | สร้างทัพ, framework, principles |
| god-port | Trading | วิเคราะห์ + execute trades (Broky+Metty) |
| nexus | Dispatcher+Coordinator | ส่งเสียงถึงคน + ติดตามเป้าหมาย (texty+pm) |
| kappy | Knowledge | Qdrant vector search + LINE bot |
| mkt | Marketing | Marketing agency |
| dev | Development | Full-stack dev team |
| fammee | Family | Family management |