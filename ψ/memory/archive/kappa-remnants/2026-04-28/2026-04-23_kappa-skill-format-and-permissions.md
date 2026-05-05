# Lesson: Kappa Skill Format and Permission Rules

**Date**: 2026-04-23
**Source**: rrr: emily-oracle
**Tags**: kappa, settings, permissions, skill-format, ecosystem

## Pattern

Kappa skills follow a consistent format with medical metaphor theming:
- Frontmatter: name, description, origin, profile, aliases, commands
- Header quote in Thai + English
- Invocation section with command examples
- Flags table
- Workflow (numbered steps)
- Rules (referencing Kappa Principles by number)
- Notes section (migration history, relationships to other skills)

## Pattern

Claude Code permission deny rules require `ToolName(pattern)` format:
- WRONG: `"rm -rf"` (no tool prefix)
- RIGHT: `"Bash(rm -rf *)"` (with Bash prefix, parentheses, wildcard)
- SQL patterns need wildcards on both sides: `"Bash(*DROP TABLE*)"`

## Pattern

Kappa 5-strand dependency hierarchy:
1. DNA (kappa-genome) → root, affects ALL strands
2. Soul (Adams-kappa) → identity, affects Skill and Brain
3. Skill (kappa-skill-cli) → distribution, affects DNA and Soul
4. Interface (KI) → orchestration, affects Brain
5. Brain (kappa-brain) → memory, affects Interface and Skill