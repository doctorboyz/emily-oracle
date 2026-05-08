# ai-server API & Integration Surface

> สำรวจเมื่อ 2026-05-08 — แหล่งข้อมูล: `/Users/doctorboyz/ai-server`

---

## 1. Public API Surface — HTTP Endpoints ที่เปิดออกสู่ภายนอก

### Cloudflare Tunnel Domains (public-facing)

| Domain | Internal Target | Service | หมายเหตุ |
|--------|----------------|---------|----------|
| `auto.doctorboyz.com` | `http://n8n:5678` | n8n | Webhook URL หลัก, automation UI |
| `webhook.doctorboyz.com` | `http://svix:8071` | Svix | Webhook infrastructure, event dispatch |
| `design.doctorboyz.com` | `http://open-design:7456` | open-design | Design tool UI + API |

### Host-exposed Ports (localhost เท่านั้น)

| Host:Port | Container:Port | Service | หมายเหตุ |
|-----------|---------------|---------|----------|
| `localhost:5432` | `postgres:5432` | PostgreSQL | เข้าถึงได้จาก host เพื่อ debug |
| `localhost:6379` | `redis:6379` | Redis | Cache + queue |
| `localhost:6333` | `qdrant:6333` | Qdrant HTTP | Vector DB dashboard: `/dashboard` |
| `localhost:6334` | `qdrant:6334` | Qdrant gRPC | Vector DB gRPC API |
| `localhost:9000` | `minio:9000` | MinIO API | S3-compatible API |
| `localhost:9001` | `minio:9001` | MinIO Console | Web UI สำหรับจัดการ buckets |
| `localhost:5678` | `n8n:5678` | n8n | Automation editor + webhooks |
| `localhost:8071` | `svix:8071` | Svix | Webhook management API |
| `localhost:8080` | `openkb-api:8080` | OpenKB API | Knowledge base API |
| `localhost:3005` | `uptime-kuma:3001` | Uptime Kuma | Monitoring dashboard |
| `localhost:3006` | `open-webui:8080` | Open WebUI | AI chat interface |
| `localhost:7456` | `open-design:7456` | open-design | ผูกกับ `127.0.0.1` เท่านั้น (ไม่เปิด 0.0.0.0) |

---

## 2. Internal Service APIs — การเชื่อมต่อระหว่าง Services

### Network Architecture

ทุก service อยู่ใน `server-network` (Docker bridge) — เรียกกันด้วย container name เป็น hostname ได้เลย

```
Oracle/External Client
    │
    ├──→ svix:8071          Webhook endpoint + event dispatch
    ├──→ openkb-api:8080    Knowledge base CRUD + chat
    ├──→ minio:9000         Object storage (S3-compatible)
    ├──→ qdrant:6333/6334   Vector search (HTTP + gRPC)
    ├──→ postgres:5432      Relational DB (n8n_db, svix_db)
    ├──→ n8n:5678           Workflow automation
    ├──→ redis:6379         Cache + queue (Svix backend)
    └──→ open-design:7456   Design tool API
```

### PostgreSQL Connections

| Service | Database | Connection String |
|---------|----------|-------------------|
| n8n | `n8n_db` | `postgresql://admin:${POSTGRES_PASSWORD}@postgres:5432/n8n_db` |
| Svix | `svix_db` | `postgresql://admin:${POSTGRES_PASSWORD}@postgres:5432/svix_db` |

`init-db.sh` สร้าง `svix_db` อัตโนมัติตอน PostgreSQL init ครั้งแรก

### Redis Connections

| Service | Usage |
|---------|-------|
| Svix | Queue/retry สำหรับ webhook delivery (`redis://redis:6379`) |

### Qdrant Connections

| Service | Port | Protocol |
|---------|------|----------|
| openkb-api (ผ่าน CLI) | 6333 | HTTP |
| arra-oracle (external) | 6333/6334 | HTTP + gRPC |

### MinIO Connections

| Client | Endpoint | Access |
|--------|----------|--------|
| Internal Docker | `http://minio:9000` | `minioadmin` / `${MINIO_ROOT_PASSWORD}` |
| Host localhost | `http://localhost:9000` | เดียวกัน |
| Console | `http://localhost:9001` | Web UI |

---

## 3. openkb-api Routes — FastAPI Router เต็ม

Base URL: `http://openkb-api:8080` (ภายใน Docker) / `http://localhost:8080` (host)

