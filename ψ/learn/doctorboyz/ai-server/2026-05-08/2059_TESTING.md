# ai-server — Testing & Quality Analysis

> วิเคราะห์เมื่อ: 2026-05-08 | แหล่งข้อมูล: `/Users/doctorboyz/ai-server`

---

## 1. Test Structure — มีอะไรบ้าง

### test_qdrant.py (ไฟล์เดียวที่มี)

สคริปต์ Python แบบ manual run ไม่ใช่ automated test framework:
- สร้าง collection `test_collection` ด้วย vector size=4, distance=DOT
- Insert 6 points (เมือง 6 เมือง พร้อม payload)
- Search แบบไม่มี filter (top-3)
- Search แบบมี filter (`city: London`)
- ไม่มี assertion/assert — แค่ print ผลลัพธ์
- ไม่มี teardown (ลบ `test_collection` หลังเสร็จ) — collection ค้างอยู่ใน Qdrant

**ปัญหา:**
- ไม่ใช้ pytest หรือ test framework ใดๆ
- ไม่มี pass/fail criteria —มนุษย์ต้องดู output เองว่าถูกไหม
- ไม่มี cleanup หลังรัน — test data ค้างใน Qdrant
- ต้องติดตั้ง `qdrant_client` เอง (ไม่มี requirements.txt สำหรับ test)

### Health Check Endpoints (openkb-api)

| Endpoint | ทำอะไร | ตรวจอะไร |
|----------|--------|----------|
| `GET /health` | เช็คว่า config.yaml มีอยู่ | `kb_initialized: true/false` |
| `GET /status` | นับไฟล์ raw + wiki | จำนวนไฟล์, model, language |

**ข้อจำกัด:** `/health` ไม่เช็คว่า LLM reachable หรือ Qdrant accessible — เช็คแค่ว่าไฟล์ config มีอยู่

### สิ่งที่ไม่มีเลย

- ไม่มี unit test สำหรับ openkb-api (FastAPI routers)
- ไม่มี integration test ระหว่าง services
- ไม่มี CI/CD pipeline
- ไม่มี test framework ที่เป็นระบบ (pytest, conftest, fixtures)
- ไม่มี test coverage measurement

---

## 2. Health Checks — Docker Compose

### มี Health Check (3 services)

| Service | Check Command | Interval | Timeout | Retries | เริ่มต้น | สิ้นสุด | ตรวจอะไร |
|---------|--------------|----------|---------|---------|-------|--------|----------|
| `postgres` | `pg_isready -U ${POSTGRES_USER}` | 5s | 5s | 5 | — | — | Postgres รับ connection ได้ |
| `redis` | `redis-cli ping` | 5s | 5s | 5 | — | — | Redis ตอบ PONG |
| `open-design` | `node -e "fetch('/api/health')"` | 30s | 5s | 3 | 20s | — | HTTP API ตอบ 200 |

### ไม่มี Health Check (8 services)

| Service | เหตุผลที่ควรมี | Health Check ที่แนะนำ |
|---------|---------------|---------------------|
| `qdrant` | มี `/healthz` endpoint | `curl -f http://localhost:6333/healthz` |
| `minio` | มี `/minio/health/live` | `curl -f http://localhost:9000/minio/health/live` |
| `n8n` | มี `/healthz` endpoint | `curl -f http://localhost:5678/healthz` |
| `svix` | ขึ้นกับ postgres + redis | `curl -f http://localhost:8071/api/v1/app/` (หรือ endpoint เฉพาะ) |
| `openkb-api` | มี `/health` | `curl -f http://localhost:8080/health` |
| `uptime-kuma` | ควร self-monitor | `curl -f http://localhost:3001/` |
| `open-webui` | มี API endpoint | `curl -f http://localhost:8080/api/v1/auths/` |
| `tunnel` | Cloudflared มี health endpoint | `cloudflared tunnel info` หรือ check process |

### `depends_on` ที่ใช้ Health Check

เฉพาะ `n8n` และ `svix` ใช้ `condition: service_healthy`:
- `n8n` รอ `postgres` healthy ก่อนเริ่ม
- `svix` รอ `postgres` + `redis` healthy ก่อนเริ่ม

openkb-api ไม่รออะไร — แม้ LLM ไม่พร้อมก็เริ่มได้ (จะ fail ตอน chat/query)

