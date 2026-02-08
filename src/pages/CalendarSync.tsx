import { useState, useEffect, useCallback } from 'react';
import {
  CalendarSync as CalendarSyncIcon,
  Check,
  RefreshCw,
  Link2,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Clock,
  Copy,
  XCircle,
  Shield,
  ToggleLeft,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { Checkbox } from '../components/ui/Checkbox';
import { useNotifications } from '../stores/uiStore';
import styles from './CalendarSync.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type SyncDirection = 'import' | 'export' | 'bidirectional';
type SyncFrequency = 'realtime' | '5min' | '15min' | '1hour';
type ConflictStrategy = 'external-priority' | 'rooom-priority' | 'ask';
type LogType = 'import' | 'export' | 'conflict' | 'error';

interface CalendarRoom {
  id: string;
  name: string;
  enabled: boolean;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  lastSync: string | null;
  syncDirection: SyncDirection;
  syncFrequency: SyncFrequency;
  calendars: CalendarRoom[];
}

interface ConflictSettings {
  strategy: ConflictStrategy;
  autoBlockBusy: boolean;
}

interface SyncLogEntry {
  id: string;
  type: LogType;
  title: string;
  description: string;
  timestamp: string;
  provider: string;
}

interface CalendarSyncState {
  providers: ProviderConfig[];
  conflictSettings: ConflictSettings;
  syncLog: SyncLogEntry[];
  stats: {
    eventsSynced: number;
    conflictsResolved: number;
  };
}

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rooom-calendar-sync';

// ─── Default rooms ───────────────────────────────────────────────────────────

const defaultRooms: CalendarRoom[] = [
  { id: 'studio-a', name: 'Studio A', enabled: true },
  { id: 'studio-b', name: 'Studio B', enabled: true },
  { id: 'salle-maquillage', name: 'Salle maquillage', enabled: false },
  { id: 'espace-lounge', name: 'Espace lounge', enabled: false },
  { id: 'studio-c', name: 'Studio C', enabled: true },
];

// ─── Default providers ───────────────────────────────────────────────────────

const defaultProviders: ProviderConfig[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Synchronisez avec votre agenda Google',
    icon: '📅',
    connected: true,
    lastSync: '2026-02-08T09:15:00',
    syncDirection: 'bidirectional',
    syncFrequency: '15min',
    calendars: defaultRooms.map((r) => ({ ...r })),
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: 'Connectez votre calendrier Microsoft',
    icon: '📆',
    connected: true,
    lastSync: '2026-02-08T08:45:00',
    syncDirection: 'import',
    syncFrequency: '5min',
    calendars: defaultRooms.map((r) => ({ ...r, enabled: r.id === 'studio-a' || r.id === 'studio-b' })),
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    description: 'Integrez iCloud Calendar',
    icon: '🍎',
    connected: false,
    lastSync: null,
    syncDirection: 'bidirectional',
    syncFrequency: '15min',
    calendars: defaultRooms.map((r) => ({ ...r, enabled: false })),
  },
  {
    id: 'ical',
    name: 'iCal URL',
    description: 'Partagez un lien iCal en lecture seule',
    icon: '🔗',
    connected: true,
    lastSync: '2026-02-08T07:30:00',
    syncDirection: 'export',
    syncFrequency: 'realtime',
    calendars: defaultRooms.map((r) => ({ ...r })),
  },
  {
    id: 'caldav',
    name: 'CalDAV',
    description: 'Protocole standard pour serveurs CalDAV',
    icon: '🗓️',
    connected: false,
    lastSync: null,
    syncDirection: 'bidirectional',
    syncFrequency: '1hour',
    calendars: defaultRooms.map((r) => ({ ...r, enabled: false })),
  },
];

// ─── Default sync log ────────────────────────────────────────────────────────

