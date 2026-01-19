import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Calendar as CalendarIcon,
  User,
} from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuthStore } from '../stores/authStore';
import { useBookings, useCreateBooking } from '../hooks/useBookings';
import { useActiveSpaces } from '../hooks/useSpaces';
import { useActiveClients } from '../hooks/useClients';
import type { BookingStatus } from '../types/database';

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

export function Bookings() {
  const { studioId } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch data
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings(studioId || '');
  const { data: spaces = [], isLoading: spacesLoading } = useActiveSpaces(studioId || '');
  const { data: clients = [] } = useActiveClients(studioId || '');
  const createBooking = useCreateBooking();

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
    setTimeout(() => setIsLoadingSlots(false), 300);
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

  // Handle form submission
  const handleSubmit = async () => {
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
      });
      setIsModalOpen(false);
      setFormData(initialFormData);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  // Get bookings count for today
  const todayBookingsCount = useMemo(() => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.start_time);
      return format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
        (selectedSpace === '' || booking.space_id === selectedSpace);
    }).length;
  }, [bookings, selectedSpace]);

  const isLoading = bookingsLoading || spacesLoading;

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
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
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
          </main>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader>
          <h2>Nouvelle reservation</h2>
        </ModalHeader>
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
              onChange={(e) => setFormData({ ...formData, space_id: e.target.value })}
            >
              <option value="">Selectionner un espace</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </Select>

            <Select
              label="Client"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">Selectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>

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
    </div>
  );
}
