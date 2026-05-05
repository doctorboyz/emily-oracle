---
name: emily-skill-cli-creation-pattern
description: Pattern for creating skill distribution CLI modeled after arra-oracle-skills-cli
type: project
---

Creating a skill distribution CLI following arra-oracle-skills-cli pattern takes ~1 hour for skeleton + migration. Key components: Commander.js entry point, profiles (seed/standard/full), agent target definitions, core installer (copy skills/agents + write manifest), CLI commands. Migration of 68+ skills is a bulk copy — skills carry their own SKILL.md with YAML frontmatter.

**Why:** Needed an independent skill distribution system for emily-oracle, not tied to arra ecosystem. The architecture (Commander.js, SKILL.md format, profiles, compile pipeline) is proven and portable.

**How to apply:** When creating similar CLIs: (1) copy the pattern not the code, (2) test each command immediately after writing, (3) watch import.meta.dir resolution — it points to the file's directory not the project root, (4) separate agent target config (agents.ts) from agent command (agents-cmd.ts) to avoid export collisions.