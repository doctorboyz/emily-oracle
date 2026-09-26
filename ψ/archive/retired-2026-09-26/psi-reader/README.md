# ψ-reader

> Markdown reader + notation service — อ่าน `.md` จาก iCloud Drive และทำ highlight/comment ได้โดย notes ไม่ติดไฟล์

อ่านไฟล์ `.md` ผ่าน web app ตัวเดียว เก็บ notation (highlight/comment) ใน SQLite sidecar — **ไม่แก้ไฟล์ต้นฉบับ** ใช้ iCloud Drive เป็น file backend (Apple ID เดียวกัน → ซิงค์ไป Mac/iPad อัตโนมัติ) จึงไม่ต้องลง agent บนเครื่องไหนเลย

## สถาปัตยกรรม

```
browser (Mac/iPad ใน tailnet) ──▶ reader (macmini, Docker)
                                      │  bind-mount iCloud Drive (:ro)
                                      ▼
                              ~/Library/Mobile Documents/com~apple~CloudDocs
                                      │  (Apple ID เดียวกัน → ซิงค์ไปทุกเครื่อง)
                                      ▼
                              SQLite (annotations) — /data/annotations.db
```

- **reader** — web app (React) + API (Hono) + SQLite, รัน Docker บน macmini, เข้าร่วม `server-network` ของ infra-oracle และใช้ Cloudflare tunnel ร่วม
- **file backend** = iCloud Drive ที่ bind-mount เข้า container (read-only) — ไม่ต้องมี process บนเครื่องต้นทาง
- (ทางเลือก) ถ้าไฟล์อยู่นอก iCloud ใช้ source type `agent` — ดูคอมมา ด้านล่าง

## โครงสร้าง

```
psi-reader/
├── agent/          # file server (รัน native ทุกเครื่อง)
│   ├── server.ts
│   └── launchd/com.psi-reader.agent.plist   # template auto-start (macOS)
├── reader/         # web app + API (Docker)
│   ├── server/     # Hono + better-sqlite3
│   ├── src/        # React SPA (3-pane)
│   ├── Dockerfile
│   └── docker-compose.yml
└── scripts/start-agent.sh
```

## ติดตั้ง

### 1) เตรียม iCloud Drive บน macmini

เปิด **System Settings → Apple ID → iCloud → iCloud Drive → Desktop & Documents Folders** (ถ้ายังไม่เปิด) ไฟล์ใน `~/Documents`, `~/Desktop` และไฟล์ที่สร้างบน iPad/Mac เครื่องอื่น (Apple ID เดียวกัน) จะปรากฏใน
`~/Library/Mobile Documents/com~apple~CloudDocs/` บน macmini อัตโนมัติ

> ถ้าไฟล์ `.md` ของคุณอยู่นอก iCloud ย้ายเข้า iCloud Drive หรือใช้ source type `agent` (คอมเมนต์ด้านล่าง)

### 2) reader บน macmini (Docker)

```bash
cd reader
# sources.json ตั้งแต่แรกชี้ bind-mount /files/icloud (อยู่แล้วใน repo)
docker compose up -d --build
docker compose logs -f psi-reader   # รอ health: healthy
```

ตรวจสอบ:
```bash
curl http://localhost:3010/api/health          # {"status":"ok"}
curl http://localhost:3010/api/sources         # [{"id":"icloud","label":"iCloud Drive"}]
curl "http://localhost:3010/api/tree?source=icloud&root=0"
```

เปิด browser: `http://100.121.113.38:3010` (ผ่าน Tailscale จาก Mac/iPad เครื่องไหนก็ได้ใน tailnet)

### 3) Cloudflare tunnel (ร่วมกับ infra-oracle)

ไม่สร้าง tunnel ใหม่ — ใช้ container `tunnel` ของ infra-oracle ที่รันอยู่แล้ว:

1. เข้า **Cloudflare Zero Trust → Networks → Tunnels** → เลือก tunnel ของ infra-oracle
2. **Public Hostname** tab → Add a public hostname
   - Subdomain: `reader` (หรือชื่อที่ต้องการ)
   - Domain: `<your-domain>`
   - Service: `HTTP` · URL: `psi-reader:3000`  *(ชื่อ container ใน server-network + port ใน container)*
3. บันทึก → เข้า `https://reader.<your-domain>` ได้ทันที

### (ทางเลือก) source type `agent` สำหรับไฟล์นอก iCloud

ถ้ามีโฟลเดอร์บนเครื่องอื่นที่ไม่ได้อยู่ใน iCloud ใช้ agent (Hono file server รัน native บนเครื่องนั้น, bind Tailscale IP, token):
- รัน: `./scripts/start-agent.sh <tailscale-ip> <token> '<roots>'` หรือลง launchd (`agent/launchd/com.psi-reader.agent.plist`)
- เพิ่มใน `sources.json`:
  ```json
  {"id":"macair","label":"MacBook Air","type":"agent","url":"http://100.103.150.42:7801","token":"<token>"}
  ```

## การใช้งาน

- แถบซ้าย: เลือก source → browse tree → คลิกไฟล์ `.md`
- กลาง: อ่าน markdown render สวย (GFM + code highlight)
- ขวา: รายการ notation ของไฟล์ปัจจุบัน
- **Highlight/Comment**: ลากเลือกข้อความในเนื้อหา → popup แสดงขึ้น → กด Highlight หรือ Comment
- Notation เก็บใน `reader/data/annotations.db` — reload ก็ยังอยู่ ไม่แต้ไฟล์ต้นฉบับ
- คลิก notation ในแถบขวา → scroll ไปที่ highlight นั้น

## Security

- agent bind เฉพาะ Tailscale IP (100.x) — ไม่ expose สาธารณะ
- Bearer token ทุก endpoint ยกเว้น `/healthz`
- Path traversal guard + extension allowlist (.md/.markdown/.txt + image)
- reader ไม่ส่ง agent token ออกผ่าน `/api/sources`
- `react-markdown` ปิด raw HTML (กัน XSS จากไฟล์ที่ไม่น่าเชื่อถือ)
- trust boundary = Tailscale tailnet (เครื่องใน tailnet ใช้ได้หมด; ยังไม่มี multi-user auth)

## การพัฒนา

```bash
cd reader
# terminal 1: API (serve SPA ถ้ามี dist)
SOURCES_FILE=./data/sources.json DB_PATH=./data/annotations.db PORT=3010 npx tsx server/index.ts
# terminal 2: Vite dev (hot reload frontend, proxy /api -> :3010)
npm run vite-dev
# เปิด http://localhost:5173
```

## ขอบเขต (out of scope ตอนนี้)

- TextQuoteSelector anchoring (robust ต่อการแก้ไฟล์) — ตอนนี้ใช้ snippet matching
- Full-text search
- แก้ไขไฟล์ `.md` (ตอนนี้อ่าน + annotate อย่างเดียว)
- Multi-user auth