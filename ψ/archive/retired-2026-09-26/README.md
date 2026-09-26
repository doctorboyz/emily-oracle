# Retired & Consolidated — 2026-09-26

> การเก็บกวาดใหญ่ปี 2026-09-26 — โดย Infra Oracle (คำสั่ง doctorboyz)
> หลัก: Nothing is Deleted — history อยู่บน GitHub remote, essence อยู่ที่นี่, local ถูกย้ายเข้า macOS Trash

## สิ่งที่ consolidate เข้า emily

| Project | Essence ที่เก็บ | Remote (history เต็ม) | สถานะ |
|---------|----------------|----------------------|-------|
| emily-skill-cli | merge ทั้ง repo → `emily-oracle/skill-cli/` (subtree, 1.2M) | github.com/doctorboyz/emily-skill-cli | คง remote ไว้เป็น history |
| horoline | `horoline/` — docs ทั้งหมด + knowledge/ + src/ + public/ (~1.2M) | github.com/doctorboyz/horoline | local ถูกย้ายเข้า Trash |
| mkt-oracle | `mkt-oracle/` — ทั้ง repo (ไม่มี remote) + `bundles/mkt-oracle.bundle` (git history เต็ม) | ❌ ไม่มี — bundle คือ copy history เดียวที่เหลือ | ย้ายเข้า Trash |
| psi-reader | `psi-reader/` — reader/ + agent/ + scripts/ + docs (ไม่เคยมี commit) | ❌ ไม่มี — ไม่มี history ให้เก็บ (ไฟล์เป็น essence เอง) | ย้ายเข้า Trash |
| homesale | ไม่มี content (repo ว่าง ไม่มี commit) | github.com/doctorboyz/homesale | ย้ายเข้า Trash |

## สิ่งที่ถูกลบ local (history อยู่บน GitHub)

ทิ้ง dirty working trees ตามคำสั่ง ("ทิ้งไป") — unpushed commits บันทึกไว้ด้านล่างเพื่อค้นจาก Trash ได้:

| Repo | Remote | Unpushed commits ตอนลบ |
|------|--------|------------------------|
| csuite | github.com/doctorboyz/csuite | 0 |
| dev-oracle | ⚠️ remote ชี้ csuite.git (มั่วมาก่อนหน้านี้) | 0 |
| omni-chat | github.com/doctorboyz/omni-chat | 1 |
| hzc-oracle | github.com/doctorboyz/hzc-oracle | 11 |
| funny-oracle | github.com/doctorboyz/funny-oracle | 0 |
| bit-god-oracle | github.com/doctorboyz/bit-god-oracle | 1 |

## ที่เก็บ local ต่อ

- **Lita-Game** (`~/Code/github.com/doctorboyz/Lita-Game`) — สั่งเก็บ local ไว้ (14M, ไม่มี git, ไม่มีบน GitHub — copy เดียวในโลก)

## ทำความสะอาดประกอบ

- `com.kappy-oracle.daemon` — unload + plist ย้ายไป `~/Library/LaunchAgents/disabled/` (repo หายไปก่อนหน้า, daemon failing exit 78)
- `ai.openclaw.gateway` — plist ย้ายไป disabled/ (แทนด้วย ai.hermes.gateway แล้ว)