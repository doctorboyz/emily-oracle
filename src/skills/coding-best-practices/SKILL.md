---
name: coding-best-practices
description: |
  Enforce coding best practices during development.
  Invoke with /coding-best-practices or when user asks to review code quality,
  apply best practices, or check code before commit.
---

 [Rules for each topic area, organized by section]

 Content per section

 Security
 - No hardcoded credentials, API keys, or tokens
 - Validate and sanitize all external input
 - Use parameterized queries (never string-concat SQL)
 - Avoid eval(), exec(), pickle on untrusted data

 Error Handling
 - Always catch specific exceptions (not bare except / catch (Exception e))
 - Log error context (what operation failed, with what input)
 - Propagate errors to callers rather than silently returning nil/null/false
 - Use typed/custom error types for domain errors

 Naming & Readability
 - Functions named as verbs (getUser, calculateTotal)
 - Variables named for their purpose, not their type
 - Constants in UPPER_SNAKE_CASE, booleans prefixed with is/has/can
 - No single-letter variables except loop counters

 Function Design
 - One function = one responsibility
 - Max ~20–30 lines per function; extract when longer
 - Max 3 parameters; use a config struct/object beyond that
 - No hidden side effects (functions should do what their name says)

 Testing
 - Every exported/public function has at least one test
 - Test edge cases: empty input, nil, overflow, off-by-one
 - Tests must be deterministic (no random seeds, no time.Now())
 - Name tests descriptively: test_calculateTotal_withEmptyCart_returnsZero

 Code Simplicity
 - Prefer flat over nested (early returns, guard clauses)
 - No code that isn't used (delete dead code immediately)
 - No abstraction until the third similar usage (rule of three)
 - Prefer explicit over implicit (no magic numbers/strings)

 Dependency Management
 - Pin exact versions in lockfiles; no ^ or ~ in production
 - Vet new dependencies: last commit date, stars, license
 - Prefer standard library solutions over adding a dependency

 Git & Commit Hygiene
 - Commits are atomic: one logical change per commit
 - Commit message: imperative mood, ≤72 chars subject line
 - Never commit .env, credentials, or generated files
 - PR description must explain why, not just what