### Application Config

```python
# api/config.py — pydantic-settings
llm_api_key: str = "ollama"          # LLM_API_KEY
llm_api_base: str = "http://host.docker.internal:11434"  # LLM_API_BASE
openkb_model: str = "ollama/qwen3:8b" # OPENKB_MODEL
openkb_language: str = "th"            # OPENKB_LANGUAGE
kb_dir: str = "/app/kb"                # ไม่มี env var, hard-coded
api_port: int = 8080                   # ไม่มี env var
```

### CORS Policy

```python
allow_origins = ["*"]  # เปิดทุก origin — ใช้เฉพาะใน private network
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

### Router: Root (`/`)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/health` | `health()` | ตรวจสอบว่า KB initialized หรือยัง (`kb_initialized: bool`) |
| GET | `/status` | `status()` | สถิติ KB: model, language, จำนวน raw_files, จำนวน wiki_pages, รายชื่อไฟล์ |

Response examples:
```json
// GET /health
{"status": "ok", "kb_initialized": true}

// GET /status
{
  "model": "ollama/qwen3:8b",
  "language": "th",
  "raw_files": 3,
  "wiki_pages": 5,
  "raw_file_list": ["doc1.pdf", "doc2.md", "notes.txt"]
}
```

### Router: `/documents` — เพิ่มเอกสารเข้า KB

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| POST | `/documents/upload` | `multipart/form-data` — `file: UploadFile` | `{"status": "processing", "file": "...", "size": N}` | อัปโหลดไฟล์ (PDF, etc.) เข้า `/app/kb/raw/` แล้ว process แบบ background |
| POST | `/documents/text` | `{"text": "...", "title": "..."}` | `{"status": "processing", "title": "...", "filename": "..."}` | เพิ่มข้อความเป็น `.md` เข้า `/app/kb/raw/` แล้ว process แบบ background |

Processing logic: เรียก `openkb add <file_path>` ผ่าน subprocess, timeout 300 วินาที

### Router: `/query` — ถามคำถาม

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| POST | `/query/` | `{"question": "...", "save": false}` | `{"answer": "...", "question": "..."}` หรือ `{"answer": null, "error": "..."}` | One-shot query เรียก `openkb query` CLI, timeout 120 วินาที |

`save: true` = เพิ่ม `--save` flag ให้ openkb CLI (บันทึกผลลง wiki)

### Router: `/chat` — แชทกับ KB

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| POST | `/chat/` | `{"message": "...", "session_id": "default"}` | `{"answer": "...", "session_id": "..."}` | ส่งข้อความในแชท session, เรียก Ollama OpenAI-compatible API ตรง |
| GET | `/chat/{session_id}` | — | `{"session_id": "...", "messages": [...]}` | ดูประวัติแชทของ session |
| DELETE | `/chat/{session_id}` | — | `{"status": "deleted", "session_id": "..."}` | ลบ session |

Chat implementation: ใช้ `httpx.AsyncClient` เรียก `${LLM_API_BASE}/v1/chat/completions` ด้วย model `${ollama_model}`, ส่ง history ทั้งหมดของ session เป็น messages array

**สำคัญ**: chat sessions เก็บใน memory (`dict[str, list[dict]]`) — restart container = หายทั้งหมด

### Router: `/wiki` — อ่าน wiki pages

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| GET | `/wiki/` | — | `{"pages": [...], "total": N}` | รายการ wiki pages ทั้งหมดใน `/app/kb/wiki/` |
| GET | `/wiki/{page_path:path}` | — | `{"page": "...", "content": "..."}` | อ่าน wiki page เฉพาะ (path traversal protected) |

---

## 4. Cloudflare Tunnel Routes

Tunnel ทำงานด้วย `cloudflare/cloudflared:latest` ใช้ token-based authentication (`TUNNEL_TOKEN`)

### Route Mapping (ตั้งค่าใน Cloudflare Dashboard)

| Public Domain | Internal Service | Protocol |
|---------------|------------------|----------|
| `auto.doctorboyz.com` | `http://n8n:5678` | HTTPS |
| `webhook.doctorboyz.com` | `http://svix:8071` | HTTPS |
| `design.doctorboyz.com` | `http://open-design:7456` | HTTPS |

### เพิ่ม Route ใหม่

