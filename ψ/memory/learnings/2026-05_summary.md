# May 2026 Learnings Summary

## Week 1 (May 3-5) — Infrastructure & Oracle Army Foundation

### 2026-05-03 — Docker Infrastructure Patterns
One PostgreSQL container with multiple databases beats separate containers per DB. Use docker-entrypoint-initdb.d for automatic DB creation. Container names should be self-explanatory (postgres, not ai-db). All internal services use an external server-network communicating by container name. Health checks are essential for depends_on: condition: service_healthy. Always use --remove-orphans when renaming services, and backup before migration.

### 2026-05-03 — Knowledge Framework Design (Reference)
Comprehensive analysis of 5 knowledge projects (MemPalace, Oracle Framework, SocratiCode, Graphify, OpenKB) to design a hybrid multi-layer system: Qdrant dense+sparse vectors, PostgreSQL FTS5, file-based append-only storage, and NetworkX graph traversal. Proposes 4-layer memory stack (L0-L3) with ~170 token wake-up cost, 3 ingest channels (hook auto, /rrr semi-auto, /kb-push manual), and 3-step retrieval (hybrid search + graph traversal + LLM rerank). 4-phase implementation plan with key architecture decisions documented.

### 2026-05-03 — Scope Discipline, TDD, Ask First
When the user specifies scope (specific files/folders), stay strictly within it — expanding scope unilaterally causes wasted rework. TDD is not optional: a NoneType crash in push.py would have been caught immediately with a test. For creative/visual work, make a minimal version first and ask for feedback before building fully. Ambiguous requests need clarification before implementation.

### 2026-05-05 — Multi-Tenant Workspace Pattern
When an Oracle serves multiple clients/projects, scope work under ψ/clients/<client-slug>/ from the start, not flat. Each client gets isolated workspace with campaigns, calendar, brand, journey, creative, and channels directories. Use _template/ as a blueprint for new clients. This design prevents data contamination and simplifies archival.

### 2026-05-05 — Oracle Army Multi-Repo Session Management
Working across multiple repos in one session compounds context pressure. Each repo has its own CLAUDE.md, ψ/ structure, and git state. One repo per session is ideal; when multi-repo is necessary, complete one phase fully before switching. Use sprint files to track progress across sessions.

### 2026-05-05 — Oracle Army Setup (Fork/Upstream, Branch Versioning)
Fork repos from Soul-Brews-Studio with origin→fork and upstream→source. Use branches for versioning (main=v1, v2=v2, v3=v3) instead of separate repos — preserves git history. Oracle vault repo serves as central knowledge hub for cross-project search. GitHub delete_repo requires browser-approval scope refresh.

## Week 2 (May 7-10) — Communication, Consolidation, Skills

### 2026-05-07 — Oracle Communication Protocol
Every oracle message must have 3 parts: what was done, why it was done, and what follows (then what). Extensions for scenarios: compare alternatives when proposing, what broke + fix when encountering problems, risk + impact for risks, etc. Thai language with technical terms, no long code explanations, never skip "then what." Installed in CLAUDE.md of all Oracle repos.

### 2026-05-08 — Nexus Consolidation Complete
texty + pm merged into nexus-oracle as central communication hub for the Oracle army. All oracles have Stop hooks reporting to nexus, daemon runs via launchd, README.md is primary reference document. Two complementary functions (messaging + goal tracking) consolidated into one.

### 2026-05-09 — Infra Oracle Birth
Repos with existing Docker setup use pre-built images + env config, not new Dockerfiles. Cloudflare tunnel token-based routes are manageable via Dashboard without container restart. Add services to the main stack's docker-compose.yml with external network, port binding to 127.0.0.1, and health checks. maw wake doesn't support paths outside ghq root — use maw bud instead.

### 2026-05-10 — arra-clone-learn
Cloned arra-oracle-v3 and arra-oracle-skills-cli from Soul-Brews-Studio. Clone approach chosen over fork — for study and own development, not upstream sync. arra-oracle-v3 uses Elysia (moved from Hono), SQLite+FTS5+Drizzle ORM, multi-backend vector search. skills-cli has 60 skills, 4 profiles, 18 AI agents.

### 2026-05-10 — LIFF API Reference
LIFF v2.28.0 SDK reference: init lifecycle, login/logout, profile, messaging via sendMessages and shareTargetPicker, friendship API, scanning, navigation. Release notes 2025-2026 with deprecated methods: scanCode→scanCodeV2, getLanguage→getAppLanguage, permanentLink old API. URL routing rules and backend token verification patterns documented.

### 2026-05-10 — LIFF Skill Creation Pattern
Creating a global skill requires trigger registration in CLAUDE.md, not just file placement. Cross-check immediately when receiving single-source data — outdated API references (deprecated methods, discontinued deep links) were caught late. Essay-to-table conversion adds value but needs actionable code examples. Always include Release Notes section to track what's new and deprecated.

## Week 3-4 (May 14-28) — Skills, Protocols, Architecture

### 2026-05-14 — Roadmap Skill Creation (Start Minimal)
User needed 2 modes (default + --set), but 4 were proposed — over-engineering. Start with minimal scope, expand only when needed. Use existing formats as base (pm-goal-tracking-guide). Archive old roadmaps instead of deleting (Principle 1). Default mode reads all vault sections (identity, instinct, learnings, retrospectives, work, inbox, synapse) to synthesize status.

### 2026-05-16 — maw Ollama Interactive Model Picker
Module-level cache bridges async interactive model selection with sync command builder — avoids changing function signatures that break 10+ callers. Config template uses {ollama-pick} placeholder. Don't derive "last used" model from ollama list MODIFIED column — other processes pollute it. Simple predictable default beats "smart" inference.

### 2026-05-22 — Issue Skill Pattern (Append-Only JSONL)
JSONL over database for issue tracking: one JSON object per line, append-only, git-tracked. Skill detects oracle root (same pattern as /rrr), passes --file to shared CLI script. Auto-extract max 3 blockers from /rrr step 6, tagged with retro date. Issue lifecycle: open → in_progress → fixed | wontfix.

### 2026-05-25 — Oracle Propagation Pattern
Emily oracle ecosystem needs propagation for shared changes. Global skills available to all oracles immediately. CLAUDE.md sections (Short Codes, Brain Structure, Golden Rules, Communication, Principles) propagated via /update-oracle. Parent lineage from CLAUDE.md grep is the registry. Always --dry-run first, section matching by H2 only.

### 2026-05-27 — agy Architecture Discovery Order
agy (Antigravity CLI) is a Google Cloud client, not a local LLM wrapper. Connects to daily-cloudcode-pa.googleapis.com — ignores ANTHROPIC_BASE_URL and custom model providers. Investigation order for any new CLI: logs first, then network connections, then binary strings, then config files.

### 2026-05-28 — File-Based Storage Migration (PostgreSQL → MD/YAML)
When to choose file-based: small data (<100 records), human-readable, AI is primary reader/writer, no complex queries, single-writer pattern. When DB still wins: concurrent writes, complex relations, ACID needed, >10K records, multi-tenant isolation. Key pattern: slug-based IDs that map directly to filesystem paths. Fragile: relative VAULT path calculation — prefer env var or config.

### 2026-05-28 — Skill Dedup Pattern
Duplicate skills cost tokens every turn (skill list) and every trigger (SKILL.md load). Three types of duplication: Kappa/Oracle replacement chains, lite/full pairs (use flags instead), subset/superset overlaps (keep superset). Consolidation result: 92 → 74 skills. Before creating new skill: check for existing, use flags for lite versions, remove old when switching families.
