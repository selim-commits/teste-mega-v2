/**
 * AI Service for LLM Integration
 * Supports streaming responses via Supabase Edge Functions or direct API calls
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIStreamOptions {
  onChunk?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export interface AICompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// Default system prompts for different contexts
export const AI_SYSTEM_PROMPTS = {
  assistant: `Tu es YODA, l'assistant IA de Rooom OS, une plateforme de gestion de studios photo et vidéo.
Tu aides les utilisateurs avec:
- La gestion des réservations et du calendrier
- Les questions sur les espaces et équipements
- L'analyse des performances et statistiques
- Les conseils pour optimiser leur activité

Réponds toujours en français, de manière concise et professionnelle.`,

  chatWidget: `Tu es l'assistant de réservation pour un studio photo/vidéo.
Tu aides les visiteurs à:
- Trouver des disponibilités
- Comprendre les différents espaces et services
- Répondre aux questions sur les tarifs
- Guider dans le processus de réservation

Sois accueillant, professionnel et concis. Réponds toujours en français.`,
};

// AI Service implementation
export const aiService = {
  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<string> {
    const {
      systemPrompt = AI_SYSTEM_PROMPTS.assistant,
      maxTokens = 1024,
      temperature = 0.7,
    } = options;

    // Add system prompt if not present
    const fullMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    try {
      // Call Supabase Edge Function
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: fullMessages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI request failed: ${error}`);
      }

      const data = await response.json();
      return data.content || data.message || '';
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  },

  /**
   * Send a streaming chat completion request
   */
  async streamChat(
    messages: AIMessage[],
    options: AICompletionOptions & AIStreamOptions = {}
  ): Promise<void> {
    const {
      systemPrompt = AI_SYSTEM_PROMPTS.assistant,
      maxTokens = 1024,
      temperature = 0.7,
      onChunk,
      onComplete,
      onError,
      signal,
    } = options;

    const fullMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: fullMessages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI stream request failed: ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE format
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const text = parsed.content || parsed.delta?.content || '';
              if (text) {
                fullText += text;
                onChunk?.(text);
              }
            } catch {
              // Non-JSON data, treat as raw text
              if (data.trim()) {
                fullText += data;
                onChunk?.(data);
              }
            }
          }
        }
      }

      onComplete?.(fullText);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('AI stream error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  /**
   * Generate a quick response for common queries (cached/faster)
   */
  async quickResponse(
    query: string,
    context?: { studioName?: string; availableSpaces?: string[] }
  ): Promise<string> {
    // For simple queries, we can use a lighter model or cached responses
    const contextInfo = context
      ? `\nContexte: Studio "${context.studioName}", Espaces: ${context.availableSpaces?.join(', ')}`
      : '';

    return this.chat(
      [{ role: 'user', content: query }],
      {
        systemPrompt: AI_SYSTEM_PROMPTS.chatWidget + contextInfo,
        maxTokens: 256,
        temperature: 0.5,
      }
    );
  },

  /**
   * Analyze booking patterns and provide insights
   */
  async analyzeBookings(
    bookingData: { date: string; space: string; duration: number }[]
  ): Promise<string> {
    const summary = `Données de réservations (${bookingData.length} réservations):\n${JSON.stringify(bookingData.slice(0, 10), null, 2)}`;

    return this.chat(
      [{ role: 'user', content: `Analyse ces données de réservations et donne-moi des insights:\n${summary}` }],
      {
        systemPrompt: `Tu es un analyste de données pour un studio photo. Analyse les patterns de réservation et fournis des insights actionnables en français.`,
        maxTokens: 512,
      }
    );
  },

  /**
   * Generate a response for customer support
   */
  async supportResponse(
    customerMessage: string,
    conversationHistory: AIMessage[] = [],
    studioContext?: { name: string; services: string[]; policies: string }
  ): Promise<string> {
    const contextPrompt = studioContext
      ? `
Tu représentes le studio "${studioContext.name}".
Services proposés: ${studioContext.services.join(', ')}
Politiques: ${studioContext.policies}
`
      : '';

    return this.chat(
      [...conversationHistory, { role: 'user', content: customerMessage }],
      {
        systemPrompt: AI_SYSTEM_PROMPTS.chatWidget + contextPrompt,
        maxTokens: 512,
        temperature: 0.6,
      }
    );
  },
};

export default aiService;
