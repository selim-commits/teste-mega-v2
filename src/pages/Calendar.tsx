import { useState, useMemo, useCallback } from 'react';
import {
  format,
  addDays,
  subDays,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Printer,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useAuthStore } from '../stores/authStore';
import { useBookings } from '../hooks/useBookings';
import { useActiveSpaces } from '../hooks/useSpaces';
import type { Booking } from '../types/database';
import styles from './Calendar.module.css';

// Time slots for the calendar grid (8h to 21h)
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export function Calendar() {
  const { studioId } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate date range
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [selectedDate]);

  // Queries
  const { data: bookings = [] } = useBookings({
    studioId: studioId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: spaces = [] } = useActiveSpaces(studioId || '');

  // Navigation handlers
  const goToToday = () => setSelectedDate(new Date());
  const goPrev = () => setSelectedDate(subDays(selectedDate, 1));
  const goNext = () => setSelectedDate(addDays(selectedDate, 1));

  // Get bookings for a specific space and time slot
  const getBookingsForSlot = useCallback((spaceId: string, date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = setMinutes(setHours(date, hours), minutes);
    const slotEnd = setMinutes(setHours(date, hours + 1), 0);

    return bookings.filter((booking) => {
      if (booking.space_id !== spaceId) return false;
      const bookingStart = parseISO(booking.start_time);
      const bookingEnd = parseISO(booking.end_time);
      const bookingDateStr = format(bookingStart, 'yyyy-MM-dd');
      if (bookingDateStr !== dateStr) return false;
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  }, [bookings]);

  // Check if a booking starts at this slot
  const isBookingStart = useCallback((booking: Booking, date: Date, time: string) => {
    const bookingStart = parseISO(booking.start_time);
    const bookingDateStr = format(bookingStart, 'yyyy-MM-dd');
    const dateStr = format(date, 'yyyy-MM-dd');
    const bookingTimeStr = format(bookingStart, 'HH:mm');
    return bookingDateStr === dateStr && bookingTimeStr === time;
  }, []);

  // Calculate booking height in pixels (based on duration)
  const getBookingHeight = useCallback((booking: Booking) => {
    const start = parseISO(booking.start_time);
    const end = parseISO(booking.end_time);
    const durationMinutes = differenceInMinutes(end, start);
    return Math.max((durationMinutes / 60) * 60, 30); // 60px per hour, min 30px
  }, []);

  // Get booking top offset
  const getBookingOffset = useCallback((booking: Booking) => {
    const start = parseISO(booking.start_time);
    const minutes = start.getMinutes();
    return (minutes / 60) * 60; // 60px per hour
  }, []);

  // Count today's bookings
  const todayBookingsCount = bookings.length;

  // Header actions
  const headerActions = (
    <>
      <button className={styles.secondaryBtn}>
        BLOQUER UN CRÉNEAU
      </button>
      <button className={styles.primaryBtn}>
        AJOUTER
        <ChevronDown size={16} />
      </button>
    </>
  );

  return (
    <div className={styles.page}>
      <Header
        title="Rendez-vous du jour"
        subtitle={`${todayBookingsCount} rendez-vous`}
        actions={headerActions}
      />

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <button className={styles.navBtn} onClick={goPrev} aria-label="Periode precedente">
            <ChevronLeft size={20} />
          </button>
          <button className={styles.todayBtn} onClick={goToToday}>
            AUJOURD'HUI
          </button>
          <button className={styles.navBtn} onClick={goNext} aria-label="Periode suivante">
            <ChevronRight size={20} />
          </button>

          <div className={styles.dropdown}>
            <button className={styles.dropdownBtn}>
              Vue quotidienne
              <ChevronDown size={16} />
            </button>
          </div>

          <div className={styles.dropdown}>
            <button className={styles.dropdownBtn}>
              Tous les calendriers
              <ChevronDown size={16} />
            </button>
          </div>

          <div className={styles.dropdown}>
            <button className={styles.dropdownBtn}>
              1x
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        <div className={styles.filterRight}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button className={styles.iconBtn} aria-label="Imprimer">
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarContainer}>
        <div className={styles.calendarGrid}>
          {/* Time Column */}
          <div className={styles.timeColumn}>
            <div className={styles.cornerCell}></div>
            {TIME_SLOTS.map((time) => (
              <div key={time} className={styles.timeCell}>
                {time}
              </div>
            ))}
          </div>

          {/* Space Columns */}
          {spaces.map((space) => (
            <div key={space.id} className={styles.spaceColumn}>
              <div className={styles.spaceHeader}>
                {space.name}
              </div>
              <div className={styles.slotsContainer}>
                {TIME_SLOTS.map((time) => {
                  const slotBookings = getBookingsForSlot(space.id, selectedDate, time);

                  return (
                    <div key={`${space.id}-${time}`} className={styles.timeSlot}>
                      {slotBookings.map((booking) => {
                        if (!isBookingStart(booking, selectedDate, time)) return null;
                        return (
                          <div
                            key={booking.id}
                            className={styles.booking}
                            style={{
                              height: getBookingHeight(booking),
                              top: getBookingOffset(booking),
                            }}
                          >
                            <div className={styles.bookingTime}>
                              {format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
                            </div>
                            <div className={styles.bookingTitle}>{booking.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Show placeholder if no spaces */}
          {spaces.length === 0 && (
            <>
              <div className={styles.spaceColumn}>
                <div className={styles.spaceHeader}>Studio Carmaxx</div>
                <div className={styles.slotsContainer}>
                  {TIME_SLOTS.map((time) => (
                    <div key={`placeholder1-${time}`} className={styles.timeSlot} />
                  ))}
                </div>
              </div>
              <div className={styles.spaceColumn}>
                <div className={styles.spaceHeader}>Studio Perle</div>
                <div className={styles.slotsContainer}>
                  {TIME_SLOTS.map((time) => (
                    <div key={`placeholder2-${time}`} className={styles.timeSlot} />
                  ))}
                </div>
              </div>
              <div className={styles.spaceColumn}>
                <div className={styles.spaceHeader}>Studio sable</div>
                <div className={styles.slotsContainer}>
                  {TIME_SLOTS.map((time) => (
                    <div key={`placeholder3-${time}`} className={styles.timeSlot} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
