# ai-server Architecture Analysis

> เรียนรู้เมื่อ: 2026-05-08
> แหล่งข้อมูล: `/Users/doctorboyz/ai-server`

---

## 1. โครงสร้าง Directory และปรัชญาการจัดองค์กร

```
ai-server/
├── docker-compose.yml       ← หัวใจของระบบ — นิยามทุก service, network, volume
├── .env                     ← Secrets + config (ไม่ commit)
├── .env.example             ← Template สำหรับ .env
├── .gitignore               ← ป้องกัน .env, docker-data/, backups/, IDE files
├── init-db.sh               ← PostgreSQL init script — สร้าง svix_db อัตโนมัติ
├── migrate.sh               ← Migration script (pgvector → postgres) — ใช้ครั้งเดียว
├── test_qdrant.py           ← Smoke test สำหรับ Qdrant — insert + query vectors
├── CLAUDE.md                ← Infra Oracle identity + กฎการทำงาน
├── INFRA_GUIDE.md           ← เอกสารอ้างอิง infrastructure ทั้งหมด (ภาษาไทย)
├── backups/                  ← Database backups (pg_dumpall)
├── docker-data/              ← Docker runtime data (empty, น่าจะใช้ named volumes แทน)
├── openkb-api/              ← Custom FastAPI service — Knowledge Base API
│   ├── Dockerfile           ← python:3.11-slim + poppler + openkb CLI + uvicorn
│   ├── entrypoint.sh        ← สร้าง config.yaml ถ้ายังไม่มี + start uvicorn
│   ├── requirements.txt    ← fastapi, uvicorn, pydantic, httpx, aiofiles
│   └── api/
│       ├── __init__.py      ← (empty)
│       ├── main.py          ← FastAPI app — CORS, routes, /health, /status
│       ├── config.py        ← Settings (pydantic-settings) — env vars → config
│       └── routers/
│           ├── __init__.py  ← (empty)
│           ├── documents.py ← /documents/upload, /documents/text
│           ├── query.py     ← /query/, /chat/, /chat/{session_id}
│           └── wiki.py      ← /wiki/, /wiki/{page_path:path}
├── ψ/
│   └── memory/
│       ├── identity/infra-oracle.md   ← ตัวตนของ Infra Oracle
│       └── knowledge/infrastructure-config.md  ← บันทึก config ทั้งหมด
└── .claude/
    └── settings.local.json  ← Permission สำหรับ grep .env
```

### ปรัชชญาการจัดองค์กร

**Monorepo infrastructure-as-code**: ทุกอย่างอยู่ใน repo เดียว — docker-compose.yml เป็น single source of truth สำหรับทุก service การแยกเป็น subfolder มีแค่ `openkb-api/` เท่านั้น เพราะเป็น custom service ที่ต้อง build เอง ที่เหลือเป็น off-the-shelf images ที่ไม่ต้องมีโค้ด

**Vault structure (ψ/)**: ใช้ ψ/ vault สำหรับเก็บ identity และ knowledge ของ Infra Oracle ตามหลัก "Nothing is Deleted" — append-only

**Secrets separation**: .env เก็บ secrets ทั้งหมด, .env.example เป็น template ไม่มีค่าจริง, .gitignore ป้องกันไม่ให้ commit .env

---

## 2. Entry Points — สตาร์ท, คอนฟิก, จัดการ

### การเริ่มระบบ

```bash
# เริ่มทุก service
docker compose up -d

# หยุดทุก service
docker compose down

# Restart service เดียว
docker compose restart svix
```

`docker compose up -d` จะ:
1. สร้าง `server-network` (external bridge) ถ้ายังไม่มี
2. สร้าง named volumes ถ้ายังไม่มี
3. Pull images ที่จำเป็น
4. Build `openkb-api` จาก `./openkb-api/Dockerfile`
5. เริ่ม containers ตาม `depends_on` order
6. รัน `init-db.sh` ใน postgres เมื่อครั้งแรก (สร้าง `svix_db`)

### การไหลของ Configuration