### ข้อสังเกต

- postgres และ redis ใช้ interval 5s เร็วมาก — เหมาะกับ data layer ที่ต้องรอ
- open-design ใช้ 30s — เหมาะกับ Node.js app ที่ start ช้ากว่า
- open-design มี `start_period: 20s` — ให้เวลา boot ก่อนเริ่ม check (ตัวเดียวที่มี)
- ควรเพิ่ม `start_period` ให้ svix และ openkb-api ด้วย

---

## 3. Monitoring — Uptime Kuma

### การตั้งค่าปัจจุบัน

Uptime Kuma รันอยู่แล้วแต่ **ยังไม่มีการตั้งค่า monitors เป็น code** — ต้องตั้งผ่าน UI เอง

### Monitors ที่ INFRA_GUIDE.md แนะนำ

| Monitor | URL | ประเภท |
|---------|-----|--------|
| PostgreSQL | `postgres:5432` | TCP |
| Redis | `redis:6379` | TCP |
| Qdrant | `http://qdrant:6333/healthz` | HTTP |
| MinIO | `http://minio:9000/minio/health/live` | HTTP |
| n8n | `http://n8n:5678/healthz` | HTTP |
| Svix | `http://svix:8071/api/v1/app/` | HTTP |
| OpenKB API | `http://openkb-api:8080/health` | HTTP |
| Open WebUI | `http://open-webui:8080/api/v1/auths/` | HTTP |

### สิ่งที่ขาด

- **ไม่มี monitor สำหรับ open-design** — ทั้งๆ ที่มี health check ใน docker-compose
- **ไม่มี monitor สำหรับ Cloudflare Tunnel** — ถ้า tunnel ล่ม domain ทั้งหมดล่ม
- **ไม่มี alerting เป็น code** — ต้องตั้ง Telegram notification เองใน UI
- **ไม่มี uptime-kuma config backup** — ข้อมูลอยู่ใน Docker volume ถ้า volume หายต้องตั้งใหม่

### Alerting

INFRA_GUIDE.md แนะนำให้ตั้ง Telegram alert แต่ **ไม่มีใครตั้งแล้ว**:
- สร้าง Bot ผ่าน @BotFather
- ใส่ Bot Token + Chat ID ใน Uptime Kuma settings
- ไม่มี webhook-based alerting (ไม่ใช้ Svix ที่ตัวเองรันอยู่)

---

## 4. Backup Strategy

### init-db.sh

ทำอะไร: สร้าง database `svix_db` และ grant สิทธิ์ให้ `POSTGRES_USER`
เมื่อไรรัน: ครั้งเดียวตอน PostgreSQL สร้าง data directory ครั้งแรก (ผ่าน `/docker-entrypoint-initdb.d/`)
ข้อจำกัด: ถ้าต้องการเพิ่ม database ใหม่ ต้อง manual `CREATE DATABASE` หรือแก้ init-db.sh แล้วลบ volume เริ่มใหม่

### migrate.sh

สคริปต์ 5 ขั้นตอนสำหรับย้ายจาก pgvector → plain postgres:

| Step | ทำอะไร | ระวังอะไร |
|------|--------|----------|
| 1 | `pg_dumpall` backup database ปัจจุบัน | ถ้า container ไม่ทำงานจะข้าม (warning) |
| 2 | `docker compose down` | หยุดทุก service |
| 3 | ลบ old pgvector volume | ข้อมูลเก่าหายถาวร (มี backup จาก step 1) |
| 4 | เช็ค/สร้าง `.env`, สร้าง random secrets | ใช้ `openssl rand` สร้าง secret ใหม่ |
| 5 | `docker compose up -d` | เริ่มทุกอย่าง |

### การ Backup ปัจจุบัน

| สิ่งที่ backup | วิธี | รันเมื่อไร |
|--------------|------|-----------|
| PostgreSQL | `docker exec postgres pg_dumpall -U admin > backup.sql` | Manual |
| backups/ directory | มี `pg_dumpall_20260503_162059.sql` (2MB) | ครั้งสุดท้าย: 3 พ.ค. |
| Qdrant | ไม่มี | — |
| Redis | ไม่มี (มี appendonly หรือไม่? ไม่ได้ config) | — |
| MinIO | ไม่มี | — |
| n8n workflows | อยู่ใน PostgreSQL | ตาม Postgres backup |
| Uptime Kuma config | ไม่มี | — |
| OpenKB data | ไม่มี | — |

