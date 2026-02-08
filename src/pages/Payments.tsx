import { useState, useCallback, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Settings,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import styles from './Payments.module.css';

// ===== Types =====
type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded';
type PaymentMethodId = 'stripe' | 'paypal' | 'virement' | 'especes' | 'cheque';
type SortField = 'date' | 'amount';
type SortDirection = 'asc' | 'desc';

interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  icon: string;
  fees: string;
}

interface PaymentMethodSettings {
  apiKey: string;
  webhookUrl: string;
  testMode: boolean;
}

interface Transaction {
  id: string;
  date: string;
  client: string;
  amount: number;
  method: PaymentMethodId;
  status: TransactionStatus;
  reference: string;
}

interface PaymentSettingsData {
  currency: string;
  taxRate: number;
  autoInvoice: boolean;
  paymentReminder: boolean;
  depositPercentage: number;
  connectedMethods: Record<PaymentMethodId, boolean>;
  methodSettings: Record<PaymentMethodId, PaymentMethodSettings>;
}

interface RefundData {
  transaction: Transaction | null;
  amount: string;
  reason: string;
  step: 'form' | 'confirm';
}

// ===== Constants =====
const STORAGE_KEY = 'rooom-payments';

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Cartes bancaires, Apple Pay, Google Pay',
    icon: '\uD83D\uDCB3',
    fees: '1,4% + 0,25\u00A0\u20AC',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Paiements PayPal et Checkout',
    icon: '\uD83C\uDD7F\uFE0F',
    fees: '2,9% + 0,35\u00A0\u20AC',
  },
  {
    id: 'virement',
    name: 'Virement bancaire',
    description: 'SEPA et virements IBAN',
    icon: '\uD83C\uDFE6',
    fees: 'Gratuit',
  },
  {
    id: 'especes',
    name: 'Esp\u00E8ces',
    description: 'Paiement en main propre',
    icon: '\uD83D\uDCB5',
    fees: 'Gratuit',
  },
  {
    id: 'cheque',
    name: 'Ch\u00E8que',
    description: 'Ch\u00E8que bancaire',
    icon: '\uD83D\uDCDD',
    fees: 'Gratuit',
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', date: '2026-02-08', client: 'Jean Dupont', amount: 350, method: 'stripe', status: 'completed', reference: 'REF-2026-001' },
  { id: 'tx-002', date: '2026-02-07', client: 'Marie Martin', amount: 180, method: 'paypal', status: 'completed', reference: 'REF-2026-002' },
  { id: 'tx-003', date: '2026-02-07', client: 'Pierre Durand', amount: 520, method: 'stripe', status: 'pending', reference: 'REF-2026-003' },
  { id: 'tx-004', date: '2026-02-06', client: 'Sophie Bernard', amount: 95, method: 'especes', status: 'completed', reference: 'REF-2026-004' },
  { id: 'tx-005', date: '2026-02-06', client: 'Lucas Moreau', amount: 275, method: 'virement', status: 'failed', reference: 'REF-2026-005' },
  { id: 'tx-006', date: '2026-02-05', client: '\u00C9milie Petit', amount: 420, method: 'stripe', status: 'completed', reference: 'REF-2026-006' },
  { id: 'tx-007', date: '2026-02-05', client: 'Thomas Robert', amount: 150, method: 'cheque', status: 'refunded', reference: 'REF-2026-007' },
  { id: 'tx-008', date: '2026-02-04', client: 'Camille Lefebvre', amount: 680, method: 'stripe', status: 'completed', reference: 'REF-2026-008' },
  { id: 'tx-009', date: '2026-02-04', client: 'Antoine Roux', amount: 200, method: 'paypal', status: 'pending', reference: 'REF-2026-009' },
  { id: 'tx-010', date: '2026-02-03', client: 'Julie Fournier', amount: 310, method: 'virement', status: 'completed', reference: 'REF-2026-010' },
  { id: 'tx-011', date: '2026-02-03', client: 'Nicolas Garcia', amount: 75, method: 'especes', status: 'completed', reference: 'REF-2026-011' },
  { id: 'tx-012', date: '2026-02-02', client: 'Laura Morel', amount: 450, method: 'stripe', status: 'failed', reference: 'REF-2026-012' },
  { id: 'tx-013', date: '2026-02-02', client: 'Maxime Girard', amount: 160, method: 'paypal', status: 'completed', reference: 'REF-2026-013' },
  { id: 'tx-014', date: '2026-02-01', client: 'Chlo\u00E9 Simon', amount: 890, method: 'stripe', status: 'completed', reference: 'REF-2026-014' },
  { id: 'tx-015', date: '2026-02-01', client: 'Hugo Laurent', amount: 220, method: 'virement', status: 'completed', reference: 'REF-2026-015' },
  { id: 'tx-016', date: '2026-01-31', client: 'Manon Leroy', amount: 185, method: 'cheque', status: 'pending', reference: 'REF-2026-016' },
  { id: 'tx-017', date: '2026-01-30', client: 'Alexandre Blanc', amount: 340, method: 'stripe', status: 'refunded', reference: 'REF-2026-017' },
  { id: 'tx-018', date: '2026-01-29', client: 'In\u00E8s Faure', amount: 560, method: 'paypal', status: 'completed', reference: 'REF-2026-018' },
];

