// src/embed-packs/components/PurchaseModal.tsx
import { useState } from 'react';
import { usePacksStore } from '../store/packsStore';
import { packsApi } from '../services/packsApi';
import type { PurchaseRequest } from '../types';

const isValidPaymentUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

interface PurchaseModalProps {
  currency?: string;
}

export function PurchaseModal({ currency = 'EUR' }: PurchaseModalProps) {
  const {
    showPurchaseModal,
    closePurchaseModal,
    selectedPack,
    selectedSubscription,
    giftFormData,
    currentView,
    promoCode,
    promoDiscount,
    setPromoCode,
    setPromoDiscount,
    setPurchaseResult,
    isProcessing,
    setProcessing,
    setError,
    config,
  } = usePacksStore();

  const [localPromoCode, setLocalPromoCode] = useState(promoCode);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  if (!showPurchaseModal) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Determine what we're purchasing
  let itemName = '';
  let itemPrice = 0;
  let itemType: 'pack' | 'subscription' | 'gift_certificate' = 'pack';
  let itemId = '';

  if (selectedPack) {
    itemName = `Pack ${selectedPack.name} - ${selectedPack.hours}h`;
    itemPrice = selectedPack.price;
    itemType = 'pack';
    itemId = selectedPack.id;
  } else if (selectedSubscription) {
    const isYearly = selectedSubscription.billing_cycle === 'yearly';
    itemName = `Abonnement ${selectedSubscription.name}`;
    itemPrice = isYearly
      ? selectedSubscription.yearly_price || selectedSubscription.price_per_month * 12
      : selectedSubscription.price_per_month;
    itemType = 'subscription';
    itemId = selectedSubscription.id;
  } else if (currentView === 'gift_form' && giftFormData.amount) {
    itemName = `Carte cadeau ${formatPrice(giftFormData.amount)}`;
    itemPrice = giftFormData.amount;
    itemType = 'gift_certificate';
    itemId = 'gift-custom';
  }

  const discountAmount = promoDiscount ? (itemPrice * promoDiscount) / 100 : 0;
  const finalPrice = itemPrice - discountAmount;

  const handleValidatePromo = async () => {
    if (!localPromoCode.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    const result = await packsApi.validatePromoCode(
      config?.studioId || '',
      localPromoCode.trim(),
      itemType,
      itemId
    );

    setPromoLoading(false);

    if (result.error) {
      setPromoError('Erreur lors de la validation');
      return;
    }

    if (result.data?.valid) {
      setPromoCode(localPromoCode.trim().toUpperCase());
      setPromoDiscount(result.data.discount_percent);
      setPromoError(null);
    } else {
      setPromoError(result.data?.message || 'Code promo invalide');
      setPromoDiscount(null);
    }
  };

  const handlePurchase = async () => {
    setProcessing(true);
    setError(null);

    const request: PurchaseRequest = {
      type: itemType,
      itemId,
      promoCode: promoCode || undefined,
      giftData:
        itemType === 'gift_certificate'
          ? {
              amount: giftFormData.amount || 0,
              recipientName: giftFormData.recipientName || '',
              recipientEmail: giftFormData.recipientEmail || '',
              senderName: giftFormData.senderName || '',
              message: giftFormData.message || '',
              deliveryDate: giftFormData.deliveryDate || null,
              design: giftFormData.design || 'classic',
            }
          : undefined,
    };

    const result = await packsApi.createPurchase(config?.studioId || '', request);

    setProcessing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data?.paymentUrl) {
      if (isValidPaymentUrl(result.data.paymentUrl)) {
        // Redirect to validated HTTPS Stripe checkout
        window.location.href = result.data.paymentUrl;
      } else {
        setError('URL de paiement invalide ou non securisee');
        return;
      }
    } else {
      // Payment completed (mock)
      setPurchaseResult(result.data!);
    }
  };

  return (
    <div className="rooom-packs-modal-overlay" onClick={closePurchaseModal} onKeyDown={(e) => { if (e.key === 'Escape') closePurchaseModal(); }} role="button" tabIndex={-1} aria-label="Fermer">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="rooom-packs-modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="rooom-packs-modal-header">
          <h3 className="rooom-packs-modal-title">Recapitulatif</h3>
          <button className="rooom-packs-modal-close" onClick={closePurchaseModal}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        <div className="rooom-packs-modal-body">
          {/* Purchase Summary */}
          <div className="rooom-purchase-summary">
            <div className="rooom-purchase-item">
              <span className="rooom-purchase-item-name">{itemName}</span>
              <span className="rooom-purchase-item-price">{formatPrice(itemPrice)}</span>
            </div>

            {promoDiscount && promoDiscount > 0 && (
              <div className="rooom-purchase-item" style={{ color: 'var(--rooom-success)' }}>
                <span className="rooom-purchase-item-name">Reduction ({promoCode})</span>
                <span className="rooom-purchase-item-price">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="rooom-purchase-divider" />

            <div className="rooom-purchase-item rooom-purchase-total">
              <span className="rooom-purchase-item-name">Total</span>
              <span className="rooom-purchase-item-price">{formatPrice(finalPrice)}</span>
            </div>
          </div>

          {/* Gift Certificate Details */}
          {itemType === 'gift_certificate' && giftFormData.recipientName && (
            <div className="rooom-packs-mb-4">
              <h4 className="rooom-packs-font-semibold rooom-packs-mb-2">Details du cadeau</h4>
              <div className="rooom-packs-text-sm rooom-packs-text-secondary">
                <p>
                  <strong>Pour:</strong> {giftFormData.recipientName}
                </p>
                <p>
                  <strong>Email:</strong> {giftFormData.recipientEmail}
                </p>
                {giftFormData.message && (
                  <p>
                    <strong>Message:</strong> {giftFormData.message}
                  </p>
                )}
                <p>
                  <strong>Envoi:</strong>{' '}
                  {giftFormData.deliveryDate
                    ? new Date(giftFormData.deliveryDate).toLocaleDateString('fr-FR')
                    : 'Immediat'}
                </p>
              </div>
            </div>
          )}

          {/* Promo Code Input */}
          {!promoDiscount && (
            <div className="rooom-promo-input">
              <input
                type="text"
                placeholder="Code promo"
                value={localPromoCode}
                onChange={(e) => setLocalPromoCode(e.target.value.toUpperCase())}
                disabled={promoLoading}
              />
              <button
                className="rooom-packs-btn rooom-packs-btn-secondary rooom-packs-btn-sm"
                onClick={handleValidatePromo}
                disabled={promoLoading || !localPromoCode.trim()}
              >
                {promoLoading ? 'Verification...' : 'Appliquer'}
              </button>
            </div>
          )}

          {promoError && (
            <p className="rooom-packs-error-message rooom-packs-mb-4">{promoError}</p>
          )}

          {promoDiscount && promoDiscount > 0 && (
            <div className="rooom-promo-success">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8L6 11L13 4" />
              </svg>
              Code {promoCode} applique: -{promoDiscount}%
            </div>
          )}

          {/* Subscription Note */}
          {selectedSubscription && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--rooom-info-bg)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--rooom-info)',
              }}
            >
              <strong>Note:</strong> Votre abonnement sera renouvele automatiquement.
              Vous pouvez annuler a tout moment avec un preavis de{' '}
              {selectedSubscription.cancellation_notice_days} jours.
            </div>
          )}
        </div>

        <div className="rooom-packs-modal-footer">
          <button className="rooom-packs-btn rooom-packs-btn-secondary" onClick={closePurchaseModal}>
            Annuler
          </button>
          <button
            className="rooom-packs-btn rooom-packs-btn-primary"
            onClick={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="rooom-packs-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Traitement...
              </>
            ) : (
              <>Payer {formatPrice(finalPrice)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
