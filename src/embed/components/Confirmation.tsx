// src/embed/components/Confirmation.tsx
import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEmbedStore } from '../store/embedStore';

export function Confirmation() {
  const { bookingResult, studio, reset } = useEmbedStore();

  const formatCurrency = (amount: number) => {
    const currency = studio?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  const formatTime = (timeString: string) => {
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return format(date, 'HH:mm', { locale: fr });
    }
    return timeString;
  };

  // Generate calendar links
  const calendarLinks = useMemo(() => {
    if (!bookingResult) return null;

    const title = encodeURIComponent(
      `${bookingResult.service.name} - ${studio?.name || 'Rooom'}`
    );
    const startDate = new Date(bookingResult.startTime);
    const endDate = new Date(bookingResult.endTime);

    // Google Calendar format: YYYYMMDDTHHmmssZ
    const googleStart = format(startDate, "yyyyMMdd'T'HHmmss");
    const googleEnd = format(endDate, "yyyyMMdd'T'HHmmss");
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${googleStart}/${googleEnd}`;

    // ICS format for Outlook/Apple
    const icsStart = format(startDate, "yyyyMMdd'T'HHmmss");
    const icsEnd = format(endDate, "yyyyMMdd'T'HHmmss");
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${icsStart}`,
      `DTEND:${icsEnd}`,
      `SUMMARY:${bookingResult.service.name} - ${studio?.name || 'Rooom'}`,
      `DESCRIPTION:Ref: ${bookingResult.reference}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const icsBlob = new Blob([icsContent], { type: 'text/calendar' });
    const icsUrl = URL.createObjectURL(icsBlob);

    return { googleUrl, icsUrl };
  }, [bookingResult, studio?.name]);

  if (!bookingResult) {
    return null;
  }

  return (
    <div className="rooom-confirm">
      {/* Check icon */}
      <div className="rooom-confirm-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="rooom-confirm-title">Reservation confirmee !</h2>

      {/* Reference */}
      <div className="rooom-confirm-ref">{bookingResult.reference}</div>

      {/* Summary */}
      <div className="rooom-confirm-summary">
        <div className="rooom-confirm-row">
          <span className="rooom-confirm-label">Espace</span>
          <span className="rooom-confirm-value">{bookingResult.service.name}</span>
        </div>
        <div className="rooom-confirm-divider" />
        <div className="rooom-confirm-row">
          <span className="rooom-confirm-label">Date</span>
          <span className="rooom-confirm-value">{formatDate(bookingResult.date)}</span>
        </div>
        <div className="rooom-confirm-divider" />
        <div className="rooom-confirm-row">
          <span className="rooom-confirm-label">Horaire</span>
          <span className="rooom-confirm-value">
            {formatTime(bookingResult.startTime)} - {formatTime(bookingResult.endTime)}
          </span>
        </div>
        <div className="rooom-confirm-divider" />
        <div className="rooom-confirm-row">
          <span className="rooom-confirm-label">Total</span>
          <span className="rooom-confirm-value rooom-confirm-total">
            {formatCurrency(bookingResult.totalAmount)}
          </span>
        </div>
      </div>

      {/* Calendar links */}
      {calendarLinks && (
        <div className="rooom-confirm-cal-links">
          <a
            href={calendarLinks.googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rooom-confirm-cal-btn"
          >
            Google Calendar
          </a>
          <a
            href={calendarLinks.icsUrl}
            download="reservation.ics"
            className="rooom-confirm-cal-btn"
          >
            Outlook
          </a>
          <a
            href={calendarLinks.icsUrl}
            download="reservation.ics"
            className="rooom-confirm-cal-btn"
          >
            Apple Calendar
          </a>
        </div>
      )}

      {/* Email notice */}
      <p className="rooom-confirm-email">
        Un email de confirmation a ete envoye a votre adresse email.
      </p>

      {/* New booking button */}
      <button
        type="button"
        className="rooom-confirm-new-btn"
        onClick={reset}
      >
        Nouvelle reservation
      </button>
    </div>
  );
}
