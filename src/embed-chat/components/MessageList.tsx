// src/embed-chat/components/MessageList.tsx
import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';

export function MessageList() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, typing } = useChatStore();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing.isTyping]);

  return (
    <div className="chat-messages" role="log" aria-live="polite">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <TypingIndicator />
      <div ref={messagesEndRef} />
    </div>
  );
}
