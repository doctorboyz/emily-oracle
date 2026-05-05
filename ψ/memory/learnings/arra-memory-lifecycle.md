# Arra Oracle Memory Lifecycle

> How to use arra-oracle tools for knowledge management

## Available Tools (via MCP)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `arra_search` | Hybrid FTS5 + semantic search | "What did I learn about X?" |
| `arra_learn` | Store new knowledge | After discovering something worth remembering |
| `arra_supersede` | Mark old knowledge as outdated | When learning supersedes prior knowledge |
| `arra_handoff` | Create session handoff file | End of session summary for next session |
| `arra_trace` | Find related knowledge by source | "What else came from this file?" |
| `arra_concepts` | List all indexed concepts | "What topics are in my knowledge base?" |

## Search Modes

- **FTS5** (default): Fast keyword search, good for exact terms
- **vector**: Semantic search via bge-m3 embeddings, good for meaning/concept
- **hybrid**: Combines both — best for general queries

## Workflow

### Learning Something New
```
arra_learn({
  title: "descriptive title",
  content: "what you learned",
  concepts: ["concept1", "concept2"]
})
```
Creates a file in ψ/memory/learnings/ and indexes it.

### Knowledge Superseded
```
arra_supersede({
  targetId: "learning_ψ/memory/learnings/old-file_0",
  reason: "why the old knowledge is outdated",
  replacement: "learning_ψ/memory/learnings/new-file_0"  // optional
})
```
Old document stays in DB (Nothing is Deleted) but marked as superseded.

### Searching Knowledge
```
arra_search({
  query: "how does maw inbox work",
  mode: "hybrid",    // fts | vector | hybrid
  limit: 5
})
```

### Session Handoff
```
arra_handoff({
  summary: "what happened this session",
  nextSteps: "what to do next"
})
```

## Indexing Commands (CLI)

```bash
# Re-index all vault documents (FTS5 only)
cd ~/.local/share/arra-oracle-v2
ORACLE_REPO_ROOT=/path/to/oracle-repo bun run src/indexer/cli.ts

# Re-index with force (override >50% deletion protection)
ORACLE_FORCE_REINDEX=1 ORACLE_REPO_ROOT=/path/to/oracle-repo bun run src/indexer/cli.ts

# Generate vector embeddings (after FTS5 index)
bun run src/scripts/index-model.ts bge-m3
```

## Current Setup

- DB: `~/.arra-oracle-v2/oracle.db` (50 documents)
- Vectors: `~/.arra-oracle-v2/lancedb/oracle_knowledge_bge_m3/`
- Model: bge-m3 (Ollama)
- ORACLE_REPO_ROOT: emily-oracle (primary vault)
- PM learnings copied with `pm-` prefix

## Cross-Oracle Knowledge

Each document is tagged with `origin` to track its source oracle:
- `origin: emily` — Emily's own knowledge (21 docs)
- `origin: pm` — PM Oracle's knowledge, copied with `pm-` prefix (29 docs)

Search can be filtered by origin to scope results to a specific oracle's knowledge.

## Re-indexing After Changes

After adding new .md files to ψ/memory/:
1. Run `bun run src/indexer/cli.ts` (FTS5)
2. Run `bun run src/scripts/index-model.ts bge-m3` (vectors)

Or restart the MCP server — it auto-indexes on startup if configured.