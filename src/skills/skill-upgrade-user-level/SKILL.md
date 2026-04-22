---
name: skill-upgrade-user-level
description: |
  Upgrade or create user-level skills from new knowledge documents.
  Invoke with /skill-upgrade-user-level or when user provides new knowledge,
  documentation, or best practices they want integrated into the skill system.
  Triggers on: "update skill", "upgrade skill", "new knowledge", "add to skill",
  "improve skill with", "merge knowledge into skill", "skill from this doc".
version: 1.0.0
format_version: 1.0
trigger: /skill-upgrade-user-level
argument-hint: "[knowledge-source: file path, URL, or description of new knowledge]"
allowed-tools: Read Grep Glob Bash Write Edit Agent
---

# Skill Upgrade (User-Level)

Meta-skill that ingests new knowledge and either upgrades an existing skill or creates a new one.

## When to Activate

- User provides a knowledge document, URL, or reference material
- User says "update skill X with this" or "add this to our skills"
- User wants to improve an existing skill with new information
- User has domain expertise they want codified into the skill system
- Any time new best practices, patterns, or processes should be captured

## Pipeline

### Step 1: Ingest Knowledge Source

Accept input in any of these forms:
- **File path**: Read the file directly
- **URL**: Fetch with WebFetch or web_fetch_exa
- **Pasted text**: Use directly
- **Description**: "I know about X, create a skill for it" — interview the user

Extract from the source:
- Topic/domain area
- Key patterns, rules, and conventions
- Code examples (if any)
- Anti-patterns and pitfalls
- Tooling and commands
- Dependencies and prerequisites

### Step 2: Scan Existing Skills for Overlap

Search both skill pools:

```
User skills:     ~/.claude/skills/
Plugin skills:   ~/.claude/plugins/marketplaces/ecc/skills/
```

For each skill found, check relevance by:
1. **Name match**: Does the skill name relate to the new knowledge?
2. **Description keywords**: Does the description overlap semantically?
3. **Content overlap**: Grep for key terms from the new knowledge in existing SKILL.md files

Classify each match:
- **EXACT**: Same domain, same scope — candidate for upgrade
- **PARTIAL**: Overlapping domain, different scope — may extend or create sibling
- **UNRELATED**: No meaningful overlap — skip

Report findings to user with relevance assessment.

### Step 3: Diff Analysis (When Existing Skill Found)

For each EXACT or PARTIAL match, perform a section-by-section comparison:

| Category | Meaning | Action |
|----------|---------|--------|
| **GAP** | New knowledge not in existing skill | ADD — insert new section or content |
| **UPGRADE** | New knowledge is better than existing | REPLACE — swap in improved content |
| **KEEP** | Existing content is still valid | PRESERVE — no change |
| **CONFLICT** | New and old contradict each other | ASK — present both, let user decide |

Present the diff as a structured table:

```
## Diff: python-patterns

| Section | Verdict | Detail |
|---------|---------|--------|
| Type Hints | UPGRADE | New doc uses `list[]` (3.9+) vs old `List[]` |
| Pydantic v2 | GAP | Not in existing skill |
| Error Handling | KEEP | Existing patterns still valid |
| Async: aiohttp vs httpx | CONFLICT | Old uses aiohttp, new uses httpx |
```

### Step 4: Draft Upgraded Skill

Based on the diff analysis, produce a draft SKILL.md:

**If upgrading existing skill:**
1. Read the full existing SKILL.md
2. Apply KEEP sections unchanged
3. Apply UPGRADE sections (replace old content)
4. Apply GAP sections (add new content)
5. For CONFLICT sections — use user's decision or flag clearly
6. Preserve frontmatter (update version if present)
7. Keep total body under 500 lines; overflow into `references/`

**If creating new skill:**
1. Generate a kebab-case directory name
2. Write frontmatter with pushy description (include trigger phrases)
3. Organize body into clear sections
4. Add code examples where applicable
5. Include anti-patterns section
6. Keep body under 500 lines

**Frontmatter template for new skills:**
```yaml
---
name: skill-name
description: |
  [What this skill does — be pushy about when to trigger].
  Triggers on: "[trigger phrase 1]", "[trigger phrase 2]", "[trigger phrase 3]".
version: 1.0.0
trigger: /skill-name
allowed-tools: [appropriate tools for the domain]
---
```

### Step 5: User Review and Confirmation

Present the draft with:
- Summary of changes (added X sections, upgraded Y, kept Z)
- The full diff if upgrade, or full content if new
- Any CONFLICT items requiring user decision

Wait for user response:
- **"confirm" / "yes"** — proceed to save
- **"modify: [change]"** — adjust and re-present
- **"reject"** — discard draft, no changes

### Step 6: Save

**Upgrading existing skill:**
- Write the updated SKILL.md to `~/.claude/skills/<name>/SKILL.md`
- If content overflows 500 lines, extract detailed sections into `references/`
- Report what was saved

**Creating new skill:**
- Create `~/.claude/skills/<name>/SKILL.md`
- Create `references/` directory if needed
- Report the new skill location and how to trigger it

**For plugin skills (ECC/Official):**
- NEVER modify plugin directories — they get overwritten on update
- Instead, create a user-level override at `~/.claude/skills/<name>/SKILL.md`
- The user-level skill supplements the plugin skill

## Constraints

- **SKILL.md body limit**: Target <500 lines. Extract overflow into `references/` files
- **Description matters**: The description field determines triggering — make it pushy and specific
- **Plugin skills are read-only**: Always create user-level skills to supplement
- **No duplicate content**: If knowledge already exists in a skill, don't re-add it
- **Preserve existing quality**: Don't downgrade — only add or improve
- **Imperative style**: Write in imperative form ("Start by..." not "You should start by...")
- **Third-person descriptions**: "This skill should be used when..." not "Use this skill when..."

## Anti-Patterns to Avoid

- Creating a skill that duplicates an existing one without adding value
- Writing a 1000-line SKILL.md body (use references/ instead)
- Vague descriptions that won't trigger properly
- Removing working content from an existing skill without confirmation
- Modifying plugin skill files directly

## Related Skills

- `skill-stocktake` — Audit all skills for coverage and quality
- `continuous-learning` — Auto-extract patterns from sessions into learned skills
- `continuous-learning-v2` — Observer-based instinct extraction
- `configure-ecc` — ECC plugin configuration