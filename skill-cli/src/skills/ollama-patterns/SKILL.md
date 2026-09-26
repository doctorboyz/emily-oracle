---
name: ollama-patterns
description: Ollama API patterns — generate, chat, structured JSON output, embeddings, streaming, retry, prompt templating, and error handling for Node.js backends.
origin: ECC
---

# Ollama API Patterns

Patterns and best practices for integrating with Ollama's local LLM API in Node.js applications.

## When to Activate

- Connecting a Node.js backend to a local Ollama instance
- Generating text, chat, or structured JSON responses
- Implementing retry, timeout, and circuit breaker around Ollama calls
- Designing prompt templates for entity extraction, summarization, or conversation
- Handling streaming vs non-streaming responses
- Using embeddings for similarity search

## Ollama API Endpoints

| Endpoint | Purpose | Key Params |
|----------|---------|------------|
| `POST /api/generate` | Text generation from a single prompt | `model`, `prompt`, `system`, `stream`, `format`, `options` |
| `POST /api/chat` | Multi-turn chat with message history | `model`, `messages[]`, `stream`, `format`, `tools` |
| `POST /api/embed` | Generate embeddings | `model`, `input`, `truncate`, `dimensions` |
| `GET /api/version` | Check Ollama server version | — |
| `GET /api/tags` | List available models | — |

Base URL default: `http://localhost:11434`

## Connection Pattern

### Basic Service with Retry and Timeout

```javascript
// services/ollama.js
const axios = require('axios')

const DEFAULT_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1000

/**
 * @param {string} prompt
 * @param {string} [systemContext]
 * @param {{ timeout?: number, retries?: number }} [options]
 * @returns {Promise<string>}
 */
async function askOllama(prompt, systemContext = '', options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES } = options
  let lastError

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
        model: process.env.OLLAMA_MODEL,
        prompt,
        system: systemContext || 'You are a helpful assistant.',
        stream: false,
      }, { timeout })

      return response.data.response
    } catch (error) {
      lastError = error

      if (!isRetriable(error)) {
        throw mapError(error)
      }

      if (attempt < retries - 1) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
        await sleep(delay)
      }
    }
  }

  throw mapError(lastError)
}

function isRetriable(error) {
  if (error.code === 'ECONNREFUSED') return true
  if (error.code === 'ETIMEDOUT') return true
  if (error.response?.status >= 500) return true
  return false
}

function mapError(error) {
  if (error.code === 'ECONNREFUSED')
    return Object.assign(new Error('Ollama server unreachable'), { code: 'OLLAMA_UNREACHABLE' })
  if (error.code === 'ETIMEDOUT')
    return Object.assign(new Error('Ollama request timed out'), { code: 'OLLAMA_TIMEOUT' })
  if (error.response?.status === 404)
    return Object.assign(new Error(`Model not found: ${process.env.OLLAMA_MODEL}`), { code: 'OLLAMA_MODEL_NOT_FOUND' })
  return Object.assign(new Error(error.message), { code: 'OLLAMA_ERROR' })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { askOllama }
```

## Chat API (Multi-turn)

Use `/api/chat` for conversations with message history:

```javascript
/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ systemContext?: string, timeout?: number }} [options]
 * @returns {Promise<string>}
 */
async function chatOllama(messages, options = {}) {
  const { systemContext, timeout = 30_000 } = options

  const allMessages = systemContext
    ? [{ role: 'system', content: systemContext }, ...messages]
    : messages

  const response = await axios.post(`${process.env.OLLAMA_URL}/api/chat`, {
    model: process.env.OLLAMA_MODEL,
    messages: allMessages,
    stream: false,
  }, { timeout })

  return response.data.message.content
}
```

### Message Format

```javascript
const messages = [
  { role: 'user', content: 'What is the capital of Thailand?' },
  // After response, append:
  { role: 'assistant', content: 'The capital of Thailand is Bangkok.' },
  { role: 'user', content: 'What about its population?' },
]
```

## Structured JSON Output

Ollama supports two modes for structured output:

### Mode 1: Generic JSON (`format: "json"`)

```javascript
const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
  model: OLLAMA_MODEL,
  messages: [{ role: 'user', content: 'Extract entities from: "Alice works at Google"' }],
  stream: false,
  format: 'json',  // Forces valid JSON output
})
```

