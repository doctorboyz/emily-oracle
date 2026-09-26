# PRD — Horoline (หมอดูดัง ให้ลูกดวงเลือก)

> "ทำนายด้วยหัวใจ ไม่ใช่ด้วยความกลัว"

## 1. User-Facing Scope

### 1.1 Problem Statement

ตลาดหมอดูไทยมูลค่า 10-15 พันล้านบาท แต่ส่วนใหญ่ขาดมาตรฐาน ความปลอดภัย และความรับผิดชอบ Horoline สร้างประสบการณ์ทำนายที่มีหัวใจ — เน้นการเสริมกำลังใจ ไม่ใช่การสร้างความกลัว

### 1.2 Target Users

| Segment | Description | Priority |
|---------|-------------|----------|
| หญิงไทย 25-45 ปี | สนใจดวง แต่ระวังเรื่องความน่าเชื่อถือ | P0 |
| คนรุ่นใหม่ 18-25 ปี | หมอดูแบบ casual ผ่าน LINE | P1 |
| ผู้ใช้ซ้ำ | กลับมาทำนายเดือนละครั้งขึ้นไป | P1 |

### 1.3 User Stories

| ID | Story | Acceptance Criteria | Status |
|----|-------|---------------------|--------|
| US-01 | ผู้ใช้กรอกวันเกิด → ได้คำทำนายจากหลายแหล่ง | แสดงผลจาก 4 แหล่ง (ราศี, จีน, นิวเมอโร, ธาตุ) | 🟡 |
| US-02 | ผู้ใช้เห็นคำเตือนและ disclaimer ทุกครั้ง | Safety pipeline ทำงาน 100% ของ output | ✅ |
| US-03 | ผู้ใช้ให้คะแนนคุณภาพการทำนาย | ระบบ satisfaction rating ทำงาน | ✅ |
| US-04 | ผู้ใช้จัดการโปรไฟล์และข้อมูลส่วนตัว | CRUD profile + consent management | 🟡 |
| US-05 | ผู้ใช้เติม/ใช้โทเคน | Balance, topup, deduct, audit | 🟡 |
| US-06 | ผู้ใช้ได้รับคำแนะนำศาลเสริมดวง | Shrine recommendation จาก profile | 🟡 |
| US-07 | ผู้ใช้ตั้ง cooldown หรือ self-exclude | Safety features ทำงาน | 🟡 |
| US-08 | ผู้ใช้ทำนายผ่าน LINE | LINE Messaging API webhook | ❌ |
| US-09 | ผู้ใช้เห็นผล scoring เปรียบเทียบ | Quality/safety/cost scores visible | 🟡 |

### 1.4 User Flows

```
Flow 1: ทำนายใหม่
  เข้ามา → กรอกวันเกิด → เลือกแหล่งทำนาย → รอผล → อ่านผล → ให้คะแนน

Flow 2: ทำนายผ่าน LINE
  เปิด LINE → ส่งข้อความ → รับผล → ให้คะแนน

Flow 3: จัดการโปรไฟล์
  ดูข้อมูล → แก้ไข → ให้ consent → ลบข้อมูล (GDPR)
```

### 1.5 Edge Cases

| Edge Case | Handling | Status |
|-----------|----------|--------|
| วันเกิดไม่ถูกต้อง | Validate format + range | ✅ |
| ผลทำนายเป็นลบ | CBT reframing + disclaimer | ✅ |
| ผู้ใช้ใช้จ่ายเกิน | Cooldown + overspending protection | 🟡 |
| ผู้ใช้ self-exclude | Block access + support resources | 🟡 |
| ระบบ LLM ล่ม | Fallback chain (model A → model B → cached) | 🟡 |
| Prompt injection | Safety filter + input sanitization | 🟡 |

---

## 2. Code Scope

### 2.1 Architecture

- **Runtime**: Hono on Cloudflare Workers
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenRouter multi-model (Claude, GPT, Gemini)
- **Messaging**: LINE Messaging API
- **Frontend**: Single chat.html + planned LIFF app

### 2.2 Module Boundaries

| Module | Path | Description |
|--------|------|-------------|
| Chat | `src/routes/chat.ts` | การสนทนาและการทำนาย |
| Profile | `src/routes/profile.ts` | จัดการข้อมูลผู้ใช้ |
| Readings | `src/routes/readings.ts` | บันทึกและดึงผลทำนาย |
| Tokens | `src/routes/tokens.ts` | ระบบโทเคน |
| Satisfaction | `src/routes/satisfaction.ts` | ให้คะแนนคุณภาพ |
| Shrines | `src/routes/shrines.ts` | คำแนะนำศาล |
| Safety | `src/safety/` | Safety pipeline, reframing, disclaimer |
| Scoring | `src/scoring/` | คะแนนคุณภาพ/ความปลอดภัย/ต้นทุน |

