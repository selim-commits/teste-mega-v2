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

  // Zod validation via hook
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
  }, [config, selectedService, selectedDate, selectedSlot, formData, setLoading, setError, setBookingResult]);

  const { errors, touched, handleBlur, handleSubmit } = useFormValidation({
    schema: embedBookingSchema,
    onSubmit: submitBooking,
  });

  // Format price using studio currency or default to EUR
  const formatPrice = useCallback(
    (price: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: studio?.currency || 'EUR',
      }).format(price);
    },
    [studio?.currency]
  );

  // Format the selected date and time
  const formattedDateTime = useMemo(() => {
    if (!selectedDate || !selectedSlot) return null;

    const date = new Date(selectedDate);
    const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });

    const startTime = new Date(selectedSlot.start);
    const endTime = new Date(selectedSlot.end);
    const formattedStart = format(startTime, 'HH:mm', { locale: fr });
    const formattedEnd = format(endTime, 'HH:mm', { locale: fr });

    return {
      date: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
      time: `${formattedStart} - ${formattedEnd}`,
    };
  }, [selectedDate, selectedSlot]);

  // Handle input change
  const handleChange = (field: keyof BookingFormData, value: string | boolean) => {
    updateFormData({ [field]: value });
  };

  // Post message to parent window with secure origin
  const getParentOrigin = (): string => {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch {
      // Invalid referrer URL
    }
    // Ne pas utiliser '*' - utiliser l'origin du document comme fallback securise
    return window.location.origin;
  };

  const postMessageToParent = (type: string, payload?: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, getParentOrigin());
    }
  };

  return (
    <div style={styles.container}>
      {/* Booking Summary Card */}
      <div style={styles.summaryCard}>
        <h3 style={styles.summaryTitle}>Resume de la reservation</h3>

        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Espace</span>
          <span style={styles.summaryValue}>{selectedService?.name || '-'}</span>
        </div>

        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Date & Heure</span>
          <span style={styles.summaryValue}>
            {formattedDateTime ? (
              <>
                {formattedDateTime.date}
                <br />
                <span style={styles.timeValue}>{formattedDateTime.time}</span>
              </>
            ) : (
              '-'
            )}
          </span>
        </div>

        <div style={styles.summaryDivider} />

        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Prix</span>
          <span style={styles.priceValue}>
            {selectedSlot ? formatPrice(selectedSlot.price) : '-'}
          </span>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={(e) => handleSubmit(e, formData)} style={styles.form}>
        <h2 style={styles.formTitle}>Vos informations</h2>

        {/* Client Name Field */}
        <div style={styles.formGroup}>
          <label htmlFor="clientName" style={styles.label}>
            Nom complet <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName || ''}
            onChange={(e) => handleChange('clientName', e.target.value)}
            onBlur={() => handleBlur('clientName', formData)}
            placeholder="Jean Dupont"
            style={{
              ...styles.input,
              ...(errors.clientName && touched.clientName ? styles.inputError : {}),
            }}
            disabled={isLoading}
          />
          {errors.clientName && touched.clientName && (
            <span style={styles.errorText}>{errors.clientName}</span>
          )}
        </div>

        {/* Client Email Field */}
        <div style={styles.formGroup}>
          <label htmlFor="clientEmail" style={styles.label}>
            Email <span style={styles.required}>*</span>
          </label>
          <input
            type="email"
            id="clientEmail"
            name="clientEmail"
            value={formData.clientEmail || ''}
            onChange={(e) => handleChange('clientEmail', e.target.value)}
            onBlur={() => handleBlur('clientEmail', formData)}
            placeholder="jean.dupont@email.com"
            style={{
              ...styles.input,
              ...(errors.clientEmail && touched.clientEmail ? styles.inputError : {}),
            }}
            disabled={isLoading}
          />
          {errors.clientEmail && touched.clientEmail && (
            <span style={styles.errorText}>{errors.clientEmail}</span>
          )}
        </div>

        {/* Client Phone Field */}
        <div style={styles.formGroup}>
          <label htmlFor="clientPhone" style={styles.label}>
            Telephone <span style={styles.required}>*</span>
          </label>
          <input
            type="tel"
            id="clientPhone"
            name="clientPhone"
            value={formData.clientPhone || ''}
            onChange={(e) => handleChange('clientPhone', e.target.value)}
            onBlur={() => handleBlur('clientPhone', formData)}
            placeholder="+33 6 12 34 56 78"
            style={{
              ...styles.input,
              ...(errors.clientPhone && touched.clientPhone ? styles.inputError : {}),
            }}
            disabled={isLoading}
          />
          {errors.clientPhone && touched.clientPhone && (
            <span style={styles.errorText}>{errors.clientPhone}</span>
          )}
        </div>

        {/* Notes Field (Optional) */}
        <div style={styles.formGroup}>
          <label htmlFor="notes" style={styles.label}>
            Notes <span style={styles.optional}>(optionnel)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Informations supplementaires pour votre reservation..."
            rows={3}
            style={styles.textarea}
            disabled={isLoading}
          />
        </div>

        {/* Accept Terms Checkbox */}
        <div style={styles.checkboxGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms || false}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              onBlur={() => handleBlur('acceptTerms', formData)}
              style={styles.checkbox}
              disabled={isLoading}
            />
            <span style={styles.checkboxText}>
              J'accepte les{' '}
              <a
                href={`/studios/${config?.studioId}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                conditions generales
              </a>{' '}
              et la{' '}
              <a
                href={`/studios/${config?.studioId}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                politique de confidentialite
              </a>
              <span style={styles.required}> *</span>
            </span>
          </label>
          {errors.acceptTerms && touched.acceptTerms && (
            <span style={styles.errorText}>{errors.acceptTerms}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.submitButton,
            ...(isLoading ? styles.submitButtonDisabled : {}),
          }}
        >
          {isLoading ? (
            <span style={styles.loadingContent}>
              <span style={styles.spinner} />
              Reservation en cours...
            </span>
          ) : (
            'Confirmer la reservation'
          )}
        </button>
      </form>
    </div>
  );
}