### Mode 2: JSON Schema (`format: { type: "object", ... }`)

```javascript
const entitySchema = {
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
        },
        required: ['name', 'type'],
      },
    },
    relations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          relation: { type: 'string' },
        },
        required: ['from', 'to', 'relation'],
      },
    },
  },
  required: ['entities', 'relations'],
}

const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
  model: OLLAMA_MODEL,
  messages: [{ role: 'user', content: 'Extract entities and relations from: "Bob is friends with Alice"' }],
  stream: false,
  format: entitySchema,
})
```

**Important:** Even with `format`, always validate the output with a schema validator (Zod, Ajv) before using it. LLMs can still produce invalid or unexpected data.

## Prompt Template Patterns

### Entity Extraction Prompt

```javascript
const EXTRACTION_PROMPT = `You are an entity and relation extraction engine.
Analyze the text and extract all named entities and their relationships.

Rules:
- Extract people, organizations, places, and things as entities
- Each entity has a "name" and "type" (person, org, place, thing)
- Relations connect two entities with a descriptive "relation" verb
- Be precise: prefer specific types over generic ones

Text: """{text}"""

Respond with JSON only.`
```

### Context Assembly Prompt

```javascript
function buildPromptWithContext(userMessage, graphContext) {
  const systemContext = graphContext
    ? `You are Bob, a helpful assistant. You have the following knowledge about people and things:\n\n${graphContext}\n\nUse this knowledge when relevant to answer questions. If the knowledge doesn't help, answer based on your general knowledge.`
    : 'You are Bob, a helpful assistant.'

  return { userMessage, systemContext }
}
```

### Conversation Context Prompt

```javascript
function buildConversationHistory(pastMessages, maxMessages = 10) {
  // Keep only recent messages to fit context window
  const recent = pastMessages.slice(-maxMessages)

  return recent.map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text,
  }))
}
```

## Streaming

Streaming uses NDJSON (newline-delimited JSON). Each chunk has `done: false` until the final chunk:

```javascript
async function* streamOllama(prompt, systemContext = '') {
  const response = await axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
    model: process.env.OLLAMA_MODEL,
    prompt,
    system: systemContext,
    stream: true,
  }, { responseType: 'stream' })

  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n').filter(Boolean)
    for (const line of lines) {
      const parsed = JSON.parse(line)
      if (parsed.response) {
        yield parsed.response
      }
      if (parsed.done) return
    }
  }
}
```

**Tip:** For MVP, use `stream: false` (simpler). Add streaming when latency optimization is needed (Phase 4).

## Health Check Pattern

```javascript
async function checkOllamaHealth() {
  try {
    const response = await axios.get(`${process.env.OLLAMA_URL}/api/version`, {
      timeout: 5_000,
    })
    return { connected: true, version: response.data.version }
  } catch {
    return { connected: false, version: null }
  }
}
```

## Embeddings

```javascript
async function getEmbedding(text) {
  const response = await axios.post(`${process.env.OLLAMA_URL}/api/embed`, {
    model: process.env.OLLAMA_EMBED_MODEL || process.env.OLLAMA_MODEL,
    input: text,
  }, { timeout: 30_000 })

  return response.data.embeddings[0]
}
```

**Note:** Use a dedicated embedding model (e.g., `nomic-embed-text`) for better quality and performance.

## Error Handling Summary

| Error Code | Cause | Action |
|------------|-------|--------|
| `ECONNREFUSED` | Ollama not running | Log + retry |
| `ETIMEDOUT` | Request timeout | Log + retry with backoff |
| 404 | Model not found | Fail fast, no retry |
| 500 | Ollama internal error | Log + retry |
| Invalid JSON output | LLM hallucination | Validate with Zod, fallback |

## Checklist

- [ ] Config: OLLAMA_URL + OLLAMA_MODEL from env vars, validated at startup
- [ ] Timeout: Always set a timeout (default 30s)
- [ ] Retry: Exponential backoff for retriable errors only (not 404)
- [ ] Validation: Always validate LLM JSON output with schema validator
- [ ] No trust: LLM output is external input — sanitize before storing or displaying
- [ ] Logging: Structured log for every Ollama call (model, prompt length, duration, status)
- [ ] Health check: Expose endpoint that verifies Ollama connectivity