# Horoline

> "ทำนายด้วยความเข้าใจ ปลอดภัย ไม่เป็นอันตราย"

## Identity

**Name**: Horoline
**Type**: AI Fortune-Telling Platform (Thai Market)
**Stage**: Discovery → Scaffold
**Language**: Thai + English

## 5 NEVER Rules

1. **NEVER** use fear to sell or engage
2. **NEVER** claim 100% accuracy or deterministic predictions
3. **NEVER** replace medical, financial, or legal professionals
4. **NEVER** exploit vulnerability, grief, or crisis for engagement
5. **NEVER** use dark patterns (FoMO, urgency, variable rewards)

## 4 CAUTION Rules

1. **CAUTION** with health/finance topics — always add disclaimer
2. **CAUTION** with cultural beliefs — respect, never mock or exploit
3. **CAUTION** with repeated usage — suggest breaks, don't encourage dependency
4. **CAUTION** with premium prompts — offer value, not fear of missing out

## 5 ALWAYS Rules

1. **ALWAYS** empower user agency (Internal Locus of Control)
2. **ALWAYS** present multiple perspectives (Multi-Source Convergence)
3. **ALWAYS** validate before advising (Empathy First)
4. **ALWAYS** offer practical next steps (PERMA-A)
5. **ALWAYS** include safety net for distress (Escalation Protocol)

## Project Structure

```
horoline/
├── knowledge/              # Domain knowledge (AI reads these)
│   ├── ai-nlp/            # Prompt engineering, safety pipeline
│   ├── business/          # Monetization ethics
│   ├── chinese-zodiac/    # Chinese astrology
│   ├── cultural/          # Thai cultural context
│   ├── iching/            # I Ching
│   ├── legal-ethics/      # PDPA, consumer protection
│   ├── numerology/        # Numerology
│   ├── psychology/        # CBT, Barnum, LOC, MI, trauma-informed
│   ├── tarot/             # Tarot
│   ├── thai-astrology/    # Thai zodiac, Sawae Ayu, Thaksa
│   ├── vedic-astrology/   # Vedic/Jyotish
│   └── western-zodiac/    # Western astrology
├── PROJECT-RULES.md       # Never/Caution/Always rules
├── BRAND-CORE-VALUES.md   # Brand values, personality, red lines
├── MULTI-SOURCE-CONVERGENCE.md  # How systems converge
└── RESEARCH-ROADMAP.md    # Research phases and timeline
```

## Key Decisions

- **Multi-Source Convergence**: Thai + Western + Chinese + Numerology as Tier 1 (birth date only)
- **Safety Pipeline**: Every output passes SafetyCheck before delivery
- **Swap Test**: Anti-Barnum — swapping zodiac signs must produce meaningfully different readings
- **CBT Reframing**: Every challenge reading goes through ABCDE reframing
- **Internal LOC**: Every reading reinforces "you choose" not "fate controls"
- **Thai-First**: UI and content in Thai, with English technical terms

## Tech Stack

TBD — to be decided during Gate 0 (Discovery)

## Memory

Knowledge files use YAML frontmatter for AI consumption:
```yaml
---
domain: thai-astrology
topic: Thai Rasi System
tier: 1          # 1=birth-date-only, 2=additional-data, 3=complex-calculation
priority: P0     # P0=must-have, P1=should-have, P2=nice-to-have
version: 1.0
updated: 2026-05-23
source: research
convergence_tags: [thai, rasi, sidereal, sawae-ayu]
ai_usage: ทำนายจากราศีไทย เชื่อมกับระบบอื่น
---
```

## Incubation

- **Origin**: Dev Oracle (ψ/projects/horoline/)
- **Mode**: Default (long-term dev)
- **Date**: 2026-05-22