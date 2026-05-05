# Handoff: AOI Framework Migration (maw-js → AOI)

**Date**: 2026-04-22 21:30
**Context**: ██████████░ 85%

📡 Session: 1ad75490 | emily-oracle | ~2h 30m

**Oracle**: Emily (ไม่ระบุ) | **Human**: doctorboyz
**Mode**: Full Soul Sync | **Memory**: auto
**Team**: สร้างทัพ

## What We Did

- Planned and created AOI repo at `/Users/doctorboyz/Code/github.com/doctorboyz/AOI`
- Built initial keyboard-first TUI with Ink (React): 3-pane layout (agent list, feed viewer, command bar)
- Added 15 slash commands mapping to maw-js API (/wake, /sleep, /bud, /talk-to, /rrr, /recap, /team-agents, /fleet, /warp, /health, etc.)
- Migrated entire maw-js codebase (411+ TypeScript files) into AOI
- Renamed all `maw` → `aoi` references (0 remaining): binary, config paths, env vars, class names, HTTP headers
- Created unified CLI: `aoi` (TUI), `aoi serve` (server), `aoi help`, `aoi version`, 66+ CLI commands
- Committed two commits: initial TUI + full framework migration (974 files, 96K lines)

## Pending

- [ ] Fix ~670 TypeScript import path errors (maw-js flat structure → AOI nested src/core/, src/commands/, src/tui/)
- [ ] Fix most common broken imports: ../../../plugin/types (84), ../../../sdk (79), ../config (30), ../../sdk (29)
- [ ] Wire `aoi serve` to actually start (currently fails due to import errors)
- [ ] Test TUI with live maw server
- [ ] Create ~/.aoi/ config directory structure (migrate from ~/.maw/)
- [ ] Update shell completions from maw → aoi
- [ ] Update scripts/ directory (maw-boot.launcher.cjs, maw-heal.sh → aoi equivalents)

## Next Session

- [ ] Fix import paths systematically — biggest bang: fix `../config` → `../core/config`, `../sdk` → `../../sdk`, `../plugin/types` → `../../../plugin/types` relative to new structure
- [ ] Verify `aoi serve` starts API server on port 3456
- [ ] Verify `aoi` TUI connects to running server and shows agents
- [ ] Test `aoi wake emily` end-to-end
- [ ] Run `aoi health` and `aoi fleet` to verify API integration

## Key Files

- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/src/cli.ts` — Unified CLI entry point
- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/src/core/server.ts` — API + WS server
- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/src/core/paths.ts` — AOI_ROOT, CONFIG_DIR, paths
- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/src/core/config/types.ts` — AoiConfig type
- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/src/tui/app.tsx` — TUI root component
- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/src/commands/` — 66 plugin commands
- `/Users/doctorboyz/Code/github.com/doctorboyz/AOI/CLAUDE.md` — Project identity
- `/Users/doctorboyz/.claude/plans/crispy-kindling-stonebraker.md` — Full migration plan