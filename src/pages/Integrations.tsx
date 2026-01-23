import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plug,
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import styles from './SettingsPage.module.css';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: 'payment' | 'calendar' | 'communication' | 'other';
}

const integrations: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Acceptez les paiements par carte bancaire',
    icon: '💳',
    connected: true,
    category: 'payment',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Paiements PayPal et carte bancaire',
    icon: '🅿️',
    connected: false,
    category: 'payment',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Synchronisez avec Google Agenda',
    icon: '📅',
    connected: true,
    category: 'calendar',
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: 'Synchronisez avec Outlook',
    icon: '📆',
    connected: false,
    category: 'calendar',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Automatisez vos campagnes email',
    icon: '📧',
    connected: false,
    category: 'communication',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Envoyez des SMS automatiques',
    icon: '📱',
    connected: false,
    category: 'communication',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Reunions video automatiques',
    icon: '🎥',
    connected: false,
    category: 'other',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Synchronisez votre comptabilite',
    icon: '📊',
    connected: false,
    category: 'other',
  },
];

const categories = [
  { id: 'all', label: 'Toutes' },
  { id: 'payment', label: 'Paiements' },
  { id: 'calendar', label: 'Calendriers' },
  { id: 'communication', label: 'Communication' },
  { id: 'other', label: 'Autres' },
];

export function Integrations() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredIntegrations = integrations.filter(
    (int) => activeCategory === 'all' || int.category === activeCategory
  );

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className={styles.page}>
      <Header
        title="Integrations"
        subtitle="Connectez vos outils preferes"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <Check size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{connectedCount}</span>
                <span className={styles.statLabel}>Connectees</span>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <Plug size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{integrations.length}</span>
                <span className={styles.statLabel}>Disponibles</span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Category Tabs */}
        <div className={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className={styles.grid}>
          {filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="none" hoverable className={styles.card}>
                <div className={styles.cardHeader}>
                  <div
                    className={styles.cardIcon}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      fontSize: '24px',
                    }}
                  >
                    {integration.icon}
                  </div>
                  <span className={`${styles.statusBadge} ${integration.connected ? styles.connected : styles.disconnected}`}>
                    {integration.connected ? (
                      <>
                        <Check size={12} />
                        Connecte
                      </>
                    ) : (
                      'Non connecte'
                    )}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h4 className={styles.cardTitle}>{integration.name}</h4>
                  <p className={styles.cardDescription}>{integration.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  {integration.connected ? (
                    <>
                      <Button variant="ghost" size="sm" icon={<Settings size={14} />}>
                        Configurer
                      </Button>
                      <Button variant="secondary" size="sm" icon={<X size={14} />}>
                        Deconnecter
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" icon={<ExternalLink size={14} />}>
                        En savoir plus
                      </Button>
                      <Button variant="primary" size="sm" icon={<Plug size={14} />}>
                        Connecter
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Request Integration */}
        <Card padding="lg" style={{ marginTop: 'var(--card-gap)', textAlign: 'center' }}>
          <h3 className={styles.sectionTitle}>Vous ne trouvez pas votre outil ?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Demandez une nouvelle integration et nous l'ajouterons a notre roadmap.
          </p>
          <Button variant="secondary">
            Demander une integration
          </Button>
        </Card>
      </div>
    </div>
  );
}
