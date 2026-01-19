// src/embed-chat/components/ChatHeader.tsx
import { useChatStore } from '../store/chatStore';
import { Minus, X, Volume2, VolumeX } from 'lucide-react';

export function ChatHeader() {
  const {
    config,
    conversationStatus,
    soundEnabled,
    closeChat,
    minimizeChat,
    toggleSound,
  } = useChatStore();

  const getStatusText = () => {
    switch (conversationStatus) {
      case 'active':
        return 'En ligne';
      case 'waiting-for-human':
        return 'En attente d\'un conseiller...';
      case 'with-human':
        return 'Avec un conseiller';
      case 'closed':
        return 'Conversation terminee';
      default:
        return 'En ligne';
    }
  };

  const isOnline = conversationStatus === 'active' || conversationStatus === 'with-human';

  return (
    <header className="chat-header">
      <div className="chat-header-avatar">
        {config?.aiAvatar ? (
          <img src={config.aiAvatar} alt={config.aiName || 'YODA'} />
        ) : (
          config?.aiName?.charAt(0) || 'Y'
        )}
      </div>

      <div className="chat-header-info">
        <h2 className="chat-header-name">
          {config?.aiName || 'YODA'} - {config?.studioName || 'Studio'}
        </h2>
        <div className="chat-header-status">
          <span className={`chat-header-status-dot ${!isOnline ? 'offline' : ''}`} />
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="chat-header-actions">
        <button
          className="chat-header-btn"
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Desactiver le son' : 'Activer le son'}
          title={soundEnabled ? 'Desactiver le son' : 'Activer le son'}
        >
          {soundEnabled ? <Volume2 /> : <VolumeX />}
        </button>

        <button
          className="chat-header-btn"
          onClick={minimizeChat}
          aria-label="Minimiser"
          title="Minimiser"
        >
          <Minus />
        </button>

        <button
          className="chat-header-btn"
          onClick={closeChat}
          aria-label="Fermer"
          title="Fermer"
        >
          <X />
        </button>
      </div>
    </header>
  );
}
