import type { ChatMessage, ChatConversation } from './chatService';
import type { Json } from '../types/database';

// User intent classification
export type UserIntent =
  | 'booking_inquiry'
  | 'availability_check'
  | 'pricing_question'
  | 'pack_inquiry'
  | 'general_question'
  | 'complaint'
  | 'feedback'
  | 'cancellation'
  | 'modification'
  | 'payment_question'
  | 'technical_support'
  | 'greeting'
  | 'farewell'
  | 'unknown';

// Escalation reasons
export type EscalationReason =
  | 'complex_question'
  | 'complaint'
  | 'high_value_inquiry'
  | 'repeated_questions'
  | 'explicit_request'
  | 'sentiment_negative'
  | 'payment_issue'
  | 'technical_issue'
  | 'outside_scope';

// Studio context for AI responses
export interface StudioContext {
  studioId: string;
  studioName: string;
  timezone: string;
  currency: string;
  description?: string | null;
  spaces?: Array<{
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    hourlyRate: number;
    halfDayRate: number | null;
    fullDayRate: number | null;
    amenities: string[];
  }>;
  businessHours?: {
    [key: string]: { open: string; close: string } | null; // day -> hours or null if closed
  };
  customPrompt?: string; // Custom AI personality/instructions
}

// AI response structure
export interface AIResponse {
  content: string;
  intent: UserIntent;
  confidence: number; // 0-1
  shouldEscalate: boolean;
  escalationReason?: EscalationReason;
  suggestedActions?: Array<{
    type: 'book' | 'show_availability' | 'show_pricing' | 'contact_human';
    label: string;
    data?: Json;
  }>;
  metadata?: Json;
}

// Availability response
export interface AvailabilityResponse {
  available: boolean;
  slots?: Array<{
    spaceId: string;
    spaceName: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
  }>;
  message: string;
}

// Pack/package response
export interface PackResponse {
  packs: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    includes: string[];
  }>;
  message: string;
}

// Pricing response
export interface PricingResponse {
  pricing: {
    hourly: number;
    halfDay: number | null;
    fullDay: number | null;
    currency: string;
  };
  message: string;
}

// Intent extraction result
export interface IntentResult {
  intent: UserIntent;
  confidence: number;
  entities?: {
    date?: string;
    time?: string;
    duration?: string;
    spaceType?: string;
    capacity?: number;
  };
}

