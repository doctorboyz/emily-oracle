# ai-server Quick Reference

> อัปเดตล่าสุด: 2026-05-08

---

## 1. ai-server คืออะไร

ai-server เป็น Docker Compose stack ที่รวบรวม infrastructure ทั้งหมดสำหรับ Oracle Army — ประกอบด้วย database (PostgreSQL, Qdrant, Redis), storage (MinIO), automation (n8n), webhook infrastructure (Svix), knowledge base (OpenKB API), AI chat (Open WebUI), design tool (Open Design), monitoring (Uptime Kuma) และ external access (Cloudflare Tunnel) ทุกอย่างอยู่ใน Docker network เดียวกันชื่อ `server-network` ใช้ container name เป็น hostname ติดต่อกันได้เลย ไม่ต้องผ่าน public internet

---

## 2. Installation

```bash
# 1. Clone
git clone <repo-url> ~/ai-server
cd ~/ai-server

# 2. ตั้งค่า .env (จาก template)
cp .env.example .env

# 3. แก้ secrets ที่จำเป็น
nano .env
# ข้อกำหนด: POSTGRES_PASSWORD, SVIX_JWT_SECRET, SVIX_WH_API_KEYS,
#             MINIO_ROOT_PASSWORD, TUNNEL_TOKEN, WEBUI_SECRET_KEY

# 4. สร้าง Docker network (ครั้งแรกเท่านั้น)
docker network create server-network

# 5. เริ่มทุก service
docker compose up -d

# 6. รอ ~30 วินาที แล้วตรวจสอบ
docker compose ps

# 7. (ทางเลือก) ใช้ migrate script สำหรับการย้ายจาก pgvector
bash migrate.sh
```

---

## 3. Key Services

| Service | หน้าที่ | Host Port | URL / Endpoint | Container Port |
|---------|---------|-----------|----------------|----------------|
| **postgres** | PostgreSQL 16 database | 5432 | `psql -h localhost -U admin -d n8n_db` | 5432 |
| **redis** | Cache + Queue | 6379 | `redis-cli -h localhost` | 6379 |
| **qdrant** | Vector DB (semantic search) | 6333 (HTTP), 6334 (gRPC) | http://localhost:6333/dashboard | 6333/6334 |
| **minio** | S3-compatible object storage | 9000 (API), 9001 (Console) | http://localhost:9001 | 9000/9001 |
| **n8n** | Workflow automation | 5678 | https://auto.doctorboyz.com | 5678 |
| **svix** | Webhook infrastructure | 8071 | https://webhook.doctorboyz.com | 8071 |
| **openkb-api** | Knowledge Base API (RAG) | 8080 | http://localhost:8080/health | 8080 |
| **open-webui** | AI Chat UI | 3006 | http://localhost:3006 | 8080 |
| **open-design** | Design tool (Figma-alternative) | 7456 (localhost only) | https://design.doctorboyz.com | 7456 |
| **uptime-kuma** | Monitoring dashboard | 3005 | http://localhost:3005 | 3001 |
| **tunnel** | Cloudflare Tunnel (external access) | — | — | — |

### 3.1 PostgreSQL

- **Databases**: `n8n_db` (n8n workflows), `svix_db` (Svix webhooks), `postgres` (system)
- **Connection (internal)**: `postgres:5432` / user: `admin`
- **Connection (host)**: `localhost:5432`
- `init-db.sh` สร้าง `svix_db` อัตโนมัติตอน first boot

### 3.2 Redis

- ใช้สำหรับ Svix queue/retry และ caching
- **Connection (internal)**: `redis://redis:6379`
- **Connection (host)**: `redis-cli -h localhost`

### 3.3 Qdrant

- Vector search สำหรับ RAG และ semantic search
- **Dashboard**: http://localhost:6333/dashboard
- **Connection (internal)**: HTTP `http://qdrant:6333`, gRPC `http://qdrant:6334`
- ไม่มี authentication (internal network only)

### 3.4 MinIO

- S3-compatible storage สำหรับไฟล์, exports, webhook logs
- **Console**: http://localhost:9001 (user: `minioadmin`)
- **Connection (internal)**: `http://minio:9000`
- สร้าง bucket: `mc alias set local http://localhost:9000 minioadmin <password>`

### 3.5 n8n

