import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import styles from './Calendar.module.css';

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  events?: { date: Date; count: number; color?: string }[];
  className?: string;
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  events = [],
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const result: (Date | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      result.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(new Date(year, month, i));
    }

    return result;
  }, [currentMonth]);

  const isSelected = (date: Date | null) => {
    if (!date || !value) return false;
    return date.toDateString() === value.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isDisabled = (date: Date | null) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getEventForDate = (date: Date | null) => {
    if (!date) return null;
    return events.find((e) => e.date.toDateString() === date.toDateString());
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onChange?.(today);
  };

  return (
    <div className={cn(styles.calendar, className)}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={goToPreviousMonth} aria-label="Mois precedent">
          <ChevronLeft size={18} />
        </button>
        <div className={styles.monthYear}>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </motion.span>
          </AnimatePresence>
        </div>
        <button className={styles.navBtn} onClick={goToNextMonth} aria-label="Mois suivant">
          <ChevronRight size={18} />
        </button>
      </div>

      <button className={styles.todayBtn} onClick={goToToday}>
        Aujourd'hui
      </button>

      <div className={styles.weekDays}>
        {DAYS.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {days.map((date, index) => {
          const event = getEventForDate(date);
          return (
            <motion.button
              key={index}
              className={cn(
                styles.day,
                !date && styles.empty,
                isToday(date) && styles.today,
                isSelected(date) && styles.selected,
                isDisabled(date) && styles.disabled
              )}
              onClick={() => date && !isDisabled(date) && onChange?.(date)}
              whileHover={date && !isDisabled(date) ? { scale: 1.1 } : undefined}
              whileTap={date && !isDisabled(date) ? { scale: 0.95 } : undefined}
              disabled={isDisabled(date)}
            >
              {date?.getDate()}
              {event && (
                <span
                  className={styles.eventDot}
                  style={{ backgroundColor: event.color || 'var(--accent-orange)' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  label,
  error,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={cn(styles.datePicker, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <button
        className={cn(styles.trigger, error && styles.error)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? formatDate(value) : placeholder}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Calendar
              value={value}
              onChange={(date) => {
                onChange?.(date);
                setIsOpen(false);
              }}
              minDate={minDate}
              maxDate={maxDate}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
