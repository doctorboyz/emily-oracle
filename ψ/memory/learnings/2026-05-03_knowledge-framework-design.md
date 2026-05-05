# Oracle Ecosystem Knowledge Framework Design

> เอกสารอ้างอิง — ออกแบบจากการวิเคราะห์ 5 โปรเจกต์: MemPalace, Oracle Framework, SocratiCode, Graphify, OpenKB
> สร้าง: 2026-05-03 | อัปเดตล่าสุด: 2026-05-03

---

## 1. สรุปเปรียบเทียบ 5 โปรเจกต์

### 1.1 Architecture Matrix

| มิติ | MemPalace | Oracle Framework (arra) | SocratiCode | Graphify | OpenKB |
|------|-----------|--------------------------|-------------|----------|--------|
| **ประเภท** | AI Memory | AI Soul + Memory | Code Intelligence | Knowledge Graph | Knowledge Base |
| **Vector DB** | ChromaDB (384-dim) | LanceDB (1024-dim) | Qdrant (768-dim) | ไม่มี | ไม่มี |
| **Sparse/BM25** | มี (60%vec+40%Bm25) | FTS5 (SQLite) | มี (Qdrant native) | ไม่มี | ไม่มี |
| **Graph** | SQLite (flat triples) | trace chains (fields) | AST dependency graph | NetworkX (full) | ไม่มี |
| **Hybrid Search** | Vec+BM25+temporal | FTS5+Vec+10%boost | Vec+BM25+RRF | BFS/DFS traversal | Agent reads wiki |
| **Reranking** | LLM rerank (top-20) | ไม่มี | ไม่มี | ไม่มี | ไม่มี |
| **Chunking** | 800 char + 100 overlap | ตาม ## headers | AST-aware (3-tier) | AST (tree-sitter) | markitdown (flat) |
| **Metadata/Scope** | Wing/Room (metadata filter) | Project field | Branch-aware collections | ไม่มี | ไม่มี |
| **Incremental** | มี (append-only) | มี (supersession) | มี (hash checkpoint) | มี (SHA256 cache) | Hash dedup เท่านั้น |
| **LLM ตอน Write** | ไม่ใช้ (zero-LLM) | ไม่ใช้ | ไม่ใช้ (embed only) | ใช้ (semantic extraction) | ใช้ (compile wiki) |
| **Protocol** | MCP (29 tools) | MCP (22 tools) + HTTP | MCP (21 tools) | MCP + HTTP | CLI only |
| **License** | MIT | BUSL-1.1 | AGPL-3.0 | MIT | Apache 2.0 |

### 1.2 จุดเด่นเฉพาะของแต่ละโปรเจกต์

**MemPalace** — Verbatim-first, zero-LLM write path, AAAK compression, 4-layer memory stack (L0-L3), wake-up cost ~170 tokens. ข้อดี: เก็บต้นฉบับ ไม่สูญเสียข้อมูล. ข้อเสีย: AAAK regression, flat graph, scale degradation

**Oracle Framework (arra)** — Supersession ไม่ใช่ deletion, trace chains, project-aware indexing, multi-model embedding (bge-m3/nomic/qwen3), shared soul architecture. ข้อดี: ปรัชญา "Nothing is Deleted" อยู่ใน data model. ข้อเสีย: no graph DB, no reranking, BUSL license

**SocratiCode** — AST-aware 3-tier chunking, hybrid search + RRF, resumable checkpointing (ทุก 50 ไฟล์), branch-aware, cross-project search. ข้อดี: ดีที่สุดสำหรับ code intelligence. ข้อเสีย: Docker required, embedding lock-in, AGPL license

**Graphify** — Confidence-tagged edges (EXTRACTED/INFERRED/AMBIGUOUS), Leiden community detection, god nodes, surprising connections, multi-format export. ข้อดี: graph ที่ audit ได้. ข้อเสีย: no vector search, file-based (no DB), 71.5x token claim unsubstantiated

**OpenKB** — "Compile once, query many", wikilinks + backlinks, PageIndex for long PDFs, Obsidian compatible. ข้อดี: wiki ที่มนุษย์อ่านได้. ข้อเสีย: no DB, no metadata, no hybrid search, no incremental re-compile

