// src/embed-chat/services/chatApi.ts
import type {
  ChatMessage,
  BookingSlot,
  Pack,
  QuickAction,
  UserIntent,
  ApiResponse,
} from '../types';

// Simulated delay for realistic feel
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock booking slots
const mockBookingSlots: BookingSlot[] = [
  {
    id: 'slot-1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    spaceName: 'Studio A - Enregistrement',
    price: 80,
    available: true,
  },
  {
    id: 'slot-2',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    spaceName: 'Studio A - Enregistrement',
    price: 80,
    available: true,
  },
  {
    id: 'slot-3',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '18:00',
    spaceName: 'Studio B - Mixage',
    price: 60,
    available: true,
  },
  {
    id: 'slot-4',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    spaceName: 'Studio A - Enregistrement',
    price: 120,
    available: true,
  },
];

// Mock packs
const mockPacks: Pack[] = [
  {
    id: 'pack-1',
    name: 'Pack Starter',
    description: '5 heures de studio pour vos premiers projets',
    price: 175,
    hours: 5,
    savings: 25,
  },
  {
    id: 'pack-2',
    name: 'Pack Pro',
    description: '10 heures de studio avec priorite de reservation',
    price: 320,
    hours: 10,
    savings: 80,
    popular: true,
  },
  {
    id: 'pack-3',
    name: 'Pack Studio',
    description: '20 heures pour vos projets ambitieux',
    price: 580,
    hours: 20,
    savings: 220,
  },
];

// Initial quick actions
const initialQuickActions: QuickAction[] = [
  { id: 'qa-1', label: 'Reserver', action: 'booking', icon: 'calendar' },
  { id: 'qa-2', label: 'Tarifs', action: 'pricing', icon: 'tag' },
  { id: 'qa-3', label: 'Parler a un humain', action: 'human', icon: 'user' },
];

// Intent detection (simplified)
function detectIntent(message: string): UserIntent {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('reserver') ||
    lowerMessage.includes('reservation') ||
    lowerMessage.includes('disponibilite') ||
    lowerMessage.includes('creneau')
  ) {
    return 'booking';
  }

  if (
    lowerMessage.includes('tarif') ||
    lowerMessage.includes('prix') ||
    lowerMessage.includes('cout') ||
    lowerMessage.includes('pack') ||
    lowerMessage.includes('forfait')
  ) {
    return 'pricing';
  }

  if (
    lowerMessage.includes('disponible') ||
    lowerMessage.includes('quand') ||
    lowerMessage.includes('horaire')
  ) {
    return 'availability';
  }

  if (
    lowerMessage.includes('humain') ||
    lowerMessage.includes('conseiller') ||
    lowerMessage.includes('personne') ||
    lowerMessage.includes('agent')
  ) {
    return 'human';
  }

  if (
    lowerMessage.includes('comment') ||
    lowerMessage.includes('pourquoi') ||
    lowerMessage.includes('quoi') ||
    lowerMessage.includes('equipement') ||
    lowerMessage.includes('materiel')
  ) {
    return 'faq';
  }

  return 'general';
}

// Generate AI response based on intent
async function generateAIResponse(
  userMessage: string,
  studioName: string
): Promise<ChatMessage[]> {
  const intent = detectIntent(userMessage);
  const responses: ChatMessage[] = [];

  switch (intent) {
    case 'booking':
    case 'availability':
      responses.push({
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: `Voici les creneaux disponibles pour ${studioName}. Cliquez sur celui qui vous convient pour reserver directement.`,
        timestamp: new Date(),
        isRead: false,
      });
      responses.push({
        id: generateId(),
        type: 'booking-card',
        sender: 'ai',
        content: 'Disponibilites',
        slots: mockBookingSlots,
        timestamp: new Date(),
        isRead: false,
      });
      break;

    case 'pricing':
      responses.push({
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: `Voici nos tarifs et packs pour ${studioName}. Les packs vous permettent d'economiser sur vos sessions !`,
        timestamp: new Date(),
        isRead: false,
      });
      responses.push({
        id: generateId(),
        type: 'pack-card',
        sender: 'ai',
        content: 'Nos packs',
        packs: mockPacks,
        timestamp: new Date(),
        isRead: false,
      });
      break;

    case 'human':
      responses.push({
        id: generateId(),
        type: 'escalation',
        sender: 'system',
        content:
          'Je vous mets en relation avec un conseiller. Merci de patienter quelques instants...',
        estimatedWaitTime: 2,
        timestamp: new Date(),
        isRead: false,
      });
      break;

    case 'faq':
      responses.push({
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: `Notre studio est equipe de materiel professionnel haut de gamme : console SSL, microphones Neumann, monitoring Genelec. Nous disposons egalement d'une large selection d'instruments et d'amplis. Besoin de plus de details sur un equipement specifique ?`,
        timestamp: new Date(),
        isRead: false,
      });
      break;

    default:
      responses.push({
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: `Merci pour votre message ! Je suis YODA, l'assistant virtuel de ${studioName}. Je peux vous aider a reserver un creneau, consulter nos tarifs ou repondre a vos questions. Que puis-je faire pour vous ?`,
        timestamp: new Date(),
        isRead: false,
      });
      responses.push({
        id: generateId(),
        type: 'quick-actions',
        sender: 'ai',
        content: 'Actions rapides',
        actions: initialQuickActions,
        timestamp: new Date(),
        isRead: false,
      });
  }

  return responses;
}

