/**
 * Tests unitaires pour la détection de conflits
 * À exécuter avec Vitest (à installer)
 */

import { describe, it, expect } from 'vitest';
import {
  detectConflicts,
  checkNewBookingConflicts,
  hasConflicts,
  getBookingConflicts,
  countConflictsBySeverity,
} from './calendarConflicts';
import type { Booking } from '../types/database';

// Helper pour créer une réservation de test
const createBooking = (
  id: string,
  spaceId: string,
  clientId: string,
  startTime: string,
  endTime: string,
  title: string = 'Test Booking'
): Booking => ({
  id,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  studio_id: 'studio-1',
  space_id: spaceId,
  client_id: clientId,
  title,
  description: null,
  start_time: startTime,
  end_time: endTime,
  status: 'confirmed',
  total_amount: 100,
  paid_amount: 0,
  notes: null,
  internal_notes: null,
  is_recurring: false,
  recurrence_rule: null,
  parent_booking_id: null,
  created_by: 'user-1',
});

describe('calendarConflicts', () => {
  describe('detectConflicts', () => {
    it('devrait détecter un conflit d\'espace (même espace, même horaire)', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
      ];

      const conflicts = detectConflicts(bookings);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('resource_conflict');
      expect(conflicts[0].severity).toBe('high');
    });

    it('devrait détecter une double réservation (même client, horaires qui se chevauchent)', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-2', 'client-1', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
      ];

      const conflicts = detectConflicts(bookings);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('double_booking');
      expect(conflicts[0].severity).toBe('medium');
    });

    it('devrait détecter un chevauchement simple', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-2', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
      ];

      const conflicts = detectConflicts(bookings);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('time_overlap');
      expect(conflicts[0].severity).toBe('low');
    });

    it('ne devrait pas détecter de conflit si les horaires ne se chevauchent pas', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T11:00:00Z', '2024-01-01T12:00:00Z'),
      ];

      const conflicts = detectConflicts(bookings);

      expect(conflicts).toHaveLength(0);
    });

    it('devrait ignorer les réservations annulées', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        {
          ...createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
          status: 'cancelled' as const,
        },
      ];

      const conflicts = detectConflicts(bookings);

      expect(conflicts).toHaveLength(0);
    });

    it('devrait détecter plusieurs conflits', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
        createBooking('3', 'space-2', 'client-1', '2024-01-01T10:15:00Z', '2024-01-01T11:15:00Z'),
      ];

      const conflicts = detectConflicts(bookings);

      expect(conflicts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('checkNewBookingConflicts', () => {
    it('devrait détecter un conflit avec une nouvelle réservation', () => {
      const existing = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
      ];

      const newBooking = createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z');

      const conflicts = checkNewBookingConflicts(newBooking, existing);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('resource_conflict');
    });

    it('ne devrait pas détecter de conflit si la nouvelle réservation ne chevauche pas', () => {
      const existing = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
      ];

      const newBooking = createBooking('2', 'space-1', 'client-2', '2024-01-01T11:00:00Z', '2024-01-01T12:00:00Z');

      const conflicts = checkNewBookingConflicts(newBooking, existing);

      expect(conflicts).toHaveLength(0);
    });

    it('devrait ignorer la même réservation lors de la vérification (pour les mises à jour)', () => {
      const existing = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
      ];

      const updatedBooking = createBooking('1', 'space-1', 'client-1', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z');

      const conflicts = checkNewBookingConflicts(updatedBooking, existing);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('hasConflicts', () => {
    it('devrait retourner true si la réservation a des conflits', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
      ];

      const conflicts = detectConflicts(bookings);
      const result = hasConflicts('1', conflicts);

      expect(result).toBe(true);
    });

    it('devrait retourner false si la réservation n\'a pas de conflits', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T11:00:00Z', '2024-01-01T12:00:00Z'),
      ];

      const conflicts = detectConflicts(bookings);
      const result = hasConflicts('1', conflicts);

      expect(result).toBe(false);
    });
  });

  describe('getBookingConflicts', () => {
    it('devrait retourner tous les conflits d\'une réservation', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
        createBooking('3', 'space-1', 'client-3', '2024-01-01T10:15:00Z', '2024-01-01T11:15:00Z'),
      ];

      const allConflicts = detectConflicts(bookings);
      const booking1Conflicts = getBookingConflicts('1', allConflicts);

      expect(booking1Conflicts.length).toBeGreaterThan(0);
      expect(booking1Conflicts.every(c => c.bookingA.id === '1' || c.bookingB.id === '1')).toBe(true);
    });
  });

  describe('countConflictsBySeverity', () => {
    it('devrait compter correctement les conflits par sévérité', () => {
      const bookings = [
        // Conflit d'espace (high)
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T10:30:00Z', '2024-01-01T11:30:00Z'),
        // Double réservation (medium)
        createBooking('3', 'space-2', 'client-1', '2024-01-01T10:15:00Z', '2024-01-01T11:15:00Z'),
        // Chevauchement simple (low)
        createBooking('4', 'space-3', 'client-3', '2024-01-01T10:45:00Z', '2024-01-01T11:45:00Z'),
      ];

      const conflicts = detectConflicts(bookings);
      const stats = countConflictsBySeverity(conflicts);

      expect(stats.total).toBe(conflicts.length);
      expect(stats.high).toBeGreaterThan(0);
      expect(stats.medium).toBeGreaterThan(0);
    });

    it('devrait retourner zéro pour toutes les sévérités s\'il n\'y a pas de conflits', () => {
      const conflicts = detectConflicts([]);
      const stats = countConflictsBySeverity(conflicts);

      expect(stats.total).toBe(0);
      expect(stats.high).toBe(0);
      expect(stats.medium).toBe(0);
      expect(stats.low).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer une liste vide de réservations', () => {
      const conflicts = detectConflicts([]);
      expect(conflicts).toHaveLength(0);
    });

    it('devrait gérer une seule réservation', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
      ];

      const conflicts = detectConflicts(bookings);
      expect(conflicts).toHaveLength(0);
    });

    it('devrait gérer des réservations qui se touchent exactement (pas de chevauchement)', () => {
      const bookings = [
        createBooking('1', 'space-1', 'client-1', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
        createBooking('2', 'space-1', 'client-2', '2024-01-01T11:00:00Z', '2024-01-01T12:00:00Z'),
      ];

      const conflicts = detectConflicts(bookings);
      expect(conflicts).toHaveLength(0);
    });
  });
});
