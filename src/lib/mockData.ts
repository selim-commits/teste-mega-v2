// Mock data for demo mode when Supabase is not configured
// Using 'as const' and explicit types to ensure compatibility

import { DEMO_STUDIO_ID } from '../stores/authStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockData = any;

// Helper to generate dates
const today = new Date();

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

// Mock Clients
export const mockClients: MockData[] = [
  {
    id: 'client-1',
    studio_id: DEMO_STUDIO_ID,
    name: 'Marie Dupont',
    email: 'marie.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    company: 'Studio Photo Pro',
    address: '123 Rue de la Photo, Paris',
    tier: 'vip',
    notes: 'Cliente fidele depuis 2023',
    tags: ['photographe', 'mode'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'client-2',
    studio_id: DEMO_STUDIO_ID,
    name: 'Jean Martin',
    email: 'jean.martin@email.com',
    phone: '+33 6 98 76 54 32',
    company: 'Agence Creatif',
    address: '456 Avenue des Arts, Lyon',
    tier: 'premium',
    notes: null,
    tags: ['corporate'],
    is_active: true,
    created_at: '2024-02-20T14:30:00Z',
    updated_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 'client-3',
    studio_id: DEMO_STUDIO_ID,
    name: 'Sophie Bernard',
    email: 'sophie.b@email.com',
    phone: '+33 6 11 22 33 44',
    company: null,
    address: '789 Boulevard Central, Marseille',
    tier: 'standard',
    notes: 'Photographe independante',
    tags: ['portrait'],
    is_active: true,
    created_at: '2024-03-10T09:00:00Z',
    updated_at: '2024-03-10T09:00:00Z',
  },
  {
    id: 'client-4',
    studio_id: DEMO_STUDIO_ID,
    name: 'Pierre Leroy',
    email: 'pierre.leroy@email.com',
    phone: '+33 6 55 66 77 88',
    company: 'MediaVision',
    address: '321 Rue du Commerce, Bordeaux',
    tier: 'vip',
    notes: 'Productions video',
    tags: ['video', 'production'],
    is_active: true,
    created_at: '2024-04-05T16:00:00Z',
    updated_at: '2024-04-05T16:00:00Z',
  },
  {
    id: 'client-5',
    studio_id: DEMO_STUDIO_ID,
    name: 'Claire Moreau',
    email: 'claire.m@email.com',
    phone: '+33 6 99 88 77 66',
    company: 'Fashion Week Agency',
    address: '567 Avenue Mode, Nice',
    tier: 'vip',
    notes: 'Cliente VIP - evenements mode',
    tags: ['mode', 'evenement'],
    is_active: true,
    created_at: '2024-05-12T11:30:00Z',
    updated_at: '2024-05-12T11:30:00Z',
  },
];

// Mock Spaces
export const mockSpaces: MockData[] = [
  {
    id: 'space-1',
    studio_id: DEMO_STUDIO_ID,
    name: 'Studio A - Grand Plateau',
    description: 'Grand studio de 200m2 avec cyclorama blanc',
    capacity: 20,
    hourly_rate: 150,
    half_day_rate: 500,
    full_day_rate: 900,
    color: '#3B82F6',
    is_active: true,
    amenities: ['Cyclorama', 'Eclairage professionnel', 'Climatisation'],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'space-2',
    studio_id: DEMO_STUDIO_ID,
    name: 'Studio B - Intimiste',
    description: 'Studio cosy de 80m2 ideal pour portraits',
    capacity: 8,
    hourly_rate: 80,
    half_day_rate: 280,
    full_day_rate: 500,
    color: '#10B981',
    is_active: true,
    amenities: ['Fonds colores', 'Ring light', 'Maquillage'],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'space-3',
    studio_id: DEMO_STUDIO_ID,
    name: 'Studio C - Video',
    description: 'Studio optimise pour tournages video',
    capacity: 15,
    hourly_rate: 120,
    half_day_rate: 420,
    full_day_rate: 750,
    color: '#8B5CF6',
    is_active: true,
    amenities: ['Green screen', 'Teleprompter', 'Insonorisation'],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Bookings - dynamically generated around today
export const mockBookings: MockData[] = [
  {
    id: 'booking-1',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-1',
    client_id: 'client-1',
    title: 'Shooting Mode - Marie Dupont',
    description: 'Shooting collection printemps',
    start_time: addHours(today, 2).toISOString(),
    end_time: addHours(today, 5).toISOString(),
    status: 'confirmed',
    total_amount: 450,
    paid_amount: 450,
    notes: null,
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -3).toISOString(),
    updated_at: addDays(today, -3).toISOString(),
  },
  {
    id: 'booking-2',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-2',
    client_id: 'client-2',
    title: 'Portrait Corporate - Jean Martin',
    description: 'Photos equipe direction',
    start_time: addHours(today, 6).toISOString(),
    end_time: addHours(today, 8).toISOString(),
    status: 'confirmed',
    total_amount: 160,
    paid_amount: 80,
    notes: 'Prevoir 5 personnes',
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -2).toISOString(),
    updated_at: addDays(today, -2).toISOString(),
  },
  {
    id: 'booking-3',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-3',
    client_id: 'client-4',
    title: 'Tournage Promo - Pierre Leroy',
    description: 'Video promotionnelle produit',
    start_time: addHours(addDays(today, 1), 9).toISOString(),
    end_time: addHours(addDays(today, 1), 14).toISOString(),
    status: 'confirmed',
    total_amount: 600,
    paid_amount: 300,
    notes: null,
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -5).toISOString(),
    updated_at: addDays(today, -5).toISOString(),
  },
  {
    id: 'booking-4',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-1',
    client_id: 'client-5',
    title: 'Fashion Week Prep - Claire Moreau',
    description: 'Preparation lookbook',
    start_time: addHours(addDays(today, 1), 15).toISOString(),
    end_time: addHours(addDays(today, 1), 20).toISOString(),
    status: 'confirmed',
    total_amount: 750,
    paid_amount: 375,
    notes: 'Cliente VIP',
    internal_notes: 'Prioritaire',
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -1).toISOString(),
    updated_at: addDays(today, -1).toISOString(),
  },
  {
    id: 'booking-5',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-2',
    client_id: 'client-3',
    title: 'Shooting Portrait - Sophie Bernard',
    description: 'Book personnel',
    start_time: addHours(addDays(today, -1), 10).toISOString(),
    end_time: addHours(addDays(today, -1), 13).toISOString(),
    status: 'completed',
    total_amount: 240,
    paid_amount: 240,
    notes: null,
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -7).toISOString(),
    updated_at: addDays(today, -1).toISOString(),
  },
  {
    id: 'booking-6',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-1',
    client_id: 'client-1',
    title: 'Shooting Catalogue - Marie Dupont',
    description: 'Catalogue ete',
    start_time: addHours(addDays(today, -2), 9).toISOString(),
    end_time: addHours(addDays(today, -2), 17).toISOString(),
    status: 'completed',
    total_amount: 1200,
    paid_amount: 1200,
    notes: null,
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -10).toISOString(),
    updated_at: addDays(today, -2).toISOString(),
  },
  {
    id: 'booking-7',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-3',
    client_id: 'client-2',
    title: 'Interview Video - Jean Martin',
    description: 'Interview CEO',
    start_time: addHours(addDays(today, -3), 14).toISOString(),
    end_time: addHours(addDays(today, -3), 17).toISOString(),
    status: 'completed',
    total_amount: 360,
    paid_amount: 360,
    notes: null,
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -8).toISOString(),
    updated_at: addDays(today, -3).toISOString(),
  },
  {
    id: 'booking-8',
    studio_id: DEMO_STUDIO_ID,
    space_id: 'space-2',
    client_id: 'client-4',
    title: 'Teaser Produit - Pierre Leroy',
    description: 'Mini video teaser',
    start_time: addHours(addDays(today, 2), 10).toISOString(),
    end_time: addHours(addDays(today, 2), 13).toISOString(),
    status: 'confirmed',
    total_amount: 240,
    paid_amount: 0,
    notes: null,
    internal_notes: null,
    is_recurring: false,
    recurrence_rule: null,
    color: null,
    created_by: 'user-1',
    created_at: addDays(today, -1).toISOString(),
    updated_at: addDays(today, -1).toISOString(),
  },
];

