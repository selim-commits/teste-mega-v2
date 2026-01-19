// src/embed-chat/ChatApp.tsx
import { useEffect } from 'react';
import { useChatStore } from './store/chatStore';
import { chatApi, chatWebSocket } from './services/chatApi';
import { ChatBubble } from './components/ChatBubble';
import { ChatWindow } from './components/ChatWindow';
import type { ChatConfig, ChatMessage } from './types';
import './chat.css';

interface ChatAppProps {
  config: ChatConfig;
}

export function ChatApp({ config }: ChatAppProps) {
  const {
    windowState,
    conversationId,
    setConfig,
    setConversationId,
    addMessages,
    addMessage,
    setLoading,
    setError,
    setTyping,
  } = useChatStore();

  // Initialize on mount
  useEffect(() => {
    setConfig(config);
    initializeChat();
    setupWebSocket();

    // Notify parent that chat is ready
    notifyParent('ROOOM_CHAT_READY', { studioId: config.studioId });

    return () => {
      chatWebSocket.disconnect();
    };
  }, []);

  // Initialize chat conversation
  const initializeChat = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await chatApi.initConversation(
        config.studioId,
        config.studioName
      );

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setConversationId(response.data.conversationId);
        addMessages(response.data.messages);
      }
    } catch {
      setError('Impossible d\'initialiser le chat. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Setup WebSocket for real-time updates
  const setupWebSocket = async () => {
    await chatWebSocket.connect();

    chatWebSocket.on('message', (data) => {
      addMessage(data as ChatMessage);
    });

    chatWebSocket.on('typing', (data) => {
      const typingData = data as { isTyping: boolean; typingUser: string };
      setTyping(typingData);
    });
  };

  // Notify parent window
  const notifyParent = (type: string, payload: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, '*');
    }
  };

  // Notify parent on window state changes
  useEffect(() => {
    if (windowState === 'open') {
      notifyParent('ROOOM_CHAT_OPEN', {});
    } else if (windowState === 'closed') {
      notifyParent('ROOOM_CHAT_CLOSE', {});
    }
  }, [windowState]);

  const themeClass = config.theme === 'dark' ? 'rooom-chat-dark' : 'rooom-chat-light';
  const positionClass = `rooom-chat-${config.position}`;

  return (
    <div
      className={`rooom-chat ${themeClass} ${positionClass}`}
      style={{ '--accent-color': config.accentColor } as React.CSSProperties}
    >
      <ChatWindow />
      <ChatBubble />
    </div>
  );
}
