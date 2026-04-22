---
name: poc
description: "Proof of Concept workflow — validate ideas with minimal steps before full implementation. Bug fixes start with a reproducing test, not a code edit."
commands:
  - /poc
  - /poc-bug
  - /poc-validate
---

# PoC (Proof of Concept) Skill

## Overview

Validate ideas and fixes in the smallest possible step. Never edit source code to fix a bug without first writing a test that reproduces it. Never build a feature without first proving the core mechanism works.

## Commands

### `/poc` — Start a PoC

Guides you through creating a minimal Proof of Concept:

1. **Hypothesis** — What are you trying to prove? State it in one sentence.
2. **Success Criteria** — How will you know it works? Define measurable criteria.
3. **Minimal Scope** — What is the smallest input/case that proves the point?
4. **Time Box** — Set a 2–4 hour limit. If the PoC takes longer, the scope is too large.
5. **Build** — Write the minimal code to test the hypothesis. Prefer a standalone script or test file.
6. **Validate** — Run the PoC. Does it meet the success criteria?
7. **Decide** — Proceed, pivot, or abandon based on results.

### `/poc-bug <description>` — Bug Fix via Test-First

Fixes a bug by writing a reproducing test first, then fixing the code:

1. **Reproduce** — Write a test that triggers the bug. Run it. Confirm RED.
2. **Fix** — Write the minimal change to make the test GREEN.
3. **Verify** — Run the full test suite. Confirm no side effects.
4. **Document** — Commit the test alongside the fix.

### `/poc-validate` — Validate Current Work

Checks that each recent change is independently verifiable:

1. List the changes made in this session
2. For each change, identify the verification artifact (test, endpoint, output)
3. If any change lacks a verification artifact, flag it and create one
4. Run all verifications and report results

## PoC Decision Flowchart

```
Need to build something new?
├── Is the approach well-understood and proven?
│   ├── YES → Use TDD (tdd-guide) directly
│   └── NO → Run /poc first
│       ├── PoC passes → Use insight (not code) to build with TDD
│       └── PoC fails → Pivot or abandon early
└── Need to fix a bug?
    └── Run /poc-bug — never edit source without a reproducing test
```

## PoC Output Structure

When `/poc` creates a Proof of Concept, it places artifacts in:

```
poc/
└── <hypothesis-slug>/
    ├── hypothesis.md    # One-sentence hypothesis + success criteria
    ├── poc.test.ts      # Minimal test that proves/disproves the hypothesis
    └── result.md        # Pass/fail + limitations discovered + decision
```

The `poc/` directory is throwaway. If the PoC passes, use the **insight** to build the real implementation via TDD — do not promote PoC code to production.

## Integration with Other Skills

| Situation | Use Instead |
|-----------|-------------|
| Feature with clear spec | `/tdd` — jump straight to TDD |
| Feature with uncertain approach | `/poc` then `/tdd` |
| Bug fix | `/poc-bug` — test first, fix second |
| Architecture decision | `/plan` — plan before PoC |

## Rules Enforced

- Every bug fix must have a reproducing test committed alongside the fix
- No implementation step may be stacked on an unverified previous step
- PoC code is throwaway — never merge it to production branches
- Time box every PoC at 2–4 hours max