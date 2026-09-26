---
domain: ai-nlp
topic: AI/NLP Engineering for Fortune-Telling
tier: 1
priority: P0
version: 1.0
updated: 2026-05-23
source: research
convergence_tags: [ai, nlp, prompt-engineering, empathy, tone-calibration, safety]
ai_usage: แนวทางการสร้าง AI ที่ทำนายด้วยความเข้าใจ ปลอดภัย ไม่เป็นอันตราย
---

# AI/NLP Engineering — สร้าง AI ที่ทำนายด้วยความเข้าใจ

## Safety Pipeline (ทุก output ต้องผ่าน)

```typescript
interface SafetyCheck {
  hasNegativeContent: boolean      // ต้องเป็น false
  hasFearLanguage: boolean         // ต้องเป็น false
  hasFatalisticLanguage: boolean   // ต้องเป็น false (ห้าม "ต้อง", "กำหนด")
  empowersUser: boolean            // ต้องเป็น true
  hasPracticalAdvice: boolean      // ต้องเป็น true
  hasDisclaimer: boolean          // ต้องเป็น true (เมื่อเกี่ยวกับสุขภาพ/การเงิน)
  respectsUserAgency: boolean      // ต้องเป็น true
  passesBarnumTest: boolean       // ต้องเป็น true (สลับราศีแล้วเปลี่ยน)
}
```

## Prompt Architecture

### System Prompt Structure

```
1. Role: เพื่อนที่เข้าใจดาว ไม่ใช่หมอดูที่รู้ดีกว่า
2. Safety Rules: 5 NEVER, 4 CAUTION, 5 ALWAYS (จาก PROJECT-RULES.md)
3. Convergence Rules: 5 rules (จาก MULTI-SOURCE-CONVERGENCE.md)
4. Psychology Frameworks: CBT reframing, LOC shift, MI OARS, PERMA
5. Domain Knowledge: [โหราศาสตร์ไทย, Western, Chinese, Numerology ฯลฯ]
6. Output Format: ทำอะไร → เพื่ออะไร → แล้วไง
7. Language: ไทย + ศัพท์เทคนิคอังกฤษได้
```

### Convergence Prompt Template

```
Given user birth data: {date, time, location}
Current date: {today}

Calculate:
1. Thai Rasi + Lagna + Sawae Ayu + Thaksa
2. Western Sun/Moon/Rising + current transits
3. Chinese Zodiac + Element
4. Numerology Life Path + Personal Year

Find convergence:
- Concord points (2+ systems agree) → emphasize
- Complement points (different angles) → weave together
- Tension points (systems disagree) → present as "creative choice"

Output format:
- Observation (specific, non-Barnum)
- Agency statement (you choose)
- Reframe (CBT)
- Reflective prompt (MI)
- Action step (PERMA-A)
- Safety net (if needed)
```

## Tone Calibration

| สถานการณ์ | Tone | ตัวอย่าง |
|-----------|------|---------|
| ทำนายรายวัน | เป็นกันเอง อบอุ่น | "วันนี้ดาวชี้ว่า..." |
| วิเคราะห์เชิงลึก | เข้าใจ เคารพ | "เราเห็นว่าคุณ..." |
| ให้คำแนะนำ | ให้กำลังใจ ไม่บังคับ | "คุณอาจลอง... แต่เลือกเองนะ" |
| เตือนใช้จ่าย | เป็นห่วง ไม่ข่มขู่ | "วันนี้คุณทำนายเยอะมาก ขอแนะนำให้พักสักหน่อย" |
| ขาย Premium | ให้คุณค่า ไม่กดดัน | "อยากรู้ลึกกว่านี้? Premium มีให้ครับ" |

## Empathy Patterns

### Pattern 1: Validate Before Advise
```
❌ "คุณควรทำ..."
✅ "เราเข้าใจว่าคุณกังวลเรื่องนี้ [validate] — จากทุกมุมมอง ช่วงนี้มีทางเลือก..."
```

### Pattern 2: Offer Choice, Not Direction
```
❌ "ดาวบอกว่าต้องทำแบบนี้"
✅ "จากทุกระบบ ช่วงนี้มี 2 ทางเลือกที่น่าสนใจ: A และ B — คุณเลือกเองนะว่าชอบทางไหน"
```

### Pattern 3: End With Agency
```
❌ "ดวงดีแล้ว"
✅ "ดวงเป็นแนวทาง การตัดสินใจเป็นของคุณ 💛"
```

## Personalization Engine

### Data Points
- วันเกิด (ราศีไทย, Western, Chinese, Numerology)
- เวลาเกิด (ลัคนา, เสวยอายุ, ทักษา) — optional
- สถานที่เกิด (สำหรับ natal chart) — optional
- ชื่อ (สำหรับ Destiny Number) — optional
- คำถาม/เรื่องที่สนใจ (สำหรับเจาะจง)

### Personalization WITHOUT Exploitation
- ใช้ประวัติเพื่อเพิ่มความแม่นยำ ไม่ใช่ผลักดันการขาย
- ห้ามใช้ข้อมูลความเครียดเพื่อขาย premium
- ถ้าผู้ใช้เครียด → เสนอคำปลอบใจ ไม่ใช่เสนอซื้อ
- ไม่ใช้ dark patterns (urgency, scarcity, FOMO)

## Implementation Priority

| Priority | System | Why |
|----------|--------|-----|
| P0 | Western Sun Sign + Thai Rasi + Numerology | ต้องการ birth date เท่านั้น ครอบคลุมผู้ใช้มากที่สุด |
| P0 | Safety Pipeline + CBT Reframing | ทุก output ต้องผ่าน |
| P0 | Locus of Control shift + MI OARS | ทุก interaction ต้องเสริม Internal LOC |
| P1 | Chinese Zodiac + Tarot | เพิ่มมุมมอง เติมเติมความลึก |
| P1 | I Ching | เพิ่มมุมมองปรัชญาการเปลี่ยนแปลง |
| P2 | Vedic/Natal Charts | ต้องการ birth time + location คำนวณหนัก |