---

## 2. สิ่งที่เรามีอยู่แล้ว (Current State)

```
Oracle Ecosystem Infrastructure
│
├── Qdrant (ai-server)
│   └── Dense vectors only (arra-oracle)
│   └── ไม่มี BM25/sparse
│   └── ไม่มี hybrid search + RRF
│
├── PostgreSQL (ai-server)
│   └── n8n_db, svix_db
│   └── ไม่มี FTS5
│   └── ไม่มี knowledge schema
│
├── Graphify (emily-oracle + global skill)
│   └── tree-sitter AST extraction
│   └── NetworkX graph + Leiden communities
│   └── Confidence-tagged edges
│   └── แต่: read-only report, ไม่ traverse ได้
│
├── OpenKB API (ai-server)
│   └── FastAPI wrapper
│   └── Wiki compilation via LLM
│   └── แต่: no metadata, no scope, no hybrid search
│
├── ψ/ Brain Structure (emily-oracle)
│   └── memory/learnings/
│   └── memory/retrospectives/
│   └── Append-only
│   └── ไม่ได้เชื่อมกับ retrieval pipeline
│
└── /rrr Skill
    └── Writes learnings + retros
    └── arra sync (manual)
    └── ไม่ push ไป OpenKB
```

---

## 3. สถาปัตยกรรมที่เหมาะสม: Hybrid Multi-Layer

จากการวิเคราะห์ — ไม่มีโปรเจกต์ไหนดีพอเดี่ยวๆ แต่ละอันมีจุดเด่นที่ต่างกัน เลยต้องผสม:

### 3.1 3 ชั้นหลัก

