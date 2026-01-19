// src/embed-chat/types.ts

// Config passed to chat widget
export interface ChatConfig {
  studioId: string;
  studioName: string;
  theme: 'light' | 'dark';
  accentColor: string;
  locale: string;
  position: 'bottom-right' | 'bottom-left';
  greeting?: string;
  aiName?: string;
  aiAvatar?: string;
  enableSound?: boolean;
  enableAttachments?: boolean;
}

// Message sender types
export type MessageSender = 'user' | 'ai' | 'system';

// Message content types
export type MessageContentType =
  | 'text'
  | 'booking-card'
  | 'pack-card'
  | 'quick-actions'
  | 'escalation';

// Base message interface
export interface BaseMessage {
  id: string;
  sender: MessageSender;
  timestamp: Date;
  isRead: boolean;
}

// Text message
export interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
}

// Booking slot for availability card
export interface BookingSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  spaceName: string;
  price: number;
  available: boolean;
}

// Booking card message
export interface BookingCardMessage extends BaseMessage {
  type: 'booking-card';
  content: string;
  slots: BookingSlot[];
}

// Pack/pricing suggestion
export interface Pack {
  id: string;
  name: string;
  description: string;
  price: number;
  hours: number;
  savings?: number;
  popular?: boolean;
}

// Pack card message
export interface PackCardMessage extends BaseMessage {
  type: 'pack-card';
  content: string;
  packs: Pack[];
}

// Quick action button
export interface QuickAction {
  id: string;
  label: string;
  action: string;
  icon?: string;
}

// Quick actions message
export interface QuickActionsMessage extends BaseMessage {
  type: 'quick-actions';
  content: string;
  actions: QuickAction[];
}

// Escalation message
export interface EscalationMessage extends BaseMessage {
  type: 'escalation';
  content: string;
  estimatedWaitTime?: number; // in minutes
}

// Union type for all message types
export type ChatMessage =
  | TextMessage
  | BookingCardMessage
  | PackCardMessage
  | QuickActionsMessage
  | EscalationMessage;

// Conversation status
export type ConversationStatus =
  | 'active'
  | 'waiting-for-human'
  | 'with-human'
  | 'closed';

// Chat window state
export type ChatWindowState = 'closed' | 'open' | 'minimized';

// Typing indicator state
export interface TypingState {
  isTyping: boolean;
  typingUser: string | null;
}

// Attachment type
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploading?: boolean;
  error?: string;
}

// User input state
export interface InputState {
  text: string;
  attachments: Attachment[];
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// WebSocket event types
export type WebSocketEventType =
  | 'message'
  | 'typing'
  | 'read'
  | 'escalation'
  | 'agent-joined'
  | 'agent-left'
  | 'connection';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: unknown;
}

// PostMessage types for parent communication
export type ChatPostMessageType =
  | 'ROOOM_CHAT_READY'
  | 'ROOOM_CHAT_OPEN'
  | 'ROOOM_CHAT_CLOSE'
  | 'ROOOM_CHAT_MESSAGE'
  | 'ROOOM_CHAT_ESCALATION'
  | 'ROOOM_CHAT_ERROR';

export interface ChatPostMessage {
  type: ChatPostMessageType;
  payload?: unknown;
}

// Intent types for AI understanding
export type UserIntent =
  | 'booking'
  | 'pricing'
  | 'availability'
  | 'faq'
  | 'human'
  | 'general';
