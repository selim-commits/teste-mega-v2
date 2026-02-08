/**
 * Calendar Conflicts Detection
 * Détecte les conflits de réservations dans le calendrier
 */

import { parseISO } from 'date-fns';
import type { Booking } from '../types/database';

export type ConflictType = 'time_overlap' | 'double_booking' | 'resource_conflict';
export type ConflictSeverity = 'high' | 'medium' | 'low';

export interface ConflictResult {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  bookingA: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    spaceId: string;
    clientId: string;
  };
  bookingB: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    spaceId: string;
    clientId: string;
  };
  message: string;
}

/**
 * Vérifie si deux périodes de temps se chevauchent
 */
function timesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Détermine le type et la sévérité d'un conflit
 */
function determineConflictTypeAndSeverity(
  bookingA: Booking,
  bookingB: Booking
): { type: ConflictType; severity: ConflictSeverity } {
  // Même espace + chevauchement = conflit de ressource (high severity)
  if (bookingA.space_id === bookingB.space_id) {
    return { type: 'resource_conflict', severity: 'high' };
  }

  // Même client + chevauchement = double réservation (medium severity)
  if (bookingA.client_id === bookingB.client_id) {
    return { type: 'double_booking', severity: 'medium' };
  }

  // Chevauchement simple (low severity)
  return { type: 'time_overlap', severity: 'low' };
}

/**
 * Génère un message descriptif pour le conflit
 */
function generateConflictMessage(
  type: ConflictType,
  bookingA: Booking,
  bookingB: Booking
): string {
  const startA = parseISO(bookingA.start_time);
  const endA = parseISO(bookingA.end_time);
  const startB = parseISO(bookingB.start_time);
  const endB = parseISO(bookingB.end_time);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  switch (type) {
    case 'resource_conflict':
      return `Conflit d'espace : "${bookingA.title}" (${formatTime(startA)}-${formatTime(endA)}) et "${bookingB.title}" (${formatTime(startB)}-${formatTime(endB)}) utilisent le même espace.`;
    case 'double_booking':
      return `Double réservation : le même client a réservé "${bookingA.title}" (${formatTime(startA)}-${formatTime(endA)}) et "${bookingB.title}" (${formatTime(startB)}-${formatTime(endB)}) en même temps.`;
    case 'time_overlap':
      return `Chevauchement : "${bookingA.title}" (${formatTime(startA)}-${formatTime(endA)}) et "${bookingB.title}" (${formatTime(startB)}-${formatTime(endB)}) se chevauchent.`;
    default:
      return 'Conflit détecté';
  }
}

/**
 * Détecte tous les conflits dans une liste de réservations
 */
export function detectConflicts(bookings: Booking[]): ConflictResult[] {
  const conflicts: ConflictResult[] = [];
  const processedPairs = new Set<string>();

  // Filtrer les réservations annulées
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

  for (let i = 0; i < activeBookings.length; i++) {
    for (let j = i + 1; j < activeBookings.length; j++) {
      const bookingA = activeBookings[i];
      const bookingB = activeBookings[j];

      // Éviter de traiter deux fois la même paire
      const pairKey = [bookingA.id, bookingB.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const startA = parseISO(bookingA.start_time);
      const endA = parseISO(bookingA.end_time);
      const startB = parseISO(bookingB.start_time);
      const endB = parseISO(bookingB.end_time);

      // Vérifier le chevauchement temporel
      if (timesOverlap(startA, endA, startB, endB)) {
        const { type, severity } = determineConflictTypeAndSeverity(
          bookingA,
          bookingB
        );
        const message = generateConflictMessage(type, bookingA, bookingB);

        conflicts.push({
          id: crypto.randomUUID(),
          type,
          severity,
          bookingA: {
            id: bookingA.id,
            title: bookingA.title,
            start: startA,
            end: endA,
            spaceId: bookingA.space_id,
            clientId: bookingA.client_id,
          },
          bookingB: {
            id: bookingB.id,
            title: bookingB.title,
            start: startB,
            end: endB,
            spaceId: bookingB.space_id,
            clientId: bookingB.client_id,
          },
          message,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Vérifie si une nouvelle réservation entre en conflit avec les réservations existantes
 */
export function checkNewBookingConflicts(
  newBooking: Booking,
  existingBookings: Booking[]
): ConflictResult[] {
  const conflicts: ConflictResult[] = [];

  // Ignorer les réservations annulées
  const activeBookings = existingBookings.filter(
    (b) => b.status !== 'cancelled' && b.id !== newBooking.id
  );

  const newStart = parseISO(newBooking.start_time);
  const newEnd = parseISO(newBooking.end_time);

  for (const existing of activeBookings) {
    const existingStart = parseISO(existing.start_time);
    const existingEnd = parseISO(existing.end_time);

    // Vérifier le chevauchement temporel
    if (timesOverlap(newStart, newEnd, existingStart, existingEnd)) {
      const { type, severity } = determineConflictTypeAndSeverity(
        newBooking,
        existing
      );
      const message = generateConflictMessage(type, newBooking, existing);

      conflicts.push({
        id: crypto.randomUUID(),
        type,
        severity,
        bookingA: {
          id: newBooking.id,
          title: newBooking.title,
          start: newStart,
          end: newEnd,
          spaceId: newBooking.space_id,
          clientId: newBooking.client_id,
        },
        bookingB: {
          id: existing.id,
          title: existing.title,
          start: existingStart,
          end: existingEnd,
          spaceId: existing.space_id,
          clientId: existing.client_id,
        },
        message,
      });
    }
  }

  return conflicts;
}

/**
 * Vérifie si une réservation spécifique a des conflits
 */
export function hasConflicts(
  bookingId: string,
  allConflicts: ConflictResult[]
): boolean {
  return allConflicts.some(
    (conflict) =>
      conflict.bookingA.id === bookingId || conflict.bookingB.id === bookingId
  );
}

/**
 * Obtient tous les conflits pour une réservation spécifique
 */
export function getBookingConflicts(
  bookingId: string,
  allConflicts: ConflictResult[]
): ConflictResult[] {
  return allConflicts.filter(
    (conflict) =>
      conflict.bookingA.id === bookingId || conflict.bookingB.id === bookingId
  );
}

/**
 * Compte le nombre de conflits par sévérité
 */
export function countConflictsBySeverity(conflicts: ConflictResult[]): {
  high: number;
  medium: number;
  low: number;
  total: number;
} {
  return {
    high: conflicts.filter((c) => c.severity === 'high').length,
    medium: conflicts.filter((c) => c.severity === 'medium').length,
    low: conflicts.filter((c) => c.severity === 'low').length,
    total: conflicts.length,
  };
}