```
┌─────────────────────────────────────────────────────────────┐
│                    RETRIEVE LAYER                             │
│                                                               │
│  Query enters                                                 │
│      │                                                        │
│      ├──→ Hybrid Search (Qdrant dense + BM25 sparse)         │
│      │        └──→ RRF fusion                                 │
│      │                                                        │
│      ├──→ Graph Traversal (Graphify NetworkX)                 │
│      │        └──→ BFS/DFS + god nodes                        │
│      │                                                        │
│      └──→ LLM Rerank (top candidates)                        │
│               └──→ qwen3:8b via Ollama                       │
│                                                               │
│  Results merged → context window → LLM answer                │
├─────────────────────────────────────────────────────────────┤
│                    STORAGE LAYER                              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Qdrant       │  │ PostgreSQL   │  │ File-based   │       │
│  │ Dense+Sparse │  │ FTS5 + Meta  │  │ Append-only  │       │
│  │ (SocratiCode │  │ (Oracle      │  │ (MemPalace   │       │
│  │  pattern)    │  │  Framework)  │  │  + OpenKB)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐                                            │
│  │ Graphify     │  Knowledge Graph (traversable)             │
│  │ NetworkX    │  Confidence-tagged edges                    │
│  └──────────────┘                                            │
├─────────────────────────────────────────────────────────────┤
│                    INGEST LAYER                               │
│                                                               │
│  Sources:                                                     │
│  ├── Hook → auto-push learnings (MemPalace pattern)          │
│  ├── /rrr → scoped push (Oracle Framework pattern)          │
│  ├── /kb-push → curated push                                 │
│  └── graphify watch → AST incremental (Graphify pattern)     │
│                                                               │
│  Processing:                                                  │
│  ├── AST chunking (SocratiCode pattern) for code             │
│  ├── Header chunking (Oracle Framework pattern) for docs     │
│  ├── Hash dedup + checkpoint (SocratiCode + OpenKB)         │
│  └── Scope tagging (MemPalace wing/room pattern)            │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 เปรียบเทียบ: สิ่งที่เราจะสร้าง vs สิ่งที่มีอยู่แล้ว

| ส่วน | จะใช้จากโปรเจกต์ไหน | สิ่งที่มีอยู่แล้ว | ต้องสร้างเพิ่ม |
|------|----------------------|-------------------|-----------------|
| **Dense Vector** | arra-oracle (LanceDB/Qdrant) | Qdrant อยู่แล้ว | — |
| **BM25 Sparse** | SocratiCode | Qdrant รองรับ sparse | Enable + add sparse vectors |
| **FTS5** | Oracle Framework | PostgreSQL อยู่แล้ว | Add FTS5 + knowledge schema |
| **Hybrid Search + RRF** | SocratiCode | — | Implement RRF fusion |
| **Graph** | Graphify | graphify-out/ อยู่แล้ว | Make traversable via API |
| **Scope/Metadata** | MemPalace (wing/room) | — | Add scope field + filter |
| **Verbatim Storage** | MemPalace + OpenKB | ψ/ อยู่แล้ว | Connect to retrieval |
| **AST Chunking** | SocratiCode + Graphify | graphify tree-sitter | Use for code ingest |
| **Checkpointing** | SocratiCode | — | Implement batch checkpoint |
| **LLM Rerank** | MemPalace | — | Implement with qwen3:8b |
| **Wiki Output** | OpenKB | openkb-api อยู่แล้ว | Add scope support |
| **Supersession** | Oracle Framework | — | Implement supersede logic |
| **Incremental** | Graphify + SocratiCode | graphify watch (บางส่วน) | Extend to all ingest paths |
| **MCP Protocol** | ทุกโปรเจกต์ใช้ | — | Build unified MCP server |

### 3.3 4-Layer Memory Stack (จาก MemPalace)

| Layer | เนื้อหา | ขนาด | เมื่อไหร่ที่โหลด |
|-------|---------|------|-----------------|
| **L0: Identity** | ฉันคือใคร, principles, golden rules | ~50 tok | ทุก session |
| **L1: Essential** | ความรู้สำคัญ AAAK compressed | ~120 tok | ทุก session |
| **L2: On-Demand** | ความรู้เฉพาะ project/scope | ~200-500/scope | เมื่อถามเรื่องนั้น |
| **L3: Deep Search** | Full hybrid search + graph traversal | ไม่จำกัด | เมื่อต้องการคำตอบลึก |

L0+L1 = ~170 tokens wake-up cost (เท่า MemPalace)

---

## 4. Ingest Pipeline: 3 ช่องทาง

### 4.1 Hook Channel (Auto — จาก MemPalace)

```
Write to ψ/memory/learnings/
    │
    └──→ PostToolUse Hook
         │
         ├── Extract text + auto-detect scope
         ├── Hash dedup (OpenKB pattern)
         └── POST openkb-api/documents/text?scope={project}
              │
              └──→ OpenKB compiles wiki (background)
```

- ไม่ต้อง LLM ตอน write (MemPalace zero-LLM pattern)
- Scope auto-detect จาก file path (MemPalace wing pattern)
- Hash dedup ป้องกันซ้ำ (OpenKB pattern)

### 4.2 /rrr Channel (Semi-auto — จาก Oracle Framework)

```
/rrr runs
    │
    ├── Write retro → ψ/memory/retrospectives/
    ├── Write lesson → ψ/memory/learnings/
    │
    └── NEW: Push to knowledge pipeline
         │
         ├── Index to Qdrant (dense + sparse vectors)
         ├── Index to PostgreSQL FTS5 (keyword search)
         ├── Push to OpenKB (wiki compilation)
         ├── Update Graphify graph (if code changed)
         └── arra_learn (existing)
```

- Scope = ชื่อ project ที่รัน /rrr อยู่ (Oracle Framework project field pattern)
- ทุก step มี checkpoint (SocratiCode pattern)

### 4.3 /kb-push Channel (Manual — Curated)

```
/kb-push --scope emily-oracle
    │
    ├── Read file or accept text
    ├── Choose scope (shared / project)
    ├── Generate sparse + dense vectors
    ├── Index to Qdrant + PostgreSQL FTS5
    ├── Push to OpenKB
    └── Confirm + log
