// src/embed-packs/components/GiftCertificate.tsx
import { useState } from 'react';
import { usePacksStore } from '../store/packsStore';
import type { GiftCertificate as GiftCertificateType, GiftCertificateFormData } from '../types';

interface GiftCertificateProps {
  certificates: GiftCertificateType[];
  onSelect: (amount: number) => void;
  currency?: string;
}

export function GiftCertificate({ certificates, onSelect, currency = 'EUR' }: GiftCertificateProps) {
  const { selectedGiftAmount, giftFormData, updateGiftFormData, openPurchaseModal, currentView } =
    usePacksStore();

  const [customAmount, setCustomAmount] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const customCert = certificates.find((c) => c.is_custom);
  const fixedAmounts = certificates.filter((c) => !c.is_custom);

  const handleAmountSelect = (amount: number) => {
    onSelect(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      if (customCert?.min_amount && num < customCert.min_amount) {
        setErrors({ ...errors, customAmount: `Minimum ${formatPrice(customCert.min_amount)}` });
      } else if (customCert?.max_amount && num > customCert.max_amount) {
        setErrors({ ...errors, customAmount: `Maximum ${formatPrice(customCert.max_amount)}` });
      } else {
        setErrors({ ...errors, customAmount: '' });
        updateGiftFormData({ amount: num });
      }
    }
  };

  const handleCustomAmountSelect = () => {
    const num = parseFloat(customAmount);
    if (!isNaN(num) && num > 0 && !errors.customAmount) {
      onSelect(num);
    }
  };

  const handleFormChange = (field: keyof GiftCertificateFormData, value: string) => {
    updateGiftFormData({ [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!giftFormData.recipientName?.trim()) {
      newErrors.recipientName = 'Nom requis';
    }
    if (!giftFormData.recipientEmail?.trim()) {
      newErrors.recipientEmail = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giftFormData.recipientEmail)) {
      newErrors.recipientEmail = 'Email invalide';
    }
    if (!giftFormData.senderName?.trim()) {
      newErrors.senderName = 'Votre nom est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = () => {
    if (validateForm()) {
      openPurchaseModal();
    }
  };

  // If in gift form view, show the full form
  if (currentView === 'gift_form') {
    return (
      <div className="rooom-packs-animate-slide-up">
        {/* Amount Summary */}
        <div className="rooom-purchase-summary">
          <div className="rooom-purchase-item">
            <span className="rooom-purchase-item-name">Carte cadeau</span>
            <span className="rooom-purchase-item-price">
              {formatPrice(giftFormData.amount || 0)}
            </span>
          </div>
        </div>

        <div className="rooom-gift-form">
          {/* Recipient Info */}
          <div className="rooom-gift-form-section">
            <h3 className="rooom-gift-form-section-title">Destinataire</h3>

            <div className="rooom-packs-input-group">
              <label className="rooom-packs-label rooom-packs-label-required">Nom</label>
              <input
                type="text"
                className={`rooom-packs-input ${errors.recipientName ? 'rooom-packs-input-error' : ''}`}
                placeholder="Nom du destinataire"
                value={giftFormData.recipientName || ''}
                onChange={(e) => handleFormChange('recipientName', e.target.value)}
              />
              {errors.recipientName && (
                <span className="rooom-packs-error-message">{errors.recipientName}</span>
              )}
            </div>

            <div className="rooom-packs-input-group">
              <label className="rooom-packs-label rooom-packs-label-required">Email</label>
              <input
                type="email"
                className={`rooom-packs-input ${errors.recipientEmail ? 'rooom-packs-input-error' : ''}`}
                placeholder="email@exemple.com"
                value={giftFormData.recipientEmail || ''}
                onChange={(e) => handleFormChange('recipientEmail', e.target.value)}
              />
              {errors.recipientEmail && (
                <span className="rooom-packs-error-message">{errors.recipientEmail}</span>
              )}
            </div>
          </div>

          {/* Sender Info */}
          <div className="rooom-gift-form-section">
            <h3 className="rooom-gift-form-section-title">De la part de</h3>

            <div className="rooom-packs-input-group">
              <label className="rooom-packs-label rooom-packs-label-required">Votre nom</label>
              <input
                type="text"
                className={`rooom-packs-input ${errors.senderName ? 'rooom-packs-input-error' : ''}`}
                placeholder="Votre nom"
                value={giftFormData.senderName || ''}
                onChange={(e) => handleFormChange('senderName', e.target.value)}
              />
              {errors.senderName && (
                <span className="rooom-packs-error-message">{errors.senderName}</span>
              )}
            </div>
          </div>

          {/* Personal Message */}
          <div className="rooom-gift-form-section">
            <h3 className="rooom-gift-form-section-title">Message personnel (optionnel)</h3>
            <textarea
              className="rooom-packs-textarea"
              placeholder="Ecrivez un message personnel pour le destinataire..."
              value={giftFormData.message || ''}
              onChange={(e) => handleFormChange('message', e.target.value)}
              maxLength={500}
            />
            <span className="rooom-packs-text-xs rooom-packs-text-muted">
              {(giftFormData.message?.length || 0)}/500 caracteres
            </span>
          </div>

          {/* Delivery Date */}
          <div className="rooom-gift-form-section">
            <h3 className="rooom-gift-form-section-title">Date d'envoi</h3>
            <div className="rooom-packs-input-group">
              <input
                type="date"
                className="rooom-packs-input"
                value={giftFormData.deliveryDate || ''}
                onChange={(e) => handleFormChange('deliveryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <span className="rooom-packs-text-xs rooom-packs-text-muted">
                Laissez vide pour un envoi immediat apres paiement
              </span>
            </div>
          </div>

          {/* Design Selection */}
          <div className="rooom-gift-form-section">
            <h3 className="rooom-gift-form-section-title">Design</h3>
            <div className="rooom-gift-design-options">
              {(['classic', 'modern', 'festive'] as const).map((design) => (
                <div
                  key={design}
                  className={`rooom-gift-design-option ${
                    giftFormData.design === design ? 'rooom-gift-design-option-selected' : ''
                  }`}
                  onClick={() => updateGiftFormData({ design })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && updateGiftFormData({ design })}
                >
                  <div className="rooom-gift-design-icon">
                    {design === 'classic' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="8" width="18" height="12" rx="2" />
                        <path d="M3 12h18M12 8v12" />
                      </svg>
                    )}
                    {design === 'modern' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    )}
                    {design === 'festive' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="rooom-gift-design-name">
                    {design === 'classic' && 'Classique'}
                    {design === 'modern' && 'Moderne'}
                    {design === 'festive' && 'Festif'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          className="rooom-packs-btn rooom-packs-btn-primary rooom-packs-btn-lg rooom-packs-btn-block rooom-packs-mt-6"
          onClick={handleProceed}
        >
          Continuer vers le paiement
        </button>
      </div>
    );
  }

  // Amount selection view
  return (
    <div>
      <div className="rooom-gift-grid">
        {fixedAmounts.map((cert) => (
          <div
            key={cert.id}
            className={`rooom-gift-amount-card ${
              selectedGiftAmount === cert.amount ? 'rooom-gift-amount-card-selected' : ''
            }`}
            onClick={() => handleAmountSelect(cert.amount)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleAmountSelect(cert.amount)}
          >
            <div className="rooom-gift-amount">{formatPrice(cert.amount)}</div>
            <div className="rooom-gift-amount-label">Carte cadeau</div>
          </div>
        ))}
      </div>

      {customCert && (
        <div className="rooom-packs-mt-6">
          <h3 className="rooom-packs-heading-3 rooom-packs-mb-4">Montant personnalise</h3>
          <div className="rooom-gift-custom-input">
            <input
              type="number"
              placeholder={`${customCert.min_amount || 25} - ${customCert.max_amount || 1000}`}
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              min={customCert.min_amount}
              max={customCert.max_amount}
            />
            <span className="rooom-packs-text-secondary">EUR</span>
            <button
              className="rooom-packs-btn rooom-packs-btn-primary"
              onClick={handleCustomAmountSelect}
              disabled={!customAmount || !!errors.customAmount}
            >
              Selectionner
            </button>
          </div>
          {errors.customAmount && (
            <span className="rooom-packs-error-message rooom-packs-mt-2">{errors.customAmount}</span>
          )}
        </div>
      )}

      <div className="rooom-packs-mt-6" style={{ padding: '20px', backgroundColor: 'var(--rooom-bg-secondary)', borderRadius: '12px' }}>
        <h4 className="rooom-packs-font-semibold rooom-packs-mb-2">Comment ca marche ?</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li className="rooom-pack-benefit">
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
            <span>Choisissez un montant</span>
          </li>
          <li className="rooom-pack-benefit">
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
            <span>Personnalisez avec un message</span>
          </li>
          <li className="rooom-pack-benefit">
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
            <span>Le destinataire recoit un code par email</span>
          </li>
          <li className="rooom-pack-benefit">
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
            <span>Valable 12 mois sur toutes nos offres</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