// Mock Equipment
export const mockEquipment: MockData[] = [
  {
    id: 'equip-1',
    studio_id: DEMO_STUDIO_ID,
    name: 'Canon EOS R5',
    category: 'camera',
    brand: 'Canon',
    model: 'EOS R5',
    description: 'Boitier mirrorless 45MP',
    serial_number: 'CN-R5-001',
    status: 'available',
    condition: 5,
    purchase_date: '2023-06-15',
    purchase_price: 4500,
    current_value: 3800,
    qr_code: 'QR-EQUIP-001',
    location: 'Studio A',
    last_maintenance_date: '2024-10-01',
    maintenance_interval_days: 90,
    notes: null,
    created_at: '2023-06-15T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z',
  },
  {
    id: 'equip-2',
    studio_id: DEMO_STUDIO_ID,
    name: 'Profoto B10 Plus',
    category: 'lighting',
    brand: 'Profoto',
    model: 'B10 Plus',
    description: 'Flash studio portable 500Ws',
    serial_number: 'PF-B10-002',
    status: 'available',
    condition: 4,
    purchase_date: '2023-03-20',
    purchase_price: 2200,
    current_value: 1800,
    qr_code: 'QR-EQUIP-002',
    location: 'Studio B',
    last_maintenance_date: '2024-09-15',
    maintenance_interval_days: 90,
    notes: null,
    created_at: '2023-03-20T00:00:00Z',
    updated_at: '2024-09-15T00:00:00Z',
  },
  {
    id: 'equip-3',
    studio_id: DEMO_STUDIO_ID,
    name: 'Sony A7S III',
    category: 'camera',
    brand: 'Sony',
    model: 'A7S III',
    description: 'Boitier video 4K 120fps',
    serial_number: 'SN-A7S3-003',
    status: 'in_use',
    condition: 5,
    purchase_date: '2023-09-01',
    purchase_price: 3800,
    current_value: 3200,
    qr_code: 'QR-EQUIP-003',
    location: 'Studio C',
    last_maintenance_date: '2024-11-01',
    maintenance_interval_days: 90,
    notes: 'Reserve pour tournages video',
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
  },
  {
    id: 'equip-4',
    studio_id: DEMO_STUDIO_ID,
    name: 'Manfrotto 055',
    category: 'support',
    brand: 'Manfrotto',
    model: '055',
    description: 'Trepied professionnel carbone',
    serial_number: 'MF-055-004',
    status: 'available',
    condition: 3,
    purchase_date: '2022-12-10',
    purchase_price: 450,
    current_value: 300,
    qr_code: 'QR-EQUIP-004',
    location: 'Reserve',
    last_maintenance_date: '2024-08-01',
    maintenance_interval_days: 180,
    notes: 'Maintenance requise',
    created_at: '2022-12-10T00:00:00Z',
    updated_at: '2024-08-01T00:00:00Z',
  },
  {
    id: 'equip-5',
    studio_id: DEMO_STUDIO_ID,
    name: 'Aputure 600d Pro',
    category: 'lighting',
    brand: 'Aputure',
    model: '600d Pro',
    description: 'LED daylight 600W',
    serial_number: 'AP-600D-005',
    status: 'maintenance',
    condition: 2,
    purchase_date: '2023-01-15',
    purchase_price: 1800,
    current_value: 1200,
    qr_code: 'QR-EQUIP-005',
    location: 'Atelier',
    last_maintenance_date: '2024-12-01',
    maintenance_interval_days: 90,
    notes: 'En reparation - ventilateur',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  },
];

