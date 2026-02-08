import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useAuthStore } from '../stores/authStore';
import { useBookings } from '../hooks/useBookings';
import { useActiveSpaces } from '../hooks/useSpaces';
import { useNotifications } from '../stores/uiStore';
import type { Booking } from '../types/database';
import {
  detectConflicts,
  hasConflicts,
  getBookingConflicts,
  countConflictsBySeverity,
  type ConflictResult,
} from '../lib/calendarConflicts';
import styles from './Calendar.module.css';

// Time slots for the calendar grid (8h to 21h)
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

// Dropdown option types
type CalendarView = 'daily' | 'weekly' | 'monthly';
type CalendarFilter = 'all' | string;
type ZoomLevel = '0.5x' | '1x' | '2x';

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'daily', label: 'Vue quotidienne' },
  { value: 'weekly', label: 'Vue hebdomadaire' },
  { value: 'monthly', label: 'Vue mensuelle' },
];

const ZOOM_OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: '0.5x', label: '0.5x' },
  { value: '1x', label: '1x' },
  { value: '2x', label: '2x' },
];

export function Calendar() {
  const { studioId } = useAuthStore();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [viewMode, setViewMode] = useState<CalendarView>('daily');
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>('all');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('1x');
  const [openDropdown, setOpenDropdown] = useState<'view' | 'filter' | 'zoom' | 'add' | null>(null);

  // Conflict states
  const [showConflictsPanel, setShowConflictsPanel] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictResult | null>(null);

  // Refs for click-outside handling
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const zoomDropdownRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        openDropdown === 'view' && viewDropdownRef.current && !viewDropdownRef.current.contains(target) ||
        openDropdown === 'filter' && filterDropdownRef.current && !filterDropdownRef.current.contains(target) ||
        openDropdown === 'zoom' && zoomDropdownRef.current && !zoomDropdownRef.current.contains(target) ||
        openDropdown === 'add' && addDropdownRef.current && !addDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (dropdown: 'view' | 'filter' | 'zoom' | 'add') => {
    setOpenDropdown(prev => prev === dropdown ? null : dropdown);
  };

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

  // Detect conflicts
  const conflicts = useMemo(() => {
    return detectConflicts(bookings);
  }, [bookings]);

  const conflictStats = useMemo(() => {
    return countConflictsBySeverity(conflicts);
  }, [conflicts]);

  // Show notification when new conflicts are detected
  useEffect(() => {
    if (conflictStats.total > 0 && bookings.length > 0) {
      const prevConflictCount = sessionStorage.getItem('conflict-count');
      const currentCount = String(conflictStats.total);

      if (prevConflictCount !== currentCount) {
        sessionStorage.setItem('conflict-count', currentCount);

        if (conflictStats.high > 0) {
          notify({
            type: 'error',
            title: 'Conflits détectés',
            message: `${conflictStats.high} conflit(s) critique(s) trouvé(s) dans le calendrier`,
            duration: 8000,
          });
        }
      }
    }
  }, [conflictStats, bookings.length, notify]);

  // Navigation handlers
  const goToToday = () => setSelectedDate(new Date());
  const goPrev = () => setSelectedDate(subDays(selectedDate, 1));
  const goNext = () => setSelectedDate(addDays(selectedDate, 1));

  // Conflict handlers
  const handleCheckConflicts = useCallback(() => {
    if (conflictStats.total === 0) {
      notify({
        type: 'success',
        title: 'Aucun conflit',
        message: 'Aucun conflit détecté dans le calendrier',
      });
    } else {
      setShowConflictsPanel(true);
      notify({
        type: 'info',
        title: `${conflictStats.total} conflit(s) détecté(s)`,
        message: 'Consultez le panneau de conflits pour plus de détails',
      });
    }
  }, [conflictStats.total, notify]);

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

  // Derive filter options from spaces
  const filterOptions: { value: CalendarFilter; label: string }[] = useMemo(() => {
    const options: { value: CalendarFilter; label: string }[] = [
      { value: 'all', label: 'Tous les calendriers' },
    ];
    spaces.forEach(space => {
      options.push({ value: space.id, label: space.name });
    });
    return options;
  }, [spaces]);

  // Header actions
  const headerActions = (
    <>
      <button
        className={styles.conflictsBtn}
        onClick={handleCheckConflicts}
        title="Vérifier les conflits"
      >
        <RefreshCw size={16} />
        VÉRIFIER LES CONFLITS
        {conflictStats.total > 0 && (
          <span className={styles.conflictBadge}>{conflictStats.total}</span>
        )}
      </button>
      <button
        className={styles.secondaryBtn}
        onClick={() => navigate('/bookings')}
      >
        BLOQUER UN CRÉNEAU
      </button>
      <div className={styles.dropdown} ref={addDropdownRef}>
        <button
          className={styles.primaryBtn}
          onClick={() => toggleDropdown('add')}
        >
          AJOUTER
          <ChevronDown size={16} />
        </button>
        {openDropdown === 'add' && (
          <div className={styles.dropdownMenu}>
            <button
              className={styles.dropdownMenuItem}
              onClick={() => {
                setOpenDropdown(null);
                navigate('/bookings');
              }}
            >
              Nouvelle réservation
            </button>
            <button
              className={styles.dropdownMenuItem}
              onClick={() => {
                setOpenDropdown(null);
                navigate('/bookings');
              }}
            >
              Bloquer un créneau
            </button>
          </div>
        )}
      </div>
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

          <div className={styles.dropdown} ref={viewDropdownRef}>
            <button
              className={styles.dropdownBtn}
              onClick={() => toggleDropdown('view')}
            >
              {VIEW_OPTIONS.find(o => o.value === viewMode)?.label}
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'view' && (
              <div className={styles.dropdownMenu}>
                {VIEW_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownMenuItem} ${viewMode === option.value ? styles.dropdownMenuItemActive : ''}`}
                    onClick={() => {
                      setViewMode(option.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.dropdown} ref={filterDropdownRef}>
            <button
              className={styles.dropdownBtn}
              onClick={() => toggleDropdown('filter')}
            >
              {filterOptions.find(o => o.value === calendarFilter)?.label ?? 'Tous les calendriers'}
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'filter' && (
              <div className={styles.dropdownMenu}>
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownMenuItem} ${calendarFilter === option.value ? styles.dropdownMenuItemActive : ''}`}
                    onClick={() => {
                      setCalendarFilter(option.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.dropdown} ref={zoomDropdownRef}>
            <button
              className={styles.dropdownBtn}
              onClick={() => toggleDropdown('zoom')}
            >
              {zoomLevel}
              <ChevronDown size={16} />
            </button>
            {openDropdown === 'zoom' && (
              <div className={styles.dropdownMenu}>
                {ZOOM_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownMenuItem} ${zoomLevel === option.value ? styles.dropdownMenuItemActive : ''}`}
                    onClick={() => {
                      setZoomLevel(option.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
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
          <button className={styles.iconBtn} aria-label="Imprimer" onClick={() => window.print()}>
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
                        const bookingHasConflict = hasConflicts(booking.id, conflicts);
                        const bookingConflicts = getBookingConflicts(booking.id, conflicts);
                        const hasHighSeverity = bookingConflicts.some(c => c.severity === 'high');

                        return (
                          <div
                            key={booking.id}
                            className={`${styles.booking} ${bookingHasConflict ? styles.bookingConflict : ''} ${hasHighSeverity ? styles.bookingConflictHigh : ''}`}
                            style={{
                              height: getBookingHeight(booking),
                              top: getBookingOffset(booking),
                            }}
                            onClick={() => {
                              if (bookingHasConflict) {
                                setSelectedConflict(bookingConflicts[0]);
                                setShowConflictsPanel(true);
                              }
                            }}
                          >
                            {bookingHasConflict && (
                              <div className={styles.conflictIndicator}>
                                <AlertTriangle size={14} />
                                <span className={styles.conflictCount}>{bookingConflicts.length}</span>
                              </div>
                            )}
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

      {/* Conflicts Panel */}
      {showConflictsPanel && (
        <div className={styles.conflictsPanel}>
          <div className={styles.conflictsPanelHeader}>
            <div className={styles.conflictsPanelTitle}>
              <AlertTriangle size={20} />
              <span>Conflits détectés</span>
              <span className={styles.conflictsPanelBadge}>{conflictStats.total}</span>
            </div>
            <button
              className={styles.conflictsPanelClose}
              onClick={() => {
                setShowConflictsPanel(false);
                setSelectedConflict(null);
              }}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.conflictsPanelStats}>
            {conflictStats.high > 0 && (
              <div className={styles.conflictStat}>
                <span className={styles.conflictStatDot} data-severity="high"></span>
                <span className={styles.conflictStatLabel}>Critiques</span>
                <span className={styles.conflictStatValue}>{conflictStats.high}</span>
              </div>
            )}
            {conflictStats.medium > 0 && (
              <div className={styles.conflictStat}>
                <span className={styles.conflictStatDot} data-severity="medium"></span>
                <span className={styles.conflictStatLabel}>Moyens</span>
                <span className={styles.conflictStatValue}>{conflictStats.medium}</span>
              </div>
            )}
            {conflictStats.low > 0 && (
              <div className={styles.conflictStat}>
                <span className={styles.conflictStatDot} data-severity="low"></span>
                <span className={styles.conflictStatLabel}>Faibles</span>
                <span className={styles.conflictStatValue}>{conflictStats.low}</span>
              </div>
            )}
          </div>

          <div className={styles.conflictsList}>
            {conflicts.length === 0 ? (
              <div className={styles.conflictsEmpty}>
                <AlertTriangle size={48} />
                <p>Aucun conflit détecté</p>
              </div>
            ) : (
              conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className={`${styles.conflictItem} ${selectedConflict?.id === conflict.id ? styles.conflictItemSelected : ''}`}
                  onClick={() => setSelectedConflict(conflict)}
                  data-severity={conflict.severity}
                >
                  <div className={styles.conflictItemHeader}>
                    <AlertTriangle size={16} />
                    <span className={styles.conflictItemType}>
                      {conflict.type === 'resource_conflict' && 'Conflit d\'espace'}
                      {conflict.type === 'double_booking' && 'Double réservation'}
                      {conflict.type === 'time_overlap' && 'Chevauchement'}
                    </span>
                    <span className={`${styles.conflictItemSeverity} ${styles[`severity${conflict.severity.charAt(0).toUpperCase()}${conflict.severity.slice(1)}`]}`}>
                      {conflict.severity === 'high' && 'Critique'}
                      {conflict.severity === 'medium' && 'Moyen'}
                      {conflict.severity === 'low' && 'Faible'}
                    </span>
                  </div>

                  <p className={styles.conflictItemMessage}>{conflict.message}</p>

                  <div className={styles.conflictItemBookings}>
                    <div className={styles.conflictItemBooking}>
                      <strong>{conflict.bookingA.title}</strong>
                      <span>
                        {format(conflict.bookingA.start, 'HH:mm')} - {format(conflict.bookingA.end, 'HH:mm')}
                      </span>
                    </div>
                    <div className={styles.conflictItemBooking}>
                      <strong>{conflict.bookingB.title}</strong>
                      <span>
                        {format(conflict.bookingB.start, 'HH:mm')} - {format(conflict.bookingB.end, 'HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.conflictItemActions}>
                    <button
                      className={styles.conflictActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        notify({
                          type: 'info',
                          title: 'Action non disponible',
                          message: 'La résolution de conflits sera disponible prochainement',
                        });
                      }}
                    >
                      Déplacer
                    </button>
                    <button
                      className={styles.conflictActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        notify({
                          type: 'info',
                          title: 'Action non disponible',
                          message: 'La résolution de conflits sera disponible prochainement',
                        });
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      className={`${styles.conflictActionBtn} ${styles.conflictActionBtnGhost}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        notify({
                          type: 'success',
                          title: 'Conflit ignoré',
                          message: 'Le conflit a été marqué comme ignoré',
                        });
                      }}
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
