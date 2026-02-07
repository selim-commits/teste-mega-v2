import { useState } from 'react';
import { motion } from 'framer-motion';
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
import styles from './SettingsPage.module.css';

const defaultSchedule = [
  { day: 'Lundi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Mardi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Mercredi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Jeudi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Vendredi', enabled: true, start: '09:00', end: '18:00' },
  { day: 'Samedi', enabled: false, start: '10:00', end: '16:00' },
  { day: 'Dimanche', enabled: false, start: '', end: '' },
];

export function Availability() {
  const [schedule, setSchedule] = useState(defaultSchedule);

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <Clock size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>45h</span>
                <span className={styles.statLabel}>Heures/semaine</span>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <Calendar size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>5</span>
                <span className={styles.statLabel}>Jours ouverts</span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Weekly Schedule */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Horaires hebdomadaires</h3>
            <Button variant="secondary" size="sm" icon={<Copy size={16} />}>
              Dupliquer
            </Button>
          </div>

          <div className={styles.scheduleGrid}>
            {schedule.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={styles.scheduleRow}
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
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Exceptions */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Exceptions & Conges</h3>
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
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
          <Button variant="primary" icon={<Check size={16} />}>
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
