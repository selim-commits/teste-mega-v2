import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotifications } from '../../stores/uiStore';
import type { BookingSettings } from './types';
import { defaultBookingSettings } from './types';
import styles from '../Settings.module.css';

const STORAGE_KEY = 'rooom-settings-booking';

const minDurationOptions = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 heure' },
  { value: '120', label: '2 heures' },
  { value: '180', label: '3 heures' },
  { value: '240', label: '4 heures' },
];

const maxDurationOptions = [
  { value: '60', label: '1 heure' },
  { value: '120', label: '2 heures' },
  { value: '180', label: '3 heures' },
  { value: '240', label: '4 heures' },
  { value: '480', label: 'Journee complete (8h)' },
];

const bufferOptions = [
  { value: '0', label: '0 minute' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
];

function loadFromStorage(): BookingSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as BookingSettings;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(data: BookingSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface BookingSettingsSectionProps {
  studioId: string;
}

export function BookingSettingsSection({ studioId: _studioId }: BookingSettingsSectionProps) {
  const { success, error: notifyError } = useNotifications();
  const [settings, setSettings] = useState<BookingSettings>(() => {
    return loadFromStorage() || defaultBookingSettings;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state on mount from localStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setSettings(stored);
    }
  }, []);

  const handleSave = () => {
    // Validate deposit percentage
    if (settings.depositRequired) {
      const pct = parseInt(settings.depositPercentage);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        notifyError(
          'Erreur de validation',
          'Le pourcentage d\'acompte doit etre entre 1 et 100.'
        );
        return;
      }
    }

    // Validate min < max duration
    if (parseInt(settings.defaultDuration) > parseInt(settings.maxDuration)) {
      notifyError(
        'Erreur de validation',
        'La duree minimum ne peut pas depasser la duree maximum.'
      );
      return;
    }

    setIsSaving(true);
    try {
      saveToStorage(settings);
      success(
        'Parametres mis a jour',
        'Les parametres de reservation ont ete enregistres.'
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder les parametres.'
      );
    } finally {
      setIsSaving(false);
    }
  };

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
          <h3 className={styles.subsectionTitle}>Durees</h3>

          <div className={styles.formRow}>
            <Select
              label="Duree minimum de reservation"
              options={minDurationOptions}
              value={settings.defaultDuration}
              onChange={(value) => setSettings(prev => ({ ...prev, defaultDuration: value }))}
              fullWidth
            />
            <Select
              label="Duree maximum de reservation"
              options={maxDurationOptions}
              value={settings.maxDuration}
              onChange={(value) => setSettings(prev => ({ ...prev, maxDuration: value }))}
              fullWidth
            />
          </div>

          <Select
            label="Temps tampon entre reservations"
            options={bufferOptions}
            value={settings.bufferTime}
            onChange={(value) => setSettings(prev => ({ ...prev, bufferTime: value }))}
            fullWidth
          />
        </Card>

        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Politique d'annulation</h3>

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
        </Card>

        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Acompte et confirmation</h3>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Acompte requis</span>
                <span className={styles.notificationDescription}>
                  Demander un acompte lors de la reservation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Acompte requis">
                <input
                  type="checkbox"
                  checked={settings.depositRequired}
                  onChange={(e) => setSettings(prev => ({ ...prev, depositRequired: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {settings.depositRequired && (
              <div className={styles.depositPercentageRow}>
                <Input
                  label="Pourcentage d'acompte"
                  type="number"
                  placeholder="30"
                  value={settings.depositPercentage}
                  onChange={(e) => setSettings(prev => ({ ...prev, depositPercentage: e.target.value }))}
                  hint="Pourcentage du montant total (1-100)"
                />
              </div>
            )}

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Confirmation automatique</span>
                <span className={styles.notificationDescription}>
                  Confirmer automatiquement les reservations sans validation manuelle
                </span>
              </div>
              <label className={styles.toggle} aria-label="Confirmation automatique">
                <input
                  type="checkbox"
                  checked={settings.autoConfirm}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoConfirm: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
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
