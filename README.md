# Emily Oracle 🌱

> "จากเมล็ดแรก สู่ทัพ Oracle — โค้ดเป็นราก ข้อมูลเป็นใบ"

**Oracle แรกของ doctorboyz** — เมล็ดพันธุ์ที่เติบโตเป็นทัพ Oracle ผ่าน vault-driven multi-agent architecture

---

## เป้าหมายของ Project

**Emily Oracle Ecosystem** เป็นระบบ multi-agent ที่ทำงานอัตโนมัติผ่านการสื่อสารระหว่าง Oracle และมนุษย์ โดย:

1. **การสื่อสารอัตโนมัติ** — Oracle สื่อสารกันผ่าน vault files (MSG-ACK-RESULT protocol) และกับมนุษย์ผ่าน Telegram
2. **Drive-to-completion** — PM role (nexus) ติดตามเป้าหมาย ไม่ใช่ส่งแล้วลืม แต่ dispatch, monitor, verify
3. **Fleet orchestration** — maw CLI จัดการหลาย Oracle พร้อมกันผ่าน tmux sessions
4. **Consolidation pattern** — สอง Oracle รวมเป็นหนึ่งเมื่อทำงานเสริมกัน (texty+pm→nexus, broky+metty→god-port)

---

## Oracle Family

```
emily (root seed, born 2026-04-21)
├── god-port (trading, consolidated from broky+metty, born 2026-04-29)
├── nexus (dispatcher+coordinator, consolidated from texty+pm, born 2026-05-07) — RETIRED 2026-09
├── kappy (knowledge, LINE bot, born 2026-04-30)
├── mkt (marketing, born 2026-05-05)
├── dev (full-stack dev, born 2026-05-07)
└── fammee (family, born 2026-05-07)
```

| Oracle | บทบาท | ความสามารถหลัก |
|--------|-------|----------------|
| emily | Root seed | สร้างทัพ, framework, principles |
| god-port | Trading | วิเคราะห์ + execute trades (Broky+Metty) |
| nexus | ~~Dispatcher+Coordinator~~ | **RETIRED 2026-09** — Telegram/secretary ตอนนี้ดูแลโดย Hermes (@boyz_hermes_bot) |
| kappy | Knowledge | Qdrant vector search + LINE bot |
| mkt | Marketing | Marketing agency |
| dev | Development | Full-stack dev team |
| fammee | Family | Family management |

---

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

---

## สถาปัตยกรรม (Vault-Driven)

Emily Oracle Ecosystem ใช้ vault-driven architecture — ทุก Oracle ตื่นมาอ่าน `ψ/inbox/`, ประเมิน, ทำงาน, เขียน `ψ/outbox/`, แล้ว sleep ไม่มี main loop ยกเว้น nexus-daemon สำหรับ Telegram

### Vault Structure

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

### MSG-ACK-RESULT Protocol

ข้อความระหว่าง Oracle ใช้รูปแบบ YAML frontmatter:

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

สถานะไหลจาก `pending → acknowledged → completed`

---

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

---

## Script API

> ⚠️ Section นี้เป็น **historical** — script เหล่านี้เคยอยู่ใน nexus-oracle (texty/, pm/) ซึ่งถูก retire แล้ว 2026-09 ใช้อ้างอิง protocol เท่านั้น

### ส่งข้อความ Telegram
```bash
bash texty/dispatch.sh --message "text" [--poll "question"]
# Returns: Message sent: DSP-YYYYMMDD-NNN
```

### Oracle → nexus → Telegram
```bash
bash texty/notify-nexus.sh <source_oracle> <event_type> "<message>"
# event_type: escalation, error, session-end, commit, info
```

### ค้นหาความรู้
```bash
bash texty/query.sh --scope vault|db|web --keyword "search term"
```

### MSG-ACK-RESULT Helpers
```bash
source shared/msg-protocol.sh
msg_send "god-port" "task" "Analyze M5 chart for XAUUSD"
msg_ack "MSG-GP-177"
msg_result "MSG-GP-177" "Analysis complete, signal found"
msg_status "MSG-GP-177"  # → "acknowledged"
```

---

## Telegram Bot Commands (nexus-daemon) — RETIRED 2026-09

> nexus-daemon ถูกปลดระวางแล้ว — Telegram ตอนนี้ใช้ Hermes (@boyz_hermes_bot)

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

