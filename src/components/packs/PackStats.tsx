import { Package, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import styles from '../../pages/Packs.module.css';

interface PackStatsProps {
  totalPacks: number;
  totalSold: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  currency?: string;
}

export function PackStats({
  totalPacks,
  totalSold,
  monthlyRevenue,
  activeSubscriptions,
  currency = '$',
}: PackStatsProps) {
  const stats = [
    {
      label: 'Packs actifs',
      value: totalPacks.toString(),
      icon: Package,
      color: 'var(--accent-purple)',
      change: '',
    },
    {
      label: 'Total vendu',
      value: totalSold.toString(),
      icon: TrendingUp,
      color: 'var(--accent-blue)',
      change: '',
    },
    {
      label: 'Revenus du mois',
      value: `${monthlyRevenue.toLocaleString('fr-FR')} ${currency}`,
      icon: DollarSign,
      color: 'var(--accent-green)',
      change: '',
    },
    {
      label: 'Abonnes actifs',
      value: activeSubscriptions.toString(),
      icon: Users,
      color: 'var(--accent-orange)',
      change: '',
    },
  ];

  return (
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
            {stat.change && <span className={styles.statChange}>{stat.change}</span>}
          </Card>
        </div>
      ))}
    </div>
  );
}