- Workflow automation engine
- **URL**: https://auto.doctorboyz.com (via Cloudflare Tunnel)
- **Database**: PostgreSQL `n8n_db`
- **Connection (internal)**: `http://n8n:5678`

### 3.6 Svix

- Webhook infrastructure — สร้าง endpoint, ส่ง event, ติดตาม delivery
- **URL**: https://webhook.doctorboyz.com (via Cloudflare Tunnel)
- **Database**: PostgreSQL `svix_db`
- **API Key**: ดูใน `.env` -> `SVIX_WH_API_KEYS`

### 3.7 OpenKB API

- Knowledge Base API พูดคุยกับข้อมูลได้ (RAG + chat)
- **LLM backend**: Ollama `qwen3:8b` ผ่าน `host.docker.internal:11434`
- **Language**: Thai (`th`)
- **Volume**: `openkb_data` -> `/app/kb`
- Chat sessions เก็บใน memory — restart จะหาย

### 3.8 Open WebUI

- Web UI สำหรับคุยกับ LLM (เช่น ChatGPT interface)
- **URL**: http://localhost:3006
- **Connection (internal)**: `http://open-webui:8080`

### 3.9 Open Design

- Open-source design tool (คล้าย Figma)
- **URL**: https://design.doctorboyz.com (via tunnel) หรือ http://localhost:7456
- **Security**: `read_only`, `no-new-privileges`, memory limit 384 MiB, pids limit 256
- **Health check**: `GET /api/health`

### 3.10 Uptime Kuma

- Monitoring dashboard สำหรับตรวจสอบทุก service
- **URL**: http://localhost:3005
- ตั้งค่าครั้งแรก: สร้าง admin account -> เพิ่ม monitors ทุก service

### 3.11 Cloudflare Tunnel

- เชื่อม external domain เข้ามายัง internal services
- **Routes**: `auto.doctorboyz.com` -> n8n, `webhook.doctorboyz.com` -> svix, `design.doctorboyz.com` -> open-design
- ตั้งค่า routes เพิ่มเติม: Cloudflare Dashboard -> Zero Trust -> Networks -> Tunnels

---

## 4. Common Operations

### 4.1 Start / Stop / Restart

```bash
cd ~/ai-server

# เริ่มทุก service
docker compose up -d

# หยุดทุก service
docker compose down

# Restart service เดียว
docker compose restart n8n
docker compose restart svix

# ดูสถานะทุก container
docker compose ps

# ดู log
docker compose logs n8n --tail 50 -f
docker compose logs svix --tail 50
docker compose logs openkb-api --tail 100

# ลบ orphan containers (จาก compose เก่า)
docker compose up -d --remove-orphans
```

### 4.2 Rebuild (หลังแก้ openkb-api)

```bash
docker compose up -d --build openkb-api
```

### 4.3 เข้า Database

```bash
# PostgreSQL
docker exec -it postgres psql -U admin -d n8n_db
docker exec -it postgres psql -U admin -d svix_db

# Redis
docker exec -it redis redis-cli

# ตรวจสอบ Redis
docker exec -it redis redis-cli ping
docker exec -it redis redis-cli info
```

### 4.4 Qdrant Quick Test

```bash
# ตรวจสอบสถานะ
curl http://localhost:6333/healthz

# ดู collections
curl http://localhost:6333/collections

# รัน test script
python3 test_qdrant.py
```

### 4.5 MinIO Quick Test

```bash
# ตั้งค่า mc client
mc alias set local http://localhost:9000 minioadmin <MINIO_ROOT_PASSWORD>

# สร้าง bucket
mc mb local/oracle-files

# อัปโหลดไฟล์
mc cp myfile.pdf local/oracle-files/

# ดูรายการ
mc ls local/oracle-files/
```

---

## 5. Configuration — .env Variables

