# emily-skill-cli

> เวลาไหลไม่หยุด ทุก skill ถูกส่งต่อ

Install Oracle skills to Claude Code and AI coding agents.

67 skills. 36 agents. 4 platforms. 1 command.

---

## Quick Start

```bash
# Install standard profile (recommended)
npx emily-skill-cli install -g -y
```

## Install

```bash
# Standard profile — daily driver (25 skills, 15 agents)
npx emily-skill-cli install -g -y

# Seed profile — minimal (8 core skills, 5 agents)
npx emily-skill-cli install -g -y -p seed

# Full profile — everything (67 skills, 36 agents)
npx emily-skill-cli install -g -y -p full

# Install specific skills
npx emily-skill-cli install -g -y -s recap -s trace -s learn

# Install to a specific agent platform
npx emily-skill-cli install -g -y -a opencode
npx emily-skill-cli install -g -y -a codex
npx emily-skill-cli install -g -y -a cursor

# Preview without installing
npx emily-skill-cli install --dry-run

# Overwrite existing installations
npx emily-skill-cli install --force
```

## Uninstall

```bash
# Remove everything
emily-skill-cli uninstall --all

# Remove specific skills
emily-skill-cli uninstall -s recap -s trace
```

## Other Commands

```bash
# List installed skills
emily-skill-cli list

# List available (not yet installed) skills
emily-skill-cli list --available

# List available profiles
emily-skill-cli profiles

# List supported agent platforms
emily-skill-cli agents

# Initialize a project with CLAUDE.md and ψ/ structure
emily-skill-cli init --name my-project

# Diagnose installed skills and agents
emily-skill-cli xray

# Show identity and stats
emily-skill-cli about
emily-skill-cli about --en
```

## CLI Reference

| Command | Description | Key Flags |
|---------|-------------|-----------|
| `install` | Install skills and agents | `-p` profile, `-s` skill, `-a` agent, `--dry-run`, `--force`, `-y` |
| `uninstall` | Remove skills and agents | `-s` skill, `-a` agent, `--all` |
| `list` | Show installed or available skills | `--available`, `--json`, `-a` agent |
| `profiles` | List available profiles (seed/standard/full) | — |
| `agents` | List supported agent platforms | — |
| `init` | Create CLAUDE.md + ψ/ brain structure | `--name` |
| `xray` | Diagnose skill installations | — |
| `about` | Show identity, stats, motto | `--en` |

## Profiles

| Profile | Skills | Agents | Description |
|---------|--------|--------|-------------|
| `seed` | 8 | 5 | Minimal — just enough to be an Oracle |
| `standard` | 25 | 15 | Daily driver — recommended |
| `full` | 67+ | 36 | Everything — all skills and agents |

## Supported Platforms

| Platform | Skills Path | Agents Path |
|----------|-------------|-------------|
| Claude Code | `~/.claude/skills` | `~/.claude/agents` |
| OpenCode | `~/.config/opencode/skills` | `~/.config/opencode/agents` |
| Codex | `~/.codex/skills` | `~/.codex/agents` |
| Cursor | `~/.cursor/skills` | `~/.cursor/agents` |

## Skills Catalog

### Core — Oracle Identity

| Skill | Trigger | Description |
|-------|---------|-------------|
| about-oracle | `/about-oracle` | Origin story, stats, family count, ecosystem overview |
| awaken | `/awaken` | Guided Oracle birth and awakening ritual |
| bampenpien | `/bampenpien` | Diligent practice — guided conversation about purpose through difficulty |
| bud | `/bud` | Create a new Oracle via yeast-colony reproduction |
| philosophy | `/philosophy` | Display the 5 Principles + Rule 6 |
| resonance | `/resonance` | Capture resonance moments — when something clicks or sparks joy |
| who-are-you | `/who-are-you` | Current AI identity, model info, session stats |
| oracle-family-scan | `/oracle-family-scan` | Oracle Family Registry — scan, query, welcome |
| oracle-soul-sync-update | `/oracle-soul-sync-update` | Sync Oracle instruments with the family |

### Core — Session Management

