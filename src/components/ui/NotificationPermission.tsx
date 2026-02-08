import { Bell, BellOff, BellRing, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import type { PushPermissionStatus } from '../../hooks/usePushNotifications';
import styles from './NotificationPermission.module.css';

interface NotificationPermissionProps {
  isSupported: boolean;
  permissionStatus: PushPermissionStatus;
  enabled: boolean;
  onRequestPermission: () => void;
  onToggleEnabled: () => void;
}

export function NotificationPermission({
  isSupported,
  permissionStatus,
  enabled,
  onRequestPermission,
  onToggleEnabled,
}: NotificationPermissionProps) {
  if (!isSupported) {
    return (
      <div className={styles.unsupported}>
        <AlertTriangle size={20} />
        <span>
          Votre navigateur ne supporte pas les notifications push. Essayez avec Chrome, Firefox ou Edge.
        </span>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className={styles.bannerDenied}>
        <div className={styles.info}>
          <div className={styles.iconDenied}>
            <BellOff size={20} />
          </div>
          <div className={styles.textContent}>
            <span className={styles.title}>Notifications bloquées</span>
            <span className={styles.description}>
              Les notifications sont bloquées par votre navigateur. Modifiez les paramètres de votre navigateur pour les réactiver.
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <span className={styles.statusDenied}>
            <XCircle size={12} />
            Refusé
          </span>
        </div>
      </div>
    );
  }

  if (permissionStatus === 'granted') {
    return (
      <div className={styles.bannerGranted}>
        <div className={styles.info}>
          <div className={styles.iconGranted}>
            <BellRing size={20} />
          </div>
          <div className={styles.textContent}>
            <span className={styles.title}>
              Notifications {enabled ? 'activées' : 'désactivées'}
            </span>
            <span className={styles.description}>
              {enabled
                ? 'Vous recevez des notifications push pour les événements sélectionnés.'
                : 'Les notifications push sont autorisées mais désactivées. Activez-les pour recevoir des alertes.'}
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <span className={styles.statusGranted}>
            <CheckCircle size={12} />
            Autorisé
          </span>
          <Button
            variant={enabled ? 'ghost' : 'primary'}
            size="sm"
            icon={enabled ? <BellOff size={14} /> : <Bell size={14} />}
            onClick={onToggleEnabled}
          >
            {enabled ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </div>
    );
  }

  // permissionStatus === 'default'
  return (
    <div className={styles.bannerDefault}>
      <div className={styles.info}>
        <div className={styles.iconDefault}>
          <Bell size={20} />
        </div>
        <div className={styles.textContent}>
          <span className={styles.title}>Activer les notifications push</span>
          <span className={styles.description}>
            Recevez des alertes en temps réel pour les réservations, messages et événements importants.
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        <span className={styles.statusDefault}>
          <Bell size={12} />
          Pas demandé
        </span>
        <Button
          variant="primary"
          size="sm"
          icon={<BellRing size={14} />}
          onClick={onRequestPermission}
        >
          Autoriser
        </Button>
      </div>
    </div>
  );
}
