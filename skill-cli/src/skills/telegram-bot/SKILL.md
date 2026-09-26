# Telegram Bot Best Practices

## Trigger
When the user asks to create, configure, or debug a Telegram bot — including env var setup, bot creation, notification design, polling, or security.

## Core Rules

### 1. Namespaced Environment Variables (CRITICAL)

**NEVER use generic env var names.** Always suffix with the project/bot name to prevent conflicts when multiple bots run on the same machine.

```
# WRONG — conflicts with any other Telegram bot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# CORRECT — unique per project
TELEGRAM_BOT_TOKEN_XAUUSD=...
TELEGRAM_CHAT_ID_XAUUSD=...

TELEGRAM_BOT_TOKEN_ALERTS=...
TELEGRAM_CHAT_ID_ALERTS=...
```

**Why:** Generic names like `TELEGRAM_BOT_TOKEN` get picked up by the wrong bot. If you have 3 bots on one machine, they'll all read the same token. This causes messages to go to the wrong chat or the wrong bot.

**How to apply:** When creating a new bot, name env vars as `TELEGRAM_BOT_TOKEN_{PROJECT}` and `TELEGRAM_CHAT_ID_{PROJECT}`. Update the Python code that reads these vars accordingly.

### 2. Bot Creation Checklist

1. **Create bot:** Message [@BotFather](https://t.me/BotFather) → `/newbot` → choose name → get token
2. **Get Chat ID:** Message [@userinfobot](https://t.me/userinfobot) → get your numeric chat ID
3. **Store in `.env`:**
   ```
   TELEGRAM_BOT_TOKEN_MYPROJECT=123456:ABC-DEF...
   TELEGRAM_CHAT_ID_MYPROJECT=987654321
   ```
4. **Never commit `.env`** — add to `.gitignore`
5. **Provide `.env.example`** with placeholder values clearly marked:
   ```
   TELEGRAM_BOT_TOKEN_MYPROJECT=YOUR_BOT_TOKEN_HERE
   TELEGRAM_CHAT_ID_MYPROJECT=YOUR_CHAT_ID_HERE
   ```

### 3. Notification Design — Less is More

**Avoid notification fatigue.** Most projects fail at Telegram integration because they send too many messages.

| Message Type | Frequency | Rationale |
|-------------|-----------|-----------|
| Daily summary | 1/day | Core report — always send |
| Error/Crash | On event | Must know immediately |
| Circuit breaker / Margin call | On event | Critical risk events |
| Trade entry/exit | **Never** | Too noisy; daily summary covers it |
| Heartbeat | Every 2-4h | Confirms system alive; not more often |

**Rule of thumb:** If a notification fires more than 10 times per day, it's too frequent. Aggregate into summaries.

### 4. Two-Way Command Pattern

Use `getUpdates` long-polling for receiving commands (not webhooks) for simplicity:

```python
def poll_commands(self, last_update_id: int = 0) -> Tuple[List[dict], int]:
    """Long-poll Telegram for incoming commands."""
    resp = requests.get(
        self._url("getUpdates"),
        params={"offset": last_update_id + 1, "timeout": 3, "limit": 10},
        timeout=8,
    )
    # ... process only messages from authorized chat_id
```

**Security:** Always verify `chat_id` matches your configured ID. Ignore messages from other chats.

### 5. Error Resilience

- **Never crash on Telegram errors.** Log and continue. The bot is supplementary, not critical path.
- **Retry with backoff** on network errors (max 3 retries).
- **Message length:** Telegram limits 4096 chars per message. Chunk long messages.
- **HTML parse mode:** If HTML parsing fails, retry as plain text.
- **Timeout:** Use 10s timeout for sends, 8s for polling.

### 6. Architecture Pattern

```python
class TelegramNotifier:
    """Lightweight sender — stdlib + requests only. No heavy bot library."""

    def __init__(self, token: str = None, chat_id: str = None):
        _load_env()
        self.token = token or os.environ.get("TELEGRAM_BOT_TOKEN_XAUUSD", "")
        self.chat_id = chat_id or os.environ.get("TELEGRAM_CHAT_ID_XAUUSD", "")
        self.enabled = bool(self.token and self.chat_id)

    def send(self, text: str, parse_mode: str = "HTML") -> bool:
        """Core send — all other methods use this."""

    def send_daily_report(self, ...):    # 1/day
    def send_error(self, ...):           # on event
    def send_circuit_breaker(self, ...): # on event
    def poll_commands(self, ...):        # two-way
```

**Do NOT use** `python-telegram-bot` or similar heavy libraries for simple notification bots. Use `requests` directly against the Bot API. Keep it lightweight.

### 7. .env Loading

```python
def _load_env():
    """Load .env file if exists (no dotenv dependency)."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip())
```

This avoids requiring `python-dotenv` as a dependency.

### 8. Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Messages go to wrong bot/chat | Use namespaced env vars (`_XAUUSD` suffix) |
| Bot spams 50+ messages/day | Remove per-trade alerts; use daily summaries only |
| Bot crashes on network error | Wrap all sends in try/except; log errors; continue |
| `.env` with real tokens committed | Add `.env` to `.gitignore`; provide `.env.example` |
| Webhook vs polling complexity | Use long-polling (`getUpdates`) for simple bots |
| Generic env var name conflicts | Always namespace: `TELEGRAM_BOT_TOKEN_{PROJECT}` |
| Old updates re-processed | Track `last_update_id` and always pass `offset + 1` |
| Bot token in code (not .env) | Always read from env var, never hardcode |

## File Template: telegram_notifier.py

When creating a new Telegram notifier for a project, use this template:

```python
#!/usr/bin/env python3
"""
Telegram Notifier — {PROJECT_NAME}
Uses only stdlib + requests.
Env vars: TELEGRAM_BOT_TOKEN_{PROJECT}, TELEGRAM_CHAT_ID_{PROJECT}
"""
import os
import logging
import traceback
from typing import List, Tuple, Optional

import requests

logger = logging.getLogger(__name__)

PROJECT = "{PROJECT}"  # e.g. "XAUUSD", "ALERTS"
ENV_TOKEN = f"TELEGRAM_BOT_TOKEN_{PROJECT}"
ENV_CHAT = f"TELEGRAM_CHAT_ID_{PROJECT}"


def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip())


class TelegramNotifier:
    BASE_URL = "https://api.telegram.org/bot{token}/"

    def __init__(self, token: str = None, chat_id: str = None):
        _load_env()
        self.token = token or os.environ.get(ENV_TOKEN, "")
        self.chat_id = chat_id or os.environ.get(ENV_CHAT, "")
        self.enabled = bool(self.token and self.chat_id)
        if not self.enabled:
            logger.warning(f"Telegram DISABLED — set {ENV_TOKEN} and {ENV_CHAT}")

    def _url(self, method: str) -> str:
        return f"https://api.telegram.org/bot{self.token}/{method}"

    def send(self, text: str, parse_mode: str = "HTML") -> bool:
        if not self.enabled:
            return False
        try:
            chunks = [text[i:i+4096] for i in range(0, len(text), 4096)]
            for chunk in chunks:
                resp = requests.post(
                    self._url("sendMessage"),
                    json={
                        "chat_id": self.chat_id,
                        "text": chunk,
                        "parse_mode": parse_mode,
                        "disable_web_page_preview": True,
                    },
                    timeout=10,
                )
                if resp.status_code != 200:
                    if resp.status_code == 400 and parse_mode == "HTML":
                        resp = requests.post(
                            self._url("sendMessage"),
                            json={
                                "chat_id": self.chat_id,
                                "text": chunk,
                                "disable_web_page_preview": True,
                            },
                            timeout=10,
                        )
                    resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Telegram send failed: {e}")
            return False

    def send_error(self, context: str, error: Exception) -> bool:
        tb = traceback.format_exception(type(error), error, error.__traceback__)
        return self.send(
            f"ERROR — {context}\n"
            f"{type(error).__name__}: {error}\n"
            f"{''.join(tb[-3:])[:500]}"
        )

    def poll_commands(self, last_update_id: int = 0) -> Tuple[List[dict], int]:
        if not self.enabled:
            return [], last_update_id
        try:
            resp = requests.get(
                self._url("getUpdates"),
                params={"offset": last_update_id + 1, "timeout": 3, "limit": 10},
                timeout=8,
            )
            if resp.status_code != 200:
                return [], last_update_id
            data = resp.json()
            if not data.get("ok"):
                return [], last_update_id
            commands = []
            max_id = last_update_id
            for update in data.get("result", []):
                update_id = update.get("update_id", 0)
                max_id = max(max_id, update_id)
                msg = update.get("message") or update.get("edited_message", {})
                chat_id = str(msg.get("chat", {}).get("id", ""))
                if chat_id != str(self.chat_id):
                    continue
                text = msg.get("text", "").strip()
                if text.startswith("/"):
                    commands.append({"text": text, "from": msg.get("from", {})})
            return commands, max_id
        except requests.exceptions.Timeout:
            return [], last_update_id
        except Exception as e:
            logger.error(f"Telegram poll error: {e}")
            return [], last_update_id

_notifier: Optional[TelegramNotifier] = None

def get_notifier() -> TelegramNotifier:
    global _notifier
    if _notifier is None:
        _notifier = TelegramNotifier()
    return _notifier
```

## File Template: .env.example

```
# {PROJECT} Telegram Bot Configuration
# ─────────────────────────────────────
# 1. Create bot: @BotFather → /newbot → get BOT_TOKEN
# 2. Get Chat ID: @userinfobot → get CHAT_ID
# 3. Copy this file to .env and fill in values

TELEGRAM_BOT_TOKEN_{PROJECT}=YOUR_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID_{PROJECT}=YOUR_CHAT_ID_HERE
```

## Wiring

This skill has no hooks — it is a reference skill invoked manually via `/telegram-bot` or when the user asks about Telegram bot setup.