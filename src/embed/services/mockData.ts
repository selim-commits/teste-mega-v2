// src/embed/services/mockData.ts
// Mock data for development/demo mode
import type { EmbedStudio, EmbedService, AvailabilityResponse } from '../types';

export const mockStudio: EmbedStudio = {
  id: 'demo-studio',
  name: 'Studio Lumière',
  slug: 'studio-lumiere',
  logo_url: null,
  timezone: 'Europe/Paris',
  currency: 'EUR',
  settings: {
    booking_lead_time_hours: 24,
    booking_max_advance_days: 60,
    cancellation_policy_hours: 48,
    require_deposit: true,
    deposit_percentage: 30,
  },
};

export const mockServices: EmbedService[] = [
  {
    id: 'space-1',
    name: 'Studio Photo Principal',
    description: 'Grand studio de 120m² avec cyclorama blanc, éclairage professionnel et équipement photo complet.',
    hourly_rate: 85,
    half_day_rate: 320,
    full_day_rate: 580,
    min_booking_hours: 2,
    max_booking_hours: 10,
    image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400',
    amenities: ['Cyclorama', 'Éclairage', 'Wifi', 'Climatisation'],
  },
  {
    id: 'space-2',
    name: 'Studio Vidéo',
    description: 'Studio polyvalent de 80m² idéal pour tournages vidéo, interviews et contenus créatifs.',
    hourly_rate: 95,
    half_day_rate: 360,
    full_day_rate: 650,
    min_booking_hours: 3,
    max_booking_hours: 12,
    image_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
    amenities: ['Green Screen', 'Audio', 'Teleprompter', 'Loges'],
  },
  {
    id: 'space-3',
    name: 'Salle de Réunion Créative',
    description: 'Espace lumineux de 40m² pour brainstorming, réunions clients et workshops.',
    hourly_rate: 45,
    half_day_rate: 160,
    full_day_rate: 280,
    min_booking_hours: 1,
    max_booking_hours: 8,
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    amenities: ['Écran 4K', 'Visio', 'Whiteboard', 'Café'],
  },
];

// Generate availability for a date
export function generateMockAvailability(date: string, serviceId: string): AvailabilityResponse {
  const slots = [];
  const service = mockServices.find(s => s.id === serviceId);
  const hourlyRate = service?.hourly_rate || 50;

  // Simple: make most slots available (only 12:00 and 17:00 unavailable for demo)
  const unavailableHours = [12, 17];

  // Generate slots from 9am to 8pm
  for (let hour = 9; hour < 20; hour++) {
    const startHour = hour.toString().padStart(2, '0');
    const endHour = (hour + 1).toString().padStart(2, '0');

    slots.push({
      start: `${date}T${startHour}:00:00`,
      end: `${date}T${endHour}:00:00`,
      available: !unavailableHours.includes(hour),
      price: hourlyRate,
    });
  }

  return { date, slots };
}

// Generate reference number
export function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomValues = crypto.getRandomValues(new Uint32Array(6));
  let result = 'RB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}
