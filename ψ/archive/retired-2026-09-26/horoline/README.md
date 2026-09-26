# Horoline 🌟

> AI Fortune-Telling with Empathy — ทำนายด้วยความเข้าใจ ปลอดภัย ไม่เป็นอันตราย

## What is Horoline?

Horoline is an AI-powered fortune-telling platform designed for the Thai market. It combines multiple divination systems (Thai astrology, Western zodiac, Chinese zodiac, Numerology, Tarot, I Ching, Vedic) into **convergent readings** that empower users rather than create dependency.

## Core Principles

- **Empathy First** — Validate before advising
- **Empowerment** — Reinforce user agency, not fatalism
- **Multi-Source Convergence** — Multiple systems, one coherent direction
- **Responsibility** — Safety pipeline on every output
- **Accessible Beauty** — Thai-first, beautifully designed

## Project Status

🟡 **Discovery** — Knowledge base complete, moving to Gate 0

## Documentation

- `PROJECT-RULES.md` — 5 NEVER, 4 CAUTION, 5 ALWAYS rules
- `BRAND-CORE-VALUES.md` — Brand values, personality, red lines
- `MULTI-SOURCE-CONVERGENCE.md` — How systems converge into one reading
- `RESEARCH-ROADMAP.md` — Research phases and timeline
- `knowledge/` — Domain knowledge files (12 domains, 23 files)

## Safety

Every output passes through a SafetyCheck pipeline:

```typescript
interface SafetyCheck {
  hasNegativeContent: boolean      // must be false
  hasFearLanguage: boolean         // must be false
  hasFatalisticLanguage: boolean   // must be false
  empowersUser: boolean           // must be true
  hasPracticalAdvice: boolean      // must be true
  hasDisclaimer: boolean          // must be true (for health/finance)
  respectsUserAgency: boolean      // must be true
  passesBarnumTest: boolean       // must be true
}
```

## License

Private — All rights reserved