// Conversation history for context
interface ConversationHistory {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Chat AI Service - YODA AI Integration
 * Currently returns mock responses. Will be connected to real AI later.
 */
export const chatAIService = {
  /**
   * Generate an AI response for a message
   */
  async generateResponse(
    conversation: ChatConversation,
    message: string,
    studioContext: StudioContext,
    previousMessages?: ChatMessage[]
  ): Promise<AIResponse> {
    // Extract intent from the message
    const intentResult = await this.extractIntent(message);

    // Check if we should escalate
    const escalation = await this.shouldEscalate(
      conversation,
      message,
      intentResult,
      previousMessages
    );

    // Generate response based on intent
    let responseContent: string;
    const suggestedActions: AIResponse['suggestedActions'] = [];

    switch (intentResult.intent) {
      case 'greeting':
        responseContent = this.generateGreetingResponse(studioContext);
        break;

      case 'farewell':
        responseContent = this.generateFarewellResponse(studioContext);
        break;

      case 'availability_check': {
        const availabilityResponse = await this.getAvailabilityResponse(
          studioContext.studioId,
          message,
          studioContext
        );
        responseContent = availabilityResponse.message;
        if (availabilityResponse.available && availabilityResponse.slots) {
          suggestedActions.push({
            type: 'show_availability',
            label: 'View Available Slots',
            data: { slots: availabilityResponse.slots },
          });
        }
        break;
      }

      case 'pricing_question': {
        const pricingResponse = await this.getPricingResponse(
          studioContext.studioId,
          undefined,
          studioContext
        );
        responseContent = pricingResponse.message;
        suggestedActions.push({
          type: 'book',
          label: 'Book Now',
        });
        break;
      }

      case 'pack_inquiry': {
        const packResponse = await this.getPacksResponse(
          studioContext.studioId,
          studioContext
        );
        responseContent = packResponse.message;
        break;
      }

      case 'booking_inquiry':
        responseContent = this.generateBookingInquiryResponse(studioContext);
        suggestedActions.push(
          { type: 'show_availability', label: 'Check Availability' },
          { type: 'show_pricing', label: 'View Pricing' }
        );
        break;

      case 'complaint':
        responseContent = this.generateComplaintResponse(studioContext);
        break;

      case 'general_question':
      default:
        responseContent = this.generateGeneralResponse(message, studioContext);
        break;
    }

    // If escalation is needed, add contact human action
    if (escalation.shouldEscalate) {
      suggestedActions.push({
        type: 'contact_human',
        label: 'Talk to a Human',
      });
    }

    return {
      content: responseContent,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      shouldEscalate: escalation.shouldEscalate,
      escalationReason: escalation.reason,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      metadata: {
        intentResult: intentResult as unknown as Json,
        studioId: studioContext.studioId,
        generatedAt: new Date().toISOString(),
      } as Json,
    };
  },

  /**
   * Determine if a conversation should be escalated to human
   */
  async shouldEscalate(
    _conversation: ChatConversation,
    message: string,
    intentResult?: IntentResult,
    previousMessages?: ChatMessage[]
  ): Promise<{ shouldEscalate: boolean; reason?: EscalationReason }> {
    const lowerMessage = message.toLowerCase();

    // Explicit request for human
    const humanRequestPatterns = [
      'speak to a human',
      'talk to someone',
      'real person',
      'human agent',
      'customer service',
      'speak to agent',
      'talk to agent',
      'representative',
    ];

    if (humanRequestPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return { shouldEscalate: true, reason: 'explicit_request' };
    }

    // Complaint detected
    if (intentResult?.intent === 'complaint') {
      return { shouldEscalate: true, reason: 'complaint' };
    }

    // Negative sentiment keywords (simplified)
    const negativePatterns = [
      'terrible',
      'awful',
      'worst',
      'unacceptable',
      'furious',
      'angry',
      'frustrated',
      'disappointed',
      'refund',
      'sue',
      'lawyer',
      'legal',
    ];

    if (negativePatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return { shouldEscalate: true, reason: 'sentiment_negative' };
    }

    // Payment issues
    const paymentPatterns = [
      'payment failed',
      'charged twice',
      'wrong charge',
      'billing issue',
      'transaction',
      'unauthorized',
    ];

    if (paymentPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return { shouldEscalate: true, reason: 'payment_issue' };
    }

    // Technical issues
    const technicalPatterns = [
      'not working',
      'broken',
      'bug',
      'error',
      'crash',
      'cant access',
      "can't access",
    ];

    if (technicalPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return { shouldEscalate: true, reason: 'technical_issue' };
    }

    // Check for repeated questions (if we have message history)
    if (previousMessages && previousMessages.length > 4) {
      // If there are too many back-and-forth messages, might need human help
      const recentVisitorMessages = previousMessages
        .filter((m) => m.sender_type === 'visitor')
        .slice(-3);

      if (recentVisitorMessages.length >= 3) {
        // Simple heuristic: if visitor keeps asking questions, might be frustrated
        return { shouldEscalate: true, reason: 'repeated_questions' };
      }
    }

    return { shouldEscalate: false };
  },

  /**
   * Get availability response for a query
   */
  async getAvailabilityResponse(
    _studioId: string,
    _query: string,
    studioContext?: StudioContext
  ): Promise<AvailabilityResponse> {
    // Mock response - would integrate with booking service
    const spaceName = studioContext?.spaces?.[0]?.name || 'Main Studio';

    // Parse date from query (simplified)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    return {
      available: true,
      slots: [
        {
          spaceId: 'mock-space-1',
          spaceName,
          date: dateStr,
          startTime: '09:00',
          endTime: '12:00',
          price: studioContext?.spaces?.[0]?.hourlyRate
            ? studioContext.spaces[0].hourlyRate * 3
            : 150,
        },
        {
          spaceId: 'mock-space-1',
          spaceName,
          date: dateStr,
          startTime: '14:00',
          endTime: '18:00',
          price: studioContext?.spaces?.[0]?.hourlyRate
            ? studioContext.spaces[0].hourlyRate * 4
            : 200,
        },
      ],
      message: `Great news! We have availability at ${studioContext?.studioName || 'our studio'}. Tomorrow, the ${spaceName} is available from 9 AM to 12 PM and from 2 PM to 6 PM. Would you like me to help you book one of these slots?`,
    };
  },

