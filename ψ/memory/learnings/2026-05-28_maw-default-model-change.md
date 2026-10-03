---
superseded_by: 2026-06-28_maw-wake-all-fallback-string.md
superseded_at: 2026-10-03
status: superseded
---

# maw Default Model Change

**Date**: 2026-05-28
**Source**: rrr — user request to change default model

## Change

maw wake fallback model เปลี่ยนจาก `deepseek-v4-pro:cloud` → `glm-5.1:cloud`

**Why**: deepseek-v4-pro กิน token เยอะเกินไป

**File**: `maw-js/src/config/command-logic.ts` line 57

**Impact**: ทุกครั้งที่ `maw wake` แบบ non-interactive (fleet wake, WS handler) จะใช้ glm-5.1:cloud แทน deepseek-v4-pro:cloud ส่วน interactive wake ยังมี ollama picker เหมือนเดิม

**Key detail**: `{ollama-pick}` placeholder ยังทำงานเหมือนเดิม — ต่างกันแค่ fallback ที่ใช้ตอน non-interactive