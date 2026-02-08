import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useCurrency, type CurrencyCode } from '../hooks/useCurrency';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoiceStatus,
  useMarkInvoiceAsPaid,
  useMarkInvoiceAsSent,
  useMarkInvoiceAsOverdue,
  useCancelInvoice,
  useGenerateInvoiceNumber,
  useTotalRevenue,
  useOverdueInvoices,
  usePendingInvoices,
  useDeleteInvoice,
} from '../hooks/useInvoices';
import { useCreatePayment, useTotalReceived, useRecentPayments } from '../hooks/usePayments';
import { useActiveClients } from '../hooks/useClients';
import { useFinanceStore } from '../stores/financeStore';
import { useNotifications } from '../stores/uiStore';
import type { Invoice, InvoiceStatus, InvoiceInsert, Client, PaymentInsert } from '../types/database';
import { formatCurrency } from '../lib/utils';
import { Select } from '../components/ui/Select';
import { DEMO_STUDIO_ID as STUDIO_ID } from '../stores/authStore';
import type { KpiItem } from './finance/types';

// Sub-components
import { FinanceOverview } from './finance/FinanceOverview';
import { RevenueChart } from './finance/RevenueChart';
import { ExpenseBreakdown } from './finance/ExpenseBreakdown';
import { AgingBuckets } from './finance/AgingBuckets';
import { TaxSection } from './finance/TaxSection';
import { RelancesSection } from './finance/RelancesSection';
import { ReconciliationSection } from './finance/ReconciliationSection';
import { InvoiceTable } from './finance/InvoiceTable';
import { InvoiceDetailModal } from './finance/InvoiceDetailModal';
import { DeleteConfirmModal } from './finance/DeleteConfirmModal';
import { CreateInvoiceModal } from './finance/CreateInvoiceModal';
import type { InvoiceFormData } from './finance/CreateInvoiceModal';
import { RecordPaymentModal } from './finance/RecordPaymentModal';
import type { PaymentFormData } from './finance/RecordPaymentModal';

import styles from './Finance.module.css';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
const TVA_RATE = 0.20;

