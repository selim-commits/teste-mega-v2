import { useState, useCallback, useEffect } from 'react';
import {
  Plug,
  Check,
  X,
  Settings,
  Search,
  Copy,
  Eye,
  EyeOff,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Trash2,
  Info,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import styles from './Integrations.module.css';

// --- Types ---

type IntegrationCategory = 'calendrier' | 'paiement' | 'communication' | 'crm' | 'analytique';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';
type SyncFrequency = 'realtime' | '5min' | 'hourly' | 'daily';
type SyncDirection = 'bidirectional' | 'import' | 'export';

interface FieldMapping {
  id: string;
  source: string;
  target: string;
}

interface IntegrationSettings {
  apiKey: string;
  webhookUrl: string;
  syncFrequency: SyncFrequency;
  syncDirection: SyncDirection;
  fieldMappings: FieldMapping[];
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: IntegrationCategory;
  status: ConnectionStatus;
  lastSync: string | null;
  errorMessage: string | null;
  settings: IntegrationSettings;
}

interface ActivityLogEntry {
  id: string;
  integrationName: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
}

// --- Constants ---

const STORAGE_KEY = 'rooom-integrations';

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Synchronisez vos rendez-vous avec Google Agenda en temps reel',
    icon: '📅',
    category: 'calendrier',
    status: 'connected',
    lastSync: '2026-02-08T10:30:00',
    errorMessage: null,
    settings: { apiKey: 'gca_xxxxxxxxxxxxxxxxxxxx', webhookUrl: 'https://api.rooom.com/webhooks/google-calendar', syncFrequency: 'realtime', syncDirection: 'bidirectional', fieldMappings: [{ id: '1', source: 'titre', target: 'summary' }, { id: '2', source: 'date_debut', target: 'start' }] },
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: 'Synchronisez vos evenements avec Microsoft Outlook',
    icon: '📆',
    category: 'calendrier',
    status: 'disconnected',
    lastSync: null,
    errorMessage: null,
    settings: { apiKey: '', webhookUrl: '', syncFrequency: '5min', syncDirection: 'bidirectional', fieldMappings: [] },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Acceptez les paiements par carte bancaire directement',
    icon: '💳',
    category: 'paiement',
    status: 'connected',
    lastSync: '2026-02-08T09:15:00',
    errorMessage: null,
    settings: { apiKey: 'sk_live_xxxxxxxxxxxxxxxxxxxx', webhookUrl: 'https://api.rooom.com/webhooks/stripe', syncFrequency: 'realtime', syncDirection: 'import', fieldMappings: [{ id: '1', source: 'montant', target: 'amount' }, { id: '2', source: 'client_email', target: 'customer_email' }] },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Recevez les paiements via PayPal et carte bancaire',
    icon: '🅿️',
    category: 'paiement',
    status: 'error',
    lastSync: '2026-02-07T18:45:00',
    errorMessage: 'Token expire. Veuillez reconnecter votre compte.',
    settings: { apiKey: 'pp_xxxxxxxxxxxxxxxxxxxx', webhookUrl: 'https://api.rooom.com/webhooks/paypal', syncFrequency: 'hourly', syncDirection: 'import', fieldMappings: [] },
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Envoyez des SMS de rappel automatiques a vos clients',
    icon: '📱',
    category: 'communication',
    status: 'connected',
    lastSync: '2026-02-08T11:00:00',
    errorMessage: null,
    settings: { apiKey: 'tw_xxxxxxxxxxxxxxxxxxxx', webhookUrl: 'https://api.rooom.com/webhooks/twilio', syncFrequency: '5min', syncDirection: 'export', fieldMappings: [{ id: '1', source: 'telephone', target: 'to_number' }] },
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Automatisez vos emails transactionnels et marketing',
    icon: '✉️',
    category: 'communication',
    status: 'disconnected',
    lastSync: null,
    errorMessage: null,
    settings: { apiKey: '', webhookUrl: '', syncFrequency: 'hourly', syncDirection: 'export', fieldMappings: [] },
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Gerez vos campagnes email et listes de contacts',
    icon: '📧',
    category: 'crm',
    status: 'disconnected',
    lastSync: null,
    errorMessage: null,
    settings: { apiKey: '', webhookUrl: '', syncFrequency: 'daily', syncDirection: 'export', fieldMappings: [] },
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connectez Rooom a plus de 5000 applications',
    icon: '⚡',
    category: 'analytique',
    status: 'connected',
    lastSync: '2026-02-08T08:00:00',
    errorMessage: null,
    settings: { apiKey: 'zp_xxxxxxxxxxxxxxxxxxxx', webhookUrl: 'https://api.rooom.com/webhooks/zapier', syncFrequency: 'realtime', syncDirection: 'bidirectional', fieldMappings: [] },
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Synchronisez votre comptabilite et facturation',
    icon: '📊',
    category: 'analytique',
    status: 'disconnected',
    lastSync: null,
    errorMessage: null,
    settings: { apiKey: '', webhookUrl: '', syncFrequency: 'daily', syncDirection: 'bidirectional', fieldMappings: [] },
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recevez des notifications dans vos canaux Slack',
    icon: '💬',
    category: 'communication',
    status: 'disconnected',
    lastSync: null,
    errorMessage: null,
    settings: { apiKey: '', webhookUrl: '', syncFrequency: '5min', syncDirection: 'export', fieldMappings: [] },
  },
];

