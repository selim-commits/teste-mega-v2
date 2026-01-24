import { useQuery } from '@tanstack/react-query';
import { supabase, isDemoMode } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { calculateMockDashboardStats } from '../lib/mockData';
import type { Invoice, Booking, Space } from '../types/database';

export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  activeClients: number;
  pendingInvoices: number;
  revenueGrowth: number;
  bookingsGrowth: number;
  clientsGrowth: number;
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  bookings: number;
}

export interface TopClient {
  id: string;
  name: string;
  totalSpent: number;
  bookingsCount: number;
}

export interface SpaceUtilization {
  spaceId: string;
  spaceName: string;
  totalHours: number;
  bookedHours: number;
  utilizationRate: number;
}

// Helper function to calculate growth
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Get dashboard statistics
export function useDashboardStats(studioId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.stats.dashboard(studioId, startDate, endDate),
    queryFn: async (): Promise<DashboardStats> => {
      // Return mock data in demo mode
      if (isDemoMode) {
        const mockStats = calculateMockDashboardStats();
        return {
          totalRevenue: mockStats.totalRevenue,
          totalBookings: mockStats.totalBookings,
          activeClients: 5,
          pendingInvoices: 2,
          revenueGrowth: mockStats.revenueGrowth,
          bookingsGrowth: mockStats.bookingsGrowth,
          clientsGrowth: mockStats.clientsGrowth,
        };
      }

      const now = new Date();
      const currentMonthStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const currentMonthEnd = endDate || now.toISOString();

      // Previous month for comparison
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Get current month data
      const [bookings, invoices, clients] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .eq('studio_id', studioId)
          .gte('start_time', currentMonthStart)
          .lte('start_time', currentMonthEnd),
        supabase
          .from('invoices')
          .select('*')
          .eq('studio_id', studioId)
          .gte('issue_date', currentMonthStart.split('T')[0])
          .lte('issue_date', currentMonthEnd.split('T')[0]),
        supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .eq('studio_id', studioId)
          .eq('is_active', true),
      ]);

      // Get previous month data for growth
      const [prevBookings, prevInvoices, prevClients] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .eq('studio_id', studioId)
          .gte('start_time', prevMonthStart)
          .lte('start_time', prevMonthEnd),
        supabase
          .from('invoices')
          .select('*')
          .eq('studio_id', studioId)
          .gte('issue_date', prevMonthStart.split('T')[0])
          .lte('issue_date', prevMonthEnd.split('T')[0]),
        supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .eq('studio_id', studioId)
          .eq('is_active', true)
          .lte('created_at', prevMonthEnd),
      ]);

      // Get pending invoices
      const pendingInvoicesResult = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('studio_id', studioId)
        .in('status', ['draft', 'sent', 'overdue']);

      const currentRevenue = ((invoices.data || []) as Invoice[])
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.paid_amount, 0);

      const prevRevenue = ((prevInvoices.data || []) as Invoice[])
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.paid_amount, 0);

      return {
        totalRevenue: currentRevenue,
        totalBookings: bookings.count || 0,
        activeClients: clients.count || 0,
        pendingInvoices: pendingInvoicesResult.count || 0,
        revenueGrowth: calculateGrowth(currentRevenue, prevRevenue),
        bookingsGrowth: calculateGrowth(bookings.count || 0, prevBookings.count || 0),
        clientsGrowth: calculateGrowth(clients.count || 0, prevClients.count || 0),
      };
    },
    enabled: !!studioId,
    staleTime: 1000 * 60 * 2, // 2 minutes - stats can be slightly stale
  });
}

// Get revenue by period
export function useRevenueByPeriod(
  studioId: string,
  period: 'day' | 'week' | 'month' = 'month',
  count: number = 12
) {
  return useQuery({
    queryKey: queryKeys.stats.revenue(studioId, period),
    queryFn: async (): Promise<RevenueByPeriod[]> => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('studio_id', studioId)
        .eq('status', 'paid')
        .order('issue_date', { ascending: true });

      if (error) throw error;

      // Group by period
      const grouped = new Map<string, { revenue: number; bookings: number }>();

      ((invoices || []) as Invoice[]).forEach(invoice => {
        const date = new Date(invoice.issue_date);
        let periodKey: string;

        switch (period) {
          case 'day':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
          default:
            periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
        }

        const current = grouped.get(periodKey) || { revenue: 0, bookings: 0 };
        current.revenue += invoice.paid_amount;
        current.bookings += 1;
        grouped.set(periodKey, current);
      });

      return Array.from(grouped.entries())
        .map(([periodStr, data]) => ({
          period: periodStr,
          revenue: data.revenue,
          bookings: data.bookings,
        }))
        .slice(-count);
    },
    enabled: !!studioId,
  });
}

