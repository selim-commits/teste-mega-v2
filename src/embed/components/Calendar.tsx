// src/embed/components/Calendar.tsx
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function Calendar({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: CalendarProps) {
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || minDate || today
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true;
    return false;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const canGoPrev = !minDate || !isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfDay(minDate));
  const canGoNext = !maxDate || !isBefore(startOfDay(maxDate), startOfMonth(addMonths(currentMonth, 1)));

  return (
    <div className="rooom-calendar" style={styles.calendar}>
      {/* Header with navigation */}
      <div className="rooom-calendar-header" style={styles.header}>
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          style={{
            ...styles.navButton,
            ...(canGoPrev ? {} : styles.navButtonDisabled),
          }}
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon />
        </button>
        <span className="rooom-calendar-title" style={styles.title}>
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          style={{
            ...styles.navButton,
            ...(canGoNext ? {} : styles.navButtonDisabled),
          }}
          aria-label="Mois suivant"
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="rooom-calendar-weekdays" style={styles.weekdays}>
        {weekDays.map((day) => (
          <div key={day} style={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rooom-calendar-grid" style={styles.grid}>
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const disabled = !isCurrentMonth || isDateDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && onSelectDate(day)}
              disabled={disabled}
              style={{
                ...styles.dayButton,
                ...(isCurrentMonth ? {} : styles.dayOtherMonth),
                ...(isTodayDate && !isSelected ? styles.dayToday : {}),
                ...(isSelected ? styles.daySelected : {}),
                ...(disabled ? styles.dayDisabled : {}),
              }}
              aria-label={format(day, 'd MMMM yyyy', { locale: fr })}
              aria-pressed={isSelected || undefined}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Need to import useState
import { useState } from 'react';

// Icons
function ChevronLeftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 15L12.5 10L7.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Inline styles
const styles: Record<string, React.CSSProperties> = {
  calendar: {
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    borderRadius: '0.75rem',
    padding: '1rem',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    color: 'var(--rooom-text-primary, #1a1a1a)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    textTransform: 'capitalize',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  weekday: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--rooom-text-muted, #9ca3af)',
    textAlign: 'center',
    padding: '0.5rem 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.25rem',
  },
  dayButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '1',
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: 'transparent',
    color: 'var(--rooom-text-primary, #1a1a1a)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dayOtherMonth: {
    color: 'var(--rooom-text-muted, #9ca3af)',
    opacity: 0.5,
  },
  dayToday: {
    backgroundColor: 'var(--rooom-bg-muted, #f3f4f6)',
    fontWeight: 700,
  },
  daySelected: {
    backgroundColor: 'var(--rooom-accent-color, #3b82f6)',
    color: '#ffffff',
    fontWeight: 600,
  },
  dayDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const,
  },
};