  /**
   * Get packs/packages response
   */
  async getPacksResponse(
    _studioId: string,
    studioContext?: StudioContext
  ): Promise<PackResponse> {
    // Mock response - would fetch from database
    return {
      packs: [
        {
          id: 'pack-1',
          name: 'Half-Day Session',
          description: 'Perfect for short shoots and quick sessions',
          price: 250,
          duration: '4 hours',
          includes: ['Studio access', 'Basic lighting', 'Changing room'],
        },
        {
          id: 'pack-2',
          name: 'Full-Day Session',
          description: 'Ideal for extensive projects and productions',
          price: 450,
          duration: '8 hours',
          includes: [
            'Studio access',
            'Full lighting setup',
            'Changing room',
            'Equipment rental',
            'Assistant',
          ],
        },
        {
          id: 'pack-3',
          name: 'Premium Package',
          description: 'All-inclusive experience for professional productions',
          price: 750,
          duration: '10 hours',
          includes: [
            'Full studio access',
            'Professional lighting',
            'All equipment',
            '2 Assistants',
            'Catering',
            'Post-production support',
          ],
        },
      ],
      message: `We offer several packages to fit your needs at ${studioContext?.studioName || 'our studio'}:\n\n1. **Half-Day Session** (4 hours) - $250\n   Includes studio access, basic lighting, and changing room.\n\n2. **Full-Day Session** (8 hours) - $450\n   Includes everything above plus equipment rental and an assistant.\n\n3. **Premium Package** (10 hours) - $750\n   Our all-inclusive option with catering and post-production support.\n\nWould you like more details about any of these packages?`,
    };
  },

  /**
   * Get pricing response for a specific space or general
   */
  async getPricingResponse(
    _studioId: string,
    _spaceId?: string,
    studioContext?: StudioContext
  ): Promise<PricingResponse> {
    const space = studioContext?.spaces?.[0];
    const currency = studioContext?.currency || 'USD';

    const pricing = {
      hourly: space?.hourlyRate || 50,
      halfDay: space?.halfDayRate || 200,
      fullDay: space?.fullDayRate || 350,
      currency,
    };

    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

    return {
      pricing,
      message: `Here's our pricing for ${space?.name || 'the studio'}:\n\n- **Hourly rate:** ${currencySymbol}${pricing.hourly}/hour\n- **Half-day (4 hours):** ${currencySymbol}${pricing.halfDay}\n- **Full-day (8 hours):** ${currencySymbol}${pricing.fullDay}\n\nWe also offer special packages for recurring bookings. Would you like to check availability or learn about our packages?`,
    };
  },

  /**
   * Extract intent from a message
   */
  async extractIntent(message: string): Promise<IntentResult> {
    const lowerMessage = message.toLowerCase();

    // Intent patterns (simplified - would use ML/AI in production)
    const intentPatterns: Array<{
      intent: UserIntent;
      patterns: string[];
      confidence: number;
    }> = [
      {
        intent: 'greeting',
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
        confidence: 0.95,
      },
      {
        intent: 'farewell',
        patterns: ['bye', 'goodbye', 'see you', 'thank you', 'thanks', 'take care'],
        confidence: 0.9,
      },
      {
        intent: 'availability_check',
        patterns: [
          'available',
          'availability',
          'free',
          'open',
          'book',
          'schedule',
          'when can i',
          'slot',
        ],
        confidence: 0.85,
      },
      {
        intent: 'pricing_question',
        patterns: [
          'price',
          'pricing',
          'cost',
          'how much',
          'rate',
          'fee',
          'charge',
          'expensive',
        ],
        confidence: 0.85,
      },
      {
        intent: 'pack_inquiry',
        patterns: ['pack', 'package', 'deal', 'bundle', 'offer', 'discount'],
        confidence: 0.8,
      },
      {
        intent: 'booking_inquiry',
        patterns: ['book', 'reserve', 'reservation', 'appointment'],
        confidence: 0.8,
      },
      {
        intent: 'complaint',
        patterns: [
          'complain',
          'issue',
          'problem',
          'unhappy',
          'disappointed',
          'terrible',
          'awful',
        ],
        confidence: 0.9,
      },
      {
        intent: 'cancellation',
        patterns: ['cancel', 'cancellation', 'refund', "don't want"],
        confidence: 0.85,
      },
      {
        intent: 'modification',
        patterns: ['change', 'modify', 'reschedule', 'move', 'different time'],
        confidence: 0.8,
      },
      {
        intent: 'payment_question',
        patterns: ['pay', 'payment', 'credit card', 'invoice', 'receipt'],
        confidence: 0.85,
      },
    ];

    // Find matching intent
    for (const { intent, patterns, confidence } of intentPatterns) {
      if (patterns.some((pattern) => lowerMessage.includes(pattern))) {
        return { intent, confidence };
      }
    }

    // Default to general question
    return { intent: 'general_question', confidence: 0.5 };
  },

