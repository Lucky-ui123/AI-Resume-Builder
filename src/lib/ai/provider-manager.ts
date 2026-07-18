import { GeminiClient, ChatCompletionParams, ChatCompletionResponse, MODEL_PRO, MODEL_FLASH } from '../gemini-client';
import { saveAiProviderLog } from '../db-service';

export interface AIResponse {
  content: string;
  provider: 'gemini' | 'groq';
  model: string;
  choices: Array<{ message: { content: string | null } }>;
  metadata: {
    provider: 'gemini' | 'groq';
    model: string;
    fallback: boolean;
    fallbackReason: string | null;
    timestamp: Date;
  };
}

const GROQ_MODEL_MAP: Record<string, string> = {
  [MODEL_PRO]: 'llama-3.3-70b-versatile',
  [MODEL_FLASH]: 'llama-3.1-8b-instant',
  'gemini-2.0-flash': 'llama-3.1-8b-instant',
};

interface GroqRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  response_format?: { type: string };
}

export class GroqProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    const groqModel = GROQ_MODEL_MAP[params.model] || 'llama-3.1-8b-instant';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const body: GroqRequestBody = {
      model: groqModel,
      messages: params.messages,
    };

    if (params.temperature !== undefined) {
      body.temperature = params.temperature;
    }
    if (params.maxOutputTokens !== undefined) {
      body.max_tokens = params.maxOutputTokens;
    }
    if (params.topP !== undefined) {
      body.top_p = params.topP;
    }
    if (params.response_format) {
      body.response_format = params.response_format;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429 || errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('rate limit')) {
          throw new Error('GROQ_RATE_LIMIT_EXHAUSTED');
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error('GROQ_INVALID_KEY');
        }
        throw new Error(`Groq API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      return { choices: [{ message: { content: text } }] };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('GROQ_TIMEOUT');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function getGroqProvider(): GroqProvider {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_KEY_MISSING');
  }
  return new GroqProvider(apiKey);
}

export class AIProviderManager {
  async create(params: ChatCompletionParams): Promise<AIResponse> {
    let geminiErrorReason: string | null = null;
    const forceFailure = process.env.TEST_AI_PROVIDER_FAILURE === 'true';
    const startTime = Date.now();

    // 1. Try Gemini Client (Primary)
    if (!forceFailure) {
      try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
          throw new Error('GEMINI_KEY_MISSING');
        }
        const geminiClient = new GeminiClient(geminiApiKey);
        const res = await geminiClient.chat.completions.create(params);
        
        const contentText = res.choices[0]?.message?.content ?? '';

        if (!contentText || contentText.trim() === '') {
          throw new Error('Empty or invalid response from Gemini');
        }

        console.log('[AI Provider] Gemini successful');

        const latency = Date.now() - startTime;
        saveAiProviderLog({
          provider: 'gemini',
          model: params.model,
          success: true,
          latency_ms: latency,
          fallback_used: false,
          request_type: params.requestType
        }).catch(err => console.warn('[telemetry] failed:', err));

        return {
          content: contentText,
          provider: 'gemini',
          model: params.model,
          choices: [{ message: { content: contentText } }],
          metadata: {
            provider: 'gemini',
            model: params.model,
            fallback: false,
            fallbackReason: null,
            timestamp: new Date()
          }
        };
      } catch (err: unknown) {
        geminiErrorReason = err instanceof Error ? err.message : String(err);
        const latency = Date.now() - startTime;
        saveAiProviderLog({
          provider: 'gemini',
          model: params.model,
          success: false,
          latency_ms: latency,
          fallback_used: true,
          error_type: geminiErrorReason,
          request_type: params.requestType
        }).catch(err => console.warn('[telemetry] failed:', err));
      }
    } else {
      geminiErrorReason = 'Forced Gemini failure via TEST_AI_PROVIDER_FAILURE';
      const latency = Date.now() - startTime;
      saveAiProviderLog({
        provider: 'gemini',
        model: params.model,
        success: false,
        latency_ms: latency,
        fallback_used: true,
        error_type: geminiErrorReason,
        request_type: params.requestType
      }).catch(err => console.warn('[telemetry] failed:', err));
    }

    // Trigger fallback logging exactly matching requested string
    console.warn('[AI Provider] Gemini failed, switching to Groq fallback');

    // 2. Try Groq Provider (Fallback)
    const groqStartTime = Date.now();
    const groqModel = GROQ_MODEL_MAP[params.model] || 'llama-3.1-8b-instant';

    try {
      const groqProvider = getGroqProvider();
      const res = await groqProvider.generateContent(params);
      
      console.log('[AI Provider] Groq fallback successful');
      
      const contentText = res.choices[0]?.message?.content ?? '';
      if (!contentText || contentText.trim() === '') {
        throw new Error('Empty or invalid response from Groq');
      }

      const latency = Date.now() - groqStartTime;
      saveAiProviderLog({
        provider: 'groq',
        model: groqModel,
        success: true,
        latency_ms: latency,
        fallback_used: true,
        request_type: params.requestType
      }).catch(err => console.warn('[telemetry] failed:', err));

      return {
        content: contentText,
        provider: 'groq',
        model: groqModel,
        choices: [{ message: { content: contentText } }],
        metadata: {
          provider: 'groq',
          model: groqModel,
          fallback: true,
          fallbackReason: geminiErrorReason,
          timestamp: new Date()
        }
      };
    } catch (groqErr: unknown) {
      const groqErrMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
      console.error(`[AI Provider] Groq fallback failed: ${groqErrMsg}`);
      
      const latency = Date.now() - groqStartTime;
      saveAiProviderLog({
        provider: 'groq',
        model: groqModel,
        success: false,
        latency_ms: latency,
        fallback_used: true,
        error_type: groqErrMsg,
        request_type: params.requestType
      }).catch(logErr => console.warn('[telemetry] failed:', logErr));

      // If both fail: Return AI service temporarily unavailable error
      throw new Error('AI service temporarily unavailable');
    }
  }
}

export function getAIClient() {
  const manager = new AIProviderManager();
  return {
    chat: {
      completions: {
        create: (params: ChatCompletionParams) => manager.create(params),
      },
    },
  };
}
