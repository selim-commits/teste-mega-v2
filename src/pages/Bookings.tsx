import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  Trash2,
  FileDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BulkActionBar } from '../components/ui/BulkActionBar';
import type { BulkAction } from '../components/ui/BulkActionBar';
import { ConflictWarningModal } from '../components/ui/ConflictWarningModal';
import { useAuthStore } from '../stores/authStore';
import { useBookings, useCreateBooking, useUpdateBookingStatus, useDeleteBooking } from '../hooks/useBookings';
import { useActiveSpaces } from '../hooks/useSpaces';
import { useActiveClients } from '../hooks/useClients';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useNotifications } from '../stores/uiStore';
import { useDoubleBookingPrevention, type ConflictMode } from '../hooks/useDoubleBookingPrevention';
import type { BookingStatus, Booking } from '../types/database';

// Import embed components
import { Calendar } from '../embed/components/Calendar';
import { TimeSlots } from '../embed/components/TimeSlots';
import type { TimeSlot } from '../embed/types';

import styles from './Bookings.module.css';

interface BookingFormData {
  title: string;
  space_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const initialFormData: BookingFormData = {
  title: '',
  space_id: '',
  client_id: '',
  start_time: '',
  end_time: '',
  notes: '',
};

type ViewMode = 'calendar' | 'list';

export function Bookings() {
  const { studioId } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const loadingSlotsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(loadingSlotsTimerRef.current);
  }, []);

  // Fetch data
  const { data: bookings = [] } = useBookings({ studioId: studioId || '' });
  const { data: spaces = [] } = useActiveSpaces(studioId || '');
  const { data: clients = [] } = useActiveClients(studioId || '');
  const createBooking = useCreateBooking();
  const updateBookingStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();
  const { success, error: showError } = useNotifications();

  // Double booking prevention
  const {
    conflictMode,
    conflicts,
    alternativeSlots,
    conflictCounts,
    setConflictMode,
    checkForConflicts,
    clearConflicts,
  } = useDoubleBookingPrevention(bookings);

  // Bulk selection
  const {
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
    selectedCount,
    selectedItems,
  } = useBulkSelection<Booking>(bookings);

  // Calendar date constraints
  const today = startOfDay(new Date());
  const minDate = today;
  const maxDate = addDays(today, 90);

  // Generate time slots for selected date
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];
    const space = spaces.find(s => s.id === selectedSpace) || spaces[0];
    const hourlyRate = space?.hourly_rate || 50;

    // Generate slots from 9am to 8pm
    for (let hour = 9; hour < 20; hour++) {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = (hour + 1).toString().padStart(2, '0');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);

      // Check if slot is booked
      const slotBooking = bookings.find((booking) => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return (
          (selectedSpace === '' || booking.space_id === selectedSpace) &&
          slotStart >= bookingStart &&
          slotStart < bookingEnd
        );
      });

      const isPast = slotStart < new Date();

      slots.push({
        start: `${dateStr}T${startHour}:00:00`,
        end: `${dateStr}T${endHour}:00:00`,
        available: !slotBooking && !isPast,
        price: hourlyRate,
      });
    }

    return slots;
  }, [selectedDate, bookings, selectedSpace, spaces]);

  // Handle date selection from Calendar component
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setIsLoadingSlots(true);
    // Simulate loading for UX
    clearTimeout(loadingSlotsTimerRef.current);
    loadingSlotsTimerRef.current = setTimeout(() => setIsLoadingSlots(false), 300);
  }, []);

  // Handle slot selection
  const handleSelectSlot = useCallback((slot: TimeSlot) => {
    if (!slot.available || !selectedDate) return;

    setSelectedSlot(slot);

    setFormData({
      ...initialFormData,
      space_id: selectedSpace || spaces[0]?.id || '',
      start_time: slot.start,
      end_time: slot.end,
    });
    setIsModalOpen(true);
  }, [selectedDate, selectedSpace, spaces]);

  // Create booking (internal, no conflict check)
  const performCreateBooking = useCallback(async () => {
    if (!studioId || !formData.space_id || !formData.client_id) return;

    try {
      await createBooking.mutateAsync({
        studio_id: studioId,
        space_id: formData.space_id,
        client_id: formData.client_id,
        title: formData.title || 'Nouvelle réservation',
        description: formData.notes,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: 'confirmed' as BookingStatus,
        notes: formData.notes,
        total_amount: 0,
        created_by: '00000000-0000-0000-0000-000000000000',
      });
      setIsModalOpen(false);
      setIsConflictModalOpen(false);
      setFormData(initialFormData);
      setSelectedSlot(null);
      clearConflicts();
      success('Reservation creee', 'La reservation a ete ajoutee avec succes');
    } catch (err) {
      console.error('Failed to create booking:', err);
      showError('Erreur', 'Impossible de creer la reservation');
    }
  }, [studioId, formData, createBooking, clearConflicts, success, showError]);

  // Handle form submission with conflict checking
  const handleSubmit = async () => {
    if (!studioId || !formData.space_id || !formData.client_id) return;

    // Build a temporary booking object for conflict checking
    const tempBooking: Booking = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      studio_id: studioId,
      space_id: formData.space_id,
      client_id: formData.client_id,
      title: formData.title || 'Nouvelle réservation',
      description: formData.notes || null,
      start_time: formData.start_time,
      end_time: formData.end_time,
      status: 'confirmed',
      total_amount: 0,
      paid_amount: 0,
      notes: formData.notes || null,
      internal_notes: null,
      is_recurring: false,
      recurrence_rule: null,
      parent_booking_id: null,
      created_by: '00000000-0000-0000-0000-000000000000',
    };

    const result = checkForConflicts(tempBooking);

    if (result.hasConflicts) {
      // Show conflict modal
      setIsConflictModalOpen(true);
      return;
    }

    // No conflicts: proceed
    await performCreateBooking();
  };

  // Handle force booking from conflict modal
  const handleForceBooking = useCallback(async () => {
    await performCreateBooking();
  }, [performCreateBooking]);

  // Handle selecting an alternative slot
  const handleSelectAlternative = useCallback(
    (slot: { start: string; end: string }) => {
      setFormData((prev) => ({
        ...prev,
        start_time: slot.start,
        end_time: slot.end,
      }));
      setIsConflictModalOpen(false);
      clearConflicts();
    },
    [clearConflicts]
  );

  // Conflict mode options
  const conflictModeOptions = [
    { value: 'block', label: 'Bloquer (empecher les conflits)' },
    { value: 'warn', label: 'Avertir (prevenir mais permettre)' },
    { value: 'allow', label: 'Autoriser (pas de verification)' },
  ];

  // Get bookings count for today
  const todayBookingsCount = useMemo(() => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.start_time);
      return format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
        (selectedSpace === '' || booking.space_id === selectedSpace);
    }).length;
  }, [bookings, selectedSpace]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedCount === 0) return;
    setIsDeleteModalOpen(true);
  }, [selectedCount]);

  const confirmBulkDelete = useCallback(async () => {
    try {
      const deletePromises = selectedItems.map((booking) =>
        deleteBooking.mutateAsync(booking.id)
      );
      await Promise.all(deletePromises);
      success('Suppressions réussies', `${selectedCount} réservation(s) supprimée(s)`);
      clearSelection();
      setIsDeleteModalOpen(false);
    } catch (err) {
      showError('Erreur', 'Impossible de supprimer les réservations');
    }
  }, [selectedItems, selectedCount, deleteBooking, success, showError, clearSelection]);

  const handleBulkStatusChange = useCallback(
    async (status: BookingStatus) => {
      if (selectedCount === 0) return;

      try {
        const updatePromises = selectedItems.map((booking) =>
          updateBookingStatus.mutateAsync({ id: booking.id, status })
        );
        await Promise.all(updatePromises);

        const statusLabels: Record<BookingStatus, string> = {
          pending: 'en attente',
          confirmed: 'confirmées',
          in_progress: 'en cours',
          completed: 'terminées',
          cancelled: 'annulées',
        };

        success(
          'Statuts mis à jour',
          `${selectedCount} réservation(s) ${statusLabels[status]}`
        );
        clearSelection();
      } catch (err) {
        showError('Erreur', 'Impossible de mettre à jour les statuts');
      }
    },
    [selectedItems, selectedCount, updateBookingStatus, success, showError, clearSelection]
  );

  const handleBulkExport = useCallback(() => {
    if (selectedCount === 0) return;

    // Generate CSV
    const headers = ['ID', 'Titre', 'Client', 'Espace', 'Début', 'Fin', 'Statut'];
    const rows = selectedItems.map((booking) => [
      booking.id,
      booking.title,
      booking.client_id,
      booking.space_id,
      format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm', { locale: fr }),
      format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm', { locale: fr }),
      booking.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `reservations-${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Export réussi', `${selectedCount} réservation(s) exportée(s)`);
  }, [selectedItems, selectedCount, success]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      id: 'confirm',
      label: 'Confirmer',
      icon: <CheckCircle size={16} />,
      variant: 'primary',
      onClick: () => handleBulkStatusChange('confirmed'),
    },
    {
      id: 'cancel',
      label: 'Annuler',
      icon: <XCircle size={16} />,
      variant: 'secondary',
      onClick: () => handleBulkStatusChange('cancelled'),
    },
    {
      id: 'export',
      label: 'Exporter',
      icon: <FileDown size={16} />,
      variant: 'secondary',
      onClick: handleBulkExport,
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: <Trash2 size={16} />,
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  // Get client and space names for display
  const getClientName = useCallback(
    (clientId: string) => {
      const client = clients.find((c) => c.id === clientId);
      return client?.name || 'Client inconnu';
    },
    [clients]
  );

  const getSpaceName = useCallback(
    (spaceId: string) => {
      const space = spaces.find((s) => s.id === spaceId);
      return space?.name || 'Espace inconnu';
    },
    [spaces]
  );

  const getStatusLabel = (status: BookingStatus): string => {
    const labels: Record<BookingStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status];
  };

  const getStatusColor = (status: BookingStatus): string => {
    const colors: Record<BookingStatus, string> = {
      pending: '#F59E0B',
      confirmed: '#22C55E',
      in_progress: '#3B82F6',
      completed: '#6B7280',
      cancelled: '#EF4444',
    };
    return colors[status];
  };

  return (
    <div className={styles.page}>
      {/* CSS Variables for embed components */}
      <style>{`
        .${styles.embedWrapper} {
          --rooom-bg-card: var(--bg-primary);
          --rooom-bg-muted: var(--bg-secondary);
          --rooom-border-color: var(--border-default);
          --rooom-text-primary: var(--text-primary);
          --rooom-text-secondary: var(--text-secondary);
          --rooom-text-muted: var(--text-tertiary);
          --rooom-accent-color: var(--accent-primary);
        }
      `}</style>

      <Header
        title="Reservations"
        subtitle="Gerez vos reservations et disponibilites"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {conflictCounts.total > 0 && (
              <div className={styles.conflictBadge}>
                <AlertTriangle size={14} />
                <span>{conflictCounts.total} conflit{conflictCounts.total > 1 ? 's' : ''}</span>
              </div>
            )}
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('calendar');
                clearSelection();
              }}
            >
              <CalendarIcon size={16} />
              Calendrier
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('list');
                clearSelection();
              }}
            >
              <List size={16} />
              Liste
            </Button>
          </div>
        }
      />

      <div className={styles.content}>
        <div className={styles.layout}>
          {/* Sidebar - Space Filter */}
          <aside className={styles.sidebar}>
            <Card className={styles.filterCard}>
              <h3 className={styles.filterTitle}>Espaces</h3>
              <div className={styles.spaceList}>
                <button
                  className={`${styles.spaceItem} ${selectedSpace === '' ? styles.selected : ''}`}
                  onClick={() => setSelectedSpace('')}
                >
                  <div className={styles.spaceColor} style={{ backgroundColor: '#6b7280' }} />
                  <span>Tous les espaces</span>
                </button>
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    className={`${styles.spaceItem} ${selectedSpace === space.id ? styles.selected : ''}`}
                    onClick={() => setSelectedSpace(space.id)}
                  >
                    <div
                      className={styles.spaceColor}
                      style={{ backgroundColor: space.color || '#3b82f6' }}
                    />
                    <span>{space.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className={styles.statsCard}>
              <h3 className={styles.filterTitle}>Aujourd'hui</h3>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {todayBookingsCount}
                </span>
                <span className={styles.statLabel}>Reservations</span>
              </div>
            </Card>

            {/* Conflict Prevention Settings */}
            <Card className={styles.filterCard}>
              <h3 className={styles.filterTitle}>Prevention des conflits</h3>
              <Select
                options={conflictModeOptions}
                value={conflictMode}
                onChange={(value) => setConflictMode(value as ConflictMode)}
                size="sm"
              />
              {conflictCounts.total > 0 && (
                <div className={styles.conflictStats}>
                  {conflictCounts.high > 0 && (
                    <div className={styles.conflictStatRow}>
                      <span className={`${styles.conflictDot} ${styles.conflictDotHigh}`} />
                      <span>{conflictCounts.high} critique{conflictCounts.high > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {conflictCounts.medium > 0 && (
                    <div className={styles.conflictStatRow}>
                      <span className={`${styles.conflictDot} ${styles.conflictDotMedium}`} />
                      <span>{conflictCounts.medium} avertissement{conflictCounts.medium > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {conflictCounts.low > 0 && (
                    <div className={styles.conflictStatRow}>
                      <span className={`${styles.conflictDot} ${styles.conflictDotLow}`} />
                      <span>{conflictCounts.low} info{conflictCounts.low > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {viewMode === 'calendar' ? (
              <div className={`${styles.embedWrapper} ${styles.calendarSlotsGrid}`}>
                {/* Calendar - using embed component */}
                <Card className={styles.calendarCard}>
                <Calendar
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              </Card>

              {/* Time Slots - using embed component */}
              <Card className={styles.slotsCard}>
                <div className={styles.slotsHeader}>
                  <div className={styles.slotsTitle}>
                    <CalendarIcon size={20} />
                    <span>
                      {selectedDate
                        ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                        : 'Selectionnez une date'}
                    </span>
                  </div>
                  {selectedDate && (
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>
                      <Plus size={16} />
                      Nouvelle reservation
                    </Button>
                  )}
                </div>

                {selectedDate ? (
                  <TimeSlots
                    slots={timeSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSelectSlot}
                    isLoading={isLoadingSlots}
                  />
                ) : (
                  <div className={styles.emptySlots}>
                    <CalendarIcon size={48} strokeWidth={1} />
                    <p>Selectionnez une date pour voir les creneaux disponibles</p>
                  </div>
                )}
              </Card>
            </div>
            ) : (
              /* List View */
              <Card>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(input) => {
                              if (input) {
                                input.indeterminate = isIndeterminate;
                              }
                            }}
                            onChange={toggleAll}
                            aria-label="Sélectionner tout"
                          />
                        </th>
                        <th>Titre</th>
                        <th>Client</th>
                        <th>Espace</th>
                        <th>Date & Heure</th>
                        <th>Statut</th>
                        <th>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={styles.emptyState}>
                            <div className={styles.emptyStateContent}>
                              <CalendarIcon size={48} strokeWidth={1} />
                              <p>Aucune réservation</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        bookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className={isSelected(booking.id) ? styles.selectedRow : ''}
                          >
                            <td className={styles.checkboxCell}>
                              <input
                                type="checkbox"
                                checked={isSelected(booking.id)}
                                onChange={() => toggleItem(booking.id)}
                                aria-label={`Sélectionner ${booking.title}`}
                              />
                            </td>
                            <td className={styles.titleCell}>{booking.title}</td>
                            <td>{getClientName(booking.client_id)}</td>
                            <td>{getSpaceName(booking.space_id)}</td>
                            <td>
                              <div className={styles.dateTimeCell}>
                                <span className={styles.date}>
                                  {format(new Date(booking.start_time), 'dd/MM/yyyy', {
                                    locale: fr,
                                  })}
                                </span>
                                <span className={styles.time}>
                                  {format(new Date(booking.start_time), 'HH:mm', {
                                    locale: fr,
                                  })}{' '}
                                  -{' '}
                                  {format(new Date(booking.end_time), 'HH:mm', {
                                    locale: fr,
                                  })}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={styles.statusBadge}
                                style={{
                                  backgroundColor: `${getStatusColor(booking.status)}15`,
                                  color: getStatusColor(booking.status),
                                }}
                              >
                                {getStatusLabel(booking.status)}
                              </span>
                            </td>
                            <td className={styles.amountCell}>
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(booking.total_amount || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        actions={bulkActions}
        isVisible={viewMode === 'list'}
      />

      {/* Booking Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader
          title="Nouvelle reservation"
          onClose={() => setIsModalOpen(false)}
        />
        <ModalBody>
          <div className={styles.form}>
            <Input
              label="Titre"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Shooting photo produit"
            />

            <Select
              label="Espace"
              value={formData.space_id}
              onChange={(value) => setFormData({ ...formData, space_id: value })}
              placeholder="Selectionner un espace"
              options={[
                { value: '', label: 'Selectionner un espace' },
                ...spaces.map((space) => ({
                  value: space.id,
                  label: space.name,
                })),
              ]}
            />

            <Select
              label="Client"
              value={formData.client_id}
              onChange={(value) => setFormData({ ...formData, client_id: value })}
              placeholder="Selectionner un client"
              options={[
                { value: '', label: 'Selectionner un client' },
                ...clients.map((client) => ({
                  value: client.id,
                  label: client.name,
                })),
              ]}
            />

            <div className={styles.timeInputs}>
              <Input
                label="Debut"
                type="time"
                value={formData.start_time ? format(new Date(formData.start_time), 'HH:mm') : ''}
                onChange={(e) => {
                  if (selectedDate) {
                    const [hours, minutes] = e.target.value.split(':');
                    const newStart = new Date(selectedDate);
                    newStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setFormData({ ...formData, start_time: newStart.toISOString() });
                  }
                }}
              />
              <Input
                label="Fin"
                type="time"
                value={formData.end_time ? format(new Date(formData.end_time), 'HH:mm') : ''}
                onChange={(e) => {
                  if (selectedDate) {
                    const [hours, minutes] = e.target.value.split(':');
                    const newEnd = new Date(selectedDate);
                    newEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setFormData({ ...formData, end_time: newEnd.toISOString() });
                  }
                }}
              />
            </div>

            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.space_id || !formData.client_id || createBooking.isPending}
          >
            {createBooking.isPending ? 'Creation...' : 'Creer la reservation'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
        <ModalHeader
          title="Confirmer la suppression"
          onClose={() => setIsDeleteModalOpen(false)}
        />
        <ModalBody>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Êtes-vous sûr de vouloir supprimer {selectedCount} réservation(s) ?
            Cette action est irréversible.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={confirmBulkDelete}
            disabled={deleteBooking.isPending}
          >
            {deleteBooking.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Conflict Warning Modal */}
      <ConflictWarningModal
        isOpen={isConflictModalOpen}
        onClose={() => {
          setIsConflictModalOpen(false);
          clearConflicts();
        }}
        conflicts={conflicts}
        alternativeSlots={alternativeSlots}
        conflictMode={conflictMode}
        onForceBooking={handleForceBooking}
        onSelectAlternative={handleSelectAlternative}
        getSpaceName={getSpaceName}
      />
    </div>
  );
}