| Skill | Trigger | Description |
|-------|---------|-------------|
| recap | `/recap` | Session orientation — retro summaries, handoffs, git state |
| recap-lite | `/recap-lite` | Quick session orientation — git state + last handoff |
| rrr | `/rrr` | Session retrospective with AI diary and lessons learned |
| rrr-lite | `/rrr-lite` | Quick retrospective — what we did, what we learned |
| forward | `/forward` | Create handoff + enter plan mode for next session |
| forward-lite | `/forward-lite` | Quick handoff to next session |
| standup | `/standup` | Daily standup check — tasks, appointments, progress |
| where-we-are | `/where-we-are` | Mid-session awareness — current topic, timeline, pending |
| auto-retrospective | `/auto-retrospective` | Configure auto-rrr and auto-forward triggers |
| context-budget | `/context-budget` | Audit context window consumption and identify bloat |

### Core — Learning & Discovery

| Skill | Trigger | Description |
|-------|---------|-------------|
| learn | `/learn` | Explore a codebase with parallel agents |
| trace | `/trace` | Find projects, code, and knowledge across repos |
| dig | `/dig` | Mine Claude Code sessions — timeline, gaps, attribution |
| incubate | `/incubate` | Clone or create repos for active development |
| project | `/project` | Clone and track external repos |
| graphify | `/graphify` | Any input to knowledge graph — communities, HTML, JSON |

### Core — Skill Management

| Skill | Trigger | Description |
|-------|---------|-------------|
| go | `/go` | Switch skill profiles (seed/standard/full) |
| add-claude-stuff | `/add-claude-stuff` | Wire rules, skills, agents, hooks into .claude/ |
| create-shortcut | `/create-shortcut` | Create local skills as shortcuts — custom /commands |
| skill-upgrade-user-level | `/skill-upgrade-user-level` | Upgrade skills to latest version |
| skills-list | `/skills-list` | List all Oracle skills with profile tier and type |
| configure-ecc | `/configure-ecc` | Interactive installer for Everything Claude Code |
| xray | `/xray` | Deep scan — inspect auto-memory, installed skills, session history |

### Code Quality

| Skill | Trigger | Description |
|-------|---------|-------------|
| coding-best-practices | `/coding-best-practices` | Cross-project coding conventions and quality review |
| coding-standards | `/coding-standards` | Baseline naming, readability, immutability conventions |
| refactoring-assistant | `/refactoring-assistant` | Code refactoring suggestions and patterns |
| commit-msg-validator | `/commit-msg-validator` | Validate commit messages against conventions |
| causal-proof | `/causal-proof` | Causal Proof Testing — scientific method for bug fixing |
| poc | `/poc` | Proof of Concept workflow — validate ideas before implementation |
| security-suite | `/security-suite` | Code review, vulnerability scanning, config protection |
| rules-distill | `/rules-distill` | Extract principles from skills into rules |

### Agent & Team

| Skill | Trigger | Description |
|-------|---------|-------------|
| agent-engineering | `/agent-engineering` | Design, build, and debug AI agent systems |
| agentic-engineering | `/agentic-engineering` | Eval-first execution, decomposition, cost-aware routing |
| claude-devfleet | `/claude-devfleet` | Multi-agent orchestration — plan, dispatch, monitor |
| team-agents | `/team-agents` | Spin up coordinated agent teams for any task |
| team-builder | `/team-builder` | Interactive agent picker for parallel teams |
| agent-payment-x402 | `/agent-payment-x402` | x402 payment execution for AI agents |

### Stack Patterns

| Skill | Trigger | Description |
|-------|---------|-------------|
| frontend-stack-patterns | `/frontend-stack-patterns` | React, Next.js, design systems, slides |
| python-stack-patterns | `/python-stack-patterns` | Python idioms, testing, Django/Web |
| mobile-stack-patterns | `/mobile-stack-patterns` | Flutter, Dart, SwiftUI, Kotlin Multiplatform |
| laravel-stack-patterns | `/laravel-stack-patterns` | Laravel/PHP backend patterns |
| claude-api | `/claude-api` | Claude API patterns — Messages, streaming, tool use |
| ollama-patterns | `/ollama-patterns` | Ollama API — generate, chat, embeddings, streaming |
| pytorch-patterns | `/pytorch-patterns` | PyTorch training pipelines, architectures, data loading |

