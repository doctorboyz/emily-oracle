---
name: commit-msg-validator
description: |
  Validate git commit messages against conventional commits format.
  Invoke with /validate-commit-msg or when preparing a commit message.
  Ensures consistent, semantic commit history.
---

# Commit Message Validator

## Validation Rules

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
| Type | Description |
|------|-------------|
| **feat** | New feature |
| **fix** | Bug fix |
| **docs** | Documentation only |
| **style** | Code style (formatting, no logic change) |
| **refactor** | Code refactoring |
| **perf** | Performance improvements |
| **test** | Adding/updating tests |
| **chore** | Build, tooling, dependencies |
| **ci** | CI/CD changes |
| **build** | Build system changes |
| **revert** | Reverting a commit |

### Requirements
1. Type must be lowercase
2. Subject must use imperative mood ("add" not "added")
3. Subject <= 72 characters
4. Subject does not end with period
5. Body wrapped at 72 characters (optional)
6. Breaking changes marked with `BREAKING CHANGE:` in footer

### Examples

**Good:**
```
feat(auth): add OAuth2 login support

Implement Google and GitHub OAuth2 providers.
Add token refresh mechanism with automatic retry.

Closes #123
```

**Bad:**
```
added new feature          <- wrong: no type, past tense
FIX: Bug fixed.            <- wrong: uppercase, ends with period
update                     <- wrong: no type prefix
feat(): empty scope        <- wrong: empty parentheses
feat:login: no space       <- wrong: missing space after colon
```

## Usage

When user asks to commit or write a commit message:

1. **Analyze** the proposed commit message
2. **Validate** against these rules
3. **Report** any violations with line-specific feedback
4. **Suggest** a corrected version if invalid
5. **Explain** why the correction follows best practices

## Common Fixes

| Issue | Fix |
|-------|-----|
| Past tense | Change "added" to "add", "fixed" to "fix" |
| Uppercase type | Change "Feat:" to "feat:" |
| Trailing period | Remove period from subject line |
| Too long | Shorten to 72 characters or less |
| Missing blank line | Add blank line between subject and body |

## Output Format

```
Validation Results:
- Status: [PASS / FAIL]
- Type: [valid / invalid: explanation]
- Scope: [optional / missing / valid]
- Subject: [valid / issues found]
- Length: [X/72 characters]
- Format: [valid / issues found]

Suggested fix:
[corrected commit message]
```
