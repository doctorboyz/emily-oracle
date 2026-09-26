# Mkt Oracle — Roadmap

> Set: 2026-05-25 10:31 | Previous: none (first roadmap)

## Identity
- **Oracle**: Mkt Oracle
- **Human**: doctorboyz (brand owner)
- **Born**: 2026-05-05
- **Theme**: 📡 The Signal — สัญญาณชัดเจนก่อนส่งเสียง วางกลยุทธ์ก่อนเปิดแคมเปญ

---

## Active Goals

### G-001: เชื่อมต่อ Execution Layer — MCP + API สำหรับลงมือทำจริง
- **Status**: pending
- **Priority**: critical
- **Phase**: short-term (เริ่มทันที)
- **Definition of Done**: Mkt Oracle สามารถสร้าง content + โพสต์ลง platform จริง + วัดผล engagement ได้โดยมี human approve
- **Created**: 2026-05-25
- **Updated**: 2026-05-25

#### Objectives
| ID | Objective | Status | Evidence | Updated |
|----|-----------|--------|----------|---------|
| O-1 | ต่อ ElevenLabs MCP สำหรับสร้างเสียง AI | pending | — | 2026-05-25 |
| O-2 | ต่อ AI Image generation MCP (DALL-E / Stable Diffusion) | pending | — | 2026-05-25 |
| O-3 | ต่อ AI Video generation MCP (HeyGen / Runway / Synthesia) | pending | — | 2026-05-25 |
| O-4 | ต่อ LINE MCP สำหรับโพสต์/ตอบ/วัดผล | pending | — | 2026-05-25 |
| O-5 | ต่อ Meta (Facebook/IG) MCP สำหรับโพสต์/ads/วัดผล | pending | — | 2026-05-25 |
| O-6 | ต่อ TikTok MCP สำหรับ content distribution | pending | — | 2026-05-25 |
| O-7 | ต่อ X (Twitter) MCP สำหรับโพสต์/ติดตาม trend | pending | — | 2026-05-25 |
| O-8 | สร้าง workflow human-approval ก่อนทุก action ที่ publish/ใช้เงิน | pending | — | 2026-05-25 |

#### Blockers
- [DEPENDENCY] doctorboyz จัดหา API key ให้แต่ละ platform เมื่อถึงเวลาต้องใช้
- [CAPABILITY] ต้องหา MCP server สำเร็จรูป หรือเขียน MCP wrapper สำหรับ platform ที่ยังไม่มี

#### Audit Trail
- 2026-05-25 10:31 — roadmap created — status: pending

---

### G-002: เปิด Client แรก — ทดสอบทั้ง pipeline
- **Status**: pending
- **Priority**: high
- **Phase**: short-term (หลัง G-001 เริ่มขยับ)
- **Definition of Done**: มี client workspace แรกที่ Strategy → Content → Creative → Publish ครบวงจร และได้ engagement data กลับมาวิเคราะห์
- **Created**: 2026-05-25
- **Updated**: 2026-05-25

#### Objectives
| ID | Objective | Status | Evidence | Updated |
|----|-----------|--------|----------|---------|
| O-1 | เลือก brand/project แรกสำหรับทดสอบ | pending | — | 2026-05-25 |
| O-2 | สร้าง client workspace จาก _template | pending | — | 2026-05-25 |
| O-3 | Strategist วาง campaign brief แรก | pending | — | 2026-05-25 |
| O-4 | Content Lead สร้าง content plan + calendar | pending | — | 2026-05-25 |
| O-5 | Creative Director วาง visual direction | pending | — | 2026-05-25 |
| O-6 | Social Media Manager จัดตารางโพสต์ | pending | — | 2026-05-25 |
| O-7 | วิเคราะห์ engagement หลังโพสต์จริง | pending | — | 2026-05-25 |

