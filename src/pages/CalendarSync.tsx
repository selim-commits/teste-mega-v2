import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarSync as CalendarSyncIcon,
  Check,
  RefreshCw,
  Plus,
  Settings,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import styles from './SettingsPage.module.css';

interface SyncedCalendar {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'outlook' | 'apple';
  lastSync: string;
  twoWaySync: boolean;
  status: 'synced' | 'error' | 'syncing';
}

const syncedCalendars: SyncedCalendar[] = [
  {
    id: '1',
    name: 'Calendrier principal',
    email: 'john@example.com',
    provider: 'google',
    lastSync: '2024-01-15T10:30:00',
    twoWaySync: true,
    status: 'synced',
  },
  {
    id: '2',
    name: 'Travail',
    email: 'john@company.com',
    provider: 'outlook',
    lastSync: '2024-01-15T09:00:00',
    twoWaySync: false,
    status: 'synced',
  },
];

const providerIcons = {
  google: '📅',
  outlook: '📆',
  apple: '🍎',
};

const providerNames = {
  google: 'Google Calendar',
  outlook: 'Outlook',
  apple: 'iCloud Calendar',
};

export function CalendarSync() {
  const [calendars, setCalendars] = useState(syncedCalendars);

  const toggleTwoWaySync = (id: string) => {
    setCalendars((prev) =>
      prev.map((cal) =>
        cal.id === id ? { ...cal, twoWaySync: !cal.twoWaySync } : cal
      )
    );
  };

  return (
    <div className={styles.page}>
      <Header
        title="Synchronisation Calendriers"
        subtitle="Connectez et synchronisez vos calendriers externes"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <Check size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{calendars.length}</span>
                <span className={styles.statLabel}>Calendriers connectes</span>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <RefreshCw size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{calendars.filter((c) => c.twoWaySync).length}</span>
                <span className={styles.statLabel}>Sync bidirectionnelle</span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Connected Calendars */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Calendriers connectes</h3>
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
              Ajouter un calendrier
            </Button>
          </div>

          {calendars.length > 0 ? (
            <div className={styles.list}>
              {calendars.map((calendar) => (
                <motion.div
                  key={calendar.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.listItem}
                >
                  <div className={styles.listItemInfo}>
                    <div className={styles.listItemIcon} style={{ fontSize: '20px' }}>
                      {providerIcons[calendar.provider]}
                    </div>
                    <div className={styles.listItemText}>
                      <span className={styles.listItemTitle}>{calendar.name}</span>
                      <span className={styles.listItemSubtitle}>
                        {providerNames[calendar.provider]} • {calendar.email}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    {calendar.status === 'synced' && (
                      <Badge variant="success" size="sm" dot>
                        Synchronise
                      </Badge>
                    )}
                    {calendar.status === 'error' && (
                      <Badge variant="error" size="sm">
                        <AlertCircle size={12} />
                        Erreur
                      </Badge>
                    )}
                    {calendar.status === 'syncing' && (
                      <Badge variant="info" size="sm">
                        <RefreshCw size={12} className="animate-spin" />
                        Sync...
                      </Badge>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        Sync bidirectionnelle
                      </span>
                      <Switch
                        checked={calendar.twoWaySync}
                        onChange={() => toggleTwoWaySync(calendar.id)}
                      />
                    </div>

                    <div className={styles.listItemActions}>
                      <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />}>
                        Sync
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Settings size={14} />} />
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <CalendarSyncIcon size={48} />
              <h3>Aucun calendrier connecte</h3>
              <p>Connectez vos calendriers pour synchroniser automatiquement vos reservations</p>
              <Button variant="primary" icon={<Plus size={16} />}>
                Connecter un calendrier
              </Button>
            </div>
          )}
        </Card>

        {/* Sync Settings */}
        <Card padding="lg" className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Parametres de synchronisation</h3>

          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Bloquer les creneaux occupes</span>
                  <span className={styles.listItemSubtitle}>
                    Marquer automatiquement les creneaux comme indisponibles
                  </span>
                </div>
              </div>
              <Switch checked={true} onChange={() => {}} />
            </div>

            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Ajouter les reservations au calendrier</span>
                  <span className={styles.listItemSubtitle}>
                    Creer automatiquement des evenements pour chaque reservation
                  </span>
                </div>
              </div>
              <Switch checked={true} onChange={() => {}} />
            </div>

            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Frequence de synchronisation</span>
                  <span className={styles.listItemSubtitle}>
                    Toutes les 15 minutes
                  </span>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Modifier
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
