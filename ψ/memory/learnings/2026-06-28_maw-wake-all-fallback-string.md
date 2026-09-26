# Lesson: maw wake all ใช้ fallback string ไม่ใช่ resolveOllamaModel

**Date**: 2026-06-28
**Source**: rrr — GLM 5.2 migration session

## Insight

`maw wake all` (cmdWakeAll ใน `fleet-wake.ts`) ไม่ได้เรียก `resolveOllamaModel()` เหมือน `maw wake <oracle>` (cmdWake) แต่ใช้ fallback string ใน `command-logic.ts` โดยตรง:

```typescript
// command-logic.ts (buildCommandFromConfig)
if (cmd.includes("{ollama-pick}")) {
  const model = getOllamaModelCache() || "glm-5.2:cloud";  // fallback
  cmd = cmd.replaceAll("{ollama-pick}", model);
}
```

cmdWakeAll ไม่ set cache → ใช้ fallback string เสมอ

## How to apply

เวลาเปลี่ยน default model ของ fleet wake (`maw wake all`):
1. **ต้องแก้ fallback string ใน `command-logic.ts`** (ไม่ใช่แค่ command.ts)
2. แก้ `command.ts` ด้วยเพื่อ consistency (single wake ใช้ resolveOllamaModel ที่ค้นจาก ollama list)
3. `bun run build` ใหม่หลังแก้

## Self-destructive command trap

`maw wake all --kill` จะ kill ทุก session ใน fleet **รวม session ที่กำลังรันคำสั่งนั้นเอง** — ถ้ารันจากใน oracle session จะตัด session ตัวเองกลางคัน ทำให้คำสั่งไม่จบ

วิธีแก้: รันแบบ detached (`nohup maw wake all --kill > log 2>&1 &`) หรือ wake ทีละตัว exclude self

## Related

- [[maw-ollama-picker]] — {ollama-pick} placeholder pattern
- [[oracle-army-setup]] — fleet structure