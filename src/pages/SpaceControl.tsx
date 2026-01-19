import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  MapPin,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
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
import styles from './SpaceControl.module.css';

// Time slots for the calendar grid
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
];

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

interface BookingFormData {
  title: string;
  description: string;
  space_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string;
}

const initialFormData: BookingFormData = {
  title: '',
  description: '',
  space_id: '',
  client_id: '',
  start_time: '',
  end_time: '',
  status: 'pending',
  notes: '',
};

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
    setFilters,
    resetFilters,
  } = useBookingStore();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [selectedDate, viewMode]);

  // Get week days for weekly view
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const days: Date[] = [];
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate, viewMode]);

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

  // Mutations
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();
  const updateStatusMutation = useUpdateBookingStatus();

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Navigation handlers
  const goToToday = () => setSelectedDate(new Date());

  const goPrev = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const goNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Get bookings for a specific space and time
  const getBookingsForSlot = useCallback((spaceId: string, date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const slotStart = new Date(`${dateStr}T${time}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);

    return bookings.filter((booking) => {
      if (booking.space_id !== spaceId) return false;
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  }, [bookings]);

  // Check if a booking starts at this slot
  const isBookingStart = useCallback((booking: Booking, date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const bookingStart = new Date(booking.start_time);
    const bookingDateStr = bookingStart.toISOString().split('T')[0];
    const bookingTimeStr = bookingStart.toTimeString().slice(0, 5);
    return bookingDateStr === dateStr && bookingTimeStr === time;
  }, []);

  // Calculate booking span (number of time slots)
  const getBookingSpan = useCallback((booking: Booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.ceil(hours);
  }, []);

  // Get space color
  const getSpaceColor = (space: Space) => {
    return space.color || '#FF4400';
  };

  // Get client name for a booking
  const getClientName = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || 'Client inconnu';
  }, [clients]);

  // Handle slot click to create booking
  const handleSlotClick = (spaceId: string, date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const endTime = new Date(`${dateStr}T${time}:00`);
    endTime.setHours(endTime.getHours() + 1);

    setFormData({
      ...initialFormData,
      space_id: spaceId,
      start_time: `${dateStr}T${time}`,
      end_time: `${dateStr}T${endTime.toTimeString().slice(0, 5)}`,
    });
    setIsEditing(false);
    setShowCreateModal(true);
  };

  // Handle booking click to view details
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      title: booking.title,
      description: booking.description || '',
      space_id: booking.space_id,
      client_id: booking.client_id,
      start_time: booking.start_time.slice(0, 16),
      end_time: booking.end_time.slice(0, 16),
      status: booking.status,
      notes: booking.notes || '',
    });
    setShowDetailModal(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof BookingFormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = 'Le titre est requis';
    }
    if (!formData.space_id) {
      errors.space_id = 'L\'espace est requis';
    }
    if (!formData.client_id) {
      errors.client_id = 'Le client est requis';
    }
    if (!formData.start_time) {
      errors.start_time = 'L\'heure de debut est requise';
    }
    if (!formData.end_time) {
      errors.end_time = 'L\'heure de fin est requise';
    }
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.end_time = 'L\'heure de fin doit etre apres l\'heure de debut';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for create/update
  const handleSubmit = async () => {
    if (!validateForm() || !studioId) return;

    try {
      if (isEditing && selectedBooking) {
        await updateBookingMutation.mutateAsync({
          id: selectedBooking.id,
          data: {
            title: formData.title,
            description: formData.description || null,
            space_id: formData.space_id,
            client_id: formData.client_id,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString(),
            status: formData.status,
            notes: formData.notes || null,
          },
        });
        setShowDetailModal(false);
      } else {
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
          created_by: studioId, // TODO: Use actual user ID
        });
        setShowCreateModal(false);
      }

      setFormData(initialFormData);
      setIsEditing(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error saving booking:', error);
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
      setFormData({ ...formData, status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Close modals
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
    setIsEditing(false);
    setFormData(initialFormData);
    setFormErrors({});
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

  // Status options for select
  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirme' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Termine' },
    { value: 'cancelled', label: 'Annule' },
  ];

  // Filter options
  const filterSpaceOptions = [
    { value: '', label: 'Tous les espaces' },
    ...spaceOptions,
  ];

  const filterStatusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    ...statusOptions,
  ];

  // Loading state
  const isLoading = bookingsLoading || spacesLoading || clientsLoading;
  const isMutating = createBookingMutation.isPending || updateBookingMutation.isPending || deleteBookingMutation.isPending;

  // Calculate space stats
  const getSpaceStats = (space: Space) => {
    const spaceBookings = bookings.filter((b) => b.space_id === space.id && b.status !== 'cancelled');
    const totalHours = spaceBookings.reduce((acc, b) => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    const totalSlots = TIME_SLOTS.length * (viewMode === 'week' ? 7 : 1);
    const occupationRate = totalSlots > 0 ? Math.round((totalHours / totalSlots) * 100) : 0;

    return {
      bookingCount: spaceBookings.length,
      occupationRate,
    };
  };

  return (
    <div className={styles.page}>
      <Header
        title="Space Control"
        subtitle="Gerez vos espaces et reservations"
      />

      <div className={styles.content}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.dateNav}>
            <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={goPrev} />
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={goNext} />
            <span className={styles.currentDate}>{formatDate(selectedDate)}</span>
          </div>

          <div className={styles.toolbarActions}>
            <Select
              options={VIEW_OPTIONS}
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              size="sm"
            />
            <div className={styles.filterWrapper}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Filter size={16} />}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                Filtres
                {(filters.spaceId || filters.status !== 'all') && (
                  <span className={styles.filterBadge}>
                    {[filters.spaceId, filters.status !== 'all' ? 1 : 0].filter(Boolean).length}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    className={styles.filterDropdown}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <div className={styles.filterGroup}>
                      <label>Espace</label>
                      <Select
                        options={filterSpaceOptions}
                        value={filters.spaceId || ''}
                        onChange={(value) => setFilters({ spaceId: value || null })}
                        size="sm"
                        fullWidth
                      />
                    </div>
                    <div className={styles.filterGroup}>
                      <label>Statut</label>
                      <Select
                        options={filterStatusOptions}
                        value={filters.status}
                        onChange={(value) => setFilters({ status: value as BookingStatus | 'all' })}
                        size="sm"
                        fullWidth
                      />
                    </div>
                    <div className={styles.filterActions}>
                      <Button variant="ghost" size="sm" onClick={resetFilters}>
                        Reinitialiser
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setShowFilterDropdown(false)}>
                        Appliquer
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => {
                setFormData(initialFormData);
                setIsEditing(false);
                setShowCreateModal(true);
              }}
            >
              Nouvelle reservation
            </Button>
          </div>
        </div>

        {/* Error state */}
        {bookingsError && (
          <Card padding="md" className={styles.errorCard}>
            <AlertCircle size={20} />
            <span>Erreur lors du chargement des reservations</span>
          </Card>
        )}

        {/* Calendar Grid */}
        <Card padding="none" className={styles.calendarCard}>
          {isLoading ? (
            <div className={styles.loadingGrid}>
              <div className={styles.timeColumn}>
                <div className={styles.cornerCell} />
                {TIME_SLOTS.map((time) => (
                  <div key={time} className={styles.timeCell}>
                    <Skeleton width={40} height={16} />
                  </div>
                ))}
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.studioColumn}>
                  <div className={styles.studioHeader}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="40%" height={12} />
                    </div>
                  </div>
                  <div className={styles.slotGrid}>
                    {TIME_SLOTS.map((time) => (
                      <div key={time} className={styles.emptySlot} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'week' ? (
            // Weekly view
            <div className={styles.calendar}>
              <div className={styles.timeColumn}>
                <div className={styles.cornerCell} />
                {TIME_SLOTS.map((time) => (
                  <div key={time} className={styles.timeCell}>
                    {time}
                  </div>
                ))}
              </div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className={styles.dayColumn}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayName}>{formatShortDate(day)}</span>
                  </div>
                  {spaces.map((space) => (
                    <div key={space.id} className={styles.spaceDay}>
                      <div
                        className={styles.spaceDayLabel}
                        style={{ borderLeftColor: getSpaceColor(space) }}
                      >
                        {space.name}
                      </div>
                      <div className={styles.slotGrid}>
                        {TIME_SLOTS.map((time) => {
                          const slotBookings = getBookingsForSlot(space.id, day, time);
                          const startingBooking = slotBookings.find((b) => isBookingStart(b, day, time));

                          if (startingBooking) {
                            const span = getBookingSpan(startingBooking);
                            return (
                              <motion.div
                                key={`${space.id}-${day.toISOString()}-${time}`}
                                className={styles.bookingSlot}
                                style={{
                                  gridRow: `span ${span}`,
                                  backgroundColor: `${getSpaceColor(space)}15`,
                                  borderLeftColor: getSpaceColor(space),
                                }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => handleBookingClick(startingBooking)}
                              >
                                <div className={styles.bookingTime}>
                                  {new Date(startingBooking.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {new Date(startingBooking.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={styles.bookingClient}>
                                  {getClientName(startingBooking.client_id)}
                                </div>
                                <div className={styles.bookingType}>{startingBooking.title}</div>
                                <Badge variant={STATUS_COLORS[startingBooking.status]} size="sm">
                                  {STATUS_LABELS[startingBooking.status]}
                                </Badge>
                              </motion.div>
                            );
                          }

                          const isOccupied = slotBookings.some((b) => !isBookingStart(b, day, time));
                          if (isOccupied) return null;

                          return (
                            <div
                              key={`${space.id}-${day.toISOString()}-${time}`}
                              className={styles.emptySlot}
                              onClick={() => handleSlotClick(space.id, day, time)}
                            >
                              <Plus size={12} className={styles.addIcon} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            // Day view (default)
            <div className={styles.calendar}>
              <div className={styles.timeColumn}>
                <div className={styles.cornerCell} />
                {TIME_SLOTS.map((time) => (
                  <div key={time} className={styles.timeCell}>
                    {time}
                  </div>
                ))}
              </div>

              {spaces.map((space) => (
                <div key={space.id} className={styles.studioColumn}>
                  <div className={styles.studioHeader}>
                    <div
                      className={styles.studioColor}
                      style={{ backgroundColor: getSpaceColor(space) }}
                    />
                    <div className={styles.studioInfo}>
                      <span className={styles.studioName}>{space.name}</span>
                      <span className={styles.studioType}>
                        {space.capacity} pers. | {space.hourly_rate}$/h
                      </span>
                    </div>
                    <button className={styles.studioMenu}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className={styles.slotGrid}>
                    {TIME_SLOTS.map((time) => {
                      const slotBookings = getBookingsForSlot(space.id, selectedDate, time);
                      const startingBooking = slotBookings.find((b) => isBookingStart(b, selectedDate, time));

                      if (startingBooking) {
                        const span = getBookingSpan(startingBooking);
                        return (
                          <motion.div
                            key={`${space.id}-${time}`}
                            className={styles.bookingSlot}
                            style={{
                              gridRow: `span ${span}`,
                              backgroundColor: `${getSpaceColor(space)}15`,
                              borderLeftColor: getSpaceColor(space),
                            }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => handleBookingClick(startingBooking)}
                          >
                            <div className={styles.bookingTime}>
                              {new Date(startingBooking.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(startingBooking.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={styles.bookingClient}>
                              {getClientName(startingBooking.client_id)}
                            </div>
                            <div className={styles.bookingType}>{startingBooking.title}</div>
                            <Badge variant={STATUS_COLORS[startingBooking.status]} size="sm">
                              {STATUS_LABELS[startingBooking.status]}
                            </Badge>
                          </motion.div>
                        );
                      }

                      const isOccupied = slotBookings.some((b) => !isBookingStart(b, selectedDate, time));
                      if (isOccupied) return null;

                      return (
                        <div
                          key={`${space.id}-${time}`}
                          className={styles.emptySlot}
                          onClick={() => handleSlotClick(space.id, selectedDate, time)}
                        >
                          <Plus size={12} className={styles.addIcon} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Studio Overview */}
        <div className={styles.studioOverview}>
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} padding="md" className={styles.studioCard}>
                <div className={styles.studioCardHeader}>
                  <Skeleton variant="rectangular" width={40} height={40} />
                  <div>
                    <Skeleton width={100} height={16} />
                    <Skeleton width={60} height={14} />
                  </div>
                </div>
                <div className={styles.studioCardStats}>
                  <div className={styles.studioCardStat}>
                    <Skeleton width={30} height={24} />
                    <Skeleton width={80} height={12} />
                  </div>
                  <div className={styles.studioCardStat}>
                    <Skeleton width={40} height={24} />
                    <Skeleton width={60} height={12} />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            spaces.map((space) => {
              const stats = getSpaceStats(space);
              return (
                <Card key={space.id} padding="md" hoverable className={styles.studioCard}>
                  <div className={styles.studioCardHeader}>
                    <div
                      className={styles.studioCardColor}
                      style={{ backgroundColor: getSpaceColor(space) }}
                    />
                    <div>
                      <div className={styles.studioCardName}>{space.name}</div>
                      <div className={styles.studioCardType}>
                        {space.capacity} pers. | {space.hourly_rate}$/h
                      </div>
                    </div>
                  </div>
                  <div className={styles.studioCardStats}>
                    <div className={styles.studioCardStat}>
                      <span className={styles.studioCardValue}>{stats.bookingCount}</span>
                      <span className={styles.studioCardLabel}>Reservations</span>
                    </div>
                    <div className={styles.studioCardStat}>
                      <span className={styles.studioCardValue}>{stats.occupationRate}%</span>
                      <span className={styles.studioCardLabel}>Occupation</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Create Booking Modal */}
      <Modal isOpen={showCreateModal} onClose={handleCloseCreateModal} size="md">
        <ModalHeader title="Nouvelle reservation" onClose={handleCloseCreateModal} />
        <ModalBody>
          <div className={styles.formGrid}>
            <Input
              label="Titre"
              placeholder="Ex: Shooting photo"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={formErrors.title}
              fullWidth
            />
            <Select
              label="Espace"
              options={spaceOptions}
              value={formData.space_id}
              onChange={(value) => setFormData({ ...formData, space_id: value })}
              placeholder="Selectionnez un espace"
              error={formErrors.space_id}
              fullWidth
            />
            <Select
              label="Client"
              options={clientOptions}
              value={formData.client_id}
              onChange={(value) => setFormData({ ...formData, client_id: value })}
              placeholder="Selectionnez un client"
              error={formErrors.client_id}
              fullWidth
            />
            <Input
              label="Date et heure de debut"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              error={formErrors.start_time}
              fullWidth
            />
            <Input
              label="Date et heure de fin"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              error={formErrors.end_time}
              fullWidth
            />
            <Select
              label="Statut"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as BookingStatus })}
              fullWidth
            />
            <Input
              label="Description"
              placeholder="Description optionnelle"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />
            <Input
              label="Notes"
              placeholder="Notes internes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={handleCloseCreateModal}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isMutating}
          >
            {createBookingMutation.isPending ? 'Creation...' : 'Creer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Booking Detail/Edit Modal */}
      <Modal isOpen={showDetailModal} onClose={handleCloseDetailModal} size="md">
        <ModalHeader
          title={isEditing ? 'Modifier la reservation' : 'Details de la reservation'}
          onClose={handleCloseDetailModal}
        />
        <ModalBody>
          {isEditing ? (
            <div className={styles.formGrid}>
              <Input
                label="Titre"
                placeholder="Ex: Shooting photo"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={formErrors.title}
                fullWidth
              />
              <Select
                label="Espace"
                options={spaceOptions}
                value={formData.space_id}
                onChange={(value) => setFormData({ ...formData, space_id: value })}
                placeholder="Selectionnez un espace"
                error={formErrors.space_id}
                fullWidth
              />
              <Select
                label="Client"
                options={clientOptions}
                value={formData.client_id}
                onChange={(value) => setFormData({ ...formData, client_id: value })}
                placeholder="Selectionnez un client"
                error={formErrors.client_id}
                fullWidth
              />
              <Input
                label="Date et heure de debut"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                error={formErrors.start_time}
                fullWidth
              />
              <Input
                label="Date et heure de fin"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                error={formErrors.end_time}
                fullWidth
              />
              <Select
                label="Statut"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as BookingStatus })}
                fullWidth
              />
              <Input
                label="Description"
                placeholder="Description optionnelle"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
              />
              <Input
                label="Notes"
                placeholder="Notes internes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
              />
            </div>
          ) : selectedBooking && (
            <div className={styles.bookingDetails}>
              <div className={styles.detailHeader}>
                <h3>{selectedBooking.title}</h3>
                <Badge variant={STATUS_COLORS[selectedBooking.status]}>
                  {STATUS_LABELS[selectedBooking.status]}
                </Badge>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <Clock size={16} />
                  <div>
                    <span className={styles.detailLabel}>Horaire</span>
                    <span className={styles.detailValue}>
                      {new Date(selectedBooking.start_time).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                      <br />
                      {new Date(selectedBooking.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(selectedBooking.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <MapPin size={16} />
                  <div>
                    <span className={styles.detailLabel}>Espace</span>
                    <span className={styles.detailValue}>
                      {spaces.find((s) => s.id === selectedBooking.space_id)?.name || 'Espace inconnu'}
                    </span>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <User size={16} />
                  <div>
                    <span className={styles.detailLabel}>Client</span>
                    <span className={styles.detailValue}>
                      {getClientName(selectedBooking.client_id)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.description && (
                <div className={styles.detailSection}>
                  <span className={styles.detailLabel}>Description</span>
                  <p>{selectedBooking.description}</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className={styles.detailSection}>
                  <span className={styles.detailLabel}>Notes</span>
                  <p>{selectedBooking.notes}</p>
                </div>
              )}

              <div className={styles.statusActions}>
                <span className={styles.detailLabel}>Changer le statut</span>
                <div className={styles.statusButtons}>
                  {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as BookingStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={selectedBooking.status === status ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isMutating}
              >
                {updateBookingMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
              <Button
                variant="secondary"
                icon={<Edit2 size={16} />}
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
