// src/embed-chat/ChatApp.tsx
import { useEffect, useCallback, useRef } from 'react';
import { useChatStore } from './store/chatStore';
import { chatApi, chatWebSocket } from './services/chatApi';
import { initCsrfToken } from '../lib/csrf';
import { ChatBubble } from './components/ChatBubble';
import { ChatWindow } from './components/ChatWindow';
import type { ChatConfig, ChatMessage } from './types';
import './chat.css';

// Initialize CSRF token for this widget session
initCsrfToken();

interface ChatAppProps {
  config: ChatConfig;
}

export function ChatApp({ config }: ChatAppProps) {
  const {
    windowState,
    setConfig,
    setConversationId,
    addMessages,
    addMessage,
    setLoading,
    setError,
    setTyping,
  } = useChatStore();

  // Notify parent window with secure origin
  const getParentOrigin = useCallback((): string => {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch {
      // Invalid referrer URL
    }
    // Ne pas utiliser '*' - utiliser l'origin du document comme fallback securise
    return window.location.origin;
  }, []);

  const notifyParent = useCallback((type: string, payload: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, getParentOrigin());
    }
  }, [getParentOrigin]);

  // Use refs to avoid stale closures in the initialization effect
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Initialize on mount
  useEffect(() => {
    const currentConfig = configRef.current;
    setConfig(currentConfig);

    // Initialize chat conversation
    const initializeChat = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await chatApi.initConversation(
          currentConfig.studioId,
          currentConfig.studioName
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

    initializeChat();
    setupWebSocket();

    // Notify parent that chat is ready
    notifyParent('ROOOM_CHAT_READY', { studioId: currentConfig.studioId });

    return () => {
      chatWebSocket.disconnect();
    };
  }, [setConfig, setLoading, setError, setConversationId, addMessages, addMessage, setTyping, notifyParent]);

  // Notify parent on window state changes
  useEffect(() => {
    if (windowState === 'open') {
      notifyParent('ROOOM_CHAT_OPEN', {});
    } else if (windowState === 'closed') {
      notifyParent('ROOOM_CHAT_CLOSE', {});
    }
  }, [windowState, notifyParent]);

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