### สิ่งที่ขาด

- **ไม่มี cron/scheduled backup** — ต้องรัน manual ทุกครั้ง
- **ไม่มี backup rotation** — backup เก่าสะสมเรื่อยๆ
- **ไม่มี backup สำหรับ 5 services** (Qdrant, Redis, MinIO, Uptime Kuma, OpenKB)
- **migrate.sh มีช่องโหว่** — step 3 ลบ volume ทิ้งถ้า step 1 fail ไป (ข้ามด้วย warning)

---

## 5. Disaster Recovery

### Restart Policies

ทุก service ใช้ `restart: unless-stopped`:
- ถ้า container crash → Docker restart อัตโนมัติ
- ถ้า `docker compose stop` → ไม่ restart (ต้อง start เอง)
- ถ้า Docker daemon restart → container restart อัตโนมัติ

### Data Persistence

ทุก service ใช้ named volumes (ไม่ใช้ bind mounts):

| Volume | ผูกกับ Service | ข้อมูลอะไร |
|--------|---------------|----------|
| `postgres_data` | postgres | ทุก database |
| `redis_data` | redis | cache/queue |
| `qdrant_data` | qdrant | vectors |
| `n8n_data` | n8n | workflows, credentials |
| `minio_data` | minio | ไฟล์ทั้งหมด |
| `open_webui_data` | open-webui | chat history, config |
| `uptime_kuma_data` | uptime-kuma | monitors, alert config |
| `openkb_data` | openkb-api | documents, wiki |
| `open_design_data` | open-design | design files |

**ถ้า volume หาย → ข้อมูลหายถาวร** (ไม่มี replication หรือ remote backup)

### เมื่อ Service Crash

| สถานการณ์ | ผล | กู้คืนยังไง |
|-----------|-----|------------|
| postgres crash | n8n + svix ใช้งานไม่ได้ | `unless-stopped` restart อัตโนมัติ |
| redis crash | Svix retry queue หาย, cache หาย | restart แล้ว Svix ต้อง retry เอง |
| qdrant crash | arra-oracle search ไม่ได้ | restart + rebuild collection ถ้า volume หาย |
| tunnel crash | ทุก external domain ล่ม | restart อัตโนมัติ |
| openkb-api crash | chat sessions ใน memory หายหมด | restart → session ใหม่เริ่มต้นใหม่ |
| minio crash | ไฟล์เข้าไม่ถึง | restart อัตโนมัติ, volume ยังอยู่ |

### จุดอ่อนร้ายแรง

1. **Single PostgreSQL instance** — ถ้า data corrupt ทุกอย่างที่ใช้ Postgres ล่ม (n8n, svix)
2. **No replication** — ไม่มี read replica, ไม่มี failover
3. **Chat sessions ใน memory** — openkb-api เก็บ chat_sessions เป็น dict ใน memory, restart หายหมด
4. **Single host** — ทุกอย่างรันบนเครื่องเดียว, ถ้าเครื่องล่มทุกอย่างล่ม

---

## 6. Quality Patterns — Docker Security

### open-design: มี Hardening ดี

| มาตรการ | ค่า | ผล |
|---------|-----|-----|
| `read_only: true` | ใช่ | Container เขียนได้แค่ `/tmp` (tmpfs) |
| `security_opt: no-new-privileges:true` | ใช่ | ป้องกัน privilege escalation |
| `mem_limit` | 384m | จำกัด memory |
| `pids_limit` | 256 | ป้องกัน fork bomb |
| `tmpfs: /tmp` | ใช่ | เขียนชั่วคราวใน tmpfs |
| `127.0.0.1` bind | ใช่ | เข้าได้แค่จาก localhost |
| `NODE_OPTIONS=--max-old-space-size=192` | 192MB | จำกัด Node.js heap |

### ทุก Service อื่น: ไม่มี Hardening

| Service | read_only | no-new-privileges | mem_limit | pids_limit | 127.0.0.1 bind |
|---------|-----------|-------------------|-----------|------------|----------------|
| postgres | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| redis | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| qdrant | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| minio | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| n8n | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| svix | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| openkb-api | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| uptime-kuma | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| open-webui | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (exposed) |
| tunnel | ไม่มี | ไม่มี | ไม่มี | ไม่มี | ไม่มี (n/a) |

