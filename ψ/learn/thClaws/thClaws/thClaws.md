# thClaws Learning Index

## Source
- **Origin**: ./origin/
- **GitHub**: https://github.com/thClaws/thClaws

## Explorations

### 2026-05-05 2039 (default)
- [[2026-05-05/2039_ARCHITECTURE|Architecture]]
- [[2026-05-05/2039_CODE-SNIPPETS|Code Snippets]]
- [[2026-05-05/2039_QUICK-REFERENCE|Quick Reference]]

**Key insights**:
- thClaws is a single-crate Rust monolith (v0.8.0) with "one engine, three surfaces" — GUI, CLI REPL, and HTTP serve mode all share the same Agent/Session/ToolRegistry
- Filesystem-based agent team coordination via mailbox JSON + task queue (no central server)
- 5-layer config precedence: CLI > project > user > Claude Code compat > defaults
- JSONL append-only sessions with file locking for concurrent process safety