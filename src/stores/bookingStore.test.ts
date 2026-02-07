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
    selectedBooking: null,
    selectedDate: new Date(),
    viewMode: 'week',
    filters: { status: 'all', spaceId: null, clientId: null, searchQuery: '' },
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

describe('bookingStore - UI state', () => {
  it('set et reset les filtres', () => {
    useBookingStore.getState().setFilters({ status: 'pending', spaceId: 'space-1' });
    expect(useBookingStore.getState().filters.status).toBe('pending');
    expect(useBookingStore.getState().filters.spaceId).toBe('space-1');

    useBookingStore.getState().resetFilters();
    expect(useBookingStore.getState().filters.status).toBe('all');
    expect(useBookingStore.getState().filters.spaceId).toBeNull();
  });

  it('set le selectedBooking', () => {
    const booking = mockBooking();
    useBookingStore.getState().setSelectedBooking(booking);
    expect(useBookingStore.getState().selectedBooking?.id).toBe('b-1');

    useBookingStore.getState().setSelectedBooking(null);
    expect(useBookingStore.getState().selectedBooking).toBeNull();
  });

  it('set le viewMode', () => {
    useBookingStore.getState().setViewMode('day');
    expect(useBookingStore.getState().viewMode).toBe('day');
  });
});

describe('selectFilteredBookings', () => {
  it('filtre par status', () => {
    const bookings = [
      mockBooking({ id: 'b-1', status: 'confirmed' }),
      mockBooking({ id: 'b-2', status: 'pending' }),
      mockBooking({ id: 'b-3', status: 'confirmed' }),
    ];
    const filters = { status: 'confirmed' as const, spaceId: null, clientId: null, searchQuery: '' };
    const filtered = selectFilteredBookings(bookings, filters);
    expect(filtered).toHaveLength(2);
  });

  it('filtre par recherche dans title et description', () => {
    const bookings = [
      mockBooking({ id: 'b-1', title: 'Shooting Mode' }),
      mockBooking({ id: 'b-2', title: 'Portrait Corporate', description: 'photos equipe' }),
    ];
    const filters = { status: 'all' as const, spaceId: null, clientId: null, searchQuery: 'mode' };
    const filtered = selectFilteredBookings(bookings, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Shooting Mode');
  });
});

describe('selectBookingsByDate', () => {
  it('retourne les bookings dune date', () => {
    const bookings = [
      mockBooking({ id: 'b-1', start_time: '2024-06-15T10:00:00Z' }),
      mockBooking({ id: 'b-2', start_time: '2024-06-16T10:00:00Z' }),
    ];
    const result = selectBookingsByDate(bookings, new Date('2024-06-15'));
    expect(result).toHaveLength(1);
  });
});
