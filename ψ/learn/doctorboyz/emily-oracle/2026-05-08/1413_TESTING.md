# Testing & Quality Patterns: Emily Oracle Ecosystem

> สำรวจเมื่อ: 2026-05-08 | Mode: deep (5 agents)

## สรุป

ระบบใช้ practical runtime verification แทน unit test frameworks — ยกเว้น god-port-oracle ที่มี pytest suite (8 test files) ส่วน oracle อื่นๆ ไม่มี formal tests

## Verification Patterns ที่ใช้จริง

### Shell Script Verification
- `dispatch.sh`: ส่ง Telegram → เขียน dispatch log → พิมพ์ "Message sent: DSP-..."
- `notify-nexus.sh`: เขียน inbox + dispatch + Telegram → พิมพ์ "notify-nexus: MSG-..."
- `session-summary.sh`: เขียน inbox + dispatch + Telegram → พิมพ์ "session-summary: MSG-..."

### Daemon Verification
- nexus-daemon.py: ส่ง "Daemon started" เมื่อเริ่ม → ยืนยัน bot connection
- แต่ละ command (`/status`, `/inbox`) return output → implicit verification
- Poll loop error resilience: catch exceptions, continue

### Manual Testing Done During Consolidation
1. `dispatch.sh --message "test"` → ส่ง Telegram ได้ + dispatch log
2. `notify-nexus.sh emily test "hello"` → inbox file + dispatch log + Telegram
3. `session-summary.sh emily` → inbox file + dispatch log + Telegram
4. `inject-hook.sh kappy` → settings.json updated + script created

## Error Handling Patterns

### ระดับ Strictness ต่างกัน

| Script | Strictness | เหตุผล |
|--------|-----------|--------|
| dispatch.sh | `set -euo pipefail` | ต้อง fail fast |
| notify-nexus.sh | `set -uo pipefail` (no -e) | best-effort, ไม่ crash |
| session-summary.sh | `set -uo pipefail` (no -e) | best-effort |
| inbox-watcher.sh | no strict mode | daemon, ต้องไม่ crash |
| inject-hook.sh | `set -e` | ต้องสำเร็จทั้งหมด |

### Graceful Degradation
```bash
# Telegram send fails → warning, not crash
curl ... > /dev/null 2>&1 || echo "Warning: Telegram send failed"

# Python daemon → catch all exceptions, continue polling
except Exception as e:
    print(f"Poll error: {e}")
```

## ช่องโหว่ที่ควรเพิ่มการทดสอบ

### Critical
1. **ไม่มี integration test สำหรับ MSG-ACK-RESULT protocol** — message อาจถูกเขียนแต่ไม่ถูก process โดยไม่มี timeout/escalation
2. **dispatch.sh สร้าง JSON payload ด้วย Python string substitution** — ข้อความที่มี quotes/newlines/special chars อาจทำให้ JSON พัง
3. **ไม่มี test สำหรับ Stop hooks** — hook ล้มเหลวจะถูกเพิกเฉยโดยไม่มี notification
4. **ไม่มี daemon health monitoring** — ไม่มี watchdog, heartbeat, auto-restart

### Important
5. **ไม่มี test สำหรับ credential file missing/corrupt** — หลาย script อ่าน telegram.json ด้วย inline Python ที่เพิกเฉย parse errors
6. **ไม่มี concurrent access protection** — หลาย oracle เขียน inbox เดียวกันพร้อมกัน ไม่มี locking
7. **msg_generate_id() ใช้ file counting** — อาจซ้ำถ้าไฟล์ถูกลบหรือเขียนพร้อมกัน

### Nice to Have
8. **session-report-to-nexus.sh ไม่มี `set -e`** — อาจล้มเงียบ
9. **inbox-watcher ไม่มี restart logic** — ถ้า fswatch crash ต้องเริ่มใหม่เอง
10. **ไม่มี cross-platform test** — `sed -i ''` ใช้ได้บน macOS เท่านั้น