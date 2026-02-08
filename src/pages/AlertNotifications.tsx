import { useState, useCallback } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Mail,
  Smartphone,
  Check,
  Calendar,
  CreditCard,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Send,
  X,
  CheckCircle,
  XCircle,
  Activity,
  Shield,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch, Checkbox } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import styles from './AlertNotifications.module.css';

// ─── Types ───────────────────────────────────────────────────────────

type Priority = 'haute' | 'normale' | 'basse';
type Channel = 'email' | 'push' | 'sms';

interface AlertCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
  sms: boolean;
  priority: Priority;
}

interface CustomRule {
  id: string;
  trigger: string;
  channels: Channel[];
  recipients: string;
}

interface QuietHoursConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: boolean[];
  urgentException: boolean;
}

interface NotificationHistoryItem {
  id: string;
  type: 'reservation' | 'annulation' | 'paiement' | 'rappel' | 'equipement' | 'equipe';
  message: string;
  channel: Channel;
  timestamp: string;
  status: 'envoye' | 'echoue';
}

interface SavedAlertPrefs {
  categories: Array<{
    id: string;
    email: boolean;
    push: boolean;
    sms: boolean;
    priority: Priority;
  }>;
  rules: CustomRule[];
  quietHours: QuietHoursConfig;
  history: NotificationHistoryItem[];
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_KEY = 'rooom-alert-notifications';

const TRIGGER_OPTIONS = [
  { value: 'Nouvelle réservation', label: 'Nouvelle réservation' },
  { value: 'Annulation', label: 'Annulation' },
  { value: 'Paiement reçu', label: 'Paiement reçu' },
  { value: 'Équipement indisponible', label: 'Équipement indisponible' },
  { value: 'Membre absent', label: 'Membre absent' },
];

const DAYS_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const DEFAULT_CATEGORIES: AlertCategory[] = [
  {
    id: 'new-booking',
    name: 'Nouvelles réservations',
    description: 'Quand un client effectue une réservation',
    icon: Calendar,
    email: true,
    push: true,
    sms: false,
    priority: 'haute',
  },
  {
    id: 'booking-cancelled',
    name: 'Annulations',
    description: 'Quand une réservation est annulée',
    icon: AlertTriangle,
    email: true,
    push: true,
    sms: true,
    priority: 'haute',
  },
  {
    id: 'payment-received',
    name: 'Paiements',
    description: 'Quand un paiement est effectué',
    icon: CreditCard,
    email: true,
    push: false,
    sms: false,
    priority: 'normale',
  },
  {
    id: 'reminder',
    name: 'Rappels',
    description: '15 minutes avant chaque rendez-vous',
    icon: Clock,
    email: false,
    push: true,
    sms: false,
    priority: 'normale',
  },
  {
    id: 'equipment',
    name: 'Équipement',
    description: 'Problèmes ou indisponibilité d\'équipement',
    icon: Wrench,
    email: true,
    push: true,
    sms: false,
    priority: 'basse',
  },
  {
    id: 'team',
    name: 'Équipe',
    description: 'Absences et changements d\'équipe',
    icon: Users,
    email: true,
    push: false,
    sms: false,
    priority: 'normale',
  },
];

const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  enabled: true,
  startTime: '22:00',
  endTime: '08:00',
  days: [true, true, true, true, true, true, true],
  urgentException: true,
};

