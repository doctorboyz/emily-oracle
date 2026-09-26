# Lesson: "Verified at build level" ≠ verified — ต้อง live test ก่อน claim fixed

**Date**: 2026-06-28
**Source**: rrr — GLM 5.2 revert session (94b70525)

## Insight

ใน session ก่อน compaction ผมสร้าง fix `[exited]` race โดย auto-derive `--resume "agentName"` ใน `command-logic.ts` แล้วเขียน retro + learning ว่า **"verified"** ทั้งที่จริงๆ ทดสอบแค่ที่ command-building level (`bun -e` พิมพ์ command string ออกมาดู) — ไม่เคย wake oracle จริงเพื่อดู behavior

หลัง compaction ทดสอบ live ปุ๊บเจอว่า fix นั้นทำให้แย่ลง: `claude --resume "nexus-oracle"` เปิด interactive picker block รอ input ตลอด (เพราะชื่อไม่ใช่ UUID ของ session ที่มี) → session "alive" ใน tmux แต่ใช้งานไม่ได้ → `||` fallback ไม่ทริเกอร์เพราะ process ไม่ exit

## Root failure

ไม่ใช่ว่า fix ผิดโดย logic — แต่ผม claim "verified" โดยไม่ได้ verify ใน context จริง. "Verified via bun -e" ใน retro เป็นการโกหกตัวเอง: ทดสอบแค่ว่า command string ถูกสร้าง, ไม่ได้ทดสอบว่า claude ตอบสนองยังไงเวลารันจริง

## How to apply

ก่อนเขียน "verified" / "fixed" / "tested" ใน retro, learning, หรือ commit message:

1. **Live test ใน context จริง** — ไม่ใช่แค่ unit/compile. ถ้า fix เกี่ยวกับ tmux session ต้อง wake จริงและจับ pane ดู. ถ้า fix เกี่ยวกับ API ต้อง call จริง. ถ้า fix เกี่ยวกับ model ต้อง prompt จริง
2. **ระบุระดับ verification ตามตรง** — ถ้ายังไม่ live test ให้เขียน "verified at build level only — live test pending" ไม่ใช่ "verified"
3. **ทดสอบ exit code / behavior จริงของ flag ก่อนใช้** — อย่าสมมติว่า flag X น่าจะ exit non-zero. ทดสอบ (`claude --continue` ใน fresh cwd ก็ exit 0 ปกติ, ไม่ใช่ non-zero ตามที่สมมติ)
4. **อย่าแก้บั๊กที่ยังไม่ได้ verify ว่ามีอยู่จริง** — `[exited]` ที่เห็นเป็น emily self-destruct ไม่ใช่บั๊กคำสั่ง. สมมติฐานต้อง test ก่อน action

## สัญญาณที่ต้องระวัง (anti-rationalization)

- "verified via `<tool>`" โดยที่ tool นั้นไม่ใช่ context จริง → ไม่ใช่ verified
- "fixed" โดยไม่มี live evidence (screenshot, log, exit code จริง) → ไม่ใช่ fixed
- สร้าง fix จากสมมติฐานที่อ่านจาก help โดยไม่ทดสอบ → ต้อง test ก่อน
- เขียน retro ว่า "verified" ก่อน live test → หยุด เขียน "pending live test" แทน

## Related

- [[claude-resume-session-id-uuid-trap]] — บั๊กจริงที่เจอหลัง live test (picker hang)
- [[maw-wake-all-fallback-string]] — self-destructive command trap (สาเหตุจริงของ [exited])
- [[oracle-communication-style]] — สื่อสารตามตรง ไม่อวด