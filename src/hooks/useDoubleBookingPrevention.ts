import { useState, useCallback, useMemo } from 'react';
import { parseISO, addHours, format, isSameDay } from 'date-fns';
import {
  checkNewBookingConflicts,
  detectConflicts,
  countConflictsBySeverity,
  type ConflictResult,
} from '../lib/calendarConflicts';
import type { Booking } from '../types/database';

export type ConflictMode = 'block' | 'warn' | 'allow';

const STORAGE_KEY = 'rooom_booking_conflict_mode';

export interface AlternativeSlot {
  id: string;
  start: string;
  end: string;
  label: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: ConflictResult[];
  canProceed: boolean;
  alternativeSlots: AlternativeSlot[];
}

function getStoredMode(): ConflictMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'block' || stored === 'warn' || stored === 'allow') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'warn';
}

function setStoredMode(mode: ConflictMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage not available
  }
}

/**
 * Finds alternative time slots that don't conflict with existing bookings.
 */
function findAlternativeSlots(
  startTime: string,
  endTime: string,
  spaceId: string,
  existingBookings: Booking[],
  maxSuggestions: number = 3
): AlternativeSlot[] {
  const originalStart = parseISO(startTime);
  const originalEnd = parseISO(endTime);
  const durationMs = originalEnd.getTime() - originalStart.getTime();

  const activeBookings = existingBookings.filter(
    (b) => b.status !== 'cancelled' && b.space_id === spaceId
  );

  const alternatives: AlternativeSlot[] = [];

  // Try slots after the original time, on the same day
  for (let offsetHours = 1; offsetHours <= 8; offsetHours++) {
    if (alternatives.length >= maxSuggestions) break;

    const candidateStart = addHours(originalStart, offsetHours);
    const candidateEnd = new Date(candidateStart.getTime() + durationMs);

    // Only suggest slots on the same day, between 9h and 20h
    if (!isSameDay(candidateStart, originalStart)) break;
    if (candidateStart.getHours() < 9 || candidateEnd.getHours() > 20) continue;

    const hasOverlap = activeBookings.some((booking) => {
      const bStart = parseISO(booking.start_time);
      const bEnd = parseISO(booking.end_time);
      return candidateStart < bEnd && candidateEnd > bStart;
    });

    if (!hasOverlap) {
      alternatives.push({
        id: crypto.randomUUID(),
        start: candidateStart.toISOString(),
        end: candidateEnd.toISOString(),
        label: `${format(candidateStart, 'HH:mm')} - ${format(candidateEnd, 'HH:mm')}`,
      });
    }
  }

  // Try slots before the original time if not enough alternatives
  if (alternatives.length < maxSuggestions) {
    for (let offsetHours = 1; offsetHours <= 4; offsetHours++) {
      if (alternatives.length >= maxSuggestions) break;

      const candidateStart = addHours(originalStart, -offsetHours);
      const candidateEnd = new Date(candidateStart.getTime() + durationMs);

      if (!isSameDay(candidateStart, originalStart)) break;
      if (candidateStart.getHours() < 9 || candidateEnd.getHours() > 20) continue;

      const hasOverlap = activeBookings.some((booking) => {
        const bStart = parseISO(booking.start_time);
        const bEnd = parseISO(booking.end_time);
        return candidateStart < bEnd && candidateEnd > bStart;
      });

      if (!hasOverlap) {
        alternatives.push({
          id: crypto.randomUUID(),
          start: candidateStart.toISOString(),
          end: candidateEnd.toISOString(),
          label: `${format(candidateStart, 'HH:mm')} - ${format(candidateEnd, 'HH:mm')}`,
        });
      }
    }
  }

  return alternatives;
}

export function useDoubleBookingPrevention(existingBookings: Booking[]) {
  const [conflictMode, setConflictModeState] = useState<ConflictMode>(getStoredMode);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  const [alternativeSlots, setAlternativeSlots] = useState<AlternativeSlot[]>([]);

  // All conflicts in the current bookings list
  const allConflicts = useMemo(
    () => detectConflicts(existingBookings),
    [existingBookings]
  );

  const conflictCounts = useMemo(
    () => countConflictsBySeverity(allConflicts),
    [allConflicts]
  );

  const setConflictMode = useCallback((mode: ConflictMode) => {
    setConflictModeState(mode);
    setStoredMode(mode);
  }, []);

  /**
   * Check if a new booking conflicts with existing ones.
   */
  const checkForConflicts = useCallback(
    (newBooking: Booking): ConflictCheckResult => {
      if (conflictMode === 'allow') {
        return {
          hasConflicts: false,
          conflicts: [],
          canProceed: true,
          alternativeSlots: [],
        };
      }

      const detected = checkNewBookingConflicts(newBooking, existingBookings);
      const hasConflicts = detected.length > 0;

      let alternatives: AlternativeSlot[] = [];
      if (hasConflicts) {
        alternatives = findAlternativeSlots(
          newBooking.start_time,
          newBooking.end_time,
          newBooking.space_id,
          existingBookings
        );
      }

      setConflicts(detected);
      setAlternativeSlots(alternatives);

      return {
        hasConflicts,
        conflicts: detected,
        canProceed: conflictMode === 'warn' || !hasConflicts,
        alternativeSlots: alternatives,
      };
    },
    [existingBookings, conflictMode]
  );

  /**
   * Get conflicting sessions for a specific time range and space.
   */
  const getConflictingSessions = useCallback(
    (startTime: string, endTime: string, spaceId: string): Booking[] => {
      const start = parseISO(startTime);
      const end = parseISO(endTime);

      return existingBookings.filter((booking) => {
        if (booking.status === 'cancelled') return false;
        if (spaceId && booking.space_id !== spaceId) return false;

        const bStart = parseISO(booking.start_time);
        const bEnd = parseISO(booking.end_time);
        return start < bEnd && end > bStart;
      });
    },
    [existingBookings]
  );

  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setAlternativeSlots([]);
  }, []);

  return {
    // State
    conflictMode,
    conflicts,
    alternativeSlots,
    allConflicts,
    conflictCounts,

    // Actions
    setConflictMode,
    checkForConflicts,
    getConflictingSessions,
    clearConflicts,
  };
}
