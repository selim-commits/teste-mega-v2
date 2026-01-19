import { useMemo } from 'react';
import { TrendingUp, DollarSign, Package, Users, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import type { Pack, ClientPurchase } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface PackAnalyticsProps {
  packs: Pack[];
  purchases: ClientPurchase[];
  currency?: string;
}

export function PackAnalytics({
  packs,
  purchases,
  currency = '$',
}: PackAnalyticsProps) {
  const analytics = useMemo(() => {
    // Calculate pack performance
    const packPerformance = packs.map((pack) => {
      const packPurchases = purchases.filter((p) => p.product_id === pack.id);
      const activePurchases = packPurchases.filter((p) => p.status === 'active');
      const revenue = packPurchases.length * pack.price;

      return {
        pack,
        totalSales: packPurchases.length,
        activeSubscriptions: activePurchases.length,
        revenue,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    // Calculate totals
    const totalRevenue = packPerformance.reduce((sum, p) => sum + p.revenue, 0);
    const totalSales = purchases.length;
    const activeSubscriptions = purchases.filter((p) => p.status === 'active').length;

    // Calculate by type
    const byType = {
      pack: { count: 0, revenue: 0 },
      subscription: { count: 0, revenue: 0 },
      gift_certificate: { count: 0, revenue: 0 },
    };

    purchases.forEach((purchase) => {
      const pack = packs.find((p) => p.id === purchase.product_id);
      if (pack) {
        byType[pack.type].count++;
        byType[pack.type].revenue += pack.price;
      }
    });

    // Top performing packs
    const topPacks = packPerformance.slice(0, 5);

    return {
      packPerformance,
      totalRevenue,
      totalSales,
      activeSubscriptions,
      byType,
      topPacks,
    };
  }, [packs, purchases]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pack':
        return 'Packs';
      case 'subscription':
        return 'Abonnements';
      case 'gift_certificate':
        return 'Certificats';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pack':
        return 'var(--accent-purple)';
      case 'subscription':
        return 'var(--accent-blue)';
      case 'gift_certificate':
        return 'var(--accent-pink)';
      default:
        return 'var(--accent-primary)';
    }
  };

  return (
    <div className={styles.analyticsSection}>
      {/* Summary Cards */}
      <div className={styles.analyticsGrid}>
        <Card padding="md" className={styles.analyticsCard}>
          <div className={styles.analyticsCardIcon} style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)' }}>
            <DollarSign size={20} color="var(--accent-green)" />
          </div>
          <div className={styles.analyticsCardContent}>
            <span className={styles.analyticsCardValue}>
              {analytics.totalRevenue.toLocaleString('fr-FR')} {currency}
            </span>
            <span className={styles.analyticsCardLabel}>Revenu total</span>
          </div>
        </Card>

        <Card padding="md" className={styles.analyticsCard}>
          <div className={styles.analyticsCardIcon} style={{ backgroundColor: 'rgba(33, 150, 243, 0.15)' }}>
            <Package size={20} color="var(--accent-blue)" />
          </div>
          <div className={styles.analyticsCardContent}>
            <span className={styles.analyticsCardValue}>{analytics.totalSales}</span>
            <span className={styles.analyticsCardLabel}>Ventes totales</span>
          </div>
        </Card>

        <Card padding="md" className={styles.analyticsCard}>
          <div className={styles.analyticsCardIcon} style={{ backgroundColor: 'rgba(255, 152, 0, 0.15)' }}>
            <Users size={20} color="var(--accent-orange)" />
          </div>
          <div className={styles.analyticsCardContent}>
            <span className={styles.analyticsCardValue}>{analytics.activeSubscriptions}</span>
            <span className={styles.analyticsCardLabel}>Abonnes actifs</span>
          </div>
        </Card>
      </div>

      {/* By Type */}
      <Card padding="md" className={styles.byTypeCard}>
        <h4 className={styles.cardTitle}>Repartition par type</h4>
        <div className={styles.byTypeList}>
          {Object.entries(analytics.byType).map(([type, data]) => (
            <div key={type} className={styles.byTypeItem}>
              <div className={styles.byTypeHeader}>
                <div
                  className={styles.byTypeDot}
                  style={{ backgroundColor: getTypeColor(type) }}
                />
                <span className={styles.byTypeLabel}>{getTypeLabel(type)}</span>
                <span className={styles.byTypeCount}>{data.count} ventes</span>
              </div>
              <div className={styles.byTypeProgress}>
                <Progress
                  value={data.count}
                  max={analytics.totalSales || 1}
                  size="sm"
                  variant="default"
                />
              </div>
              <span className={styles.byTypeRevenue}>
                {data.revenue.toLocaleString('fr-FR')} {currency}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Packs */}
      <Card padding="md" className={styles.topPacksCard}>
        <h4 className={styles.cardTitle}>Meilleures ventes</h4>
        {analytics.topPacks.length === 0 ? (
          <div className={styles.noData}>
            <TrendingUp size={24} />
            <p>Aucune vente pour le moment</p>
          </div>
        ) : (
          <div className={styles.topPacksList}>
            {analytics.topPacks.map((item, index) => (
              <div key={item.pack.id} className={styles.topPackItem}>
                <span className={styles.topPackRank}>#{index + 1}</span>
                <div className={styles.topPackInfo}>
                  <span className={styles.topPackName}>{item.pack.name}</span>
                  <div className={styles.topPackMeta}>
                    <Badge
                      variant={
                        item.pack.type === 'subscription'
                          ? 'info'
                          : item.pack.type === 'gift_certificate'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {getTypeLabel(item.pack.type)}
                    </Badge>
                    <span>{item.totalSales} ventes</span>
                  </div>
                </div>
                <span className={styles.topPackRevenue}>
                  {item.revenue.toLocaleString('fr-FR')} {currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All Packs Performance */}
      <Card padding="md" className={styles.allPacksCard}>
        <h4 className={styles.cardTitle}>Performance de tous les packs</h4>
        <div className={styles.packPerformanceList}>
          {analytics.packPerformance.map((item) => {
            const maxSales = Math.max(...analytics.packPerformance.map((p) => p.totalSales), 1);
            return (
              <div key={item.pack.id} className={styles.packPerformanceItem}>
                <div className={styles.packPerformanceHeader}>
                  <span className={styles.packPerformanceName}>{item.pack.name}</span>
                  <div className={styles.packPerformanceStats}>
                    <span>{item.totalSales} ventes</span>
                    <span className={styles.packPerformanceRevenue}>
                      {item.revenue.toLocaleString('fr-FR')} {currency}
                    </span>
                  </div>
                </div>
                <Progress
                  value={item.totalSales}
                  max={maxSales}
                  size="sm"
                  variant={item.totalSales > 0 ? 'success' : 'default'}
                />
                {item.pack.type === 'subscription' && (
                  <div className={styles.packPerformanceActive}>
                    <RefreshCw size={12} />
                    <span>{item.activeSubscriptions} actifs</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
