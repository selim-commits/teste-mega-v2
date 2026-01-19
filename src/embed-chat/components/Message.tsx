// src/embed-chat/components/Message.tsx
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ChatMessage } from '../types';
import { BookingCard } from './BookingCard';
import { PackCard } from './PackCard';
import { QuickActions } from './QuickActions';
import { EscalationBanner } from './EscalationBanner';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const senderClass = `chat-message-${message.sender}`;
  const timeFormatted = format(new Date(message.timestamp), 'HH:mm', { locale: fr });

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="chat-message-bubble">
            {message.content}
          </div>
        );

      case 'booking-card':
        return (
          <>
            <div className="chat-message-bubble">
              {message.content}
            </div>
            <BookingCard slots={message.slots} />
          </>
        );

      case 'pack-card':
        return (
          <>
            <div className="chat-message-bubble">
              {message.content}
            </div>
            <PackCard packs={message.packs} />
          </>
        );

      case 'quick-actions':
        return (
          <>
            {message.content && (
              <div className="chat-message-bubble">
                {message.content}
              </div>
            )}
            <QuickActions actions={message.actions} />
          </>
        );

      case 'escalation':
        return (
          <EscalationBanner
            content={message.content}
            estimatedWaitTime={message.estimatedWaitTime}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`chat-message ${senderClass}`}>
      {renderContent()}
      {message.type !== 'escalation' && (
        <span className="chat-message-time">{timeFormatted}</span>
      )}
    </div>
  );
}
