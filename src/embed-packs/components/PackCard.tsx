// src/embed-packs/components/PackCard.tsx
import type { HourPack } from '../types';

interface PackCardProps {
  pack: HourPack;
  onSelect: (pack: HourPack) => void;
  currency?: string;
}

export function PackCard({ pack, onSelect, currency = 'EUR' }: PackCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const pricePerHour = pack.price / pack.hours;

  return (
    <div
      className={`rooom-pack-card ${pack.is_featured ? 'rooom-pack-card-featured' : ''} ${
        pack.is_popular ? 'rooom-pack-card-popular' : ''
      }`}
      onClick={() => onSelect(pack)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(pack)}
    >
      {pack.is_popular && <span className="rooom-pack-badge rooom-pack-badge-popular">Populaire</span>}
      {pack.is_featured && !pack.is_popular && (
        <span className="rooom-pack-badge rooom-pack-badge-featured">Recommande</span>
      )}

      <div className="rooom-pack-header">
        <h3 className="rooom-pack-name">{pack.name}</h3>
        <div className="rooom-pack-hours">
          {pack.hours}
          <span className="rooom-pack-hours-label">heures</span>
        </div>
      </div>

      {pack.description && <p className="rooom-pack-description">{pack.description}</p>}

      <div className="rooom-pack-pricing">
        <span className="rooom-pack-price">{formatPrice(pack.price)}</span>
        {pack.savings_percent > 0 && (
          <span className="rooom-pack-price-original">{formatPrice(pack.regular_price)}</span>
        )}
      </div>

      <div className="rooom-packs-flex rooom-packs-items-center rooom-packs-gap-3">
        <span className="rooom-pack-price-per-hour">{formatPrice(pricePerHour)}/h</span>
        {pack.savings_percent > 0 && (
          <span className="rooom-pack-savings">
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
            -{pack.savings_percent}%
          </span>
        )}
      </div>

      {pack.benefits.length > 0 && (
        <ul className="rooom-pack-benefits">
          {pack.benefits.slice(0, 4).map((benefit, index) => (
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

      <div className="rooom-pack-validity">
        Valide {pack.validity_days} jours apres l'achat
      </div>

      <button
        className="rooom-packs-btn rooom-packs-btn-primary rooom-packs-btn-block rooom-packs-mt-4"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(pack);
        }}
      >
        Acheter ce pack
      </button>
    </div>
  );
}