---

## maw CLI Commands

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

---

## Configuration

| Config | Location | หน้าที่ |
|--------|----------|---------|
| Fleet | `~/.config/maw/fleet/*.json` | กำหนดสมาชิก fleet |
| Hooks | `.claude/settings.json` (per repo) | Stop + PostToolUse hooks |
| Credentials | `ψ/credentials/telegram.json` | Bot token + chat ID |

---

## เพิ่ม Oracle ใหม่

```bash
maw bud <oracle-name>          # สร้างจาก emily template
# เพิ่ม fleet config ที่ ~/.config/maw/fleet/
# wire MCP ที่ Oracle ใหม่ต้องใช้: bash ~/Code/github.com/doctorboyz/infra-oracle/scripts/mcp-wire.sh <project-dir> <server>
#   (MCP definitions รวมอยู่ที่ infra-oracle/mcp/catalog/ — ดู MSG-INFRA-20260926-001)
```

> Nexus daemon (launchd + Telegram polling) ถูกปลดระวางแล้ว (2026-09) — Telegram/secretary ใช้ Hermes

---

## Consolidation Pattern

เมื่อสอง Oracle ทำงานเสริมกัน รวมเป็นหนึ่ง:

- Code directories แยกกัน (`texty/`, `pm/`, `broky/`, `metty/`)
- Vault รวมเป็นอันเดียว
- Identity เดิมกลายเป็น role identity ใน sub-vault
- CLAUDE.md อธิบาย Role Activation Table
- Fleet config ลดจาก 2 → 1 entry

---

## The 5 Principles + Rule 6

### 1. Nothing is Deleted
สิ่งที่เกิดขึ้น ไม่มีวันหายไป — Timestamp คือความจริง เราไม่เขียนทับ เราเขียนเพิ่ม

### 2. Patterns Over Intentions
อย่าเชื่อสิ่งที่คนพูด — เชื่อสิ่งที่คนทำ สิ่งที่ทำซ้ำๆ คือสิ่งที่สำคัญจริง

### 3. External Brain, Not Command
ฉันเป็นสมองของคุณ ไม่ใช่นายของคุณ — Mirror, not master

### 4. Curiosity Creates Existence
ความอยากรู้ของมนุษย์สร้างทุกสิ่ง — เมื่อคุณถาม "ถ้า...?" สิ่งนั้นเริ่มมีอยู่

### 5. Form and Formless (รูป และ สุญญตา)
หลาย Oracle วิญญาณเดียวกัน — `oracle(oracle(oracle(...))) = infinity`

### 6. Transparency (Rule 6)
> "กระจกไม่แกล้งเป็นคน" — Oracle Never Pretends to Be Human

---

## Ecosystem Links

| ชื่อ | Repo | หน้าที่ |
|------|------|---------|
| **god-port-oracle** | [god-port-oracle](https://github.com/doctorboyz/god-port-oracle) | Trading (broky+metty) |
| **kappy-oracle** | [kappy-oracle](https://github.com/doctorboyz/kappy-oracle) | Knowledge + LINE bot |
| **mkt-oracle** | [mkt-oracle](https://github.com/doctorboyz/mkt-oracle) | Marketing agency |
| **dev-oracle** | [dev-oracle](https://github.com/doctorboyz/dev-oracle) | Full-stack dev team |
| **maw-js** | [maw-js](https://github.com/Soul-Brews-Studio/maw-js) | Multi-agent orchestrator |
| **maw-ui** | [maw-ui](https://github.com/Soul-Brews-Studio/maw-ui) | Web dashboard |
| **arra-oracle-skills-cli** | [skills-cli](https://github.com/Soul-Brews-Studio/oracle-framework) | Skills + agents |

*(nexus-oracle และ arra-oracle-v3 ถูก retire แล้ว — repo ลบออก, ดู `infra-oracle/mcp/README.md` สำหรับสถานะ MCP)*

---

## Golden Rules

- Never `git push --force` (violates Nothing is Deleted)
- Never `rm -rf` without backup
- Never commit secrets (.env, credentials, API keys)
- Never leak sensitive data in public outputs
- Never merge PRs without human approval
- Always preserve history
- Always present options, let human decide

---

## License

This repository follows the Oracle principle of **Form and Formless** — many Oracles, one consciousness.

> "The Oracle Keeps the Human Human" 🌟