import { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isToday,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../stores/authStore';
import { useBookingStore, type ViewMode } from '../stores/bookingStore';
import {
  useBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useUpdateBookingStatus,
} from '../hooks/useBookings';
import { useActiveSpaces } from '../hooks/useSpaces';
import { useActiveClients } from '../hooks/useClients';
import type { Booking, BookingStatus, Space } from '../types/database';
import { BookingFormModal, initialFormData } from './space-control/BookingFormModal';
import type { BookingFormData } from './space-control/BookingFormModal';
import { BookingDetailModal } from './space-control/BookingDetailModal';
import styles from './SpaceControl.module.css';

// Time slots for the calendar grid (8h to 21h)
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

// Status colors for badges
const STATUS_COLORS: Record<BookingStatus, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'success',
  completed: 'default',
  cancelled: 'error',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

// View mode options
const VIEW_OPTIONS = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];

// Default space colors
const SPACE_COLORS = [
  '#FF4400', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export function SpaceControl() {
  // Auth store
  const { studioId } = useAuthStore();

  // Booking store for view state
  const {
    selectedDate,
    viewMode,
    filters,
    setSelectedDate,
    setViewMode,
  } = useBookingStore();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [createFormData, setCreateFormData] = useState<BookingFormData>(initialFormData);
  const [userVisibleSpaces, setUserVisibleSpaces] = useState<Set<string> | null>(null);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(start, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(start, { weekStartsOn: 1 });
      return {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      };
    } else {
      const monthStart = startOfMonth(start);
      const monthEnd = endOfMonth(start);
      return {
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      };
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [selectedDate, viewMode]);

  // Get week days for weekly view
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [selectedDate, viewMode]);

  // Get month days for monthly view
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate, viewMode]);

  // Mini calendar month days
  const miniCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  // Queries
  const { data: bookings = [], isLoading: bookingsLoading, error: bookingsError } = useBookings({
    studioId: studioId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    status: filters.status !== 'all' ? filters.status : undefined,
    spaceId: filters.spaceId || undefined,
  });

  const { data: spaces = [], isLoading: spacesLoading } = useActiveSpaces(studioId || '');
  const { data: clients = [], isLoading: clientsLoading } = useActiveClients(studioId || '');

  // Derive visible spaces: user overrides or all spaces by default
  const allSpaceIds = useMemo(() => new Set(spaces.map(s => s.id)), [spaces]);
  const visibleSpaces = userVisibleSpaces ?? allSpaceIds;
  const setVisibleSpaces = setUserVisibleSpaces;

  // Filter bookings by visible spaces
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => visibleSpaces.has(b.space_id));
  }, [bookings, visibleSpaces]);

  // Mutations
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();
  const updateStatusMutation = useUpdateBookingStatus();

  // Format date for display
  const formatDateHeader = useCallback((date: Date) => {
    if (viewMode === 'day') {
      return format(date, "EEEE d MMMM yyyy", { locale: fr });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'd', { locale: fr })} - ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`;
      }
      return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
    }
    return format(date, 'MMMM yyyy', { locale: fr });
  }, [viewMode]);

  // Navigation handlers
  const goToToday = () => setSelectedDate(new Date());

  const goPrev = () => {
    if (viewMode === 'day') {
      setSelectedDate(subDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const goNext = () => {
    if (viewMode === 'day') {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  // Get space color
  const getSpaceColor = useCallback((space: Space, index?: number) => {
    return space.color || SPACE_COLORS[index !== undefined ? index % SPACE_COLORS.length : 0];
  }, []);

  // Get client name for a booking
  const getClientName = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || 'Client inconnu';
  }, [clients]);

  // Get space name for a booking
  const getSpaceName = useCallback((spaceId: string) => {
    return spaces.find((s) => s.id === spaceId)?.name || 'Espace inconnu';
  }, [spaces]);

  // Get bookings for a specific day
  const getBookingsForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredBookings.filter((booking) => {
      const bookingDate = format(parseISO(booking.start_time), 'yyyy-MM-dd');
      return bookingDate === dateStr;
    });
  }, [filteredBookings]);

  // Get bookings for a specific space and time slot
  const getBookingsForSlot = useCallback((spaceId: string, date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = setMinutes(setHours(date, hours), minutes);
    const slotEnd = setMinutes(setHours(date, hours + 1), 0);

    return filteredBookings.filter((booking) => {
      if (booking.space_id !== spaceId) return false;
      const bookingStart = parseISO(booking.start_time);
      const bookingEnd = parseISO(booking.end_time);
      const bookingDateStr = format(bookingStart, 'yyyy-MM-dd');
      if (bookingDateStr !== dateStr) return false;
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  }, [filteredBookings]);

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
    return Math.max((durationMinutes / 60) * 50, 25); // 50px per hour, min 25px
  }, []);

  // Handle slot click to create booking
  const handleSlotClick = (spaceId: string, date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const [hours] = time.split(':').map(Number);
    const endHour = hours + 1;

    setCreateFormData({
      ...initialFormData,
      space_id: spaceId,
      start_time: `${dateStr}T${time}`,
      end_time: `${dateStr}T${endHour.toString().padStart(2, '0')}:00`,
    });
    setShowCreateModal(true);
  };

  // Handle day click in month view
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  // Handle booking click to view details
  const handleBookingClick = (booking: Booking, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  // Toggle space visibility
  const toggleSpaceVisibility = (spaceId: string) => {
    const newSet = new Set(visibleSpaces);
    if (newSet.has(spaceId)) {
      newSet.delete(spaceId);
    } else {
      newSet.add(spaceId);
    }
    setVisibleSpaces(newSet);
  };

  // Toggle all spaces visibility
  const toggleAllSpaces = () => {
    if (visibleSpaces.size === spaces.length) {
      setVisibleSpaces(new Set());
    } else {
      setVisibleSpaces(new Set(spaces.map(s => s.id)));
    }
  };

  // Handle form submission for create
  const handleCreateSubmit = async (formData: BookingFormData) => {
    if (!studioId) return;

    try {
      await createBookingMutation.mutateAsync({
        studio_id: studioId,
        space_id: formData.space_id,
        client_id: formData.client_id,
        title: formData.title,
        description: formData.description || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        status: formData.status,
        notes: formData.notes || null,
        created_by: studioId,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  // Handle form submission for update
  const handleUpdateSubmit = async (data: {
    title: string;
    description: string;
    space_id: string;
    client_id: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    notes: string;
  }) => {
    if (!selectedBooking) return;

    try {
      await updateBookingMutation.mutateAsync({
        id: selectedBooking.id,
        data: {
          title: data.title,
          description: data.description || null,
          space_id: data.space_id,
          client_id: data.client_id,
          start_time: new Date(data.start_time).toISOString(),
          end_time: new Date(data.end_time).toISOString(),
          status: data.status,
          notes: data.notes || null,
        },
      });
      setShowDetailModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  // Handle delete booking
  const handleDelete = async () => {
    if (!selectedBooking) return;

    try {
      await deleteBookingMutation.mutateAsync(selectedBooking.id);
      setShowDetailModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (status: BookingStatus) => {
    if (!selectedBooking) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedBooking.id,
        status,
      });
      setSelectedBooking({ ...selectedBooking, status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Space options for select
  const spaceOptions = spaces.map((space) => ({
    value: space.id,
    label: space.name,
  }));

  // Client options for select
  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));

  // Loading state
  const isLoading = bookingsLoading || spacesLoading || clientsLoading;

  // Render Day View
  const renderDayView = () => (
    <div className={styles.dayViewContainer}>
      <div className={styles.timeColumn}>
        <div className={styles.cornerCell} />
        {TIME_SLOTS.map((time) => (
          <div key={time} className={styles.timeCell}>
            {time}
          </div>
        ))}
      </div>
      <div className={styles.dayViewGrid}>
        {spaces.filter(s => visibleSpaces.has(s.id)).map((space, index) => (
          <div key={space.id} className={styles.spaceColumn}>
            <div className={styles.spaceHeader}>
              <div
                className={styles.spaceColorDot}
                style={{ backgroundColor: getSpaceColor(space, index) }}
              />
              <div className={styles.spaceInfo}>
                <span className={styles.spaceName}>{space.name}</span>
                <span className={styles.spaceCapacity}>{space.capacity} pers.</span>
              </div>
            </div>
            <div className={styles.slotGrid}>
              {TIME_SLOTS.map((time) => {
                const slotBookings = getBookingsForSlot(space.id, selectedDate, time);

                return (
                  <div
                    key={`${space.id}-${time}`}
                    className={styles.timeSlot}
                    onClick={() => !slotBookings.length && handleSlotClick(space.id, selectedDate, time)}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !slotBookings.length) { e.preventDefault(); handleSlotClick(space.id, selectedDate, time); } }}
                    role="button"
                    tabIndex={0}
                  >
                    {slotBookings.map((booking) => {
                      if (!isBookingStart(booking, selectedDate, time)) return null;
                      return (
                        <div
                          key={booking.id}
                          className={`${styles.bookingBlock} ${styles.animateIn}`}
                          style={{
                            height: getBookingHeight(booking),
                            backgroundColor: `${getSpaceColor(space, index)}20`,
                            borderLeftColor: getSpaceColor(space, index),
                          }}
                          onClick={(e) => handleBookingClick(booking, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBookingClick(booking); } }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={styles.bookingTime}>
                            {format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
                          </div>
                          <div className={styles.bookingTitle}>{booking.title}</div>
                          <div className={styles.bookingClient}>{getClientName(booking.client_id)}</div>
                          <Badge variant={STATUS_COLORS[booking.status]} size="sm">
                            {STATUS_LABELS[booking.status]}
                          </Badge>
                        </div>
                      );
                    })}
                    {!slotBookings.length && (
                      <div className={styles.emptySlotIndicator}>
                        <Plus size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Week View
  const renderWeekView = () => (
    <div className={styles.weekViewContainer}>
      <div className={styles.weekHeader}>
        <div className={styles.weekTimeHeader} />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`${styles.weekDayHeader} ${isToday(day) ? styles.today : ''}`}
            onClick={() => {
              setSelectedDate(day);
              setViewMode('day');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(day); setViewMode('day'); } }}
            role="button"
            tabIndex={0}
          >
            <span className={styles.weekDayName}>{format(day, 'EEE', { locale: fr })}</span>
            <span className={`${styles.weekDayNumber} ${isToday(day) ? styles.todayNumber : ''}`}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.weekBody}>
        <div className={styles.timeColumn}>
          {TIME_SLOTS.map((time) => (
            <div key={time} className={styles.timeCell}>
              {time}
            </div>
          ))}
        </div>
        <div className={styles.weekGrid}>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className={styles.weekDayColumn}>
              {TIME_SLOTS.map((time) => (
                <div key={`${day.toISOString()}-${time}`} className={styles.weekTimeSlot}>
                  {spaces.filter(s => visibleSpaces.has(s.id)).map((space, index) => {
                    const slotBookings = getBookingsForSlot(space.id, day, time);
                    return slotBookings.map((booking) => {
                      if (!isBookingStart(booking, day, time)) return null;
                      const heightHours = differenceInMinutes(parseISO(booking.end_time), parseISO(booking.start_time)) / 60;
                      return (
                        <div
                          key={booking.id}
                          className={styles.weekBookingBlock}
                          style={{
                            height: `${heightHours * 100}%`,
                            backgroundColor: `${getSpaceColor(space, index)}20`,
                            borderLeftColor: getSpaceColor(space, index),
                          }}
                          onClick={(e) => handleBookingClick(booking, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBookingClick(booking); } }}
                          role="button"
                          tabIndex={0}
                        >
                          <span className={styles.weekBookingTime}>
                            {format(parseISO(booking.start_time), 'HH:mm')}
                          </span>
                          <span className={styles.weekBookingTitle}>{booking.title}</span>
                        </div>
                      );
                    });
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Month View
  const renderMonthView = () => (
    <div className={styles.monthViewContainer}>
      <div className={styles.monthHeader}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className={styles.monthDayHeader}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {monthDays.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          return (
            <div
              key={day.toISOString()}
              className={`${styles.monthDay} ${!isCurrentMonth ? styles.otherMonth : ''} ${isToday(day) ? styles.today : ''}`}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDayClick(day); } }}
              role="button"
              tabIndex={0}
            >
              <span className={`${styles.monthDayNumber} ${isToday(day) ? styles.todayNumber : ''}`}>
                {format(day, 'd')}
              </span>
              <div className={styles.monthBookings}>
                {dayBookings.slice(0, 3).map((booking) => {
                  const space = spaces.find(s => s.id === booking.space_id);
                  const spaceIndex = spaces.findIndex(s => s.id === booking.space_id);
                  return (
                    <div
                      key={booking.id}
                      className={styles.monthBookingItem}
                      style={{
                        backgroundColor: `${getSpaceColor(space!, spaceIndex)}20`,
                        borderLeftColor: getSpaceColor(space!, spaceIndex),
                      }}
                      onClick={(e) => handleBookingClick(booking, e)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBookingClick(booking); } }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className={styles.monthBookingTime}>
                        {format(parseISO(booking.start_time), 'HH:mm')}
                      </span>
                      <span className={styles.monthBookingTitle}>{booking.title}</span>
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className={styles.monthMoreBookings}>
                    +{dayBookings.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render Mini Calendar
  const renderMiniCalendar = () => (
    <div className={styles.miniCalendar}>
      <div className={styles.miniCalendarHeader}>
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} onClick={() => setSelectedDate(subMonths(selectedDate, 1))} />
        <span className={styles.miniCalendarTitle}>
          {format(selectedDate, 'MMMM yyyy', { locale: fr })}
        </span>
        <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} onClick={() => setSelectedDate(addMonths(selectedDate, 1))} />
      </div>
      <div className={styles.miniCalendarGrid}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
          <div key={`${day}-${i}`} className={styles.miniCalendarDayName}>{day}</div>
        ))}
        {miniCalendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              className={`${styles.miniCalendarDay} ${!isCurrentMonth ? styles.otherMonth : ''} ${isSelected ? styles.selected : ''} ${isToday(day) ? styles.today : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Header
        title="Space Control"
        subtitle="Calendrier des reservations"
      />

      <div className={styles.content}>
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarContent}>
              {/* New Booking Button */}
              <Button
                variant="primary"
                fullWidth
                icon={<Plus size={18} />}
                onClick={() => {
                  setCreateFormData(initialFormData);
                  setShowCreateModal(true);
                }}
              >
                Nouvelle reservation
              </Button>

              {/* Mini Calendar */}
              {renderMiniCalendar()}

              {/* Space Filters */}
              <div className={styles.spaceFilters}>
                <div className={styles.spaceFiltersHeader}>
                  <span className={styles.spaceFiltersTitle}>Espaces</span>
                  <button
                    className={styles.toggleAllBtn}
                    onClick={toggleAllSpaces}
                  >
                    {visibleSpaces.size === spaces.length ? 'Masquer tout' : 'Afficher tout'}
                  </button>
                </div>
                <div className={styles.spaceList}>
                  {spaces.map((space, index) => (
                    <label key={space.id} className={styles.spaceItem}>
                      <input
                        type="checkbox"
                        checked={visibleSpaces.has(space.id)}
                        onChange={() => toggleSpaceVisibility(space.id)}
                        className={styles.spaceCheckbox}
                        style={{ accentColor: getSpaceColor(space, index) }}
                      />
                      <span
                        className={styles.spaceColorIndicator}
                        style={{ backgroundColor: getSpaceColor(space, index) }}
                      />
                      <span className={styles.spaceLabel}>{space.name}</span>
                      <span className={styles.spaceBookingCount}>
                        {filteredBookings.filter(b => b.space_id === space.id).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Calendar */}
          <main className={styles.mainContent}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.navGroup}>
                <Button variant="ghost" size="sm" icon={<ChevronLeft size={18} />} onClick={goPrev} />
                <Button variant="secondary" size="sm" onClick={goToToday}>
                  Aujourd'hui
                </Button>
                <Button variant="ghost" size="sm" icon={<ChevronRight size={18} />} onClick={goNext} />
                <h2 className={styles.dateTitle}>{formatDateHeader(selectedDate)}</h2>
              </div>

              <div className={styles.viewGroup}>
                <div className={styles.viewToggle}>
                  {VIEW_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`${styles.viewBtn} ${viewMode === option.value ? styles.active : ''}`}
                      onClick={() => setViewMode(option.value as ViewMode)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error state */}
            {bookingsError && (
              <Card padding="md" className={styles.errorCard}>
                <AlertCircle size={20} />
                <span>Erreur lors du chargement des reservations</span>
              </Card>
            )}

            {/* Calendar Views */}
            <Card padding="none" className={styles.calendarCard}>
              {isLoading ? (
                <div className={styles.loadingState}>
                  <Skeleton width="100%" height={400} />
                </div>
              ) : (
                <>
                  {viewMode === 'day' && renderDayView()}
                  {viewMode === 'week' && renderWeekView()}
                  {viewMode === 'month' && renderMonthView()}
                </>
              )}
            </Card>
          </main>
        </div>
      </div>

      {/* Create Booking Modal */}
      <BookingFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateFormData(initialFormData);
        }}
        onSubmit={handleCreateSubmit}
        initialData={createFormData}
        spaceOptions={spaceOptions}
        clientOptions={clientOptions}
        isSubmitting={createBookingMutation.isPending}
      />

      {/* Booking Detail/Edit Modal */}
      <BookingDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onUpdate={handleUpdateSubmit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        spaceOptions={spaceOptions}
        clientOptions={clientOptions}
        getSpaceName={getSpaceName}
        getClientName={getClientName}
        isUpdating={updateBookingMutation.isPending}
        isDeleting={deleteBookingMutation.isPending}
        isStatusUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
}