const defaultSyncLog: SyncLogEntry[] = [
  { id: '1', type: 'import', title: 'Reservation importee', description: 'Seance photo Studio A - 14h a 17h', timestamp: '2026-02-08T09:15:00', provider: 'Google Calendar' },
  { id: '2', type: 'export', title: 'Reservation exportee', description: 'Shooting mode Studio B - 10h a 12h', timestamp: '2026-02-08T09:14:00', provider: 'Google Calendar' },
  { id: '3', type: 'conflict', title: 'Conflit detecte et resolu', description: 'Double reservation Studio A - priorite Rooom appliquee', timestamp: '2026-02-08T08:50:00', provider: 'Outlook' },
  { id: '4', type: 'import', title: 'Evenement importe', description: 'Reunion equipe - Espace lounge', timestamp: '2026-02-08T08:45:00', provider: 'Outlook' },
  { id: '5', type: 'error', title: 'Erreur de synchronisation', description: 'Impossible de lire le calendrier distant - delai depasse', timestamp: '2026-02-08T08:30:00', provider: 'Outlook' },
  { id: '6', type: 'export', title: 'Reservation exportee', description: 'Post-production Studio C - 9h a 11h', timestamp: '2026-02-08T07:30:00', provider: 'iCal URL' },
  { id: '7', type: 'import', title: 'Reservation importee', description: 'Seance portrait Salle maquillage - 15h a 16h', timestamp: '2026-02-07T18:00:00', provider: 'Google Calendar' },
  { id: '8', type: 'conflict', title: 'Conflit resolu automatiquement', description: 'Chevauchement Studio B - calendrier externe prioritaire', timestamp: '2026-02-07T16:20:00', provider: 'Google Calendar' },
  { id: '9', type: 'export', title: 'Blocage exporte', description: 'Maintenance Studio A - journee complete', timestamp: '2026-02-07T14:00:00', provider: 'iCal URL' },
  { id: '10', type: 'error', title: 'Authentification echouee', description: 'Token expire pour le compte Outlook - reconnexion requise', timestamp: '2026-02-07T12:00:00', provider: 'Outlook' },
];

// ─── Default state ───────────────────────────────────────────────────────────

const defaultState: CalendarSyncState = {
  providers: defaultProviders,
  conflictSettings: {
    strategy: 'rooom-priority',
    autoBlockBusy: true,
  },
  syncLog: defaultSyncLog,
  stats: {
    eventsSynced: 247,
    conflictsResolved: 12,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadState(): CalendarSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CalendarSyncState;
    }
  } catch {
    // ignore parse errors
  }
  return defaultState;
}

function saveState(state: CalendarSyncState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' a ' + d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'A l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Il y a ${diffD}j`;
}

const syncDirectionLabels: Record<SyncDirection, string> = {
  import: 'Import seulement',
  export: 'Export seulement',
  bidirectional: 'Bidirectionnel',
};

const syncFrequencyLabels: Record<SyncFrequency, string> = {
  realtime: 'Temps reel',
  '5min': 'Toutes les 5 min',
  '15min': 'Toutes les 15 min',
  '1hour': 'Toutes les heures',
};

const conflictStrategyLabels: Record<ConflictStrategy, string> = {
  'external-priority': 'Priorite calendrier externe',
  'rooom-priority': 'Priorite Rooom',
  ask: 'Demander confirmation',
};

const ICAL_URL = 'https://rooom.app/ical/studio-abc123def456.ics';

// ─── Component ───────────────────────────────────────────────────────────────

