import { describe, it, expect, beforeEach } from 'vitest';
import { useBookingStore, selectFilteredBookings, selectBookingsByDate } from './bookingStore';
import type { Booking } from '../types/database';

const mockBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'b-1',
  studio_id: 'studio-1',
  space_id: 'space-1',
  client_id: 'client-1',
  title: 'Test Booking',
  description: 'Description',
  start_time: '2024-06-15T10:00:00Z',
  end_time: '2024-06-15T14:00:00Z',
  status: 'confirmed',
  total_amount: 500,
  paid_amount: 250,
  notes: null,
  internal_notes: null,
  is_recurring: false,
  recurrence_rule: null,
  color: null,
  created_by: 'user-1',
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
  ...overrides,
} as Booking);

beforeEach(() => {
  useBookingStore.setState({
    bookings: [],
    selectedBooking: null,
    selectedDate: new Date(),
    viewMode: 'week',
    filters: { status: 'all', spaceId: null, clientId: null, searchQuery: '' },
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

describe('bookingStore - CRUD', () => {
  it('ajoute un booking', () => {
    const booking = mockBooking();
    useBookingStore.getState().addBooking(booking);
    expect(useBookingStore.getState().bookings).toHaveLength(1);
    expect(useBookingStore.getState().bookings[0].title).toBe('Test Booking');
  });

  it('met a jour un booking', () => {
    useBookingStore.getState().addBooking(mockBooking());
    useBookingStore.getState().updateBooking('b-1', { title: 'Updated' });
    expect(useBookingStore.getState().bookings[0].title).toBe('Updated');
  });

  it('met a jour selectedBooking si meme id', () => {
    const booking = mockBooking();
    useBookingStore.setState({ bookings: [booking], selectedBooking: booking });
    useBookingStore.getState().updateBooking('b-1', { title: 'Updated' });
    expect(useBookingStore.getState().selectedBooking?.title).toBe('Updated');
  });

  it('supprime un booking', () => {
    useBookingStore.getState().addBooking(mockBooking());
    useBookingStore.getState().deleteBooking('b-1');
    expect(useBookingStore.getState().bookings).toHaveLength(0);
  });

  it('supprime le selectedBooking si meme id', () => {
    const booking = mockBooking();
    useBookingStore.setState({ bookings: [booking], selectedBooking: booking });
    useBookingStore.getState().deleteBooking('b-1');
    expect(useBookingStore.getState().selectedBooking).toBeNull();
  });
});

describe('bookingStore - filtres', () => {
  it('set et reset les filtres', () => {
    useBookingStore.getState().setFilters({ status: 'pending', spaceId: 'space-1' });
    expect(useBookingStore.getState().filters.status).toBe('pending');
    expect(useBookingStore.getState().filters.spaceId).toBe('space-1');

    useBookingStore.getState().resetFilters();
    expect(useBookingStore.getState().filters.status).toBe('all');
    expect(useBookingStore.getState().filters.spaceId).toBeNull();
  });
});

describe('selectFilteredBookings', () => {
  it('filtre par status', () => {
    useBookingStore.setState({
      bookings: [
        mockBooking({ id: 'b-1', status: 'confirmed' }),
        mockBooking({ id: 'b-2', status: 'pending' }),
        mockBooking({ id: 'b-3', status: 'confirmed' }),
      ],
      filters: { status: 'confirmed', spaceId: null, clientId: null, searchQuery: '' },
    });
    const filtered = selectFilteredBookings(useBookingStore.getState());
    expect(filtered).toHaveLength(2);
  });

  it('filtre par recherche dans title et description', () => {
    useBookingStore.setState({
      bookings: [
        mockBooking({ id: 'b-1', title: 'Shooting Mode' }),
        mockBooking({ id: 'b-2', title: 'Portrait Corporate', description: 'photos equipe' }),
      ],
      filters: { status: 'all', spaceId: null, clientId: null, searchQuery: 'mode' },
    });
    const filtered = selectFilteredBookings(useBookingStore.getState());
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Shooting Mode');
  });
});

describe('selectBookingsByDate', () => {
  it('retourne les bookings dune date', () => {
    useBookingStore.setState({
      bookings: [
        mockBooking({ id: 'b-1', start_time: '2024-06-15T10:00:00Z' }),
        mockBooking({ id: 'b-2', start_time: '2024-06-16T10:00:00Z' }),
      ],
    });
    const result = selectBookingsByDate(useBookingStore.getState(), new Date('2024-06-15'));
    expect(result).toHaveLength(1);
  });
});
