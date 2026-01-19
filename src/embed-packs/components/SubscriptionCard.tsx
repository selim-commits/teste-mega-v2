// src/embed-packs/components/SubscriptionCard.tsx
import type { Subscription } from '../types';

interface SubscriptionCardProps {
  subscription: Subscription;
  onSelect: (subscription: Subscription) => void;
  currency?: string;
}

export function SubscriptionCard({ subscription, onSelect, currency = 'EUR' }: SubscriptionCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isYearly = subscription.billing_cycle === 'yearly';

  return (
    <div
      className={`rooom-subscription-card ${
        subscription.is_featured ? 'rooom-subscription-card-featured' : ''
      }`}
      onClick={() => onSelect(subscription)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(subscription)}
    >
      {subscription.is_featured && (
        <span className="rooom-pack-badge rooom-pack-badge-featured">Meilleur choix</span>
      )}

      <span className="rooom-subscription-billing">
        {isYearly ? 'Engagement annuel' : 'Sans engagement'}
      </span>

      <h3 className="rooom-subscription-name">{subscription.name}</h3>

      {subscription.description && (
        <p className="rooom-pack-description">{subscription.description}</p>
      )}

      <div className="rooom-subscription-pricing">
        <span className="rooom-subscription-price">
          {formatPrice(subscription.price_per_month)}
          <span className="rooom-subscription-price-period">/mois</span>
        </span>
        {isYearly && subscription.yearly_price && (
          <p className="rooom-subscription-yearly-note">
            Soit {formatPrice(subscription.yearly_price)} facture annuellement
          </p>
        )}
      </div>

      <div className="rooom-subscription-hours">
        <span className="rooom-subscription-hours-value">{subscription.hours_per_month}</span>
        <span className="rooom-subscription-hours-label">
          heures/mois
          {isYearly && ` (${subscription.hours_per_month * 12}h/an)`}
        </span>
      </div>

      {subscription.savings_percent > 0 && (
        <div className="rooom-pack-savings rooom-packs-mb-4">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9V3M6 3L3 6M6 3L9 6" />
          </svg>
          Economisez {subscription.savings_percent}% par rapport au tarif horaire
        </div>
      )}

      {subscription.benefits.length > 0 && (
        <ul className="rooom-pack-benefits">
          {subscription.benefits.map((benefit, index) => (
            <li key={index} className="rooom-pack-benefit">
              <svg
                className="rooom-pack-benefit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8L6 11L13 4" />
              </svg>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      {subscription.rollover_hours && (
        <div className="rooom-pack-validity">
          {subscription.max_rollover_hours
            ? `Heures cumulables (max ${subscription.max_rollover_hours}h)`
            : 'Heures cumulables sans limite'}
        </div>
      )}

      <button
        className="rooom-packs-btn rooom-packs-btn-primary rooom-packs-btn-block rooom-packs-mt-4"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(subscription);
        }}
      >
        S'abonner
      </button>
    </div>
  );
}