// Mock Team Members
export const mockTeamMembers: MockData[] = [
  {
    id: 'team-1',
    studio_id: DEMO_STUDIO_ID,
    user_id: 'user-1',
    name: 'Selim Conrad',
    email: 'selim@09h29.com',
    phone: '+33 6 12 34 56 78',
    role: 'admin',
    job_title: 'Directeur Studio',
    avatar_url: null,
    hourly_rate: null,
    permissions: ['all'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team-2',
    studio_id: DEMO_STUDIO_ID,
    user_id: 'user-2',
    name: 'Emma Laurent',
    email: 'emma@studio.com',
    phone: '+33 6 22 33 44 55',
    role: 'manager',
    job_title: 'Responsable Planning',
    avatar_url: null,
    hourly_rate: 25,
    permissions: ['bookings', 'clients', 'reports'],
    is_active: true,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'team-3',
    studio_id: DEMO_STUDIO_ID,
    user_id: 'user-3',
    name: 'Lucas Petit',
    email: 'lucas@studio.com',
    phone: '+33 6 33 44 55 66',
    role: 'staff',
    job_title: 'Technicien Lumiere',
    avatar_url: null,
    hourly_rate: 20,
    permissions: ['bookings', 'equipment'],
    is_active: true,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
];

// Mock Packs (Pricing Products)
export const mockPacks: MockData[] = [
  {
    id: 'pack-1',
    studio_id: DEMO_STUDIO_ID,
    name: 'Pack 10 Heures',
    description: 'Pack de 10 heures de location studio, valable 6 mois',
    type: 'pack',
    price: 1200,
    currency: 'EUR',
    billing_period: 'once',
    credits_included: 10,
    credits_type: 'hours',
    valid_days: 180,
    valid_spaces: ['space-1', 'space-2', 'space-3'],
    valid_time_slots: null,
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    is_featured: true,
    display_order: 1,
    max_purchases_per_client: null,
    terms_and_conditions: null,
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pack-2',
    studio_id: DEMO_STUDIO_ID,
    name: 'Pack 5 Heures Portrait',
    description: 'Pack de 5 heures pour le Studio B - Portraits',
    type: 'pack',
    price: 350,
    currency: 'EUR',
    billing_period: 'once',
    credits_included: 5,
    credits_type: 'hours',
    valid_days: 90,
    valid_spaces: ['space-2'],
    valid_time_slots: null,
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    is_featured: false,
    display_order: 2,
    max_purchases_per_client: 2,
    terms_and_conditions: null,
    metadata: {},
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'pack-3',
    studio_id: DEMO_STUDIO_ID,
    name: 'Abonnement Mensuel Pro',
    description: 'Accès illimité au studio, 20h par mois',
    type: 'subscription',
    price: 499,
    currency: 'EUR',
    billing_period: 'monthly',
    credits_included: 20,
    credits_type: 'hours',
    valid_days: null,
    valid_spaces: ['space-1', 'space-2', 'space-3'],
    valid_time_slots: null,
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    is_featured: true,
    display_order: 3,
    max_purchases_per_client: 1,
    terms_and_conditions: 'Engagement minimum 3 mois',
    metadata: {},
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'pack-4',
    studio_id: DEMO_STUDIO_ID,
    name: 'Carte Cadeau 100€',
    description: 'Carte cadeau utilisable sur toutes les prestations',
    type: 'gift_certificate',
    price: 100,
    currency: 'EUR',
    billing_period: 'once',
    credits_included: null,
    credits_type: null,
    valid_days: 365,
    valid_spaces: null,
    valid_time_slots: null,
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    is_featured: false,
    display_order: 4,
    max_purchases_per_client: null,
    terms_and_conditions: null,
    metadata: {},
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
  },
  {
    id: 'pack-5',
    studio_id: DEMO_STUDIO_ID,
    name: 'Carte Cadeau 250€',
    description: 'Carte cadeau premium avec bonus de 25€',
    type: 'gift_certificate',
    price: 250,
    currency: 'EUR',
    billing_period: 'once',
    credits_included: null,
    credits_type: null,
    valid_days: 365,
    valid_spaces: null,
    valid_time_slots: null,
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    is_featured: true,
    display_order: 5,
    max_purchases_per_client: null,
    terms_and_conditions: 'Bonus de 25€ inclus',
    metadata: {},
    created_at: '2024-04-15T00:00:00Z',
    updated_at: '2024-04-15T00:00:00Z',
  },
];

// Mock Client Purchases
export const mockClientPurchases: MockData[] = [
  {
    id: 'purchase-1',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-1',
    product_id: 'pack-1',
    invoice_id: null,
    status: 'active',
    purchased_at: addDays(today, -30).toISOString(),
    activated_at: addDays(today, -30).toISOString(),
    expires_at: addDays(today, 150).toISOString(),
    cancelled_at: null,
    pause_started_at: null,
    pause_ends_at: null,
    credits_remaining: 6,
    stripe_subscription_id: null,
    current_period_start: null,
    current_period_end: null,
    gift_code: null,
    gift_recipient_email: null,
    gift_message: null,
    gift_redeemed_at: null,
    gift_redeemed_by: null,
    metadata: {},
    created_at: addDays(today, -30).toISOString(),
    updated_at: addDays(today, -5).toISOString(),
  },
  {
    id: 'purchase-2',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-2',
    product_id: 'pack-3',
    invoice_id: null,
    status: 'active',
    purchased_at: addDays(today, -15).toISOString(),
    activated_at: addDays(today, -15).toISOString(),
    expires_at: null,
    cancelled_at: null,
    pause_started_at: null,
    pause_ends_at: null,
    credits_remaining: 12,
    stripe_subscription_id: null,
    current_period_start: addDays(today, -15).toISOString(),
    current_period_end: addDays(today, 15).toISOString(),
    gift_code: null,
    gift_recipient_email: null,
    gift_message: null,
    gift_redeemed_at: null,
    gift_redeemed_by: null,
    metadata: {},
    created_at: addDays(today, -15).toISOString(),
    updated_at: addDays(today, -15).toISOString(),
  },
  {
    id: 'purchase-3',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-4',
    product_id: 'pack-2',
    invoice_id: null,
    status: 'active',
    purchased_at: addDays(today, -45).toISOString(),
    activated_at: addDays(today, -45).toISOString(),
    expires_at: addDays(today, 45).toISOString(),
    cancelled_at: null,
    pause_started_at: null,
    pause_ends_at: null,
    credits_remaining: 2,
    stripe_subscription_id: null,
    current_period_start: null,
    current_period_end: null,
    gift_code: null,
    gift_recipient_email: null,
    gift_message: null,
    gift_redeemed_at: null,
    gift_redeemed_by: null,
    metadata: {},
    created_at: addDays(today, -45).toISOString(),
    updated_at: addDays(today, -10).toISOString(),
  },
  {
    id: 'purchase-4',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-5',
    product_id: 'pack-3',
    invoice_id: null,
    status: 'paused',
    purchased_at: addDays(today, -60).toISOString(),
    activated_at: addDays(today, -60).toISOString(),
    expires_at: null,
    cancelled_at: null,
    pause_started_at: addDays(today, -7).toISOString(),
    pause_ends_at: addDays(today, 14).toISOString(),
    credits_remaining: 8,
    stripe_subscription_id: null,
    current_period_start: addDays(today, -30).toISOString(),
    current_period_end: addDays(today, 0).toISOString(),
    gift_code: null,
    gift_recipient_email: null,
    gift_message: null,
    gift_redeemed_at: null,
    gift_redeemed_by: null,
    metadata: {},
    created_at: addDays(today, -60).toISOString(),
    updated_at: addDays(today, -7).toISOString(),
  },
  {
    id: 'purchase-5',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-3',
    product_id: 'pack-4',
    invoice_id: null,
    status: 'active',
    purchased_at: addDays(today, -20).toISOString(),
    activated_at: null,
    expires_at: addDays(today, 345).toISOString(),
    cancelled_at: null,
    pause_started_at: null,
    pause_ends_at: null,
    credits_remaining: null,
    stripe_subscription_id: null,
    current_period_start: null,
    current_period_end: null,
    gift_code: 'GIFT-2024-001',
    gift_recipient_email: 'ami@example.com',
    gift_message: 'Joyeux anniversaire!',
    gift_redeemed_at: null,
    gift_redeemed_by: null,
    metadata: {},
    created_at: addDays(today, -20).toISOString(),
    updated_at: addDays(today, -20).toISOString(),
  },
];

// Calculate Pack Stats
export function calculateMockPackStats() {
  const activePacks = mockPacks.filter(p => p.is_active).length;
  const totalSold = mockClientPurchases.length;
  const activeSubscriptions = mockClientPurchases.filter(
    p => p.status === 'active' && mockPacks.find(pack => pack.id === p.product_id)?.type === 'subscription'
  ).length;
  const monthlyRevenue = mockClientPurchases
    .filter(p => {
      const purchaseDate = new Date(p.purchased_at);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return purchaseDate >= monthStart;
    })
    .reduce((sum, p) => {
      const pack = mockPacks.find(pack => pack.id === p.product_id);
      return sum + (pack?.price || 0);
    }, 0);

  return {
    activePacks,
    totalSold,
    activeSubscriptions,
    monthlyRevenue: monthlyRevenue || 1548, // Fallback for demo
  };
}

// Dashboard Stats Calculator
export function calculateMockDashboardStats() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Current month bookings
  const currentMonthBookings = mockBookings.filter(b => {
    const bookingDate = new Date(b.start_time);
    return bookingDate >= currentMonthStart && bookingDate <= now;
  });

  // Revenue from paid amounts
  const currentRevenue = currentMonthBookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.paid_amount || 0), 0);

  return {
    totalRevenue: currentRevenue || 2160,
    totalBookings: currentMonthBookings.length || 6,
    revenueGrowth: 15,
    bookingsGrowth: 8,
    clientsGrowth: 12,
    occupancyRate: 68,
  };
}

