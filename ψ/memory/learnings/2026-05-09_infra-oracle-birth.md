# Infra Oracle Birth — Docker Stack + Fleet Registration

**Learned**: 2026-05-09
**Source**: rrr: emily-oracle
**Context**: Setting up ai-server infrastructure, Docker-izing open-design, registering Infra Oracle in maw fleet

## Pattern

Repo ที่มี Docker setup อยู่แล้ว (deploy/Dockerfile, docker-compose.yml) ไม่ต้องสร้างใหม่ — ใช้ pre-built image + แก้ .env พอ
Cloudflare tunnel แบบ token-based ควบคุม routes ผ่าน Dashboard ได้โดยไม่ต้อง restart container

## Docker Integration Pattern

เมื่อเพิ่ม service เข้า Docker stack ที่มีอยู่แล้ว:
1. เพิ่ม service ใน docker-compose.yml ของ stack หลัก ไม่ใช้ compose แยก
2. เชื่อม external network เดียวกัน (server-network) เพื่อให้ tunnel container เห็นชื่อได้
3. ผูก port กับ `127.0.0.1` ไม่ใช่ `0.0.0.0` เพื่อความปลอดภัย
4. เพิ่ม health check ทุก service
5. ตั้งค่า `OD_ALLOWED_ORIGINS` หรือเทียบเท่าสำหรับ CORS

## Security Gaps Found

open-design มี Docker security hardening ดี (read_only, no-new-privileges, mem_limit, pids_limit) แต่ services อื่นใน stack ไม่มี — ต้องเพิ่มให้ทุก container
Health checks มีแค่ 3/11 services (postgres, redis, open-design) — ต้องเพิ่มให้ครบ

## Maw Fleet Registration

maw wake ไม่รองรับ path นอก ghq root — ต้องใช้ `maw bud` แทน
maw bud สร้าง repo ใหม่ตาม Oracle naming convention แม้ว่าจะมี repo อยู่แล้ว
แก้ด้วยการตั้ง fleet config ให้มี 2 windows: infra-oracle (repo หลัก) + ai-server (infrastructure จริง)