export function CalendarSync() {
  const [state, setState] = useState<CalendarSyncState>(loadState);
  const { success, error: notifyError, info } = useNotifications();

  // Persist to localStorage on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // ─── Provider actions ────────────────────────────────────────────────────

  const toggleConnect = useCallback((providerId: string) => {
    setState((prev) => {
      const updated = prev.providers.map((p) => {
        if (p.id !== providerId) return p;
        const nowConnected = !p.connected;
        return {
          ...p,
          connected: nowConnected,
          lastSync: nowConnected ? new Date().toISOString() : null,
        };
      });
      return { ...prev, providers: updated };
    });
    const provider = state.providers.find((p) => p.id === providerId);
    if (provider) {
      if (provider.connected) {
        info('Deconnexion', `${provider.name} a ete deconnecte`);
      } else {
        success('Connexion reussie', `${provider.name} est maintenant connecte`);
      }
    }
  }, [state.providers, success, info]);

  const syncNow = useCallback((providerId: string) => {
    setState((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        p.id === providerId ? { ...p, lastSync: new Date().toISOString() } : p
      ),
      stats: {
        ...prev.stats,
        eventsSynced: prev.stats.eventsSynced + Math.floor(Math.random() * 5) + 1,
      },
    }));
    const provider = state.providers.find((p) => p.id === providerId);
    if (provider) {
      success('Synchronisation terminee', `${provider.name} synchronise avec succes`);
    }
  }, [state.providers, success]);

  const updateSyncDirection = useCallback((providerId: string, direction: SyncDirection) => {
    setState((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        p.id === providerId ? { ...p, syncDirection: direction } : p
      ),
    }));
  }, []);

  const updateSyncFrequency = useCallback((providerId: string, frequency: SyncFrequency) => {
    setState((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        p.id === providerId ? { ...p, syncFrequency: frequency } : p
      ),
    }));
  }, []);

  const toggleCalendar = useCallback((providerId: string, calendarId: string) => {
    setState((prev) => ({
      ...prev,
      providers: prev.providers.map((p) => {
        if (p.id !== providerId) return p;
        return {
          ...p,
          calendars: p.calendars.map((c) =>
            c.id === calendarId ? { ...c, enabled: !c.enabled } : c
          ),
        };
      }),
    }));
  }, []);

  // ─── Conflict settings actions ───────────────────────────────────────────

  const updateConflictStrategy = useCallback((strategy: ConflictStrategy) => {
    setState((prev) => ({
      ...prev,
      conflictSettings: { ...prev.conflictSettings, strategy },
    }));
  }, []);

  const toggleAutoBlockBusy = useCallback(() => {
    setState((prev) => ({
      ...prev,
      conflictSettings: {
        ...prev.conflictSettings,
        autoBlockBusy: !prev.conflictSettings.autoBlockBusy,
      },
    }));
  }, []);

  // ─── Copy iCal URL ──────────────────────────────────────────────────────

  const copyIcalUrl = useCallback(() => {
    navigator.clipboard.writeText(ICAL_URL).then(
      () => success('URL copiee', 'Le lien iCal a ete copie dans le presse-papiers'),
      () => notifyError('Erreur', 'Impossible de copier l\'URL')
    );
  }, [success, notifyError]);

  // ─── Derived data ──────────────────────────────────────────────────────

  const connectedCount = state.providers.filter((p) => p.connected).length;
  const lastSyncGlobal = state.providers
    .filter((p) => p.connected && p.lastSync)
    .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())[0]?.lastSync;

  // ─── Log icon helper ──────────────────────────────────────────────────

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case 'import':
        return (
          <div className={`${styles.logIcon} ${styles.logIconImport}`}>
            <ArrowDownCircle size={16} />
          </div>
        );
      case 'export':
        return (
          <div className={`${styles.logIcon} ${styles.logIconExport}`}>
            <ArrowUpCircle size={16} />
          </div>
        );
      case 'conflict':
        return (
          <div className={`${styles.logIcon} ${styles.logIconConflict}`}>
            <AlertTriangle size={16} />
          </div>
        );
      case 'error':
        return (
          <div className={`${styles.logIcon} ${styles.logIconError}`}>
            <XCircle size={16} />
          </div>
        );
    }
  };

  const getLogBadge = (type: LogType) => {
    switch (type) {
      case 'import':
        return <Badge variant="info" size="sm">Import</Badge>;
      case 'export':
        return <Badge variant="success" size="sm">Export</Badge>;
      case 'conflict':
        return <Badge variant="warning" size="sm">Conflit</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">Erreur</Badge>;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <Header
        title="Synchronisation Calendriers"
        subtitle="Connectez et synchronisez vos calendriers externes"
      />

      <div className={styles.content}>
        {/* ─── Stats ──────────────────────────────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                <CalendarSyncIcon size={20} color="var(--state-success)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{connectedCount}</span>
                <span className={styles.statLabel}>Calendriers connectes</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                <RefreshCw size={20} color="var(--state-info)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{state.stats.eventsSynced}</span>
                <span className={styles.statLabel}>Evenements synchronises</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)' }}>
                <Clock size={20} color="var(--accent-primary)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>
                  {lastSyncGlobal ? formatRelativeTime(lastSyncGlobal) : '—'}
                </span>
                <span className={styles.statLabel}>Derniere sync</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)' }}>
                <AlertTriangle size={20} color="var(--state-warning)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{state.stats.conflictsResolved}</span>
                <span className={styles.statLabel}>Conflits resolus</span>
              </div>
            </Card>
          </div>
        </div>

        {/* ─── Provider Cards ─────────────────────────────────────── */}
        <div className={styles.providersGrid}>
          {state.providers.map((provider, idx) => (
            <div
              key={provider.id}
              className={styles.animateIn}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={`${styles.providerCard} ${provider.connected ? styles.providerCardConnected : ''}`}>
                {/* Provider header */}
                <div className={styles.providerHeader}>
                  <div className={styles.providerInfo}>
                    <div className={styles.providerIcon}>{provider.icon}</div>
                    <div className={styles.providerName}>
                      <span className={styles.providerTitle}>{provider.name}</span>
                      <span className={styles.providerDescription}>{provider.description}</span>
                    </div>
                  </div>
                  <Switch
                    checked={provider.connected}
                    onChange={() => toggleConnect(provider.id)}
                  />
                </div>

                {/* Provider body */}
                <div className={styles.providerBody}>
                  {provider.connected ? (
                    <>
                      {/* Connected info */}
                      <div className={styles.connectedInfo}>
                        <div className={styles.connectedInfoText}>
                          <Badge variant="success" size="sm" dot>Connecte</Badge>
                          {provider.lastSync && (
                            <span className={styles.lastSyncText}>
                              Derniere sync : <span className={styles.lastSyncTime}>{formatTimestamp(provider.lastSync)}</span>
                            </span>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<RefreshCw size={14} />}
                          onClick={() => syncNow(provider.id)}
                        >
                          Synchroniser maintenant
                        </Button>
                      </div>

                      {/* iCal URL field (only for iCal provider) */}
                      {provider.id === 'ical' && (
                        <div className={styles.icalUrlField}>
                          <span className={styles.icalUrlLabel}>URL iCal partageable</span>
                          <div className={styles.icalUrlWrapper}>
                            <input
                              className={styles.icalUrlInput}
                              value={ICAL_URL}
                              readOnly
                              onFocus={(e) => e.target.select()}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Copy size={14} />}
                              onClick={copyIcalUrl}
                            >
                              Copier
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Settings */}
                      <div className={styles.settingsSection}>
                        {/* Sync direction */}
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>Direction de sync</span>
                          <select
                            className={styles.settingSelect}
                            value={provider.syncDirection}
                            onChange={(e) => updateSyncDirection(provider.id, e.target.value as SyncDirection)}
                          >
                            {(Object.keys(syncDirectionLabels) as SyncDirection[]).map((key) => (
                              <option key={key} value={key}>{syncDirectionLabels[key]}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sync frequency */}
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>Frequence de sync</span>
                          <select
                            className={styles.settingSelect}
                            value={provider.syncFrequency}
                            onChange={(e) => updateSyncFrequency(provider.id, e.target.value as SyncFrequency)}
                          >
                            {(Object.keys(syncFrequencyLabels) as SyncFrequency[]).map((key) => (
                              <option key={key} value={key}>{syncFrequencyLabels[key]}</option>
                            ))}
                          </select>
                        </div>

                        {/* Calendars to sync */}
                        <div className={styles.calendarsGrid}>
                          <span className={styles.calendarsLabel}>Calendriers a synchroniser</span>
                          <div className={styles.calendarCheckboxes}>
                            {provider.calendars.map((cal) => (
                              <Checkbox
                                key={cal.id}
                                label={cal.name}
                                size="sm"
                                checked={cal.enabled}
                                onChange={() => toggleCalendar(provider.id, cal.id)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.disconnectedMessage}>
                      <Link2 size={32} />
                      <p>Connectez {provider.name} pour commencer la synchronisation</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Conflict Resolution + Settings ──────────────────────── */}
        <div className={styles.twoColumns}>
          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Resolution de conflits</h3>
                <p className={styles.sectionSubtitle}>Gerez les chevauchements entre calendriers</p>
              </div>
              <Shield size={20} color="var(--text-tertiary)" />
            </div>
            <div className={styles.conflictSettings}>
              <div className={styles.conflictRow}>
                <div className={styles.conflictRowInfo}>
                  <span className={styles.conflictRowTitle}>Strategie de resolution</span>
                  <span className={styles.conflictRowSubtitle}>
                    Que faire en cas de conflit de reservation
                  </span>
                </div>
                <select
                  className={styles.settingSelect}
                  value={state.conflictSettings.strategy}
                  onChange={(e) => updateConflictStrategy(e.target.value as ConflictStrategy)}
                >
                  {(Object.keys(conflictStrategyLabels) as ConflictStrategy[]).map((key) => (
                    <option key={key} value={key}>{conflictStrategyLabels[key]}</option>
                  ))}
                </select>
              </div>
              <div className={styles.conflictRow}>
                <div className={styles.conflictRowInfo}>
                  <span className={styles.conflictRowTitle}>Bloquer les creneaux occupes</span>
                  <span className={styles.conflictRowSubtitle}>
                    Marquer automatiquement les creneaux externes comme indisponibles
                  </span>
                </div>
                <Switch
                  checked={state.conflictSettings.autoBlockBusy}
                  onChange={toggleAutoBlockBusy}
                />
              </div>
            </div>
          </Card>

          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Apercu rapide</h3>
                <p className={styles.sectionSubtitle}>Resume de la configuration active</p>
              </div>
              <ToggleLeft size={20} color="var(--text-tertiary)" />
            </div>
            <div className={styles.conflictSettings}>
              <div className={styles.conflictRow}>
                <div className={styles.conflictRowInfo}>
                  <span className={styles.conflictRowTitle}>Fournisseurs connectes</span>
                  <span className={styles.conflictRowSubtitle}>
                    {state.providers.filter((p) => p.connected).map((p) => p.name).join(', ') || 'Aucun'}
                  </span>
                </div>
                <Badge variant="default" size="sm">{connectedCount}/{state.providers.length}</Badge>
              </div>
              <div className={styles.conflictRow}>
                <div className={styles.conflictRowInfo}>
                  <span className={styles.conflictRowTitle}>Sync bidirectionnelle</span>
                  <span className={styles.conflictRowSubtitle}>
                    {state.providers.filter((p) => p.connected && p.syncDirection === 'bidirectional').length} fournisseur(s)
                  </span>
                </div>
                <ArrowLeftRight size={18} color="var(--text-tertiary)" />
              </div>
              <div className={styles.conflictRow}>
                <div className={styles.conflictRowInfo}>
                  <span className={styles.conflictRowTitle}>Strategie active</span>
                  <span className={styles.conflictRowSubtitle}>
                    {conflictStrategyLabels[state.conflictSettings.strategy]}
                  </span>
                </div>
                <Check size={18} color="var(--state-success)" />
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Sync History / Log ──────────────────────────────────── */}
        <Card padding="lg" className={styles.logContainer}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Historique de synchronisation</h3>
              <p className={styles.sectionSubtitle}>Les 10 dernieres operations</p>
            </div>
          </div>
          <div className={styles.logList}>
            {state.syncLog.map((entry, idx) => (
              <div
                key={entry.id}
                className={`${styles.logItem} ${styles.animateInLeft}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {getLogIcon(entry.type)}
                <div className={styles.logContent}>
                  <span className={styles.logTitle}>{entry.title}</span>
                  <span className={styles.logDescription}>{entry.description}</span>
                </div>
                {getLogBadge(entry.type)}
                <span className={styles.logTimestamp}>
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
