import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { DEMO_STUDIO_ID } from '../../stores/authStore';
import {
  useSettings,
  useUpdateBusinessHours,
} from '../../hooks/useSettings';
import type { StudioSettings } from '../../services/settings';
import type { BusinessHours, DayHours } from './types';
import { defaultBusinessHours } from './types';
import styles from '../Settings.module.css';

const dayLabels: Record<keyof BusinessHours, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

export function BusinessHoursSection() {
  const { addToast } = useToast();
  const [hours, setHours] = useState<BusinessHours>(defaultBusinessHours);
  const { data: studioSettings } = useSettings(DEMO_STUDIO_ID);
  const updateBusinessHours = useUpdateBusinessHours(DEMO_STUDIO_ID);

  // Sync form with fetched data (React recommended pattern for prop-driven state)
  const [prevStudioSettings, setPrevStudioSettings] = useState(studioSettings);
  if (studioSettings !== prevStudioSettings) {
    setPrevStudioSettings(studioSettings);
    if (studioSettings?.businessHours) {
      const bh = studioSettings.businessHours;
      const mapped = { ...defaultBusinessHours };
      for (const day of Object.keys(mapped) as Array<keyof BusinessHours>) {
        if (bh[day]) {
          mapped[day] = {
            enabled: bh[day].enabled ?? mapped[day].enabled,
            openTime: bh[day].openTime ?? mapped[day].openTime,
            closeTime: bh[day].closeTime ?? mapped[day].closeTime,
            splitEnabled: bh[day].splitEnabled ?? false,
            splitStartTime: bh[day].splitStartTime ?? '',
            splitEndTime: bh[day].splitEndTime ?? '',
          };
        }
      }
      setHours(mapped);
    }
  }

  const updateDay = (day: keyof BusinessHours, updates: Partial<DayHours>) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const handleSave = async () => {
    try {
      await updateBusinessHours.mutateAsync({ ...hours } as StudioSettings['businessHours']);
      addToast({
        title: 'Horaires mis a jour',
        description: 'Les heures d\'ouverture ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les horaires.',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const isLoading = updateBusinessHours.isPending;

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
                  <label className={styles.toggle}>
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
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
