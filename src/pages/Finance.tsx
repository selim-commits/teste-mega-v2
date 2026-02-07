import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Clock,
  PieChart,
  Plus,
  Search,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Banknote,
  Trash2,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
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
import { formatCurrency, formatDate } from '../lib/utils';
import { DEMO_STUDIO_ID as STUDIO_ID } from '../stores/authStore';
import { CreateInvoiceModal } from './finance/CreateInvoiceModal';
import type { InvoiceFormData } from './finance/CreateInvoiceModal';
import { RecordPaymentModal } from './finance/RecordPaymentModal';
import type { PaymentFormData } from './finance/RecordPaymentModal';
import styles from './Finance.module.css';

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyee' },
  { value: 'paid', label: 'Payee' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulee' },
];

const revenueData = [
  { month: 'Jan', value: 32000 },
  { month: 'Fév', value: 28500 },
  { month: 'Mar', value: 41000 },
  { month: 'Avr', value: 38200 },
  { month: 'Mai', value: 45800 },
  { month: 'Juin', value: 48250 },
];

const expenses = [
  { category: 'Equipement', amount: 4500, percentage: 36 },
  { category: 'Loyer', amount: 3200, percentage: 26 },
  { category: 'Personnel', amount: 2800, percentage: 22 },
  { category: 'Marketing', amount: 1200, percentage: 10 },
  { category: 'Autres', amount: 780, percentage: 6 },
];