### ปัญหา Security

1. **Ports exposed หน้า host** — postgres, redis, minio, qdrant ทุกอย่างเปิด `0.0.0.0` ถ้าเครื่องมี public IP เข้าถึงได้เลยโดยไม่ต้องผ่าน tunnel
2. **Redis ไม่มี password** — `redis-cli ping` ตอบได้เลย ไม่ต้อง auth
3. **CORS เปิดหมด** — openkb-api ใช้ `allow_origins=["*"]`
4. **ไม่มี rate limiting** — ทุก API endpoint
5. **ไม่มี TLS ระหว่าง services** — traffic ใน Docker network เป็น plain HTTP

---

## 7. Test Utilities — ตรวจสอบแต่ละ Service

### คำสั่งที่ใช้ตรวจสอบได้

```bash
# PostgreSQL
docker exec -it postgres psql -U admin -d n8n_db -c "SELECT 1"
docker exec -it postgres psql -U admin -c "\l"           # ดูทุก database
docker exec -it postgres psql -U admin -d svix_db -c "SELECT count(*) FROM svix_message"

# Redis
docker exec -it redis redis-cli ping                      # ต้องได้ PONG
docker exec -it redis redis-cli INFO server                # ดู version, uptime
docker exec -it redis redis-cli DBSIZE                     # ดูจำนวน keys

# Qdrant
curl http://localhost:6333/healthz                          # ต้องได้ {"status":"ok"}
curl http://localhost:6333/collections                     # ดูทุก collection
curl http://localhost:6333/collections/{name}              # ดูรายละเอียด collection

# MinIO
curl http://localhost:9000/minio/health/live               # ต้อง 200
curl http://localhost:9000/minio/health/ready              # ต้อง 200
docker exec -it minio mc alias set local http://localhost:9000 minioadmin <password>
docker exec -it minio mc ls local/                          # ดูทุก bucket

# n8n
curl http://localhost:5678/healthz                          # ต้อง 200

# Svix
curl http://localhost:8071/api/v1/app/ -H "Authorization: Bearer <SVIX_API_KEY>"

# OpenKB API
curl http://localhost:8080/health                            # ต้องได้ {"status":"ok", ...}
curl http://localhost:8080/status                            # ดูจำนวนไฟล์

# Open Design
curl http://localhost:7456/api/health                       # ต้องได้ {"ok":true}

# Uptime Kuma
curl http://localhost:3005/                                  # Dashboard HTML

# Docker Compose ทั้งก้อน
docker compose ps                                            # ดูสถานะทุก container
docker compose ps --format json | jq '.[] | select(.Health != "healthy")'  # หาตัวที่ไม่ healthy
```

---

## 8. Integration Testing — การเชื่อมต่อระหว่าง Services

### Dependency Graph

```
postgres ◄── n8n (ผ่าน DB_POSTGRESDB_*)
       ◄── svix (ผ่าน SVIX_DB_DSN)
       ◄── init-db.sh (ตอนสร้างครั้งแรก)

redis   ◄── svix (ผ่าน SVIX_REDIS_DSN)

ollama  ◄── openkb-api (ผ่าน LLM_API_BASE)

tunnel  ──► n8n (auto.doctorboyz.com)
        ──► svix (webhook.doctorboyz.com)
        ──► open-design (design.doctorboyz.com)
```

### จุดที่ต้องตรวจ Integration

| จาก → ถึง | ตรวจยังไง | ตอนนี้ตรวจไหม |
|-----------|----------|--------------|
| n8n → postgres | `depends_on: service_healthy` | ใช่ (health check) |
| svix → postgres | `depends_on: service_healthy` | ใช่ (health check) |
| svix → redis | `depends_on: service_healthy` | ใช่ (health check) |
| openkb-api → ollama | ไม่มี dependency check | ไม่มี — จะ fail ตอน runtime |
| openkb-api → filesystem | สร้าง dir ใน entrypoint.sh | ครึ่งหนึ่ง (mkdir -p) |
| tunnel → services | ไม่มี dependency | ไม่มี — ถ้า service ล่ม tunnel ส่ง 502 |

### สิ่งที่ไม่ถูกตรวจ

