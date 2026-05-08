# thClaws Architecture

**Learned**: 2026-05-05 | **Source**: https://github.com/thClaws/thClaws

## Overview

thClaws is a native-Rust AI agent workspace with CLI, GUI, and HTTP serve modes. It supports 13+ LLM providers, has a plugin/skill/MCP system, agent team coordination, plan-mode execution, and a filesystem sandbox. The codebase is a Cargo workspace with a single `crates/core` crate.

## Directory Structure

```
thClaws/
├── crates/core/           # Main crate (all logic here)
│   ├── src/
│   │   ├── bin/app.rs     # Entry point (CLI/GUI/Serve dispatch)
│   │   ├── agent.rs       # Agent loop, streaming, tool dispatch
│   │   ├── config.rs      # Multi-layer config (CLI > project > user > defaults)
│   │   ├── context.rs     # System prompt assembly (CLAUDE.md, rules, skills)
│   │   ├── compaction.rs  # Context window management
│   │   ├── error.rs       # thiserror-based error types
│   │   ├── mcp.rs         # Model Context Protocol client
│   │   ├── permissions.rs # Auto/Ask/Plan permission modes
│   │   ├── sandbox.rs     # Filesystem sandbox (path traversal prevention)
│   │   ├── session.rs     # JSONL append-only session persistence
│   │   ├── skills.rs      # Skill discovery & loading
│   │   ├── subagent.rs    # Recursive sub-agent spawning
│   │   ├── team.rs        # Filesystem-based agent team coordination
│   │   ├── types.rs       # Wire types (ContentBlock, ToolResultContent)
│   │   ├── tools/         # Built-in tool implementations
│   │   ├── providers/     # LLM provider backends
│   │   └── ...
│   └── Cargo.toml         # v0.8.0, ~40 dependencies
├── frontend/              # Web frontend (GUI mode)
├── docs/                  # Documentation
├── scripts/               # Build/packaging scripts
└── Cargo.toml            # Workspace root
```

## Core Abstractions

### 1. Provider Trait
`Provider` trait defines a streaming interface. `ProviderKind` is an exhaustive enum (compiler catches omissions on new providers).

```rust
#[async_trait]
pub trait Provider: Send + Sync {
    async fn stream(&self, req: StreamRequest) -> Result<EventStream>;
    async fn list_models(&self) -> Result<Vec<ModelInfo>> { ... }
}
```

### 2. Tool Trait
`Tool` trait uses `async_trait` for async dispatch. `ToolRegistry` is a `HashMap<String, Arc<dyn Tool>>`.

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &'static str;
    fn description(&self) -> &'static str;
    fn input_schema(&self) -> Value;
    async fn call(&self, input: Value) -> Result<String>;
    async fn call_multimodal(&self, input: Value) -> Result<ToolResultContent> { ... }
    fn requires_approval(&self, _input: &Value) -> bool { false }
}
```

### 3. Agent Loop
The agent loop streams from provider, collects text/tool_use blocks, executes tools, loops until no more tool calls. Events: `IterationStart`, `Text`, `Thinking`, `ToolCallStart`, `ToolCallResult`, `ToolCallDenied`, `Done`.

### 4. Type System
Wire types mirror Anthropic format with serde tag-based dispatch:
- `ContentBlock` (tagged enum): Text, Thinking, ToolUse, ToolResult, Image
- `ToolResultContent` (untagged): Text or Blocks
- `PermissionsConfig` (untagged): simple string or allow/deny object

## Entry Points

| Mode | Flag | Description |
|------|------|-------------|
| GUI | (default) | Desktop app with webview |
| CLI | `--cli` | Interactive REPL |
| Print | `--print` / `-p` | One-shot, output to stdout |
| Serve | `--serve` | HTTP + WebSocket API server |

## Data Flow

```
User Input
    ↓
Agent Loop (agent.rs)
    ↓
Provider Stream (providers/)
    ↓
Event Collection (text + tool_use blocks)
    ↓
Tool Dispatch (tools/) via ToolRegistry
    ↓
Tool Result → back to Agent Loop
    ↓
Permission Check (permissions.rs) for approval-gated tools
    ↓
Sandbox Check (sandbox.rs) for filesystem tools
    ↓
Session Persistence (session.rs) JSONL append
```

## Key Design Decisions

1. **Single crate monolith** — All logic in `crates/core`, no multi-crate splitting yet
2. **JSONL append-only sessions** — File locking via `fs2` for concurrent process safety
3. **Filesystem-based team coordination** — Mailbox JSON arrays + task queue, 1s polling
4. **Lazy skill body loading** — Frontmatter-only at boot, body loaded on demand via `OnceLock`
5. **Five-layer config precedence** — CLI > project > user > Claude Code compat > defaults
6. **Sandbox-first filesystem** — Lexical normalization + canonicalize to prevent path traversal
7. **Sub-agent depth limit** — Max 3 levels of recursive agent spawning

## Dependencies (Key)

| Dependency | Purpose |
|-----------|---------|
| tokio | Async runtime |
| reqwest | HTTP client for providers |
| axum | Serve mode HTTP server |
| serde + serde_json | Serialization |
| clap | CLI argument parsing |
| keyring | OS keychain for API keys |
| comrak | Markdown rendering (GUI) |
| tao + wry | GUI window + webview |
| printpdf, docx-rs, rust_xlsxwriter | Document generation tools |
| calamine, quick-xml | Document parsing tools |