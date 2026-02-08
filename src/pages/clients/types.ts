import type { LucideIcon } from 'lucide-react';
import type { Client, ClientTier, Booking } from '../../types/database';

// Re-export commonly used types
export type { Client, ClientTier, Booking };

export interface ClientStatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  change: string;
  color: string;
}

export interface ClientFilterCounts {
  all: number;
  vip: number;
  premium: number;
  standard: number;
  active: number;
  inactive: number;
}

export interface ClientBookingStats {
  totalBookings: number;
  totalSpent: number;
  lastBooking: Booking | null;
}

// Activity types for timeline
export type ActivityType = 'reservation' | 'paiement' | 'pack' | 'message' | 'facture';

export interface TimelineActivity {
  id: string;
  type: ActivityType;
  description: string;
  date: string;
}

export interface ClientNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

// CRM Tag definitions
export const crmTagDefinitions = [
  { id: 'vip', label: 'VIP', color: '#D97706' },
  { id: 'regulier', label: 'Regulier', color: '#22C55E' },
  { id: 'nouveau', label: 'Nouveau', color: '#3B82F6' },
  { id: 'fidele', label: 'Fidele', color: '#8B5CF6' },
  { id: 'inactif', label: 'Inactif', color: '#EF4444' },
] as const;

// Tag colors for visual distinction
export const tagColors: Record<string, string> = {
  'Photographe': 'var(--accent-blue)',
  'Vidéaste': 'var(--accent-purple)',
  'Entreprise': 'var(--accent-green)',
  'Particulier': 'var(--accent-orange)',
  'Régulier': 'var(--state-success)',
  'Événementiel': 'var(--accent-pink)',
  'Mode': 'var(--accent-rose)',
  'Portrait': 'var(--accent-teal)',
  'Produit': 'var(--accent-amber)',
  'Immobilier': 'var(--accent-cyan)',
};

export const commonTags = [
  'Photographe',
  'Vidéaste',
  'Entreprise',
  'Particulier',
  'Régulier',
  'Événementiel',
  'Mode',
  'Portrait',
  'Produit',
  'Immobilier',
];

export function getTagColor(tag: string): string {
  return tagColors[tag] || 'var(--accent-primary)';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getScoreColor(score: number): string {
  if (score > 70) return 'var(--state-success)';
  if (score >= 40) return 'var(--state-warning)';
  return 'var(--state-error)';
}

export function generateClientScore(clientId: string): number {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(Math.min(2, clientId.length - 1));
  return 20 + (seed * 17) % 80;
}

export function generateMockCrmStats(clientId: string) {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(Math.min(1, clientId.length - 1));
  const totalSpent = 500 + (seed * 137) % 4500;
  const nbReservations = 3 + (seed * 7) % 25;
  const derniereVisite = 1 + (seed * 3) % 30;
  const frequence = Math.max(0.5, Math.round(((seed * 11) % 40) / 10) / 2);
  return { totalSpent, nbReservations, derniereVisite, frequence };
}

export function generateMockActivities(clientId: string): TimelineActivity[] {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(clientId.length - 1);
  const templates: TimelineActivity[] = [
    { id: `${clientId}-a1`, type: 'reservation', description: 'Reservation Studio A - 2h', date: '2026-02-05T14:00:00' },
    { id: `${clientId}-a2`, type: 'paiement', description: 'Paiement de 150 \u20AC recu', date: '2026-02-03T10:30:00' },
    { id: `${clientId}-a3`, type: 'pack', description: 'Pack Premium achete (10 seances)', date: '2026-01-28T16:00:00' },
    { id: `${clientId}-a4`, type: 'message', description: 'Message envoye : Confirmation de reservation', date: '2026-01-25T09:15:00' },
    { id: `${clientId}-a5`, type: 'facture', description: 'Facture #2026-042 generee - 450 \u20AC', date: '2026-01-20T11:00:00' },
    { id: `${clientId}-a6`, type: 'reservation', description: 'Reservation Studio B - 4h (shooting produit)', date: '2026-01-15T13:00:00' },
  ];
  const offset = seed % templates.length;
  return [...templates.slice(offset), ...templates.slice(0, offset)].slice(0, 5 + (seed % 2));
}

export function generateMockNotes(clientId: string): ClientNote[] {
  const seed = clientId.charCodeAt(0);
  const templates: ClientNote[][] = [
    [
      { id: `${clientId}-n1`, text: 'Client tres professionnel, toujours a l\'heure. Prefere le studio avec lumiere naturelle.', date: '2026-01-15T10:00:00', author: 'Vous' },
      { id: `${clientId}-n2`, text: 'Interesse par un abonnement mensuel. Relancer en fevrier.', date: '2026-01-08T14:30:00', author: 'Vous' },
    ],
    [
      { id: `${clientId}-n1`, text: 'A demande des tarifs speciaux pour des shootings reguliers. Voir avec la direction.', date: '2026-01-20T09:00:00', author: 'Vous' },
    ],
    [
      { id: `${clientId}-n1`, text: 'Nouveau client recommande par Marie Dupont. Premier shooting reussi.', date: '2026-02-01T16:00:00', author: 'Vous' },
      { id: `${clientId}-n2`, text: 'Prefere les creneaux du matin. Materiel propre apporte.', date: '2026-01-25T11:00:00', author: 'Vous' },
    ],
  ];
  return templates[seed % templates.length];
}

export const activityConfig: Record<ActivityType, { label: string; color: string; icon: LucideIcon }> = {} as Record<ActivityType, { label: string; color: string; icon: LucideIcon }>;
// Note: activityConfig is populated in ClientDetailSidebar where icons are available
