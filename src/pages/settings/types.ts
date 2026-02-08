// Settings section shared types and defaults

export interface StudioProfile {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  timezone: string;
  currency: string;
  businessType: string;
}

export interface DayHours {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  splitEnabled: boolean;
  splitStartTime: string;
  splitEndTime: string;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface BookingSettings {
  defaultDuration: string;
  maxDuration: string;
  bufferTime: string;
  minAdvanceTime: string;
  maxAdvanceTime: string;
  cancellationPolicy: string;
  depositRequired: boolean;
  depositPercentage: string;
  autoConfirm: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminder24h: boolean;
  reminder48h: boolean;
  reminder1Week: boolean;
  newBookingAlert: boolean;
  cancellationAlert: boolean;
  paymentAlert: boolean;
}

export interface BillingSettingsData {
  vatRate: string;
  paymentTerms: string;
  legalMentions: string;
  siret: string;
  vatNumber: string;
}

// Helper to generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Default values
export const defaultStudioProfile: StudioProfile = {
  name: 'ROOOM Studio',
  slug: 'rooom-studio',
  description: 'Studio photo et video professionnel au coeur de Paris. Espaces modulables pour tous types de productions.',
  logoUrl: '',
  coverUrl: '',
  email: 'contact@rooom.studio',
  phone: '+33 1 42 68 53 00',
  website: 'https://rooom.studio',
  address: '15 Rue de Bretagne',
  city: 'Paris',
  postalCode: '75003',
  country: 'France',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  businessType: 'studio-mixte',
};

export const defaultBusinessHours: BusinessHours = {
  monday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  tuesday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  wednesday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  thursday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  friday: { enabled: true, openTime: '09:00', closeTime: '18:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  saturday: { enabled: true, openTime: '10:00', closeTime: '17:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  sunday: { enabled: false, openTime: '', closeTime: '', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
};

export const defaultBookingSettings: BookingSettings = {
  defaultDuration: '60',
  maxDuration: '480',
  bufferTime: '15',
  minAdvanceTime: '24',
  maxAdvanceTime: '90',
  cancellationPolicy: 'Les annulations doivent etre effectuees au moins 48 heures avant la reservation. Les annulations tardives peuvent entrainer des frais.',
  depositRequired: false,
  depositPercentage: '30',
  autoConfirm: false,
};

export const defaultNotificationSettings: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  reminder24h: true,
  reminder48h: false,
  reminder1Week: false,
  newBookingAlert: true,
  cancellationAlert: true,
  paymentAlert: true,
};

export const defaultBillingSettings: BillingSettingsData = {
  vatRate: '20',
  paymentTerms: 'Paiement a la reservation. Annulation gratuite jusqu\'a 48h avant.',
  legalMentions: 'ROOOM Studio - SARL au capital de 10 000 EUR\nRCS Paris B 123 456 789',
  siret: '123 456 789 00012',
  vatNumber: 'FR 12 123456789',
};