export function Finance() {
  // Currency
  const { defaultCurrency, formatAmount: formatCurrencyAmount, currencyOptions, convertAmount: convertCurrency } = useCurrency();
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(defaultCurrency);

  // State
  const [period, setPeriod] = useState('month');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Relances state
  const [autoReminder, setAutoReminder] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState('7');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Hooks
  const { success: showSuccess, error: showError } = useNotifications();
  const { setInvoiceFilters } = useFinanceStore();

  // Queries
  const { data: invoices = [], isLoading, error: queryError } = useInvoices({
    studioId: STUDIO_ID,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
  });

  const { data: clients = [] } = useActiveClients(STUDIO_ID);
  void useOverdueInvoices(STUDIO_ID);
  const { data: pendingInvoices = [] } = usePendingInvoices(STUDIO_ID);

  // Revenue calculations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

  const { data: currentMonthRevenue = 0 } = useTotalRevenue(STUDIO_ID, startOfMonth, endOfMonth);
  const { data: prevMonthRevenue = 0 } = useTotalRevenue(STUDIO_ID, startOfPrevMonth, endOfPrevMonth);
  const { data: ytdRevenue = 0 } = useTotalRevenue(STUDIO_ID, startOfYear);

  const { data: generatedInvoiceNumber } = useGenerateInvoiceNumber(STUDIO_ID, isCreateModalOpen);

  // Payment queries
  void useTotalReceived(STUDIO_ID, startOfMonth, endOfMonth);
  void useRecentPayments(STUDIO_ID, 5);

  // Mutations
  const createMutation = useCreateInvoice();
  const updateStatusMutation = useUpdateInvoiceStatus();
  const markAsPaidMutation = useMarkInvoiceAsPaid();
  const markAsSentMutation = useMarkInvoiceAsSent();
  const markAsOverdueMutation = useMarkInvoiceAsOverdue();
  const cancelMutation = useCancelInvoice();
  const deleteMutation = useDeleteInvoice();
  const createPaymentMutation = useCreatePayment();

  // ===== Currency formatting =====
  const fmtCurrency = useCallback(
    (amount: number) => {
      if (displayCurrency === 'EUR') return formatCurrency(amount);
      const converted = convertCurrency(amount, 'EUR', displayCurrency);
      return formatCurrencyAmount(converted, displayCurrency);
    },
    [displayCurrency, convertCurrency, formatCurrencyAmount]
  );

  // ===== Computed data =====

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const outstandingInvoices = invoices.filter((i) => ['sent', 'overdue'].includes(i.status));
    const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

    void paidInvoices;
    const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);
    const averageValue = invoices.length > 0
      ? invoices.reduce((sum, i) => sum + i.total_amount, 0) / invoices.length
      : 0;

    const monthChange = prevMonthRevenue > 0
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0;

    return {
      currentMonthRevenue,
      prevMonthRevenue,
      ytdRevenue,
      outstandingAmount,
      overdueCount,
      averageValue,
      monthChange,
      totalInvoices: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
    };
  }, [invoices, currentMonthRevenue, prevMonthRevenue, ytdRevenue, pendingInvoices]);

  const statusBreakdown = useMemo(() => {
    const breakdown = {
      paid: invoices.filter((i) => i.status === 'paid').length,
      pending: invoices.filter((i) => ['draft', 'sent'].includes(i.status)).length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      cancelled: invoices.filter((i) => i.status === 'cancelled').length,
    };
    const total = invoices.length || 1;
    return {
      ...breakdown,
      paidPercent: Math.round((breakdown.paid / total) * 100),
      pendingPercent: Math.round((breakdown.pending / total) * 100),
      overduePercent: Math.round((breakdown.overdue / total) * 100),
    };
  }, [invoices]);

  const revenueData = useMemo(() => {
    const currentYear = now.getFullYear();
    const monthlyTotals = new Map<number, number>();

    for (let m = 0; m <= now.getMonth(); m++) {
      monthlyTotals.set(m, 0);
    }

    invoices.forEach((inv) => {
      if (inv.status === 'paid') {
        const issueDate = new Date(inv.issue_date);
        if (issueDate.getFullYear() === currentYear) {
          const month = issueDate.getMonth();
          monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + inv.total_amount);
        }
      }
    });

    return Array.from(monthlyTotals.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, value]) => ({
        month: MONTH_NAMES[month],
        value,
      }));
  }, [invoices, now]);

  const expenses = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0);

    const categories = [
      { category: 'Equipement', ratio: 0.15 },
      { category: 'Loyer', ratio: 0.20 },
      { category: 'Personnel', ratio: 0.35 },
      { category: 'Marketing', ratio: 0.10 },
      { category: 'Fournitures', ratio: 0.08 },
      { category: 'Autres', ratio: 0.12 },
    ];

    const totalRatio = categories.reduce((sum, c) => sum + c.ratio, 0);

    return categories.map((cat) => {
      const amount = Math.round(totalRevenue * cat.ratio);
      const percentage = Math.round((cat.ratio / totalRatio) * 100);
      return { category: cat.category, amount, percentage };
    });
  }, [invoices]);

  const agingBuckets = useMemo(() => {
    const today = new Date();
    const buckets = {
      current: { amount: 0, count: 0 },
      days31_60: { amount: 0, count: 0 },
      days61_90: { amount: 0, count: 0 },
      days90plus: { amount: 0, count: 0 },
    };

    invoices
      .filter((inv) => ['sent', 'overdue'].includes(inv.status) && inv.paid_amount < inv.total_amount)
      .forEach((inv) => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        const outstanding = inv.total_amount - inv.paid_amount;

        if (daysOverdue <= 30) {
          buckets.current.amount += outstanding;
          buckets.current.count += 1;
        } else if (daysOverdue <= 60) {
          buckets.days31_60.amount += outstanding;
          buckets.days31_60.count += 1;
        } else if (daysOverdue <= 90) {
          buckets.days61_90.amount += outstanding;
          buckets.days61_90.count += 1;
        } else {
          buckets.days90plus.amount += outstanding;
          buckets.days90plus.count += 1;
        }
      });

    return buckets;
  }, [invoices]);

  const agingTotal = useMemo(() => {
    return agingBuckets.current.amount + agingBuckets.days31_60.amount + agingBuckets.days61_90.amount + agingBuckets.days90plus.amount;
  }, [agingBuckets]);

  const taxCalculations = useMemo(() => {
    const paidThisMonth = invoices.filter((inv) => {
      if (inv.status !== 'paid') return false;
      const issueDate = new Date(inv.issue_date);
      return issueDate.getFullYear() === now.getFullYear() && issueDate.getMonth() === now.getMonth();
    });

    const grossRevenue = paidThisMonth.reduce((sum, inv) => sum + inv.total_amount, 0);
    const tvaCollected = paidThisMonth.reduce((sum, inv) => sum + inv.tax_amount, 0);
    const netRevenue = grossRevenue - tvaCollected;

    return { grossRevenue, netRevenue, tvaCollected, tvaRate: TVA_RATE };
  }, [invoices, now]);

  const relancesStats = useMemo(() => {
    const overdueInvs = invoices.filter((i) => i.status === 'overdue');
    const totalOverdueAmount = overdueInvs.reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);

    return {
      overdueCount: overdueInvs.length,
      totalOverdueAmount,
      lastReminderDate: overdueInvs.length > 0 ? new Date(Math.max(...overdueInvs.map((i) => new Date(i.updated_at).getTime()))) : null,
    };
  }, [invoices]);

  const reconciliation = useMemo(() => {
    const nonDraftInvoices = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');
    const totalCount = nonDraftInvoices.length || 1;

    const matched = nonDraftInvoices.filter((i) => i.status === 'paid' && i.paid_amount >= i.total_amount);
    const partial = nonDraftInvoices.filter((i) => i.paid_amount > 0 && i.paid_amount < i.total_amount);
    const unmatched = nonDraftInvoices.filter((i) => i.paid_amount === 0 && i.status !== 'paid');

    const matchedAmount = matched.reduce((sum, i) => sum + i.total_amount, 0);
    const partialAmount = partial.reduce((sum, i) => sum + i.paid_amount, 0);
    const unmatchedAmount = unmatched.reduce((sum, i) => sum + i.total_amount, 0);

    return {
      matched: { count: matched.length, amount: matchedAmount, percent: Math.round((matched.length / totalCount) * 100) },
      partial: { count: partial.length, amount: partialAmount, percent: Math.round((partial.length / totalCount) * 100) },
      unmatched: { count: unmatched.length, amount: unmatchedAmount, percent: Math.round((unmatched.length / totalCount) * 100) },
    };
  }, [invoices]);

  const getClientName = useCallback((clientId: string): string => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || 'Client inconnu';
  }, [clients]);

  // Filtered and paginated invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(query) ||
          invoice.notes?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [invoices, debouncedSearch]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  const filterCounts = useMemo(() => ({
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    cancelled: invoices.filter((i) => i.status === 'cancelled').length,
  }), [invoices]);

  // KPIs
  const kpis: KpiItem[] = [
    {
      title: 'Revenus du mois',
      value: stats.currentMonthRevenue,
      change: stats.monthChange,
      trend: stats.monthChange >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'var(--accent-green)',
    },
    {
      title: 'Montant en attente',
      value: stats.outstandingAmount,
      change: 0,
      trend: 'up',
      icon: Clock,
      color: 'var(--accent-yellow)',
    },
    {
      title: 'Factures en retard',
      value: stats.overdueCount,
      change: 0,
      trend: 'up',
      icon: AlertTriangle,
      color: 'var(--accent-red)',
      isCount: true,
    },
    {
      title: 'Valeur moyenne',
      value: stats.averageValue,
      change: 0,
      trend: 'up',
      icon: TrendingUp,
      color: 'var(--accent-blue)',
    },
  ];

  // Client options for select
  const clientOptions = useMemo(() => [
    { value: '', label: 'Selectionner un client' },
    ...clients.map((client: Client) => ({
      value: client.id,
      label: client.name + (client.company ? ` (${client.company})` : ''),
    })),
  ], [clients]);

  // ===== Handlers =====

  const handleExportCSV = useCallback(() => {
    const headers = [
      'Numero', 'Client', 'Statut', 'Date emission', 'Date echeance',
      'Sous-total', 'TVA', 'Remise', 'Total TTC', 'Montant paye', 'Reste du', 'Notes',
    ];

    const rows = invoices.map((inv) => [
      inv.invoice_number, getClientName(inv.client_id), inv.status,
      inv.issue_date, inv.due_date, inv.subtotal.toFixed(2),
      inv.tax_amount.toFixed(2), inv.discount_amount.toFixed(2),
      inv.total_amount.toFixed(2), inv.paid_amount.toFixed(2),
      (inv.total_amount - inv.paid_amount).toFixed(2),
      (inv.notes || '').replace(/"/g, '""'),
    ]);

    const summaryRows = [
      [], ['--- Resume financier ---'],
      ['Revenus bruts du mois', taxCalculations.grossRevenue.toFixed(2)],
      ['TVA collectee', taxCalculations.tvaCollected.toFixed(2)],
      ['Revenus nets', taxCalculations.netRevenue.toFixed(2)],
      ['Taux TVA', `${(taxCalculations.tvaRate * 100).toFixed(0)}%`],
      [], ['--- Soldes en attente ---'],
      ['0-30 jours', agingBuckets.current.amount.toFixed(2), `${agingBuckets.current.count} facture(s)`],
      ['31-60 jours', agingBuckets.days31_60.amount.toFixed(2), `${agingBuckets.days31_60.count} facture(s)`],
      ['61-90 jours', agingBuckets.days61_90.amount.toFixed(2), `${agingBuckets.days61_90.count} facture(s)`],
      ['90+ jours', agingBuckets.days90plus.amount.toFixed(2), `${agingBuckets.days90plus.count} facture(s)`],
      ['Total en souffrance', agingTotal.toFixed(2)],
      [], ['--- Rapprochement ---'],
      ['Rapproches', reconciliation.matched.count.toString(), reconciliation.matched.amount.toFixed(2)],
      ['Partiels', reconciliation.partial.count.toString(), reconciliation.partial.amount.toFixed(2)],
      ['Non rapproches', reconciliation.unmatched.count.toString(), reconciliation.unmatched.amount.toFixed(2)],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ...summaryRows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finances-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Export CSV', 'Le fichier CSV a ete telecharge avec succes');
  }, [invoices, getClientName, taxCalculations, agingBuckets, agingTotal, reconciliation, showSuccess]);

  const handleCreateInvoice = useCallback(async (data: {
    formData: InvoiceFormData;
    subtotal: number;
    taxAmount: number;
    total: number;
  }) => {
    if (!generatedInvoiceNumber) return;

    const invoiceData: Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at'> = {
      studio_id: STUDIO_ID,
      client_id: data.formData.client_id,
      invoice_number: generatedInvoiceNumber,
      status: 'draft',
      issue_date: data.formData.issue_date,
      due_date: data.formData.due_date,
      subtotal: data.subtotal,
      tax_amount: data.taxAmount,
      discount_amount: data.formData.discount_amount,
      total_amount: data.total,
      paid_amount: 0,
      notes: data.formData.notes || null,
      terms: data.formData.terms || null,
    };

    try {
      await createMutation.mutateAsync(invoiceData);
      showSuccess('Facture creee', 'La facture a ete creee avec succes');
      setIsCreateModalOpen(false);
    } catch {
      showError('Erreur', 'Impossible de creer la facture');
    }
  }, [generatedInvoiceNumber, createMutation, showSuccess, showError]);

  const handleStatusChange = useCallback(async (invoice: Invoice, newStatus: InvoiceStatus) => {
    try {
      switch (newStatus) {
        case 'sent':
          await markAsSentMutation.mutateAsync(invoice.id);
          showSuccess('Facture envoyee', `La facture ${invoice.invoice_number} a ete marquee comme envoyee`);
          break;
        case 'paid':
          await markAsPaidMutation.mutateAsync({ id: invoice.id });
          showSuccess('Facture payee', `La facture ${invoice.invoice_number} a ete marquee comme payee`);
          break;
        case 'overdue':
          await markAsOverdueMutation.mutateAsync(invoice.id);
          showSuccess('Facture en retard', `La facture ${invoice.invoice_number} a ete marquee comme en retard`);
          break;
        case 'cancelled':
          await cancelMutation.mutateAsync(invoice.id);
          showSuccess('Facture annulee', `La facture ${invoice.invoice_number} a ete annulee`);
          break;
        default:
          await updateStatusMutation.mutateAsync({ id: invoice.id, status: newStatus });
          showSuccess('Statut mis a jour', `Le statut de la facture a ete mis a jour`);
      }
    } catch {
      showError('Erreur', 'Impossible de mettre a jour le statut');
    }
  }, [markAsSentMutation, markAsPaidMutation, markAsOverdueMutation, cancelMutation, updateStatusMutation, showSuccess, showError]);

  const handleExportPDF = useCallback((invoice: Invoice) => {
    showSuccess('Export PDF', `Export de la facture ${invoice.invoice_number} en cours... (fonctionnalite a implementer)`);
  }, [showSuccess]);

  const openDetailModal = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  }, []);

  const openPaymentModal = useCallback((invoice: Invoice) => {
    setInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);
  }, []);

  const handleCreatePayment = useCallback(async (paymentFormData: PaymentFormData) => {
    if (!invoiceForPayment) return;

    const paymentData: Omit<PaymentInsert, 'id' | 'created_at'> = {
      studio_id: STUDIO_ID,
      invoice_id: invoiceForPayment.id,
      amount: paymentFormData.amount,
      method: paymentFormData.method,
      reference: paymentFormData.reference || null,
      notes: paymentFormData.notes || null,
    };

    try {
      await createPaymentMutation.mutateAsync(paymentData);

      const newPaidAmount = invoiceForPayment.paid_amount + paymentFormData.amount;
      if (newPaidAmount >= invoiceForPayment.total_amount) {
        await markAsPaidMutation.mutateAsync({ id: invoiceForPayment.id, paidAmount: newPaidAmount });
        showSuccess('Paiement enregistre', `La facture ${invoiceForPayment.invoice_number} a ete entierement payee`);
      } else {
        showSuccess('Paiement enregistre', `Paiement de ${fmtCurrency(paymentFormData.amount)} enregistre`);
      }

      setIsPaymentModalOpen(false);
      setInvoiceForPayment(null);
    } catch {
      showError('Erreur', 'Impossible d\'enregistrer le paiement');
    }
  }, [invoiceForPayment, createPaymentMutation, markAsPaidMutation, showSuccess, showError]);

  const handleDeleteInvoice = useCallback(async () => {
    if (!invoiceToDelete) return;

    try {
      await deleteMutation.mutateAsync(invoiceToDelete.id);
      showSuccess('Facture supprimee', `La facture ${invoiceToDelete.invoice_number} a ete supprimee`);
      setIsDeleteConfirmOpen(false);
      setInvoiceToDelete(null);
      setIsDetailModalOpen(false);
    } catch {
      showError('Erreur', 'Impossible de supprimer la facture');
    }
  }, [invoiceToDelete, deleteMutation, showSuccess, showError]);

  const openDeleteConfirm = useCallback((invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteConfirmOpen(true);
  }, []);

  const resetFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setInvoiceFilters({ status: 'all', searchQuery: '', dateFrom: null, dateTo: null });
  }, [setInvoiceFilters]);

  return (
    <div className={styles.page}>
      <Header
        title="Finance & BI"
        subtitle="Analysez vos performances financieres"
        actions={
          <div style={{ minWidth: 220 }}>
            <Select
              options={currencyOptions}
              value={displayCurrency}
              onChange={(value) => setDisplayCurrency(value as CurrencyCode)}
              size="sm"
              placeholder="Devise"
            />
          </div>
        }
      />

      <div className={styles.content}>
        <FinanceOverview kpis={kpis} stats={stats} formatCurrency={fmtCurrency} />

        <RevenueChart
          revenueData={revenueData}
          period={period}
          onPeriodChange={setPeriod}
          statusBreakdown={statusBreakdown}
          stats={stats}
          filterCounts={filterCounts}
        />

        <ExpenseBreakdown expenses={expenses} />

        <div className={styles.newSectionsGrid}>
          <AgingBuckets agingBuckets={agingBuckets} agingTotal={agingTotal} />
          <TaxSection taxCalculations={taxCalculations} />
        </div>

        <div className={styles.newSectionsGrid}>
          <RelancesSection
            relancesStats={relancesStats}
            autoReminder={autoReminder}
            onAutoReminderChange={setAutoReminder}
            reminderFrequency={reminderFrequency}
            onReminderFrequencyChange={setReminderFrequency}
          />
          <ReconciliationSection reconciliation={reconciliation} />
        </div>

        <InvoiceTable
          filteredInvoices={filteredInvoices}
          paginatedInvoices={paginatedInvoices}
          isLoading={isLoading}
          queryError={queryError}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          showFilters={showFilters}
          onShowFiltersChange={setShowFilters}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          filterCounts={filterCounts}
          getClientName={getClientName}
          onOpenDetail={openDetailModal}
          onOpenPayment={openPaymentModal}
          onStatusChange={handleStatusChange}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
          onOpenCreate={() => setIsCreateModalOpen(true)}
          onOpenDeleteConfirm={openDeleteConfirm}
          onResetFilters={resetFilters}
        />
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateInvoice}
          clients={clientOptions}
          isSubmitting={createMutation.isPending}
          generatedInvoiceNumber={generatedInvoiceNumber}
        />
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        invoice={selectedInvoice}
        getClientName={getClientName}
        onStatusChange={handleStatusChange}
        onExportPDF={handleExportPDF}
        onOpenPayment={openPaymentModal}
        onOpenDeleteConfirm={openDeleteConfirm}
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && invoiceForPayment && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setInvoiceForPayment(null);
          }}
          onSubmit={handleCreatePayment}
          invoice={invoiceForPayment}
          isSubmitting={createPaymentMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        invoice={invoiceToDelete}
        onConfirm={handleDeleteInvoice}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
