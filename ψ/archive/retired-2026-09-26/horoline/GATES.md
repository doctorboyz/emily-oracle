# GATES — Horoline (Chatbot)

> Quality gates สำหรับหมอดูดัง ให้ลูกดวงเลือก

## Gate Configuration

| Gate | Operation | Notes |
|------|-----------|-------|
| Gate 0: Discovery | `(BASE)` | ใช้ base checks จาก ψ/gates/gate-0-discovery.md |
| Gate 1: Scaffold | `(BASE)` | ใช้ base checks จาก ψ/gates/gate-1-scaffold.md |
| Gate 1.5: AI Safety | `ADD` | เพิ่มเฉพาะ chatbot — ดูด้านล่าง |
| Gate 2: Implement | `(BASE)` | ใช้ base checks จาก ψ/gates/gate-2-implement.md |
| Gate 3: Stabilize | `(BASE)` | ใช้ base checks จาก ψ/gates/gate-3-stabilize.md |

---

## Gate 0: Discovery → Scaffold

### Automatic Checks

- [x] ROADMAP.md exists with all phases filled
- [x] STACK.md exists with technology choices
- [x] SECURITY.md exists with security checklist
- [ ] UX-REF.md exists with UX reference
- [x] TEST-STRATEGY.md exists with test plan
- [x] PRD.md exists with all required sections filled
- [x] GATES.md exists and configured for project type
- [x] Glossary has at least 10 entries covering core domain terms
- [x] Target language(s) defined in PRD (Thai-primary, English-secondary)
- [x] `.gitignore` configured for chosen stack
- [x] Git repo initialized with initial commit

### Manual Checks

- [x] Problem statement is clear and specific
- [x] Target users identified
- [x] Core user flows defined (max 3)
- [ ] Success metrics defined with numbers
- [x] Blueprint type selected: chatbot
- [x] Domain knowledge loaded: astrology/wellness
- [x] Project registered in ψ/registry/PROJECTS.md

---

## Gate 1: Scaffold → Implement

### Automatic Checks

- [x] Project structure matches blueprint
- [x] Database schema defined (Drizzle)
- [x] API routes scaffolded
- [x] Environment config setup
- [x] Docker/Cloudflare Workers config ready
- [x] Lint/format configured (Biome)

### Manual Checks

- [x] All modules from PRD Section 2 have directory structure
- [ ] Design tokens defined (CSS variables/theme)
- [ ] i18n system setup for Thai-primary
- [x] Safety pipeline skeleton exists

---

## Gate 1.5: AI Safety (CHATBOT-ONLY)

> Gate เฉพาะ chatbot — ตรวจว่าระบบ AI ปลอดภัยและมีคุณภาพ

### Automatic Checks

- [x] Safety keyword filter implemented (negative predictions blocked)
- [x] Disclaimer auto-injection on every output
- [ ] CBT reframing for fear-based content (pipeline exists, coverage incomplete)
- [x] Model fallback chain configured (OpenRouter multi-model)
- [ ] Prompt injection prevention tested
- [ ] Consent middleware for data collection

### Manual Checks

- [ ] Safety score ≥ 80 on test set
- [ ] Quality score ≥ 50 on test set
- [ ] No negative predictions in 100-test sample
- [ ] Disclaimers cover financial, medical, legal claims
- [ ] Multi-source convergence working (≥ 3 sources per reading)
- [ ] Overspending protection active (cooldown + token limits)
- [ ] Self-exclusion mechanism tested
- [ ] Thai language responses natural and empathetic

### Score Thresholds

| Metric | Minimum | Target | Current |
|--------|---------|--------|---------|
| Safety Score | 80 | 95 | — |
| Quality Score | 50 | 75 | — |
| Cost Score | 40 | 70 | — |

---

## Gate 2: Implement → Stabilize

### Automatic Checks

- [ ] All PRD user stories have passing tests
- [ ] API contract tests pass (all endpoints)
- [ ] Database migrations are clean
- [ ] Type safety: `tsc --noEmit` passes
- [ ] Lint: 0 errors
- [ ] Security: no critical/high vulnerabilities
- [ ] Coverage ≥ 80%

### Manual Checks

- [ ] All PRD Section 1 user stories work end-to-end
- [ ] Safety pipeline produces safe output in 100% of cases
- [ ] LINE integration works
- [ ] Token system works correctly
- [ ] Profile management works (CRUD + consent)
- [ ] Glossary terms consistent across UI, API, and DB

---

## Gate 3: Stabilize → Graduate

### Automatic Checks

- [ ] Load test passes (100 concurrent users)
- [ ] Uptime monitoring configured
- [ ] Error tracking configured
- [ ] Backup/restore tested
- [ ] CI/CD pipeline green

### Manual Checks

- [ ] User acceptance test with real users
- [ ] Legal review completed (PDPA compliance)
- [ ] Content review: all Thai text natural and appropriate
- [ ] Performance budget met (LCP < 2.5s, INP < 200ms)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Knowledge base complete and accurate
- [ ] Graduation criteria met per PROJECTS.md

---

## Schedule

```
# Dev loop schedule for Horoline
# Every Monday 9:07 AM
CronCreate: "7 9 * * 1" with prompt "/dev-loop horoline"
```