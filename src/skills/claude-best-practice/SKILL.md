---
name: claude-best-practice
description: |
  Use this skill when the user asks to create or update files inside the .claude/ folder,
  update CLAUDE.md, or wants guidance on structuring Claude Code configuration.
  Invoke with /claude-best-practice or when asked to set up .claude folder structure,
  add rules, create skills, or organize project-level AI configuration.
---

# Claude Code Best Practice

**Progressive Disclosure** principle — Load only necessary context to reduce Context Window Pollution and save tokens.

---

## 1. Scope Separation

| Scope | Location | Used for | Git |
|-------|----------|----------|-----|
| User | `~/.claude/` | Personal settings, cross-project skills | No |
| Project | `./.claude/` | Team standards, project hooks and rules | ✅ commit |
| Local | `./.claude/settings.local.json` | Personal overrides for this project | .gitignore |

---

## 2. Core Files and Functions

**`~/.claude.json`** — Runtime state (OAuth, cache) — do not edit manually

**`settings.json`** — Tool policies, hooks, permissions

**`CLAUDE.md`** — Project guide that AI loads every session. Include only:
- Things you must know every time (commands, architecture)
- Information not in code or git history
- Monorepo: Place CLAUDE.md in each subdirectory as needed

---

## 3. Recommended .claude/ Structure

```
.claude/
├── settings.json          # Team policies (commit)
├── settings.local.json    # Personal overrides (gitignore)
├── rules/                 # Always-on context — loaded every session
│   ├── security.md        # Security constraints
│   └── business.md        # Business requirements
└── skills/                # On-demand context — loaded only when invoked
    └── my-skill/
        ├── SKILL.md       # (required) metadata + main content
        ├── scripts/       # (optional) executable .py, .sh files
        ├── references/    # (optional) deep API guides
        └── assets/        # (optional) templates, raw data
```

**Rule:** Always move information from `rules/` → `skills/` when it doesn't need to load every session.

---

## 4. SKILL.md Standard

```yaml
---
name: skill-name          # 1-64 characters, must match folder name
description: |            # ≤1,024 characters — be specific: what + when to invoke
  Use this skill when...
  Invoke with /skill-name or when...
---
```

- Main content ≤ 5,000 tokens
- Vague `description` = primary reason AI doesn't invoke the skill

---

## 5. Anti-patterns to Avoid

- Don't cram all rules into a single CLAUDE.md file
- Don't put information in CLAUDE.md that can be inferred from code or git log
- Don't edit `~/.claude.json` manually

---

## 6. Agent Spawning & Isolation Policy

**When spawning agents, choose isolation wisely:**

### Default: No Isolation (Recommended for Bulk Work)
```
Agent(description, prompt)  # isolation: undefined
```
- Edits go directly to main branch
- No extra merge steps needed
- Best for bulk refactoring, settings updates, coordinated component changes
- Agents may conflict if editing same file (mitigate with clear file boundaries)

### Advanced: Worktree Isolation + Orchestrator (For Parallel Work)
```
// Spawn workers with isolation
Agent("Worker 1", prompt, isolation: "worktree")  # branch: claude-worker-1
Agent("Worker 2", prompt, isolation: "worktree")  # branch: claude-worker-2

// Orchestrator merges results back
Agent("Orchestrator", 
  prompt: "Git merge branches claude-worker-1 and claude-worker-2 to main",
  isolation: undefined
)
```
- Safe from conflicts during parallel work
- Requires explicit orchestrator logic to merge worktree branches
- More complex but necessary for true parallel file editing

### When Worktree Isolation Helps
✅ Multiple agents work on **completely different files** in parallel  
✅ You have explicit merge/orchestrator logic  
✅ Prototyping changes that might be discarded  

### When Worktree Isolation Hurts
❌ Bulk refactoring (8+ files) with no merge plan  
❌ Single coordinated task where all edits go to main  
❌ No explicit worktree tracking or merge workflow  
❌ Agents that might timeout, fail, or produce incomplete output  

**Incident**: 8 agents spawned with `isolation: "worktree"` without merge logic resulted in:
- 4 agents' edits lost (worktree auto-cleaned, never merged)
- 2 agents' edits manually recovered via `git diff | patch`
- 2 agents' output truncated/incomplete
- Manual recovery required

**Lesson**: Don't use worktree isolation unless you have a clear merge strategy.

---

## When Creating or Updating .claude/ Files

1. **CLAUDE.md** — Use Edit/Write, include only non-obvious context
2. **settings.json** — Always read first, then merge (don't replace)
3. **rules/*** — Files that need to load every session, keep concise
4. **skills/*** — Create folder with skill name + SKILL.md with frontmatter
5. **settings.local.json** — Always add to .gitignore if creating new

---

## 7. CLAUDE.md Init — Global Setup Verification

**Every time** you create or initialize a new `CLAUDE.md` for a project, you **must** first read the global setup to ensure the system is well-wired:

### Required pre-init reads (in order):
1. `~/.claude/CLAUDE.md` — understand global directory map, active hooks, self-improvement rules
2. `~/.claude/settings.json` — check global tool policies, hook wiring, autoApprove list
3. `~/.claude/rules/*.md` — load all always-on rules (communication, security, self-improvement)

### Why this matters:
- Global hooks and rules affect every project — a new CLAUDE.md must not conflict with or duplicate them
- Global `settings.json` defines system-wide tool approvals and hook wiring — project config must layer on top, not override
- Communication rules (language, style) apply everywhere — project CLAUDE.md should not restate them

### After reading global setup, verify:
- No project-level hook duplicates a global hook already wired in `~/.claude/settings.json`
- Project CLAUDE.md does not restate rules already in `~/.claude/rules/`
- Project settings.json uses `"extends": "global"` behavior (merges, not replaces)

**Rule:** A CLAUDE.md init without reading global setup first is considered incomplete. Always verify wiring before writing.

---

## Cross-Reference

- **Agent coordination patterns** → See `/agent-architect` skill for orchestrator design
- **Project-level policies** → Each project's `.claude/CLAUDE.md` should reference this when defining agent spawning rules
