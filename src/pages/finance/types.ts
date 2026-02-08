import type { LucideIcon } from 'lucide-react';
import type { Invoice, InvoiceStatus, Client } from '../../types/database';

// Re-export commonly used types
export type { Invoice, InvoiceStatus, Client };

export interface KpiItem {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string;
  isCount?: boolean;
}

export interface RevenueDataPoint {
  month: string;
  value: number;
}

export interface ExpenseItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface StatusBreakdownData {
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
  paidPercent: number;
  pendingPercent: number;
  overduePercent: number;
}

export interface AgingBucketData {
  amount: number;
  count: number;
}

export interface AgingBucketsData {
  current: AgingBucketData;
  days31_60: AgingBucketData;
  days61_90: AgingBucketData;
  days90plus: AgingBucketData;
}

export interface TaxCalculationsData {
  grossRevenue: number;
  netRevenue: number;
  tvaCollected: number;
  tvaRate: number;
}

export interface RelancesStatsData {
  overdueCount: number;
  totalOverdueAmount: number;
  lastReminderDate: Date | null;
}

export interface ReconciliationCategory {
  count: number;
  amount: number;
  percent: number;
}

export interface ReconciliationData {
  matched: ReconciliationCategory;
  partial: ReconciliationCategory;
  unmatched: ReconciliationCategory;
}

export interface FilterCountsData {
  all: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

export interface FinanceStats {
  currentMonthRevenue: number;
  prevMonthRevenue: number;
  ytdRevenue: number;
  outstandingAmount: number;
  overdueCount: number;
  averageValue: number;
  monthChange: number;
  totalInvoices: number;
  paidCount: number;
  pendingCount: number;
}