ขั้นตอน:
1. ไปที่ Cloudflare Dashboard → Zero Trust → Networks → Tunnels
2. เลือก tunnel → Public Hostname → Add hostname
3. ตั้ง domain, เลือก service + port
4. ไม่ต้อง restart tunnel — config อัปเดตอัตโนมัติ

---

## 5. Integration Patterns

### n8n → Svix (Webhook dispatch)

```
n8n workflow trigger
    → HTTP Request node
    → POST https://webhook.doctorboyz.com/api/v1/app/{app_id}/msg/
    → Svix dispatches to registered endpoints
    → Endpoint receives webhook with signature verification
```

### n8n → OpenKB API

```
n8n workflow
    → HTTP Request node
    → POST http://openkb-api:8080/documents/text
       {"text": "...", "title": "..."}
    → OpenKB processes and indexes
```

### OpenKB API → Ollama (LLM)

```
openkb-api chat endpoint
    → httpx.AsyncClient
    → POST http://host.docker.internal:11434/v1/chat/completions
    → {"model": "qwen3:8b", "messages": [...]}
    → Returns LLM response
```

### OpenKB API → openkb CLI (Indexing)

```
openkb-api documents endpoint
    → subprocess.run(["openkb", "add", file_path])
    → openkb CLI processes file, creates embeddings
    → Stored in /app/kb/wiki/ + /app/kb/.openkb/
```

### Svix Event Flow

```
1. Create Application:  POST /api/v1/app/ {"name": "oracle-webhook"}
2. Create Endpoint:     POST /api/v1/app/{app_id}/endpoint/ {"url": "...", "version": 1}
3. Send Event:          POST /api/v1/app/{app_id}/msg/ {"eventType": "...", "payload": {...}}
4. Svix delivers to all endpoints with retry + signature verification
5. Redis backs the queue for reliable delivery
```

---

## 6. Extension Points

### เพิ่ม Service ใหม่

1. เพิ่ม service definition ใน `docker-compose.yml`
2. เพิ่ม volume (ถ้าต้องการ persistent data) ใน `volumes:` section
3. เพิ่ม env vars ใน `.env` และ `.env.example`
4. ผูกเข้า `server-network`
5. เพิ่ม healthcheck ใน Uptime Kuma dashboard
6. ถ้าต้องการ public access: เพิ่ม Cloudflare Tunnel route

### เพิ่ม API Route ใหม่ใน openkb-api

1. สร้างไฟล์ใหม่ใน `openkb-api/api/routers/` (เช่น `analytics.py`)
2. สร้าง `APIRouter()` instance
3. เพิ่ม `app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])` ใน `main.py`
4. Rebuild: `docker compose build openkb-api && docker compose up -d openkb-api`

### เพิ่ม Database ใหม่

1. เพิ่ม `CREATE DATABASE` statement ใน `init-db.sh`
2. หรือสร้าง manual: `docker exec -it postgres psql -U admin -c "CREATE DATABASE new_db;"`
3. Grant: `GRANT ALL PRIVILEGES ON DATABASE new_db TO admin;`

### เพิ่ม Tunnel Route

ดูหัวข้อ 4 — เพิ่มผ่าน Cloudflare Dashboard, ไม่ต้อง restart

---

## 7. Environment Variable Interface

### Database & Auth

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `POSTGRES_USER` | `admin` | postgres, n8n, svix | PostgreSQL superuser |
| `POSTGRES_PASSWORD` | — | postgres, n8n, svix | **SECRET** — ตั้งใน `.env` |
| `POSTGRES_DB` | `n8n_db` | postgres, n8n | Default database ที่สร้างตอน init |
| `SVIX_DB` | `svix_db` | svix | สร้างโดย `init-db.sh` |
| `SVIX_JWT_SECRET` | — | svix | **SECRET** — ใช้ sign JWT tokens |
| `SVIX_WH_API_KEYS` | — | svix | **SECRET** — API key สำหรับ Svix management API |

### n8n

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `N8N_HOST` | `auto.doctorboyz.com` | n8n | Public hostname |
| `N8N_PORT` | `5678` | n8n | Container port (fixed) |
| `N8N_PROTOCOL` | `https` | n8n | Protocol สำหรับ webhook URL |
| `WEBHOOK_URL` | `https://auto.doctorboyz.com/` | n8n | Base URL สำหรับ webhooks |
| `GENERIC_TIMEZONE` | `Asia/Bangkok` | n8n | Timezone สำหรับ cron triggers |

