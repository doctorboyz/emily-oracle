# ai-server — Code Snippets Collection

> เก็บรวบรวมโค้ดสำคัญจาก ai-server repo ทั้งหมด
> วันที่เก็บ: 2026-05-08

---

## 1. Main Entry Point — docker-compose.yml

โครงสร้างหลักของทั้ง stack มี 10 services บน Docker network เดียวกัน (`server-network` — external)

```yaml
networks:
  server-network:
    external: true

volumes:
  postgres_data:
  qdrant_data:
  n8n_data:
  redis_data:
  open_webui_data:
  minio_data:
  uptime_kuma_data:
  openkb_data:
  open_design_data:

services:
  # ─── Data Layer ───────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    networks:
      - server-network
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    networks:
      - server-network
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334

  # ─── Storage ─────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: minio
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "${MINIO_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # ─── Automation ──────────────────────────────
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "${N8N_PORT}:5678"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=${N8N_PROTOCOL}
      - NODE_ENV=production
      - WEBHOOK_URL=${WEBHOOK_URL}
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

  # ─── Webhook Infrastructure ──────────────────
  svix:
    image: svix/svix-server:latest
    container_name: svix
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "8071:8071"
    environment:
      - SVIX_DB_DSN=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${SVIX_DB}
      - SVIX_REDIS_DSN=redis://redis:6379
      - SVIX_JWT_SECRET=${SVIX_JWT_SECRET}
      - SVIX_WH_API_KEYS=${SVIX_WH_API_KEYS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ─── Knowledge Base ──────────────────────────
  openkb-api:
    build:
      context: ./openkb-api
      dockerfile: Dockerfile
    container_name: openkb-api
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "${OPENKB_API_PORT:-8080}:8080"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - LLM_API_KEY=${LLM_API_KEY:-ollama}
      - LLM_API_BASE=${LLM_API_BASE:-http://host.docker.internal:11434}
      - OPENKB_MODEL=${OPENKB_MODEL:-ollama/qwen3:8b}
      - OPENKB_LANGUAGE=${OPENKB_LANGUAGE:-th}
    volumes:
      - openkb_data:/app/kb

  # ─── Monitoring ──────────────────────────────
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "${UPTIME_KUMA_PORT:-3005}:3001"
    volumes:
      - uptime_kuma_data:/app/data

  # ─── External Access ─────────────────────────
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: tunnel
    restart: unless-stopped
    networks:
      - server-network
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}

  # ─── AI ──────────────────────────────────────
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "${OPEN_WEBUI_PORT:-3006}:8080"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY}
    volumes:
      - open_webui_data:/app/backend/data

  # ─── Design Tool ──────────────────────────────
  open-design:
    image: docker.io/vanjayak/open-design:latest
    container_name: open-design
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "127.0.0.1:${OPEN_DESIGN_PORT:-7456}:7456"
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=192
      - OD_BIND_HOST=0.0.0.0
      - OD_PORT=7456
      - OD_WEB_PORT=7456
      - OD_ALLOWED_ORIGINS=https://design.doctorboyz.com,http://localhost:7456
    volumes:
      - open_design_data:/app/.od
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    mem_limit: ${OPEN_DESIGN_MEM_LIMIT:-384m}
    pids_limit: 256
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:7456/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
```

### สิ่งที่น่าสนใจใน docker-compose.yml

1. **External network** — `server-network` เป็น external หมายถึงต้องสร้างด้วยมือก่อน (`docker network create server-network`)
2. **Health checks** — postgres, redis, open-design มี health check; svix และ n8n ใช้ `depends_on` + `condition: service_healthy` เพื่อรอ postgres/redis พร้อมก่อน
3. **host.docker.internal** — n8n, openkb-api, open-webui ใช้ `extra_hosts` เพื่อเข้าถึง host (เช่น Ollama บนเครื่อง host)
4. **Security hardening** — open-design ใช้ `read_only: true`, `security_opt: no-new-privileges:true`, `mem_limit`, `pids_limit` และ bind `127.0.0.1` เท่านั้น (ไม่ expose สู่ internet โดยตรง)
5. **Svix DSN pattern** — ใช้ `postgresql://user:pass@postgres:5432/db` แบบ inline ใน env var แทน separate host/port/user/password
6. **Default values** — openkb-api มี defaults: `ollama/qwen3:8b` model, `th` language, port `8080`

