// src/embed-chat/components/ChatBubble.tsx
import { useChatStore } from '../store/chatStore';
import { MessageCircle, X } from 'lucide-react';

export function ChatBubble() {
  const { windowState, unreadCount, toggleChat } = useChatStore();
  const isOpen = windowState === 'open';

  return (
    <button
      className={`chat-bubble ${isOpen ? 'chat-bubble-open' : ''}`}
      onClick={toggleChat}
      aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
    >
      <MessageCircle className="chat-bubble-icon chat-bubble-icon-chat" />
      <X className="chat-bubble-icon chat-bubble-icon-close" />

      {unreadCount > 0 && !isOpen && (
        <span className="chat-bubble-badge" aria-label={`${unreadCount} messages non lus`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
