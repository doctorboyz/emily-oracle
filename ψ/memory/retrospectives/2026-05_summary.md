# May 2026 Retrospective Summaries

## Week 1 (May 3-4): Infrastructure & Synapse Foundation

**May 3 -- ai-server Infrastructure Rebuild** (2h 22m): Rebuilt Docker infrastructure from 5 to 10 services. Replaced pgvector with plain postgres, added Svix (webhook), Redis, MinIO, Uptime Kuma, OpenKB API. Container names simplified: ai-db→postgres. Shared postgres with multiple databases. Hit port 5432 conflict from orphan container, missing env vars caused Svix crash-loop. Created comprehensive INFRA_GUIDE.md in Thai.

**May 3 -- Synapse v1 Build & Cleanup** (9h): Built Synapse v1 -- hybrid knowledge framework with LanceDB + SQLite FTS5 + RRF fusion 60/40, all local-first. Created CLI, MCP server (5 tools), PostToolUse hook, scope system, supersession. Benchmarks: hybrid R@10=1.00. Created synapse repo at ~/Code/github.com/doctorboyz/synapse. 4 context compactions. Code review found CRITICAL bug (push.py NoneType crash) and 4 HIGH issues -- all from missing tests. Key lesson: TDD is not optional.

## Week 2 (May 5-11): Oracle Army Foundation

**May 5 -- Oracle Army Personal Repo Setup** (9h): Forked arra-oracle-v3 and oracle-framework with upstream pattern. Consolidated mysynapse into synapse v3 branch (preserving v1+v2 history). Created oracle-vault private repo seeded with 62 knowledge files including philosophy book (2 versions). Fixed maw-js origin remap. Key decisions: branch versioning over separate repos, oracle-vault as central knowledge hub.

**May 5 -- Synapse v3 Fix + κ→ψ Migration + dev-oracle** (21h total): Fixed synapse v3 backend (OllamaEmbedder import, mysynapse→synapse rename, qdrant API change). Migrated emily-oracle from κ/ψ dual structure to ψ/ only -- archived κ/. Created dev-oracle repo with 7 subagents + 15 knowledge seeds + /dev-team skill. Learned thClaws codebase (filesystem-based agent team coordination). Key lesson: planning feels like progress but isn't -- test before exploring.

**May 5 -- Synapse Verification + Sprint** (45 min): Verified all 12 synapse endpoints, confirmed backend restart reliable. Created Sprint S001 with backlog in dev-oracle. Key pattern: verification procrastination -- Sprint has 5 tasks, zero completed, discussion/learn took priority over testing.

**May 5 -- mkt-oracle Creation** (45 min): Created turn-key marketing agency oracle with 7 subagent roles. Initial flat structure was wrong -- user corrected to client-scoped layout (ψ/clients/<client-slug>/). Created _template/ blueprint for new clients. Key lesson: agency pattern = multi-tenant by default.

**May 7 -- Oracle Communication Protocol** (25 min): Designed 3-part core protocol (what, why, then what) + situation-specific extensions for all 6 oracles. Installed in all CLAUDE.md files across 3 iterations. First round over-engineered with Thai translation tables -- user actually wanted to allow technical terms but avoid long code explanations. Key lesson: ask before guessing user intent.

**May 9 -- Infra Oracle Birth** (4h 46m): Docker-ized open-design repo, added to ai-server stack via server-network. Set up Cloudflare tunnel route design.doctorboyz.com. Created Infra Oracle with brain structure, deep learn (5 agents found security concerns), maw fleet registration. Key friction: maw bud created separate infra-oracle repo, causing 2 repos for one infrastructure.

**May 10 -- arra-oracle Clone Study** (37 min): Cloned arra-oracle-v3 and skills-cli from Soul-Brews-Studio. Switched from fork to clone approach for study purposes. Deleted old doctorboyz/arra-oracle-v3 fork. Discovered arra uses Elysia (moved from Hono), SQLite+FTS5+Drizzle, multi-backend vectors.

