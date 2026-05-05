---
name: ghq-maw-symlink-lesson
description: ghq get formats and maw-js symlink breakage after package rename
type: project
---

ghq v1.10.1 correctly handles all 3 input formats (`org/repo`, `github.com/org/repo`, full URL) without creating nested `github.com/github.com/` directories. Nested directories found in ghq root are NOT caused by ghq — they come from other sources.

**Why:** An empty `github.com/github.com/` directory was found in ghq root but ghq get with `github.com/` prefix does NOT cause nesting. The maw → maw-js package rename broke all 60 plugin symlinks silently because they pointed to the old path.

**How to apply:** When maw updates or renames happen, re-run bootstrap or manually fix symlinks. Never assume ghq is the source of nested directories without testing first.