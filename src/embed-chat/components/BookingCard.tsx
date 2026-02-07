// src/embed-chat/components/BookingCard.tsx
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BookingSlot } from '../types';
import { useChatStore } from '../store/chatStore';
import { chatApi } from '../services/chatApi';
import { generateId } from '../../lib/utils';

interface BookingCardProps {
  slots: BookingSlot[];
}

export function BookingCard({ slots }: BookingCardProps) {
  const { conversationId, addMessage, setTyping, config } = useChatStore();

  const handleSlotClick = async (slot: BookingSlot) => {
    if (!slot.available || !conversationId) return;

    // Add user selection message
    const userMessage = {
      id: generateId(),
      type: 'text' as const,
      sender: 'user' as const,
      content: `Je souhaite reserver le ${format(new Date(slot.date), 'EEEE d MMMM', { locale: fr })} de ${slot.startTime} a ${slot.endTime} - ${slot.spaceName}`,
      timestamp: new Date(),
      isRead: true,
    };
    addMessage(userMessage);

    // Show typing indicator
    setTyping({ isTyping: true, typingUser: config?.aiName || 'YODA' });

    // Simulate API call
    try {
      const result = await chatApi.bookSlot(conversationId, slot);
      setTyping({ isTyping: false, typingUser: null });

      if (result.data?.success) {
        addMessage({
          id: generateId(),
          type: 'text',
          sender: 'ai',
          content: `Excellent choix ! J'ai pre-reserve ce creneau pour vous. Pour finaliser votre reservation, vous allez etre redirige vers notre formulaire de reservation. Le creneau sera bloque pendant 10 minutes.`,
          timestamp: new Date(),
          isRead: false,
        });
      }
    } catch {
      setTyping({ isTyping: false, typingUser: null });
      addMessage({
        id: generateId(),
        type: 'text',
        sender: 'ai',
        content: `Desole, une erreur s'est produite. Veuillez reessayer ou contacter notre equipe.`,
        timestamp: new Date(),
        isRead: false,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEE d MMM', { locale: fr });
  };

  return (
    <div className="chat-booking-card">
      <div className="chat-booking-slots">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`chat-booking-slot ${!slot.available ? 'chat-booking-slot-unavailable' : ''}`}
            onClick={() => handleSlotClick(slot)}
            role="button"
            tabIndex={slot.available ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSlotClick(slot);
              }
            }}
          >
            <div className="chat-booking-slot-info">
              <span className="chat-booking-slot-space">{slot.spaceName}</span>
              <span className="chat-booking-slot-time">
                {slot.startTime} - {slot.endTime}
              </span>
              <span className="chat-booking-slot-date">{formatDate(slot.date)}</span>
            </div>
            <div className="chat-booking-slot-right">
              <span className="chat-booking-slot-price">{slot.price}EUR</span>
              {slot.available && (
                <button className="chat-booking-slot-btn">
                  Reserver
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