```
.env (secrets + config)
  │
  ├─→ docker-compose.yml (variable substitution: ${VAR})
  │     ├─→ container environment variables
  │     │     ├─→ postgres:  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
  │     │     ├─→ n8n:       N8N_HOST, N8N_PORT, N8N_PROTOCOL, WEBHOOK_URL,
  │     │     │              DB_POSTGRESDB_* (composed from postgres vars)
  │     │     ├─→ svix:      SVIX_DB_DSN (composed), SVIX_REDIS_DSN,
  │     │     │              SVIX_JWT_SECRET, SVIX_WH_API_KEYS
  │     │     ├─→ minio:     MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
  │     │     ├─→ tunnel:    TUNNEL_TOKEN
  │     │     ├─→ openkb-api: LLM_API_KEY, LLM_API_BASE, OPENKB_MODEL,
  │     │     │              OPENKB_LANGUAGE
  │     │     ├─→ open-webui: OPENAI_API_KEY, WEBUI_SECRET_KEY
  │     │     └─→ open-design: NODE_ENV, OD_BIND_HOST, OD_PORT, OD_ALLOWED_ORIGINS
  │     │
  │     └─→ port mapping (some with defaults via ${VAR:-default})
  │           ├─ MINIO_PORT:-9000, MINIO_CONSOLE_PORT:-9001
  │           ├─ N8N_PORT (no default, required)
  │           ├─ OPENKB_API_PORT:-8080
  │           ├─ UPTIME_KUMA_PORT:-3005
  │           ├─ OPEN_WEBUI_PORT:-3006
  │           └─ OPEN_DESIGN_PORT:-7456
  │
  └─→ openkb-api/entrypoint.sh
        └─→ /app/kb/.openkb/config.yaml (generated from OPENKB_MODEL, OPENKB_LANGUAGE)
```

### init-db.sh

รันตอน PostgreSQL container เริ่มครั้งแรก (ผ่าน `/docker-entrypoint-initdb.d/`):
- สร้าง database `svix_db`
- Grant privileges ให้ `POSTGRES_USER`

### migrate.sh

Migration script สำหรับย้ายจาก pgvector เป็น plain postgres:
1. Backup databases (pg_dumpall)
2. Stop containers (docker compose down)
3. ลบ volume เก่า (ai-server_db_data)
4. ตรวจสอบ/สร้าง .env (generate random secrets ถ้ายังเป็นค่า default)
5. Start infrastructure ใหม่ (docker compose up -d)

---

## 3. Core Abstractions & Relationships

### Network Architecture

ทุก service อยู่ใน `server-network` เดียวกัน (Docker bridge network) — container names เป็น hostnames ได้เลย:

```
server-network (Docker bridge)
  ├── postgres       → resolvable as "postgres"
  ├── redis          → resolvable as "redis"
  ├── qdrant         → resolvable as "qdrant"
  ├── minio          → resolvable as "minio"
  ├── n8n            → resolvable as "n8n"
  ├── svix           → resolvable as "svix"
  ├── openkb-api     → resolvable as "openkb-api"
  ├── uptime-kuma    → resolvable as "uptime-kuma"
  ├── open-webui     → resolvable as "open-webui"
  ├── open-design    → resolvable as "open-design"
  └── tunnel         → resolvable as "tunnel"
```

### Volume Architecture

ทุก persistent data ใช้ named Docker volumes (ไม่ใช้ bind mounts):

```yaml
volumes:
  postgres_data:     → /var/lib/postgresql/data     (postgres)
  qdrant_data:       → /qdrant/storage               (qdrant)
  n8n_data:          → /home/node/.n8n               (n8n)
  redis_data:         → /data                          (redis)
  open_webui_data:   → /app/backend/data              (open-webui)
  minio_data:        → /data                           (minio)
  uptime_kuma_data:  → /app/data                      (uptime-kuma)
  openkb_data:       → /app/kb                        (openkb-api)
  open_design_data:  → /app/.od                        (open-design)
```

พิเศษ: postgres มี bind mount เพิ่ม `./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh`

### Inter-Service Communication

```
                    ┌─────────────┐
                    │   internet   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   tunnel     │  Cloudflare Tunnel
                    │ (cloudflared)│  auto.doctorboyz.com
                    └──────┬──────┘  webhook.doctorboyz.com
                           │         design.doctorboyz.com
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
       │     n8n     │ │  svix  │ │open-design│
       │  (5678)    │ │(8071)  │ │  (7456)   │
       └──────┬──────┘ └───┬────┘ └───────────┘
              │            │
              │     ┌──────▼──────┐
              │     │   redis     │
              │     │   (6379)   │  svix queue/retry
              │     └─────────────┘
              │
       ┌──────▼──────┐
       │  postgres    │
       │  (5432)     │  n8n_db, svix_db
       └──────────────┘

  ┌──────────────────────────────────────────┐
  │       Standalone Services (no deps)       │
  │                                          │
  │  qdrant (6333)  ← vector DB (arra-oracle)│
  │  minio (9000)   ← S3 storage             │
  │  openkb-api(8080)← KB + LLM chat         │
  │  uptime-kuma(3005)← monitoring            │
  │  open-webui(3006)← AI chat UI             │
  └──────────────────────────────────────────┘
```