---

## 2. openkb-api Source Code — Python FastAPI App

### config.py — การตั้งค่าด้วย pydantic-settings

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_api_key: str = "ollama"
    llm_api_base: str = "http://host.docker.internal:11434"
    openkb_model: str = "ollama/qwen3:8b"
    openkb_language: str = "th"
    kb_dir: str = "/app/kb"
    api_port: int = 8080

    @property
    def ollama_model(self) -> str:
        """Strip 'ollama/' prefix for Ollama API calls."""
        return self.openkb_model.replace("ollama/", "")

    class Config:
        env_prefix = ""


settings = Settings()
```

**สิ่งที่น่าสนใจ:**
- `env_prefix = ""` หมายถึง env var ตรงกับชื่อ attribute เลย (เช่น `LLM_API_KEY`, `OPENKB_MODEL`)
- `ollama_model` เป็น property ที่ strip prefix `ollama/` ออก — เพราะ openkb CLI ใช้ชื่อเต็มแต่ Ollama API ต้องการแค่ชื่อ model
- `kb_dir` เป็น path ใน container ไม่ใช่ host

### main.py — FastAPI app หลัก

```python
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.routers import documents, query, wiki

app = FastAPI(
    title="OpenKB API",
    description="REST API for OpenKB knowledge base management",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(query.chat_router, prefix="/chat", tags=["chat"])
app.include_router(wiki.router, prefix="/wiki", tags=["wiki"])


@app.get("/health")
async def health():
    kb_exists = os.path.exists(os.path.join(settings.kb_dir, ".openkb", "config.yaml"))
    return {"status": "ok", "kb_initialized": kb_exists}


@app.get("/status")
async def status():
    raw_dir = os.path.join(settings.kb_dir, "raw")
    wiki_dir = os.path.join(settings.kb_dir, "wiki")

    raw_files = []
    wiki_pages = []

    if os.path.exists(raw_dir):
        raw_files = [f for f in os.listdir(raw_dir) if not f.startswith(".")]

    if os.path.exists(wiki_dir):
        for root, dirs, files in os.walk(wiki_dir):
            for f in files:
                if f.endswith(".md"):
                    rel_path = os.path.relpath(os.path.join(root, f), wiki_dir)
                    wiki_pages.append(rel_path)

    return {
        "model": settings.openkb_model,
        "language": settings.openkb_language,
        "raw_files": len(raw_files),
        "wiki_pages": len(wiki_pages),
        "raw_file_list": raw_files,
    }
```

**สิ่งที่น่าสนใจ:**
- CORS เปิดหมด (`allow_origins=["*"]`) — เหมาะสำหรับ dev/internal แต่ต้องล็อคสำหรับ production
- `/health` เช็คว่า KB ถูก init แล้วหรือยัง (ดู `.openkb/config.yaml`)
- `/status` นับจำนวน raw files และ wiki pages แบบ synchronous — ใช้ได้เพราะไฟล์ไม่เยอะ
- query module export 2 routers: `router` (one-shot query) และ `chat_router` (multi-turn chat)

### routers/documents.py — อัปโหลดเอกสารเข้า KB

```python
import os
import subprocess
import uuid

import aiofiles
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from pydantic import BaseModel

from api.config import settings

router = APIRouter()


class TextDocument(BaseModel):
    text: str
    title: str | None = None


def process_document(file_path: str) -> dict:
    """Run openkb add on a file and return the result."""
    try:
        result = subprocess.run(
            ["openkb", "add", file_path],
            cwd=settings.kb_dir,
            timeout=300,
            capture_output=True,
            text=True,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Processing timed out (300s)"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload a file to the knowledge base."""
    raw_dir = os.path.join(settings.kb_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    safe_filename = file.filename or "untitled"
    file_path = os.path.join(raw_dir, safe_filename)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    background_tasks.add_task(process_document, file_path)

    return {
        "status": "processing",
        "file": safe_filename,
        "size": len(content),
        "message": f"File '{safe_filename}' queued for processing",
    }


@router.post("/text")
async def add_text(
    payload: TextDocument,
    background_tasks: BackgroundTasks,
):
    """Add text content directly to the knowledge base."""
    raw_dir = os.path.join(settings.kb_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    title = payload.title or f"text-{uuid.uuid4().hex[:8]}"
    filename = f"{title}.md"
    file_path = os.path.join(raw_dir, filename)

    async with aiofiles.open(file_path, "w") as f:
        await f.write(payload.text)

    background_tasks.add_task(process_document, file_path)

    return {
        "status": "processing",
        "title": title,
        "filename": filename,
        "message": f"Text document '{title}' queued for processing",
    }
```

**สิ่งที่น่าสนใจ:**
- ใช้ `BackgroundTasks` ของ FastAPI — อัปโหลดเสร็จ return เลย แล้ว process เบื้องหลัง
- `process_document` เรียก `openkb add` CLI ผ่าน subprocess — pattern ง่ายๆ ที่ไม่ต้องเขียน Python binding
- timeout 300 วินาที (5 นาที) สำหรับ document processing
- สร้างไฟล์ลง `/app/kb/raw/` ก่อน แล้วค่อยให้ openkb ingest
- `safe_filename` ใช้ชื่อไฟล์ตรงจาก upload — มีโอกาส path traversal ถ้าไม่ sanitize ดีพอ (แต่เป็น internal API)

### routers/query.py — ถามตอบ + แชทกับ KB

```python
import subprocess
import uuid
from collections import defaultdict

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.config import settings

router = APIRouter()
chat_router = APIRouter()

# In-memory chat sessions: session_id -> list of messages
chat_sessions: dict[str, list[dict]] = {}


class QueryRequest(BaseModel):
    question: str
    save: bool = False


class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"


@router.post("/")
async def query_kb(req: QueryRequest):
    """Ask a one-shot question to the knowledge base."""
    cmd = ["openkb", "query", req.question]
    if req.save:
        cmd.append("--save")

    try:
        result = subprocess.run(
            cmd,
            cwd=settings.kb_dir,
            timeout=120,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return {
                "answer": None,
                "error": result.stderr.strip() or "Query failed",
                "returncode": result.returncode,
            }
        return {"answer": result.stdout.strip(), "question": req.question}
    except subprocess.TimeoutExpired:
        return {"answer": None, "error": "Query timed out (120s)"}
    except Exception as e:
        return {"answer": None, "error": str(e)}


@chat_router.post("/")
async def chat(req: ChatMessage):
    """Send a message in a chat session. Uses Ollama for LLM calls."""
    session_id = req.session_id

    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    history = chat_sessions[session_id]

    # Build messages for Ollama OpenAI-compatible API
    messages = []
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.llm_api_base}/v1/chat/completions",
                json={
                    "model": settings.ollama_model,
                    "messages": messages,
                    "stream": False,
                },
                headers={"Content-Type": "application/json"},
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"LLM call failed: {response.status_code} {response.text}",
            )

        data = response.json()
        answer = data["choices"][0]["message"]["content"]

        # Save to history
        chat_sessions[session_id].append(
            {"role": "user", "content": req.message}
        )
        chat_sessions[session_id].append(
            {"role": "assistant", "content": answer}
        )

        return {"answer": answer, "session_id": session_id}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM call timed out (120s)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@chat_router.get("/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session."""
    if session_id not in chat_sessions:
        return {"session_id": session_id, "messages": []}
    return {
        "session_id": session_id,
        "messages": chat_sessions[session_id],
    }


@chat_router.delete("/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session."""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return {"status": "deleted", "session_id": session_id}
```

**สิ่งที่น่าสนใจ:**
- **Two routers ในไฟล์เดียว** — `router` สำหรับ one-shot query, `chat_router` สำหรับ multi-turn chat
- **Query** เรียก `openkb query` CLI (subprocess) — one-shot ไม่มี context
- **Chat** เรียก Ollama API โดยตรงผ่าน `httpx` (OpenAI-compatible API format) — multi-turn มี chat history
- **In-memory session** — `chat_sessions` เป็น dict ใน memory จะหายเมื่อ restart (ไม่ถาวร)
- **Two LLM interfaces** — query ใช้ openkb CLI (มี RAG ผ่าน vector search), chat ใช้ Ollama โดยตรง (ไม่มี RAG)
- `save: bool = False` ใน QueryRequest — บอกให้ openkb save query result
- `uuid` import แล้วไม่ใช้ในไฟล์นี้ (leftover)

### routers/wiki.py — อ่าน wiki pages จาก KB

```python
import os

import aiofiles
from fastapi import APIRouter, HTTPException

from api.config import settings

router = APIRouter()


def _wiki_dir() -> str:
    return os.path.join(settings.kb_dir, "wiki")


def _safe_path(page_path: str) -> str:
    """Prevent path traversal attacks."""
    wiki_dir = _wiki_dir()
    full_path = os.path.realpath(os.path.join(wiki_dir, page_path))
    if not full_path.startswith(os.path.realpath(wiki_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    return full_path


@router.get("/")
async def list_wiki_pages():
    """List all wiki pages in the knowledge base."""
    wiki_dir = _wiki_dir()
    if not os.path.exists(wiki_dir):
        return {"pages": []}

    pages = []
    for root, dirs, files in os.walk(wiki_dir):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if f.endswith(".md") and not f.startswith("."):
                rel_path = os.path.relpath(os.path.join(root, f), wiki_dir)
                pages.append(rel_path)

    return {"pages": sorted(pages), "total": len(pages)}


@router.get("/{page_path:path}")
async def read_wiki_page(page_path: str):
    """Read a specific wiki page."""
    file_path = _safe_path(page_path)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Page not found: {page_path}")

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail=f"Not a file: {page_path}")

    async with aiofiles.open(file_path, "r") as f:
        content = await f.read()

    return {"page": page_path, "content": content}
```

**สิ่งที่น่าสนใจ:**
- `_safe_path()` ป้องกัน path traversal — ตรวจ `os.path.realpath` แล้วเช็คว่าอยู่ใน wiki_dir หรือไม่
- `/{page_path:path}` — FastAPI path parameter แบบ catch-all รองรับ nested paths เช่น `/wiki/concepts/oracle.md`
- อ่านไฟล์แบบ async ด้วย `aiofiles`
- ข้าม hidden files/directories (ขึ้นต้นด้วย `.`)

---

## 3. Shell Scripts

### init-db.sh — สร้าง database เพิ่มเติมตอน PostgreSQL เริ่มต่ายใหม่

```bash
#!/bin/bash
set -e

# Create additional databases on first startup
# This script runs once when PostgreSQL initializes its data directory

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE DATABASE svix_db;
    GRANT ALL PRIVILEGES ON DATABASE svix_db TO $POSTGRES_USER;
EOSQL

echo "Database svix_db created successfully."
```

**สิ่งที่น่าสนใจ:**
- รันครั้งเดียวตอน PostgreSQL init (ผ่าน `/docker-entrypoint-initdb.d/`)
- สร้าง `svix_db` เพิ่มจาก default database
- `ON_ERROR_STOP=1` — ถ้า error จะหยุดทันที
- `n8n_db` สร้างผ่าน `POSTGRES_DB` env var แต่ `svix_db` ต้องสร้างด้วยสคริปต์เพราะไม่มี env var เฉพาะ

### migrate.sh — สคริปต์ย้ายจาก pgvector เป็น plain postgres + เพิ่ม services ใหม่

```bash
#!/bin/bash
# ─────────────────────────────────────────────────────────────
# ai-server Migration Script
# Switches from pgvector to plain postgres, adds new services
# ─────────────────────────────────────────────────────────────
set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║   ai-server Infrastructure Migration             ║"
echo "║   pgvector → postgres + Svix/Redis/MinIO/Kuma    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Backup current databases ────────────────────────
echo "📦 Step 1/5: Backing up current databases..."
mkdir -p ./backups

docker exec ai-db pg_dumpall -U admin > ./backups/pg_dumpall_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || {
    echo "⚠️  Could not dump databases (container may be stopped). Continuing..."
}

echo "✅ Backup saved to ./backups/"
echo ""

# ─── Step 2: Stop existing containers ────────────────────────
echo "🛑 Step 2/5: Stopping existing containers..."
docker compose down
echo "✅ Containers stopped"
echo ""

# ─── Step 3: Remove old postgres volume ───────────────────────
echo "🗑️  Step 3/5: Removing old pgvector volume..."
docker volume rm ai-server_db_data 2>/dev/null || {
    echo "⚠️  Volume already removed or doesn't exist. Continuing..."
}
echo "✅ Old volume removed"
echo ""

# ─── Step 4: Update .env file ────────────────────────────────
echo "⚙️  Step 4/5: Checking .env configuration..."

if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "❗  IMPORTANT: Edit .env with your actual values before starting!"
    echo "    Required: POSTGRES_PASSWORD, SVIX_JWT_SECRET, SVIX_WH_API_KEYS"
    echo "    Required: MINIO_ROOT_PASSWORD, TUNNEL_TOKEN"
    echo ""
    read -p "Press Enter after editing .env to continue, or Ctrl+C to abort..."
fi

# Generate random secrets if they're still default
if grep -q "change_me_to_a_random_secret_at_least_32_chars" .env 2>/dev/null; then
    echo "🔑 Generating random secrets for .env..."
    JWT_SECRET=$(openssl rand -hex 32)
    SVIX_API_KEY=$(openssl rand -hex 16)
    MINIO_PASSWORD=$(openssl rand -base64 24)

    sed -i.bak "s/change_me_to_a_random_secret_at_least_32_chars/$JWT_SECRET/" .env
    sed -i.bak "s/change_me_to_an_api_key_for_svix/$SVIX_API_KEY/" .env
    sed -i.bak "s/change_me_to_a_strong_minio_password/$MINIO_PASSWORD/" .env
    rm -f .env.bak
    echo "✅ Secrets generated and saved to .env"
fi

echo "✅ .env configured"
echo ""

# ─── Step 5: Start new infrastructure ────────────────────────
echo "🚀 Step 5/5: Starting new infrastructure..."
docker compose up -d

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Migration Complete!                            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Services starting:"
echo "  ├── postgres      → localhost:5432"
echo "  ├── redis        → localhost:6379"
echo "  ├── qdrant       → localhost:6333"
echo "  ├── minio        → localhost:9000 (API) / localhost:9001 (Console)"
echo "  ├── n8n          → localhost:5678"
echo "  ├── svix         → localhost:8071"
echo "  ├── openkb-api   → localhost:8080"
echo "  ├── uptime-kuma  → localhost:3005"
echo "  ├── tunnel       → Cloudflare Tunnel"
echo "  └── open-webui   → localhost:3006"
echo ""
echo "⏳ Wait ~30 seconds for all services to start, then verify:"
echo "   docker compose ps"
echo ""
echo "📋 Next steps:"
echo "   1. Open MinIO Console: http://localhost:9001"
echo "   2. Open Uptime Kuma: http://localhost:3005"
echo "   3. Test Svix API: curl http://localhost:8071/api/v1/app/"
echo "   4. Test OpenKB API: curl http://localhost:8080/health"
echo ""
echo "💾 Old database backup: ./backups/"
```

**สิ่งที่น่าสนใจ:**
- 5 ขั้นตอน: backup → stop → remove old volume → configure .env → start new
- Auto-generate secrets ด้วย `openssl rand` ถ้า .env ยังมี placeholder values
- ใช้ `sed -i.bak` แล้วลบ backup ทิ้ง — pattern สำหรับ in-place edit บน macOS/Linux
- ถ้า backup ไม่สำเร็จ (container ไม่ทำงาน) จะ warning แต่ไม่หยุด
- Step 3 ลบ volume เดิม (pgvector) — destructive แต่มี backup ก่อน

---

## 4. Docker Configurations — openkb-api

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps for file conversion
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install openkb CLI
RUN pip install --no-cache-dir openkb

# Install API dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api/ ./api/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Create KB directory structure
RUN mkdir -p /app/kb/raw /app/kb/wiki /app/kb/.openkb

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
```

**สิ่งที่น่าสนใจ:**
- `poppler-utils` — ติดตั้งเพื่อแปลง PDF (openkb ใช้ pdftotext)
- Layer ordering: system deps → openkb → requirements → app code — ให้ Docker cache ใช้ซ้ำได้ดี
- สร้าง directory structure ใน Dockerfile แล้ว แต่ mount volume ทับใน docker-compose (ทำให้มีข้อมูลถาวร)

### entrypoint.sh

```bash
#!/bin/bash
set -e

# Initialize openkb config if not exists
if [ ! -f /app/kb/.openkb/config.yaml ]; then
    mkdir -p /app/kb/.openkb
    cat > /app/kb/.openkb/config.yaml <<EOF
model: ${OPENKB_MODEL:-ollama/qwen3:8b}
language: ${OPENKB_LANGUAGE:-th}
pageindex_threshold: 20
EOF
    echo "OpenKB config created with model=${OPENKB_MODEL:-ollama/qwen3:8b}"
fi

# Ensure directories exist
mkdir -p /app/kb/raw /app/kb/wiki /app/kb/.openkb

# Start API server
cd /app
PYTHONPATH=/app exec uvicorn api.main:app --host 0.0.0.0 --port 8080
```

**สิ่งที่น่าสนใจ:**
- สร้าง openkb config อัตโนมัติถ้ายังไม่มี — pattern สำหรับ first-run init
- `exec` — แทนที่ shell process ด้วย uvicorn เพื่อให้ signal handling ทำงานถูกต้อง
- `PYTHONPATH=/app` — ทำให้ `from api.config import settings` ทำงานได้
- Volume mount ทับ `/app/kb` ดังนั้น config จะถูกสร้างครั้งเดียวแล้วคงอยู่

### requirements.txt

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
aiofiles>=23.2.0
httpx>=0.25.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
```

**การแมป library → การใช้:**

| Library | ใช้ที่ไหน |
|---------|-----------|
| fastapi | API framework หลัก |
| uvicorn[standard] | ASGI server + websockets |
| python-multipart | รับ file upload (`UploadFile`) |
| aiofiles | อ่าน/เขียนไฟล์แบบ async |
| httpx | เรียก Ollama API (chat endpoint) |
| pydantic | Data validation (`BaseModel`) |
| pydantic-settings | Environment variable config (`BaseSettings`) |

---

## 5. Configuration Patterns — .env → docker-compose mapping

### .env.example (template)

```bash
# ─── PostgreSQL ─────────────────────────────────
POSTGRES_USER=admin
POSTGRES_PASSWORD=change_me_to_a_strong_password
POSTGRES_DB=n8n_db

# ─── Svix (Webhook Infrastructure) ─────────────
SVIX_DB=svix_db
SVIX_JWT_SECRET=change_me_to_a_random_secret_at_least_32_chars
SVIX_WH_API_KEYS=change_me_to_an_api_key_for_svix

# ─── n8n (Automation) ──────────────────────────
N8N_HOST=auto.doctorboyz.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://auto.doctorboyz.com/
GENERIC_TIMEZONE=Asia/Bangkok

# ─── Cloudflare Tunnel ─────────────────────────
TUNNEL_TOKEN=your_cloudflare_tunnel_token_here

# ─── MinIO (S3 Storage) ────────────────────────
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change_me_to_a_strong_minio_password
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# ─── Uptime Kuma (Monitoring) ──────────────────
UPTIME_KUMA_PORT=3005

# ─── Open WebUI ────────────────────────────────
OPEN_WEBUI_PORT=3006
OPENAI_API_KEY=sk-...
WEBUI_SECRET_KEY=yoursecretkeyhere

# ─── OpenKB API (Knowledge Base) ──────────────
OPENKB_API_PORT=8080
LLM_API_KEY=ollama
LLM_API_BASE=http://host.docker.internal:11434
OPENKB_MODEL=ollama/qwen3:8b
OPENKB_LANGUAGE=th
```

### การแมป .env → services

```
POSTGRES_USER     → postgres (env), n8n (DB_POSTGRESDB_USER), svix (DSN)
POSTGRES_PASSWORD → postgres (env), n8n (DB_POSTGRESDB_PASSWORD), svix (DSN)
POSTGRES_DB       → postgres (env), n8n (DB_POSTGRESDB_DATABASE)
SVIX_DB           → svix (DSN ในบรรทัด postgresql://...)
SVIX_JWT_SECRET   → svix (auth)
SVIX_WH_API_KEYS  → svix (API keys)
N8N_*              → n8n (host, port, protocol, webhook, timezone)
TUNNEL_TOKEN       → tunnel (cloudflared auth)
MINIO_ROOT_*      → minio (credentials)
LLM_API_KEY        → openkb-api → config.py (llm_api_key)
LLM_API_BASE       → openkb-api → config.py (llm_api_base)
OPENKB_MODEL       → openkb-api → config.py (openkb_model)
OPENKB_LANGUAGE    → openkb-api → config.py (openkb_language)
OPEN_DESIGN_*      → open-design (hardcoded defaults, env override)
```

### Svix DSN pattern (inline connection string)

```yaml
# ใช้ env var แทนที่ใน connection string เดียว
SVIX_DB_DSN: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${SVIX_DB}
```

นี่คือ pattern ที่น่าสนใจ — Docker Compose แทนที่ `${VAR}` ใน env values ด้วยค่าจาก `.env` ทำให้ไม่ต้อง hardcode connection string

---

## 6. Interesting Patterns

### Health Checks

```
postgres:   pg_isready -U ${POSTGRES_USER}    (5s interval, 5s timeout, 5 retries)
redis:      redis-cli ping                     (5s interval, 5s timeout, 5 retries)
open-design: fetch /api/health via Node        (30s interval, 5s timeout, 3 retries, 20s start_period)
```

**สิ่งที่น่าสนใจ:**
- postgres และ redis ใช้ health check แบบง่าย ๆ (5s interval)
- open-design ใช้ Node.js `fetch()` แบบ inline ใน health check พร้อม `start_period: 20s` (รอ app เริ่มก่อนตรวจ)
- n8n, qdrant, minio, svix, openkb-api ไม่มี health check ใน docker-compose (อาจเพิ่มทีหลัง)

### Volume Strategy

```
Named volumes (Docker-managed):
  postgres_data → /var/lib/postgresql/data
  qdrant_data   → /qdrant/storage
  n8n_data      → /home/node/.n8n
  redis_data    → /data
  open_webui_data → /app/backend/data
  minio_data    → /data
  uptime_kuma_data → /app/data
  openkb_data   → /app/kb
  open_design_data → /app/.od

Bind mounts:
  ./init-db.sh → /docker-entrypoint-initdb.d/init-db.sh
```

**สิ่งที่น่าสนใจ:**
- ทุกอย่างใช้ named volumes ยกเว้น init script (bind mount)
- open-design ใช้ `read_only: true` พร้อม `tmpfs: /tmp` — hardening pattern
- ไม่มี host path bind mounts สำหรับ data — หมายถึงข้อมูลอยู่ใน Docker volume เท่านั้น

### Network Topology

```
server-network (external Docker bridge)
├── ทุก container อยู่ใน network เดียวกัน
├── เรียกกันด้วย container name (DNS auto)
└── host access ผ่าน host.docker.internal (n8n, openkb-api, open-webui)
```

**External access flow:**
```
Internet → Cloudflare → tunnel container → server-network → service
```

Cloudflare Tunnel เป็น reverse proxy เดียวที่ expose สู่ internet:
- `auto.doctorboyz.com` → n8n:5678
- `webhook.doctorboyz.com` → svix:8071
- `design.doctorboyz.com` → open-design:7456

### Security Hardening — open-design

```yaml
open-design:
  ports:
    - "127.0.0.1:${OPEN_DESIGN_PORT:-7456}:7456"  # bind localhost only
  read_only: true
  tmpfs:
    - /tmp
  security_opt:
    - no-new-privileges:true
  mem_limit: ${OPEN_DESIGN_MEM_LIMIT:-384m}
  pids_limit: 256
```

**การ harden:**
1. `127.0.0.1` bind — ไม่ expose port สู่ network ภายนอกโดยตรง
2. `read_only: true` — container ไม่สามารถเขียนไฟล์ได้ (ยกเว้น `/tmp` และ volume)
3. `no-new-privileges:true` — ป้องกัน privilege escalation
4. `mem_limit` — จำกัด memory 384MB
5. `pids_limit: 256` — จำกัดจำนวน process
6. `tmpfs: /tmp` — เขียนชั่วคราวได้ที่ /tmp เท่านั้น

---

## 7. Test File — test_qdrant.py

```python
from qdrant_client import XdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

# Initialize the client (connecting to localhost since we exposed 6333)
client = QdrantClient(url="http://localhost:6333")

def test_qdrant():
    print("Creating collection 'test_collection'...")
    try:
        client.create_collection(
            collection_name="test_collection",
            vectors_config=VectorParams(size=4, distance=Distance.DOT),
        )
        print("Collection created.")
    except Exception as e:
        if "already exists" in str(e):
            print("Collection 'test_collection' already exists.")
        else:
            raise e

    print("Adding vectors...")
    operation_info = client.upsert(
        collection_name="test_collection",
        wait=True,
        points=[
            PointStruct(id=1, vector=[0.05, 0.61, 0.76, 0.74], payload={"city": "Berlin"}),
            PointStruct(id=2, vector=[0.19, 0.81, 0.75, 0.11], payload={"city": "London"}),
            PointStruct(id=3, vector=[0.36, 0.55, 0.47, 0.94], payload={"city": "Moscow"}),
            PointStruct(id=4, vector=[0.18, 0.01, 0.85, 0.80], payload={"city": "New York"}),
            PointStruct(id=5, vector=[0.24, 0.18, 0.22, 0.44], payload={"city": "Beijing"}),
            PointStruct(id=6, vector=[0.35, 0.08, 0.11, 0.44], payload={"city": "Mumbai"}),
        ],
    )
    print(f"Upsert result: {operation_info.status}")

    print("Running basic search query...")
    search_result = client.query_points(
        collection_name="test_collection",
        query=[0.2, 0.1, 0.9, 0.7],
        with_payload=False,
        limit=3
    ).points
    print("Top 3 results:")
    for point in search_result:
        print(f"ID: {point.id}, Score: {point.score}")

    print("Running search with filter (city: London)...")
    search_result = client.query_points(
        collection_name="test_collection",
        query=[0.2, 0.1, 0.9, 0.7],
        query_filter=Filter(
            must=[FieldCondition(key="city", match=MatchValue(value="London"))]
        ),
        with_payload=True,
        limit=3,
    ).points
    for point in search_result:
        print(f"ID: {point.id}, Score: {point.score}, Payload: {point.payload}")

if __name__ == "__main__":
    test_qdrant()
```

**สิ่งที่ทดสอบ:**
1. **สร้าง collection** — `test_collection` ด้วย 4-dimension vectors, `DOT` distance (cosine-like)
2. **Upsert vectors** — ใส่ 6 points พร้อม city payload (Berlin, London, Moscow, New York, Beijing, Mumbai)
3. **Basic search** — query vector `[0.2, 0.1, 0.9, 0.7]` หา top 3 โดยไม่ return payload
4. **Filtered search** — หา top 3 เฉพาะที่ `city == "London"` พร้อม payload

**สิ่งที่น่าสนใจ:**
- ใช้ `Distance.DOT` (dot product) แทน cosine — เร็วกว่าแต่ต้อง normalize vectors ก่อน
- 4-dimension vectors เป็น dummy data (ใช้จริงต้องเป็น 768+ dimensions จาก embedding model)
- `try/except` สำหรับ "already exists" — ทำให้รันซ้ำได้โดยไม่พัง
- ไม่มี assertion (เป็น smoke test ไม่ใช่ unit test) — ตรวจด้วยตาจาก print output

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
│                              │                                   │
│                    Cloudflare Tunnel                              │
│              (auto/webhook/design.doctorboyz.com)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   tunnel     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────────┐
              │         server-network        │
              │   (Docker bridge network)    │
              │                              │
              │  ┌─────────┐  ┌──────────┐   │
              │  │  n8n     │  │  svix     │  │
              │  │  :5678   │  │  :8071    │  │
              │  └────┬────┘  └────┬─────┘   │
              │       │            │         │
              │  ┌────┴────┐  ┌────┴─────┐   │
              │  │postgres  │  │  redis    │  │
              │  │  :5432   │  │  :6379    │  │
              │  └─────────┘  └──────────┘   │
              │                              │
              │  ┌─────────┐  ┌──────────┐   │
              │  │ qdrant   │  │  minio    │  │
              │  │ :6333-34 │  │ :9000-01  │  │
              │  └─────────┘  └──────────┘   │
              │                              │
              │  ┌─────────┐  ┌──────────┐   │
              │  │openkb-api│  │open-webui │  │
              │  │  :8080   │  │  :3006    │  │
              │  └────┬────┘  └──────────┘   │
              │       │                      │
              │       │ Ollama (host)         │
              │       │ host.docker.internal   │
              │       │    :11434              │
              │                              │
              │  ┌─────────┐  ┌──────────┐   │
              │  │uptime-kuma│ │open-design│  │
              │  │  :3005   │  │ :7456(localhost)│
              │  └─────────┘  └──────────┘   │
              └──────────────────────────────┘
```

**Data flow สำคัญ:**
- n8n → postgres (workflow storage)
- svix → postgres + redis (webhook processing)
- openkb-api → Ollama on host (LLM calls)
- openkb-api → local filesystem (KB files in volume)
- tunnel → n8n/svix/open-design (reverse proxy from internet)