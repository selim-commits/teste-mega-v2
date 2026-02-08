import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../stores/uiStore';
import type { BusinessHours, DayHours } from './types';
import { defaultBusinessHours } from './types';
import styles from '../Settings.module.css';

const STORAGE_KEY = 'rooom-settings-hours';

const dayLabels: Record<keyof BusinessHours, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

function loadFromStorage(): BusinessHours | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as BusinessHours;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(data: BusinessHours): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface BusinessHoursSectionProps {
  studioId: string;
}

export function BusinessHoursSection({ studioId: _studioId }: BusinessHoursSectionProps) {
  const { success, error: notifyError } = useNotifications();
  const [hours, setHours] = useState<BusinessHours>(() => {
    return loadFromStorage() || defaultBusinessHours;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state on mount from localStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setHours(stored);
    }
  }, []);

  const updateDay = (day: keyof BusinessHours, updates: Partial<DayHours>) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const handleSave = () => {
    // Validate: enabled days must have open/close times
    for (const day of Object.keys(hours) as Array<keyof BusinessHours>) {
      if (hours[day].enabled) {
        if (!hours[day].openTime || !hours[day].closeTime) {
          notifyError(
            'Erreur de validation',
            `Veuillez definir les heures d'ouverture et de fermeture pour ${dayLabels[day]}.`
          );
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      saveToStorage(hours);
      success(
        'Horaires mis a jour',
        "Les heures d'ouverture ont ete enregistrees."
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder les horaires.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Horaires d'ouverture</h2>
          <p className={styles.sectionDescription}>
            Definissez vos heures d'ouverture hebdomadaires
          </p>
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.scheduleList}>
            {(Object.keys(hours) as Array<keyof BusinessHours>).map((day) => (
              <div key={day} className={styles.scheduleItem}>
                <div className={styles.scheduleDay}>
                  <label className={styles.toggle} aria-label={`Activer ${dayLabels[day]}`}>
                    <input
                      type="checkbox"
                      checked={hours[day].enabled}
                      onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                  <span className={hours[day].enabled ? styles.dayLabel : styles.dayLabelDisabled}>
                    {dayLabels[day]}
                  </span>
                </div>
                {hours[day].enabled ? (
                  <div className={styles.scheduleHoursContainer}>
                    <div className={styles.scheduleHours}>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={hours[day].openTime}
                        onChange={(e) => updateDay(day, { openTime: e.target.value })}
                      />
                      <span className={styles.timeSeparator}>a</span>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={hours[day].closeTime}
                        onChange={(e) => updateDay(day, { closeTime: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.splitButton} ${hours[day].splitEnabled ? styles.splitButtonActive : ''}`}
                      onClick={() => updateDay(day, { splitEnabled: !hours[day].splitEnabled })}
                    >
                      + Pause
                    </button>
                    {hours[day].splitEnabled && (
                      <div className={styles.scheduleHours}>
                        <span className={styles.splitLabel}>Pause:</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={hours[day].splitStartTime}
                          onChange={(e) => updateDay(day, { splitStartTime: e.target.value })}
                        />
                        <span className={styles.timeSeparator}>a</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={hours[day].splitEndTime}
                          onChange={(e) => updateDay(day, { splitEndTime: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className={styles.closedLabel}>Ferme</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isSaving}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