---

## 4. Dependencies — แต่ละ service ขึ้นกับอะไร

### Service Dependency Table

| Service | Image Source | depends_on | External Deps | Data Store |
|---------|-------------|------------|--------------|------------|
| **postgres** | postgres:16-alpine | — | — | postgres_data volume |
| **redis** | redis:7-alpine | — | — | redis_data volume |
| **qdrant** | qdrant/qdrant:latest | — | — | qdrant_data volume |
| **minio** | minio/minio:latest | — | — | minio_data volume |
| **n8n** | docker.n8n.io/n8nio/n8n | postgres (healthy) | — | n8n_data + postgres (n8n_db) |
| **svix** | svix/svix-server:latest | postgres (healthy), redis (healthy) | — | postgres (svix_db) + redis |
| **openkb-api** | custom build | — | host.docker.internal:11434 (Ollama) | openkb_data volume |
| **uptime-kuma** | louislam/uptime-kuma:latest | — | — | uptime_kuma_data volume |
| **open-webui** | ghcr.io/open-webui/open-webui:main | — | OPENAI_API_KEY (external) | open_webui_data volume |
| **open-design** | docker.io/vanjayak/open-design:latest | — | — | open_design_data volume |
| **tunnel** | cloudflare/cloudflared:latest | — | Cloudflare account | — |

### Dependency Chain

```
postgres ─────┬──→ n8n
              │
              └──→ svix ──→ redis
                      
(ทุก service อื่น standalone — ไม่มี depends_on)
```

---

## 5. Service Dependency Graph

```
                    internet
                       │
                       ▼
               ┌─── tunnel ───┐
               │              │
               ▼              ▼
         ┌─ n8n ──┐    ┌─ svix ──┐
         │        │    │         │
         ▼        │    ▼         │
    ┌─ postgres ──┘  ┌─ redis ──┘
    │                   │
    └───────────────────┘

    Standalone (no runtime deps):
    ┌─────────────────────────────────┐
    │  qdrant    minio    openkb-api  │
    │  uptime-kuma   open-webui       │
    │  open-design                     │
    └─────────────────────────────────┘

    openkb-api ──→ Ollama (host.docker.internal:11434)
    open-webui ──→ OpenAI API (external)
```

### Health Checks

| Service | Health Check | Interval |
|---------|-------------|----------|
| **postgres** | `pg_isready -U admin` | 5s / 5s timeout / 5 retries |
| **redis** | `redis-cli ping` | 5s / 5s timeout / 5 retries |
| **open-design** | `GET /api/health` → status 0 | 30s / 5s timeout / 3 retries / 20s start |

---

## 6. Configuration Flow — .env ไหลเข้า container อย่างไร

### Direct Variable Passing

ตัวแปรส่วนใหญ่ผ่านตรงจาก `.env` → `docker-compose.yml` environment → container:

```
.env
  POSTGRES_USER=admin
      ↓
docker-compose.yml
  environment:
    - POSTGRES_USER=${POSTGRES_USER}
      ↓
postgres container
  POSTGRES_USER=admin
```

### Composed Variables

บางตัวแปรถูก compose จากหลายค่า:

**n8n database connection:**
```yaml
# docker-compose.yml
- DB_POSTGRESDB_DATABASE=${POSTGRES_DB}        # ใช้ POSTGRES_DB ตรงๆ
- DB_POSTGRESDB_HOST=postgres                    # hardcoded container name
- DB_POSTGRESDB_PORT=5432                       # hardcoded
- DB_POSTGRESDB_USER=${POSTGRES_USER}           # ใช้ POSTGRES_USER
- DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}    # ใช้ POSTGRES_PASSWORD
```

**svix database connection:**
```yaml
- SVIX_DB_DSN=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${SVIX_DB}
# รวม user, password, host, port, database เป็น connection string เดียว
```

**svix redis connection:**
```yaml
- SVIX_REDIS_DSN=redis://redis:6379
# hardcoded — ไม่ผ่าน .env
```

### Default Values