### Cloudflare Tunnel

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `TUNNEL_TOKEN` | — | cloudflared | **SECRET** — JWT token จาก Cloudflare |

### MinIO

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `MINIO_ROOT_USER` | `minioadmin` | minio | Admin username |
| `MINIO_ROOT_PASSWORD` | — | minio | **SECRET** |
| `MINIO_PORT` | `9000` | minio | API port |
| `MINIO_CONSOLE_PORT` | `9001` | minio | Web console port |

### Monitoring

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `UPTIME_KUMA_PORT` | `3005` | uptime-kuma | Host port (container always 3001) |

### Open WebUI

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `OPEN_WEBUI_PORT` | `3006` | open-webui | Host port |
| `OPENAI_API_KEY` | — | open-webui | **SECRET** — OpenAI/compatible API key |
| `WEBUI_SECRET_KEY` | — | open-webui | **SECRET** — Session encryption |

### OpenKB API

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `OPENKB_API_PORT` | `8080` | openkb-api | Host port |
| `LLM_API_KEY` | `ollama` | openkb-api | API key สำหรับ LLM (ollama = no auth) |
| `LLM_API_BASE` | `http://host.docker.internal:11434` | openkb-api | Ollama/OpenAI-compatible endpoint |
| `OPENKB_MODEL` | `ollama/qwen3:8b` | openkb-api | Model name (strip `ollama/` prefix สำหรับ API calls) |
| `OPENKB_LANGUAGE` | `th` | openkb-api | KB language preference |

### Open Design

| Variable | Default | ใช้โดย | หมายเหตุ |
|----------|---------|--------|----------|
| `OPEN_DESIGN_PORT` | `7456` | open-design | Host port (bound to 127.0.0.1) |
| `OPEN_DESIGN_MEM_LIMIT` | `384m` | open-design | Docker memory limit |

---

## 8. Database Schemas

### PostgreSQL — `n8n_db` (จัดการโดย n8n อัตโนมัติ)

n8n สร้าง tables อัตโนมัติตอนเริ่มต้นครั้งแรก:

| Table | หน้าที่ |
|-------|---------|
| `execution_entity` | ประวัติ workflow executions |
| `execution_data` | Input/output data ของแต่ละ execution |
| `workflow_entity` | Workflow definitions (JSON) |
| `credentials_entity` | Encrypted credentials |
| `installed_nodes` | Custom installed nodes |
| `settings` | n8n instance settings |
| `role` / `user` / `global_role` | User management |
| `shared_workflow` / `shared_credentials` | Permission sharing |

### PostgreSQL — `svix_db` (จัดการโดย Svix อัตโนมัติ)

Svix สร้าง tables อัตโนมัติผ่าน migration:

| Table | หน้าที่ |
|-------|---------|
| `application` | Webhook applications |
| `endpoint` | Webhook endpoints (URLs + config) |
| `message` | Outgoing webhook messages/events |
| `message_attempt` | Delivery attempts + status |
| `event_type` | Event type definitions |

### Qdrant — Vector Collections

Qdrant ไม่มี pre-defined schema — collections สร้างเมื่อใช้:

| Collection (expected) | หน้าที่ |
|----------------------|---------|
| `arra-oracle` | Vector embeddings สำหรับ arra-oracle RAG |
| `test_collection` | สร้างโดย `test_qdrant.py` (test only) |

### Redis — Key Patterns

Redis ไม่มี fixed schema — ใช้โดย Svix สำหรับ:

| Pattern | หน้าที่ |
|---------|---------|
| `svix:queue:*` | Webhook delivery queue |
| `svix:retry:*` | Retry scheduling |

### MinIO — Expected Buckets

| Bucket (แนะนำ) | หน้าที่ |
|----------------|---------|
| `oracle-files` | ไฟล์ทั่วไป |
| `oracle-exports` | Export files |
| `webhook-logs` | Webhook delivery logs |

---

## 9. open-design Integration

### ใน Stack

open-design เป็น container ที่ใช้ image `docker.io/vanjayak/open-design:latest` — เป็น design tool ที่รันอยู่ภายใน Docker network

