import { useState, useCallback, useEffect } from 'react';
import {
  Link2,
  Search,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Trash2,
  Edit3,
  Send,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  Zap,
  FileText,
  Filter,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import styles from './Webhooks.module.css';

// --- Types ---

type WebhookStatus = 'active' | 'inactive' | 'error';
type TabId = 'webhooks' | 'history' | 'documentation';

interface CustomHeader {
  id: string;
  key: string;
  value: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  secret: string;
  lastExecution: string | null;
  lastStatusCode: number | null;
  successCount: number;
  errorCount: number;
  customHeaders: CustomHeader[];
  createdAt: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  webhookUrl: string;
  event: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  success: boolean;
}

// --- Constants ---

const STORAGE_KEY = 'rooom-webhooks';

const ALL_EVENTS: Record<string, { label: string; events: { code: string; label: string }[] }> = {
  bookings: {
    label: 'Reservations',
    events: [
      { code: 'booking.created', label: 'Reservation creee' },
      { code: 'booking.updated', label: 'Reservation modifiee' },
      { code: 'booking.cancelled', label: 'Reservation annulee' },
      { code: 'booking.completed', label: 'Reservation terminee' },
    ],
  },
  clients: {
    label: 'Clients',
    events: [
      { code: 'client.created', label: 'Client cree' },
      { code: 'client.updated', label: 'Client modifie' },
      { code: 'client.deleted', label: 'Client supprime' },
    ],
  },
  payments: {
    label: 'Paiements',
    events: [
      { code: 'payment.received', label: 'Paiement recu' },
      { code: 'payment.refunded', label: 'Remboursement' },
      { code: 'invoice.created', label: 'Facture creee' },
    ],
  },
  equipment: {
    label: 'Equipement',
    events: [
      { code: 'equipment.reserved', label: 'Equipement reserve' },
      { code: 'equipment.returned', label: 'Equipement retourne' },
      { code: 'equipment.maintenance', label: 'Maintenance planifiee' },
    ],
  },
};

const DEFAULT_WEBHOOKS: Webhook[] = [
  {
    id: crypto.randomUUID(),
    url: 'https://api.crm-studio.com/webhooks/rooom',
    events: ['booking.created', 'booking.updated', 'booking.cancelled', 'client.created'],
    status: 'active',
    secret: 'whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    lastExecution: '2026-02-08T11:30:00',
    lastStatusCode: 200,
    successCount: 847,
    errorCount: 3,
    customHeaders: [{ id: crypto.randomUUID(), key: 'X-CRM-Token', value: 'tk_prod_xxx' }],
    createdAt: '2025-09-15T10:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://hooks.zapier.com/hooks/catch/12345/abcdef/',
    events: ['booking.created', 'payment.received'],
    status: 'active',
    secret: 'whsec_q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6',
    lastExecution: '2026-02-08T10:15:00',
    lastStatusCode: 200,
    successCount: 1243,
    errorCount: 7,
    customHeaders: [],
    createdAt: '2025-08-20T14:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://n8n.mystudio.io/webhook/rooom-bookings',
    events: ['booking.created', 'booking.updated', 'booking.cancelled', 'booking.completed'],
    status: 'active',
    secret: 'whsec_z1x2c3v4b5n6m7q8w9e0r1t2y3u4i5o6',
    lastExecution: '2026-02-08T09:45:00',
    lastStatusCode: 200,
    successCount: 562,
    errorCount: 0,
    customHeaders: [{ id: crypto.randomUUID(), key: 'Authorization', value: 'Bearer n8n_tok_xxx' }],
    createdAt: '2025-10-01T08:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://api.mailerlite.com/webhooks/incoming/rooom',
    events: ['client.created', 'client.updated'],
    status: 'active',
    secret: 'whsec_m1a2i3l4e5r6l7i8t9e0w1h2s3e4c5r6',
    lastExecution: '2026-02-08T08:20:00',
    lastStatusCode: 200,
    successCount: 234,
    errorCount: 1,
    customHeaders: [{ id: crypto.randomUUID(), key: 'X-ML-Key', value: 'ml_api_xxx' }],
    createdAt: '2025-11-12T16:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://discord.com/api/webhooks/1234567890/abcdefg',
    events: ['booking.created', 'payment.received', 'booking.cancelled'],
    status: 'active',
    secret: 'whsec_d1i2s3c4o5r6d7w8h9s0e1c2r3e4t5k6',
    lastExecution: '2026-02-08T11:00:00',
    lastStatusCode: 204,
    successCount: 389,
    errorCount: 12,
    customHeaders: [],
    createdAt: '2025-12-05T09:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://accounting.example.com/api/v2/webhooks',
    events: ['payment.received', 'payment.refunded', 'invoice.created'],
    status: 'error',
    secret: 'whsec_a1c2c3o4u5n6t7w8h9s0e1c2r3e4t5k6',
    lastExecution: '2026-02-07T23:15:00',
    lastStatusCode: 502,
    successCount: 156,
    errorCount: 34,
    customHeaders: [{ id: crypto.randomUUID(), key: 'X-Account-ID', value: 'acc_12345' }],
    createdAt: '2025-10-20T11:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://analytics.mystudio.io/collect',
    events: ['booking.created', 'booking.completed', 'client.created', 'payment.received'],
    status: 'active',
    secret: 'whsec_a1n2a3l4y5t6i7c8s9w0h1s2e3c4r5e6',
    lastExecution: '2026-02-08T11:25:00',
    lastStatusCode: 200,
    successCount: 2103,
    errorCount: 5,
    customHeaders: [],
    createdAt: '2025-07-01T08:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://slack.com/api/webhooks/T0001/B0001/xxxx',
    events: ['booking.cancelled', 'equipment.maintenance'],
    status: 'inactive',
    secret: 'whsec_s1l2a3c4k5w6h7s8e9c0r1e2t3k4e5y6',
    lastExecution: '2026-01-15T16:30:00',
    lastStatusCode: 200,
    successCount: 78,
    errorCount: 2,
    customHeaders: [],
    createdAt: '2025-11-01T10:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://old-crm.legacy.com/api/webhook-receiver',
    events: ['client.created'],
    status: 'inactive',
    secret: 'whsec_o1l2d3c4r5m6w7h8s9e0c1r2e3t4k5e6',
    lastExecution: '2025-12-20T14:00:00',
    lastStatusCode: 200,
    successCount: 45,
    errorCount: 0,
    customHeaders: [],
    createdAt: '2025-06-15T12:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://inventory-sync.example.com/hooks/equipment',
    events: ['equipment.reserved', 'equipment.returned', 'equipment.maintenance'],
    status: 'error',
    secret: 'whsec_i1n2v3e4n5t6o7r8y9s0y1n2c3k4e5y6',
    lastExecution: '2026-02-08T06:00:00',
    lastStatusCode: 500,
    successCount: 91,
    errorCount: 18,
    customHeaders: [{ id: crypto.randomUUID(), key: 'X-Inv-Token', value: 'inv_tok_xxx' }],
    createdAt: '2025-10-10T14:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://sms-gateway.mystudio.io/api/notify',
    events: ['booking.created', 'booking.cancelled'],
    status: 'active',
    secret: 'whsec_s1m2s3g4a5t6e7w8a9y0s1e2c3r4e5t6',
    lastExecution: '2026-02-08T11:10:00',
    lastStatusCode: 200,
    successCount: 421,
    errorCount: 8,
    customHeaders: [],
    createdAt: '2025-09-01T08:00:00',
  },
  {
    id: crypto.randomUUID(),
    url: 'https://backup.cloud-archive.io/events/rooom',
    events: ['booking.created', 'booking.updated', 'client.created', 'client.updated', 'payment.received', 'invoice.created'],
    status: 'active',
    secret: 'whsec_b1a2c3k4u5p6c7l8o9u0d1a2r3c4h5i6',
    lastExecution: '2026-02-08T11:28:00',
    lastStatusCode: 200,
    successCount: 3567,
    errorCount: 2,
    customHeaders: [{ id: crypto.randomUUID(), key: 'X-Archive-Key', value: 'arc_key_xxx' }],
    createdAt: '2025-05-01T10:00:00',
  },
];

function generateDeliveryLogs(): DeliveryLog[] {
  const webhooks = DEFAULT_WEBHOOKS;
  const allEvents = Object.values(ALL_EVENTS).flatMap((g) => g.events.map((e) => e.code));
  const logs: DeliveryLog[] = [];
  const baseTime = new Date('2026-02-08T12:00:00').getTime();

  for (let i = 0; i < 30; i++) {
    const wh = webhooks[i % webhooks.length];
    const event = wh.events[i % wh.events.length] || allEvents[i % allEvents.length];
    const isSuccess = i % 5 !== 0;
    logs.push({
      id: crypto.randomUUID(),
      webhookId: wh.id,
      webhookUrl: wh.url,
      event,
      statusCode: isSuccess ? (i % 3 === 0 ? 204 : 200) : (i % 2 === 0 ? 500 : 502),
      responseTime: isSuccess ? 50 + Math.floor(Math.random() * 200) : 1000 + Math.floor(Math.random() * 4000),
      timestamp: new Date(baseTime - i * 1800000).toISOString(),
      success: isSuccess,
    });
  }

  return logs;
}

const DEFAULT_LOGS = generateDeliveryLogs();

// --- Helpers ---

function loadWebhooks(): Webhook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Webhook[];
    }
  } catch {
    // ignore
  }
  return DEFAULT_WEBHOOKS;
}

