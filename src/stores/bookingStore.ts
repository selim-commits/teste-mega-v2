import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Booking, BookingStatus } from '../types/database';

export type ViewMode = 'day' | 'week' | 'month';

interface BookingFilters {
  status: BookingStatus | 'all';
  spaceId: string | null;
  clientId: string | null;
  searchQuery: string;
}

interface BookingState {
  // UI State
  selectedBooking: Booking | null;

  // View state
  selectedDate: Date;
  viewMode: ViewMode;

  // Filters
  filters: BookingFilters;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setSelectedBooking: (booking: Booking | null) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<BookingFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: BookingFilters = {
  status: 'all',
  spaceId: null,
  clientId: null,
  searchQuery: '',
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      // Initial UI state
      selectedBooking: null,

      // Initial view state
      selectedDate: new Date(),
      viewMode: 'week',

      // Initial filters
      filters: defaultFilters,

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setSelectedBooking: (booking) => set({ selectedBooking: booking }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      setLoading: (isLoading) => set({ isLoading }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'booking-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        filters: state.filters,
      }),
    }
  )
);

// Selectors - take data as parameter, filters from store state
export const selectFilteredBookings = (
  bookings: Booking[],
  filters: BookingFilters
): Booking[] => {
  let filtered = bookings;

  if (filters.status !== 'all') {
    filtered = filtered.filter((b) => b.status === filters.status);
  }

  if (filters.spaceId) {
    filtered = filtered.filter((b) => b.space_id === filters.spaceId);
  }

  if (filters.clientId) {
    filtered = filtered.filter((b) => b.client_id === filters.clientId);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const selectBookingsByDate = (
  bookings: Booking[],
  date: Date
): Booking[] => {
  const dateStr = date.toISOString().split('T')[0];
  return bookings.filter((b) => b.start_time.startsWith(dateStr));
};
