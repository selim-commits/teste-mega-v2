// src/embed/services/embedApi.ts
import type {
  EmbedStudio,
  EmbedService,
  AvailabilityResponse,
  BookingFormData,
  BookingResult,
} from '../types';

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
  getStudioConfig: (studioId: string) =>
    fetchApi<EmbedStudio>(`/embed/config?studioId=${studioId}`),

  // Get available services/spaces
  getServices: (studioId: string, serviceIds?: string[]) => {
    const params = new URLSearchParams({ studioId });
    if (serviceIds?.length) {
      params.set('services', serviceIds.join(','));
    }
    return fetchApi<EmbedService[]>(`/embed/services?${params}`);
  },

  // Get availability for a service on a date range
  getAvailability: (
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
    return fetchApi<AvailabilityResponse[]>(`/embed/availability?${params}`);
  },

  // Create a booking
  createBooking: (studioId: string, data: BookingFormData) =>
    fetchApi<BookingResult>(`/embed/booking`, {
      method: 'POST',
      body: JSON.stringify({ studioId, ...data }),
    }),

  // Verify payment (after Stripe redirect)
  verifyPayment: (bookingId: string, sessionId: string) =>
    fetchApi<BookingResult>(`/embed/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, sessionId }),
    }),
};