### API Surface

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/api/health` | `{"ok": true}` | Health check (ใช้ใน Docker healthcheck) |

### Configuration

```yaml
# docker-compose.yml
open-design:
  image: docker.io/vanjayak/open-design:latest
  ports:
    - "127.0.0.1:7456:7456"  # bound to localhost only
  environment:
    - NODE_ENV=production
    - NODE_OPTIONS=--max-old-space-size=192  # memory limit
    - OD_BIND_HOST=0.0.0.0
    - OD_PORT=7456
    - OD_WEB_PORT=7456
    - OD_ALLOWED_ORIGINS=https://design.doctorboyz.com,http://localhost:7456
  security_opt:
    - no-new-privileges:true
  mem_limit: 384m
  pids_limit: 256
  read_only: true
  tmpfs:
    - /tmp
```

### Security Hardening

- `read_only: true` — filesystem immutable
- `no-new-privileges:true` — ไม่ให้ escalate privileges
- `mem_limit: 384m` — จำกัด memory
- `pids_limit: 256` — จำกัด processes
- Bound to `127.0.0.1` — ไม่เปิดสู่ network ภายนอก (ผ่าน tunnel เท่านั้น)

### BYOK (Bring Your Own Key)

open-design เป็น open-source design tool — BYOK configuration ทำผ่าน UI ที่ `https://design.doctorboyz.com` ไม่มี env var สำหรับ API keys ของ design tool เอง

---

## 10. Security Boundary

### Public Exposure (ผ่าน Cloudflare Tunnel)

| Domain | Service | Auth Model | หมายเหตุ |
|--------|---------|------------|----------|
| `auto.doctorboyz.com` | n8n | n8n built-in auth (email/password) | มี login page, workflow editor |
| `webhook.doctorboyz.com` | Svix | API Key (`SVIX_WH_API_KEYS`) | Bearer token auth สำหรับ management API |
| `design.doctorboyz.com` | open-design | ไม่มี built-in auth | เปิดผ่าน tunnel เท่านั้น, ควรเพิ่ม auth |

### Internal-Only (ไม่เปิดสู่ internet โดยตรง)

| Port | Service | Auth Model | หมายเหตุ |
|------|---------|------------|----------|
| 5432 | PostgreSQL | Password (`POSTGRES_PASSWORD`) | เข้าถึงได้จาก localhost |
| 6379 | Redis | ไม่มี auth | เข้าถึงได้จาก localhost |
| 6333/6334 | Qdrant | ไม่มี auth | เข้าถึงได้จาก localhost |
| 9000/9001 | MinIO | Access Key + Secret Key | เข้าถึงได้จาก localhost |
| 8080 | openkb-api | ไม่มี auth | เข้าถึงได้จาก localhost, CORS เปิดหมด |
| 3005 | Uptime Kuma | ตั้งเองตอน setup ครั้งแรก | เข้าถึงได้จาก localhost |
| 3006 | Open WebUI | ตั้งเองตอน setup | เข้าถึงได้จาก localhost |

### Security Concerns

1. **openkb-api ไม่มี authentication** — ทุกคนใน network เดียวกันเรียกได้ทั้งหมด
2. **CORS เปิด `*`** — เหมาะสำหรับ private network เท่านั้น
3. **Redis ไม่มี password** — ต้องไม่เปิด port ออกสู่ internet
4. **Qdrant ไม่มี auth** — เช่นเดียวกัน
5. **open-design ไม่มี built-in auth** — พึ่ง Cloudflare Access หรือ network isolation
6. **PostgreSQL password ใน `.env`** — ไม่ commit, แต่ต้องเปลี่ยนจาก default
7. **Svix API key** — ใช้ Bearer token, ต้องเก็บเป็น secret
8. **Chat sessions ใน memory** — ไม่มี persistence, หายเมื่อ restart
9. **open-design bound to `127.0.0.1`** — ดีกว่า `0.0.0.0` แต่ยังต้องการ auth layer ผ่าน tunnel

### Recommendation: เพิ่ม Auth

- openkb-api: เพิ่ม API key middleware (FastAPI dependency)
- open-design: เพิ่ม Cloudflare Access policy หรือ reverse proxy auth
- Redis: เพิ่ม `requirepass` ใน redis config
- Qdrant: เปิด API key ใน production

---

*เอกสารนี้สร้างจากการสำรวจ source code ทั้งหมดใน `/Users/doctorboyz/ai-server` — docker-compose.yml, openkb-api source, .env.example, INFRA_GUIDE.md, init-db.sh, migrate.sh, test_qdrant.py*