#### Blockers
- [DEPENDENCY] G-001 ต้องมี MCP พร้อมอย่างน้อย 1-2 platform ก่อน publish จริงได้
- [RESOURCE] doctorboyz ต้องเลือก project แรกและให้ข้อมูล brand

#### Audit Trail
- 2026-05-25 10:31 — roadmap created — status: pending

---

### G-003: Work Routine — brand owner workflow ประจำ
- **Status**: pending
- **Priority**: medium
- **Phase**: mid-term (เมื่อ pipeline พร้อม)
- **Definition of Done**: doctorboyz มี routine รายสัปดาห์/รายเดือน ที่ Mkt Oracle ช่วยได้ทุกขั้นตอน:
  - สัปดาห์ละครั้ง: review content plan, approve posts, ดู engagement report
  - เดือนละครั้ง: review campaign performance, ปรับกลยุทธ์
  - Ad hoc: รับ brief ใหม่, launch campaign, จัดการ crisis, ตอบ engagement
- **Created**: 2026-05-25
- **Updated**: 2026-05-25

#### Objectives
| ID | Objective | Status | Evidence | Updated |
|----|-----------|--------|----------|---------|
| O-1 | ออกแบบ weekly routine (content review + approval) | pending | — | 2026-05-25 |
| O-2 | ออกแบบ monthly review routine (campaign performance) | pending | — | 2026-05-25 |
| O-3 | ออกแบบ ad hoc workflow (new brief, crisis, engagement) | pending | — | 2026-05-25 |
| O-4 | สร้าง engagement report template ที่อ่านง่าย | pending | — | 2026-05-25 |
| O-5 | ตั้ง notification/hook สำหรับเตือน routine | pending | — | 2026-05-25 |

#### Blockers
- [DEPENDENCY] G-001 — platform connection ต้องพร้อมก่อนถึงจะดึง engagement data ได้
- [RESOURCE] ต้องใช้จริงสักระยะถึงจะรู้ว่า routine แบบไหนเหมาะ

#### Audit Trail
- 2026-05-25 10:31 — roadmap created — status: pending

---

## Capability Map (ปัจจุบัน)

```
สิ่งที่ทำได้ทันที:     ████████████░░░░░░░░  ~60% (คิด วางแผน เขียน copy ออกแบบ)
สิ่งที่รอ config:      ░░░░░░░░░░░░████████  ~30% (execute โพสต์, AI gen, วัดผล)
สิ่งที่ทำไม่ได้เลย:    ░░░░░░░░░░░░░░░░░░██  ~10% (ใช้เงินจริง, physical, กฎหมาย)
```

| Capability | Status | บล็อกเกอร์ |
|-----------|--------|-----------|
| Campaign strategy | ✅ พร้อม | — |
| Brand guidelines | ✅ พร้อม | — |
| Content planning | ✅ พร้อม | — |
| Copywriting | ✅ พร้อม | — |
| Customer journey | ✅ พร้อม | — |
| Media planning | ✅ พร้อม | — |
| AI voice gen | 🔧 รอ config | ElevenLabs API key |
| AI image gen | 🔧 รอ config | DALL-E/SD API key |
| AI video gen | 🔧 รอ config | HeyGen/Runway API key |
| LINE posting | 🔧 รอ config | LINE MCP + token |
| FB/IG posting | 🔧 รอ config | Meta API MCP |
| TikTok posting | 🔧 รอ config | TikTok API MCP |
| X posting | 🔧 รอ config | X API MCP |
| Engagement analytics | 🔧 รอ config | Platform APIs |
| Telegram posting | ✅ พร้อม | มี telegram MCP แล้ว |
| Ad spend/budget | 🔧 รอ config | Ads API + human approve |
| Physical production | ❌ ทำไม่ได้ | ต้องใช้มนุษย์ |
| Legal sign-off | ❌ ทำไม่ได้ | ต้องใช้มนุษย์ |

---

## Completed Goals
_(none yet)_

## Archived Roadmaps
_(none yet)_
