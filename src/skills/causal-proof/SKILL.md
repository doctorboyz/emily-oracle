---
name: causal-proof
description: Causal Proof Testing — scientific method for bug fixing. Write a causal test to prove root cause, fix, then prove the fix with the same test.
commands:
  - /causal-proof
  - /cpt
---

# Causal Proof Testing (CPT)

Interactive skill that walks through the CPT bug-fixing workflow.

## Trigger

When the user types `/causal-proof` or `/cpt`, or when they describe a bug they want to fix.

## Workflow

### Phase 1: Observe

1. Ask the user for the bug symptom (error message, wrong output, stack trace)
2. Reproduce the bug if possible — run the relevant code or tests
3. Document the minimal reproduction case
4. If the bug cannot be reproduced, ask for more context before proceeding

### Phase 2: Hypothesize

1. Analyze the symptom and trace through the code to identify likely root causes
2. Form hypotheses in this format: *"Bug occurs because [component] does [wrong behavior] when [condition]"*
3. If multiple hypotheses exist, rank them by likelihood
4. Present the top hypothesis to the user for confirmation

### Phase 3: Prove Causation (RED)

1. Write a **causal test** that directly exercises the hypothesized root cause
2. The test must:
   - Target the mechanism, not just reproduce the symptom
   - Fail only when the hypothesized cause is present
   - Be minimal — no unnecessary setup
3. Run the test — it **must fail** (RED)
4. If the test passes (GREEN), the hypothesis is wrong — return to Phase 2
5. Save the causal test file path for later verification

### Phase 4: Fix the Cause

1. Make the **minimal change** that addresses the root cause
2. No refactoring, no unrelated improvements in the same change
3. The fix should be directly connected to what the causal test exercises

### Phase 5: Prove the Fix (GREEN)

1. Run the **same causal test** — it must now pass (GREEN)
2. If it still fails, the fix was incomplete — iterate on Phase 4
3. Run the full test suite to check for side effects
4. If side effects exist, the fix was too broad — narrow it

### Phase 6: Document

1. Commit with format: `fix: [symptom] — root cause: [cause] (causal test: [file])`
2. The commit creates a permanent chain: symptom → cause → test → fix
3. Optionally update a bug tracking system with the causal link

## Commands

### `/causal-proof <bug-description>`

Start the full CPT workflow for a described bug.

### `/cpt <bug-description>`

Shorthand for `/causal-proof`.

### `/causal-proof prove <test-file>`

Run Phase 5 only — verify that an existing causal test now passes after a fix.

### `/causal-proof hypothesis <bug-description>`

Run Phase 2 only — analyze the bug and generate ranked hypotheses without writing code.

## Output Format

At the end of each CPT session, produce a summary:

```
## CPT Session Summary

**Bug**: [symptom description]
**Hypothesis**: Bug occurs because [component] does [wrong behavior] when [condition]
**Causal Test**: [file path and test name]
**RED result**: [failure output confirming cause]
**Fix**: [one-line description of minimal change]
**GREEN result**: [passing output confirming fix]
**Side effects**: [none / list of any]
**Commit**: [hash] fix: [symptom] — root cause: [cause] (causal test: [file])
```

## Examples

### Example 1: Null Reference Bug

```
Bug: getUserProfile returns 500 when userId is null

Hypothesis: Bug occurs because buildUserProfileQuery concatenates null userId
into SQL string instead of using parameterized query

Causal Test: test('buildUserProfileQuery rejects null userId without string concatenation', ...)

RED: test fails — null is concatenated into SQL

Fix: Changed buildUserProfileQuery to use parameterized query with null-safe params

GREEN: test passes — null is no longer concatenated

Commit: fix: getUserProfile 500 on null userId — root cause: string concatenation of null (causal test: user.test.ts:42)
```

### Example 2: Race Condition

```
Bug: Cart total is sometimes wrong when items are added rapidly

Hypothesis: Bug occurs because addToCart does not acquire a lock before updating total,
allowing concurrent updates to read stale totals

Causal Test: test('addToCart serializes concurrent updates to prevent stale reads', ...)

RED: test fails — concurrent adds produce wrong total

Fix: Added mutex lock around total recalculation in addToCart

GREEN: test passes — concurrent adds produce correct total

Commit: fix: cart total race condition — root cause: missing mutex on total recalculation (causal test: cart.test.ts:78)
```

## Integration with Other Rules

- This skill enforces the CPT methodology from `.claude/rules/common/causal-proof-testing.md`
- Extends the Bug Fix Protocol in `.claude/rules/common/poc-first.md`
- Works with `.claude/rules/common/testing.md` for test quality standards