const DEFAULT_SETTINGS: PaymentSettingsData = {
  currency: 'EUR',
  taxRate: 20,
  autoInvoice: true,
  paymentReminder: true,
  depositPercentage: 30,
  connectedMethods: {
    stripe: true,
    paypal: false,
    virement: true,
    especes: true,
    cheque: false,
  },
  methodSettings: {
    stripe: { apiKey: 'sk_live_****************************1234', webhookUrl: 'https://rooom.app/api/webhooks/stripe', testMode: false },
    paypal: { apiKey: '', webhookUrl: '', testMode: true },
    virement: { apiKey: '', webhookUrl: '', testMode: false },
    especes: { apiKey: '', webhookUrl: '', testMode: false },
    cheque: { apiKey: '', webhookUrl: '', testMode: false },
  },
};

// ===== Helpers =====
function loadSettings(): PaymentSettingsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: PaymentSettingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable
  }
}

function loadTransactions(): Transaction[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-transactions`);
    if (stored) {
      return JSON.parse(stored) as Transaction[];
    }
  } catch {
    // localStorage unavailable
  }
  return MOCK_TRANSACTIONS;
}

function saveTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}-transactions`, JSON.stringify(txs));
  } catch {
    // localStorage unavailable
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getMethodName(methodId: PaymentMethodId): string {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  return method?.name ?? methodId;
}

function getMethodIcon(methodId: PaymentMethodId): string {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  return method?.icon ?? '\uD83D\uDCB3';
}

function getStatusBadge(status: TransactionStatus) {
  switch (status) {
    case 'completed':
      return <Badge variant="success" size="sm" dot>Compl\u00E9t\u00E9</Badge>;
    case 'pending':
      return <Badge variant="warning" size="sm" dot>En attente</Badge>;
    case 'failed':
      return <Badge variant="error" size="sm" dot>\u00C9chou\u00E9</Badge>;
    case 'refunded':
      return <Badge variant="info" size="sm" dot>Rembours\u00E9</Badge>;
  }
}

function exportTransactionsCSV(transactions: Transaction[]): void {
  const headers = ['Date', 'Client', 'Montant', 'M\u00E9thode', 'Statut', 'R\u00E9f\u00E9rence'];
  const statusLabels: Record<TransactionStatus, string> = {
    completed: 'Compl\u00E9t\u00E9',
    pending: 'En attente',
    failed: '\u00C9chou\u00E9',
    refunded: 'Rembours\u00E9',
  };

  const rows = transactions.map((tx) => [
    tx.date,
    tx.client,
    tx.amount.toString().replace('.', ','),
    getMethodName(tx.method),
    statusLabels[tx.status],
    tx.reference,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(';'))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== Component =====
export function Payments() {
  const { success, error: notifyError } = useNotifications();

  // Settings state
  const [settings, setSettings] = useState<PaymentSettingsData>(loadSettings);
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethodId | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals
  const [settingsModalMethod, setSettingsModalMethod] = useState<PaymentMethodId | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [editMethodSettings, setEditMethodSettings] = useState<PaymentMethodSettings | null>(null);
  const [refundData, setRefundData] = useState<RefundData>({
    transaction: null,
    amount: '',
    reason: '',
    step: 'form',
  });

  // ===== Computed stats =====
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTxs = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const totalRevenue = monthTxs
      .filter((tx) => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalTransactions = monthTxs.length;

    const successRate = totalTransactions > 0
      ? Math.round((monthTxs.filter((tx) => tx.status === 'completed').length / totalTransactions) * 100)
      : 0;

    const refundTotal = monthTxs
      .filter((tx) => tx.status === 'refunded')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { totalRevenue, totalTransactions, successRate, refundTotal };
  }, [transactions]);

  // ===== Filtered & sorted transactions =====
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((tx) => tx.client.toLowerCase().includes(query));
    }

    if (statusFilter !== 'all') {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    if (methodFilter !== 'all') {
      result = result.filter((tx) => tx.method === methodFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, debouncedSearch, statusFilter, methodFilter, sortField, sortDirection]);

  // ===== Handlers =====
  const updateSettings = useCallback((patch: Partial<PaymentSettingsData>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleMethodConnection = useCallback((methodId: PaymentMethodId) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        connectedMethods: {
          ...prev.connectedMethods,
          [methodId]: !prev.connectedMethods[methodId],
        },
      };
      saveSettings(next);
      if (next.connectedMethods[methodId]) {
        success('M\u00E9thode connect\u00E9e', `${getMethodName(methodId)} est maintenant actif.`);
      } else {
        success('M\u00E9thode d\u00E9connect\u00E9e', `${getMethodName(methodId)} a \u00E9t\u00E9 d\u00E9sactiv\u00E9.`);
      }
      return next;
    });
  }, [success]);

  const openMethodSettings = useCallback((methodId: PaymentMethodId) => {
    setSettingsModalMethod(methodId);
    setEditMethodSettings({ ...settings.methodSettings[methodId] });
    setShowApiKey(false);
  }, [settings.methodSettings]);

  const saveMethodSettings = useCallback(() => {
    if (!settingsModalMethod || !editMethodSettings) return;
    setSettings((prev) => {
      const next = {
        ...prev,
        methodSettings: {
          ...prev.methodSettings,
          [settingsModalMethod]: editMethodSettings,
        },
      };
      saveSettings(next);
      return next;
    });
    success('Param\u00E8tres sauvegard\u00E9s', `Les param\u00E8tres de ${getMethodName(settingsModalMethod)} ont \u00E9t\u00E9 mis \u00E0 jour.`);
    setSettingsModalMethod(null);
    setEditMethodSettings(null);
  }, [settingsModalMethod, editMethodSettings, success]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  const openRefundModal = useCallback((tx: Transaction) => {
    setRefundData({
      transaction: tx,
      amount: tx.amount.toString(),
      reason: '',
      step: 'form',
    });
  }, []);

  const processRefund = useCallback(() => {
    if (!refundData.transaction) return;
    const refundAmount = parseFloat(refundData.amount);
    if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > refundData.transaction.amount) {
      notifyError('Montant invalide', 'Le montant du remboursement doit \u00EAtre compris entre 0 et le montant de la transaction.');
      return;
    }

    setTransactions((prev) => {
      const next = prev.map((tx) =>
        tx.id === refundData.transaction!.id
          ? { ...tx, status: 'refunded' as TransactionStatus }
          : tx
      );
      saveTransactions(next);
      return next;
    });

    success(
      'Remboursement effectu\u00E9',
      `${formatCurrency(refundAmount)} rembours\u00E9 \u00E0 ${refundData.transaction.client}.`
    );
    setRefundData({ transaction: null, amount: '', reason: '', step: 'form' });
  }, [refundData, success, notifyError]);

  const handleExportCSV = useCallback(() => {
    exportTransactionsCSV(filteredTransactions);
    success('Export r\u00E9ussi', `${filteredTransactions.length} transactions export\u00E9es en CSV.`);
  }, [filteredTransactions, success]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className={styles.sortIcon} />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp size={12} className={`${styles.sortIcon} ${styles.sortIconActive}`} />
      : <ArrowDown size={12} className={`${styles.sortIcon} ${styles.sortIconActive}`} />;
  };

  return (
    <div className={styles.page}>
      <Header
        title="Paiements"
        subtitle="G\u00E9rez vos m\u00E9thodes de paiement et suivez vos transactions"
      />

      <div className={styles.content}>
        {/* ===== Stats ===== */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)', color: 'var(--state-success)' }}>
                <DollarSign size={20} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</span>
                <span className={styles.statLabel}>Revenu total du mois</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)', color: 'var(--state-info)' }}>
                <CreditCard size={20} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.totalTransactions}</span>
                <span className={styles.statLabel}>Transactions ce mois</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-lighter)', color: 'var(--accent-primary)' }}>
                <TrendingUp size={20} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.successRate}\u00A0%</span>
                <span className={styles.statLabel}>Taux de r\u00E9ussite</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-error-bg)', color: 'var(--state-error)' }}>
                <RotateCcw size={20} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{formatCurrency(stats.refundTotal)}</span>
                <span className={styles.statLabel}>Remboursements</span>
              </div>
            </Card>
          </div>
        </div>

        {/* ===== Payment Methods ===== */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>M\u00E9thodes de paiement</h3>
          </div>
          <div className={styles.methodsGrid}>
            {PAYMENT_METHODS.map((method) => {
              const isConnected = settings.connectedMethods[method.id];
              return (
                <div
                  key={method.id}
                  className={`${styles.methodCard} ${isConnected ? styles.methodCardConnected : ''}`}
                >
                  <div className={styles.methodTop}>
                    <div className={styles.methodInfo}>
                      <div className={styles.methodIcon}>{method.icon}</div>
                      <div className={styles.methodDetails}>
                        <span className={styles.methodName}>{method.name}</span>
                        <span className={styles.methodDesc}>{method.description}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.methodFees}>Frais : {method.fees}</div>
                  <div className={styles.methodActions}>
                    <Switch
                      checked={isConnected}
                      onChange={() => toggleMethodConnection(method.id)}
                      size="sm"
                    />
                    {isConnected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Settings size={14} />}
                        onClick={() => openMethodSettings(method.id)}
                      >
                        Param\u00E8tres
                      </Button>
                    )}
                    {!isConnected && (
                      <Badge variant="default" size="sm">D\u00E9connect\u00E9</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ===== Transactions ===== */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Historique des transactions</h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={16} />}
              onClick={handleExportCSV}
            >
              Exporter CSV
            </Button>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Compl\u00E9t\u00E9</option>
                <option value="pending">En attente</option>
                <option value="failed">\u00C9chou\u00E9</option>
                <option value="refunded">Rembours\u00E9</option>
              </select>
              <select
                className={styles.filterSelect}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as PaymentMethodId | 'all')}
              >
                <option value="all">Toutes les m\u00E9thodes</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {filteredTransactions.length === 0 ? (
              <div className={styles.emptyState}>
                <FileText size={40} />
                <h3 className={styles.emptyTitle}>Aucune transaction trouv\u00E9e</h3>
                <p className={styles.emptyDesc}>
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('date')}>
                      <span className={styles.thSortable}>
                        Date {getSortIcon('date')}
                      </span>
                    </th>
                    <th>Client</th>
                    <th onClick={() => handleSort('amount')}>
                      <span className={styles.thSortable}>
                        Montant {getSortIcon('amount')}
                      </span>
                    </th>
                    <th>M\u00E9thode</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.date)}</td>
                      <td>{tx.client}</td>
                      <td className={styles.amountCell}>{formatCurrency(tx.amount)}</td>
                      <td>
                        <span className={styles.methodCell}>
                          <span className={styles.methodCellIcon}>{getMethodIcon(tx.method)}</span>
                          {getMethodName(tx.method)}
                        </span>
                      </td>
                      <td>{getStatusBadge(tx.status)}</td>
                      <td>
                        <div className={styles.actionsCell}>
                          {tx.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<RotateCcw size={14} />}
                              onClick={() => openRefundModal(tx)}
                            >
                              Rembourser
                            </Button>
                          )}
                          {tx.status === 'refunded' && (
                            <Badge variant="info" size="sm">Rembours\u00E9</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* ===== Payment Settings ===== */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Param\u00E8tres de paiement</h3>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.settingsItem}>
              <div className={styles.settingsItemInfo}>
                <span className={styles.settingsItemTitle}>Devise</span>
                <span className={styles.settingsItemDesc}>Devise utilis\u00E9e pour les transactions et les factures</span>
              </div>
              <div className={styles.settingsItemControl}>
                <select
                  className={styles.settingsSelect}
                  value={settings.currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                >
                  <option value="EUR">EUR (\u20AC)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (\u00A3)</option>
                  <option value="CHF">CHF (CHF)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            <div className={styles.settingsItem}>
              <div className={styles.settingsItemInfo}>
                <span className={styles.settingsItemTitle}>Taux de TVA</span>
                <span className={styles.settingsItemDesc}>Taux de taxe appliqu\u00E9 sur les factures</span>
              </div>
              <div className={styles.settingsItemControl}>
                <input
                  type="number"
                  className={styles.settingsInput}
                  value={settings.taxRate}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) || 0 })}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>

            <div className={styles.settingsItem}>
              <div className={styles.settingsItemInfo}>
                <span className={styles.settingsItemTitle}>Facturation automatique</span>
                <span className={styles.settingsItemDesc}>G\u00E9n\u00E9rer une facture automatiquement apr\u00E8s chaque paiement</span>
              </div>
              <div className={styles.settingsItemControl}>
                <Switch
                  checked={settings.autoInvoice}
                  onChange={(e) => updateSettings({ autoInvoice: e.target.checked })}
                />
              </div>
            </div>

            <div className={styles.settingsItem}>
              <div className={styles.settingsItemInfo}>
                <span className={styles.settingsItemTitle}>Relance automatique</span>
                <span className={styles.settingsItemDesc}>Envoyer un rappel de paiement aux clients en retard</span>
              </div>
              <div className={styles.settingsItemControl}>
                <Switch
                  checked={settings.paymentReminder}
                  onChange={(e) => updateSettings({ paymentReminder: e.target.checked })}
                />
              </div>
            </div>

            <div className={styles.settingsItem}>
              <div className={styles.settingsItemInfo}>
                <span className={styles.settingsItemTitle}>Acompte pour les r\u00E9servations</span>
                <span className={styles.settingsItemDesc}>Pourcentage d\u2019acompte demand\u00E9 lors de la r\u00E9servation</span>
              </div>
              <div className={styles.settingsItemControl}>
                <input
                  type="number"
                  className={styles.settingsInput}
                  value={settings.depositPercentage}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(e) => updateSettings({ depositPercentage: parseFloat(e.target.value) || 0 })}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== Method Settings Modal ===== */}
      <Modal
        isOpen={settingsModalMethod !== null}
        onClose={() => { setSettingsModalMethod(null); setEditMethodSettings(null); }}
        size="md"
      >
        <ModalHeader
          title={`Param\u00E8tres ${settingsModalMethod ? getMethodName(settingsModalMethod) : ''}`}
          onClose={() => { setSettingsModalMethod(null); setEditMethodSettings(null); }}
        />
        <ModalBody>
          {editMethodSettings && (
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cl\u00E9 API</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className={`${styles.formInput} ${styles.formInputMasked}`}
                    style={{ flex: 1 }}
                    value={editMethodSettings.apiKey}
                    placeholder="sk_live_..."
                    onChange={(e) => setEditMethodSettings({ ...editMethodSettings, apiKey: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    onClick={() => setShowApiKey(!showApiKey)}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>URL Webhook</label>
                <input
                  type="url"
                  className={styles.formInput}
                  value={editMethodSettings.webhookUrl}
                  placeholder="https://votre-domaine.com/api/webhooks"
                  onChange={(e) => setEditMethodSettings({ ...editMethodSettings, webhookUrl: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Mode</label>
                <div className={styles.modeToggle}>
                  <button
                    type="button"
                    className={`${styles.modeBtn} ${editMethodSettings.testMode ? styles.modeBtnActive : ''}`}
                    onClick={() => setEditMethodSettings({ ...editMethodSettings, testMode: true })}
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeBtn} ${!editMethodSettings.testMode ? styles.modeBtnActive : ''}`}
                    onClick={() => setEditMethodSettings({ ...editMethodSettings, testMode: false })}
                  >
                    Production
                  </button>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setSettingsModalMethod(null); setEditMethodSettings(null); }}>
            Annuler
          </Button>
          <Button variant="primary" icon={<CheckCircle size={16} />} onClick={saveMethodSettings}>
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>

      {/* ===== Refund Modal ===== */}
      <Modal
        isOpen={refundData.transaction !== null}
        onClose={() => setRefundData({ transaction: null, amount: '', reason: '', step: 'form' })}
        size="md"
      >
        <ModalHeader
          title={refundData.step === 'form' ? 'Rembourser la transaction' : 'Confirmer le remboursement'}
          onClose={() => setRefundData({ transaction: null, amount: '', reason: '', step: 'form' })}
        />
        <ModalBody>
          {refundData.transaction && refundData.step === 'form' && (
            <div className={styles.formGrid}>
              <div className={styles.refundSummary}>
                <div className={styles.refundRow}>
                  <span className={styles.refundRowLabel}>Client</span>
                  <span className={styles.refundRowValue}>{refundData.transaction.client}</span>
                </div>
                <div className={styles.refundRow}>
                  <span className={styles.refundRowLabel}>Montant original</span>
                  <span className={styles.refundRowValue}>{formatCurrency(refundData.transaction.amount)}</span>
                </div>
                <div className={styles.refundRow}>
                  <span className={styles.refundRowLabel}>R\u00E9f\u00E9rence</span>
                  <span className={styles.refundRowValue}>{refundData.transaction.reference}</span>
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Montant \u00E0 rembourser (\u20AC)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={refundData.amount}
                  min={0}
                  max={refundData.transaction.amount}
                  step={0.01}
                  placeholder={`Maximum : ${refundData.transaction.amount}\u00A0\u20AC`}
                  onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Motif du remboursement</label>
                <textarea
                  className={styles.formTextarea}
                  value={refundData.reason}
                  placeholder="Indiquez la raison du remboursement..."
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                />
              </div>
            </div>
          )}

          {refundData.transaction && refundData.step === 'confirm' && (
            <div className={styles.formGrid}>
              <div className={styles.refundWarning}>
                <AlertTriangle size={20} />
                <div>
                  <strong>Attention :</strong> Cette action est irr\u00E9versible. Le montant sera rembours\u00E9 au client via la m\u00E9thode de paiement originale.
                </div>
              </div>

              <div className={styles.refundSummary}>
                <div className={styles.refundRow}>
                  <span className={styles.refundRowLabel}>Client</span>
                  <span className={styles.refundRowValue}>{refundData.transaction.client}</span>
                </div>
                <div className={styles.refundRow}>
                  <span className={styles.refundRowLabel}>Montant \u00E0 rembourser</span>
                  <span className={styles.refundRowAmount}>{formatCurrency(parseFloat(refundData.amount) || 0)}</span>
                </div>
                {refundData.reason && (
                  <div className={styles.refundRow}>
                    <span className={styles.refundRowLabel}>Motif</span>
                    <span className={styles.refundRowValue}>{refundData.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {refundData.step === 'form' && (
            <>
              <Button
                variant="secondary"
                onClick={() => setRefundData({ transaction: null, amount: '', reason: '', step: 'form' })}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const amt = parseFloat(refundData.amount);
                  if (isNaN(amt) || amt <= 0 || (refundData.transaction && amt > refundData.transaction.amount)) {
                    notifyError('Montant invalide', 'Veuillez saisir un montant valide.');
                    return;
                  }
                  setRefundData({ ...refundData, step: 'confirm' });
                }}
              >
                Continuer
              </Button>
            </>
          )}
          {refundData.step === 'confirm' && (
            <>
              <Button
                variant="secondary"
                onClick={() => setRefundData({ ...refundData, step: 'form' })}
              >
                Retour
              </Button>
              <Button variant="danger" icon={<RotateCcw size={16} />} onClick={processRefund}>
                Confirmer le remboursement
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