// Chat API service
export const chatApi = {
  // Initialize conversation
  async initConversation(
    studioId: string,
    studioName: string
  ): Promise<ApiResponse<{ conversationId: string; messages: ChatMessage[] }>> {
    await delay(500);

    const conversationId = generateId();
    const welcomeMessages: ChatMessage[] = [
      {
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: `Bonjour ! Bienvenue chez ${studioName}. Je suis YODA, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date(),
        isRead: false,
      },
      {
        id: generateId(),
        type: 'quick-actions',
        sender: 'ai',
        content: 'Actions rapides',
        actions: initialQuickActions,
        timestamp: new Date(),
        isRead: false,
      },
    ];

    return {
      data: {
        conversationId,
        messages: welcomeMessages,
      },
    };
  },

  // Send message
  async sendMessage(
    conversationId: string,
    message: string,
    studioName: string,
    onTypingStart?: () => void,
    onTypingEnd?: () => void
  ): Promise<ApiResponse<ChatMessage[]>> {
    // Simulate typing indicator
    onTypingStart?.();
    await delay(1000 + Math.random() * 1500);
    onTypingEnd?.();

    const responses = await generateAIResponse(message, studioName);

    return { data: responses };
  },

  // Handle quick action
  async handleQuickAction(
    conversationId: string,
    action: string,
    studioName: string,
    onTypingStart?: () => void,
    onTypingEnd?: () => void
  ): Promise<ApiResponse<ChatMessage[]>> {
    // Map action to message
    const actionMessages: Record<string, string> = {
      booking: 'Je voudrais reserver un creneau',
      pricing: 'Quels sont vos tarifs ?',
      human: 'Je voudrais parler a un humain',
    };

    const message = actionMessages[action] || action;

    return this.sendMessage(
      conversationId,
      message,
      studioName,
      onTypingStart,
      onTypingEnd
    );
  },

  // Book a slot
  async bookSlot(
    _conversationId: string,
    _slot: BookingSlot
  ): Promise<ApiResponse<{ success: boolean; bookingId: string }>> {
    await delay(800);

    return {
      data: {
        success: true,
        bookingId: generateId(),
      },
    };
  },

  // Select a pack
  async selectPack(
    _conversationId: string,
    pack: Pack
  ): Promise<ApiResponse<{ success: boolean; redirectUrl: string }>> {
    await delay(500);

    return {
      data: {
        success: true,
        redirectUrl: `/booking/pack/${pack.id}`,
      },
    };
  },

  // Request human agent
  async requestHumanAgent(
    _conversationId: string
  ): Promise<ApiResponse<{ estimatedWaitTime: number }>> {
    await delay(500);

    return {
      data: {
        estimatedWaitTime: Math.floor(Math.random() * 5) + 1,
      },
    };
  },

  // Upload attachment
  async uploadAttachment(
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string }>> {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await delay(100);
      onProgress?.(i);
    }

    return {
      data: {
        url: URL.createObjectURL(file),
      },
    };
  },
};

// WebSocket simulation for real-time features
export class ChatWebSocket {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private connected = false;

  connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.emit('connection', { status: 'connected' });
        resolve();
      }, 100);
    });
  }

  disconnect(): void {
    this.connected = false;
    this.emit('connection', { status: 'disconnected' });
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // Simulate incoming agent message (for testing)
  simulateAgentMessage(message: string): void {
    if (!this.connected) return;

    setTimeout(() => {
      this.emit('message', {
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: message,
        timestamp: new Date(),
        isRead: false,
      });
    }, 500);
  }

  // Simulate typing indicator
  simulateTyping(isTyping: boolean, userName: string = 'YODA'): void {
    if (!this.connected) return;

    this.emit('typing', { isTyping, typingUser: userName });
  }
}

// Export singleton instance
export const chatWebSocket = new ChatWebSocket();