| Variable | คำอธิบาย | ค่า default ใน .env.example |
|----------|----------|------------------------------|
| `POSTGRES_USER` | PostgreSQL admin user | `admin` |
| `POSTGRES_PASSWORD` | PostgreSQL password (**ต้องเปลี่ยน**) | `change_me_to_a_strong_password` |
| `POSTGRES_DB` | Default database ที่สร้างตอน init | `n8n_db` |
| `SVIX_DB` | Svix database name | `svix_db` |
| `SVIX_JWT_SECRET` | JWT secret สำหรับ Svix (**ต้องเปลี่ยน**, อย่างน้อย 32 chars) | `change_me_to_a_random_secret_at_least_32_chars` |
| `SVIX_WH_API_KEYS` | API key สำหรับ Svix (**ต้องเปลี่ยน**) | `change_me_to_an_api_key_for_svix` |
| `N8N_HOST` | n8n public hostname | `auto.doctorboyz.com` |
| `N8N_PORT` | n8n port | `5678` |
| `N8N_PROTOCOL` | n8n protocol | `https` |
| `WEBHOOK_URL` | n8n webhook URL | `https://auto.doctorboyz.com/` |
| `GENERIC_TIMEZONE` | Timezone สำหรับ n8n | `Asia/Bangkok` |
| `TUNNEL_TOKEN` | Cloudflare Tunnel token (**ต้องเปลี่ยน**) | `your_cloudflare_tunnel_token_here` |
| `MINIO_ROOT_USER` | MinIO admin user | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO password (**ต้องเปลี่ยน**) | `change_me_to_a_strong_minio_password` |
| `MINIO_PORT` | MinIO API port | `9000` |
| `MINIO_CONSOLE_PORT` | MinIO Console port | `9001` |
| `UPTIME_KUMA_PORT` | Uptime Kuma port | `3005` |
| `OPEN_WEBUI_PORT` | Open WebUI port | `3006` |
| `OPENAI_API_KEY` | OpenAI API key (สำหรับ Open WebUI) | `sk-...` |
| `WEBUI_SECRET_KEY` | Open WebUI secret key (**ต้องเปลี่ยน**) | `yoursecretkeyhere` |
| `OPENKB_API_PORT` | OpenKB API port | `8080` |
| `LLM_API_KEY` | LLM API key (default: `ollama` สำหรับ local) | `ollama` |
| `LLM_API_BASE` | LLM API base URL | `http://host.docker.internal:11434` |
| `OPENKB_MODEL` | LLM model สำหรับ OpenKB | `ollama/qwen3:8b` |
| `OPENKB_LANGUAGE` | ภาษา default สำหรับ OpenKB | `th` |
| `OPEN_DESIGN_PORT` | Open Design port | `7456` |
| `OPEN_DESIGN_MEM_LIMIT` | Open Design memory limit | `384m` |

---

## 6. Networking

### 6.1 Docker Network

ทุก service อยู่ใน `server-network` (external Docker network) container ไหนก็ติดต่อ container อื่นได้ด้วย container name เป็น hostname:

```
postgres:5432     redis:6379      qdrant:6333
minio:9000        n8n:5678        svix:8071
openkb-api:8080   open-webui:8080 open-design:7456
uptime-kuma:3001  tunnel (no port)
```

### 6.2 Cloudflare Tunnel Routes

| Domain | Service | หมายเหตุ |
|--------|---------|----------|
| `auto.doctorboyz.com` | `http://n8n:5678` | n8n automation |
| `webhook.doctorboyz.com` | `http://svix:8071` | Svix webhooks |
| `design.doctorboyz.com` | `http://open-design:7456` | Open Design |

เพิ่ม route ใหม่: Cloudflare Dashboard -> Zero Trust -> Networks -> Tunnels -> เลือก tunnel -> Public Hostname -> Add hostname

### 6.3 Port Binding

| Host Port | Container | Binding | หมายเหตุ |
|-----------|-----------|---------|----------|
| 5432 | postgres | `0.0.0.0:5432` | exposed ทุก interface |
| 6379 | redis | `0.0.0.0:6379` | exposed ทุก interface |
| 6333-6334 | qdrant | `0.0.0.0:6333-6334` | exposed ทุก interface |
| 9000-9001 | minio | `0.0.0.0:9000-9001` | exposed ทุก interface |
| 5678 | n8n | `0.0.0.0:5678` | exposed ทุก interface |
| 8071 | svix | `0.0.0.0:8071` | exposed ทุก interface |
| 8080 | openkb-api | `0.0.0.0:8080` | exposed ทุก interface |
| 3005 | uptime-kuma | `0.0.0.0:3005` | exposed ทุก interface |
| 3006 | open-webui | `0.0.0.0:3006` | exposed ทุก interface |
| 7456 | open-design | `127.0.0.1:7456` | localhost only (เป็นข้อยกเว้นเดียว) |

