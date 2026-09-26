# Lesson: claude --resume / --session-id ต้องการ UUID จริง ใช้ชื่อไม่ได้

**Date**: 2026-06-28
**Source**: maw [exited] fix attempt — GLM 5.2 session

## Insight

พยายามแก้ `[exited]` race ใน `maw wake` โดย auto-derive sessionId จาก agentName แล้วแทน `--continue` เป็น `--resume "<agentName>" || --session-id "<agentName>"`. **ผิดทั้งสองด้าน**:

1. **`claude --resume [value]`** = "Resume by session ID, **or open interactive picker with optional filter**". ถ้า value ไม่ตรง UUID ของ session ที่มี → เปิด interactive picker filter ด้วย value นั้น → **block รอ input ตลอด** (process ไม่ exit → `||` fallback ไม่ทริเกอร์ → pane ค้างบน picker ดูเหมือน "alive" แต่ใช้งานไม่ได้)

2. **`claude --session-id <uuid>`** = "Use a specific session ID (must be a valid UUID)". ใส่ชื่อเช่น `"nexus-oracle"` → `Error: Invalid session ID. Must be a valid UUID.` (exit 0 ไม่ใช่ non-zero → `||` ไม่ทริเกอร์อีก)

## การตรวจสอบจริง (claude --help)

```
-r, --resume [value]      Resume a conversation by session ID, or
                          open interactive picker with optional [filter]
--session-id <uuid>       Use a specific session ID for the
                          conversation (must be a valid UUID)
-c, --continue            Continue the most recent conversation in
                          the current directory
```

## What actually works

`claude --continue` ใน cwd ที่ยังไม่มี prior session **ไม่ได้ exit** — มันเปิด claude ใหม่ปกติ (verified: ตอบ "OK" ใน print mode, exit 0). ดังนั้น pattern `cmd --continue || cmd` (ที่ maw ใช้อยู่เดิม) **ไม่มี race** — `--continue` ไม่เคย exit กลางคันเพราะไม่มี session

`[exited]` ที่ user เห็นใน `maw wake emily` ระหว่าง rewake loop ไม่ใช่บั๊กของคำสั่ง — เป็น self-destruct: nohup loop ที่ rewake fleet ไป kill emily (session ที่กำลังรันคำสั่งนั้นเอง) ตาม [[maw-wake-all-fallback-string]] self-destructive command trap

## How to apply

- **อย่า auto-derive sessionId จาก agentName** ใน `command-logic.ts` — ชื่อไม่ใช่ UUID
- pattern เดิม `--continue || fresh` ของ maw ใช้ได้ดีอยู่แล้ว อย่าแก้ถ้าไม่มี evidence จริงว่ามัน broken
- ถ้าจะใช้ `--session-id`/`--resume` จริง ต้อง generate + store **UUID จริง** ใน `config.sessionIds[agentName]` และ reuse ทุกครั้ง
- ก่อนแก้ flag race: ทดสอบ exit code จริงใน tmux pane ก่อน อย่าเชื่อ assumption ว่า "flag X น่าจะ exit non-zero"

## การตรวจสอบ fix ผิดกลับตัว

หลัง revert + rebuild: `buildCommand("emily")` กลับเป็น
`ollama launch claude --model glm-5.2:cloud -- --dangerously-skip-permissions --continue || ollama launch claude --model glm-5.2:cloud -- --dangerously-skip-permissions`

ทดสอบ `maw wake nexus` → claude TUI รันจริง (เห็น `❯` prompt + "bypass permissions on") ไม่ติด picker.

## Related

- [[maw-wake-all-fallback-string]] — self-destructive command trap (สาเหตุจริงของ [exited])
- [[maw-ollama-picker]] — {ollama-pick} placeholder pattern