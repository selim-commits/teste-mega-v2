// src/embed-chat/components/EscalationBanner.tsx
import { Headphones } from 'lucide-react';

interface EscalationBannerProps {
  content: string;
  estimatedWaitTime?: number;
}

export function EscalationBanner({ content, estimatedWaitTime }: EscalationBannerProps) {
  return (
    <div className="chat-escalation-banner">
      <Headphones className="chat-escalation-icon" />
      <div className="chat-escalation-content">
        <div className="chat-escalation-title">Transfert en cours</div>
        <div className="chat-escalation-subtitle">
          {content}
          {estimatedWaitTime && (
            <span> Temps d'attente estime : ~{estimatedWaitTime} min</span>
          )}
        </div>
      </div>
    </div>
  );
}
