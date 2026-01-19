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
  // Data
  bookings: Booking[];
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
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<BookingFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearBookings: () => void;
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
      // Initial data
      bookings: [],
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
      setBookings: (bookings) => set({ bookings, error: null }),

      addBooking: (booking) =>
        set((state) => ({
          bookings: [...state.bookings, booking],
          error: null,
        })),

      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id ? { ...booking, ...updates } : booking
          ),
          selectedBooking:
            state.selectedBooking?.id === id
              ? { ...state.selectedBooking, ...updates }
              : state.selectedBooking,
          error: null,
        })),

      deleteBooking: (id) =>
        set((state) => ({
          bookings: state.bookings.filter((booking) => booking.id !== id),
          selectedBooking:
            state.selectedBooking?.id === id ? null : state.selectedBooking,
          error: null,
        })),

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

      clearBookings: () =>
        set({
          bookings: [],
          selectedBooking: null,
          error: null,
        }),
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

// Selectors
export const selectFilteredBookings = (state: BookingState): Booking[] => {
  let filtered = state.bookings;

  if (state.filters.status !== 'all') {
    filtered = filtered.filter((b) => b.status === state.filters.status);
  }

  if (state.filters.spaceId) {
    filtered = filtered.filter((b) => b.space_id === state.filters.spaceId);
  }

  if (state.filters.clientId) {
    filtered = filtered.filter((b) => b.client_id === state.filters.clientId);
  }

  if (state.filters.searchQuery) {
    const query = state.filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const selectBookingsByDate = (
  state: BookingState,
  date: Date
): Booking[] => {
  const dateStr = date.toISOString().split('T')[0];
  return state.bookings.filter((b) => b.start_time.startsWith(dateStr));
};