### 6.4 Host Docker Internal

`host.docker.internal` ใช้สำหรับ container ที่ต้องเข้าถึง host machine (เช่น Ollama ที่รันอยู่บน host port 11434) ใช้ใน n8n, openkb-api

---

## 7. Troubleshooting

### 7.1 Service ไม่ start

```bash
# ดู log ของ service ที่ fail
docker compose logs <service-name> --tail 100

# ดูว่า container ตายเพราะอะไร
docker inspect <container-name> | grep -A 5 "State"

# Restart service เดียว
docker compose restart <service-name>

# สร้างใหม่ทั้งหมด
docker compose down && docker compose up -d
```

### 7.2 Port Conflict

ถ้า port ถูกใช้อยู่แล้ว:

```bash
# ตรวจสอบว่าอะไรใช้ port
lsof -i :5432
lsof -i :8080

# เปลี่ยน port ใน .env แล้ว restart
# เช่น เปลี่ยน OPENKB_API_PORT=8080 เป็น OPENKB_API_PORT=8081
```

### 7.3 PostgreSQL ไม่ยอม start

```bash
# ตรวจสอบว่า volume มีปัญหาไหม
docker volume inspect ai-server_postgres_data

# ถ้า corruption ต้อง reset (ระวัง! ข้อมูลจะหาย)
docker compose down
docker volume rm ai-server_postgres_data
docker compose up -d
```

### 7.4 Svix ไม่ start / connection refused

```bash
# Svix ต้องรอ postgres และ redis พร้อมก่อน
docker compose ps postgres redis

# ตรวจสอบว่า svix_db ถูกสร้างแล้ว
docker exec -it postgres psql -U admin -c "\l" | grep svix

# ถ้ายังไม่มี svix_db
docker exec -it postgres psql -U admin -c "CREATE DATABASE svix_db;"
```

### 7.5 OpenKB API ไม่ตอบ

```bash
# ตรวจสอบว่า Ollama รันอยู่บน host ไหม
curl http://localhost:11434/api/tags

# ดู log ของ openkb-api
docker compose logs openkb-api --tail 50

# ตรวจสอบ health
curl http://localhost:8080/health
```

### 7.6 Cloudflare Tunnel ไม่ทำงาน

```bash
# ดู log ของ tunnel
docker compose logs tunnel --tail 50

# ตรวจสอบว่า TUNNEL_TOKEN ถูกต้องใน .env
grep TUNNEL_TOKEN .env

# Tunnel ต้องตั้ง routes ใน Cloudflare Dashboard
# Dashboard -> Zero Trust -> Networks -> Tunnels
```

### 7.7 Open Design health check fail

```bash
# ตรวจสอบ health
curl http://localhost:7456/api/health

# ดู log
docker compose logs open-design --tail 50

# ถ้า memory เต็ม (default limit 384m) ให้เพิ่มใน .env
# OPEN_DESIGN_MEM_LIMIT=512m
```

### 7.8 ลบและสร้างใหม่ทั้งหมด (ระวัง! ข้อมูลจะหาย)

```bash
# Backup ก่อน (สำคัญมาก!)
docker exec postgres pg_dumpall -U admin > backups/full_backup_$(date +%Y%m%d).sql

# ลบทุกอย่าง รวม volumes
docker compose down -v

# สร้างใหม่ทั้งหมด
docker compose up -d
```

---

## 8. Adding a New Service

### ขั้นตอน

1. **เพิ่ม service ใน `docker-compose.yml`**

```yaml
  my-new-service:
    image: my-image:latest
    container_name: my-new-service
    restart: unless-stopped
    networks:
      - server-network
    ports:
      - "8090:8090"    # host:container
    environment:
      - MY_VAR=${MY_VAR}
    volumes:
      - my_new_service_data:/app/data
    depends_on:
      - postgres       # ถ้าต้องใช้ database
```

2. **เพิ่ม volume ในส่วน `volumes:` ด้านบน**

```yaml
volumes:
  # ... existing volumes ...
  my_new_service_data:
```

3. **เพิ่ม env variables ใน `.env`**