**May 10 -- LIFF Skill Creation** (14h total): Created global LIFF skill with 9 sections from user-provided data, registered trigger in CLAUDE.md. Key mistake: didn't cross-check with LINE Docs immediately -- subsequent cross-check found v2.28.0 APIs missing and deprecated deep links still in skill. Updated to 15 sections with code examples.

**May 10 -- LIFF Knowledge Enrichment** (30 min): Cross-checked against LINE Developers docs. Found liff.requestFriendship() (v2.28.0), liff.permission.getGrantedAll() (v2.27.0), and that line://app/{liffId} deep links were discontinued. Updated skill with Release Notes section. Pushed 2 entries to synapse. Synapse search didn't return LIFF results -- search vector may need rebuild.

## Week 3 (May 14-18): Skill Creation & Tooling

**May 14 -- /roadmap Skill Creation** (2h 21m): Created /roadmap skill with 2 modes (default + --set), reading vault + synapse to synthesize status. Used pm-goal-tracking-guide format. Key lesson: proposed 4 modes initially, user only wanted 2 -- start minimal. Added UX/UI Designer agent to /learn --deep. Read 2 inbox messages from Infra group.

**May 16 -- maw Ollama Model Picker** (1h 17m): Researched AI coding model benchmarks (DeepSeek V4 Pro vs GLM-5.1). Implemented interactive Ollama model picker for maw wake using {ollama-pick} placeholder + module-level cache bridge pattern to connect async selection with sync command builder. Removed "last used model" smart fallback -- predictable default beats smart inference.

## Week 4 (May 19-25): Architecture & Tooling

**May 21 -- Architecture Course Correction M3** (varies): Completed M3 vault consolidation (180 ψ/memory files from 7 oracles imported into synapse, 205 total docs). Then realized centralized C-suite was over-engineered. Scrapped nexus as COO, reverted AGENT.md→CLAUDE.md, removed nexus protocol from all oracles. Each oracle is now standalone harness. Synapse remains as second brain / knowledge mirror.

**May 22 -- /issue Skill + /rrr Integration** (20 min): User chose JSONL format for issue tracker. Created /issue global skill with oracle root detection, integrated with /rrr Step 6 for auto-extraction. Created 4 issues (3 real, 1 test). Key lesson: make the manual tool work before designing automation.

**May 25 -- /update-oracle + Learn Restructure** (90 min total): Propagated /issue to 6 child oracles. Restructured /learn --deep from 6 agents to 6 focused files (FUNCTION-CATALOG, APP-LOGIC, CODE-ANALYSIS added). Wired learn outputs into /awaken. Created /update-oracle skill for Emily to propagate shared CLAUDE.md sections to children. Debugged synapse test failure (test filter mismatch).

## Week 5 (May 26-28): Investigation & Consolidation

**May 27 -- agy + Ollama Investigation** (45 min): Discovered agy (Antigravity CLI) is a Google cloud client connecting to daily-cloudcode-pa.googleapis.com, not a local Claude Code wrapper. Tried 3 config formats before reading logs -- logs revealed the answer immediately. Set OLLAMA_KEEP_ALIVE=3h as permanent improvement. Created ollama/ollama#16329 feature request. Key lesson: check what server a CLI connects to before trying to override its model.

**May 28 -- HZC PostgreSQL→MD Migration + Repo Separation** (11h): Migrated HZC from PostgreSQL to file-based MD/YAML storage. Rewrote all 9 routers, student_analyzer, schemas, CLI. Replaced async DB dependencies with synchronous file access, student_id:int→student_slug:str. Then moved HZC out of emily-oracle into standalone hzc-oracle repo. Restored emily CLAUDE.md (was accidentally overwritten with HZC content). Key lessons: file-based wins for under 1000 records where AI is primary reader; slug IDs map directly to filesystem paths; VAULT path calculation is fragile.

**May 28 -- Skill Consolidation** (47 min): Audited all 92 skills for duplication. Found 3 duplication patterns: Kappa/Oracle replacement chains, lite/full pairs, subset/superset overlaps. Consolidated 92→74 skills by archiving 18 duplicates. Added --lite flag to rrr instead of separate skill. Key patterns: use flags not separate skills for variants; remove old family when switching; check for existing before creating new.
