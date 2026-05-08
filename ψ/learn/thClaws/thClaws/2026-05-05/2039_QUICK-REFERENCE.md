# thClaws Quick Reference

> **Version**: 0.8.0 (core crate) | **License**: MIT OR Apache-2.0 | **Language**: Rust (native binary) | **Developer**: ThaiGPT Co., Ltd.

## What It Does

thClaws is a **native-Rust AI agent workspace** that runs locally on your machine. It is not just a coder -- it edits files, runs shell commands, searches knowledge bases, coordinates teams of agents, and deploys web apps, all from a single binary. You interact via natural language; it reads your files, calls tools, and talks back while working.

Three interfaces from one binary:
- **Desktop GUI** (`thclaws`) -- native window with Terminal, Chat, Files, and Team tabs
- **CLI REPL** (`thclaws --cli`) -- interactive terminal prompt (SSH / headless friendly)
- **Non-interactive** (`thclaws -p "prompt"`) -- single-turn mode for scripts and CI

---

## Installation

### Pre-built Binaries

Download from [thclaws.ai/downloads](https://thclaws.ai/downloads) or [GitHub Releases](https://github.com/thClaws/thClaws/releases).

Supported: macOS (arm64, x86_64), Linux (arm64, x86_64), Windows (arm64, x86_64).

**macOS**:
```sh
tar -xzf ~/Downloads/thclaws-*-apple-darwin.tar.gz
mkdir -p ~/.local/bin && mv thclaws ~/.local/bin/ && chmod +x ~/.local/bin/thclaws
# Add to PATH in ~/.zshrc:
export PATH="$HOME/.local/bin:$PATH"
# Clear quarantine (one-time):
xattr -d com.apple.quarantine ~/.local/bin/thclaws
```

**Linux**:
```sh
tar -xzf ~/Downloads/thclaws-*-linux-gnu.tar.gz
mkdir -p ~/.local/bin && install -m 755 thclaws ~/.local/bin/
```

**Linux GUI deps** (headless servers use `--cli` instead):
```sh
sudo apt install libwayland-client0 libwebkit2gtk-4.1-0 libsoup-3.0-0   # Debian/Ubuntu
sudo dnf install wayland libsoup3 webkit2gtk4.1                         # Fedora/RHEL
```

**Windows**: Extract zip to `%LOCALAPPDATA%\Programs\thclaws`, add to PATH.

### Build from Source

**Prerequisites**: Rust 1.85+, Node.js 20+, pnpm 9+.

```sh
git clone https://github.com/thClaws/thClaws.git
cd thClaws
cd frontend && pnpm install && pnpm build && cd ..
cargo build --release --features gui --bin thclaws      # GUI + CLI
cargo build --release --bin thclaws-cli                   # CLI-only (no GUI deps)
```

### Optional: Ollama for Fully Offline Use

```sh
brew install ollama           # macOS
curl -fsSL https://ollama.com/install.sh | sh  # Linux
ollama pull gemma4:26b        # recommended minimum for agent work
# Then in thClaws: /model ollama/gemma4:26b
```

### Verify

```sh
thclaws --version
thclaws --cli
thclaws -p "say hi in one word"
```

---

## Key Features

### Multi-Provider LLM Support (13 providers)

| Provider | Model Prefix | Auth Env Var | Notes |
|---|---|---|---|
| Agentic Press | `ap/*` | `AGENTIC_PRESS_LLM_API_KEY` | Multi-backend gateway |
| Anthropic | `claude-*` | `ANTHROPIC_API_KEY` | Extended thinking, prompt caching |
| Anthropic Agent SDK | `agent/*` | (Claude Code auth) | Shells out to `claude` CLI; limited tool access |
| OpenAI | `gpt-*`, `o1-*`, `o3*`, `o4-*` | `OPENAI_API_KEY` | Chat Completions API |
| OpenAI Responses | `codex/*` | `OPENAI_API_KEY` | Agentic-native Responses API |
| OpenAI-Compatible | `oai/*` | `OPENAI_COMPAT_API_KEY` + `OPENAI_COMPAT_BASE_URL` | LiteLLM / Portkey / vLLM / any OAI-compat |
| OpenRouter | `openrouter/*` | `OPENROUTER_API_KEY` | 300+ models, single key |
| Gemini | `gemini-*`, `gemma-*` | `GEMINI_API_KEY` | Google AI Studio |
| Ollama | `ollama/*` | -- (local) | NDJSON streaming, no auth |
| Ollama Anthropic | `oa/*` | -- (local) | Anthropic-compatible endpoint on Ollama |
| DashScope | `qwen-*`, `qwq-*` | `DASHSCOPE_API_KEY` | Alibaba Qwen |
| DeepSeek | `deepseek-*` | `DEEPSEEK_API_KEY` | V4 flash/pro; reasoning chain support |
| ThaiLLM | `thaillm/*` | `THAILLM_API_KEY` | Thai-language models from NECTEC |

Model aliases: `sonnet` = `claude-sonnet-4-6`, `opus` = `claude-opus-4-6`, `haiku` = `claude-haiku-4-5`, `flash` = `gemini-2.5-flash`.

Switch mid-session:
```
/provider openai
/model gpt-4o
/models
/models refresh
```

Intra-family model switches preserve conversation history; cross-family switches auto-fork a new session.

### Skills (Reusable Workflows)

Packaged as directories with `SKILL.md` + optional `scripts/`:

```
.thclaws/skills/deploy-to-staging/
  SKILL.md          # YAML frontmatter (name, description, whenToUse) + instructions
  scripts/
    build.sh
    push-to-staging.sh
    smoke-test.sh
```

Auto-triggered via `whenToUse` in system prompt, or invoked explicitly as `/skill-name args`.

Install: `/skill install skill-creator`, `/skill install https://github.com/user/skill.git`, `/skill install URL.zip`

Scope: `.thclaws/skills/` (project) or `~/.config/thclaws/skills/` (user, `--user` flag).

### Knowledge Bases (KMS)

Per-project and per-user wikis the agent can search and read on demand. No embeddings -- grep + read (Karpathy's LLM wiki pattern).

```
<kms_root>/
  index.md          # Table of contents (injected into system prompt every turn)
  log.md            # Append-only change log
  pages/
    auth-flow.md
    api-conventions.md
```

Commands: `/kms`, `/kms new [--project] NAME`, `/kms use NAME`, `/kms off NAME`, `/kms show NAME`

Agent tools: `KmsRead(kms, page)`, `KmsSearch(kms, pattern)`

### Agent Orchestration

**Sub-agents** (`Task` tool): In-process, serial, share sandbox. Up to 3 levels of recursion. Defined in `.thclaws/agents/*.md` with frontmatter for `name`, `model`, `tools`, `permissionMode`, `maxTurns`.

**Agent Teams**: Multiple `thclaws --team-agent` processes coordinating through filesystem mailbox + task queue in `.thclaws/team/`. True parallelism. Enable with `"teamEnabled": true` in settings.

### Memory & Project Instructions

- **AGENTS.md / CLAUDE.md** -- Static project conventions, auto-injected into system prompt (walked up from cwd)
- **Memory** -- Dynamic notes at `.thclaws/memory/` with YAML frontmatter types: `user`, `feedback`, `project`, `reference`
- Edit via Settings menu (WYSIWYG TipTap editor) or plain text

### Plugins

Bundles of skill + command + agent + MCP server under a single manifest (`plugin.json`):

```json
{
  "name": "agentic-press-deploy",
  "version": "1.0.0",
  "skills": ["skills"],
  "commands": ["commands"],
  "agents": ["agents"],
  "mcpServers": { "deploy-hub": { "transport": "http", "url": "..." } }
}
```

Install: `/plugin install <url>`, manage: `/plugin enable`, `/plugin disable`, `/plugin remove`.

### MCP Servers

Connect external tools via Model Context Protocol. Both stdio (subprocess) and HTTP Streamable transports. OAuth 2.1 + PKCE auto-handled for protected servers.

```json
// .thclaws/mcp.json
{
  "mcpServers": {
    "weather": { "command": "npx", "args": ["-y", "@h1deya/mcp-server-weather"] },
    "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"],
               "env": { "GITHUB_TOKEN": "ghp_..." } },
    "remote": { "transport": "http", "url": "https://api.example.com/mcp",
                "headers": { "Authorization": "Bearer ..." } }
  }
}
```

Commands: `/mcp`, `/mcp add [--user] <name> <url>`, `/mcp remove <name>`, `/mcp marketplace`, `/mcp install NAME`

### Document Tools (Built-in, Rust-native)

| Tool | Auto/Ask | Summary |
|---|---|---|
| `PdfCreate` | ask | Markdown to PDF (Noto Sans Thai embedded, A4/Letter/Legal) |
| `PdfRead` | auto | Extract text via `pdftotext` |
| `DocxCreate` | ask | Markdown to Word (.docx) |
| `DocxRead` | auto | Read Word documents |
| `DocxEdit` | ask | Find/replace, append paragraph |
| `XlsxCreate` | ask | CSV or JSON 2D-array to Excel |
| `XlsxRead` | auto | Read XLSX/XLSM/XLSB/XLS/ODS |
| `XlsxEdit` | ask | Set cells, add/delete sheets (preserves formatting) |
| `PptxCreate` | ask | Markdown outline to PowerPoint |
| `PptxRead` | auto | Extract text per slide |
| `PptxEdit` | ask | Find/replace across all slides |

### Plan Mode

Two-phase workflow: Plan (read-only tools only) then Execute (full toolset unlocked). Sequential gating prevents skipping steps. Enter with `/plan` or model calls `EnterPlanMode`.

### Hooks

Shell commands triggered on agent lifecycle events:

| Event | Env Vars Available |
|---|---|
| `pre_tool_use` | `THCLAWS_TOOL_NAME`, `THCLAWS_TOOL_INPUT` |
| `post_tool_use` | `THCLAWS_TOOL_NAME`, `THCLAWS_TOOL_OUTPUT` |
| `post_tool_use_failure` | `THCLAWS_TOOL_NAME`, `THCLAWS_TOOL_ERROR` |
| `permission_denied` | `THCLAWS_TOOL_NAME` |
| `session_start` | `THCLAWS_SESSION_ID`, `THCLAWS_MODEL` |
| `session_end` | `THCLAWS_SESSION_ID`, `THCLAWS_MODEL` |
| `pre_compact` | -- |
| `post_compact` | -- |

Configured in `settings.json` under `"hooks"`.

---

## Configuration

### Settings Precedence (highest wins)

1. CLI flags
2. `.thclaws/settings.json` (project, commit to git)
3. `~/.config/thclaws/settings.json` (user-global)
4. `~/.claude/settings.json` (Claude Code fallback)
5. Compiled-in defaults

### Key Settings Fields

```json
{
  "model": "claude-sonnet-4-6",
  "permissions": "ask",                     // "ask" | "auto" | { "allow": [...], "deny": [...] }
  "allowedTools": ["Read", "Glob", "Grep", "Write", "Edit", "Bash"],
  "disallowedTools": ["WebFetch"],
  "maxIterations": 200,
  "teamEnabled": false,
  "kms": { "active": ["notes", "team-playbook"] },
  "hooks": {
    "post_tool_use": "echo done >> /tmp/thclaws.log"
  }
}
```

### API Key Storage

- **OS keychain** (recommended): macOS Keychain / Windows Credential Manager / Linux Secret Service. Single bundled entry per account.
- **`.env` file** (headless/CI): `~/.config/thclaws/.env` (user-scope) or `./.env` (project-scope).

Env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `AGENTIC_PRESS_LLM_API_KEY`, `DASHSCOPE_API_KEY`, `DEEPSEEK_API_KEY`, `THAILLM_API_KEY`, `OLLAMA_BASE_URL`, `OPENAI_COMPAT_BASE_URL`, `OPENAI_COMPAT_API_KEY`.

### Project Directory Layout

```
.thclaws/
  settings.json       # All runtime config
  mcp.json            # MCP server config
  agents/             # Sub-agent definitions (*.md)
  skills/             # Installed skills
  commands/           # Legacy prompt-template slash commands
  plugins/            # Installed plugin bundles
  plugins.json        # Plugin registry
  prompt/             # Prompt overrides
  sessions/           # Session history (JSONL)
  memory/             # MEMORY.md + topic files
  kms/                # Project-scope knowledge bases
  rules/              # Extra *.md rules injected into system prompt
  AGENTS.md           # Project-level instructions
  team/               # Agent Teams runtime state
```

---

## CLI Commands & Flags

### Common Flags

```
    --cli                    Run CLI REPL instead of GUI
-p, --print                  Non-interactive: run prompt and exit
-m, --model MODEL            Override model (e.g. claude-sonnet-4-6, ap/gemma4-26b)
    --accept-all             Auto-approve every tool call (dangerous)
    --permission-mode MODE   auto | ask
    --max-iterations N       Max agent loop iterations (0=unlimited, default 200)
    --resume ID              Resume saved session ("last" for most recent)
    --system-prompt TEXT     Override system prompt entirely
    --allowed-tools LIST     Comma-separated tool allowlist
    --disallowed-tools LIST  Comma-separated tool denylist
    --verbose                Extra diagnostic output
```

### Slash Commands (in REPL / Chat / Terminal tab)

**Session & Model:**

| Command | Action |
|---|---|
| `/help` | List all commands |
| `/model [NAME]` | Show or switch model (validates first) |
| `/models` | List available models for current provider |
| `/models refresh` | Download model catalogue from thclaws.ai |
| `/provider [NAME]` | Show or switch provider |
| `/providers` | List all providers with default models |
| `/save` | Force-save session to disk |
| `/load ID\|NAME` | Load session by id or name |
| `/sessions` | List saved sessions |
| `/rename [NAME]` | Rename or clear session title |
| `/resume ID` | Resume session (CLI flag alternative) |
| `/clear` | Clear in-memory history (does not touch saved files) |
| `/history` | Print message count summary |
| `/compact` | Compact context (drop-oldest, write checkpoint) |
| `/fork` | Save current session, summarize with LLM, start new session seeded with summary |
| `/cwd` | Show working directory (sandbox root) |

**Memory & Context:**

| Command | Action |
|---|---|
| `/memory` | List memory entries |
| `/memory read NAME` | Print memory file contents |
| `/context` | Show context stats: messages, tokens, progress bar |

**Tools, Skills, Plugins, MCP:**

| Command | Action |
|---|---|
| `/skills` | List loaded skills |
| `/skill show NAME` | Show full SKILL.md |
| `/skill marketplace [--refresh]` | Browse marketplace catalog |
| `/skill search QUERY` | Search marketplace |
| `/skill install [--user] <name-or-url> [name]` | Install skill |
| `/mcp` | List active MCP servers and their tools |
| `/mcp add [--user] <name> <url>` | Register HTTP MCP server |
| `/mcp remove [--user] <name>` | Remove MCP server |
| `/mcp marketplace [--refresh]` | Browse MCP catalog |
| `/mcp install [--user] NAME` | Install MCP server from marketplace |
| `/mcp search QUERY` | Search MCP catalog |
| `/mcp info NAME` | Show MCP server details |
| `/plugin marketplace [--refresh]` | Browse plugin catalog |
| `/plugin install [--user] <url>` | Install plugin bundle |
| `/plugin remove [--user] <name>` | Uninstall plugin |
| `/plugin enable\|disable [--user] <name>` | Toggle plugin |
| `/plugins` | List installed plugins |

**Knowledge Bases:**

| Command | Action |
|---|---|
| `/kms` or `/kms list` | List all discovered KMS (`*` = active) |
| `/kms new [--project] NAME` | Create new KMS |
| `/kms use NAME` | Attach KMS to current project |
| `/kms off NAME` | Detach KMS |
| `/kms show NAME` | Print KMS index.md |

**Agent Behavior:**

| Command | Action |
|---|---|
| `/permissions MODE` | Switch `auto` / `ask` mid-session |
| `/thinking BUDGET` | Set extended-thinking budget (0=off, Anthropic only) |
| `/tasks` | Show task/todo list |
| `/config key=val` | Override config for this session |
| `/team` | Join tmux team session or show status |
| `/doctor` | Run diagnostics |
| `/usage` | Show token usage by provider/model |
| `/version` | Show version and commit SHA |
| `/quit` | Exit (aliases: `/exit`, `/q`) |

**Shell escape:** `! <command>` -- run directly in terminal, no tokens, no approval.

---

## Built-in Tools

| Tool | Approval | Summary |
|---|---|---|
| `Ls` | auto | List directory (non-recursive) |
| `Read` | auto | Read file (full or line range) |
| `Glob` | auto | Shell-glob pattern matching (respects .gitignore) |
| `Grep` | auto | Regex search across files (respects .gitignore) |
| `Write` | ask | Create or overwrite file |
| `Edit` | ask | Exact string replacement (fails if not unique) |
| `Bash` | ask | Run shell command (`/bin/sh -c`), 2-min timeout, 50KB output cap |
| `WebFetch` | ask | HTTP GET, convert to Markdown |
| `WebSearch` | ask | Web search (Tavily / Brave / DuckDuckGo) |
| `AskUserQuestion` | auto | Pause and ask user a question |
| `EnterPlanMode` | auto | Switch to plan-only mode |
| `ExitPlanMode` | auto | Return to normal mode |
| `TaskCreate` | auto | Add task/todo |
| `TaskUpdate` | auto | Update task status |
| `TaskGet` / `TaskList` | auto | Query tasks |
| `TodoWrite` | auto | Replace entire todo list |
| `Task` | ask | Spawn sub-agent |
| `KmsRead` | auto | Read KMS page (only when KMS active) |
| `KmsSearch` | auto | Grep across KMS pages |
| `PdfCreate/Read` | ask/auto | PDF creation and text extraction |
| `DocxCreate/Read/Edit` | ask/auto/ask | Word document operations |
| `XlsxCreate/Read/Edit` | ask/auto/ask | Excel operations |
| `PptxCreate/Read/Edit` | ask/auto/ask | PowerPoint operations |
| MCP tools (`server__tool`) | ask | All MCP tools require approval by default |

All file tools are sandboxed to the working directory. Symlinks escaping the sandbox are denied. `Write` can create intermediate directories (`mkdir -p` behavior).

---

## Permissions

Two modes:
- **`ask`** (default): Mutating tools prompt for approval; read-only tools run automatically.
- **`auto`**: All tools run without prompting. Use `--accept-all` or `/permissions auto`.

Fine-grained allow/deny lists in settings:

```json
{ "permissions": { "allow": ["Read", "Write", "Bash(*)"], "deny": ["WebFetch"] } }
```

`Bash(*)` allows all bash commands; `Bash(git *)` allows only git commands.

---

## Session Management

- Sessions stored as append-only JSONL in `.thclaws/sessions/<id>.jsonl`
- Auto-saved after every assistant turn
- Auto-compact at 80% of model context window (drop-oldest, writes checkpoint)
- `/fork` at 5MB: summarize history with LLM, start new session seeded with summary
- `/load <id-or-name>` to resume; sidebar click auto-switches provider/model to match session

---

## Provider Switching Behavior

| Switch | Behavior |
|---|---|
| Same family (e.g. sonnet to opus) | Continue same session |
| Cross-family (e.g. Anthropic to OpenAI) | Fork new session (history preserved) |
| `/provider <name>` | Always forks new session |

---

## File Discovery Paths

thClaws walks these paths in order (later entries override earlier):

1. `~/.claude/CLAUDE.md`, `~/.claude/AGENTS.md`
2. `~/.config/thclaws/AGENTS.md`, `~/.config/thclaws/CLAUDE.md`
3. Ancestor directories: `CLAUDE.md` and `AGENTS.md` walked up from cwd
4. `.claude/CLAUDE.md`, `.thclaws/CLAUDE.md`, `.thclaws/AGENTS.md`
5. `.claude/rules/*.md`, `.thclaws/rules/*.md`
6. `CLAUDE.local.md`, `AGENTS.local.md` (highest priority, typically gitignored)

---

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `THCLAWS_DISABLE_KEYCHAIN=1` | Skip OS keychain entirely |
| `THCLAWS_KEYCHAIN_TRACE=1` | Debug keychain calls |
| `THCLAWS_MCP_ALLOW_ALL=1` | Auto-approve MCP subprocess spawns (CI/headless only) |
| `TAVILY_API_KEY` | Use Tavily for WebSearch |
| `BRAVE_SEARCH_API_KEY` | Use Brave for WebSearch |

---

## Useful One-Liners

```sh
# One-shot commit message suggestion
git diff | thclaws -p "summarise this diff for a commit message"

# Interactive session in project directory
cd ~/projects/my-app && thclaws --cli

# Headless auto-approve (CI)
thclaws -p "run the test suite" --accept-all --permission-mode auto

# Resume last session
thclaws --cli --resume last

# Override model for a single run
thclaws -p "explain main.rs" --model openrouter/anthropic/claude-sonnet-4-6

# Shell escape in REPL (no tokens, no approval)
! git status
! ls src/
```