// Inline styles with CSS variables
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 'var(--space-4, 1rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4, 1rem)',
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: 'var(--bg-secondary, #f9fafb)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-lg, 0.75rem)',
    padding: 'var(--space-4, 1rem)',
  },
  summaryTitle: {
    fontFamily: 'var(--font-display, inherit)',
    fontSize: 'var(--text-base, 1rem)',
    fontWeight: 600,
    color: 'var(--text-primary, #1a1a1a)',
    margin: '0 0 var(--space-3, 0.75rem) 0',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-2, 0.5rem)',
  },
  summaryLabel: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-sm, 0.875rem)',
    color: 'var(--text-secondary, #6b7280)',
  },
  summaryValue: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-sm, 0.875rem)',
    fontWeight: 500,
    color: 'var(--text-primary, #1a1a1a)',
    textAlign: 'right' as const,
  },
  timeValue: {
    fontSize: 'var(--text-xs, 0.75rem)',
    color: 'var(--text-secondary, #6b7280)',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: 'var(--border-default, #e5e7eb)',
    margin: 'var(--space-3, 0.75rem) 0',
  },
  priceValue: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-lg, 1.125rem)',
    fontWeight: 700,
    color: 'var(--accent-primary, #3b82f6)',
  },

  // Form Styles
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4, 1rem)',
  },
  formTitle: {
    fontFamily: 'var(--font-display, inherit)',
    fontSize: 'var(--text-lg, 1.125rem)',
    fontWeight: 600,
    color: 'var(--text-primary, #1a1a1a)',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1, 0.25rem)',
  },
  label: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-sm, 0.875rem)',
    fontWeight: 500,
    color: 'var(--text-primary, #1a1a1a)',
  },
  required: {
    color: 'var(--state-error, #ef4444)',
  },
  optional: {
    fontWeight: 400,
    color: 'var(--text-tertiary, #9ca3af)',
  },
  input: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-base, 1rem)',
    padding: 'var(--space-3, 0.75rem)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-md, 0.5rem)',
    backgroundColor: 'var(--bg-primary, #ffffff)',
    color: 'var(--text-primary, #1a1a1a)',
    outline: 'none',
    transition: 'all var(--duration-fast, 150ms) var(--ease-default, ease)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: 'var(--state-error, #ef4444)',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.1)',
  },
  textarea: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-base, 1rem)',
    padding: 'var(--space-3, 0.75rem)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-md, 0.5rem)',
    backgroundColor: 'var(--bg-primary, #ffffff)',
    color: 'var(--text-primary, #1a1a1a)',
    outline: 'none',
    transition: 'all var(--duration-fast, 150ms) var(--ease-default, ease)',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: '80px',
  },
  errorText: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-xs, 0.75rem)',
    color: 'var(--state-error, #ef4444)',
    marginTop: 'var(--space-1, 0.25rem)',
  },

  // Checkbox Styles
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1, 0.25rem)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-2, 0.5rem)',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    accentColor: 'var(--accent-primary, #3b82f6)',
    cursor: 'pointer',
  },
  checkboxText: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-sm, 0.875rem)',
    color: 'var(--text-secondary, #6b7280)',
    lineHeight: 1.5,
  },
  link: {
    color: 'var(--accent-primary, #3b82f6)',
    textDecoration: 'underline',
  },

  // Submit Button Styles
  submitButton: {
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: 'var(--text-base, 1rem)',
    fontWeight: 600,
    padding: 'var(--space-3, 0.75rem) var(--space-4, 1rem)',
    backgroundColor: 'var(--accent-primary, #3b82f6)',
    color: 'var(--color-white, #ffffff)',
    border: 'none',
    borderRadius: 'var(--radius-md, 0.5rem)',
    cursor: 'pointer',
    transition: 'all var(--duration-fast, 150ms) var(--ease-default, ease)',
    marginTop: 'var(--space-2, 0.5rem)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2, 0.5rem)',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTopColor: 'currentColor',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
