// src/embed/services/embedApi.ts
import type {
  EmbedStudio,
  EmbedService,
  AvailabilityResponse,
  BookingFormData,
  BookingResult,
} from '../types';
import {
  mockStudio,
  mockServices,
  generateMockAvailability,
  generateReference,
} from './mockData';
import { getCsrfToken } from '../../lib/csrf';

const API_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const embedApi = {
  // Get studio config and branding
  getStudioConfig: async (studioId: string) => {
    // Try real API first
    const result = await fetchApi<EmbedStudio>(`/embed/config?studioId=${studioId}`);
    // Fall back to mock if error
    if (result.error) {
      return { data: mockStudio };
    }
    return result;
  },

  // Get available services/spaces
  getServices: async (studioId: string, serviceIds?: string[]) => {
    const params = new URLSearchParams({ studioId });
    if (serviceIds?.length) {
      params.set('services', serviceIds.join(','));
    }
    const result = await fetchApi<EmbedService[]>(`/embed/services?${params}`);
    if (result.error) {
      let services = mockServices;
      if (serviceIds?.length) {
        services = services.filter(s => serviceIds.includes(s.id));
      }
      return { data: services };
    }
    return result;
  },

  // Get availability for a service on a date range
  getAvailability: async (
    studioId: string,
    serviceId: string,
    startDate: string,
    endDate: string
  ) => {
    const params = new URLSearchParams({
      studioId,
      serviceId,
      startDate,
      endDate,
    });
    const result = await fetchApi<AvailabilityResponse[]>(`/embed/availability?${params}`);
    if (result.error) {
      // Generate mock availability for each day in range
      const availability: AvailabilityResponse[] = [];
      const current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        availability.push(generateMockAvailability(dateStr, serviceId));
        current.setDate(current.getDate() + 1);
      }
      return { data: availability };
    }
    return result;
  },

  // Create a booking
  createBooking: async (studioId: string, data: BookingFormData) => {
    const result = await fetchApi<BookingResult>(`/embed/booking`, {
      method: 'POST',
      body: JSON.stringify({ studioId, ...data }),
    });
    if (result.error) {
      const service = mockServices.find(s => s.id === data.serviceId);
      // Calculate hours
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const totalAmount = hours * (service?.hourly_rate || 50);

      return {
        data: {
          id: 'mock-booking-' + Date.now(),
          reference: generateReference(),
          status: 'confirmed' as const,
          service: service || mockServices[0],
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          totalAmount,
          depositAmount: null,
          paymentUrl: null,
        },
      };
    }
    return result;
  },

  // Verify payment (after Stripe redirect)
  verifyPayment: (bookingId: string, sessionId: string) =>
    fetchApi<BookingResult>(`/embed/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, sessionId }),
    }),
};