บาง port มี default ผ่าน shell parameter expansion:

```yaml
- "${MINIO_PORT:-9000}:9000"           # default 9000
- "${MINIO_CONSOLE_PORT:-9001}:9001"   # default 9001
- "${OPENKB_API_PORT:-8080}:8080"      # default 8080
- "${UPTIME_KUMA_PORT:-3005}:3001"     # default 3005
- "${OPEN_WEBUI_PORT:-3006}:8080"      # default 3006
- "${OPEN_DESIGN_PORT:-7456}:7456"     # default 7456
- "${N8N_PORT}:5678"                   # NO default — required
```

### OpenKB API Config Flow

```
.env
  LLM_API_KEY=${LLM_API_KEY:-ollama}
  LLM_API_BASE=${LLM_API_BASE:-http://host.docker.internal:11434}
  OPENKB_MODEL=${OPENKB_MODEL:-ollama/qwen3:8b}
  OPENKB_LANGUAGE=${OPENKB_LANGUAGE:-th}
      ↓
docker-compose.yml environment
      ↓
openkb-api/api/config.py (pydantic-settings)
  Settings(llm_api_key, llm_api_base, openkb_model, openkb_language, kb_dir, api_port)
      ↓
openkb-api/entrypoint.sh
  → สร้าง /app/kb/.openkb/config.yaml จาก OPENKB_MODEL, OPENKB_LANGUAGE
      ↓
uvicorn api.main:app --host 0.0.0.0 --port 8080
```

---

## 7. Security Model

### Network Isolation

**External network**: `server-network` เป็น Docker bridge ที่ประกาศเป็น `external: true` — หมายความว่ามันถูกสร้างไว้ก่อนหน้า (อาจจะมาจาก stack อื่นหรือสร้างด้วย `docker network create`) แล้ว ai-server เข้ามาใช้

**Inter-service communication**: ทุก container อยู่ใน network เดียวกัน → container-to-container สื่อสารได้โดยตรง (postgres:5432, redis:6379, ฯลฯ)

### Port Binding — การเปิด port สู่ภายนอก

| Service | Host Binding | ความหมาย |
|---------|-------------|-----------|
| postgres | `5432:5432` | เปิดทุก interface (0.0.0.0) — **ควรจำกัดเป็น 127.0.0.1** |
| redis | `6379:6379` | เปิดทุก interface — **ควรจำกัดเป็น 127.0.0.1** |
| qdrant | `6333:6333`, `6334:6334` | เปิดทุก interface — **ควรจำกัดเป็น 127.0.0.1** |
| minio | `9000:9000`, `9001:9001` | เปิดทุก interface — **ควรจำกัดเป็น 127.0.0.1** |
| n8n | `${N8N_PORT}:5678` | ผ่าน Cloudflare Tunnel — **ควรจำกัดเป็น 127.0.0.1** |
| svix | `8071:8071` | เปิดทุก interface — ผ่าน tunnel |
| openkb-api | `${OPENKB_API_PORT:-8080}:8080` | เปิดทุก interface |
| uptime-kuma | `${UPTIME_KUMA_PORT:-3005}:3001` | เปิดทุก interface |
| open-webui | `${OPEN_WEBUI_PORT:-3006}:8080` | เปิดทุก interface |
| **open-design** | **`127.0.0.1:${OPEN_DESIGN_PORT:-7456}:7456`** | **จำกัด localhost เท่านั้น — ถูกต้อง** |

**สิ่งที่ควรปรับปรุง**: open-design เป็น service เดียวที่จำกัด binding เป็น `127.0.0.1` — service อื่นๆ ผูกกับ `0.0.0.0` ทั้งหมด ถ้าเครื่องนี้มี public IP หรืออยู่ใน network ที่ไม่น่าเชื่อถือ ควรเปลี่ยนทุก port เป็น `127.0.0.1:PORT:PORT`

### Secrets Management

- ทุก secret อยู่ใน `.env` (git-ignored)
- `.env.example` เป็น template ที่มีค่า placeholder เท่านั้น
- `migrate.sh` สามารถ generate random secrets อัตโนมัติ (openssl rand)
- `.claude/settings.local.json` มี permission สำหรับ grep .env (อ่านได้แต่ไม่แสดง)

### open-design Hardening

open-design เป็น service ที่มี security constraints เยอะที่สุด:

```yaml
read_only: true                    # Filesystem read-only
tmpfs:
  - /tmp                           # Writable tmp only
security_opt:
  - no-new-privileges:true          # ไม่ให้ escalate privileges
mem_limit: ${OPEN_DESIGN_MEM_LIMIT:-384m}  # จำกัด memory
pids_limit: 256                     # จำกัด process count
ports:
  - "127.0.0.1:${OPEN_DESIGN_PORT:-7456}:7456"  # Localhost only
```

### host.docker.internal

3 services ใช้ `extra_hosts: host.docker.internal:host-gateway`:
- **n8n** — สำหรับเรียก service บน host (เช่น Ollama)
- **openkb-api** — สำหรับเรียก Ollama ที่ `http://host.docker.internal:11434`
- **open-webui** — สำหรับเรียก LLM API บน host

---

## 8. openkb-api — วิเคราะห์เชิงลึก

### โครงสร้าง

```
openkb-api/
├── Dockerfile           ← Multi-stage? ไม่ — single stage python:3.11-slim
├── entrypoint.sh        ← Init config + start uvicorn
├── requirements.txt     ← 7 packages
└── api/
    ├── __init__.py      ← (empty)
    ├── main.py          ← FastAPI app + CORS + routes
    ├── config.py        ← pydantic-settings config
    └── routers/
        ├── __init__.py  ← (empty)
        ├── documents.py  ← Document upload + text ingestion
        ├── query.py     ← One-shot query + multi-turn chat
        └── wiki.py      ← Wiki page listing + reading
```

### Dockerfile Analysis

```dockerfile
FROM python:3.11-slim
# ติดตั้ง poppler-utils สำหรับ PDF → text conversion
# ติดตั้ง openkb CLI (pip install openkb)
# ติดตั้ง API dependencies (requirements.txt)
# คัดลอก api/ code + entrypoint.sh
# สร้าง /app/kb/{raw,wiki,.openkb} directories
EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]
```

**สิ่งที่น่าสนใจ**:
- ติดตั้ง `poppler-utils` สำหรับแปลง PDF → text (pdftotext)
- ติดตั้ง `openkb` CLI ผ่าน pip — ใช้ `openkb add` และ `openkb query` commands
- ไม่มี multi-stage build — image ค่อนข้างใหญ่
- ไม่มี `.dockerignore` — อาจ copy ไฟล์ที่ไม่จำเป็น

### Entrypoint Flow

```bash
1. ตรวจสอบว่า /app/kb/.openkb/config.yaml มีอยู่แล้วหรือยัง
2. ถ้ายัง → สร้าง config.yaml จาก env vars (OPENKB_MODEL, OPENKB_LANGUAGE)
3. สร้าง directories: raw/, wiki/, .openkb/
4. เริ่ม uvicorn: PYTHONPATH=/app exec uvicorn api.main:app --host 0.0.0.0 --port 8080
```

### API Endpoints

#### Documents Router (`/documents`)

| Method | Endpoint | หน้าที่ | Implementation |
|--------|----------|---------|----------------|
| POST | `/documents/upload` | อัปโหลดไฟล์เข้า KB | รับไฟล์ → save ไป `/app/kb/raw/` → background task เรียก `openkb add` |
| POST | `/documents/text` | เพิ่มข้อความเข้า KB | รับ text + title → save เป็น `.md` → background task เรียก `openkb add` |

**การทำงาน**: Documents ทั้งสอง endpoint ใช้ FastAPI BackgroundTasks — return ทันที แล้วประมวลผลเบื้องหลังด้วย `openkb add`

**ข้อควรระวัง**:
- ไม่มี authentication — ใครก็ตามที่เข้าถึง port 8080 ได้ สามารถ upload ไฟล์ได้
- ไม่มี file size limit
- ไม่มี file type validation — อัปโหลดอะไรก็ได้

#### Query Router (`/query`)

| Method | Endpoint | หน้าที่ | Implementation |
|--------|----------|---------|----------------|
| POST | `/query/` | ถามคำถาม one-shot | subprocess: `openkb query <question>` |
| POST | `/chat/` | แชท multi-turn | HTTP call ไป Ollama API (`/v1/chat/completions`) |
| GET | `/chat/{session_id}` | ดูประวัติแชท | อ่านจาก in-memory dict |
| DELETE | `/chat/{session_id}` | ลบเซสชันแชท | ลบจาก in-memory dict |

