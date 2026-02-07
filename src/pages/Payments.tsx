import { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Settings,
  Plus,
  FileText,
  Download,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import styles from './SettingsPage.module.css';

const paymentMethods = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Cartes bancaires, Apple Pay, Google Pay',
    icon: '💳',
    connected: true,
    fees: '1.4% + 0.25€',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Paiements PayPal',
    icon: '🅿️',
    connected: false,
    fees: '2.9% + 0.35€',
  },
  {
    id: 'bank',
    name: 'Virement bancaire',
    description: 'IBAN direct',
    icon: '🏦',
    connected: true,
    fees: 'Gratuit',
  },
];

const recentTransactions = [
  { id: '1', client: 'Jean Dupont', amount: 150, status: 'completed', date: '2024-01-15' },
  { id: '2', client: 'Marie Martin', amount: 75, status: 'completed', date: '2024-01-14' },
  { id: '3', client: 'Pierre Durand', amount: 200, status: 'pending', date: '2024-01-14' },
  { id: '4', client: 'Sophie Bernard', amount: 50, status: 'failed', date: '2024-01-13' },
];

export function Payments() {
  const [autoCharge, setAutoCharge] = useState(true);
  const [requireDeposit, setRequireDeposit] = useState(false);

  return (
    <div className={styles.page}>
      <Header
        title="Paiements"
        subtitle="Gerez vos methodes de paiement et transactions"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <DollarSign size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>4,250 €</span>
                <span className={styles.statLabel}>Ce mois</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <TrendingUp size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>+18%</span>
                <span className={styles.statLabel}>vs mois dernier</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-orange)15' }}>
                <AlertCircle size={20} color="var(--accent-orange)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>2</span>
                <span className={styles.statLabel}>En attente</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-purple)15' }}>
                <CreditCard size={20} color="var(--accent-purple)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>2</span>
                <span className={styles.statLabel}>Methodes actives</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Payment Methods */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Methodes de paiement</h3>
            <Button variant="secondary" size="sm" icon={<Plus size={16} />}>
              Ajouter
            </Button>
          </div>

          <div className={styles.list}>
            {paymentMethods.map((method) => (
              <div key={method.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemIcon} style={{ fontSize: '20px' }}>
                    {method.icon}
                  </div>
                  <div className={styles.listItemText}>
                    <span className={styles.listItemTitle}>{method.name}</span>
                    <span className={styles.listItemSubtitle}>
                      {method.description} • Frais: {method.fees}
                    </span>
                  </div>
                </div>
                <div className={styles.listItemActions}>
                  {method.connected ? (
                    <>
                      <Badge variant="success" size="sm" dot>Actif</Badge>
                      <Button variant="ghost" size="sm" icon={<Settings size={14} />} />
                    </>
                  ) : (
                    <Button variant="primary" size="sm">
                      Connecter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Settings */}
        <Card padding="lg" className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Parametres de paiement</h3>

          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Paiement automatique</span>
                  <span className={styles.listItemSubtitle}>
                    Debiter automatiquement lors de la reservation
                  </span>
                </div>
              </div>
              <Switch checked={autoCharge} onChange={(e) => setAutoCharge(e.target.checked)} />
            </div>

            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Acompte requis</span>
                  <span className={styles.listItemSubtitle}>
                    Demander un acompte pour confirmer la reservation
                  </span>
                </div>
              </div>
              <Switch checked={requireDeposit} onChange={(e) => setRequireDeposit(e.target.checked)} />
            </div>

            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Politique d'annulation</span>
                  <span className={styles.listItemSubtitle}>
                    Remboursement integral jusqu'a 24h avant
                  </span>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Modifier
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Transactions recentes</h3>
            <Button variant="ghost" size="sm" icon={<Download size={16} />}>
              Exporter
            </Button>
          </div>

          <div className={styles.list}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.listItemText}>
                    <span className={styles.listItemTitle}>{tx.client}</span>
                    <span className={styles.listItemSubtitle}>{tx.date}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    color: 'var(--text-primary)'
                  }}>
                    {tx.amount} €
                  </span>
                  {tx.status === 'completed' && <Badge variant="success" size="sm">Paye</Badge>}
                  {tx.status === 'pending' && <Badge variant="warning" size="sm">En attente</Badge>}
                  {tx.status === 'failed' && <Badge variant="error" size="sm">Echoue</Badge>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <Button variant="ghost">
              Voir toutes les transactions
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
