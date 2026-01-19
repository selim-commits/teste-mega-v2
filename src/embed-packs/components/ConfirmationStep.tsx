// src/embed-packs/components/ConfirmationStep.tsx
import { usePacksStore } from '../store/packsStore';

interface ConfirmationStepProps {
  currency?: string;
}

export function ConfirmationStep({ currency = 'EUR' }: ConfirmationStepProps) {
  const { purchaseResult, reset } = usePacksStore();

  if (!purchaseResult) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isGiftCertificate = purchaseResult.type === 'gift_certificate';

  return (
    <div className="rooom-packs-confirmation rooom-packs-animate-scale-in">
      <div className="rooom-packs-confirmation-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12L9 18L21 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="rooom-packs-confirmation-title">
        {isGiftCertificate ? 'Carte cadeau envoyee !' : 'Achat confirme !'}
      </h2>

      <p className="rooom-packs-confirmation-message">
        {isGiftCertificate
          ? 'Le destinataire recevra sa carte cadeau par email.'
          : 'Vos heures ont ete ajoutees a votre compte.'}
      </p>

      <div className="rooom-packs-confirmation-reference">#{purchaseResult.reference}</div>

      {isGiftCertificate && purchaseResult.giftCertificateCode && (
        <div className="rooom-packs-confirmation-gift-code">
          {purchaseResult.giftCertificateCode}
        </div>
      )}

      <div className="rooom-packs-confirmation-details">
        <div className="rooom-packs-confirmation-detail">
          <span className="rooom-packs-confirmation-detail-label">Article</span>
          <span className="rooom-packs-confirmation-detail-value">{purchaseResult.itemName}</span>
        </div>
        <div className="rooom-packs-confirmation-detail">
          <span className="rooom-packs-confirmation-detail-label">Montant</span>
          <span className="rooom-packs-confirmation-detail-value">
            {formatPrice(purchaseResult.amount)}
          </span>
        </div>
        <div className="rooom-packs-confirmation-detail">
          <span className="rooom-packs-confirmation-detail-label">Statut</span>
          <span
            className="rooom-packs-confirmation-detail-value"
            style={{ color: 'var(--rooom-success)' }}
          >
            {purchaseResult.status === 'completed' ? 'Confirme' : 'En attente'}
          </span>
        </div>
      </div>

      {!isGiftCertificate && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--rooom-bg-secondary)',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <h4 className="rooom-packs-font-semibold rooom-packs-mb-2">Prochaines etapes</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li className="rooom-pack-benefit">
              <svg
                className="rooom-pack-benefit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8L6 11L13 4" />
              </svg>
              <span>Un email de confirmation a ete envoye</span>
            </li>
            <li className="rooom-pack-benefit">
              <svg
                className="rooom-pack-benefit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8L6 11L13 4" />
              </svg>
              <span>Vos heures sont disponibles immediatement</span>
            </li>
            <li className="rooom-pack-benefit">
              <svg
                className="rooom-pack-benefit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8L6 11L13 4" />
              </svg>
              <span>Reservez votre prochain creneau</span>
            </li>
          </ul>
        </div>
      )}

      <div className="rooom-packs-flex rooom-packs-gap-3 rooom-packs-justify-center">
        <button className="rooom-packs-btn rooom-packs-btn-primary" onClick={reset}>
          {isGiftCertificate ? 'Offrir une autre carte' : 'Retour aux offres'}
        </button>
      </div>
    </div>
  );
}
