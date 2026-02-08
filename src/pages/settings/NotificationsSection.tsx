import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../stores/uiStore';
import type { NotificationSettings } from './types';
import { defaultNotificationSettings } from './types';
import styles from '../Settings.module.css';

const STORAGE_KEY = 'rooom-settings-notifications';

function loadFromStorage(): NotificationSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as NotificationSettings;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(data: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface NotificationsSectionProps {
  studioId: string;
}

export function NotificationsSection({ studioId: _studioId }: NotificationsSectionProps) {
  const { success, error: notifyError } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    return loadFromStorage() || defaultNotificationSettings;
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
    setIsSaving(true);
    try {
      saveToStorage(settings);
      success(
        'Notifications mises a jour',
        'Vos preferences de notifications ont ete enregistrees.'
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder les preferences.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <p className={styles.sectionDescription}>
            Gerez vos preferences de notifications et rappels
          </p>
        </div>

        {/* Email & SMS Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Canaux de communication</h3>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Notifications par email</span>
                <span className={styles.notificationDescription}>
                  Recevez les notifications par email
                </span>
              </div>
              <label className={styles.toggle} aria-label="Notifications par email">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Notifications SMS</span>
                <span className={styles.notificationDescription}>
                  Recevez les notifications par SMS (bientot disponible)
                </span>
              </div>
              <label className={styles.toggle} aria-label="Notifications SMS">
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                  disabled
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </Card>

        {/* Reminder Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Rappels automatiques</h3>
          <p className={styles.subsectionDescription}>
            Envoyez des rappels automatiques aux clients avant leurs reservations
          </p>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Rappel 24h avant</span>
                <span className={styles.notificationDescription}>
                  Envoyer un rappel 24 heures avant la reservation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Rappel 24h avant">
                <input
                  type="checkbox"
                  checked={settings.reminder24h}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminder24h: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Rappel 48h avant</span>
                <span className={styles.notificationDescription}>
                  Envoyer un rappel 48 heures avant la reservation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Rappel 48h avant">
                <input
                  type="checkbox"
                  checked={settings.reminder48h}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminder48h: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Rappel 1 semaine avant</span>
                <span className={styles.notificationDescription}>
                  Envoyer un rappel 1 semaine avant la reservation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Rappel 1 semaine avant">
                <input
                  type="checkbox"
                  checked={settings.reminder1Week}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminder1Week: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </Card>

        {/* Alert Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Alertes d'activite</h3>
          <p className={styles.subsectionDescription}>
            Soyez informe des evenements importants
          </p>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Nouvelle reservation</span>
                <span className={styles.notificationDescription}>
                  Recevoir une alerte pour chaque nouvelle reservation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Nouvelle reservation">
                <input
                  type="checkbox"
                  checked={settings.newBookingAlert}
                  onChange={(e) => setSettings(prev => ({ ...prev, newBookingAlert: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Annulation</span>
                <span className={styles.notificationDescription}>
                  Etre prevenu en cas d'annulation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Annulation">
                <input
                  type="checkbox"
                  checked={settings.cancellationAlert}
                  onChange={(e) => setSettings(prev => ({ ...prev, cancellationAlert: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Paiement recu</span>
                <span className={styles.notificationDescription}>
                  Confirmation de reception de paiement
                </span>
              </div>
              <label className={styles.toggle} aria-label="Paiement recu">
                <input
                  type="checkbox"
                  checked={settings.paymentAlert}
                  onChange={(e) => setSettings(prev => ({ ...prev, paymentAlert: e.target.checked }))}
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