**สองระบบ LLM ที่แตกต่าง**:
1. **Query (one-shot)**: ใช้ `openkb query` CLI → subprocess → ใช้ KB context
2. **Chat (multi-turn)**: ใช้ Ollama API โดยตรง → httpx async → ไม่ใช้ KB context

**ข้อควรระวัง**:
- Chat sessions เก็บใน memory (`chat_sessions: dict`) → หายเมื่อ restart container
- ไม่มี session cleanup mechanism → memory leak เป็นไปได้ถ้ามี session เยอะ
- ไม่มี authentication
- ไม่มี rate limiting

#### Wiki Router (`/wiki`)

| Method | Endpoint | หน้าที่ | Implementation |
|--------|----------|---------|----------------|
| GET | `/wiki/` | ลิสต์ wiki pages ทั้งหมด | os.walk `/app/kb/wiki/` → หาไฟล์ .md ทั้งหมด |
| GET | `/wiki/{page_path:path}` | อ่าน wiki page เฉพาะ | อ่านไฟล์จาก `/app/kb/wiki/<path>` |

**Path traversal protection**: มี `_safe_path()` function ที่ตรวจสอบว่า path จริงอยู่ใน wiki directory หรือไม่ — ป้องกัน `../../etc/passwd` attacks

### Config System (pydantic-settings)

```python
class Settings(BaseSettings):
    llm_api_key: str = "ollama"                           # LLM_API_KEY
    llm_api_base: str = "http://host.docker.internal:11434"  # LLM_API_BASE
    openkb_model: str = "ollama/qwen3:8b"                 # OPENKB_MODEL
    openkb_language: str = "th"                            # OPENKB_LANGUAGE
    kb_dir: str = "/app/kb"                               # KB_DIR
    api_port: int = 8080                                   # API_PORT

    @property
    def ollama_model(self) -> str:
        return self.openkb_model.replace("ollama/", "")
        # ถ้า openkb_model = "ollama/qwen3:8b" → ollama_model = "qwen3:8b"
```

**สิ่งที่น่าสนใจ**: `api_port` config มีอยู่แต่ไม่ถูกใช้ — uvicorn port ถูก hardcode เป็น 8080 ใน entrypoint.sh

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # อนุญาตทุก origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**ความเสี่ยง**: CORS เปิดหมดทุก origin + credentials → ใครก็ตามสามารถเรียก API จาก browser ได้จากที่ไหนก็ได้

---

## สรุป Architecture

### จุดแข็ง

1. **Single docker-compose.yml** — ทุกอย่างนิยามในไฟล์เดียว ดูแลง่าย
2. **Named volumes** — ข้อมูลถาวรอยู่ใน Docker volumes ไม่สูญหายเมื่อ rebuild
3. **Health checks** — postgres, redis, open-design มี health checks ทำให้ depends_on ทำงานถูกต้อง
4. **init-db.sh** — สร้าง database เพิ่มอัตโนมัติตอนเริ่มครั้งแรก
5. **open-design hardening** — read-only filesystem, no-new-privileges, memory/pids limit, localhost binding
6. **Cloudflare Tunnel** — ไม่ต้องเปิด port สู่ internet โดยตรง

### จุดที่ควรปรับปรุง

1. **Port binding ส่วนใหญ่เป็น 0.0.0.0** — postgres, redis, qdrant, minio ฯลฯ ควรจำกัดเป็น `127.0.0.1`
2. **openkb-api ไม่มี authentication** — ใครก็ตามที่เข้าถึง port 8080 ได้ สามารถ query, upload, chat ได้
3. **Chat sessions เก็บใน memory** — หายเมื่อ restart, ไม่มี cleanup, เสี่ยง memory leak
4. **CORS เปิดหมด** — `allow_origins=["*"]` + `allow_credentials=True` เป็น security risk
5. **ไม่มี .dockerignore** — build context อาจรวมไฟล์ที่ไม่จำเป็น
6. **api_port config ไม่ถูกใช้** — uvicorn port hardcode ใน entrypoint.sh ไม่ต่อเข้า Settings
7. **n8n port ไม่มี default** — `${N8N_PORT}` ไม่มี fallback → จะ fail ถ้าไม่ตั้งใน .env
8. **postgres password ใน .env เป็นค่าง่าย** — `88888888` เห็นใน .env จริง (ควรใช้ค่าที่แข็งแกร่งกว่า)
9. **svix DSN มี password embedded** — `SVIX_DB_DSN=postgresql://...:${POSTGRES_PASSWORD}@...` password ปรากฏใน process environment