1. **Svix ไม่ verify ว่า PostgreSQL schema พร้อม** — `depends_on: service_healthy` แค่เช็คว่า Postgres รับ connection ได้ ไม่ได้เช็คว่า `svix_db` มี table ที่ถูกต้อง
2. **n8n ไม่ verify ว่า Postgres schema พร้อม** — เหมือนกัน ถ้า `n8n_db` ไม่มี table n8n จะ crash loop จนกว่าจะสร้างเองได้
3. **openkb-api ไม่เช็ค LLM** — ถ้า Ollama ไม่ทำงาน `/chat` จะตอบ 502 หรือ 500 ทันที
4. **tunnel ไม่เช็ค backend** — Cloudflare tunnel ส่ง traffic ไป service ตรงๆ ถ้า service ล่ม ผู้ใช้เจอ 502

---

## 9. Missing Tests — สิ่งที่ยังไม่มี

### สำคัญมาก (ต้องมี)

| อะไร | ทำไมต้องมี | แนะนำทำยังไง |
|------|----------|-------------|
| **pytest สำหรับ openkb-api** | API ไม่มี test เลย แก้แล้วเสียไม่รู้ | `pytest` + `httpx.AsyncClient` + FastAPI `TestClient` |
| **Health check สำหรับ Qdrant** | Qdrant ล่มไม่รู้ | `curl -f http://localhost:6333/healthz` |
| **Health check สำหรับ MinIO** | ไฟล์เข้าไม่ถึงไม่รู้ | `curl -f http://localhost:9000/minio/health/live` |
| **Redis auth** | ใครก็เชื่อมได้ | เพิ่ม `--requirepass` ใน command |
| **Scheduled backup** | backup manual ลืมบ่อย | cron job หรือ n8n workflow |
| **Uptime Kuma backup** | ตั้งใหม่ทั้งก้อนถ้า volume หาย | export config เป็น JSON หรือใช้ Uptime Kuma API |

### สำคัญปานกลาง (ควรมี)

| อะไร | ทำไมต้องมี | แนะนำทำยังไง |
|------|----------|-------------|
| **Docker security hardening** | ทุก container รันแบบไม่จำกัด | เพิ่ม `mem_limit`, `pids_limit`, `read_only` |
| **Integration test script** | ตรวจว่าทุก service เชื่อมกันได้ | script ที่รัน `curl` ทุก health endpoint |
| **CORS restrict** | ป้องกัน unauthorized API access | เปลี่ยน `allow_origins=["*"]` เป็น domain เฉพาะ |
| **openkb-api LLM health check** | รู้ก่อนว่า Ollama ไม่พร้อม | `/health` เช็ค LLM_API_BASE reachable |
| **Qdrant test collection cleanup** | test data ค้าง | เพิ่ม `client.delete_collection("test_collection")` |
| **Chat session persistence** | restart แล้ว chat หาย | เก็บใน Redis แทน dict ใน memory |

### น่ามี (ดีถ้ามี)

| อะไร | ทำไมต้องมี | แนะนำทำยังไง |
|------|----------|-------------|
| **CI/CD pipeline** | ตรวจอัตโนมัติทุกครั้ง push | GitHub Actions |
| **Load testing** | ไม่รู้ว่ารับได้กี่ request | k6 หรือ locust |
| **Log aggregation** | ดู log ทุก service รวมกัน | ไม่จำเป็นถ้าไม่เยอะ |
| **Container image scanning** | ไม่รู้ว่า image มี CVE | `docker scout` หรือ Trivy |

---

## 10. openkb-api — การวิเคราะห์เชิงลึก

### API Validation

| Endpoint | Input Validation | Error Handling | ปัญหา |
|----------|-----------------|----------------|------|
| `POST /documents/upload` | Pydantic `UploadFile` | `aiofiles` write, background task | ไม่ validate file type/size |
| `POST /documents/text` | Pydantic `TextDocument` | `aiofiles` write, background task | ไม่ limit text length |
| `POST /query/` | Pydantic `QueryRequest` | subprocess timeout, error return | ไม่ sanitize input ส่งให้ shell |
| `POST /chat/` | Pydantic `ChatMessage` | httpx timeout, HTTPException | ไม่ limit session size |
| `GET /wiki/{path}` | `_safe_path()` traversal check | HTTPException 403/404 | ดี — มี path traversal protection |
| `GET /wiki/` | ไม่มี input | ไม่มี error | ถ้า dir ไม่มี return `[]` |
| `GET /health` | ไม่มี input | ไม่มี error | ตื้น — เช็คแค่ file exists |
| `GET /status` | ไม่มี input | ไม่มี error | ตื้น — นับแค่จำนวนไฟล์ |

