---
name: refactoring-assistant
description: |
  Guide safe code refactoring with proper testing and validation.
  Invoke with /refactor or when restructuring code.
  Prevents breaking changes and ensures test coverage.
---

# Refactoring Assistant

## Refactoring Patterns

### Extract Function/Method
```
When: Repeated code blocks or long functions
Steps:
1. Identify code to extract
2. Create new function with descriptive name
3. Add parameters for dependencies
4. Replace original code with function call
5. Add unit tests for new function
6. Verify all call sites work
```

### Rename Variable/Function/Class
```
When: Names are unclear or misleading
Steps:
1. Use IDE/language-aware refactoring if available
2. Update all references
3. Update comments and documentation
4. Check string references (if dynamic)
5. Verify tests still pass
```

### Move Code
```
When: Code belongs in different module/class
Steps:
1. Preserve git history (git mv when possible)
2. Update imports/references
3. Check for circular dependencies
4. Update exports if module boundary
5. Verify no broken references
```

### Change Interface/Signature
```
When: API needs to evolve
Steps:
1. Create new interface if breaking change
2. Implement adapter pattern if needed
3. Deprecate old interface gradually
4. Update all consumers
5. Remove old interface in future release
```

### Replace Conditional with Polymorphism
```
When: Complex switch/if-else chains
Steps:
1. Create base class/interface
2. Extract each case to subclass
3. Replace conditionals with method calls
4. Add factory if needed
5. Verify all cases covered
```

### Introduce Parameter Object
```
When: Function has too many parameters
Steps:
1. Create object to hold related parameters
2. Update function signature
3. Update all call sites
4. Consider adding validation to object
```

## Safety Checklist

### Before Refactoring
- [ ] All tests pass
- [ ] Code coverage > 80% in affected areas
- [ ] Git working directory clean (or stash changes)
- [ ] Incremental commits planned
- [ ] Rollback strategy identified
- [ ] No unrelated changes mixed in

### During Refactoring
- [ ] Run tests after each change
- [ ] Commit frequently (small commits)
- [ ] No functional changes mixed with refactoring
- [ ] Update documentation as you go
- [ ] Keep PR small and focused

### After Refactoring
- [ ] All tests pass
- [ ] Performance not degraded (benchmark if critical)
- [ ] Documentation updated
- [ ] No dead code left behind
- [ ] Code review completed

## Anti-Patterns to Avoid

❌ **Shotgun Surgery**: Changing many files for one concept
✅ Consolidate related changes

❌ **Golden Hammer**: Using favorite pattern everywhere
✅ Choose appropriate pattern for each situation

❌ **Refactoring Without Tests**: Blind refactoring
✅ Ensure test coverage first

❌ **Big Bang Refactoring**: Large unreviewable changes
✅ Incremental, reviewable steps

❌ **Refactoring During Feature Work**: Mixing concerns
✅ Separate refactoring PRs from feature PRs

## Output Format

```
Refactoring Plan
================

Goal: [What we're refactoring]

Current Issues:
- [Issue 1]
- [Issue 2]

Proposed Changes:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Safety Check:
- Tests: [X] Pass / [ ] Need improvement
- Coverage: [X%] Current
- Git status: [clean/dirty]

Risk Level: [Low/Medium/High]
Estimated Time: [X hours]

Rollback Plan:
[How to undo if issues arise]
```

## Testing During Refactoring

1. **Start Green**: Ensure tests pass before starting
2. **Test After Each Step**: Don't accumulate changes
3. **Add Characterization Tests**: Capture current behavior
4. **Test Edge Cases**: Ensure refactoring preserves edge handling
5. **Performance Tests**: For performance-critical code

## When NOT to Refactor

- Deadline pressure without test coverage
- Unfamiliar codebase without domain expert
- During active feature development in same area
- Without stakeholder buy-in for API changes
- When "working" code has no tests

## Refactoring by Language

### JavaScript/TypeScript
- Use strict mode for type safety
- Leverage IDE refactoring tools
- Check for export/import changes

### Python
- Use type hints after refactoring
- Check for import cycles
- Update __all__ if public API

### Java/Kotlin
- Use IDE automated refactoring
- Check for reflection usage
- Update annotations

### Go
- Run `go vet` after changes
- Update interface implementations
- Check for breaking API changes

### Rust
- Run `cargo clippy` after changes
- Check trait implementations
- Verify lifetime annotations
