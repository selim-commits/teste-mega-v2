import { useState } from 'react';
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
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Checkbox';
import { useToast } from '../components/ui/Toast';
import styles from './SettingsPage.module.css';

interface AlertSetting {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
  sms: boolean;
}

const alertSettings: AlertSetting[] = [
  {
    id: 'new-booking',
    name: 'Nouvelle reservation',
    description: 'Quand un client effectue une reservation',
    icon: Calendar,
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'booking-cancelled',
    name: 'Annulation',
    description: 'Quand une reservation est annulee',
    icon: AlertTriangle,
    email: true,
    push: true,
    sms: true,
  },
  {
    id: 'payment-received',
    name: 'Paiement recu',
    description: 'Quand un paiement est effectue',
    icon: CreditCard,
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'new-client',
    name: 'Nouveau client',
    description: 'Quand un nouveau client s\'inscrit',
    icon: Users,
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'reminder-upcoming',
    name: 'Rappel prochain RDV',
    description: '15 minutes avant chaque rendez-vous',
    icon: Clock,
    email: false,
    push: true,
    sms: false,
  },
];

const STORAGE_KEY = 'rooom_alert_prefs';

interface SavedAlertPrefs {
  alerts: Array<{ id: string; email: boolean; push: boolean; sms: boolean }>;
  quietHours: boolean;
}

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

function applyPrefsToAlerts(defaults: AlertSetting[], saved: SavedAlertPrefs | null): AlertSetting[] {
  if (!saved) return defaults;
  return defaults.map((alert) => {
    const savedAlert = saved.alerts.find((a) => a.id === alert.id);
    if (savedAlert) {
      return { ...alert, email: savedAlert.email, push: savedAlert.push, sms: savedAlert.sms };
    }
    return alert;
  });
}

export function AlertNotifications() {
  const savedPrefs = loadSavedPrefs();
  const [alerts, setAlerts] = useState(() => applyPrefsToAlerts(alertSettings, savedPrefs));
  const [quietHours, setQuietHours] = useState(() => savedPrefs?.quietHours ?? true);
  const { addToast } = useToast();

  const toggleChannel = (id: string, channel: 'email' | 'push' | 'sms') => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, [channel]: !alert[channel] } : alert
      )
    );
  };

  const handleSavePreferences = () => {
    try {
      const prefsToSave: SavedAlertPrefs = {
        alerts: alerts.map(({ id, email, push, sms }) => ({ id, email, push, sms })),
        quietHours,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsToSave));
      addToast({
        title: 'Preferences enregistrees',
        description: 'Vos preferences d\'alertes ont ete sauvegardees avec succes.',
        variant: 'success',
        duration: 3000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les preferences.',
        variant: 'error',
        duration: 4000,
      });
    }
  };

  const activeAlerts = alerts.filter((a) => a.email || a.push || a.sms).length;

  return (
    <div className={styles.page}>
      <Header
        title="Alertes reservations"
        subtitle="Configurez vos notifications en temps reel"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <BellRing size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeAlerts}</span>
                <span className={styles.statLabel}>Alertes actives</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <Bell size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>24</span>
                <span className={styles.statLabel}>Recues aujourd'hui</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Settings */}
        <Card padding="lg" className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Parametres rapides</h3>

          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemIcon}>
                  <BellOff size={20} />
                </div>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Mode silencieux</span>
                  <span className={styles.listItemSubtitle}>
                    Pas de notifications entre 22h et 8h
                  </span>
                </div>
              </div>
              <Switch
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
              />
            </div>
          </div>
        </Card>

        {/* Alert Settings */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Types d'alertes</h3>
          </div>

          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px 80px',
            gap: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-default)',
            marginBottom: 'var(--space-2)',
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              Evenement
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <Mail size={14} style={{ display: 'inline' }} /> Email
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <Bell size={14} style={{ display: 'inline' }} /> Push
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <Smartphone size={14} style={{ display: 'inline' }} /> SMS
            </span>
          </div>

          <div className={styles.list}>
            {alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={styles.animateInLeft}
                style={{ animationDelay: `${index * 50}ms`,
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 80px',
                  gap: 'var(--space-4)',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemIcon}>
                    <alert.icon size={20} />
                  </div>
                  <div className={styles.listItemText}>
                    <span className={styles.listItemTitle}>{alert.name}</span>
                    <span className={styles.listItemSubtitle}>{alert.description}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Switch
                    checked={alert.email}
                    onChange={() => toggleChannel(alert.id, 'email')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Switch
                    checked={alert.push}
                    onChange={() => toggleChannel(alert.id, 'push')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Switch
                    checked={alert.sms}
                    onChange={() => toggleChannel(alert.id, 'sms')}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <Button variant="primary" icon={<Check size={16} />} onClick={handleSavePreferences}>
            Enregistrer les preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
