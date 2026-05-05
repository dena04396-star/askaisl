import OpenAI from "openai";

function createAiClient(): OpenAI {
  // Groq — fastest inference, OpenAI-compatible
  if (process.env.GROQ_API_KEY) {
    return new OpenAI({
      apiKey:  process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    return new OpenAI({
      apiKey:  process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Askaisl",
      },
    });
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return new OpenAI({
      apiKey:  process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing AI key. Set GROQ_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, or DEEPSEEK_API_KEY in .env.local"
    );
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getModelName(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (process.env.GROQ_API_KEY)       return "llama-3.3-70b-versatile";
  if (process.env.OPENROUTER_API_KEY) return "deepseek/deepseek-chat";
  if (process.env.DEEPSEEK_API_KEY)   return "deepseek-chat";
  return "gpt-4o-mini";
}

let _client: OpenAI | null = null;

export function getAiClient(): OpenAI {
  if (!_client) _client = createAiClient();
  return _client;
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getAiClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