### 2.3 Data Model

| Entity | Table | Key Fields |
|--------|-------|------------|
| ผู้ใช้ | `users` | id, anonymousId, lineUserId, createdAt |
| โปรไฟล์ | `user_profiles` | userId, birthDate, birthTime, birthLocation, zodiacSign, chineseZodiac, lifePathNumber |
| การทำนาย | `readings` | id, userId, sources, content, safetyScore, qualityScore |
| ธุรกรรมโทเคน | `horotoken_transactions` | userId, type, amount, balance |
| การให้คะแนน | `satisfaction_ratings` | userId, readingId, score |
| ศาล | `shrines` | id, name, zodiacMatch, location |
| คะแนนทำนาย | `reading_scores` | readingId, qualityScore, safetyScore, costScore |

### 2.4 API Contracts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/` | ส่งข้อความ → รับผลทำนาย |
| GET | `/api/chat/models` | ดูโมเดลที่ใช้ได้ |
| GET | `/api/chat/scores/summary` | สรุปคะแนน |
| GET | `/api/chat/scores/trend` | แนวโน้มคะแนน |
| POST | `/api/chat/rate` | ให้คะแนนข้อความ |
| GET | `/api/profile/:anonymousId` | ดู/สร้างโปรไฟล์ |
| PUT | `/api/profile/:anonymousId` | อัปเดตโปรไฟล์ |
| POST | `/api/profile/:anonymousId/derive` | คำนวณราศี |
| POST | `/api/profile/consent` | ให้ consent |
| GET | `/api/readings` | ดูประวัติทำนาย |
| POST | `/api/readings` | สร้างการทำนาย |
| GET | `/api/readings/recommend` | คำแนะนำศาล |
| GET | `/api/tokens/balance` | ดูยอดโทเคน |
| POST | `/api/tokens/topup` | เติมโทเคน |
| POST | `/api/satisfaction` | ส่งคะแนนพึงพอใจ |
| POST | `/api/onboarding/start` | เริ่ม onboarding |
| POST | `/api/cooldown/status` | ตรวจสอบสถานะ cooldown |
| POST | `/api/self-exclusion/start` | เริ่ม self-exclusion |
| POST | `/webhook/line` | LINE webhook |

### 2.5 Integration Points

| Integration | Purpose | Status |
|-------------|---------|--------|
| OpenRouter | Multi-model LLM access | ✅ |
| LINE Messaging API | Chat through LINE | 🟡 |
| Neon PostgreSQL | Database | ✅ |
| Cloudflare Workers | Runtime | ✅ |
| Drizzle ORM | Database client | ✅ |

---

## 3. Data Scope

### 3.1 Data Entities

(See Section 2.3 for table definitions)

### 3.2 Data Flow

```
User Input → Validation → Safety Filter → LLM → Safety Check → CBT Reframe → Output → Audit Log
```

### 3.3 Privacy & Consent

| Data Type | Purpose | Consent Required | Retention | Status |
|-----------|---------|-------------------|-----------|--------|
| วันเกิด | คำนวณราศี | Required | Until deletion | ✅ |
| เวลาเกิด | คำนวณลัคนา | Optional (Tier 2) | Until deletion | 🟡 |
| สถานที่เกิด | คำนวณโหราศาสตร์ | Optional (Tier 2) | Until deletion | 🟡 |
| ข้อความสนทนา | การทำนาย | Required | 90 days | 🟡 |
| คะแนนคุณภาพ | ปรับปรุงระบบ | Optional | 1 year | ✅ |
| ข้อมูลการใช้โทเคน | ป้องกันการใช้จ่ายเกิน | Required | Until deletion | ✅ |
| ผลการทำนาย | อ้างอิงย้อนหลัง | Required | 90 days | 🟡 |
| ข้อมูล AI training | ไม่ใช้ | N/A | Never | ✅ |

### 3.4 Data Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| birthDate | Valid date, not future | "วันเกิดไม่ถูกต้อง" |
| birthTime | HH:MM format or null | — |
| zodiacSign | Thai sidereal sign | คำนวณอัตโนมัติ |
| chineseZodiac | ปีนักษัตร | คำนวณอัตโนมัติ |
| lifePathNumber | 1-9 or 11/22/33 | คำนวณอัตโนมัติ |

---

## 4. UX/UI Scope

### 4.1 Design Tokens

