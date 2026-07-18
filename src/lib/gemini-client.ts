/**
 * Gemini AI Client
 *
 * Thin wrapper around the Google Gemini REST API that exposes the same
 * `chat.completions.create` shape used across the codebase, so routes
 * and service files need only call `.chat.completions.create(...)`.
 *
 * Required environment variable: GEMINI_API_KEY
 */

export const MODEL_PRO = 'gemini-1.5-pro';
export const MODEL_FLASH = 'gemini-1.5-flash';

export interface ChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: string };
  maxOutputTokens?: number;
  topP?: number;
  requestType?: string;
}

export interface ChatCompletionResponse {
  choices: Array<{ message: { content: string | null } }>;
}

export class GeminiClient {
  private readonly apiKey: string;
  static readonly DEFAULT_MODEL = 'gemini-2.0-flash';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get chat() {
    return {
      completions: {
        create: async (params: ChatCompletionParams): Promise<ChatCompletionResponse> => {
          const systemMsg = params.messages.find(m => m.role === 'system');
          const contents = params.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            }));

          const systemInstruction = systemMsg
            ? { parts: [{ text: systemMsg.content }] }
            : undefined;

          const generationConfig: {
            temperature?: number;
            responseMimeType?: string;
            maxOutputTokens?: number;
            topP?: number;
          } = {};
          if (params.temperature !== undefined) {
            generationConfig.temperature = params.temperature;
          }
          if (params.maxOutputTokens !== undefined) {
            generationConfig.maxOutputTokens = params.maxOutputTokens;
          }
          if (params.topP !== undefined) {
            generationConfig.topP = params.topP;
          }
          if (params.response_format?.type === 'json_object') {
            generationConfig.responseMimeType = 'application/json';
          }

          let activeModel = params.model;
          let url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          try {
            let res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents, systemInstruction, generationConfig }),
              signal: controller.signal,
            });

            // Graceful fallback to standard model if premium fails
            if (!res.ok && activeModel === MODEL_PRO) {
              console.warn(`[gemini-client] Model ${activeModel} failed with status ${res.status}. Falling back to ${MODEL_FLASH}.`);
              activeModel = MODEL_FLASH;
              url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;
              res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, systemInstruction, generationConfig }),
                signal: controller.signal,
              });
            }

            if (!res.ok) {
              const errText = await res.text();
              if (res.status === 429 || errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('rate limit')) {
                throw new Error('AI_RATE_LIMIT_EXHAUSTED');
              }
              if (res.status === 400 || res.status === 403) {
                if (errText.toLowerCase().includes('key') || errText.toLowerCase().includes('invalid')) {
                  throw new Error('GEMINI_INVALID_KEY');
                }
              }
              throw new Error(`Gemini API error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

            return { choices: [{ message: { content: text } }] };
          } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
              throw new Error('AI_TIMEOUT');
            }
            throw err;
          } finally {
            clearTimeout(timeoutId);
          }
        },
      },
    };
  }
}

/**
 * Returns an initialised GeminiClient.
 * Throws a descriptive error if GEMINI_API_KEY is not set so the
 * calling route can return a proper 500 response.
 */
export function getGeminiClient(): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_KEY_MISSING');
  }
  return new GeminiClient(apiKey);
}