// Get top clients by revenue
export function useTopClients(studioId: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.stats.topClients(studioId),
    queryFn: async (): Promise<TopClient[]> => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('client_id, paid_amount')
        .eq('studio_id', studioId)
        .eq('status', 'paid');

      if (error) throw error;

      // Aggregate by client
      const clientTotals = new Map<string, { totalSpent: number; bookingsCount: number }>();

      ((invoices || []) as Array<{ client_id: string; paid_amount: number }>).forEach(invoice => {
        const current = clientTotals.get(invoice.client_id) || { totalSpent: 0, bookingsCount: 0 };
        current.totalSpent += invoice.paid_amount;
        current.bookingsCount += 1;
        clientTotals.set(invoice.client_id, current);
      });

      // Get client names
      const clientIds = Array.from(clientTotals.keys());
      if (clientIds.length === 0) return [];

      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      const clientMap = new Map(((clients || []) as Array<{ id: string; name: string }>).map(c => [c.id, c.name]));

      return Array.from(clientTotals.entries())
        .map(([id, data]) => ({
          id,
          name: clientMap.get(id) || 'Unknown',
          totalSpent: data.totalSpent,
          bookingsCount: data.bookingsCount,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    },
    enabled: !!studioId,
  });
}

// Get space utilization
export function useSpaceUtilization(studioId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'utilization', studioId, startDate, endDate],
    queryFn: async (): Promise<SpaceUtilization[]> => {
      const [spaces, bookings] = await Promise.all([
        supabase.from('spaces').select('*').eq('studio_id', studioId),
        supabase
          .from('bookings')
          .select('*')
          .eq('studio_id', studioId)
          .gte('start_time', startDate)
          .lte('end_time', endDate)
          .in('status', ['confirmed', 'completed']),
      ]);

      if (spaces.error) throw spaces.error;
      if (bookings.error) throw bookings.error;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalHoursPerSpace = totalDays * 24; // Assuming 24h availability

      const spaceBookings = new Map<string, number>();

      ((bookings.data || []) as Booking[]).forEach(booking => {
        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        const current = spaceBookings.get(booking.space_id) || 0;
        spaceBookings.set(booking.space_id, current + hours);
      });

      return ((spaces.data || []) as Space[]).map(space => {
        const bookedHours = spaceBookings.get(space.id) || 0;
        return {
          spaceId: space.id,
          spaceName: space.name,
          totalHours: totalHoursPerSpace,
          bookedHours: Math.round(bookedHours * 100) / 100,
          utilizationRate: Math.round((bookedHours / totalHoursPerSpace) * 10000) / 100,
        };
      });
    },
    enabled: !!studioId && !!startDate && !!endDate,
  });
}

// Get booking count by status
export function useBookingCountByStatus(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'bookingsByStatus', studioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('status')
        .eq('studio_id', studioId);

      if (error) throw error;

      const counts: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      };

      ((data || []) as Array<{ status: string }>).forEach(booking => {
        if (counts[booking.status] !== undefined) {
          counts[booking.status]++;
        }
      });

      return counts;
    },
    enabled: !!studioId,
  });
}

// Get invoice summary
export function useInvoiceSummary(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'invoiceSummary', studioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total_amount, paid_amount')
        .eq('studio_id', studioId);

      if (error) throw error;

      let totalOutstanding = 0;
      let totalPaid = 0;
      let overdueAmount = 0;
      let draftAmount = 0;

      ((data || []) as Array<{ status: string; total_amount: number; paid_amount: number }>).forEach(invoice => {
        if (invoice.status === 'paid') {
          totalPaid += invoice.paid_amount;
        } else if (invoice.status === 'overdue') {
          overdueAmount += invoice.total_amount - invoice.paid_amount;
          totalOutstanding += invoice.total_amount - invoice.paid_amount;
        } else if (invoice.status === 'sent') {
          totalOutstanding += invoice.total_amount - invoice.paid_amount;
        } else if (invoice.status === 'draft') {
          draftAmount += invoice.total_amount;
        }
      });

      return {
        totalPaid,
        totalOutstanding,
        overdueAmount,
        draftAmount,
      };
    },
    enabled: !!studioId,
  });
}