const MOCK_HISTORY: NotificationHistoryItem[] = [
  { id: 'h1', type: 'reservation', message: 'Nouvelle réservation de Marie Dupont — Studio A, 14h-16h', channel: 'email', timestamp: '2026-02-08T10:30:00', status: 'envoye' },
  { id: 'h2', type: 'paiement', message: 'Paiement de 250 € reçu de Jean Martin', channel: 'push', timestamp: '2026-02-08T09:45:00', status: 'envoye' },
  { id: 'h3', type: 'annulation', message: 'Annulation de la réservation #1247 par Sophie Leroy', channel: 'sms', timestamp: '2026-02-08T09:15:00', status: 'envoye' },
  { id: 'h4', type: 'rappel', message: 'Rappel : séance photo dans 15 min — Studio B', channel: 'push', timestamp: '2026-02-08T08:45:00', status: 'envoye' },
  { id: 'h5', type: 'equipement', message: 'Flash Profoto A1 signalé comme indisponible', channel: 'email', timestamp: '2026-02-07T17:30:00', status: 'echoue' },
  { id: 'h6', type: 'equipe', message: 'Lucas Bernard absent demain — remplacement requis', channel: 'email', timestamp: '2026-02-07T16:00:00', status: 'envoye' },
  { id: 'h7', type: 'reservation', message: 'Nouvelle réservation de Pierre Morel — Studio C, 10h-12h', channel: 'push', timestamp: '2026-02-07T14:20:00', status: 'envoye' },
  { id: 'h8', type: 'paiement', message: 'Paiement de 180 € reçu de Claire Fontaine', channel: 'email', timestamp: '2026-02-07T11:10:00', status: 'envoye' },
  { id: 'h9', type: 'annulation', message: 'Annulation de la réservation #1243 par Thomas Petit', channel: 'email', timestamp: '2026-02-07T10:05:00', status: 'echoue' },
  { id: 'h10', type: 'rappel', message: 'Rappel : tournage vidéo dans 15 min — Studio A', channel: 'sms', timestamp: '2026-02-07T08:45:00', status: 'envoye' },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function loadSavedPrefs(): SavedAlertPrefs | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedAlertPrefs;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

function applyPrefsToCategories(
  defaults: AlertCategory[],
  saved: SavedAlertPrefs | null
): AlertCategory[] {
  if (!saved) return defaults;
  return defaults.map((cat) => {
    const savedCat = saved.categories.find((c) => c.id === cat.id);
    if (savedCat) {
      return {
        ...cat,
        email: savedCat.email,
        push: savedCat.push,
        sms: savedCat.sms,
        priority: savedCat.priority,
      };
    }
    return cat;
  });
}

function generateId(): string {
  return crypto.randomUUID();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getChannelLabel(channel: Channel): string {
  switch (channel) {
    case 'email': return 'Email';
    case 'push': return 'Push';
    case 'sms': return 'SMS';
  }
}

function getChannelIcon(channel: Channel) {
  switch (channel) {
    case 'email': return Mail;
    case 'push': return Bell;
    case 'sms': return Smartphone;
  }
}

function getHistoryTypeIcon(type: NotificationHistoryItem['type']) {
  switch (type) {
    case 'reservation': return Calendar;
    case 'annulation': return AlertTriangle;
    case 'paiement': return CreditCard;
    case 'rappel': return Clock;
    case 'equipement': return Wrench;
    case 'equipe': return Users;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export function AlertNotifications() {
  const savedPrefs = loadSavedPrefs();
  const { success, error: notifyError } = useNotifications();

  // State: Categories
  const [categories, setCategories] = useState<AlertCategory[]>(() =>
    applyPrefsToCategories(DEFAULT_CATEGORIES, savedPrefs)
  );

  // State: Custom Rules
  const [rules, setRules] = useState<CustomRule[]>(() => savedPrefs?.rules ?? []);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Rule form state
  const [ruleTrigger, setRuleTrigger] = useState(TRIGGER_OPTIONS[0].value);
  const [ruleChannels, setRuleChannels] = useState<Channel[]>(['email']);
  const [ruleRecipients, setRuleRecipients] = useState('');

  // State: Quiet Hours
  const [quietHours, setQuietHours] = useState<QuietHoursConfig>(
    () => savedPrefs?.quietHours ?? DEFAULT_QUIET_HOURS
  );

  // State: History
  const [history, setHistory] = useState<NotificationHistoryItem[]>(
    () => savedPrefs?.history ?? MOCK_HISTORY
  );

  // ─── Category handlers ─────────────────────────────────────────

  const toggleChannel = useCallback((id: string, channel: Channel) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, [channel]: !cat[channel] } : cat
      )
    );
  }, []);

  const setPriority = useCallback((id: string, priority: Priority) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, priority } : cat
      )
    );
  }, []);

  // ─── Rule handlers ─────────────────────────────────────────────

  const openAddRuleModal = useCallback(() => {
    setEditingRule(null);
    setRuleTrigger(TRIGGER_OPTIONS[0].value);
    setRuleChannels(['email']);
    setRuleRecipients('');
    setRuleModalOpen(true);
  }, []);

  const openEditRuleModal = useCallback((rule: CustomRule) => {
    setEditingRule(rule);
    setRuleTrigger(rule.trigger);
    setRuleChannels([...rule.channels]);
    setRuleRecipients(rule.recipients);
    setRuleModalOpen(true);
  }, []);

  const toggleRuleChannel = useCallback((channel: Channel) => {
    setRuleChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  }, []);

  const handleSaveRule = useCallback(() => {
    if (ruleChannels.length === 0) return;

    const ruleData: CustomRule = {
      id: editingRule?.id ?? generateId(),
      trigger: ruleTrigger,
      channels: ruleChannels,
      recipients: ruleRecipients,
    };

    if (editingRule) {
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? ruleData : r)));
    } else {
      setRules((prev) => [...prev, ruleData]);
    }

    setRuleModalOpen(false);
  }, [editingRule, ruleTrigger, ruleChannels, ruleRecipients]);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirmId(null);
  }, []);

  // ─── Quiet hours handlers ──────────────────────────────────────

  const toggleQuietDay = useCallback((index: number) => {
    setQuietHours((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === index ? !d : d)),
    }));
  }, []);

  // ─── History handlers ──────────────────────────────────────────

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // ─── Save ──────────────────────────────────────────────────────

  const handleSavePreferences = useCallback(() => {
    try {
      const prefsToSave: SavedAlertPrefs = {
        categories: categories.map(({ id, email, push, sms, priority }) => ({
          id,
          email,
          push,
          sms,
          priority,
        })),
        rules,
        quietHours,
        history,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsToSave));
      success(
        'Préférences enregistrées',
        'Vos préférences d\'alertes ont été sauvegardées avec succès.'
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder les préférences.'
      );
    }
  }, [categories, rules, quietHours, history, success, notifyError]);

  // ─── Computed stats ────────────────────────────────────────────

  const activeChannels = new Set<Channel>();
  categories.forEach((c) => {
    if (c.email) activeChannels.add('email');
    if (c.push) activeChannels.add('push');
    if (c.sms) activeChannels.add('sms');
  });

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <Header
        title="Alertes & notifications"
        subtitle="Configurez vos notifications en temps réel"
      />

      <div className={styles.content}>
        {/* ─── Stats Cards ─────────────────────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: 'var(--state-info-bg)' }}
              >
                <Send size={20} color="var(--state-info)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>142</span>
                <span className={styles.statLabel}>Alertes envoyées</span>
              </div>
            </Card>
          </div>

          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: 'var(--state-success-bg)' }}
              >
                <Activity size={20} color="var(--state-success)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>98,5%</span>
                <span className={styles.statLabel}>Taux de livraison</span>
              </div>
            </Card>
          </div>

          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: 'var(--state-warning-bg)' }}
              >
                <Shield size={20} color="var(--state-warning)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{rules.length}</span>
                <span className={styles.statLabel}>Règles actives</span>
              </div>
            </Card>
          </div>

          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: 'var(--accent-primary-light)' }}
              >
                <BellRing size={20} color="var(--accent-primary)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeChannels.size}</span>
                <span className={styles.statLabel}>Canaux actifs</span>
              </div>
            </Card>
          </div>
        </div>

        {/* ─── Alert Categories ─────────────────────────────────── */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Catégories d'alertes</h3>
              <p className={styles.sectionSubtitle}>
                Activez ou désactivez les canaux de notification pour chaque catégorie
              </p>
            </div>
          </div>

          {/* Header Row */}
          <div className={styles.alertGridHeader}>
            <span className={styles.alertGridHeaderLabel}>Événement</span>
            <span className={styles.alertGridHeaderLabelCenter}>
              <Mail size={14} /> Email
            </span>
            <span className={styles.alertGridHeaderLabelCenter}>
              <Bell size={14} /> Push
            </span>
            <span className={styles.alertGridHeaderLabelCenter}>
              <Smartphone size={14} /> SMS
            </span>
            <span className={styles.alertGridHeaderLabelCenter}>Priorité</span>
          </div>

          {/* Alert Rows */}
          <div className={styles.alertGrid}>
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className={`${styles.alertRow} ${styles.animateInLeft}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.alertInfo}>
                  <div className={styles.alertIcon}>
                    <cat.icon size={20} />
                  </div>
                  <div className={styles.alertText}>
                    <span className={styles.alertName}>{cat.name}</span>
                    <span className={styles.alertDescription}>{cat.description}</span>
                  </div>
                </div>

                <div className={styles.channelToggle}>
                  <Switch
                    checked={cat.email}
                    onChange={() => toggleChannel(cat.id, 'email')}
                  />
                </div>

                <div className={styles.channelToggle}>
                  <Switch
                    checked={cat.push}
                    onChange={() => toggleChannel(cat.id, 'push')}
                  />
                </div>

                <div className={styles.channelToggle}>
                  <Switch
                    checked={cat.sms}
                    onChange={() => toggleChannel(cat.id, 'sms')}
                  />
                </div>

                <div className={styles.channelToggle}>
                  <select
                    className={styles.prioritySelect}
                    value={cat.priority}
                    onChange={(e) => setPriority(cat.id, e.target.value as Priority)}
                  >
                    <option value="haute">Haute</option>
                    <option value="normale">Normale</option>
                    <option value="basse">Basse</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ─── Custom Rules ──────────────────────────────────────── */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Règles personnalisées</h3>
              <p className={styles.sectionSubtitle}>
                Créez des règles d'alerte avancées avec des destinataires spécifiques
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={openAddRuleModal}
            >
              Ajouter une règle
            </Button>
          </div>

          {rules.length === 0 ? (
            <div className={styles.emptyRules}>
              <Shield size={32} />
              <span className={styles.emptyRulesTitle}>Aucune règle personnalisée</span>
              <span className={styles.emptyRulesText}>
                Ajoutez des règles pour envoyer des alertes ciblées à des destinataires spécifiques.
              </span>
            </div>
          ) : (
            <div className={styles.rulesList}>
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`${styles.ruleItem} ${styles.animateInLeft}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={styles.ruleInfo}>
                    <span className={styles.ruleTrigger}>{rule.trigger}</span>
                    <div className={styles.ruleDetails}>
                      {rule.channels.map((ch) => (
                        <span key={ch} className={styles.ruleChannelBadge}>
                          {(() => { const Icon = getChannelIcon(ch); return <Icon size={12} />; })()}
                          {getChannelLabel(ch)}
                        </span>
                      ))}
                      {rule.recipients && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>|</span>
                          <span>{rule.recipients}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.ruleActions}>
                    {deleteConfirmId === rule.id ? (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          Confirmer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          className={styles.ruleActionBtn}
                          onClick={() => openEditRuleModal(rule)}
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.ruleActionBtn} ${styles.ruleActionBtnDanger}`}
                          onClick={() => setDeleteConfirmId(rule.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ─── Quiet Hours ──────────────────────────────────────── */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Heures silencieuses</h3>
              <p className={styles.sectionSubtitle}>
                Suspendez les notifications pendant les heures de repos
              </p>
            </div>
          </div>

          <div className={styles.quietHoursContent}>
            {/* Enable toggle */}
            <div className={styles.quietHoursToggle}>
              <div className={styles.quietHoursToggleInfo}>
                <div className={styles.quietHoursToggleIcon}>
                  <BellOff size={20} />
                </div>
                <div className={styles.quietHoursToggleText}>
                  <span className={styles.quietHoursToggleTitle}>Mode silencieux</span>
                  <span className={styles.quietHoursToggleSubtitle}>
                    Pas de notifications pendant les heures définies
                  </span>
                </div>
              </div>
              <Switch
                checked={quietHours.enabled}
                onChange={(e) =>
                  setQuietHours((prev) => ({ ...prev, enabled: e.target.checked }))
                }
              />
            </div>

            {/* Time inputs */}
            <div className={styles.quietHoursTimeRow}>
              <span className={styles.quietHoursTimeLabel}>De</span>
              <input
                type="time"
                className={styles.quietHoursTimeInput}
                value={quietHours.startTime}
                onChange={(e) =>
                  setQuietHours((prev) => ({ ...prev, startTime: e.target.value }))
                }
                disabled={!quietHours.enabled}
              />
              <span className={styles.quietHoursTimeLabel}>À</span>
              <input
                type="time"
                className={styles.quietHoursTimeInput}
                value={quietHours.endTime}
                onChange={(e) =>
                  setQuietHours((prev) => ({ ...prev, endTime: e.target.value }))
                }
                disabled={!quietHours.enabled}
              />
            </div>

            {/* Day chips */}
            <div>
              <span className={styles.formLabel} style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
                Jours actifs
              </span>
              <div className={styles.quietHoursDays}>
                {DAYS_LABELS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    className={`${styles.quietHoursDayChip} ${
                      quietHours.days[i] ? styles.quietHoursDayChipActive : ''
                    } ${!quietHours.enabled ? styles.quietHoursDayChipDisabled : ''}`}
                    onClick={() => quietHours.enabled && toggleQuietDay(i)}
                    disabled={!quietHours.enabled}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgent exception */}
            <div className={styles.quietHoursUrgent}>
              <div className={styles.quietHoursUrgentInfo}>
                <AlertTriangle size={18} className={styles.quietHoursUrgentIcon} />
                <div className={styles.quietHoursUrgentText}>
                  <span className={styles.quietHoursUrgentTitle}>
                    Exception pour alertes urgentes
                  </span>
                  <span className={styles.quietHoursUrgentSubtitle}>
                    Les alertes haute priorité seront toujours envoyées
                  </span>
                </div>
              </div>
              <Switch
                checked={quietHours.urgentException}
                onChange={(e) =>
                  setQuietHours((prev) => ({
                    ...prev,
                    urgentException: e.target.checked,
                  }))
                }
                disabled={!quietHours.enabled}
              />
            </div>
          </div>
        </Card>

        {/* ─── Notification History ─────────────────────────────── */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Historique des notifications</h3>
              <p className={styles.sectionSubtitle}>
                Dernières notifications envoyées
              </p>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                onClick={clearHistory}
              >
                Effacer l'historique
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className={styles.emptyHistory}>
              <Bell size={32} />
              <span className={styles.emptyRulesTitle}>Aucune notification</span>
              <span className={styles.emptyRulesText}>
                L'historique est vide.
              </span>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((item, index) => {
                const TypeIcon = getHistoryTypeIcon(item.type);
                const ChannelIcon = getChannelIcon(item.channel);
                const iconClass =
                  item.status === 'envoye'
                    ? item.type === 'annulation'
                      ? styles.historyIconWarning
                      : styles.historyIconSuccess
                    : styles.historyIconError;

                return (
                  <div
                    key={item.id}
                    className={`${styles.historyItem} ${styles.animateInLeft}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={iconClass}>
                      <TypeIcon size={18} />
                    </div>
                    <div className={styles.historyContent}>
                      <span className={styles.historyMessage}>{item.message}</span>
                      <div className={styles.historyMeta}>
                        <span className={styles.historyChannel}>
                          <ChannelIcon size={12} />
                          {getChannelLabel(item.channel)}
                        </span>
                        <span className={styles.historyDot} />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                    </div>
                    {item.status === 'envoye' ? (
                      <span className={styles.historyStatusSuccess}>
                        <CheckCircle size={12} />
                        Envoyé
                      </span>
                    ) : (
                      <span className={styles.historyStatusError}>
                        <XCircle size={12} />
                        Échoué
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ─── Save Button ──────────────────────────────────────── */}
        <div className={styles.saveBar}>
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleSavePreferences}
          >
            Enregistrer les préférences
          </Button>
        </div>
      </div>

      {/* ─── Rule Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        size="md"
      >
        <ModalHeader
          title={editingRule ? 'Modifier la règle' : 'Ajouter une règle'}
          onClose={() => setRuleModalOpen(false)}
        />
        <ModalBody>
          <div className={styles.modalForm}>
            {/* Trigger */}
            <div className={styles.formField}>
              <label htmlFor="alert-rule-trigger" className={styles.formLabel}>Condition de déclenchement</label>
              <select
                id="alert-rule-trigger"
                className={styles.formSelect}
                value={ruleTrigger}
                onChange={(e) => setRuleTrigger(e.target.value)}
              >
                {TRIGGER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Channels */}
            <div className={styles.formField}>
              <label htmlFor="alert-rule-channels" className={styles.formLabel}>Canaux de notification</label>
              <input id="alert-rule-channels" type="hidden" value={ruleChannels.join(',')} />
              <div className={styles.checkboxGroup} role="group" aria-labelledby="alert-rule-channels-label">
                <Checkbox
                  label="Email"
                  checked={ruleChannels.includes('email')}
                  onChange={() => toggleRuleChannel('email')}
                />
                <Checkbox
                  label="Push"
                  checked={ruleChannels.includes('push')}
                  onChange={() => toggleRuleChannel('push')}
                />
                <Checkbox
                  label="SMS"
                  checked={ruleChannels.includes('sms')}
                  onChange={() => toggleRuleChannel('sms')}
                />
              </div>
            </div>

            {/* Recipients */}
            <div className={styles.formField}>
              <Input
                label="Destinataires"
                placeholder="email@exemple.com, autre@exemple.com"
                value={ruleRecipients}
                onChange={(e) => setRuleRecipients(e.target.value)}
                hint="Séparez les adresses email par des virgules"
                fullWidth
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setRuleModalOpen(false)}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleSaveRule}
            disabled={ruleChannels.length === 0}
          >
            {editingRule ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
