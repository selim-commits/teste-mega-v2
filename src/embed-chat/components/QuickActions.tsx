// src/embed-chat/components/QuickActions.tsx
import { Calendar, Tag, User } from 'lucide-react';
import type { QuickAction } from '../types';
import { useChatStore } from '../store/chatStore';
import { chatApi } from '../services/chatApi';

interface QuickActionsProps {
  actions: QuickAction[];
}

const iconMap: Record<string, React.ElementType> = {
  calendar: Calendar,
  tag: Tag,
  user: User,
};

export function QuickActions({ actions }: QuickActionsProps) {
  const {
    conversationId,
    config,
    addMessage,
    setTyping,
    setConversationStatus,
  } = useChatStore();

  const handleActionClick = async (action: QuickAction) => {
    if (!conversationId || !config) return;

    // Add user message for the action
    const actionLabels: Record<string, string> = {
      booking: 'Je voudrais reserver un creneau',
      pricing: 'Quels sont vos tarifs ?',
      human: 'Je souhaite parler a un conseiller',
    };

    const userMessage = {
      id: Math.random().toString(36).substring(2, 15),
      type: 'text' as const,
      sender: 'user' as const,
      content: actionLabels[action.action] || action.label,
      timestamp: new Date(),
      isRead: true,
    };
    addMessage(userMessage);

    // Handle human escalation separately
    if (action.action === 'human') {
      setConversationStatus('waiting-for-human');
    }

    // Show typing indicator
    setTyping({ isTyping: true, typingUser: config.aiName || 'YODA' });

    try {
      const response = await chatApi.handleQuickAction(
        conversationId,
        action.action,
        config.studioName,
        () => setTyping({ isTyping: true, typingUser: config.aiName || 'YODA' }),
        () => setTyping({ isTyping: false, typingUser: null })
      );

      if (response.data) {
        response.data.forEach((msg) => addMessage(msg));
      }
    } catch {
      setTyping({ isTyping: false, typingUser: null });
      addMessage({
        id: Math.random().toString(36).substring(2, 15),
        type: 'text',
        sender: 'ai',
        content: `Desole, une erreur s'est produite. Veuillez reessayer.`,
        timestamp: new Date(),
        isRead: false,
      });
    }
  };

  return (
    <div className="chat-quick-actions">
      {actions.map((action) => {
        const Icon = action.icon ? iconMap[action.icon] : null;

        return (
          <button
            key={action.id}
            className="chat-quick-action"
            onClick={() => handleActionClick(action)}
          >
            {Icon && <Icon />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