| Token | Value | Description |
|-------|-------|-------------|
| Primary | Deep purple/indigo | สีหลัก — มึงมัว เยือกเย็น |
| Accent | Gold/amber | สีเสริม — ความรุ่งริ่ง |
| Background | Dark theme primary | พื้นหลังมืด |
| Surface | Slightly lighter dark | พื้นผิวการ์ด |
| Text Primary | White/light gray | ข้อความหลัก |
| Text Secondary | Muted gray | ข้อความรอง |
| Font Thai | Prompt / Noto Sans Thai | ฟอนต์ไทย |
| Font English | Inter / system | ฟอนต์อังกฤษ |

### 4.2 Interaction Patterns

| Pattern | Loading | Empty | Error | Accessible |
|---------|---------|-------|-------|------------|
| ทำนายใหม่ | Skeleton + animation | Onboarding prompt | Friendly retry | ✅ ARIA |
| ดูผลทำนาย | Shimmer | "ยังไม่มีผลทำนาย" | Retry button | ✅ ARIA |
| โปรไฟล์ | Spinner | "สร้างโปรไฟล์" | Form validation | 🟡 |
| โทเคน | Balance animation | 0 โทเคน | Top-up prompt | 🟡 |

### 4.3 Accessibility Requirements

- WCAG 2.1 AA minimum
- ภาษาไทยทั้งหน้า — `lang="th"`
- Screen reader compatible
- Keyboard navigable
- Color contrast ≥ 4.5:1

### 4.4 Responsive Breakpoints

| Breakpoint | Target |
|------------|--------|
| 320px | Mobile small |
| 375px | Mobile standard |
| 768px | Tablet |
| 1024px | Desktop |

### 4.5 Localization

- **Primary**: ภาษาไทย (th)
- **Secondary**: English (en) — planned
- i18n system: not yet implemented

---

## 5. Shared Vocabulary (Bilingual Glossary)

> ศัพท์ที่ใช้ในโปรเจกต์นี้ ต้องตรงทั้ง UI, API, DB, และ code

### Core Terms

| Thai (ภาษาไทย) | English | Definition (ความหมาย) | Code Name | Context |
|-----------------|---------|----------------------|-----------|---------|
| การทำนาย | reading | ผลการดูดวงจากระบบ | `reading` | core |
| ราศี | zodiacSign | กลุ่มดาวราศีแบบไทย (สิงห์, เมษ ฯลฯ) | `zodiacSign` | profile |
| ปีนักษัตร | chineseZodiac | ปีนักษัตรจีน (ชวด, ฉลู ฯลฯ) | `chineseZodiac` | profile |
| เลขชีวิต | lifePathNumber | ตัวเลขจากวันเกิด (1-9, 11, 22, 33) | `lifePathNumber` | numerology |
| ปีเสวย | personalYear | ปีเสวยตามวิชาเลขศาสตร์ | `personalYear` | numerology |
| สวเอยุ | sawaeAyu | ดวงชะตาตามหลักโหราศาสตร์ไทย | `sawaeAyu` | astrology |
| ธาตุ | element | ธาตุประจำวัน (ไฟ น้ำ ดิน ลม ไม้ โลหะ) | `element` | profile |
| ลัคนา | lagna | จุดขึ้นต้นราศีตามเวลาเกิด | `lagna` | astrology |
| ธักษะ | thaksa | ตำแหน่งดาวเฉพาะบุคคล | `thaksa` | astrology |
| โทเคน | token | สกุลเงินภายในแอปสำหรับทำนาย | `horotoken` | payment |
| ความพึงพอใจ | satisfaction | คะแนนที่ผู้ใช้ให้หลังทำนาย | `satisfaction` | quality |
| ความปลอดภัย | safety | คะแนนว่าผลทำนายปลอดภัยแค่ไหน | `safetyScore` | safety |
| คุณภาพ | quality | คะแนนคุณภาพของผลทำนาย | `qualityScore` | quality |
| ต้นทุน | cost | ค่าใช้จ่ายในการเรียก LLM | `costScore` | cost |
| การสนทนา | session | ชุดข้อความต่อเนื่องกับ AI | `chatSession` | chat |
| ข้อความ | message | ข้อความเดี่ยวในการสนทนา | `chatMessage` | chat |
| ศาลเสริมดวง | shrine | ศาลที่แนะนำตามราศี | `shrine` | recommendation |
| ความยินยอม | consent | การให้สิทธิ์เก็บข้อมูลส่วนบุคคล | `consent` | privacy |
| การเยียวยา | reframing | การเปลี่ยนผลลบเป็นเชิงบวก (CBT) | `reframing` | safety |
| การสละสิทธิ์ | selfExclusion | การยกเลิกสิทธิ์ใช้งานชั่วคราว | `selfExclusion` | safety |
| พักการใช้ | cooldown | หยุดใช้ชั่วคราวเพื่อป้องกันการใช้จ่ายเกิน | `cooldown` | safety |
| แหล่งทำนาย | source | แหล่งที่มาของผลทำนาย (ราศี, จีน, นิวเมอโร, ธาตุ) | `source` | readings |
| โปรไฟล์ | profile | ข้อมูลส่วนตัวผู้ใช้ | `userProfile` | user |
| การแนะนำ | recommendation | คำแนะนำจากระบบ (ศาล, กิจกรรม) | `recommendation` | content |
| การประเมิน | scoring | ระบบให้คะแนนอัตโนมัติ | `scoring` | quality |

