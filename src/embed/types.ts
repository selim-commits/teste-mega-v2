// src/embed/types.ts

// Config passed to widget
export interface EmbedConfig {
  studioId: string;
  theme: 'light' | 'dark';
  accentColor: string;
  services: string[];
  locale: string;
}

// Studio info from API
export interface EmbedStudio {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  currency: string;
  settings: {
    booking_lead_time_hours: number;
    booking_max_advance_days: number;
    cancellation_policy_hours: number;
    require_deposit: boolean;
    deposit_percentage: number;
  };
}

// Service/Space available for booking
export interface EmbedService {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number;
  half_day_rate: number | null;
  full_day_rate: number | null;
  min_booking_hours: number;
  max_booking_hours: number;
  image_url: string | null;
  amenities: string[];
}

// Time slot
export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  available: boolean;
  price: number;
}

// Availability response
export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

// Booking form data
export interface BookingFormData {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  acceptTerms: boolean;
}

// Booking result
export interface BookingResult {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed';
  service: EmbedService;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  depositAmount: number | null;
  paymentUrl: string | null;
}

// Booking flow step
export type BookingStep =
  | 'services'
  | 'datetime'
  | 'form'
  | 'payment'
  | 'confirmation';

// PostMessage types
export type PostMessageType =
  | 'ROOOM_READY'
  | 'ROOOM_RESIZE'
  | 'ROOOM_BOOKING_COMPLETE'
  | 'ROOOM_ERROR'
  | 'ROOOM_STEP_CHANGE';

export interface PostMessage {
  type: PostMessageType;
  payload?: unknown;
}