// Get today's bookings
export function getMockTodayBookings(): MockData[] {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return mockBookings.filter(b => {
    const bookingStart = new Date(b.start_time);
    return bookingStart >= todayStart && bookingStart <= todayEnd;
  });
}

// Get maintenance needed equipment
export function getMockMaintenanceEquipment(): MockData[] {
  return mockEquipment.filter(e => e.status === 'maintenance' || e.condition <= 2);
}

// =====================
// Centralized demo mode filter functions
// These extract filtering logic from hooks to keep demo mode handling consistent
// =====================

// Filter mock clients by optional criteria
export function getFilteredMockClients(filters?: {
  tier?: string;
  isActive?: boolean;
}): MockData[] {
  let result = [...mockClients];
  if (filters?.tier) {
    result = result.filter(c => c.tier === filters.tier);
  }
  if (filters?.isActive !== undefined) {
    result = result.filter(c => c.is_active === filters.isActive);
  }
  return result;
}

// Filter mock bookings by optional criteria
export function getFilteredMockBookings(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): MockData[] {
  let result = [...mockBookings];
  if (filters?.startDate) {
    result = result.filter(b => new Date(b.start_time) >= new Date(filters.startDate!));
  }
  if (filters?.endDate) {
    result = result.filter(b => new Date(b.end_time) <= new Date(filters.endDate!));
  }
  if (filters?.status) {
    result = result.filter(b => b.status === filters.status);
  }
  return result.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

// Get upcoming mock bookings (future, non-cancelled, sorted, limited)
export function getMockUpcomingBookings(limit: number = 10): MockData[] {
  const now = new Date();
  return mockBookings
    .filter(b => new Date(b.start_time) >= now && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, limit);
}

// Filter mock invoices by optional criteria
export function getFilteredMockInvoices(filters?: {
  status?: string;
  clientId?: string;
}): MockData[] {
  let result = [...mockInvoices];
  if (filters?.status) {
    result = result.filter(i => i.status === filters.status);
  }
  if (filters?.clientId) {
    result = result.filter(i => i.client_id === filters.clientId);
  }
  return result;
}

// Filter mock equipment by optional criteria
export function getFilteredMockEquipment(filters?: {
  status?: string;
  category?: string;
}): MockData[] {
  let result = [...mockEquipment];
  if (filters?.status) {
    result = result.filter(e => e.status === filters.status);
  }
  if (filters?.category) {
    result = result.filter(e => e.category === filters.category);
  }
  return result;
}

// Filter mock packs by optional criteria
export function getFilteredMockPacks(filters?: {
  type?: string;
  isActive?: boolean;
}): MockData[] {
  let result = [...mockPacks];
  if (filters?.type) {
    result = result.filter(p => p.type === filters.type);
  }
  if (filters?.isActive === true) {
    result = result.filter(p => p.is_active);
  }
  return result;
}

// Filter mock client purchases by optional criteria
export function getFilteredMockClientPurchases(filters?: {
  clientId?: string;
  status?: string;
}): MockData[] {
  let result = [...mockClientPurchases];
  if (filters?.clientId) {
    result = result.filter(p => p.client_id === filters.clientId);
  }
  if (filters?.status) {
    result = result.filter(p => p.status === filters.status);
  }
  return result;
}

// Mock Invoices
// Mock Payments
export const mockPayments: MockData[] = [
  {
    id: 'payment-1',
    studio_id: DEMO_STUDIO_ID,
    invoice_id: 'invoice-1',
    amount: 1440,
    method: 'card',
    reference: 'PAY-2024-001',
    notes: null,
    payment_date: addDays(today, -10).toISOString(),
    created_at: addDays(today, -10).toISOString(),
  },
  {
    id: 'payment-2',
    studio_id: DEMO_STUDIO_ID,
    invoice_id: 'invoice-2',
    amount: 432,
    method: 'transfer',
    reference: 'PAY-2024-002',
    notes: null,
    payment_date: addDays(today, -5).toISOString(),
    created_at: addDays(today, -5).toISOString(),
  },
  {
    id: 'payment-3',
    studio_id: DEMO_STUDIO_ID,
    invoice_id: 'invoice-4',
    amount: 300,
    method: 'card',
    reference: 'PAY-2024-003',
    notes: 'Acompte 50%',
    payment_date: addDays(today, -2).toISOString(),
    created_at: addDays(today, -2).toISOString(),
  },
  {
    id: 'payment-4',
    studio_id: DEMO_STUDIO_ID,
    invoice_id: 'invoice-5',
    amount: 375,
    method: 'cash',
    reference: 'PAY-2024-004',
    notes: 'Acompte VIP',
    payment_date: addDays(today, -1).toISOString(),
    created_at: addDays(today, -1).toISOString(),
  },
];

export const mockInvoices: MockData[] = [
  {
    id: 'invoice-1',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-1',
    booking_id: 'booking-6',
    invoice_number: 'INV-2024-001',
    status: 'paid',
    subtotal: 1200,
    tax_rate: 20,
    tax_amount: 240,
    total_amount: 1440,
    paid_amount: 1440,
    due_date: addDays(today, -15).toISOString().split('T')[0],
    paid_date: addDays(today, -10).toISOString().split('T')[0],
    notes: null,
    created_at: addDays(today, -20).toISOString(),
    updated_at: addDays(today, -10).toISOString(),
  },
  {
    id: 'invoice-2',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-2',
    booking_id: 'booking-7',
    invoice_number: 'INV-2024-002',
    status: 'paid',
    subtotal: 360,
    tax_rate: 20,
    tax_amount: 72,
    total_amount: 432,
    paid_amount: 432,
    due_date: addDays(today, -10).toISOString().split('T')[0],
    paid_date: addDays(today, -5).toISOString().split('T')[0],
    notes: null,
    created_at: addDays(today, -12).toISOString(),
    updated_at: addDays(today, -5).toISOString(),
  },
  {
    id: 'invoice-3',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-3',
    booking_id: 'booking-5',
    invoice_number: 'INV-2024-003',
    status: 'sent',
    subtotal: 240,
    tax_rate: 20,
    tax_amount: 48,
    total_amount: 288,
    paid_amount: 0,
    due_date: addDays(today, 5).toISOString().split('T')[0],
    paid_date: null,
    notes: null,
    created_at: addDays(today, -5).toISOString(),
    updated_at: addDays(today, -5).toISOString(),
  },
  {
    id: 'invoice-4',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-4',
    booking_id: 'booking-3',
    invoice_number: 'INV-2024-004',
    status: 'pending',
    subtotal: 600,
    tax_rate: 20,
    tax_amount: 120,
    total_amount: 720,
    paid_amount: 300,
    due_date: addDays(today, 10).toISOString().split('T')[0],
    paid_date: null,
    notes: 'Acompte de 300€ reçu',
    created_at: addDays(today, -2).toISOString(),
    updated_at: addDays(today, -2).toISOString(),
  },
  {
    id: 'invoice-5',
    studio_id: DEMO_STUDIO_ID,
    client_id: 'client-5',
    booking_id: 'booking-4',
    invoice_number: 'INV-2024-005',
    status: 'draft',
    subtotal: 750,
    tax_rate: 20,
    tax_amount: 150,
    total_amount: 900,
    paid_amount: 375,
    due_date: addDays(today, 15).toISOString().split('T')[0],
    paid_date: null,
    notes: 'Cliente VIP - 50% acompte',
    created_at: addDays(today, -1).toISOString(),
    updated_at: addDays(today, -1).toISOString(),
  },
];
