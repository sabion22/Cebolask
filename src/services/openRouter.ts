const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const AVAILABLE_MODELS = [
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super', provider: 'NVIDIA', price: 'Grátis' },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', provider: 'Z.ai', price: 'Grátis' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', price: '$0.15/M' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', price: '$2.50/M' },
];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export async function createChatCompletion(options: ChatCompletionOptions): Promise<string> {
  const { model, messages, temperature = 0.7, maxTokens = 4096 } = options;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'DOCA Agents',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter response error:', response.status, error);
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('OpenRouter response structure:', data);
      throw new Error('Resposta inválida da API');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

export async function* createStreamingChatCompletion(options: ChatCompletionOptions) {
  const { model, messages, temperature = 0.7, maxTokens = 4096 } = options;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'DOCA Agents',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter streaming error:', response.status, error);
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      if (trimmed === 'data: [DONE]') return;

      const json = trimmed.slice(6);
      try {
        const data = JSON.parse(json);
        const content = data.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Skip invalid JSON
      }
    }
  }
}