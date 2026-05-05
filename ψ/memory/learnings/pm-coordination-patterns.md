# Cross-Oracle Coordination Patterns

> Observed patterns for how oracles in the family communicate and coordinate

## Communication Channels

### Vault-based (asynchronous, persistent)
- Oracle writes to ψ/outbox/ → other oracle reads inbox
- Oracle writes resonance file → other oracle reads for state context
- Handoff files in ψ/inbox/handoff/ → session-to-session transfer

### maw-based (synchronous, ephemeral)
- `maw hey <oracle> "message"` → sends message to oracle's tmux session
- `maw peek <oracle>` → reads oracle's current screen output
- `maw fleet ls` → lists all active fleet members
- `maw pulse add` → creates GitHub Issue for task tracking
- `maw art write` → records task completion artifact

### File-based (shared project)
- God Port vault: `/Users/doctorboyz/Code/github.com/doctorboyz/god-port-oracle/ψ/`
- PM vault: `/Users/doctorboyz/Code/github.com/doctorboyz/pm-oracle/ψ/`
- Emily vault: `/Users/doctorboyz/Code/github.com/doctorboyz/emily-oracle/ψ/`

> **2026-04-29**: broky-oracle + metty-oracle + /MT5 consolidated into god-port-trading (single repo)

## Coordination Patterns

### God Port internal (broky → metty signal flow)
- Broky role generates signal → writes to ψ/broky/outbox/ or ψ/outbox/
- Metty role reads signal from inbox → executes via bridge
- Metty role writes execution report → Broky role reads for feedback

### Emily → Child Oracles (budding + framework)
- Emily buds child oracle via `maw bud <name> --from emily`
- Child inherits Oracle framework (5 Principles + Rule 6)
- Child creates vault structure (ψ/)
- Child writes reawaken file to outbox

### PM → God Port (coordination)
- PM reads god-port vault passively (no message needed)
- PM sends `maw hey god-port` when active coordination needed
- PM writes status reports to ψ/outbox/
- PM escalates to emily for capability gaps

### MSG-ACK-RESULT Protocol (PM → any oracle)
- PM เขียนคำขอลง `{target}/ψ/inbox/` พร้อม msg_id
- Target อ่าน inbox → เขียน ack ลง `ψ/outbox/` ของตัวเอง
- Target ทำเสร็จ → เขียน result ลง `ψ/outbox/` ของตัวเอง
- PM อ่าน target outbox → อัพเดท goal file
- Timeout: >1 session pending = peek, >2 = บันทึก, >3 = escalate
- Full spec: `ψ/memory/learnings/message-protocol.md`

## Anti-patterns to Avoid

- Don't command other oracles (Principle 3)
- Don't assume silence means progress (verify with vault evidence)
- Don't skip escalation (early escalation prevents crises)
- Don't duplicate work (check vaults before asking)
- Don't sugarcoat at-risk status (Principle 6: Transparency)