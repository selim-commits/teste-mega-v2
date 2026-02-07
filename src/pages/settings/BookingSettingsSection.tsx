import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { DEMO_STUDIO_ID } from '../../stores/authStore';
import {
  useSettings,
  useUpdateBookingSettings,
} from '../../hooks/useSettings';
import type { BookingSettings } from './types';
import { defaultBookingSettings } from './types';
import styles from '../Settings.module.css';

const durationOptions = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 heure' },
  { value: '120', label: '2 heures' },
  { value: '240', label: 'Demi-journee (4h)' },
  { value: '480', label: 'Journee complete (8h)' },
];

const bufferOptions = [
  { value: '0', label: 'Pas de tampon' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 heure' },
];

const minAdvanceOptions = [
  { value: '1', label: '1 heure' },
  { value: '2', label: '2 heures' },
  { value: '24', label: '24 heures' },
  { value: '48', label: '48 heures' },
  { value: '168', label: '1 semaine' },
];

const maxAdvanceOptions = [
  { value: '7', label: '1 semaine' },
  { value: '14', label: '2 semaines' },
  { value: '30', label: '1 mois' },
  { value: '90', label: '3 mois' },
  { value: '180', label: '6 mois' },
  { value: '365', label: '1 an' },
];

export function BookingSettingsSection() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<BookingSettings>(defaultBookingSettings);
  const { data: studioSettings } = useSettings(DEMO_STUDIO_ID);
  const updateBookingSettings = useUpdateBookingSettings(DEMO_STUDIO_ID);

  // Sync form with fetched data (React recommended pattern for prop-driven state)
  const [prevStudioSettings, setPrevStudioSettings] = useState(studioSettings);
  if (studioSettings !== prevStudioSettings) {
    setPrevStudioSettings(studioSettings);
    if (studioSettings?.booking) {
      const b = studioSettings.booking;
      setSettings({
        defaultDuration: b.defaultDuration?.toString() ?? defaultBookingSettings.defaultDuration,
        bufferTime: b.bufferTime?.toString() ?? defaultBookingSettings.bufferTime,
        minAdvanceTime: b.minAdvanceTime?.toString() ?? defaultBookingSettings.minAdvanceTime,
        maxAdvanceTime: b.maxAdvanceTime?.toString() ?? defaultBookingSettings.maxAdvanceTime,
        cancellationPolicy: b.cancellationPolicy ?? defaultBookingSettings.cancellationPolicy,
      });
    }
  }

  const handleSave = async () => {
    try {
      await updateBookingSettings.mutateAsync({
        defaultDuration: parseInt(settings.defaultDuration),
        bufferTime: parseInt(settings.bufferTime),
        minAdvanceTime: parseInt(settings.minAdvanceTime),
        maxAdvanceTime: parseInt(settings.maxAdvanceTime),
        cancellationPolicy: settings.cancellationPolicy,
      });
      addToast({
        title: 'Parametres mis a jour',
        description: 'Les parametres de reservation ont ete enregistres.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les parametres.',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const isLoading = updateBookingSettings.isPending;

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Parametres de reservation</h2>
          <p className={styles.sectionDescription}>
            Configurez les regles de reservation de votre studio
          </p>
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.formRow}>
            <Select
              label="Duree par defaut"
              options={durationOptions}
              value={settings.defaultDuration}
              onChange={(value) => setSettings(prev => ({ ...prev, defaultDuration: value }))}
              fullWidth
            />
            <Select
              label="Temps tampon entre reservations"
              options={bufferOptions}
              value={settings.bufferTime}
              onChange={(value) => setSettings(prev => ({ ...prev, bufferTime: value }))}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <Select
              label="Delai minimum avant reservation"
              options={minAdvanceOptions}
              value={settings.minAdvanceTime}
              onChange={(value) => setSettings(prev => ({ ...prev, minAdvanceTime: value }))}
              fullWidth
            />
            <Select
              label="Delai maximum avant reservation"
              options={maxAdvanceOptions}
              value={settings.maxAdvanceTime}
              onChange={(value) => setSettings(prev => ({ ...prev, maxAdvanceTime: value }))}
              fullWidth
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="booking-cancellation-policy">Politique d'annulation</label>
            <textarea
              id="booking-cancellation-policy"
              className={styles.textarea}
              placeholder="Decrivez votre politique d'annulation..."
              rows={4}
              value={settings.cancellationPolicy}
              onChange={(e) => setSettings(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
            />
            <span className={styles.hint}>
              Cette politique sera affichee aux clients lors de la reservation.
            </span>
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