const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: '1', integrationName: 'Google Calendar', type: 'success', message: 'Synchronisation terminee : 12 evenements mis a jour', timestamp: '2026-02-08T10:30:00' },
  { id: '2', integrationName: 'Stripe', type: 'success', message: 'Paiement recu : 150,00 EUR via reservation #1847', timestamp: '2026-02-08T09:15:00' },
  { id: '3', integrationName: 'PayPal', type: 'error', message: 'Echec de synchronisation : token d\'authentification expire', timestamp: '2026-02-07T18:45:00' },
  { id: '4', integrationName: 'Twilio', type: 'success', message: '3 SMS de rappel envoyes avec succes', timestamp: '2026-02-08T11:00:00' },
  { id: '5', integrationName: 'Zapier', type: 'info', message: 'Workflow "Nouvelle reservation" declenche 5 fois', timestamp: '2026-02-08T08:00:00' },
  { id: '6', integrationName: 'Google Calendar', type: 'warning', message: 'Conflit detecte sur 2 evenements, resolution automatique appliquee', timestamp: '2026-02-08T07:30:00' },
  { id: '7', integrationName: 'Stripe', type: 'success', message: 'Remboursement traite : 75,00 EUR pour reservation #1832', timestamp: '2026-02-07T16:20:00' },
  { id: '8', integrationName: 'Twilio', type: 'warning', message: 'Credits SMS faibles : 23 restants', timestamp: '2026-02-07T14:00:00' },
];

const CATEGORIES: { id: 'all' | IntegrationCategory; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'communication', label: 'Communication' },
  { id: 'crm', label: 'CRM' },
  { id: 'analytique', label: 'Analytique' },
];

const SYNC_FREQUENCY_LABELS: Record<SyncFrequency, string> = {
  realtime: 'Temps reel',
  '5min': 'Toutes les 5 minutes',
  hourly: 'Toutes les heures',
  daily: 'Quotidien',
};

const SYNC_DIRECTION_LABELS: Record<SyncDirection, string> = {
  bidirectional: 'Bidirectionnel',
  import: 'Import seulement',
  export: 'Export seulement',
};

// --- Helpers ---

function loadIntegrations(): Integration[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return DEFAULT_INTEGRATIONS;
}