### Error Handling Patterns

**ดี:**
- `wiki.py` มี `_safe_path()` ป้องกัน path traversal — `os.path.realpath` + `startswith` check
- `query.py` มี `subprocess.TimeoutExpired` handling (120s, 300s)
- `chat` endpoint มี `httpx.TimeoutException` → 504
- `documents.py` มี `process_document()` wrap subprocess แยกไว้

**ไม่ดี:**
- `documents/upload` ไม่จำกัด file size — อัปโหลด 10GB ได้
- `documents/text` ไม่จำกัด text length — ส่ง 1MB text เข้าไปได้
- `query/` ใช้ `subprocess.run(["openkb", "query", req.question])` — ถ้า `question` มี shell metacharacter อาจมี injection (ปลอดภัยเพราะใช้ list ไม่ใช่ string แต่ควร validate)
- `chat_sessions` dict โตไม่มีที่สิ้นสุด — ไม่มี eviction, ไม่มี TTL
- background task ใน `/documents/upload` ไม่มี status tracking — ไม่รู้ว่า process สำเร็จหรือ fail

### Missing Testing สำหรับ openkb-api

```python
# ตัวอย่าง test ที่ควรมี

# 1. Health endpoint
async def test_health():
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# 2. Path traversal prevention
async def test_wiki_path_traversal():
    response = await client.get("/wiki/../../etc/passwd")
    assert response.status_code == 403

# 3. File upload size limit
async def test_upload_too_large():
    response = await client.post("/documents/upload", files={"file": large_file})
    assert response.status_code == 413  # Payload Too Large

# 4. Query timeout
async def test_query_timeout():
    # mock subprocess.TimeoutExpired
    ...

# 5. Chat session lifecycle
async def test_chat_session_create_and_delete():
    response = await client.post("/chat/", json={"message": "hi", "session_id": "test"})
    assert response.status_code == 200
    response = await client.delete("/chat/test")
    assert response.status_code == 200

# 6. LLM unreachable
async def test_chat_llm_down():
    # mock httpx to fail
    ...
```

### Architecture ที่ควรปรับ

1. **Chat sessions → Redis** — แทน dict ใน memory, รอดจาก restart
2. **Background task status → Redis** — เก็บ task_id → status mapping
3. **File upload → size/type validation** — limit extension, limit size
4. **LLM health check → /health** — เพิ่มการเช็ค Ollama reachable ใน health endpoint
5. **Rate limiting middleware** — ป้องกัน abuse
6. **API key / auth** — ตอนนี้เปิดหมด ใครก็เรียกได้

---

## สรุป — Score Card

| หมวด | คะแนน | หมายเหตุ |
|------|-------|----------|
| Test coverage | 1/10 | มีแค่ test_qdrant.py แบบ manual |
| Health checks | 4/10 | 3/11 services มี, ส่วนใหญ่ไม่มี |
| Monitoring | 3/10 | Uptime Kuma มีแต่ไม่ได้ตั้ง monitors เป็น code |
| Backup | 3/10 | Postgres manual backup อย่างเดียว, 5 services ไม่มี backup |
| Disaster recovery | 4/10 | restart policy ดีแต่ single point of failure ทุกที่ |
| Docker security | 2/10 | open-design ดี 1 ตัว ที่เหลือไม่มี hardening |
| API validation | 4/10 | Pydantic models ดีแต่ขาด size limit, auth, rate limit |
| Error handling | 5/10 | timeout handling มี, path traversal protection มี, แต่ขาด depth |
| Integration testing | 1/10 | depends_on มีบ้าง แต่ไม่มี integration test จริง |
| Documentation | 8/10 | INFRA_GUIDE.md ละเอียดดีมาก |

**ภาพรวม:** Infrastructure มี documentation ดีแต่ testing และ resilience เป็นจุดอ่อนหลัก — ระบบรันได้แต่ถ้าเกิดปัญหาจะรู้ช้า กู้คืนยาก และไม่มี automated verification ว่าทุกอย่างยังทำงานอยู่