```bash
MY_VAR=my_value
MY_NEW_SERVICE_PORT=8090
```

4. **(ถ้าต้องการ external access) เพิ่ม Cloudflare Tunnel route**

Dashboard -> Zero Trust -> Networks -> Tunnels -> เลือก tunnel -> Public Hostname -> Add hostname:
- Subdomain: `mynewservice`
- Domain: `doctorboyz.com`
- Service: `http://my-new-service:8090`

5. **(ถ้าต้องการ database) เพิ่มใน `init-db.sh`**

```bash
CREATE DATABASE my_new_db;
GRANT ALL PRIVILEGES ON DATABASE my_new_db TO $POSTGRES_USER;
```

6. **(แนะนำ) เพิ่ม monitor ใน Uptime Kuma**

เปิด http://localhost:3005 -> Add Monitor -> เลือก type (HTTP/TCP) -> ใส่ URL

7. **สร้างและ start**

```bash
docker compose up -d my-new-service
```

### ข้อควรระวังเมื่อเพิ่ม service

- ใช้ `restart: unless-stopped` เสมอ (เผื่อ server restart)
- ใช้ named volumes ไม่ใช่ bind mounts สำหรับ persistent data
- ใส่ `depends_on` กับ service ที่ต้องรอก่อน
- ถ้า port binding ต้องการ localhost only ใช้ `127.0.0.1:port:port`
- ใส่ healthcheck ถ้ามี endpoint สำหรับตรวจสอบ
- ไม่ commit `.env` เพิ่มตัวแปรใหม่ใน `.env.example` เท่านั้น

---

## 9. Backup & Recovery

### 9.1 PostgreSQL Backup

```bash
# Backup ทุก database
docker exec postgres pg_dumpall -U admin > backups/pg_dumpall_$(date +%Y%m%d_%H%M%S).sql

# Backup database เดียว
docker exec postgres pg_dump -U admin n8n_db > backups/n8n_db_$(date +%Y%m%d).sql
docker exec postgres pg_dump -U admin svix_db > backups/svix_db_$(date +%Y%m%d).sql
```

### 9.2 PostgreSQL Restore

```bash
# Restore ทุก database
cat backups/pg_dumpall_YYYYMMDD.sql | docker exec -i postgres psql -U admin

# Restore database เดียว
cat backups/n8n_db_YYYYMMDD.sql | docker exec -i postgres psql -U admin -d n8n_db
```

### 9.3 Docker Volume Backup

```bash
# ดูรายการ volumes
docker volume ls | grep ai-server

# Backup volume เดียว (ต้อง stop service ก่อน)
docker compose stop qdrant
docker run --rm -v ai-server_qdrant_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/qdrant_data_$(date +%Y%m%d).tar.gz -C /data .
docker compose start qdrant
```

### 9.4 ตั้งเวลา Backup อัตโนมัติ (crontab)

```bash
# แก้ crontab
crontab -e

# เพิ่ม: Backup PostgreSQL ทุกวัน เวลา 03:00
0 3 * * * docker exec postgres pg_dumpall -U admin > /Users/doctorboyz/ai-server/backups/pg_dumpall_$(date +\%Y\%m\%d_\%H\%M\%S).sql

# เพิ่ม: ลบ backup เก่ากว่า 30 วัน ทุกวันอาทิตย์
0 4 * * 0 find /Users/doctorboyz/ai-server/backups -name "*.sql" -mtime +30 -delete
```

### 9.5 Disaster Recovery

ถ้า server พังทั้งหมด:

1. Restore `.env` จากที่เก็บไว้อย่างปลอดภัย
2. `docker network create server-network`
3. `docker compose up -d` (รอทุก service start)
4. Restore PostgreSQL: `cat backups/pg_dumpall.sql | docker exec -i postgres psql -U admin`
5. Restore volumes ถ้ามี backup
6. ตรวจสอบทุก service: `docker compose ps`
7. ตรวจสอบ Uptime Kuma monitors

---

## 10. Security

### 10.1 Port Binding

ส่วนใหญ่ ports ผูกกับ `0.0.0.0` (ทุก interface) ยกเว้น `open-design` ที่ผูกกับ `127.0.0.1` เท่านั้น ถ้า server มี public IP ควรพิจารณา:

