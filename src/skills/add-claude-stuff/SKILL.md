---
name: add-claude-stuff
description: Analyze, categorize, create, and wire new rules, skills, agents, or hooks into .claude/ using the graphify knowledge graph for placement decisions. Also handles hook registration for new skills.
commands:
  - name: add-claude-stuff
    description: Accept new rules, knowledge, or skills as input. Analyze placement using the graph, create the file in the correct .claude/ location, and wire any hooks.
  - name: addskill
    description: Register and wire a new skill into the Claude Code environment (alias for add-claude-stuff with hook-wiring focus).
  - name: claude-architect
    description: Graph-aware placement of new config into .claude/ — uses graphify knowledge graph to decide Rules vs Skills vs Agents vs Hooks.
---

# Add Claude Stuff

Unified skill for adding, categorizing, and wiring new configuration into `.claude/`.

## When to Use

- User runs `/add-claude-stuff`, `/addskill`, or `/claude-architect`
- User says "add this rule", "create this skill", "wire this hook", "organize this into .claude/"
- User pastes new knowledge, rules, or workflow instructions and wants them properly placed

## Step 1 — Context Analysis

Before creating anything, understand what already exists:

1. **Read the graph:** Load `graphify-out/graph.json` (or `GRAPH_REPORT.md`) to understand dependencies and relationships. This tells you where the new content connects to existing skills, agents, and rules.
2. **Scan existing structure:**
   - `.claude/rules/` — enforceable constraints and standards
   - `.claude/skills/` — workflow procedures and commands
   - `.claude/agents/` — specialized roles that run in their own context
   - `.claude/commands/` — single-file slash command prompts
   - `.claude/hooks/hooks.json` — event-triggered automation
3. **Avoid duplication:** Check if a similar rule, skill, or agent already exists. Merge or extend rather than create duplicates.

## Step 2 — Categorization Decision

Analyze the input content and choose the correct type:

| Type | When to use | Location | Trigger |
| :--- | :--- | :--- | :--- |
| **Rule** | Enforceable constraint that must always be followed; path-specific rules | `.claude/rules/<category>/<name>.md` | Automatic (loaded by CLAUDE.md) |
| **Skill** | Multi-step workflow or procedure that defines a new command | `.claude/skills/<name>/SKILL.md` | `/command-name` |
| **Agent** | Specialized role that needs its own context window | `.claude/agents/<name>.md` | Subagent invocation |
| **Hook** | Task that runs automatically on an event | `.claude/hooks/hooks.json` | Event (PreToolUse, PostToolUse, Stop) |
| **Command** | Single-file slash command (lighter than a skill) | `.claude/commands/<name>.md` | `/command-name` |

### Decision Heuristics

- **Always-on constraint?** → Rule (e.g., "never commit secrets", "use immutability")
- **Multi-step procedure with a command?** → Skill (e.g., `/graphify`, `/deploy`)
- **Single prompt with no workflow?** → Command (e.g., `/commit`, `/review`)
- **Specialized reviewer or builder role?** → Agent (e.g., `code-reviewer`, `build-error-resolver`)
- **Runs on event automatically?** → Hook (e.g., format on save, type-check after edit)

## Step 3 — Implementation

### Create the File
Write the Markdown or JSON file in the correct location:

- **Rule:** `.claude/rules/<category>/<name>.md` with frontmatter extending the common rule
- **Skill:** `.claude/skills/<name>/SKILL.md` with YAML frontmatter (name, description, commands)
- **Agent:** `.claude/agents/<name>.md` with role, tools, and instructions
- **Command:** `.claude/commands/<name>.md` with prompt instructions
- **Hook:** Add entry to `.claude/hooks/hooks.json`

### Import Wiring
- If the new file is a rule, check whether `CLAUDE.md` needs an `@import` or reference directive
- If the new file is a skill with commands, ensure the command names are unique across all skills

### Hook Wiring
If the new skill or content requires hooks:

1. Scan the SKILL.md or skill directory for hook requirements
2. Add entries to `~/.claude/hooks/hooks.json` under the appropriate event
3. **MANDATORY:** Use the robust runner for all hook commands:
   ```
   node "/Users/doctorboyz/.claude/scripts/hooks/run-with-fallback.js" "<hook_id>" "<script_path>" "<profiles>"
   ```
4. Verify paths are correct (absolute or properly relative)
5. Remind user to run `/skills reload`

### Git Safety
- If creating local/private config files, warn the user to add them to `.gitignore`
- If the content contains secrets or personal preferences, place it in `.claude/settings.local.json` or a gitignored path

## Step 4 — Summary Report

Display a wiring summary table:

| Item | Type | File Path | Trigger |
| :--- | :--- | :--- | :--- |
| [Name] | [Rule/Skill/Agent/Hook/Command] | `.claude/...` | [Manual/Auto/Event] |

If hooks were added, show the hook entries with their event type and matcher.

## Examples

### Adding a New Rule
User: "Always use TDD for new features"
→ Creates `.claude/rules/common/tdd-enforcement.md`
→ Checks if `CLAUDE.md` already references common rules

### Adding a New Skill with Hooks
User: "Add the santa-method skill"
→ Creates `.claude/skills/santa-method/SKILL.md`
→ Scans for hook requirements in the skill
→ Adds PreToolUse hook to `hooks.json` with `run-with-fallback.js` runner
→ Reminds to run `/skills reload`

### Architecting New Knowledge
User: "Here's how we handle authentication in this project..."
→ Reads `graphify-out/graph.json` to find related nodes
→ Decides: this is an always-on constraint → Rule
→ Creates `.claude/rules/web/authentication.md`
→ No hooks needed, but checks CLAUDE.md for reference