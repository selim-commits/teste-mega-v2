import { describe, it, expect } from 'vitest';
import {
  mockClients,
  mockSpaces,
  mockBookings,
  mockEquipment,
  mockTeamMembers,
  mockPacks,
  mockClientPurchases,
  mockInvoices,
  mockPayments,
  calculateMockPackStats,
  calculateMockDashboardStats,
  getMockTodayBookings,
  getMockMaintenanceEquipment,
} from './mockData';

describe('mockData arrays', () => {
  it('contient les bons nombres de donnees', () => {
    expect(mockClients).toHaveLength(5);
    expect(mockSpaces).toHaveLength(3);
    expect(mockBookings).toHaveLength(8);
    expect(mockEquipment).toHaveLength(5);
    expect(mockTeamMembers).toHaveLength(3);
    expect(mockPacks).toHaveLength(5);
    expect(mockClientPurchases).toHaveLength(5);
    expect(mockInvoices).toHaveLength(5);
    expect(mockPayments).toHaveLength(4);
  });

  it('chaque client a un id et un nom', () => {
    for (const client of mockClients) {
      expect(client.id).toBeTruthy();
      expect(client.name).toBeTruthy();
      expect(client.studio_id).toBeTruthy();
    }
  });

  it('chaque booking a des timestamps valides', () => {
    for (const booking of mockBookings) {
      expect(new Date(booking.start_time).getTime()).not.toBeNaN();
      expect(new Date(booking.end_time).getTime()).not.toBeNaN();
    }
  });
});

describe('calculateMockPackStats', () => {
  it('retourne des stats coherentes', () => {
    const stats = calculateMockPackStats();
    expect(stats.activePacks).toBeGreaterThan(0);
    expect(stats.totalSold).toBe(mockClientPurchases.length);
    expect(stats.activeSubscriptions).toBeGreaterThanOrEqual(0);
    expect(stats.monthlyRevenue).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateMockDashboardStats', () => {
  it('retourne des stats avec des valeurs positives', () => {
    const stats = calculateMockDashboardStats();
    expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(stats.totalBookings).toBeGreaterThanOrEqual(0);
    expect(stats.occupancyRate).toBeGreaterThan(0);
  });
});

describe('getMockTodayBookings', () => {
  it('retourne uniquement des bookings du jour', () => {
    const todayBookings = getMockTodayBookings();
    const today = new Date();
    for (const booking of todayBookings) {
      const bookingDate = new Date(booking.start_time);
      expect(bookingDate.getDate()).toBe(today.getDate());
      expect(bookingDate.getMonth()).toBe(today.getMonth());
      expect(bookingDate.getFullYear()).toBe(today.getFullYear());
    }
  });
});

describe('getMockMaintenanceEquipment', () => {
  it('retourne les equipements en maintenance ou condition <= 2', () => {
    const maintenance = getMockMaintenanceEquipment();
    expect(maintenance.length).toBeGreaterThan(0);
    for (const item of maintenance) {
      expect(item.status === 'maintenance' || item.condition <= 2).toBe(true);
    }
  });
});