```

- คุณภาพสูงสุด — มนุษย์คัดเลือก
- เหมาะสำหรับ: design decisions, architecture docs, important patterns

---

## 5. Retrieve Pipeline: 3 ขั้น

### 5.1 Hybrid Search (จาก SocratiCode + MemPalace)

```python
def hybrid_search(query, scope=None, limit=10):
    # Step 1: Parallel search
    dense_results = qdrant.search_dense(query_vector, limit=20, scope=scope)
    sparse_results = qdrant.search_bm25(query_terms, limit=20, scope=scope)
    fts_results = postgres_fts5.search(query, limit=20, scope=scope)

    # Step 2: RRF Fusion (SocratiCode pattern)
    fused = reciprocal_rank_fusion(
        [dense_results, sparse_results, fts_results],
        weights=[0.4, 0.3, 0.3]  # dense > sparse > fts
    )

    return fused[:limit]
```

### 5.2 Graph Traversal (จาก Graphify)

```python
def graph_query(query, depth=3):
    # Step 1: Find entry node via term overlap
    entry_nodes = graphify.find_nodes(query)

    # Step 2: BFS traversal (Graphify pattern)
    context = graphify.bfs(entry_nodes, depth=depth)

    # Step 3: Filter by confidence (Graphify pattern)
    context = [e for e in context if e.confidence >= 0.4]

    # Step 4: Include god nodes (Graphify pattern)
    gods = graphify.god_nodes(limit=5)

    return context + gods
```

### 5.3 LLM Rerank (จาก MemPalace)

```python
def rerank(query, candidates, model="ollama/qwen3:8b"):
    # Step 1: Hybrid search + graph results combined
    top_k = candidates[:20]  # top-20 from hybrid

    # Step 2: LLM scores each candidate (MemPalace pattern)
    scored = llm_rerank(query, top_k, model)

    # Step 3: Return top-N
    return scored[:5]
```

---

## 6. Scope & Metadata Design (จาก MemPalace wing/room)

### 6.1 Scope Hierarchy

```
Global (shared)
├── docker-patterns          ← ทุก project ใช้
├── oracle-principles         ← ทุก oracle ใช้
└── security-best-practices  ← ทุก project ใช้

Project (scoped)
├── emily-oracle
│   ├── principles
│   ├── architecture
│   └── session-learnings
├── ai-server
│   ├── infra-config
│   └── service-patterns
└── mt5-trading
    └── strategy-patterns
```

### 6.2 Metadata Schema (PostgreSQL)

```sql
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    content_hash TEXT NOT NULL,        -- SHA-256 dedup (OpenKB)
    scope TEXT NOT NULL,               -- 'shared' or project name (MemPalace wing)
    doc_type TEXT NOT NULL,            -- 'learning', 'retro', 'pattern', 'architecture'
    source_file TEXT,                  -- original file path (Oracle Framework)
    concepts JSONB,                    -- extracted concepts (Oracle Framework)
    superseded_by UUID,                -- supersession chain (Oracle Framework)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE knowledge_vectors (
    id UUID PRIMARY KEY REFERENCES knowledge_documents(id),
    qdrant_id TEXT NOT NULL,           -- reference to Qdrant point
    embedding_model TEXT NOT NULL,     -- 'bge-m3', 'nomic', etc.
    dimensions INTEGER NOT NULL
);

-- FTS5 virtual table for keyword search
CREATE VIRTUAL TABLE knowledge_fts USING fts5(
    title, content, scope, doc_type,
    content='knowledge_documents',
    content_rowid='id'
);
```

### 6.3 Qdrant Collection Schema (จาก SocratiCode)

```python
# Per-scope collections (SocratiCode branch-aware pattern)
collection_name = f"knowledge_{scope}"

