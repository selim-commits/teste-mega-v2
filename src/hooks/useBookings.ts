import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services';
import { queryKeys } from '../lib/queryClient';
import type { BookingInsert, BookingUpdate, BookingStatus } from '../types/database';

export interface BookingFilters {
  studioId?: string;
  spaceId?: string;
  clientId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
}

// Get all bookings with optional filters
export function useBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters || {}),
    queryFn: async () => {
      if (filters?.studioId && filters?.startDate && filters?.endDate) {
        return bookingService.getByDateRange(filters.studioId, filters.startDate, filters.endDate);
      }
      if (filters?.studioId && filters?.status) {
        return bookingService.getByStatus(filters.studioId, filters.status);
      }
      if (filters?.studioId) {
        return bookingService.getByStudioId(filters.studioId);
      }
      if (filters?.clientId) {
        return bookingService.getByClientId(filters.clientId);
      }
      if (filters?.spaceId) {
        return bookingService.getBySpaceId(filters.spaceId);
      }
      return bookingService.getAll();
    },
  });
}

// Get a single booking by ID
export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });
}

// Get booking with relations (client and space)
export function useBookingWithRelations(id: string) {
  return useQuery({
    queryKey: [...queryKeys.bookings.detail(id), 'relations'],
    queryFn: () => bookingService.getWithRelations(id),
    enabled: !!id,
  });
}

// Get upcoming bookings
export function useUpcomingBookings(studioId: string, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.bookings.list({ studioId }), 'upcoming', limit],
    queryFn: () => bookingService.getUpcoming(studioId, limit),
    enabled: !!studioId,
  });
}

// Get today's bookings
export function useTodayBookings(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.bookings.list({ studioId }), 'today'],
    queryFn: () => bookingService.getToday(studioId),
    enabled: !!studioId,
  });
}

// Create booking mutation
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (booking: Omit<BookingInsert, 'id' | 'created_at' | 'updated_at'>) =>
      bookingService.create(booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

// Update booking mutation
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookingUpdate }) =>
      bookingService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
    },
  });
}

// Delete booking mutation
export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

// Update booking status mutation
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
    },
  });
}

// Check availability
export function useCheckAvailability(
  spaceId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
) {
  return useQuery({
    queryKey: ['availability', spaceId, startTime, endTime, excludeBookingId],
    queryFn: () => bookingService.checkAvailability(spaceId, startTime, endTime, excludeBookingId),
    enabled: !!spaceId && !!startTime && !!endTime,
  });
}
