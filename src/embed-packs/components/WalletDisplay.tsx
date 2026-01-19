// src/embed-packs/components/WalletDisplay.tsx
import { usePacksStore } from '../store/packsStore';

interface WalletDisplayProps {
  currency?: string;
}

export function WalletDisplay({ currency = 'EUR' }: WalletDisplayProps) {
  const { clientWallet } = usePacksStore();

  if (!clientWallet) return null;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatHours = (hours: number) => {
    if (hours === Math.floor(hours)) {
      return `${hours}h`;
    }
    const fullHours = Math.floor(hours);
    const minutes = Math.round((hours - fullHours) * 60);
    return `${fullHours}h${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rooom-wallet-card">
      <div className="rooom-wallet-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <path d="M1 10h22" />
        </svg>
      </div>
      <div className="rooom-wallet-info">
        <div className="rooom-wallet-label">Votre solde</div>
        <div className="rooom-wallet-balance">
          {clientWallet.balance.hours > 0 && (
            <span>{formatHours(clientWallet.balance.hours)}</span>
          )}
          {clientWallet.balance.hours > 0 && clientWallet.balance.credits > 0 && (
            <span> + </span>
          )}
          {clientWallet.balance.credits > 0 && (
            <span>{formatPrice(clientWallet.balance.credits)}</span>
          )}
          {clientWallet.balance.hours === 0 && clientWallet.balance.credits === 0 && (
            <span>0h</span>
          )}
        </div>
        <div className="rooom-wallet-details">
          {clientWallet.activePacks.length > 0 && (
            <span className="rooom-wallet-detail">
              {clientWallet.activePacks.length} pack{clientWallet.activePacks.length > 1 ? 's' : ''} actif{clientWallet.activePacks.length > 1 ? 's' : ''}
            </span>
          )}
          {clientWallet.activeSubscription && (
            <span className="rooom-wallet-detail">
              Abonnement {clientWallet.activeSubscription.subscriptionName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
