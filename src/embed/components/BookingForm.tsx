// src/embed/components/BookingForm.tsx
import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEmbedStore } from '../store/embedStore';
import { embedApi } from '../services/embedApi';
import { embedBookingSchema } from '../../lib/validations';
import { useFormValidation } from '../../hooks/useFormValidation';
import type { BookingFormData } from '../types';

export function BookingForm() {
  const {
    config,
    studio,
    selectedService,
    selectedDate,
    selectedSlot,
    formData,
    updateFormData,
    setBookingResult,
    setLoading,
    setError,
    isLoading,
  } = useEmbedStore();

  const getParentOrigin = useCallback((): string => {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch {
      // Invalid referrer URL
    }
    return window.location.origin;
  }, []);

  const postMessageToParent = useCallback((type: string, payload?: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, getParentOrigin());
    }
  }, [getParentOrigin]);

  const submitBooking = useCallback(async () => {
    if (!config?.studioId || !selectedService || !selectedDate || !selectedSlot) {
      setError('Donnees de reservation incompletes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData: BookingFormData = {
        serviceId: selectedService.id,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        clientName: formData.clientName || '',
        clientEmail: formData.clientEmail || '',
        clientPhone: formData.clientPhone || '',
        notes: formData.notes || '',
        acceptTerms: formData.acceptTerms || false,
      };

      const response = await embedApi.createBooking(config.studioId, bookingData);

      if (response.error) {
        setError(response.error);
        postMessageToParent('ROOOM_ERROR', { error: response.error });
      } else if (response.data) {
        setBookingResult(response.data);
        postMessageToParent('ROOOM_BOOKING_COMPLETE', {
          bookingId: response.data.id,
          reference: response.data.reference,
          status: response.data.status,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      postMessageToParent('ROOOM_ERROR', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [config, selectedService, selectedDate, selectedSlot, formData, setLoading, setError, setBookingResult, postMessageToParent]);

  const { errors, touched, handleBlur, handleSubmit } = useFormValidation({
    schema: embedBookingSchema,
    onSubmit: submitBooking,
  });

  const formatPrice = useCallback(
    (price: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: studio?.currency || 'EUR',
      }).format(price);
    },
    [studio?.currency]
  );

  // Compact summary banner text
  const summaryText = useMemo(() => {
    if (!selectedService || !selectedDate || !selectedSlot) return '';

    const date = new Date(selectedDate);
    const formattedDate = format(date, 'EEE d MMM', { locale: fr });
    const startTime = format(new Date(selectedSlot.start), 'HH:mm', { locale: fr });
    const price = formatPrice(selectedSlot.price);

    return `${selectedService.name} — ${formattedDate}, ${startTime} — ${price}`;
  }, [selectedService, selectedDate, selectedSlot, formatPrice]);

  const handleChange = (field: keyof BookingFormData, value: string | boolean) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="rooom-form-container">
      {/* Compact summary banner */}
      {summaryText && (
        <div className="rooom-form-banner">
          {summaryText}
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={(e) => handleSubmit(e, formData)} className="rooom-form-flat">
        <h2 className="rooom-form-title">Vos informations</h2>

        {/* Client Name */}
        <div className="rooom-form-group">
          <label htmlFor="clientName" className="rooom-form-label">
            Nom complet <span className="rooom-form-required">*</span>
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName || ''}
            onChange={(e) => handleChange('clientName', e.target.value)}
            onBlur={() => handleBlur('clientName', formData)}
            placeholder="Jean Dupont"
            className={`rooom-form-input ${errors.clientName && touched.clientName ? 'rooom-form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.clientName && touched.clientName && (
            <span className="rooom-form-error">{errors.clientName}</span>
          )}
        </div>

        {/* Client Email */}
        <div className="rooom-form-group">
          <label htmlFor="clientEmail" className="rooom-form-label">
            Email <span className="rooom-form-required">*</span>
          </label>
          <input
            type="email"
            id="clientEmail"
            name="clientEmail"
            value={formData.clientEmail || ''}
            onChange={(e) => handleChange('clientEmail', e.target.value)}
            onBlur={() => handleBlur('clientEmail', formData)}
            placeholder="jean.dupont@email.com"
            className={`rooom-form-input ${errors.clientEmail && touched.clientEmail ? 'rooom-form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.clientEmail && touched.clientEmail && (
            <span className="rooom-form-error">{errors.clientEmail}</span>
          )}
        </div>

        {/* Client Phone */}
        <div className="rooom-form-group">
          <label htmlFor="clientPhone" className="rooom-form-label">
            Telephone <span className="rooom-form-required">*</span>
          </label>
          <input
            type="tel"
            id="clientPhone"
            name="clientPhone"
            value={formData.clientPhone || ''}
            onChange={(e) => handleChange('clientPhone', e.target.value)}
            onBlur={() => handleBlur('clientPhone', formData)}
            placeholder="+33 6 12 34 56 78"
            className={`rooom-form-input ${errors.clientPhone && touched.clientPhone ? 'rooom-form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.clientPhone && touched.clientPhone && (
            <span className="rooom-form-error">{errors.clientPhone}</span>
          )}
        </div>

        {/* Notes */}
        <div className="rooom-form-group">
          <label htmlFor="notes" className="rooom-form-label">
            Notes <span className="rooom-form-optional">(optionnel)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Informations supplementaires..."
            rows={3}
            className="rooom-form-textarea"
            disabled={isLoading}
          />
        </div>

        {/* Terms */}
        <div className="rooom-form-checkbox-group">
          <label className="rooom-form-checkbox-label">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms || false}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              onBlur={() => handleBlur('acceptTerms', formData)}
              className="rooom-form-checkbox"
              disabled={isLoading}
            />
            <span className="rooom-form-checkbox-text">
              J'accepte les{' '}
              <a
                href={`/studios/${config?.studioId}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="rooom-form-link"
              >
                conditions generales
              </a>{' '}
              et la{' '}
              <a
                href={`/studios/${config?.studioId}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="rooom-form-link"
              >
                politique de confidentialite
              </a>
              <span className="rooom-form-required"> *</span>
            </span>
          </label>
          {errors.acceptTerms && touched.acceptTerms && (
            <span className="rooom-form-error">{errors.acceptTerms}</span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`rooom-form-submit ${isLoading ? 'rooom-form-submit-loading' : ''}`}
        >
          {isLoading ? 'Reservation en cours...' : 'Confirmer la reservation'}
        </button>
      </form>
    </div>
  );
}