function saveWebhooks(webhooks: Webhook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks));
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'A l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  return formatDateTime(iso);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// --- Component ---

export function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(loadWebhooks);
  const [logs] = useState<DeliveryLog[]>(DEFAULT_LOGS);
  const [activeTab, setActiveTab] = useState<TabId>('webhooks');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  // Form state
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formHeaders, setFormHeaders] = useState<CustomHeader[]>([]);
  const [formSecret, setFormSecret] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Test state
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ status: number; body: string } | null>(null);

  // Log filters
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [logEventFilter, setLogEventFilter] = useState<string>('all');

  const { success, error: notifyError, info } = useNotifications();

  // Persist
  useEffect(() => {
    saveWebhooks(webhooks);
  }, [webhooks]);

  // Computed stats
  const activeCount = webhooks.filter((w) => w.status === 'active').length;
  const errorCount = webhooks.filter((w) => w.status === 'error').length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.successCount + w.errorCount, 0);
  const totalErrors = webhooks.reduce((sum, w) => sum + w.errorCount, 0);
  const successRate = totalDeliveries > 0 ? ((totalDeliveries - totalErrors) / totalDeliveries * 100).toFixed(1) : '100';

  // Filtered webhooks
  const filteredWebhooks = webhooks.filter((wh) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      wh.url.toLowerCase().includes(q) ||
      wh.events.some((e) => e.toLowerCase().includes(q))
    );
  });

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      logStatusFilter === 'all' ||
      (logStatusFilter === 'success' && log.success) ||
      (logStatusFilter === 'error' && !log.success);
    const matchesEvent = logEventFilter === 'all' || log.event === logEventFilter;
    const matchesSearch =
      !debouncedSearch ||
      log.webhookUrl.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      log.event.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesStatus && matchesEvent && matchesSearch;
  });

  // --- Handlers ---

  const resetForm = useCallback(() => {
    setFormUrl('');
    setFormEvents([]);
    setFormHeaders([]);
    setFormSecret(crypto.randomUUID());
    setFormActive(true);
    setShowSecret(false);
    setFormErrors({});
    setTestResult(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingWebhook(null);
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback((webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormUrl(webhook.url);
    setFormEvents([...webhook.events]);
    setFormHeaders(webhook.customHeaders.map((h) => ({ ...h })));
    setFormSecret(webhook.secret);
    setFormActive(webhook.status !== 'inactive');
    setShowSecret(false);
    setFormErrors({});
    setTestResult(null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingWebhook(null);
    setFormErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formUrl.trim()) {
      errors.url = 'L\'URL est requise';
    } else if (!isValidUrl(formUrl)) {
      errors.url = 'L\'URL doit etre une URL valide (http:// ou https://)';
    }
    if (formEvents.length === 0) {
      errors.events = 'Selectionnez au moins un evenement';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formUrl, formEvents]);

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    if (editingWebhook) {
      setWebhooks((prev) =>
        prev.map((wh) => {
          if (wh.id !== editingWebhook.id) return wh;
          return {
            ...wh,
            url: formUrl,
            events: formEvents,
            customHeaders: formHeaders,
            secret: formSecret,
            status: formActive ? (wh.status === 'error' ? 'error' : 'active') : 'inactive',
          };
        })
      );
      success('Webhook modifie', `Le webhook vers ${new URL(formUrl).hostname} a ete mis a jour`);
    } else {
      const newWebhook: Webhook = {
        id: crypto.randomUUID(),
        url: formUrl,
        events: formEvents,
        status: formActive ? 'active' : 'inactive',
        secret: formSecret,
        lastExecution: null,
        lastStatusCode: null,
        successCount: 0,
        errorCount: 0,
        customHeaders: formHeaders,
        createdAt: new Date().toISOString(),
      };
      setWebhooks((prev) => [newWebhook, ...prev]);
      success('Webhook cree', `Nouveau webhook configure vers ${new URL(formUrl).hostname}`);
    }
    handleCloseModal();
  }, [editingWebhook, formUrl, formEvents, formHeaders, formSecret, formActive, validateForm, success, handleCloseModal]);

  const handleDelete = useCallback(
    (webhookId: string) => {
      const wh = webhooks.find((w) => w.id === webhookId);
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      if (wh) {
        info('Webhook supprime', `Le webhook vers ${new URL(wh.url).hostname} a ete retire`);
      }
    },
    [webhooks, info]
  );

  const handleToggleStatus = useCallback(
    (webhookId: string) => {
      setWebhooks((prev) =>
        prev.map((wh) => {
          if (wh.id !== webhookId) return wh;
          const newStatus: WebhookStatus = wh.status === 'active' ? 'inactive' : 'active';
          return { ...wh, status: newStatus };
        })
      );
    },
    []
  );

  const handleCopy = useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text).then(() => {
        success('Copie', `${label} copie dans le presse-papier`);
      }).catch(() => {
        notifyError('Erreur', 'Impossible de copier dans le presse-papier');
      });
    },
    [success, notifyError]
  );

  const handleTest = useCallback(
    (webhookId: string) => {
      setTestingWebhook(webhookId);
      setTestResult(null);
      setTimeout(() => {
        const wh = webhooks.find((w) => w.id === webhookId);
        setTestingWebhook(null);
        if (wh && wh.status !== 'error') {
          setTestResult({ status: 200, body: JSON.stringify({ received: true, event: 'test.ping', timestamp: new Date().toISOString() }, null, 2) });
          success('Test reussi', `Le webhook vers ${new URL(wh.url).hostname} a repondu correctement`);
        } else {
          setTestResult({ status: 502, body: JSON.stringify({ error: 'Bad Gateway', message: 'Le serveur distant ne repond pas' }, null, 2) });
          notifyError('Test echoue', 'Le webhook n\'a pas repondu correctement');
        }
      }, 1500);
    },
    [webhooks, success, notifyError]
  );

  const handleRetryLog = useCallback(
    (logId: string) => {
      const log = logs.find((l) => l.id === logId);
      if (log) {
        info('Renvoi en cours', `Renvoi de l'evenement ${log.event} vers ${new URL(log.webhookUrl).hostname}`);
      }
    },
    [logs, info]
  );

  const handleToggleEvent = useCallback((eventCode: string) => {
    setFormEvents((prev) =>
      prev.includes(eventCode)
        ? prev.filter((e) => e !== eventCode)
        : [...prev, eventCode]
    );
    if (formErrors.events) {
      setFormErrors((prev) => ({ ...prev, events: '' }));
    }
  }, [formErrors.events]);

  const handleAddHeader = useCallback(() => {
    setFormHeaders((prev) => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
  }, []);

  const handleRemoveHeader = useCallback((headerId: string) => {
    setFormHeaders((prev) => prev.filter((h) => h.id !== headerId));
  }, []);

  const handleUpdateHeader = useCallback((headerId: string, field: 'key' | 'value', value: string) => {
    setFormHeaders((prev) => prev.map((h) => (h.id === headerId ? { ...h, [field]: value } : h)));
  }, []);

  const handleRegenerateSecret = useCallback(() => {
    setFormSecret(crypto.randomUUID());
    success('Secret regenere', 'Un nouveau secret de signature a ete genere');
  }, [success]);

  // --- Status rendering ---
  const renderStatusBadge = (status: WebhookStatus) => {
    const config: Record<WebhookStatus, { label: string; className: string; dotClass: string }> = {
      active: { label: 'Actif', className: styles.active, dotClass: styles.dotActive },
      inactive: { label: 'Inactif', className: styles.inactive, dotClass: styles.dotInactive },
      error: { label: 'Erreur', className: styles.error, dotClass: styles.dotError },
    };
    const c = config[status];
    return (
      <span className={`${styles.statusBadge} ${c.className}`}>
        <span className={`${styles.statusDot} ${c.dotClass}`} />
        {c.label}
      </span>
    );
  };

  // --- Unique events for filter ---
  const uniqueLogEvents = Array.from(new Set(logs.map((l) => l.event))).sort();

  // --- Render ---

  return (
    <div className={styles.page}>
      <Header
        title="Webhooks"
        subtitle="Configurez des notifications en temps reel vers vos services"
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Nouveau webhook
          </Button>
        }
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                <Link2 size={20} color="var(--state-info)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{webhooks.length}</span>
                <span className={styles.statLabel}>Webhooks configures</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                <CheckCircle size={20} color="var(--state-success)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeCount}</span>
                <span className={styles.statLabel}>Actifs</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)' }}>
                <Activity size={20} color="var(--accent-primary)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{totalDeliveries.toLocaleString('fr-FR')}</span>
                <span className={styles.statLabel}>Livraisons totales</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: errorCount > 0 ? 'var(--state-warning-bg)' : 'var(--state-success-bg)' }}>
                <Zap size={20} color={errorCount > 0 ? 'var(--state-warning)' : 'var(--state-success)'} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{successRate}%</span>
                <span className={styles.statLabel}>Taux de succes</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Rechercher par URL ou evenement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'webhooks' ? styles.active : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            <Link2 size={14} />
            Webhooks
            <span className={styles.tabBadge}>{webhooks.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={14} />
            Historique
            <span className={styles.tabBadge}>{logs.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'documentation' ? styles.active : ''}`}
            onClick={() => setActiveTab('documentation')}
          >
            <FileText size={14} />
            Documentation
          </button>
        </div>

        {/* Tab: Webhooks */}
        {activeTab === 'webhooks' && (
          <>
            {filteredWebhooks.length === 0 ? (
              <Card padding="lg">
                <div className={styles.emptyState}>
                  <Search size={48} />
                  <h3>Aucun webhook trouve</h3>
                  <p>Creez votre premier webhook pour recevoir des notifications en temps reel.</p>
                  <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
                    Creer un webhook
                  </Button>
                </div>
              </Card>
            ) : (
              <Card padding="none">
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Statut</th>
                        <th>URL de destination</th>
                        <th>Evenements</th>
                        <th>Derniere execution</th>
                        <th>Succes / Erreurs</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWebhooks.map((wh) => (
                        <tr key={wh.id}>
                          <td>
                            <button
                              className={`${styles.toggleSwitch} ${wh.status === 'active' || wh.status === 'error' ? styles.toggleActive : ''}`}
                              onClick={() => handleToggleStatus(wh.id)}
                              aria-label={wh.status === 'active' ? 'Desactiver' : 'Activer'}
                            >
                              <span className={styles.toggleKnob} />
                            </button>
                          </td>
                          <td>
                            <div className={styles.urlCell}>
                              <span className={styles.urlText}>{wh.url}</span>
                              <button
                                className={styles.copyBtn}
                                onClick={() => handleCopy(wh.url, 'URL')}
                                aria-label="Copier l'URL"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            {renderStatusBadge(wh.status)}
                          </td>
                          <td>
                            <div className={styles.eventsTags}>
                              {wh.events.slice(0, 2).map((ev) => (
                                <span key={ev} className={styles.eventTag}>{ev}</span>
                              ))}
                              {wh.events.length > 2 && (
                                <span className={styles.eventTagMore}>+{wh.events.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {wh.lastExecution ? (
                              <div className={styles.lastExec}>
                                <span className={styles.lastExecDate}>{formatRelativeTime(wh.lastExecution)}</span>
                                {wh.lastStatusCode !== null && (
                                  <span className={`${styles.lastExecStatus} ${wh.lastStatusCode < 400 ? styles.httpSuccess : styles.httpError}`}>
                                    HTTP {wh.lastStatusCode}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Jamais</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.counters}>
                              <span className={styles.counterSuccess}>
                                <Check size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                                {wh.successCount}
                              </span>
                              <span className={styles.counterError}>
                                <X size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                                {wh.errorCount}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleTest(wh.id)}
                                aria-label="Tester le webhook"
                                title="Tester"
                              >
                                {testingWebhook === wh.id ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                              </button>
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleOpenEdit(wh)}
                                aria-label="Modifier le webhook"
                                title="Modifier"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => handleDelete(wh.id)}
                                aria-label="Supprimer le webhook"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Test Result */}
            {testResult && (
              <div className={styles.testSection} style={{ marginTop: 'var(--card-gap)' }}>
                <div className={styles.testHeader}>
                  <span className={styles.testTitle}>Resultat du test</span>
                  <Button variant="ghost" size="sm" onClick={() => setTestResult(null)}>
                    Fermer
                  </Button>
                </div>
                <div className={styles.testResult}>
                  <div className={styles.testResultHeader}>
                    <span className={`${styles.lastExecStatus} ${testResult.status < 400 ? styles.httpSuccess : styles.httpError}`}>
                      HTTP {testResult.status}
                    </span>
                    {testResult.status < 400 ? (
                      <CheckCircle size={14} color="var(--state-success)" />
                    ) : (
                      <AlertCircle size={14} color="var(--state-error)" />
                    )}
                  </div>
                  <pre className={styles.testResultBody}>{testResult.body}</pre>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <>
            <div className={styles.filterRow}>
              <Filter size={14} color="var(--text-tertiary)" />
              <select
                className={styles.filterSelect}
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value as 'all' | 'success' | 'error')}
              >
                <option value="all">Tous les statuts</option>
                <option value="success">Succes</option>
                <option value="error">Erreurs</option>
              </select>
              <select
                className={styles.filterSelect}
                value={logEventFilter}
                onChange={(e) => setLogEventFilter(e.target.value)}
              >
                <option value="all">Tous les evenements</option>
                {uniqueLogEvents.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>

            {filteredLogs.length === 0 ? (
              <Card padding="lg">
                <div className={styles.emptyState}>
                  <Clock size={48} />
                  <h3>Aucune livraison trouvee</h3>
                  <p>Les livraisons de webhooks apparaitront ici.</p>
                </div>
              </Card>
            ) : (
              <Card padding="none">
                <div className={styles.logsList}>
                  {filteredLogs.map((log) => (
                    <div key={log.id} className={styles.logItem}>
                      <div className={`${styles.logIcon} ${log.success ? styles.logSuccess : styles.logError}`}>
                        {log.success ? <Check size={14} /> : <X size={14} />}
                      </div>
                      <div className={styles.logContent}>
                        <div className={styles.logEvent}>
                          <span className={styles.logEventName}>{log.event}</span>
                        </div>
                        <span className={styles.logUrl}>{log.webhookUrl}</span>
                      </div>
                      <div className={styles.logMeta}>
                        <span className={`${styles.logStatus} ${log.success ? styles.httpSuccess : styles.httpError}`}>
                          {log.statusCode}
                        </span>
                        <span className={styles.logResponseTime}>{log.responseTime}ms</span>
                        <span className={styles.logTimestamp}>{formatRelativeTime(log.timestamp)}</span>
                        {!log.success && (
                          <button
                            className={styles.logRetryBtn}
                            onClick={() => handleRetryLog(log.id)}
                            aria-label="Renvoyer"
                            title="Renvoyer"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Tab: Documentation */}
        {activeTab === 'documentation' && (
          <div className={styles.docSection}>
            <Card padding="lg">
              <div className={styles.docBlock}>
                <h3 className={styles.docTitle}>Comment fonctionnent les webhooks</h3>
                <p className={styles.docText}>
                  Les webhooks permettent a Rooom OS d&apos;envoyer des notifications HTTP en temps reel vers vos services
                  externes lorsqu&apos;un evenement se produit. Chaque requete contient un payload JSON signe avec votre
                  secret de signature pour garantir l&apos;authenticite.
                </p>
              </div>
            </Card>

            <Card padding="lg">
              <div className={styles.docBlock}>
                <h3 className={styles.docTitle}>Format du payload</h3>
                <p className={styles.docText}>
                  Chaque livraison de webhook envoie une requete POST avec le contenu suivant :
                </p>
                <div className={styles.codeBlock}>
                  <code className={styles.codeBlockCode}>{`POST {votre_url}
Content-Type: application/json
X-Rooom-Signature: sha256=...
X-Rooom-Event: booking.created
X-Rooom-Delivery: uuid

{
  "id": "evt_...",
  "type": "booking.created",
  "created_at": "2026-02-08T12:00:00Z",
  "data": {
    "booking_id": "...",
    "client_name": "...",
    "start_time": "...",
    "end_time": "..."
  }
}`}</code>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className={styles.docBlock}>
                <h3 className={styles.docTitle}>Verification de la signature</h3>
                <p className={styles.docText}>
                  Pour verifier l&apos;authenticite d&apos;un webhook, calculez le HMAC SHA-256 du body
                  avec votre secret et comparez-le au header X-Rooom-Signature.
                </p>
                <div className={styles.codeBlock}>
                  <code className={styles.codeBlockCode}>{`const crypto = require('crypto');

function verifySignature(body, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return \`sha256=\${hash}\` === signature;
}`}</code>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className={styles.docBlock}>
                <h3 className={styles.docTitle}>Evenements disponibles</h3>
                <p className={styles.docText}>
                  Voici la liste de tous les evenements auxquels vous pouvez vous abonner :
                </p>
                <div className={styles.docEventsList}>
                  {Object.values(ALL_EVENTS).flatMap((group) =>
                    group.events.map((ev) => (
                      <div key={ev.code} className={styles.docEventItem}>
                        <span className={styles.docEventCode}>{ev.code}</span>
                        <span className={styles.docEventDescription}>{ev.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className={styles.docBlock}>
                <h3 className={styles.docTitle}>Politique de reessai</h3>
                <p className={styles.docText}>
                  Si votre endpoint repond avec un code HTTP 4xx ou 5xx, Rooom OS reessaiera la livraison
                  avec un backoff exponentiel : 1 min, 5 min, 30 min, 2h, 12h. Apres 5 tentatives echouees,
                  le webhook sera marque en erreur et vous recevrez une notification.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} size="lg">
        <ModalHeader
          title={editingWebhook ? 'Modifier le webhook' : 'Nouveau webhook'}
          subtitle={editingWebhook ? 'Modifiez la configuration de ce webhook' : 'Configurez un nouveau endpoint de webhook'}
          onClose={handleCloseModal}
        />
        <ModalBody>
          <div className={styles.modalForm}>
            {/* URL */}
            <div className={styles.formGroup}>
              <label htmlFor="webhook-url" className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                URL de destination
              </label>
              <Input
                id="webhook-url"
                type="url"
                value={formUrl}
                onChange={(e) => {
                  setFormUrl(e.target.value);
                  if (formErrors.url) setFormErrors((prev) => ({ ...prev, url: '' }));
                }}
                placeholder="https://example.com/webhooks/rooom"
                error={formErrors.url}
                fullWidth
              />
              <span className={styles.formHint}>L&apos;URL doit accepter des requetes POST.</span>
            </div>

            {/* Events */}
            <div className={styles.formGroup}>
              <span className={`${styles.formLabel} ${styles.formLabelRequired}`}>Evenements</span>
              {formErrors.events && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--state-error)' }}>{formErrors.events}</span>
              )}
              <div className={styles.eventsSection}>
                {Object.entries(ALL_EVENTS).map(([groupKey, group]) => (
                  <div key={groupKey} className={styles.eventGroup}>
                    <span className={styles.eventGroupLabel}>{group.label}</span>
                    <div className={styles.eventCheckboxes}>
                      {group.events.map((ev) => (
                        <label key={ev.code} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={formEvents.includes(ev.code)}
                            onChange={() => handleToggleEvent(ev.code)}
                          />
                          <span className={styles.checkboxText}>{ev.code}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secret */}
            <div className={styles.formGroup}>
              <label htmlFor="webhook-secret" className={styles.formLabel}>Secret de signature</label>
              <div className={styles.secretField}>
                <div className={styles.secretInput}>
                  <Input
                    id="webhook-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={formSecret}
                    onChange={(e) => setFormSecret(e.target.value)}
                    fullWidth
                    iconRight={
                      <button
                        type="button"
                        className={styles.maskedToggle}
                        onClick={() => setShowSecret((prev) => !prev)}
                        aria-label={showSecret ? 'Masquer' : 'Afficher'}
                        style={{ position: 'static' }}
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>
                <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={handleRegenerateSecret}>
                  Regenerer
                </Button>
              </div>
              <span className={styles.formHint}>Utilise pour signer les payloads (HMAC SHA-256).</span>
            </div>

            {/* Custom Headers */}
            <div className={styles.headersSection}>
              <div className={styles.headersSectionTitle}>
                <span className={styles.sectionDivider} style={{ flex: 1 }}>
                  Headers personnalises
                </span>
                <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={handleAddHeader}>
                  Ajouter
                </Button>
              </div>
              {formHeaders.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  Aucun header personnalise. Cliquez sur &ldquo;Ajouter&rdquo; pour ajouter un header.
                </p>
              ) : (
                formHeaders.map((header) => (
                  <div key={header.id} className={styles.headerRow}>
                    <input
                      className={styles.headerInput}
                      value={header.key}
                      onChange={(e) => handleUpdateHeader(header.id, 'key', e.target.value)}
                      placeholder="Nom du header..."
                    />
                    <input
                      className={styles.headerInput}
                      value={header.value}
                      onChange={(e) => handleUpdateHeader(header.id, 'value', e.target.value)}
                      placeholder="Valeur..."
                    />
                    <button
                      className={styles.headerRemoveBtn}
                      onClick={() => handleRemoveHeader(header.id)}
                      aria-label="Supprimer le header"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Active toggle */}
            <div className={styles.formGroup}>
              <span className={styles.formLabel}>Statut</span>
              <label className={styles.checkboxLabel}>
                <button
                  className={`${styles.toggleSwitch} ${formActive ? styles.toggleActive : ''}`}
                  onClick={() => setFormActive((prev) => !prev)}
                  aria-label={formActive ? 'Desactiver' : 'Activer'}
                >
                  <span className={styles.toggleKnob} />
                </button>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {formActive ? 'Actif - Les evenements seront livres' : 'Inactif - Les evenements ne seront pas livres'}
                </span>
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseModal}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingWebhook ? 'Sauvegarder' : 'Creer le webhook'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
