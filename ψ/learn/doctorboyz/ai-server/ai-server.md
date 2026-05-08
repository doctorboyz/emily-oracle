# ai-server Learning Index

## Source
- **Origin**: ./origin/
- **GitHub**: https://github.com/doctorboyz/ai-server (private)

## Explorations

### 2026-05-08 2059 (deep)
- [[2026-05-08/2059_ARCHITECTURE|Architecture]]
- [[2026-05-08/2059_CODE-SNIPPETS|Code Snippets]]
- [[2026-05-08/2059_QUICK-REFERENCE|Quick Reference]]
- [[2026-05-08/2059_TESTING|Testing]]
- [[2026-05-08/2059_API-SURFACE|API Surface]]

**Key insights**:
- 11 services ใน server-network เดียว — ทุกอย่างเชื่อมกันด้วย container name
- open-design มี Docker security hardening ดีที่สุด (read_only, no-new-privileges, mem/pids limit, 127.0.0.1 bind)
- openkb-api ไม่มี auth, CORS เปิดหมด, chat sessions เก็บใน memory
- Health checks มีแค่ 3/11 services (postgres, redis, open-design)
- Cloudflare Tunnel ใช้ token-based ควบคุมผ่าน Dashboard เพิ่ม route ไม่ต้อง restart