### DevOps & Infrastructure

| Skill | Trigger | Description |
|-------|---------|-------------|
| ops-infrastructure | `/ops-infrastructure` | DevOps, CI/CD, Docker, system architecture |
| dependency-updater | `/dependency-updater` | Update and manage project dependencies |

### Communication & Content

| Skill | Trigger | Description |
|-------|---------|-------------|
| content-voice | `/content-voice` | Content generation, brand voice, social distribution |
| talk-to | `/talk-to` | Talk to another Oracle agent via contacts + threads |
| telegram-bot | `/telegram-bot` | Create, configure, and debug Telegram bots |
| notebooklm | `/notebooklm` | Query Google NotebookLM from Claude Code |

### Other

| Skill | Trigger | Description |
|-------|---------|-------------|
| everything-claude-code | `/everything-claude-code` | Development conventions for everything-claude-code |
| gan-style-harness | `/gan-style-harness` | GAN-inspired Generator-Evaluator agent harness |
| knowledge-ops-suite | `/knowledge-ops-suite` | Knowledge management, graph modeling, data retrieval |
| blueprint | `/blueprint` | Feature architecture blueprint |
| conflict-session-manager | `/conflict-session-manager` | Manage conflicting sessions and context |
| pr-description-writer | `/pr-description-writer` | Write PR descriptions |

## Agents

36 agent markdown files for Claude Code sub-agents:

| Agent | Purpose |
|-------|---------|
| architect | System design and scalability decisions |
| bug-investigator | Trace root cause of bugs and errors |
| build-error-resolver | Fix build and TypeScript errors |
| causal-proof-fixer | CPT bug fixing: hypothesize, test, fix, verify |
| chief-of-staff | Triage email, Slack, messaging workflows |
| code-architect | Design feature architectures |
| code-explorer | Deep codebase analysis and exploration |
| code-implementer | Implement features from specifications |
| code-reviewer | Code quality, security, maintainability review |
| code-simplifier | Simplify and refine code |
| comment-analyzer | Analyze code comments for accuracy and rot |
| conversation-analyzer | Analyze conversation transcripts for patterns |
| database-reviewer | PostgreSQL query optimization and schema review |
| db-migration-runner | Safe database schema migrations |
| doc-updater | Update documentation and codemaps |
| docker-deployer | Docker Compose deployment management |
| docs-lookup | Fetch current library/framework documentation |
| e2e-runner | End-to-end testing with Playwright |
| gan-planner | GAN Harness planning and specification |
| harness-optimizer | Analyze and improve agent harness config |
| loop-operator | Operate autonomous agent loops |
| performance-optimizer | Performance analysis and optimization |
| planner | Implementation planning and architecture |
| pr-reviewer | Pull request review for quality and security |
| pr-test-analyzer | Review PR test coverage quality |
| project-scaffolder | Scaffold new projects from architectural decisions |
| python-reviewer | Python code review specialist |
| refactor-cleaner | Dead code cleanup and consolidation |
| research-analyst | Deep research and analysis |
| security-reviewer | Security vulnerability detection |
| silent-failure-hunter | Find silent failures and swallowed errors |
| tdd-guide | Test-Driven Development enforcement |
| test-writer | Generate unit, edge case, integration tests |
| token-optimized-agent | Token-efficient agent patterns |
| type-design-analyzer | Analyze type design for encapsulation |
| typescript-reviewer | TypeScript/JavaScript code review |

## How It Works

1. **Skills** are markdown files (`SKILL.md`) that become slash commands in Claude Code
2. **Agents** are markdown files that define sub-agent behavior and tools
3. `emily-skill-cli install` copies skills to `~/.claude/skills/` and agents to `~/.claude/agents/`
4. After install, use `/skill-name` in Claude Code to invoke any skill
5. Agents are available automatically when Claude Code dispatches sub-agents

## License

MIT — [doctorboyz](https://github.com/doctorboyz/emily-skill-cli)