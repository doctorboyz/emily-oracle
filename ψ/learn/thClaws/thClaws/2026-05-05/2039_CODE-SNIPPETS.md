# thClaws Code Snippets

**Learned**: 2026-05-05 | **Source**: https://github.com/thClaws/thClaws

## 1. Main Entry Point — Mode Dispatch

```rust
// crates/core/src/bin/app.rs
#[tokio::main]
async fn main() {
    secrets::load_into_env();
    endpoints::load_into_env();
    load_dotenv();
    let _ = Sandbox::init();

    // Org policy enforcement before CLI parse
    if let Err(e) = thclaws_core::policy::load_or_refuse() {
        eprintln!("\x1b[31m{}\x1b[0m", e.refuse_message());
        std::process::exit(2);
    }

    let cli = Cli::parse();
    let use_cli = cli.cli || cli.print;

    if cli.serve {
        // HTTP + WebSocket serve mode
    }
    if !use_cli {
        // GUI mode (feature-gated)
    }
    // CLI / print mode
    let mut config = match AppConfig::load() { ... };
    // Layer CLI overrides onto config...
}
```

## 2. ContentBlock — Serde Tagged Enum

```rust
// crates/core/src/types.rs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ContentBlock {
    Text { text: String },
    Thinking {
        content: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        signature: Option<String>,
    },
    ToolUse {
        id: String,
        name: String,
        input: serde_json::Value,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        thought_signature: Option<String>,
    },
    ToolResult {
        tool_use_id: String,
        content: ToolResultContent,
        #[serde(default, skip_serializing_if = "std::ops::Not::not")]
        is_error: bool,
    },
    Image { source: ImageSource },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum ToolResultContent {
    Text(String),
    Blocks(Vec<ToolResultBlock>),
}
```

## 3. Error Type — thiserror Pattern

```rust
// crates/core/src/error.rs
use thiserror::Error;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Error, Debug)]
pub enum Error {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("config error: {0}")]
    Config(String),
    #[error("provider error: {0}")]
    Provider(String),
    #[error("tool error: {0}")]
    Tool(String),
    #[error("agent error: {0}")]
    Agent(String),
}
```

## 4. Config — Layered Loading with Untagged Permissions

```rust
// crates/core/src/config.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PermissionsConfig {
    Mode(String),  // "auto", "ask", "plan"
    Rules { allow: Vec<String>, deny: Vec<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct AppConfig {
    pub model: String,
    pub max_tokens: u32,
    pub permissions: String,
    pub system_prompt: String,
    pub thinking_budget: Option<u32>,
    pub mcp_servers: Vec<crate::mcp::McpServerConfig>,
    // ...
}
```

Five-layer precedence: CLI flags > project `.thclaws/settings.json` > user `~/.config/thclaws/settings.json` > `~/.claude/settings.json` > defaults.

## 5. Tool Trait and Registry

```rust
// crates/core/src/tools/mod.rs
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &'static str;
    fn description(&self) -> &'static str;
    fn input_schema(&self) -> Value;
    async fn call(&self, input: Value) -> Result<String>;
    async fn call_multimodal(&self, input: Value) -> Result<ToolResultContent> {
        self.call(input).await.map(ToolResultContent::Text)
    }
    fn requires_approval(&self, _input: &Value) -> bool { false }
    async fn fetch_ui_resource(&self) -> Option<UiResource> { None }
}

// Registration
pub fn with_builtins() -> Self {
    let mut r = Self::new();
    r.register(Arc::new(LsTool));
    r.register(Arc::new(ReadTool));
    r.register(Arc::new(WriteTool));
    r.register(Arc::new(EditTool));
    r.register(Arc::new(GlobTool));
    r.register(Arc::new(GrepTool));
    r.register(Arc::new(BashTool));
    // ...
    r
}
```

## 6. Provider Trait and Kind Enum

```rust
// crates/core/src/providers/mod.rs
#[async_trait]
pub trait Provider: Send + Sync {
    async fn stream(&self, req: StreamRequest) -> Result<EventStream>;
    async fn list_models(&self) -> Result<Vec<ModelInfo>> { ... }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ProviderKind {
    AgenticPress, Anthropic, AgentSdk, OpenAI, OpenAIResponses,
    OpenRouter, Gemini, Ollama, OllamaAnthropic, OllamaCloud,
    DashScope, ZAi, LMStudio, AzureAIFoundry, OpenAICompat,
    DeepSeek, ThaiLLM, Nvidia,
}
```

## 7. Agent Event Types

