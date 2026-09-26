---
name: pr-description-writer
description: |
  Generate comprehensive PR descriptions from git diff and commits.
  Invoke with /write-pr-description or when creating a pull request.
  Follows best practices for clear, actionable PR descriptions.
---

# PR Description Writer

## PR Structure

### Title
Format: `[Type]: Brief description (max 50 chars)`

Types: feat, fix, docs, style, refactor, perf, test, chore

### Summary
- 1-3 bullet points explaining what changed
- Link to related issue(s) with "Fixes #XXX" or "Relates to #XXX"

### Changes
Group by category:
- **Features**: New functionality
- **Fixes**: Bug fixes
- **Refactoring**: Code restructuring
- **Dependencies**: Package updates
- **Tests**: Test additions/modifications
- **Documentation**: Docs updates

### Testing
- How to test these changes
- What scenarios were tested
- Any edge cases considered

### Screenshots (if UI)
- Before/after comparison
- Mobile/desktop views if responsive

### Breaking Changes
List any breaking changes with migration instructions

### Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Self-review completed
- [ ] Code follows style guidelines

## Template

```markdown
## Summary
Brief description of what this PR accomplishes.

Fixes #123

## Changes
- Change 1 (why it was needed)
- Change 2 (why it was needed)
- Change 3 (why it was needed)

## Testing
1. Step 1
2. Step 2
3. Expected result

## Screenshots
[If applicable]

## Breaking Changes
- [ ] None
- OR
- API response format changed from X to Y
  Migration: Update clients to expect new format

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Self-reviewed
```

## Usage

When user asks to write a PR description:

1. **Gather context**:
   - Run `git log --oneline main..HEAD` for commits
   - Run `git diff --stat main..HEAD` for file summary
   - Run `git diff main..HEAD` for detailed changes

2. **Analyze**:
   - Categorize changes (features, fixes, refactors)
   - Identify breaking changes
   - Note new dependencies
   - Check for tests added

3. **Generate**:
   - Write clear title following conventional commits
   - Summarize changes in bullets
   - Group files by type of change
   - Suggest testing steps

4. **Review**:
   - Ensure tone is professional
   - Check all checkboxes are unchecked (let user check)
   - Include migration guide if breaking changes

## Output Format

```markdown
## PR Description

**Title:** [type]: Brief description

**Summary:**
- Summary point 1
- Summary point 2

**Changes:**
- Feature: Description
- Fix: Description
- Refactor: Description

**Testing:**
1. Testing steps

**Checklist:**
- [ ] Item 1
- [ ] Item 2
```

## Tips

- Keep title under 50 characters
- Use present tense ("Add feature" not "Added feature")
- Be specific about what changed and why
- Include error scenarios tested
- Mention performance impacts if applicable
- Call out security considerations
