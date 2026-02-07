// src/embed-chat/store/chatStore.ts
import { create } from 'zustand';
import type {
  ChatConfig,
  ChatMessage,
  ChatWindowState,
  ConversationStatus,
  TypingState,
  Attachment,
} from '../types';

interface ChatState {
  // Config
  config: ChatConfig | null;

  // Window state
  windowState: ChatWindowState;

  // Conversation
  messages: ChatMessage[];
  conversationId: string | null;
  conversationStatus: ConversationStatus;

  // Typing
  typing: TypingState;

  // Input
  inputText: string;
  attachments: Attachment[];

  // Unread
  unreadCount: number;

  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Sound
  soundEnabled: boolean;

  // Actions
  setConfig: (config: ChatConfig) => void;

  // Window actions
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  toggleChat: () => void;

  // Message actions
  addMessage: (message: ChatMessage) => void;
  addMessages: (messages: ChatMessage[]) => void;
  markAllAsRead: () => void;
  clearMessages: () => void;

  // Conversation actions
  setConversationId: (id: string) => void;
  setConversationStatus: (status: ConversationStatus) => void;

  // Typing actions
  setTyping: (typing: TypingState) => void;

  // Input actions
  setInputText: (text: string) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  updateAttachment: (id: string, updates: Partial<Attachment>) => void;
  clearInput: () => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;

  // Sound actions
  toggleSound: () => void;

  // Reset
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  config: null,
  windowState: 'closed',
  messages: [],
  conversationId: null,
  conversationStatus: 'active',
  typing: { isTyping: false, typingUser: null },
  inputText: '',
  attachments: [],
  unreadCount: 0,
  isLoading: false,
  isSending: false,
  error: null,
  soundEnabled: true,

  // Config
  setConfig: (config) => set({ config }),

  // Window actions
  openChat: () => {
    set({ windowState: 'open' });
    // Mark messages as read when opening
    get().markAllAsRead();
  },

  closeChat: () => set({ windowState: 'closed' }),

  minimizeChat: () => set({ windowState: 'minimized' }),

  toggleChat: () => {
    const { windowState } = get();
    if (windowState === 'closed' || windowState === 'minimized') {
      get().openChat();
    } else {
      get().closeChat();
    }
  },

  // Message actions
  addMessage: (message) => {
    set((state) => {
      const newMessages = [...state.messages, message];
      const unreadCount = state.windowState !== 'open' && message.sender !== 'user'
        ? state.unreadCount + 1
        : state.unreadCount;

      // Play sound for new messages if enabled
      if (state.soundEnabled && state.windowState !== 'open' && message.sender === 'ai') {
        playNotificationSound();
      }

      return { messages: newMessages, unreadCount };
    });
  },

  addMessages: (messages) => {
    set((state) => ({
      messages: [...state.messages, ...messages],
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, isRead: true })),
      unreadCount: 0,
    }));
  },

  clearMessages: () => set({ messages: [], unreadCount: 0 }),

  // Conversation actions
  setConversationId: (conversationId) => set({ conversationId }),

  setConversationStatus: (conversationStatus) => set({ conversationStatus }),

  // Typing actions
  setTyping: (typing) => set({ typing }),

  // Input actions
  setInputText: (inputText) => set({ inputText }),

  addAttachment: (attachment) => {
    set((state) => ({
      attachments: [...state.attachments, attachment],
    }));
  },

  removeAttachment: (id) => {
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    }));
  },

  updateAttachment: (id, updates) => {
    set((state) => ({
      attachments: state.attachments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  clearInput: () => set({ inputText: '', attachments: [] }),

  // UI actions
  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),
  setError: (error) => set({ error }),

  // Sound actions
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  // Reset
  reset: () =>
    set({
      windowState: 'closed',
      messages: [],
      conversationId: null,
      conversationStatus: 'active',
      typing: { isTyping: false, typingUser: null },
      inputText: '',
      attachments: [],
      unreadCount: 0,
      isLoading: false,
      isSending: false,
      error: null,
    }),
}));

// AudioContext singleton to avoid creating a new context on every notification
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return sharedAudioContext;
}

// Helper function to play notification sound
function playNotificationSound() {
  try {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Silently fail if audio is not available
  }
}