function saveIntegrations(integrations: Integration[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
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

function generateId(): string {
  return crypto.randomUUID();
}

// --- Component ---

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(loadIntegrations);
  const [activeCategory, setActiveCategory] = useState<'all' | IntegrationCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [editSettings, setEditSettings] = useState<IntegrationSettings>({
    apiKey: '',
    webhookUrl: '',
    syncFrequency: 'realtime',
    syncDirection: 'bidirectional',
    fieldMappings: [],
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const { success, error: notifyError, info, warning } = useNotifications();

  // Persist state
  useEffect(() => {
    saveIntegrations(integrations);
  }, [integrations]);

  // Computed
  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const errorCount = integrations.filter((i) => i.status === 'error').length;
  const lastSyncAll = integrations
    .filter((i) => i.lastSync)
    .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())[0]?.lastSync;

  const filteredIntegrations = integrations.filter((integ) => {
    const matchesCategory = activeCategory === 'all' || integ.category === activeCategory;
    const matchesSearch =
      !debouncedSearch ||
      integ.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      integ.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- Handlers ---

  const handleToggleConnection = useCallback(
    (integrationId: string) => {
      setIntegrations((prev) =>
        prev.map((integ) => {
          if (integ.id !== integrationId) return integ;
          if (integ.status === 'connected' || integ.status === 'error') {
            info(`${integ.name} deconnecte`, 'L\'integration a ete desactivee');
            return { ...integ, status: 'disconnected' as ConnectionStatus, lastSync: null, errorMessage: null };
          } else {
            success(`${integ.name} connecte`, 'L\'integration est maintenant active');
            return {
              ...integ,
              status: 'connected' as ConnectionStatus,
              lastSync: new Date().toISOString(),
              errorMessage: null,
              settings: {
                ...integ.settings,
                webhookUrl: integ.settings.webhookUrl || `https://api.rooom.com/webhooks/${integ.id}`,
              },
            };
          }
        })
      );
    },
    [success, info]
  );

  const handleOpenSettings = useCallback((integration: Integration) => {
    setEditingIntegration(integration);
    setEditSettings({ ...integration.settings });
    setShowApiKey(false);
    setFormErrors({});
    setSettingsModalOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsModalOpen(false);
    setEditingIntegration(null);
    setFormErrors({});
  }, []);

  const validateSettings = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!editSettings.apiKey.trim()) {
      errors.apiKey = 'La cle API est requise';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editSettings.apiKey]);

  const handleSaveSettings = useCallback(() => {
    if (!editingIntegration) return;
    if (!validateSettings()) return;

    setIntegrations((prev) =>
      prev.map((integ) => {
        if (integ.id !== editingIntegration.id) return integ;
        return { ...integ, settings: { ...editSettings } };
      })
    );
    success('Parametres sauvegardes', `La configuration de ${editingIntegration.name} a ete mise a jour`);
    handleCloseSettings();
  }, [editingIntegration, editSettings, validateSettings, success, handleCloseSettings]);

  const handleTestConnection = useCallback(
    (integrationId: string) => {
      setTestingConnection(integrationId);
      const integ = integrations.find((i) => i.id === integrationId);
      setTimeout(() => {
        setTestingConnection(null);
        if (integ) {
          if (integ.status === 'error') {
            notifyError(`Test echoue pour ${integ.name}`, integ.errorMessage || 'Erreur de connexion');
          } else {
            success(`Connexion verifiee pour ${integ.name}`, 'Le service repond correctement');
          }
        }
      }, 1500);
    },
    [integrations, success, notifyError]
  );

  const handleCopyWebhookUrl = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
        success('URL copiee', 'L\'URL du webhook a ete copiee dans le presse-papier');
      }).catch(() => {
        warning('Erreur de copie', 'Impossible de copier dans le presse-papier');
      });
    },
    [success, warning]
  );

  // Field mappings handlers
  const handleAddFieldMapping = useCallback(() => {
    setEditSettings((prev) => ({
      ...prev,
      fieldMappings: [...prev.fieldMappings, { id: generateId(), source: '', target: '' }],
    }));
  }, []);

  const handleRemoveFieldMapping = useCallback((mappingId: string) => {
    setEditSettings((prev) => ({
      ...prev,
      fieldMappings: prev.fieldMappings.filter((m) => m.id !== mappingId),
    }));
  }, []);

  const handleUpdateFieldMapping = useCallback((mappingId: string, field: 'source' | 'target', value: string) => {
    setEditSettings((prev) => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map((m) => (m.id === mappingId ? { ...m, [field]: value } : m)),
    }));
  }, []);

  // --- Status rendering ---

  const renderStatus = (integration: Integration) => {
    switch (integration.status) {
      case 'connected':
        return (
          <div className={styles.connectionInfo}>
            <span className={`${styles.statusBadge} ${styles.connected}`}>
              <span className={`${styles.statusDot} ${styles.dotConnected}`} />
              Connecte
            </span>
            {integration.lastSync && (
              <span className={styles.lastSync}>
                Derniere sync : {formatDateTime(integration.lastSync)}
              </span>
            )}
          </div>
        );
      case 'error':
        return (
          <div className={styles.connectionInfo}>
            <span className={`${styles.statusBadge} ${styles.errorStatus}`}>
              <span className={`${styles.statusDot} ${styles.dotError}`} />
              Erreur
            </span>
            {integration.errorMessage && (
              <span className={styles.errorMessage}>{integration.errorMessage}</span>
            )}
          </div>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.disconnected}`}>
            <span className={`${styles.statusDot} ${styles.dotDisconnected}`} />
            Deconnecte
          </span>
        );
    }
  };

  // --- Render ---

  return (
    <div className={styles.page}>
      <Header title="Integrations" subtitle="Connectez vos outils preferes" />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                <Plug size={20} color="var(--state-info)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{integrations.length}</span>
                <span className={styles.statLabel}>Integrations totales</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                <CheckCircle size={20} color="var(--state-success)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{connectedCount}</span>
                <span className={styles.statLabel}>Connectees</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)' }}>
                <Clock size={20} color="var(--accent-primary)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{lastSyncAll ? formatRelativeTime(lastSyncAll) : '—'}</span>
                <span className={styles.statLabel}>Derniere synchronisation</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: errorCount > 0 ? 'var(--state-warning-bg)' : 'var(--bg-tertiary)' }}>
                <Activity size={20} color={errorCount > 0 ? 'var(--state-warning)' : 'var(--text-muted)'} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>2 847</span>
                <span className={styles.statLabel}>Appels API ce mois</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Toolbar: Search + Category Tabs */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Rechercher une integration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        {filteredIntegrations.length === 0 ? (
          <Card padding="lg">
            <div className={styles.emptyState}>
              <Search size={48} />
              <h3>Aucune integration trouvee</h3>
              <p>Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          </Card>
        ) : (
          <div className={styles.grid}>
            {filteredIntegrations.map((integration, index) => (
              <div
                key={integration.id}
                className={styles.animateIn}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card padding="none" hoverable className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div
                      className={styles.cardIcon}
                      style={{ backgroundColor: 'var(--bg-tertiary)', fontSize: '24px' }}
                    >
                      {integration.icon}
                    </div>
                    <button
                      className={`${styles.toggleSwitch} ${integration.status === 'connected' || integration.status === 'error' ? styles.toggleActive : ''}`}
                      onClick={() => handleToggleConnection(integration.id)}
                      aria-label={integration.status === 'connected' ? 'Deconnecter' : 'Connecter'}
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                  </div>

                  <div className={styles.cardContent}>
                    <h4 className={styles.cardTitle}>{integration.name}</h4>
                    <p className={styles.cardDescription}>{integration.description}</p>
                    {renderStatus(integration)}
                    {integration.status === 'connected' && integration.settings.webhookUrl && (
                      <div className={styles.webhookUrl}>
                        <span className={styles.webhookUrlText}>{integration.settings.webhookUrl}</span>
                        <button
                          className={styles.webhookCopyBtn}
                          onClick={() => handleCopyWebhookUrl(integration.settings.webhookUrl)}
                          aria-label="Copier l'URL du webhook"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardActions}>
                      {(integration.status === 'connected' || integration.status === 'error') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw size={14} />}
                          loading={testingConnection === integration.id}
                          onClick={() => handleTestConnection(integration.id)}
                        >
                          Tester
                        </Button>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      {(integration.status === 'connected' || integration.status === 'error') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Settings size={14} />}
                          onClick={() => handleOpenSettings(integration)}
                        >
                          Configurer
                        </Button>
                      )}
                      {integration.status === 'disconnected' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Plug size={14} />}
                          onClick={() => handleToggleConnection(integration.id)}
                        >
                          Connecter
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Request Integration */}
        <Card padding="lg" style={{ marginTop: 'var(--card-gap)', textAlign: 'center' }}>
          <h3 className={styles.sectionTitle}>Vous ne trouvez pas votre outil ?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Demandez une nouvelle integration et nous l&apos;ajouterons a notre roadmap.
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              info('Demander une integration', 'Envoyez-nous un email a support@rooom.com')
            }
          >
            Demander une integration
          </Button>
        </Card>

        {/* Activity Log */}
        <div className={styles.activityLog}>
          <div className={styles.activityLogHeader}>
            <h3 className={styles.sectionTitle}>Journal d&apos;activite</h3>
          </div>
          <Card padding="none">
            <div className={styles.activityList}>
              {MOCK_ACTIVITY_LOG.map((entry) => (
                <div key={entry.id} className={styles.activityItem}>
                  <div
                    className={`${styles.activityIcon} ${
                      entry.type === 'success'
                        ? styles.activitySuccess
                        : entry.type === 'error'
                        ? styles.activityError
                        : entry.type === 'warning'
                        ? styles.activityWarning
                        : styles.activityInfo
                    }`}
                  >
                    {entry.type === 'success' && <Check size={14} />}
                    {entry.type === 'error' && <X size={14} />}
                    {entry.type === 'warning' && <AlertCircle size={14} />}
                    {entry.type === 'info' && <Info size={14} />}
                  </div>
                  <div className={styles.activityContent}>
                    <span className={styles.activityTitle}>{entry.integrationName}</span>
                    <span className={styles.activityDescription}>{entry.message}</span>
                  </div>
                  <span className={styles.activityTime}>{formatRelativeTime(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal isOpen={settingsModalOpen} onClose={handleCloseSettings} size="lg">
        <ModalHeader
          title={editingIntegration ? `Configuration de ${editingIntegration.name}` : 'Configuration'}
          subtitle="Parametres de synchronisation et de connexion"
          onClose={handleCloseSettings}
        />
        <ModalBody>
          {editingIntegration && (
            <div className={styles.modalForm}>
              {/* API Key */}
              <div className={styles.formGroup}>
                <label htmlFor="integration-api-key" className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                  Cle API
                </label>
                <div className={styles.maskedInputWrapper}>
                  <Input
                    id="integration-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={editSettings.apiKey}
                    onChange={(e) => {
                      setEditSettings((prev) => ({ ...prev, apiKey: e.target.value }));
                      if (formErrors.apiKey) setFormErrors((prev) => ({ ...prev, apiKey: '' }));
                    }}
                    placeholder="Entrez votre cle API..."
                    error={formErrors.apiKey}
                    fullWidth
                    iconRight={
                      <button
                        type="button"
                        className={styles.maskedToggle}
                        onClick={() => setShowApiKey((prev) => !prev)}
                        aria-label={showApiKey ? 'Masquer la cle' : 'Afficher la cle'}
                        style={{ position: 'static' }}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Webhook URL */}
              <div className={styles.formGroup}>
                <label htmlFor="integration-webhook-url" className={styles.formLabel}>URL du Webhook</label>
                <Input
                  id="integration-webhook-url"
                  type="text"
                  value={editSettings.webhookUrl}
                  onChange={(e) => setEditSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://api.rooom.com/webhooks/..."
                  fullWidth
                />
              </div>

              {/* Sync Frequency & Direction */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="integration-sync-frequency" className={styles.formLabel}>Frequence de synchronisation</label>
                  <select
                    id="integration-sync-frequency"
                    className={styles.formSelect}
                    value={editSettings.syncFrequency}
                    onChange={(e) =>
                      setEditSettings((prev) => ({
                        ...prev,
                        syncFrequency: e.target.value as SyncFrequency,
                      }))
                    }
                  >
                    {(Object.entries(SYNC_FREQUENCY_LABELS) as [SyncFrequency, string][]).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="integration-sync-direction" className={styles.formLabel}>Direction de synchronisation</label>
                  <select
                    id="integration-sync-direction"
                    className={styles.formSelect}
                    value={editSettings.syncDirection}
                    onChange={(e) =>
                      setEditSettings((prev) => ({
                        ...prev,
                        syncDirection: e.target.value as SyncDirection,
                      }))
                    }
                  >
                    {(Object.entries(SYNC_DIRECTION_LABELS) as [SyncDirection, string][]).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field Mapping */}
              <div className={styles.fieldMappingSection}>
                <div className={styles.fieldMappingHeader}>
                  <span className={styles.sectionDivider} style={{ flex: 1 }}>
                    Mapping des champs
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={handleAddFieldMapping}
                  >
                    Ajouter
                  </Button>
                </div>

                {editSettings.fieldMappings.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>
                    Aucun mapping configure. Cliquez sur &ldquo;Ajouter&rdquo; pour creer un mapping de champs.
                  </p>
                ) : (
                  editSettings.fieldMappings.map((mapping) => (
                    <div key={mapping.id} className={styles.fieldMappingRow}>
                      <input
                        className={styles.fieldMappingInput}
                        value={mapping.source}
                        onChange={(e) => handleUpdateFieldMapping(mapping.id, 'source', e.target.value)}
                        placeholder="Champ source..."
                      />
                      <ArrowRight size={16} className={styles.fieldMappingArrow} />
                      <input
                        className={styles.fieldMappingInput}
                        value={mapping.target}
                        onChange={(e) => handleUpdateFieldMapping(mapping.id, 'target', e.target.value)}
                        placeholder="Champ cible..."
                      />
                      <button
                        className={styles.fieldMappingRemove}
                        onClick={() => handleRemoveFieldMapping(mapping.id)}
                        aria-label="Supprimer le mapping"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseSettings}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveSettings}>
            Sauvegarder
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