export function Finance() {
  // State
  const [period, setPeriod] = useState('month');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Form state is now managed inside extracted modal components

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
  void useOverdueInvoices(STUDIO_ID); // Data fetched for cache warming
  const { data: pendingInvoices = [] } = usePendingInvoices(STUDIO_ID);

  // Revenue calculations - current month
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

  // Payment queries - data available for future use in dashboard
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

  // Computed values
  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  // Calculate stats from invoices
  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const outstandingInvoices = invoices.filter((i) => ['sent', 'overdue'].includes(i.status));
    const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

    void paidInvoices; // Used for calculation reference
    const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);
    const averageValue = invoices.length > 0
      ? invoices.reduce((sum, i) => sum + i.total_amount, 0) / invoices.length
      : 0;

    // Calculate month-over-month change
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

  // Payment status breakdown
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

  // KPIs
  const kpis = [
    {
      title: 'Revenus du mois',
      value: stats.currentMonthRevenue,
      change: stats.monthChange,
      trend: stats.monthChange >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
      color: 'var(--accent-green)',
    },
    {
      title: 'Montant en attente',
      value: stats.outstandingAmount,
      change: 0,
      trend: 'up' as const,
      icon: Clock,
      color: 'var(--accent-yellow)',
    },
    {
      title: 'Factures en retard',
      value: stats.overdueCount,
      change: 0,
      trend: 'up' as const,
      icon: AlertTriangle,
      color: 'var(--accent-red)',
      isCount: true,
    },
    {
      title: 'Valeur moyenne',
      value: stats.averageValue,
      change: 0,
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'var(--accent-blue)',
    },
  ];

  // Filtered and paginated invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(query) ||
          invoice.notes?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [invoices, searchQuery]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  // Quick filter counts
  const filterCounts = useMemo(() => ({
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    cancelled: invoices.filter((i) => i.status === 'cancelled').length,
  }), [invoices]);

  // Handlers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm" dot>Payee</Badge>;
      case 'sent':
        return <Badge variant="info" size="sm" dot>Envoyee</Badge>;
      case 'draft':
        return <Badge variant="default" size="sm" dot>Brouillon</Badge>;
      case 'overdue':
        return <Badge variant="error" size="sm" dot>En retard</Badge>;
      case 'cancelled':
        return <Badge variant="warning" size="sm" dot>Annulee</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getClientName = (clientId: string): string => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || 'Client inconnu';
  };

  // Invoice creation handler (called by CreateInvoiceModal)
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
    // Placeholder for PDF export
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

  // Payment creation handler (called by RecordPaymentModal)
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

      // Check if invoice is fully paid and update status
      const newPaidAmount = invoiceForPayment.paid_amount + paymentFormData.amount;
      if (newPaidAmount >= invoiceForPayment.total_amount) {
        await markAsPaidMutation.mutateAsync({ id: invoiceForPayment.id, paidAmount: newPaidAmount });
        showSuccess('Paiement enregistre', `La facture ${invoiceForPayment.invoice_number} a ete entierement payee`);
      } else {
        showSuccess('Paiement enregistre', `Paiement de ${formatCurrency(paymentFormData.amount)} enregistre`);
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

  // Table columns
  const tableColumns = [
    {
      key: 'invoice_number',
      header: 'Facture',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceId}>{invoice.invoice_number}</span>
      ),
    },
    {
      key: 'client_id',
      header: 'Client',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceClient}>{getClientName(invoice.client_id)}</span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Montant',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceAmount}>{formatCurrency(invoice.total_amount)}</span>
      ),
    },
    {
      key: 'issue_date',
      header: 'Date',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceDate}>{formatDate(invoice.issue_date)}</span>
      ),
    },
    {
      key: 'due_date',
      header: 'Echeance',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceDue}>{formatDate(invoice.due_date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (invoice: Invoice) => getStatusBadge(invoice.status),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (invoice: Invoice) => (
        <Dropdown
          trigger={
            <button className={styles.invoiceMenu} aria-label="Plus d'options">
              <MoreVertical size={16} />
            </button>
          }
          align="end"
        >
          <DropdownItem icon={<Eye size={16} />} onClick={() => openDetailModal(invoice)}>
            Voir details
          </DropdownItem>
          <DropdownItem icon={<Download size={16} />} onClick={() => handleExportPDF(invoice)}>
            Exporter PDF
          </DropdownItem>
          <DropdownDivider />
          {['sent', 'overdue'].includes(invoice.status) && invoice.paid_amount < invoice.total_amount && (
            <DropdownItem icon={<Banknote size={16} />} onClick={() => openPaymentModal(invoice)}>
              Enregistrer paiement
            </DropdownItem>
          )}
          {invoice.status === 'draft' && (
            <DropdownItem icon={<Send size={16} />} onClick={() => handleStatusChange(invoice, 'sent')}>
              Marquer comme envoyee
            </DropdownItem>
          )}
          {['draft', 'sent', 'overdue'].includes(invoice.status) && (
            <DropdownItem icon={<CheckCircle size={16} />} onClick={() => handleStatusChange(invoice, 'paid')}>
              Marquer comme payee
            </DropdownItem>
          )}
          {invoice.status === 'sent' && (
            <DropdownItem icon={<AlertTriangle size={16} />} onClick={() => handleStatusChange(invoice, 'overdue')}>
              Marquer en retard
            </DropdownItem>
          )}
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <>
              <DropdownDivider />
              <DropdownItem icon={<XCircle size={16} />} destructive onClick={() => handleStatusChange(invoice, 'cancelled')}>
                Annuler
              </DropdownItem>
            </>
          )}
          {invoice.status === 'draft' && (
            <>
              <DropdownDivider />
              <DropdownItem icon={<Trash2 size={16} />} destructive onClick={() => openDeleteConfirm(invoice)}>
                Supprimer
              </DropdownItem>
            </>
          )}
        </Dropdown>
      ),
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

  return (
    <div className={styles.page}>
      <Header
        title="Finance & BI"
        subtitle="Analysez vos performances financieres"
      />

      <div className={styles.content}>
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="lg" hoverable className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>{kpi.title}</span>
                  <div className={styles.kpiIcon} style={{ backgroundColor: `${kpi.color}15` }}>
                    <kpi.icon size={20} color={kpi.color} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  {kpi.isCount ? kpi.value : formatCurrency(kpi.value)}
                </div>
                {kpi.change !== 0 && (
                  <div className={styles.kpiChange}>
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight size={14} className={styles.kpiUp} />
                    ) : (
                      <ArrowDownRight size={14} className={styles.kpiDown} />
                    )}
                    <span className={kpi.trend === 'up' ? styles.kpiUp : styles.kpiDown}>
                      {Math.abs(kpi.change).toFixed(1)}%
                    </span>
                    <span className={styles.kpiPeriod}>vs mois dernier</span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue Overview Section */}
        <div className={styles.revenueOverview}>
          <Card padding="lg">
            <CardHeader
              title="Apercu des revenus"
              subtitle="Performance financiere"
            />
            <CardContent>
              <div className={styles.revenueStats}>
                <div className={styles.revenueStat}>
                  <span className={styles.revenueLabel}>Mois en cours</span>
                  <span className={styles.revenueValue}>{formatCurrency(stats.currentMonthRevenue)}</span>
                </div>
                <div className={styles.revenueStat}>
                  <span className={styles.revenueLabel}>Mois precedent</span>
                  <span className={styles.revenueValue}>{formatCurrency(stats.prevMonthRevenue)}</span>
                </div>
                <div className={styles.revenueStat}>
                  <span className={styles.revenueLabel}>Cumul annuel (YTD)</span>
                  <span className={styles.revenueValue}>{formatCurrency(stats.ytdRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Revenue Chart */}
          <motion.div
            className={styles.chartSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg" className={styles.chartCard}>
              <CardHeader
                title="Revenus"
                subtitle="Evolution mensuelle"
                action={
                  <div className={styles.periodToggle}>
                    {['week', 'month', 'year'].map((p) => (
                      <button
                        key={p}
                        className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                        onClick={() => setPeriod(p)}
                      >
                        {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Annee'}
                      </button>
                    ))}
                  </div>
                }
              />
              <CardContent>
                <div className={styles.chart}>
                  <div className={styles.chartBars}>
                    {revenueData.map((data, index) => (
                      <div key={data.month} className={styles.chartBar}>
                        <motion.div
                          className={styles.barFill}
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.value / maxRevenue) * 100}%` }}
                          transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                        />
                        <span className={styles.barLabel}>{data.month}</span>
                        <span className={styles.barValue}>{formatCurrency(data.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Status Breakdown */}
          <motion.div
            className={styles.expenseSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card padding="lg" className={styles.expenseCard}>
              <CardHeader
                title="Statut des paiements"
                subtitle="Repartition"
                action={
                  <div className={styles.expenseIcon}>
                    <PieChart size={18} />
                  </div>
                }
              />
              <CardContent>
                <div className={styles.statusBreakdown}>
                  <div className={styles.statusItem}>
                    <div className={styles.statusInfo}>
                      <CheckCircle size={16} color="var(--accent-green)" />
                      <span className={styles.statusLabel}>Payees</span>
                      <span className={styles.statusCount}>{statusBreakdown.paid}</span>
                    </div>
                    <div className={styles.statusBar}>
                      <motion.div
                        className={styles.statusBarFill}
                        style={{ backgroundColor: 'var(--accent-green)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${statusBreakdown.paidPercent}%` }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                      />
                    </div>
                    <span className={styles.statusPercent}>{statusBreakdown.paidPercent}%</span>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusInfo}>
                      <Clock size={16} color="var(--accent-yellow)" />
                      <span className={styles.statusLabel}>En attente</span>
                      <span className={styles.statusCount}>{statusBreakdown.pending}</span>
                    </div>
                    <div className={styles.statusBar}>
                      <motion.div
                        className={styles.statusBarFill}
                        style={{ backgroundColor: 'var(--accent-yellow)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${statusBreakdown.pendingPercent}%` }}
                        transition={{ delay: 0.45, duration: 0.5 }}
                      />
                    </div>
                    <span className={styles.statusPercent}>{statusBreakdown.pendingPercent}%</span>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusInfo}>
                      <AlertTriangle size={16} color="var(--accent-red)" />
                      <span className={styles.statusLabel}>En retard</span>
                      <span className={styles.statusCount}>{statusBreakdown.overdue}</span>
                    </div>
                    <div className={styles.statusBar}>
                      <motion.div
                        className={styles.statusBarFill}
                        style={{ backgroundColor: 'var(--accent-red)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${statusBreakdown.overduePercent}%` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      />
                    </div>
                    <span className={styles.statusPercent}>{statusBreakdown.overduePercent}%</span>
                  </div>
                </div>

                {/* Outstanding Summary */}
                <div className={styles.outstandingSummary}>
                  <div className={styles.outstandingRow}>
                    <span>Factures en attente</span>
                    <span>{filterCounts.sent}</span>
                  </div>
                  <div className={styles.outstandingRow}>
                    <span>Montant total en attente</span>
                    <span>{formatCurrency(stats.outstandingAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Expenses Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card padding="lg">
            <CardHeader
              title="Repartition des depenses"
              subtitle="Ce mois"
              action={
                <div className={styles.expenseIcon}>
                  <CreditCard size={18} />
                </div>
              }
            />
            <CardContent>
              <div className={styles.expenseList}>
                {expenses.map((expense, index) => (
                  <div key={expense.category} className={styles.expenseItem}>
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseCategory}>{expense.category}</span>
                      <span className={styles.expenseAmount}>{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className={styles.expenseBar}>
                      <motion.div
                        className={styles.expenseBarFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${expense.percentage}%` }}
                        transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                      />
                    </div>
                    <span className={styles.expensePercentage}>{expense.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invoices Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card padding="none" className={styles.invoicesCard}>
            <div className={styles.invoicesHeader}>
              <div>
                <h3 className={styles.invoicesTitle}>Gestion des factures</h3>
                <p className={styles.invoicesSubtitle}>Gerez vos factures et paiements</p>
              </div>
              <div className={styles.invoicesActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Filter size={16} />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filtres
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={() => showSuccess('Export', 'Fonctionnalite d\'export a implementer')}
                >
                  Exporter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Nouvelle facture
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className={styles.filtersPanel}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.filterRow}>
                    <div className={styles.searchBox}>
                      <Search size={18} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Rechercher par numero ou notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                    <Select
                      options={statusOptions}
                      value={statusFilter}
                      onChange={(value) => {
                        setStatusFilter(value as InvoiceStatus | 'all');
                        setCurrentPage(1);
                      }}
                      placeholder="Statut"
                    />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="Date debut"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="Date fin"
                    />
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reinitialiser
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Filters */}
            <div className={styles.quickFilters}>
              {[
                { id: 'all', name: 'Tous', count: filterCounts.all },
                { id: 'draft', name: 'Brouillons', count: filterCounts.draft },
                { id: 'sent', name: 'Envoyees', count: filterCounts.sent },
                { id: 'paid', name: 'Payees', count: filterCounts.paid },
                { id: 'overdue', name: 'En retard', count: filterCounts.overdue },
              ].map((filter) => (
                <button
                  key={filter.id}
                  className={`${styles.quickFilterBtn} ${statusFilter === filter.id ? styles.active : ''}`}
                  onClick={() => {
                    setStatusFilter(filter.id as InvoiceStatus | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <span>{filter.name}</span>
                  <span className={styles.filterCount}>{filter.count}</span>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <span>Chargement des factures...</span>
              </div>
            )}

            {/* Error State */}
            {queryError && (
              <div className={styles.errorState}>
                <span>Erreur lors du chargement des factures</span>
                <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                  Reessayer
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !queryError && filteredInvoices.length === 0 && (
              <div className={styles.emptyState}>
                <FileText size={48} />
                <h3>Aucune facture trouvee</h3>
                <p>
                  {searchQuery || statusFilter !== 'all' || dateFrom || dateTo
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par creer votre premiere facture'}
                </p>
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Creer une facture
                </Button>
              </div>
            )}

            {/* Invoices Table */}
            {!isLoading && !queryError && filteredInvoices.length > 0 && (
              <>
                <Table
                  data={paginatedInvoices}
                  columns={tableColumns}
                  onRowClick={openDetailModal}
                  isLoading={isLoading}
                  emptyMessage="Aucune facture trouvee"
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </motion.div>
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
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} size="lg">
        {selectedInvoice && (
          <>
            <ModalHeader
              title={`Facture ${selectedInvoice.invoice_number}`}
              subtitle={getClientName(selectedInvoice.client_id)}
              onClose={() => setIsDetailModalOpen(false)}
            />
            <ModalBody>
              <div className={styles.invoiceDetail}>
                {/* Status Banner */}
                <div className={styles.detailStatus}>
                  {getStatusBadge(selectedInvoice.status)}
                  <span className={styles.detailStatusText}>
                    {selectedInvoice.status === 'paid' && 'Cette facture a ete payee'}
                    {selectedInvoice.status === 'sent' && 'En attente de paiement'}
                    {selectedInvoice.status === 'draft' && 'Brouillon - non envoyee'}
                    {selectedInvoice.status === 'overdue' && 'Paiement en retard'}
                    {selectedInvoice.status === 'cancelled' && 'Facture annulee'}
                  </span>
                </div>

                {/* Invoice Info */}
                <div className={styles.detailSection}>
                  <h4>Informations</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Client</span>
                      <span className={styles.detailValue}>{getClientName(selectedInvoice.client_id)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Date d'emission</span>
                      <span className={styles.detailValue}>{formatDate(selectedInvoice.issue_date)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Date d'echeance</span>
                      <span className={styles.detailValue}>{formatDate(selectedInvoice.due_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Amounts */}
                <div className={styles.detailSection}>
                  <h4>Montants</h4>
                  <div className={styles.detailAmounts}>
                    <div className={styles.amountRow}>
                      <span>Sous-total</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    {selectedInvoice.discount_amount > 0 && (
                      <div className={styles.amountRow}>
                        <span>Remise</span>
                        <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                      </div>
                    )}
                    <div className={styles.amountRow}>
                      <span>TVA</span>
                      <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                    </div>
                    <div className={`${styles.amountRow} ${styles.totalAmount}`}>
                      <span>Total TTC</span>
                      <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                    {selectedInvoice.paid_amount > 0 && (
                      <>
                        <div className={styles.amountRow}>
                          <span>Paye</span>
                          <span className={styles.paidAmount}>{formatCurrency(selectedInvoice.paid_amount)}</span>
                        </div>
                        <div className={`${styles.amountRow} ${styles.dueAmount}`}>
                          <span>Reste du</span>
                          <span>{formatCurrency(selectedInvoice.total_amount - selectedInvoice.paid_amount)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className={styles.detailSection}>
                    <h4>Notes</h4>
                    <p className={styles.detailNotes}>{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Terms */}
                {selectedInvoice.terms && (
                  <div className={styles.detailSection}>
                    <h4>Conditions</h4>
                    <p className={styles.detailNotes}>{selectedInvoice.terms}</p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <div className={styles.detailActions}>
                <div className={styles.detailActionGroup}>
                  <Button
                    variant="secondary"
                    icon={<Download size={16} />}
                    onClick={() => handleExportPDF(selectedInvoice)}
                  >
                    Exporter PDF
                  </Button>
                  {selectedInvoice.status === 'draft' && (
                    <Button
                      variant="ghost"
                      icon={<Trash2 size={16} />}
                      onClick={() => openDeleteConfirm(selectedInvoice)}
                      className={styles.cancelBtn}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <div className={styles.detailActionGroup}>
                  {['sent', 'overdue'].includes(selectedInvoice.status) && selectedInvoice.paid_amount < selectedInvoice.total_amount && (
                    <Button
                      variant="secondary"
                      icon={<Banknote size={16} />}
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        openPaymentModal(selectedInvoice);
                      }}
                    >
                      Enregistrer paiement
                    </Button>
                  )}
                  {selectedInvoice.status === 'draft' && (
                    <Button
                      variant="primary"
                      icon={<Send size={16} />}
                      onClick={() => {
                        handleStatusChange(selectedInvoice, 'sent');
                        setIsDetailModalOpen(false);
                      }}
                    >
                      Envoyer
                    </Button>
                  )}
                  {['draft', 'sent', 'overdue'].includes(selectedInvoice.status) && (
                    <Button
                      variant="primary"
                      icon={<CheckCircle size={16} />}
                      onClick={() => {
                        handleStatusChange(selectedInvoice, 'paid');
                        setIsDetailModalOpen(false);
                      }}
                    >
                      Marquer payee
                    </Button>
                  )}
                  {selectedInvoice.status === 'sent' && (
                    <Button
                      variant="secondary"
                      icon={<AlertTriangle size={16} />}
                      onClick={() => {
                        handleStatusChange(selectedInvoice, 'overdue');
                        setIsDetailModalOpen(false);
                      }}
                    >
                      Marquer en retard
                    </Button>
                  )}
                  {selectedInvoice.status !== 'cancelled' && selectedInvoice.status !== 'paid' && (
                    <Button
                      variant="ghost"
                      icon={<XCircle size={16} />}
                      onClick={() => {
                        handleStatusChange(selectedInvoice, 'cancelled');
                        setIsDetailModalOpen(false);
                      }}
                      className={styles.cancelBtn}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            </ModalFooter>
          </>
        )}
      </Modal>

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
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} size="sm">
        <ModalHeader
          title="Confirmer la suppression"
          onClose={() => setIsDeleteConfirmOpen(false)}
        />
        <ModalBody>
          <div className={styles.deleteConfirm}>
            <AlertTriangle size={48} className={styles.deleteWarningIcon} />
            <p>
              Etes-vous sur de vouloir supprimer la facture{' '}
              <strong>{invoiceToDelete?.invoice_number}</strong> ?
            </p>
            <p className={styles.deleteWarningText}>
              Cette action est irreversible.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteInvoice}
            loading={deleteMutation.isPending}
            className={styles.deleteBtn}
          >
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