  // ================== RESPONSE GENERATORS ==================

  generateGreetingResponse(context: StudioContext): string {
    const greetings = [
      `Hello! Welcome to ${context.studioName}. I'm here to help you with bookings, pricing, or any questions you might have. How can I assist you today?`,
      `Hi there! Thanks for reaching out to ${context.studioName}. I can help you check availability, learn about our pricing, or answer any questions. What would you like to know?`,
      `Welcome to ${context.studioName}! I'm your virtual assistant. Feel free to ask me about availability, pricing, or our services. How may I help you?`,
    ];
    return greetings[crypto.getRandomValues(new Uint32Array(1))[0] % greetings.length];
  },

  generateFarewellResponse(context: StudioContext): string {
    const farewells = [
      `Thank you for chatting with us! If you have any more questions, feel free to reach out anytime. Have a great day!`,
      `It was nice helping you! Don't hesitate to contact us again if you need anything. Take care!`,
      `Thanks for visiting ${context.studioName}! We look forward to seeing you. Have a wonderful day!`,
    ];
    return farewells[crypto.getRandomValues(new Uint32Array(1))[0] % farewells.length];
  },

  generateBookingInquiryResponse(context: StudioContext): string {
    return `I'd be happy to help you book at ${context.studioName}! To get started, could you let me know:\n\n1. What date are you looking at?\n2. How long do you need the space for?\n3. How many people will be attending?\n\nOr, I can show you our current availability and pricing right away. What works best for you?`;
  },

  generateComplaintResponse(context: StudioContext): string {
    return `I'm truly sorry to hear you're having an issue. Your feedback is very important to us at ${context.studioName}. I want to make sure we address your concern properly.\n\nWould you like me to connect you with a team member who can help resolve this directly? They'll be able to look into your specific situation and find the best solution for you.`;
  },

  generateGeneralResponse(_message: string, context: StudioContext): string {
    return `Thank you for your message! ${context.studioName} offers professional studio spaces for photography, video production, and creative projects.\n\nI can help you with:\n- Checking availability and booking\n- Pricing information\n- Our packages and services\n- General questions about the studio\n\nWhat would you like to know more about?`;
  },

  /**
   * Generate a conversation summary (for AI summary field)
   */
  async generateConversationSummary(
    messages: ChatMessage[],
    _studioContext?: StudioContext
  ): Promise<string> {
    if (messages.length === 0) return 'No messages in conversation.';

    const visitorMessages = messages.filter((m) => m.sender_type === 'visitor');
    const messageCount = messages.length;
    const lastMessage = messages[messages.length - 1];

    // Simple summary - would use AI in production
    let summary = `Conversation with ${messageCount} messages. `;

    if (visitorMessages.length > 0) {
      const firstVisitorMessage = visitorMessages[0];
      const intent = await this.extractIntent(firstVisitorMessage.content);
      summary += `Initial inquiry: ${intent.intent.replace('_', ' ')}. `;
    }

    if (lastMessage.sender_type === 'visitor') {
      summary += `Awaiting response to visitor's last message.`;
    } else {
      summary += `Last response was from ${lastMessage.sender_type}.`;
    }

    return summary;
  },

  /**
   * Build conversation history for context
   */
  buildConversationHistory(messages: ChatMessage[]): ConversationHistory {
    return {
      messages: messages.map((m) => ({
        role: m.sender_type === 'visitor' ? 'user' : 'assistant',
        content: m.content,
      })),
    };
  },
};
