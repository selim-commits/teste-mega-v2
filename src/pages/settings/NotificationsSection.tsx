import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { DEMO_STUDIO_ID } from '../../stores/authStore';
import {
  useSettings,
  useUpdateNotificationSettings,
} from '../../hooks/useSettings';
import type { NotificationSettings } from './types';
import { defaultNotificationSettings } from './types';
import styles from '../Settings.module.css';

export function NotificationsSection() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const { data: studioSettings } = useSettings(DEMO_STUDIO_ID);
  const updateNotificationSettings = useUpdateNotificationSettings(DEMO_STUDIO_ID);

  // Sync form with fetched data (React recommended pattern for prop-driven state)
  const [prevStudioSettings, setPrevStudioSettings] = useState(studioSettings);
  if (studioSettings !== prevStudioSettings) {
    setPrevStudioSettings(studioSettings);
    if (studioSettings?.notifications) {
      const n = studioSettings.notifications;
      setSettings({
        emailEnabled: n.emailEnabled ?? defaultNotificationSettings.emailEnabled,
        smsEnabled: n.smsEnabled ?? defaultNotificationSettings.smsEnabled,
        reminder24h: n.reminder24h ?? defaultNotificationSettings.reminder24h,
        reminder48h: n.reminder48h ?? defaultNotificationSettings.reminder48h,
        reminder1Week: n.reminder1Week ?? defaultNotificationSettings.reminder1Week,
        newBookingAlert: n.newBookingAlert ?? defaultNotificationSettings.newBookingAlert,
        cancellationAlert: n.cancellationAlert ?? defaultNotificationSettings.cancellationAlert,
        paymentAlert: n.paymentAlert ?? defaultNotificationSettings.paymentAlert,
      });
    }
  }

  const handleSave = async () => {
    try {
      await updateNotificationSettings.mutateAsync(settings);
      addToast({
        title: 'Notifications mises a jour',
        description: 'Vos preferences de notifications ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les preferences.',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const isLoading = updateNotificationSettings.isPending;

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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
              <label className={styles.toggle}>
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
