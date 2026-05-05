# Docker Infrastructure Patterns for Oracle Ecosystem

> Lessons from rebuilding ai-server from 5 to 10 services

## Key Patterns

### Container Naming
- Use simple, descriptive names: `postgres` not `ai-db`, `redis` not `ai-cache`
- Names should be self-explanatory — a new team member should understand the stack from `docker compose ps`

### Database Strategy
- One PostgreSQL container with multiple databases (n8n_db, svix_db) > separate containers per DB
- Use `init-db.sh` in `/docker-entrypoint-initdb.d/` for automatic DB creation
- Remove pgvector if qdrant handles all vector operations — keeps image size down

### Environment Variables
- Always check `.env` completeness before `docker compose up`
- Generate secrets (JWT, API keys, passwords) with `openssl rand -hex 32`
- Never commit `.env` — only commit `.env.example`

### Service Communication
- All internal services use `server-network` (external Docker network)
- Services communicate by container name (e.g., `postgres:5432`, `redis:6379`)
- Only services receiving external webhooks need a tunnel (Svix)

### Health Checks
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Services that depend on DB should use `depends_on: condition: service_healthy`

### Migration Lessons
- Always use `docker compose up -d --remove-orphans` when renaming/removing services
- Old containers from previous compose files become orphans — they block ports
- Backup databases before migration: `docker exec postgres pg_dumpall -U admin > backup.sql`

### Webhook Architecture (Svix)
- Svix is API-first: agents create endpoints and send events via REST
- No UI needed — everything through API calls
- Uses PostgreSQL for persistence and Redis for queue/retry
- JWT_SECRET must be stable — changing it invalidates all tokens

### Knowledge Base (OpenKB)
- CLI tool wrapped in FastAPI for REST access
- Chat endpoint calls Ollama directly via OpenAI-compatible API (not openkb CLI)
- Document processing is async (background task) — can take minutes for large files
- OpenKB config.yaml must be created before any CLI commands work