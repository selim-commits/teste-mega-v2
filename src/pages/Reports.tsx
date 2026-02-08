import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useNotifications } from '../stores/uiStore';
import styles from './SettingsPage.module.css';

const periodOptions = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: '12m', label: '12 derniers mois' },
];

const statsByPeriod: Record<string, Array<{
  label: string;
  value: string;
  change: string;
  trend: string;
  icon: typeof DollarSign;
  color: string;
}>> = {
  '7d': [
    { label: 'Revenus totaux', value: '2,180 €', change: '+5%', trend: 'up', icon: DollarSign, color: 'var(--accent-green)' },
    { label: 'Reservations', value: '34', change: '+3%', trend: 'up', icon: Calendar, color: 'var(--accent-blue)' },
    { label: 'Clients actifs', value: '22', change: '+10%', trend: 'up', icon: Users, color: 'var(--accent-purple)' },
    { label: 'Duree moyenne', value: '2.3h', change: '-2%', trend: 'down', icon: Clock, color: 'var(--accent-orange)' },
  ],
  '30d': [
    { label: 'Revenus totaux', value: '12,450 €', change: '+12%', trend: 'up', icon: DollarSign, color: 'var(--accent-green)' },
    { label: 'Reservations', value: '156', change: '+8%', trend: 'up', icon: Calendar, color: 'var(--accent-blue)' },
    { label: 'Clients actifs', value: '89', change: '+15%', trend: 'up', icon: Users, color: 'var(--accent-purple)' },
    { label: 'Duree moyenne', value: '2.5h', change: '-5%', trend: 'down', icon: Clock, color: 'var(--accent-orange)' },
  ],
  '90d': [
    { label: 'Revenus totaux', value: '35,890 €', change: '+18%', trend: 'up', icon: DollarSign, color: 'var(--accent-green)' },
    { label: 'Reservations', value: '423', change: '+14%', trend: 'up', icon: Calendar, color: 'var(--accent-blue)' },
    { label: 'Clients actifs', value: '145', change: '+22%', trend: 'up', icon: Users, color: 'var(--accent-purple)' },
    { label: 'Duree moyenne', value: '2.4h', change: '+1%', trend: 'up', icon: Clock, color: 'var(--accent-orange)' },
  ],
  '12m': [
    { label: 'Revenus totaux', value: '148,200 €', change: '+25%', trend: 'up', icon: DollarSign, color: 'var(--accent-green)' },
    { label: 'Reservations', value: '1,842', change: '+20%', trend: 'up', icon: Calendar, color: 'var(--accent-blue)' },
    { label: 'Clients actifs', value: '312', change: '+35%', trend: 'up', icon: Users, color: 'var(--accent-purple)' },
    { label: 'Duree moyenne', value: '2.6h', change: '+3%', trend: 'up', icon: Clock, color: 'var(--accent-orange)' },
  ],
};

export function Reports() {
  const [period, setPeriod] = useState('30d');
  const { info } = useNotifications();

  const stats = useMemo(() => statsByPeriod[period] || statsByPeriod['30d'], [period]);

  return (
    <div className={styles.page}>
      <Header
        title="Rapports"
        subtitle="Analysez les performances de votre activite"
      />

      <div className={styles.content}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <Select
            options={periodOptions}
            value={period}
            onChange={setPeriod}
          />
          <div className={styles.toolbarActions}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => info('Fonctionnalite bientot disponible', 'Les filtres avances seront disponibles prochainement')}
            >
              Filtres
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={16} />}
              onClick={() => info('Fonctionnalite bientot disponible', "L'export des rapports sera disponible prochainement")}
            >
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={styles.animateIn}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card padding="md" className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon size={20} color={stat.color} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {stat.trend === 'up' ? (
                    <TrendingUp size={16} color="var(--state-success)" />
                  ) : (
                    <TrendingDown size={16} color="var(--state-error)" />
                  )}
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: stat.trend === 'up' ? 'var(--state-success)' : 'var(--state-error)'
                  }}>
                    {stat.change}
                  </span>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className={styles.grid}>
          <Card padding="lg">
            <h3 className={styles.sectionTitle}>Revenus par mois</h3>
            <div className={styles.emptyState}>
              <BarChart3 size={48} />
              <p>Les graphiques seront disponibles prochainement</p>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className={styles.sectionTitle}>Reservations par espace</h3>
            <div className={styles.emptyState}>
              <BarChart3 size={48} />
              <p>Les graphiques seront disponibles prochainement</p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card padding="lg" className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Activite recente</h3>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemIcon}>
                  <Calendar size={20} />
                </div>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Nouvelle reservation</span>
                  <span className={styles.listItemSubtitle}>Studio A - Jean Dupont</span>
                </div>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Il y a 2 heures
              </span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemIcon}>
                  <DollarSign size={20} />
                </div>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Paiement recu</span>
                  <span className={styles.listItemSubtitle}>150,00 € - Marie Martin</span>
                </div>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Il y a 5 heures
              </span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemIcon}>
                  <Users size={20} />
                </div>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Nouveau client</span>
                  <span className={styles.listItemSubtitle}>Pierre Durand inscrit</span>
                </div>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Hier
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