- ใช้ firewall (ufw/iptables) block ports ที่ไม่ต้องการ expose ภายนอก
- ใช้ Cloudflare Tunnel สำหรับ external access แทนการ expose port ตรง
- แนะนำให้เปลี่ยน binding เป็น `127.0.0.1` สำหรับ services ที่ไม่ต้องการ external access

### 10.2 Secrets Management

- **ทุก secret อยู่ใน `.env`** ซึ่งอยู่ใน `.gitignore` (ไม่ commit)
- `.env.example` เป็น template เท่านั้น (ค่า default ไม่ใช่ค่าจริง)
- `migrate.sh` สร้าง random secrets อัตโนมัติถ้ายังใช้ค่า default
- สำหรับ production ควรพิจารณาใช้ Docker secrets หรือ external vault

### 10.3 Secrets ที่ต้องเปลี่ยนทันที

| Variable | ความเสี่ยง | หมายเหตุ |
|----------|-----------|----------|
| `POSTGRES_PASSWORD` | สูง | Database access |
| `SVIX_JWT_SECRET` | สูง | Webhook authentication |
| `SVIX_WH_API_KEYS` | สูง | Webhook API access |
| `MINIO_ROOT_PASSWORD` | สูง | S3 storage access |
| `TUNNEL_TOKEN` | สูง | Cloudflare Tunnel access |
| `WEBUI_SECRET_KEY` | กลาง | Open WebUI session |
| `OPENAI_API_KEY` | สูง | API billing |

### 10.4 Firewall Considerations

```bash
# แนะนำ: block ports ที่ไม่ต้องการ expose
# เปิดเฉพาะ SSH และ Cloudflare Tunnel
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 443/tcp     # HTTPS (ผ่าน Cloudflare)
sudo ufw deny 5432/tcp     # PostgreSQL - internal only
sudo ufw deny 6379/tcp     # Redis - internal only
sudo ufw deny 6333/tcp     # Qdrant - internal only
sudo ufw deny 8080/tcp     # OpenKB API - internal only
sudo ufw enable
```

### 10.5 Open Design Hardening

Open Design เป็น service เดียวที่มี security hardening:
- `read_only: true` — container filesystem read-only
- `no-new-privileges: true` — ไม่ใช้ privilege escalation
- `mem_limit: 384m` — จำกัด memory
- `pids_limit: 256` — จำกัด process count
- `127.0.0.1` binding — localhost only
- แนะนำให้เพิ่ม hardening เดียวกันให้ services อื่น

### 10.6 ตรวจสอบการเข้าถึง

```bash
# ตรวจสอบว่า ports ไหนเปิดอยู่
sudo netstat -tlnp | grep docker

# ตรวจสอบว่ามีการเชื่อมต่อเข้ามา
docker compose logs tunnel --tail 50
```

---

## Quick Command Reference

```bash
cd ~/ai-server

# === ดูสถานะ ===
docker compose ps                              # ดูทุก container
docker compose logs <service> --tail 50 -f      # ดู log (follow)

# === Start / Stop ===
docker compose up -d                            # เริ่มทุกอย่าง
docker compose down                             # หยุดทุกอย่าง
docker compose restart <service>                # restart service เดียว
docker compose up -d --build openkb-api         # rebuild + restart

# === Database ===
docker exec -it postgres psql -U admin -d n8n_db    # เข้า n8n database
docker exec -it postgres psql -U admin -d svix_db   # เข้า svix database
docker exec -it redis redis-cli                     # เข้า Redis

# === Backup ===
docker exec postgres pg_dumpall -U admin > backups/full_$(date +%Y%m%d).sql
docker exec postgres pg_dump -U admin n8n_db > backups/n8n_$(date +%Y%m%d).sql

# === Health Check ===
curl http://localhost:8080/health                # OpenKB API
curl http://localhost:6333/healthz               # Qdrant
curl http://localhost:7456/api/health            # Open Design
curl http://localhost:9000/minio/health/live      # MinIO
docker exec -it redis redis-cli ping             # Redis

# === Cleanup ===
docker compose down --remove-orphans             # ลบ orphan containers
docker system prune -f                            # ลบ unused images/volumes
```

---

*เอกสารนี้สร้างโดย Infra Oracle จากการศึกษา ai-server codebase — 2026-05-08*