```rust
// crates/core/src/agent.rs
pub enum AgentEvent {
    IterationStart { iteration: usize },
    Text(String),
    Thinking(String),
    ToolCallStart { id: String, name: String, input: Value },
    ToolCallResult {
        id: String, name: String,
        output: std::result::Result<String, String>,
        ui_resource: Option<UiResource>,
    },
    ToolCallDenied { id: String, name: String },
    Done { stop_reason: Option<String>, usage: Usage },
}
```

## 8. Permissions — Three Modes with Approval Sink

```rust
// crates/core/src/permissions.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PermissionMode {
    Auto,   // Never prompt
    Ask,    // Prompt for mutating tools
    Plan,   // Read-only exploration, SubmitPlan to proceed
}

#[async_trait]
pub trait ApprovalSink: Send + Sync {
    async fn approve(&self, req: &ApprovalRequest) -> ApprovalDecision;
    fn reset_session_flag(&self) {}
}
```

## 9. Sandbox — Path Traversal Prevention

```rust
// crates/core/src/sandbox.rs
pub fn check(path: &str) -> Result<PathBuf> {
    // Resolve relative from cwd, not root (worktree isolation)
    let initial = if Path::new(path).is_absolute() {
        PathBuf::from(path)
    } else {
        cwd.join(path)
    };
    let resolved = lexical_normalize(&initial);
    // Existing paths: canonicalize and check starts_with(root)
    // New paths: walk up to existing ancestor, validate, then join tail
}
```

Key patterns: `$THCLAWS_PROJECT_ROOT` override for worktree teammates, symlink following via `canonicalize()`, lexical normalization before canonicalization to catch `../` escapes.

## 10. Session Persistence — JSONL with File Locking

```rust
// crates/core/src/session.rs
fn append_locked<F>(path: &Path, write: F) -> Result<()>
where F: FnOnce(&mut File) -> std::io::Result<()> {
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    file.lock_exclusive().map_err(|e| Error::Config(format!("session lock: {e}")))?;
    let result = write(&mut file);
    let _ = file.unlock();
    result.map_err(Error::from)
}
```

Session event types: `header`, `user`/`assistant`/`system` messages, `rename`, `plan_snapshot`, `goal_snapshot`, `compaction`. Nanosecond-derived session IDs for uniqueness and chronological sorting.

## 11. Sub-Agent System — Recursive Task Delegation

```rust
// crates/core/src/subagent.rs
pub const TOOL_NAME: &str = "Task";
pub const DEFAULT_MAX_DEPTH: usize = 3;

#[async_trait]
pub trait AgentFactory: Send + Sync {
    async fn build(
        &self,
        prompt: &str,
        agent_def: Option<&AgentDef>,
        child_depth: usize,
    ) -> Result<Agent>;
}
```

`ProductionAgentFactory` propagates parent state (provider, tools, system prompt, permissions, hooks, cancel token) to child agents. Agent definitions specify tool allow-lists and deny-lists.

## 12. MCP Client — Model Context Protocol

```rust
// crates/core/src/mcp.rs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct McpServerConfig {
    pub name: String,
    #[serde(default = "default_transport")]
    pub transport: String,  // "stdio" or "http"
    pub command: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub trusted: bool,
}
```

Allowlist gating for stdio spawns (first-time approval prompt, persisted to `mcp_allowlist.json`). Atomic write via tmp+rename. `trusted` flag for MCP-Apps widget rendering.

## 13. Agent Teams — Filesystem Coordination

```rust
// crates/core/src/team.rs
pub fn is_valid_agent_name(name: &str) -> bool {
    if name.is_empty() || name.len() > 64 { return false; }
    let mut chars = name.chars();
    let Some(first) = chars.next() else { return false; };
    if !(first.is_ascii_alphanumeric() || first == '_') { return false; }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}
```

Mailbox: per-agent JSON arrays with read tracking + file locking. Task queue: filesystem-persisted tasks with claim/complete/dependency tracking. 1-second polling interval. Lead/teammate role distinction via `IS_TEAM_LEAD` static atomic.

## 14. System Prompt Assembly — Multi-Source Loading

```rust
// crates/core/src/context.rs
pub fn build_system_prompt(&self, base: &str) -> String {
    let mut parts: Vec<String> = Vec::new();
    if !base.trim().is_empty() { parts.push(base.trim().to_string()); }
    parts.push(format!("# Working directory\n{}", self.cwd.display()));
    if let Some(git) = &self.git {
        parts.push(format!("# Git\nBranch: {}\nHEAD:   {}\nStatus: {}", ...));
    }
    if let Some(instr) = &self.project_instructions {
        parts.push(format!("# Project instructions\n{}", instr.trim()));
    }
    parts.join("\n\n")
}
```

Discovery order: `~/.claude/CLAUDE.md`, `~/.claude/AGENTS.md`, `~/.config/thclaws/`, walking up from cwd, project config dirs, rules dirs, local overrides.