### Naming Convention Rules

| Layer | Convention | Example |
|-------|-----------|---------|
| Database columns | `snake_case` (English code name) | `zodiac_sign`, `chinese_zodiac`, `life_path_number` |
| API fields | `camelCase` (English code name) | `zodiacSign`, `chineseZodiac`, `lifePathNumber` |
| UI labels | Thai term from glossary | "ราศี", "เลขชีวิต", "โทเคน" |
| Variable names | English code name | `zodiacSign`, `lifePathNumber` |
| Route paths | `kebab-case` | `/api/chat/`, `/api/tokens/balance` |

---

## 6. Project-Specific (Chatbot)

### 6A. AI Safety

| Rule ID | Rule | Implementation | Status |
|---------|------|----------------|--------|
| SAFE-01 | ไม่ทำนายลบ | CBT reframing pipeline | ✅ |
| SAFE-02 | มี disclaimer ทุกครั้ง | Auto-inject on output | ✅ |
| SAFE-03 | ไม่ทำนายการเงิน/สุขภาพโดยไม่มี disclaimer | Category detection + disclaimer | 🟡 |
| SAFE-04 | ป้องกัน overspending | Cooldown + token limit | 🟡 |
| SAFE-05 | ป้องกัน addiction | Self-exclusion + usage monitoring | 🟡 |

**Safety Score Thresholds**:
- Safety Score ≥ 80: ปลอดภัย (ผ่าน)
- Quality Score ≥ 50: คุณภาพรับได้
- Cost Score ≥ 40: คุ้มค่า

### 6B. Persona System

- **ชื่อ**: หมอดูดัง (Dang Fortune Teller)
- **นิสัย**: เมตตา ให้กำลังใจ ไม่ตัดสิน
- **ภาษา**: ภาษาไทยเป็นหลัก อังกฤษเป็นรอง
- **เสียง**: เป็นกันเอง ใช้คำว่า "ค่ะ" "นะคะ" ไม่ใช้ "ครับ"
- **ขอบเขต**: ทำนายดวงเท่านั้น ไม่ให้คำแนะนำทางการเงิน/การแพทย์

### 6C. Knowledge Base

| Domain | Files | Status |
|--------|-------|--------|
| ราศีไทย (Thai sidereal) | 12 zodiac files | ✅ |
| ปีนักษัตรจีน (Chinese zodiac) | 12 animal files | ✅ |
| นิวเมอโรโลยี (Numerology) | Life path + personal year | ✅ |
| ธาตุ (Elements) | 6 element files | ✅ |
| ศาลเสริมดวง (Shrines) | Shrine recommendations | ✅ |
| โหราศาสตร์สด (Live astrology) | Lagna, Thaksa, Sawae Ayu | 🟡 |
| คำถามยอดนิยม | FAQ patterns | 🟡 |

---

## 7. Out of Scope

- การทำนายแบบเห็นหน้า (video call)
- การชำระเงินจริง ( fiat/crypto)
- แอปมือถือ native (iOS/Android) — Phase 2
- ภาษาอื่นนอกจากไทย — Phase 2
- การสร้างชุมชน/โซเชียล
- API ให้บริการภายนอก (public API)

---

## 8. Open Questions

| # | Question | Status | Answer |
|---|----------|--------|--------|
| 1 | ราคาโทเคนแพ็กเกจเท่าไร? | unanswered | — |
| 2 | LINE Official Account ชื่ออะไร? | unanswered | — |
| 3 | โมเดล LLM หลักที่จะใช้? | partial | OpenRouter multi-model |
| 4 | จะเก็บข้อมูลไว้นานแค่ไหนหลังผู้ใช้ลบ? | unanswered | 90 days default |
| 5 | มีแผนเปิด API ภายนอกไหม? | answered | ไม่มี (Out of Scope) |