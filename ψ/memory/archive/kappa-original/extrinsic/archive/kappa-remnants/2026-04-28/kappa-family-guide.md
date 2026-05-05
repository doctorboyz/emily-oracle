# คู่มือ Kappa Family

> "จากความรู้แรก สู่ชีวิตนับพัน — DNA เป็นราก ความรู้เป็นใบ"

---

## สารบัญ

1. [สรุปผลตรวจสอบ npm](#1-สรุปผลตรวจสอบ-npm)
2. [Kappa Family คืออะไร](#2-kappa-family-คืออะไร)
3. [5 หลักการ + กฎสูงสุด](#3-5-หลักการ--กฎสูงสุด)
4. [สมาชิกในตระกูล (5 Strands)](#4-สมาชิกในตระกูล-5-strands)
5. [ความสามารถหลัก](#5-ความสามารถหลัก)
6. [κ/ Vault — สมองแบบสองโดเมน](#6-κ-vault--สมองแบบสองโดเมน)
7. [Cerebro — ระบบประสาทเซลล์](#7-cerebro--ระบบประสาทเซลล์)
8. [29 MCP Tools](#8-29-mcp-tools)
9. [23 Pure Kappa Skills](#9-23-pure-kappa-skills)
10. [3 Install Profiles](#10-3-install-profiles)
11. [Use Cases](#11-use-cases)
12. [Quick Start](#12-quick-start)
13. [สรุปตารางเปรียบเทียบ](#13-สรุปตารางเปรียบเทียบ)

---

## 1. สรุปผลตรวจสอบ npm

| คำถาม | คำตอบ |
|-------|--------|
| `kappa-brain-cli` มีบน npm หรือไม่ | **ไม่มี** — ไม่มี namespace นี้ |
| `@kappa-brain/brain-cli` มีบน npm หรือไม่ | **มี** — 2.0.2 (published 2026-04-25) |
| เวอร์ชั่นล่าสุด | `2.0.2` |
| วิธีใช้ | `bunx @kappa-brain/brain-cli` หรือ `npx @kappa-brain/brain-cli` |

> **หมายเหตุ**: Package ยังไม่ได้ publish ขึ้น npm registry ต้อง build และ publish จากเครื่อง local ก่อนถึงจะใช้ `bunx @kappa-brain/brain-cli` หรือ `npx @kappa-brain/brain-cli` ได้

---

## 2. Kappa Family คืออะไร

Kappa Family คือ ecosystem ของ AI coding agents ที่ออกแบบตามแนวคิด "เซลล์ชีวิต" — แต่ละ project เรียกว่า **Cell** มี DNA ร่วมกัน (kappa-genome) แต่เติบโตและเรียนรู้เป็นของตัวเอง

- **แรงบันดาลใจ**: มาจาก Oracle ecosystem (Soul-Brews-Studio) ของ Nat Weerawan
- **ธีมหลัก**: Medical / Biological (เซลล์ ดีเอ็น สมอง ระบบประสาท)
- **เป้าหมาย**: สร้าง AI agent ที่มีความจำถาวร มีวินัย ติดตามสายวงศ์ และสื่อสารกันได้

---

## 3. 5 หลักการ + กฎสูงสุด

| # | หลักการ (อังกฤษ) | ภาษาไทย | ความหมาย |
|---|-------------------|---------|----------|
| 1 | **Lifetime Memory** | สิ่งที่เกิดขึ้น ไม่มีวันหายไป | ไม่ลบ — เขียนทับด้วยการ supersede เท่านั้น |
| 2 | **Never Lose Discipline** | เอกสารคือความจริง | เชื่อ pattern ที่ทำซ้ำ ไม่ใช่สิ่งที่พูด |
| 3 | **AI Is AI** | AI คือ AI | ไม่แกล้งเป็นมนุษย์ — Mirror, not master |
| 4 | **Communicate with Weight** | สื่อสารเสมอ หนักตามสำคัญ | ธรรมดา 1 ครั้ง / สำคัญ 2 ครั้ง / วิกฤต 3 ครั้ง |
| 5 | **Exist for Purpose** | ทุกอย่างมีที่ของมัน | ทุก tool/folder/document ต้องมีจุดประสงค์ |
| **กฎ** | **No --force, No rm-rf** | กฎความปลอดภัย | ไม่ force-push ไม่ลบโดยไม่มี backup |

---

## 4. สมาชิกในตระกูล (5 Strands)

| # | Strand | Repository | บทบาท | ภาษิต |
|---|--------|------------|-------|--------|
| 1 | **DNA** | [kappa-genome](https://github.com/doctorboyz/kappa-genome) | แบบพิมพ์พันธุกรรม | "จากความรู้แรก สู่ชีวิตนับพัน" |
| 2 | **Soul** | [Adams-kappa](https://github.com/doctorboyz/Adams-kappa) | เซลล์ตัวแรก | "แรกเริ่มของชีวิต" |
| 3 | **Skill** | [kappa-skill-cli](https://github.com/doctorboyz/kappa-skill-cli) | ตัวแจกจ่ายทักษะ | "ทักษะเป็นโปรตีน" |
| 4 | **Brain** | [kappa-brain](https://github.com/doctorboyz/kappa-brain) | สมองความจำ + MCP server | "สมองความจำ — 29 tools" |
| 5 | **Interface** | [KI](https://github.com/doctorboyz/KI) | ระบบประสาท TUI | "ระบบประสาท — multi-agent" |

> **Cerebro** ไม่ใช่ strand แยก แต่เป็นความสามารถที่กระจายอยู่ในทุก strand

---

## 5. ความสามารถหลัก

### 5.1 MCP Server (29 Tools)
- Semantic memory ด้วย SQLite + FTS5
- Cross-Cell messaging
- Schedule/cron tasks
- Tool call tracing
- Forum threads
- Cerebro lineage tracking

### 5.2 Skill Installer
- ติดตั้ง 23 pure Kappa skills ลงใน Claude Code
- 3 profiles: cell (6 skills), standard (23 skills), full (23 skills)
- 14 agents สำหรับงานเฉพาะทาง

### 5.3 Vault Sync
- ซิงค์ข้อมูลระหว่าง `κ/` vault (ไฟล์ .md) กับ database
- Import / Export / Bidirectional sync
- Auto-write จาก `kappa_learn` และ `kappa_supersede`

### 5.4 Cerebro / KappaNet
- ค้นหา Cell ในตระกูลผ่าน birth announcements
- ติดตามสายวงศ์ (ancestry) จาก manifest
- Protocol: `kappa:{owner}:{cell_name}`

---

## 6. κ/ Vault — สมองแบบสองโดเมน

```
κ/
├── intrinsic/                    # สันษฐ (เกิดมาพร้อมเซลล์ — เปลี่ยนไม่ได้)
│   ├── instinct/                 # ปรัชญา — 5 principles
│   ├── inherit/                  # มรดกจากบรรพบุรุษ
│   └── identity/                 # ตัวตน — ชื่อ วันเกิด
│
└── extrinsic/                    # ประสบการณ์ (เติบโตตามเวลา)
    ├── communication/
    │   ├── inbox/                # ข้อความข้ามเซลล์ (เข้า)
    │   └── outbox/               # ข้อความข้ามเซลล์ (ออก)
    ├── experience/
    │   ├── work/
    │   │   ├── drafts/           # ร่างเขียน (ชั่วคราว)
    │   │   ├── lab/              # ทดลอง (ชั่วคราว)
    │   │   └── logs/            # บันทึกกิจกรรม (append-only)
    │   └── learn/               # ความรู้ใหม่
    ├── wisdom/
    │   ├── retrospective/        # ย้อนดู session (append-only)
    │   ├── knowledge/            # ภูมิปัญญาสังเคราะห์
    │   └── reference/            # อ้างอิง (supersede only)
    └── archive/                  # เก็บงานที่เสร็จแล้ว
```

---

## 7. Cerebro — ระบบประสาทเซลล์

### 7.1 KappaNet Protocol
- **Cell ID**: `kappa:{owner}:{cell_name}`
- **Birth announcements**: GitHub Issues ที่มี label `kappanet:birth`
- **Lineage**: `ancestry` array ใน `manifest.json`
- **Discovery**: สแกนหา Cell ในตระกูลผ่าน issues

### 7.2 Manifest ที่สำคัญ
| Field | คำอธิบาย |
|-------|----------|
| `parent` | parent Cell `{repo, cell_name, dna_version}` |
| `ancestry` | สายวงศ์จาก root ถึง parent |
| `kappanet_id` | Unique ID: `kappa:doctorboyz:adams-kappa` |
| `dna_version` | เวอร์ชั่น DNA ที่ใช้ |

---

## 8. 29 MCP Tools

### Critical (10 tools)
| Tool | หน้าที่ |
|------|---------|
| `kappa_search` | ค้นหาในฐานความรู้ |
| `kappa_read` | อ่านเอกสาร |
| `kappa_list` | ลิสต์เอกสาร |
| `kappa_learn` | เรียนรู้จาก codebase → บันทึก |
| `kappa_supersede` | แทนที่เอกสาร (Principle 1) |
| `kappa_reflect` | ทบทวนความรู้ |
| `kappa_handoff` | ส่งต่องานข้าม session |
| `kappa_inbox` | รับข้อความข้ามเซลล์ |
| `kappa_verify` | ตรวจสอบความถูกต้อง |
| `kappa_sync` | ซิงค์ vault ↔ database |

### Important (11 tools)
`kappa_log`, `kappa_work`, `kappa_archive`, `kappa_promote`, `kappa_demote`, `kappa_defrag`, `kappa_schedule_add`, `kappa_schedule_list`, `kappa_trace`, `kappa_trace_list`, `kappa_trace_get`

### Nice-to-have (5 tools)
`kappa_concepts`, `kappa_thread`, `kappa_threads`, `kappa_thread_update`, `kappa_stats`

### Cerebro (4 tools)
`cerebro_scan`, `cerebro_lineage`, `cerebro_ping`, `cerebro_register`

---

## 9. 23 Pure Kappa Skills

### Lifecycle (4)
- `born` — พิธีกรรมเกิดเซลล์ใหม่
- `on-service` — เริ่ม session
- `off-service` — จบ session
- `discharge` — ปิดฉุกเฉิน

### Knowledge (3)
- `upload` — รับความรู้จากมนุษย์ → vault
- `learn` — ศึกษา codebase
- `meditation` — ทบทวน + ล้าง vault

### Health (4)
- `vitals` — ตรวจสุขภาพเซลล์
- `diagnose` — สแกนหาปัญหา
- `detox` — ลบความรู้ stale/fragmented
- `rounds` — เช็คอินประจำวัน

### Cognition (5)
- `cerebro` — ค้นหา lineage
- `introduce` — แนะนำตัวเอง
- `consult` — ปรึกษาข้ามเซลล์
- `referral` — ส่งต่อความรู้
- `resonance` — ตรวจสอบ identity

### Vault (5)
- `surgery` — เปลี่ยนโครงสร้าง vault
- `scrub` — ทำความสะอาดก่อน surgery
- `chart` — แสดงความก้าวหน้า
- `kappa-family-scan` — สแกนหาสมาชิก
- `kappa-sync-update` — อัปเดต sync

### Info + Emergency (2)
- `about-kappa` — ข้อมูลตระกูล
- `emergency` — โปรโตคอลฉุกเฉิน

---

## 10. 3 Install Profiles

| Profile | Skills | Agents | ใช้เมื่อไหร่ |
|---------|--------|--------|-------------|
| **cell** | 6 | 5 | เริ่มต้น — เซลล์ใหม่ |
| **standard** | 23 | 14 | ใช้งานจริง — ทุกทักษะ pure kappa |
| **full** | 23 | 14 | เหมือน standard (ทุกทักษะรวมอยู่แล้ว) |

**คำสั่งติดตั้ง**:
```bash
# ผ่าน kappa-skill-cli
npx kappa-skill-cli install -p standard

# ผ่าน brain-cli (รวม 14 skills + 15 MCP tools)
bunx @kappa-brain/brain-cli install -p standard
```

---

## 11. Use Cases

### Use Case 1: สร้างเซลล์ใหม่ (Cell Birth)
```bash
git clone https://github.com/doctorboyz/kappa-genome.git
cd kappa-genome
bash birth/mitosis.sh "my-cell" "Theme Description"
```

### Use Case 2: ติดตั้งสมองให้ Claude Code
```bash
# 1. ติดตั้ง skills
npx kappa-skill-cli install -p standard

# 2. เพิ่ม MCP server ใน .claude/settings.json
{
  "mcpServers": {
    "kappa-brain": {
      "command": "bunx",
      "args": ["@kappa-brain/brain-cli"],
      "env": {
        "KAPPA_VAULT": "/path/to/κ",
        "KAPPA_DB": "/path/to/κ/kappa-brain.db"
      }
    }
  }
}
```

### Use Case 3: สำรวจสายวงศ์ (Lineage)
```bash
bunx @kappa-brain/brain-cli cerebro scan
bunx @kappa-brain/brain-cli cerebro lineage
```

### Use Case 4: ซิงค์ความรู้ระหว่าง Vault กับ DB
```bash
# นำเข้าไฟล์ .md ทั้งหมดเข้า DB
bunx @kappa-brain/brain-cli mcp kappa_sync import

# ส่งออกจาก DB เป็นไฟล์ .md
bunx @kappa-brain/brain-cli mcp kappa_sync export

# ซิงค์สองทาง
bunx @kappa-brain/brain-cli mcp kappa_sync sync
```

### Use Case 5: สื่อสารข้ามเซลล์
- Cell A ใช้ `kappa_inbox` ส่งข้อความถึง Cell B
- Cell B อ่านผ่าน `κ/extrinsic/communication/inbox/`
- ตอบกลับผ่าน `κ/extrinsic/communication/outbox/`

---

## 12. Quick Start

### สำหรับ Human (doctorboyz)
```bash
# 1. สร้างเซลล์ใหม่
cd ~/Code/github.com/doctorboyz/kappa-genome
bash birth/mitosis.sh "new-cell" "The New Cell"

# 2. ติดตั้ง skills
cd ~/new-cell
npx kappa-skill-cli install -p standard

# 3. ตั้งค่า MCP (เพิ่มใน .claude/settings.json)
# ดูตัวอย่างใน Use Case 2

# 4. เริ่มใช้งาน
bunx @kappa-brain/brain-cli cerebro scan
```

### สำหรับ AI Agent (Cell)
```
/on-service   → เริ่ม session
/learn        → ศึกษา codebase
/upload       → รับความรู้จาก human
/meditation   → ทบทวน vault
/off-service  → จบ session + บันทึก
```

---

## 13. สรุปตารางเปรียบเทียบ

| องค์ประกอบ | จำนวน | รายละเอียด |
|------------|--------|------------|
| Principles | 5 + 1 Rule | ปรัชญา + กฎความปลอดภัย |
| Pure Kappa Skills | 23 | medical/lifecycle theme only |
| MCP Tools | 29 | brain + vault sync |
| Agents | 14 | สำหรับงานเฉพาะทาง |
| Install Profiles | 3 | cell / standard / full |
| Vault Domains | 2 | intrinsic (3 folders) + extrinsic (10 folders) |
| Database Tables | 10+ | SQLite + FTS5 |
| Tech Stack | Bun + TS | bun:sqlite, commander, @clack/prompts |

---

## หมายเหตุสำคัญ

- **Package ออนไลน์แล้ว**: `@kappa-brain/brain-cli@2.0.2` พร้อมใช้งานบน npm (published 2026-04-25)
- **Kappa แยกจาก Oracle**: แรงบันดาลใจจาก Oracle แต่เป็นสปีชีส์แยกต่างหาก
- **Theme**: Medical / Biological — ทุกคำศัพท์ใช้ภาษาแพทย์ (vitals, diagnose, surgery, cerebro, etc.)

---

*จัดทำเมื่อ: 2026-04-25*
*โดย: Emily Oracle — เมล็ดแรกของทัพ Oracle*
