// src/embed/components/Calendar.tsx
import { useState } from 'react';
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
    <div className="rooom-cal">
      {/* Header with navigation */}
      <div className="rooom-cal-header">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className={`rooom-cal-nav-btn ${!canGoPrev ? 'rooom-cal-nav-disabled' : ''}`}
          aria-label="Mois precedent"
        >
          ‹
        </button>
        <span className="rooom-cal-title">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          className={`rooom-cal-nav-btn ${!canGoNext ? 'rooom-cal-nav-disabled' : ''}`}
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="rooom-cal-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="rooom-cal-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rooom-cal-grid">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const disabled = !isCurrentMonth || isDateDisabled(day);

          let className = 'rooom-cal-day';
          if (!isCurrentMonth) className += ' rooom-cal-day-other';
          if (isTodayDate && !isSelected) className += ' rooom-cal-day-today';
          if (isSelected) className += ' rooom-cal-day-selected';
          if (disabled) className += ' rooom-cal-day-disabled';

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && onSelectDate(day)}
              disabled={disabled}
              className={className}
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
