// src/embed-chat/components/PackCard.tsx
import type { Pack } from '../types';
import { useChatStore } from '../store/chatStore';
import { chatApi } from '../services/chatApi';
import { generateId } from '../../lib/utils';

interface PackCardProps {
  packs: Pack[];
}

export function PackCard({ packs }: PackCardProps) {
  const { conversationId, addMessage, setTyping, config } = useChatStore();

  const handlePackClick = async (pack: Pack) => {
    if (!conversationId) return;

    // Add user selection message
    const userMessage = {
      id: generateId(),
      type: 'text' as const,
      sender: 'user' as const,
      content: `Je suis interesse par le ${pack.name}`,
      timestamp: new Date(),
      isRead: true,
    };
    addMessage(userMessage);

    // Show typing indicator
    setTyping({ isTyping: true, typingUser: config?.aiName || 'YODA' });

    // Simulate API call
    try {
      const result = await chatApi.selectPack(conversationId, pack);
      setTyping({ isTyping: false, typingUser: null });

      if (result.data?.success) {
        addMessage({
          id: generateId(),
          type: 'text',
          sender: 'ai',
          content: `Le ${pack.name} est un excellent choix ! Avec ${pack.hours} heures de studio, vous economisez ${pack.savings}EUR par rapport au tarif horaire. Je vous prepare le lien de paiement...`,
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

  return (
    <div className="chat-pack-card">
      {packs.map((pack) => (
        <div
          key={pack.id}
          className={`chat-pack-item ${pack.popular ? 'chat-pack-popular' : ''}`}
          onClick={() => handlePackClick(pack)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handlePackClick(pack);
            }
          }}
        >
          {pack.popular && (
            <span className="chat-pack-popular-badge">Populaire</span>
          )}

          <div className="chat-pack-info">
            <div className="chat-pack-name">{pack.name}</div>
            <div className="chat-pack-desc">{pack.description}</div>
            <div className="chat-pack-hours">{pack.hours} heures</div>
          </div>

          <div className="chat-pack-pricing">
            <div className="chat-pack-price">{pack.price}EUR</div>
            {pack.savings && pack.savings > 0 && (
              <div className="chat-pack-savings">-{pack.savings}EUR</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
