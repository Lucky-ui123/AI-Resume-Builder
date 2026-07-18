export class GeminiOpenAiWrapper {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get chat() {
    return {
      completions: {
        create: async (params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          response_format?: { type: string };
        }) => {
          const systemMsg = params.messages.find(m => m.role === 'system');
          const contents = params.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            }));

          const systemInstruction = systemMsg
            ? { parts: [{ text: systemMsg.content }] }
            : undefined;

          let modelName = params.model;
          // Map OpenAI model names to Gemini fallback
          if (modelName.startsWith('gpt-')) {
            modelName = 'gemini-3.5-flash';
          }

          const generationConfig: any = {};
          if (params.temperature !== undefined) {
            generationConfig.temperature = params.temperature;
          }
          if (params.response_format?.type === 'json_object') {
            generationConfig.responseMimeType = 'application/json';
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents,
              systemInstruction,
              generationConfig
            })
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API error (${res.status}): ${errText}`);
          }

          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          return {
            choices: [
              {
                message: {
                  content: text
                }
              }
            ]
          };
        }
      }
    };
  }
}