# Point structure:
{
    "id": uuid,
    "vector": {
        "dense": [768 floats],      # nomic-embed-text or bge-m3
        "sparse": {"indices": [...], "values": [...]}  # BM25
    },
    "payload": {
        "title": "...",
        "scope": "emily-oracle",
        "doc_type": "learning",
        "source_file": "ψ/memory/learnings/...",
        "concepts": ["docker", "infrastructure"],
        "content_hash": "abc123...",
        "created_at": "2026-05-03T..."
    }
}
```

---

## 7. ลำดับการสร้าง (Implementation Priority)

### Phase 1: Foundation (ทำก่อน)
1. Add BM25 sparse vectors ใน Qdrant (SocratiCode pattern)
2. Add knowledge schema ใน PostgreSQL (Oracle Framework pattern)
3. Implement scope/metadata ใน openkb-api (MemPalace pattern)
4. Create hook-push.sh + hook config

### Phase 2: Retrieval
5. Implement hybrid search + RRF (SocratiCode pattern)
6. Make Graphify graph traversable via API
7. Implement LLM rerank with qwen3:8b (MemPalace pattern)

### Phase 3: Integration
8. Enhance /rrr ให้ push to knowledge pipeline
9. Create /kb-push skill
10. Build unified MCP server (ทุกโปรเจกต์ใช้ MCP)
11. Implement 4-layer memory stack (MemPalace pattern)

### Phase 4: Advanced
12. Supersession logic (Oracle Framework pattern)
13. Cross-project search (SocratiCode pattern)
14. AST chunking for code ingest (SocratiCode + Graphify)
15. Live watch + incremental (Graphify + SocratiCode pattern)

---

## 8. Key Decisions ที่ต้องตัดสินใจ

| # | คำถาม | ทางเลือก | ข้อควรพิจารณา |
|---|-------|---------|---------------|
| 1 | Embedding model | bge-m3 vs nomic-embed-text | bge-m3: 1024-dim, multilingual. nomic: 768-dim, เร็วกว่า. arra ใช้ bge-m3 อยู่แล้ว |
| 2 | Qdrant vs LanceDB | Qdrant (มีแล้ว) vs LanceDB (arra default) | Qdrant: รองรับ BM25 sparse, production-grade. LanceDB: local, embeddable |
| 3 | Graph storage | NetworkX files (Graphify) vs Neo4j vs SQLite triples | NetworkX: มีแล้ว, ไม่ต้อง install. Neo4j: traverse ดีแต่ heavy. SQLite: กลางๆ |
| 4 | MCP vs REST | MCP only vs REST only vs ทั้งสอง | MCP: Claude-specific. REST: ทั่วไป. ทั้งสอง: ยืดหยุ่นที่สุด |
| 5 | LLM for compilation | qwen3:8b vs cloud model | qwen3:8b: local, ฟรี, แต่ quality ต่ำกว่า. Cloud: ดีกว่าแต่เสียเงิน |
| 6 | Knowledge schema | SQLite (arra) vs PostgreSQL (มีแล้ว) | PostgreSQL: มีแล้ว, FTS5 รองรับ. SQLite: embeddable แต่เพิ่ม complexity |

---

## 9. เปรียบเทียบ Cost ของแต่ละทางเลือก

### Option A: ใช้ arra-oracle-v3 เป็น core
- ข้อดี: มี schema, MCP, hybrid search, supersession พร้อม
- ข้อเสีย: BUSL license, ต้อง Bun runtime, ต้อง sync กับ Qdrant ของเรา
- ความพยายาม: กลาง — ต้อง adapt แต่ไม่ต้องเขียนใหม่

### Option B: สร้างเองจาก components ที่มี
- ข้อดี: ควบคุมได้หมด, ใช้ Qdrant + PostgreSQL ที่มีอยู่
- ข้อเสีย: ต้องเขียน MCP server, ingest pipeline, RRF fusion เอง
- ความพยายาม: สูง — แต่ได้ custom-fit พอดี

### Option C: Hybrid — ใช้ arra เป็น MCP + custom pipeline
- ข้อดี: arra จัดการ retrieval เราจัดการ storage + ingest
- ข้อเสีย: ต้อง sync 2 ระบบ
- ความพยายาม: กลาง-สูง

---

## 10. References

- MemPalace: https://github.com/MemPalace/mempalace
- Oracle Framework: https://github.com/Soul-Brews-Studio/oracle-framework
- SocratiCode: https://github.com/giancarloerra/SocratiCode
- Graphify: https://github.com/safishamsi/graphify
- OpenKB: https://github.com/VectifyAI/OpenKB