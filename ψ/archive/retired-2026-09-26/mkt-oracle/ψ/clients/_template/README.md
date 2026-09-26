# Client Template

โครงสร้างนี้เป็น template สำหรับสร้าง client/brand/project ใหม่
คัดลอกโฟลเดอร์ `_template/` เป็นชื่อ client แล้วเริ่มกรอกข้อมูล

## วิธีสร้าง client ใหม่

```bash
cp -r ψ/clients/_template ψ/clients/<client-slug>
```

## โครงสร้าง

```
<client-slug>/
├── campaigns/          ← แคมเปญการตลาด
│   ├── active/         ← กำลังทำงาน
│   ├── completed/      ← เสร็จแล้ว
│   └── archived/       ← เก็บถาวร
├── calendar/           ← Content calendar
├── brand/              ← Brand guidelines & persona
├── journey/            ← Customer journey maps
├── creative/           ← Creative briefs & assets
├── channels/           ← Platform configs & connections
└── README.md           ← Client overview
```

## README.md Template

```yaml
---
client: <client-name>
slug: <client-slug>
industry: <industry>
status: active | paused | completed
onboarded: YYYY-MM-DD
---
## Client Overview
## Brand Summary
## Active Campaigns
## Key Contacts
## Notes
```