import { useState } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Checkbox';
import { useNotifications } from '../stores/uiStore';
import styles from './SettingsPage.module.css';

const STORAGE_KEY = 'rooom_availability';

interface ScheduleDay {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

const defaultSchedule: ScheduleDay[] = [
  { day: 'Lundi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Mardi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Mercredi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Jeudi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Vendredi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Samedi', enabled: false, start: '10:00', end: '16:00' },
  { day: 'Dimanche', enabled: false, start: '', end: '' },
];

function loadSchedule(): ScheduleDay[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as ScheduleDay[];
  } catch {
    // ignore parse errors
  }
  return defaultSchedule;
}

export function Availability() {
  const [schedule, setSchedule] = useState(loadSchedule);
  const { success, info } = useNotifications();

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  return (
    <div className={styles.page}>
      <Header
        title="Disponibilite"
        subtitle="Configurez vos horaires d'ouverture"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <Clock size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>45h</span>
                <span className={styles.statLabel}>Heures/semaine</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <Calendar size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>5</span>
                <span className={styles.statLabel}>Jours ouverts</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Weekly Schedule */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Horaires hebdomadaires</h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy size={16} />}
              onClick={() => {
                const firstEnabled = schedule.find((d) => d.enabled);
                if (firstEnabled) {
                  const duplicated = schedule.map((d) => ({
                    ...d,
                    start: firstEnabled.start,
                    end: firstEnabled.end,
                    enabled: firstEnabled.enabled,
                  }));
                  setSchedule(duplicated);
                  info('Horaires dupliques', 'Les horaires du premier jour actif ont ete appliques a tous les jours');
                }
              }}
            >
              Dupliquer
            </Button>
          </div>

          <div className={styles.scheduleGrid}>
            {schedule.map((day, index) => (
              <div
                key={day.day}
                className={`${styles.scheduleRow} ${styles.animateInLeft}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className={styles.scheduleDay}>{day.day}</span>
                <Switch
                  checked={day.enabled}
                  onChange={() => toggleDay(index)}
                />
                {day.enabled ? (
                  <div className={styles.scheduleTime}>
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => {
                        const newSchedule = [...schedule];
                        newSchedule[index].start = e.target.value;
                        setSchedule(newSchedule);
                      }}
                      style={{
                        padding: 'var(--space-2)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <span>a</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => {
                        const newSchedule = [...schedule];
                        newSchedule[index].end = e.target.value;
                        setSchedule(newSchedule);
                      }}
                      style={{
                        padding: 'var(--space-2)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                ) : (
                  <span className={styles.scheduleClosed}>Ferme</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Exceptions */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Exceptions & Conges</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => info('Fonctionnalite bientot disponible', 'La gestion des exceptions sera disponible prochainement')}
            >
              Ajouter
            </Button>
          </div>

          <div className={styles.emptyState}>
            <Calendar size={48} />
            <h3>Aucune exception</h3>
            <p>Ajoutez des jours feries ou des periodes de vacances</p>
          </div>
        </Card>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
              success('Modifications enregistrees', 'Vos horaires de disponibilite ont ete sauvegardes');
            }}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
