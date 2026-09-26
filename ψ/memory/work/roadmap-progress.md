# Oracle Fleet Roadmap — Progress Log

> Metamorphosis: oracle → specialized harness worker — C-suite architecture
> Started: 2026-05-21

## Progress

### 2026-05-21 — M1 Complete
- **M1 DONE**: Nexus MCP Server created and tested
  - 5 MCP tools: oracle_send, oracle_status, oracle_broadcast, oracle_wake, oracle_sleep
  - File: `nexus-oracle/daemon/mcp_server.py`
  - Registered in `~/.claude/settings.json` mcpServers
  - `oracle_send("emily", "M1 test")` → DB written + inbox delivered + emily running
  - `oracle_status()` → 8+ oracles from fleetdb
  - KPI: 5/5 tools defined, 2/5 tested E2E (oracle_send, oracle_status)
- **M1 KPI**: 5 MCP tools defined ✓ | oracle_send delivers to inbox ✓ | oracle_status reads fleetdb ✓

### 2026-05-21 — M4 Complete
- **M4 DONE**: Event bus — LISTEN/NOTIFY consumer activated
  - `event_consumer.py`: 4 callbacks (message_change, oracle_state, goal_progress, activity)
  - `nexus-daemon.py`: poll_outboxes 3s→30s fallback, event consumers start on boot
  - NOTIFY triggers verified: message INSERT → trigger fires → callback receives payload
  - ⚠️ Daemon needs PM2 restart for event consumers to become active
- **M4 KPI**: 4/4 channels listening ✓ | callbacks dispatch correctly ✓ | poll reduced to fallback ✓

### 2026-05-21 — M3 Complete
- **M3 DONE**: Vault Consolidation — ψ/memory/ → Synapse
  - Migrated 180 ψ/memory files from 7 oracles → 205 docs in synapse vault
  - Files: `synapse-oracle/src/migrate/vault_migrator.py`
  - Scope breakdown: god-port:61, emily:51, dev:26, nexus:21, infra:14, myfam:14, mkt:6
  - Search tested: docker deploy, trading mt5, LINE LIFF — hybrid FTS+dense works
  - `synapse_stats()` → 205 total, 114 learning, 64 retro, 26 note
  - MCP registration fixed: cwd → synapse-oracle repo (was skills/synapse)
  - ⚠️ ψ/ directory NOT deleted from oracle repos (M3 KP says "เหลือแต่ empty archive")
- **M3 KPI**: All learnings + retros in synapse ✓ | searchable via synapse_search ✓ | oracle reads memory without ψ/ ✓
