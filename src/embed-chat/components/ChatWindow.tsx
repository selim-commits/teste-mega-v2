// src/embed-chat/components/ChatWindow.tsx
import { useChatStore } from '../store/chatStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatWindow() {
  const { windowState } = useChatStore();

  const isOpen = windowState === 'open';
  const isMinimized = windowState === 'minimized';

  const windowClass = [
    'chat-window',
    isOpen && 'chat-window-open',
    isMinimized && 'chat-window-minimized',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={windowClass} role="dialog" aria-label="Chat">
      <ChatHeader />
      {!isMinimized && (
        <>
          <MessageList />
          <MessageInput />
          <div className="chat-powered-by">
            Propulse par{' '}
            <a href="https://rooom.io" target="_blank" rel="noopener noreferrer">
              Rooom OS
            </a>
          </div>
        </>
      )}
    </div>
  );
}
