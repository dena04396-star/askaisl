import OpenAI from "openai";

/**
 * Returns a modular AI client.
 * Priority: DeepSeek (if DEEPSEEK_API_KEY is set) → OpenAI (OPENAI_API_KEY)
 *
 * Both use the OpenAI-compatible SDK since DeepSeek exposes an OpenAI-compatible API.
 */
function createAiClient(): OpenAI {
  if (process.env.DEEPSEEK_API_KEY) {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing AI API key. Set OPENAI_API_KEY or DEEPSEEK_API_KEY in your .env.local file."
    );
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * The active model name, resolved based on the provider in use.
 * Override by setting AI_MODEL env var.
 */
export function getModelName(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (process.env.DEEPSEEK_API_KEY) return "deepseek-chat";
  return "gpt-4o";
}

let _client: OpenAI | null = null;

/** Lazily initialised AI client – throws at call time if no key is configured. */
export function getAiClient(): OpenAI {
  if (!_client) {
    _client = createAiClient();
  }
  return _client;
}

/**
 * Named export kept for backwards-compat with existing imports.
 * Uses a Proxy so the client is still lazy but callers can write `openai.chat…`
 */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getAiClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
