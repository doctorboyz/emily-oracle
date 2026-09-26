import type { ReadingPeriod } from "../features/reading/reading-engine";

// === OpenRouter LLM Client ===
// All models via OpenRouter (cloud) — no local Ollama dependency

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  cost: string;
  thaiQuality: number;
  speed: number;
  provider: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  "gemini-2.5-flash": {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "เร็วมาก ถูก ภาษาไทยดี",
    cost: "$0.30/M in, $2.50/M out",
    thaiQuality: 4,
    speed: 5,
    provider: "google",
  },
  "deepseek-v4-flash": {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    description: "คิดลึก ราคาประหยัด ภาษาไทยดี",
    cost: "$0.10/M in, $0.20/M out",
    thaiQuality: 4,
    speed: 4,
    provider: "deepseek",
  },
  "qwen3.5-flash": {
    id: "qwen/qwen3.5-flash-02-23",
    name: "Qwen 3.5 Flash",
    description: "ภาษาเอเชียดี ถูกที่สุด",
    cost: "$0.065/M in, $0.26/M out",
    thaiQuality: 4,
    speed: 5,
    provider: "alibaba",
  },
  "glm-5.1": {
    id: "thudm/glm-4-32b:free",
    name: "GLM 4 32B",
    description: "ฟรี ภาษาเอเชียดี",
    cost: "ฟรี",
    thaiQuality: 4,
    speed: 3,
    provider: "tsinghua",
  },
  "deepseek-v4-free": {
    id: "deepseek/deepseek-v4-flash:free",
    name: "DeepSeek V4 (ฟรี)",
    description: "ฟรี คิดลึก ภาษาไทยดี",
    cost: "ฟรี",
    thaiQuality: 4,
    speed: 3,
    provider: "deepseek",
  },
};

type ModelKey = keyof typeof AVAILABLE_MODELS;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatResponse {
  text: string;
  model: string;
  modelName: string;
  tokensUsed: { prompt: number; completion: number; total: number };
  period?: ReadingPeriod;
}

function getModelByKey(key: string): ModelConfig | undefined {
  return AVAILABLE_MODELS[key];
}

function findModelById(modelId: string): ModelConfig | undefined {
  return Object.values(AVAILABLE_MODELS).find((m) => m.id === modelId);
}

export function getModelInfo(modelKey?: string): ModelConfig {
  const key = (modelKey ?? process.env.DEFAULT_MODEL_KEY ?? "gemini-2.5-flash") as ModelKey;
  return AVAILABLE_MODELS[key] ?? AVAILABLE_MODELS["gemini-2.5-flash"];
}

export function getDefaultModelId(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL ?? getModelInfo().id;
}

// Random model selection with fallback chain
// All via OpenRouter — prioritizes quality/price ratio
const FALLBACK_ORDER: string[] = [
  "google/gemini-2.5-flash",
  "deepseek/deepseek-v4-flash",
  "qwen/qwen3.5-flash-02-23",
  "thudm/glm-4-32b:free",
  "deepseek/deepseek-v4-flash:free",
];

export function getRandomModelId(): string {
  return FALLBACK_ORDER[Math.floor(Math.random() * FALLBACK_ORDER.length)];
}

function buildHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://horoline.app",
    "X-Title": "Horoline",
  };
}

export async function sendChat(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<ChatResponse> {
  const requestedId = options?.model ?? getDefaultModelId();
  const fallbackModels = FALLBACK_ORDER.filter((m) => m !== requestedId);
  const modelsToTry = [requestedId, ...fallbackModels];

  let lastError: Error | null = null;

  for (const modelToTry of modelsToTry) {
    const modelConfig = findModelById(modelToTry) ?? getModelByKey(modelToTry);
    const defaultConfig = getModelInfo();
    const finalConfig = modelConfig ?? defaultConfig;
    const modelId = finalConfig.id;
    const modelName = finalConfig.name;

    try {
      const headers = buildHeaders();

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${modelName} (${modelId}) failed: ${response.status} — trying next`);
        lastError = new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        continue;
      }

      const data = (await response.json()) as OpenAIResponse;
      const choice = data.choices[0];

      if (!choice?.message?.content) {
        console.warn(`Model ${modelName} returned empty content — trying next`);
        lastError = new Error(`${modelName} returned empty response`);
        continue;
      }

      return {
        text: choice.message.content,
        model: data.model ?? modelId,
        modelName,
        tokensUsed: {
          prompt: data.usage?.prompt_tokens ?? 0,
          completion: data.usage?.completion_tokens ?? 0,
          total: data.usage?.total_tokens ?? 0,
        },
      };
    } catch (err) {
      console.warn(
        `Model ${modelName} error: ${err instanceof Error ? err.message : String(err)} — trying next`,
      );
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("All models failed");
}

export { AVAILABLE_MODELS };
