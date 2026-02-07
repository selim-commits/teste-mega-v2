import { ExternalLink } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import styles from '../Settings.module.css';

const integrations = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Synchronisez automatiquement vos reservations avec Google Calendar pour une vue unifiee de votre emploi du temps.',
    icon: '\u{1F4C5}',
    connected: false,
    status: 'Non connecte',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Acceptez les paiements en ligne de maniere securisee. Cartes bancaires, Apple Pay, Google Pay et plus.',
    icon: '\u{1F4B3}',
    connected: false,
    status: 'Non connecte',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envoyez des emails transactionnels et des notifications professionnelles a vos clients.',
    icon: '\u{1F4E7}',
    connected: false,
    status: 'Non connecte',
  },
];

export function IntegrationsSection() {
  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Integrations</h2>
          <p className={styles.sectionDescription}>
            Connectez ROOOM a vos outils preferes pour automatiser votre workflow
          </p>
        </div>

        <div className={styles.integrationsGrid}>
          {integrations.map((integration) => (
            <Card key={integration.id} padding="lg" className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <span className={styles.integrationIcon}>{integration.icon}</span>
                <div className={styles.integrationInfo}>
                  <h3 className={styles.integrationName}>{integration.name}</h3>
                  <p className={styles.integrationDescription}>{integration.description}</p>
                </div>
              </div>
              <div className={styles.integrationStatus}>
                <div className={styles.statusIndicator}>
                  <span className={`${styles.statusDot} ${integration.connected ? styles.statusConnected : styles.statusDisconnected}`}></span>
                  <span className={styles.statusText}>{integration.status}</span>
                </div>
              </div>
              <div className={styles.integrationActions}>
                {integration.connected ? (
                  <>
                    <Button variant="ghost" size="sm">
                      Configurer
                    </Button>
                    <Button variant="ghost" size="sm" className={styles.disconnectButton}>
                      Deconnecter
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink size={14} />}
                    disabled
                  >
                    Connecter
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.integrationNote}>
            <span className={styles.noteIcon}>{'\u{1F4A1}'}</span>
            <div className={styles.noteContent}>
              <h4 className={styles.noteTitle}>Integrations a venir</h4>
              <p className={styles.noteText}>
                Les integrations sont actuellement en developpement. Vous serez notifie des qu'elles seront disponibles.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
