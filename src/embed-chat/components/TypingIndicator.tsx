// src/embed-chat/components/TypingIndicator.tsx
import { useChatStore } from '../store/chatStore';

export function TypingIndicator() {
  const { typing } = useChatStore();

  if (!typing.isTyping) return null;

  return (
    <div className="chat-message chat-message-ai">
      <div className="chat-typing">
        <div className="chat-typing-dots">
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
        </div>
        <span className="chat-typing-text">
          {typing.typingUser || 'YODA'} ecrit...
        </span>
      </div>
    </div>
  );
}
