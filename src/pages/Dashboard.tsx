import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Package,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../lib/utils';
import { useAuthContext } from '../contexts/AuthContext';
import {
  useDashboardStats,
  useTodayBookings,
  useEquipment,
  useMaintenanceNeeded,
  useActiveClients,
  useBookings,
} from '../hooks';
import { useTeamMembersByUser } from '../hooks/useTeam';
import type { Booking, Equipment } from '../types/database';
import styles from './Dashboard.module.css';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

// Helper function to format booking time
function formatBookingTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Helper function to get booking status for display
function getBookingDisplayStatus(booking: Booking): 'active' | 'upcoming' | 'completed' {
  const now = new Date();
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  if (booking.status === 'completed') return 'completed';
  if (now >= start && now <= end) return 'active';
  return 'upcoming';
}

// Helper function to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'A l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

// Helper to calculate average booking duration in hours
function calculateAverageBookingDuration(bookings: Booking[]): string {
  if (!bookings || bookings.length === 0) return '0h';

  const totalMs = bookings.reduce((sum, booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return sum + (end.getTime() - start.getTime());
  }, 0);

  const avgHours = totalMs / bookings.length / (1000 * 60 * 60);
  const hours = Math.floor(avgHours);
  const mins = Math.round((avgHours - hours) * 60);

  return `${hours}h ${mins}m`;
}

export function Dashboard() {
  const { user } = useAuthContext();

  // Get user's team memberships to find their studioId
  const { data: teamMemberships, isLoading: teamLoading } = useTeamMembersByUser(user?.id || '');

  // Get the first studio the user belongs to (in a real app, you might have studio selection)
  const studioId = teamMemberships?.[0]?.studio_id || '';

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useDashboardStats(studioId);

  // Fetch today's bookings
  const {
    data: todayBookings,
    isLoading: bookingsLoading,
    error: bookingsError
  } = useTodayBookings(studioId);

  // Fetch recent bookings for activity feed
  const {
    data: recentBookings,
    isLoading: recentBookingsLoading,
  } = useBookings({ studioId });

  // Fetch equipment data
  const {
    data: equipment,
    isLoading: equipmentLoading,
    error: equipmentError
  } = useEquipment({ studioId });

  // Fetch maintenance needed equipment for alerts
  const {
    data: maintenanceEquipment,
    isLoading: maintenanceLoading
  } = useMaintenanceNeeded(studioId);

  // Fetch active clients count
  const {
    data: activeClients,
    isLoading: clientsLoading
  } = useActiveClients(studioId);

  // Calculate equipment utilization
  const equipmentStats = useMemo(() => {
    if (!equipment) return { total: 0, available: 0, utilizationRate: 0 };
    const available = equipment.filter(e => e.status === 'available').length;
    const inUse = equipment.filter(e => e.status === 'in_use' || e.status === 'reserved').length;
    const total = equipment.length;
    const utilizationRate = total > 0 ? Math.round((inUse / total) * 100) : 0;
    return { total, available, utilizationRate };
  }, [equipment]);

  // Calculate average booking duration from recent bookings
  const avgDuration = useMemo(() => {
    return calculateAverageBookingDuration(recentBookings || []);
  }, [recentBookings]);

  // Get recent activity items
  const recentActivity = useMemo(() => {
    if (!recentBookings) return [];

    return recentBookings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4)
      .map(booking => ({
        id: booking.id,
        action: booking.status === 'completed' ? 'Reservation terminee' : 'Nouvelle reservation',
        details: booking.title,
        time: formatRelativeTime(booking.created_at),
        type: 'booking' as const,
      }));
  }, [recentBookings]);

  // Generate alerts from maintenance equipment
  const alerts = useMemo(() => {
    const alertList: Array<{ type: 'warning' | 'error' | 'info' | 'success'; title: string; message: string }> = [];

    if (maintenanceEquipment && maintenanceEquipment.length > 0) {
      maintenanceEquipment.slice(0, 2).forEach((eq: Equipment) => {
        alertList.push({
          type: 'warning',
          title: 'Maintenance requise',
          message: `${eq.name} - ${eq.category}`,
        });
      });
    }

    return alertList;
  }, [maintenanceEquipment]);

  const hasError = statsError || bookingsError || equipmentError;

  // Show loading state while determining studioId
  if (teamLoading) {
    return (
      <div className={styles.page}>
        <Header
          title="Dashboard"
          subtitle="Vue d'ensemble de votre activite"
        />
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <Skeleton width={200} height={24} />
            <Skeleton width={300} height={16} />
          </div>
        </div>
      </div>
    );
  }

  // Show message if no studio found
  if (!studioId && !teamLoading) {
    return (
      <div className={styles.page}>
        <Header
          title="Dashboard"
          subtitle="Vue d'ensemble de votre activite"
        />
        <div className={styles.content}>
          <Card padding="lg">
            <div className={styles.emptyState}>
              <AlertCircle size={48} />
              <h3>Aucun studio trouve</h3>
              <p>Vous n'etes associe a aucun studio. Veuillez contacter votre administrateur.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className={styles.page}>
        <Header
          title="Dashboard"
          subtitle="Vue d'ensemble de votre activite"
        />
        <div className={styles.content}>
          <Card padding="lg">
            <div className={styles.errorState}>
              <AlertCircle size={48} />
              <h3>Erreur de chargement</h3>
              <p>Impossible de charger les donnees du dashboard. Veuillez reessayer.</p>
              <Button onClick={() => window.location.reload()}>
                Recharger la page
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header
        title="Dashboard"
        subtitle="Vue d'ensemble de votre activite"
      />

      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <motion.div variants={itemVariants}>
            {statsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Revenus du mois"
                value={formatCurrency(stats?.totalRevenue || 0)}
                change={stats?.revenueGrowth || 0}
                icon={<DollarSign size={20} />}
                trend={stats?.revenueGrowth && stats.revenueGrowth >= 0 ? 'up' : 'down'}
              />
            )}
          </motion.div>
          <motion.div variants={itemVariants}>
            {statsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Reservations"
                value={String(stats?.totalBookings || 0)}
                change={stats?.bookingsGrowth || 0}
                icon={<Calendar size={20} />}
                trend={stats?.bookingsGrowth && stats.bookingsGrowth >= 0 ? 'up' : 'down'}
              />
            )}
          </motion.div>
          <motion.div variants={itemVariants}>
            {equipmentLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Taux d'occupation"
                value={`${equipmentStats.utilizationRate}%`}
                change={0}
                icon={<Activity size={20} />}
                trend="up"
              />
            )}
          </motion.div>
          <motion.div variants={itemVariants}>
            {clientsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Clients actifs"
                value={String(activeClients?.length || 0)}
                change={stats?.clientsGrowth || 0}
                icon={<Users size={20} />}
                trend={stats?.clientsGrowth && stats.clientsGrowth >= 0 ? 'up' : 'down'}
              />
            )}
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className={styles.bentoGrid}>
          {/* Today's Schedule - Large */}
          <motion.div variants={itemVariants} className={styles.bentoLarge}>
            <Card padding="lg" className={styles.scheduleCard}>
              <CardHeader
                title="Aujourd'hui"
                subtitle={bookingsLoading ? 'Chargement...' : `${todayBookings?.length || 0} reservations`}
                action={
                  <Button variant="ghost" size="sm">
                    Voir tout
                  </Button>
                }
              />
              <CardContent>
                {bookingsLoading ? (
                  <div className={styles.scheduleList}>
                    {[1, 2, 3, 4].map((i) => (
                      <ScheduleItemSkeleton key={i} />
                    ))}
                  </div>
                ) : todayBookings && todayBookings.length > 0 ? (
                  <div className={styles.scheduleList}>
                    {todayBookings.slice(0, 4).map((booking) => (
                      <ScheduleItem
                        key={booking.id}
                        time={formatBookingTime(booking.start_time, booking.end_time)}
                        studio={booking.title}
                        client={booking.description || 'Client'}
                        type={booking.status === 'in_progress' ? 'En cours' : 'Confirme'}
                        status={getBookingDisplayStatus(booking)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptySchedule}>
                    <Calendar size={32} />
                    <p>Aucune reservation aujourd'hui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div variants={itemVariants} className={styles.bentoMedium}>
            <Card padding="lg" variant="glass" className={styles.aiCard}>
              <div className={styles.aiHeader}>
                <div className={styles.aiIcon}>
                  <Zap size={18} />
                </div>
                <span className={styles.aiLabel}>YODA AI</span>
              </div>
              <h3 className={styles.aiTitle}>Insight du jour</h3>
              <p className={styles.aiText}>
                {stats?.totalBookings && stats.totalBookings > 0
                  ? `Vous avez ${stats.totalBookings} reservations ce mois-ci. ${stats.revenueGrowth > 0 ? `Une croissance de ${stats.revenueGrowth}% par rapport au mois dernier!` : 'Continuez vos efforts!'}`
                  : 'Commencez a ajouter des reservations pour voir des insights personnalises.'}
              </p>
              <Button variant="secondary" size="sm" className={styles.aiBtn}>
                Appliquer la suggestion
              </Button>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants} className={styles.bentoSmall}>
            <Card padding="md">
              {recentBookingsLoading ? (
                <>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton width={60} height={24} />
                  <Skeleton width={80} height={14} />
                </>
              ) : (
                <>
                  <div className={styles.statIcon}>
                    <Clock size={18} />
                  </div>
                  <div className={styles.statValue}>{avgDuration}</div>
                  <div className={styles.statLabel}>Duree moyenne</div>
                </>
              )}
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.bentoSmall}>
            <Card padding="md">
              {equipmentLoading ? (
                <>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton width={60} height={24} />
                  <Skeleton width={80} height={14} />
                </>
              ) : (
                <>
                  <div className={styles.statIcon}>
                    <Package size={18} />
                  </div>
                  <div className={styles.statValue}>{equipmentStats.total}</div>
                  <div className={styles.statLabel}>Equipements actifs</div>
                </>
              )}
            </Card>
          </motion.div>

          {/* Alerts */}
          <motion.div variants={itemVariants} className={styles.bentoMedium}>
            <Card padding="lg">
              <CardHeader
                title="Alertes"
                subtitle={maintenanceLoading ? 'Chargement...' : `${alerts.length} actions requises`}
              />
              <CardContent>
                {maintenanceLoading ? (
                  <div className={styles.alertList}>
                    <AlertItemSkeleton />
                    <AlertItemSkeleton />
                  </div>
                ) : alerts.length > 0 ? (
                  <div className={styles.alertList}>
                    {alerts.map((alert, index) => (
                      <AlertItem
                        key={index}
                        type={alert.type}
                        title={alert.title}
                        message={alert.message}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noAlerts}>
                    <CheckCircle size={24} />
                    <p>Aucune alerte</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className={styles.bentoWide}>
            <Card padding="lg">
              <CardHeader
                title="Activite recente"
                action={
                  <Button variant="ghost" size="sm">
                    Historique
                  </Button>
                }
              />
              <CardContent>
                {recentBookingsLoading ? (
                  <div className={styles.activityList}>
                    {[1, 2, 3, 4].map((i) => (
                      <ActivityItemSkeleton key={i} />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className={styles.activityList}>
                    {recentActivity.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        action={activity.action}
                        details={activity.details}
                        time={activity.time}
                        icon={<Calendar size={14} />}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noActivity}>
                    <Activity size={24} />
                    <p>Aucune activite recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-components
interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

function KPICard({ title, value, change, icon, trend }: KPICardProps) {
  const isPositive = trend === 'up';

  return (
    <Card padding="lg" hoverable className={styles.kpiCard}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiTitle}>{title}</span>
        <div className={styles.kpiIcon}>{icon}</div>
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiChange}>
        {isPositive ? (
          <ArrowUpRight size={14} className={styles.kpiUp} />
        ) : (
          <ArrowDownRight size={14} className={styles.kpiDown} />
        )}
        <span className={isPositive ? styles.kpiUp : styles.kpiDown}>
          {Math.abs(change)}%
        </span>
        <span className={styles.kpiPeriod}>vs mois dernier</span>
      </div>
    </Card>
  );
}

function KPICardSkeleton() {
  return (
    <Card padding="lg" className={styles.kpiCard}>
      <div className={styles.kpiHeader}>
        <Skeleton width={100} height={14} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton width={120} height={32} />
      <div className={styles.kpiChange}>
        <Skeleton width={80} height={14} />
      </div>
    </Card>
  );
}

interface ScheduleItemProps {
  time: string;
  studio: string;
  client: string;
  type: string;
  status: 'active' | 'upcoming' | 'completed';
}

function ScheduleItem({ time, studio, client, type, status }: ScheduleItemProps) {
  return (
    <div className={styles.scheduleItem}>
      <div className={styles.scheduleTime}>{time}</div>
      <div className={styles.scheduleDetails}>
        <div className={styles.scheduleStudio}>{studio}</div>
        <div className={styles.scheduleClient}>{client}</div>
      </div>
      <Badge
        variant={status === 'active' ? 'success' : 'default'}
        size="sm"
        dot={status === 'active'}
      >
        {type}
      </Badge>
    </div>
  );
}

function ScheduleItemSkeleton() {
  return (
    <div className={styles.scheduleItem}>
      <Skeleton width={100} height={14} />
      <div className={styles.scheduleDetails}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} />
      </div>
      <Skeleton width={60} height={24} />
    </div>
  );
}

interface AlertItemProps {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
}

function AlertItem({ type, title, message }: AlertItemProps) {
  const Icon = type === 'warning' ? AlertTriangle : CheckCircle;

  return (
    <div className={styles.alertItem}>
      <div className={`${styles.alertIcon} ${styles[type]}`}>
        <Icon size={14} />
      </div>
      <div className={styles.alertContent}>
        <div className={styles.alertTitle}>{title}</div>
        <div className={styles.alertMessage}>{message}</div>
      </div>
    </div>
  );
}

function AlertItemSkeleton() {
  return (
    <div className={styles.alertItem}>
      <Skeleton variant="circular" width={28} height={28} />
      <div className={styles.alertContent}>
        <Skeleton width={100} height={14} />
        <Skeleton width={180} height={12} />
      </div>
    </div>
  );
}

interface ActivityItemProps {
  action: string;
  details: string;
  time: string;
  icon: React.ReactNode;
}

function ActivityItem({ action, details, time, icon }: ActivityItemProps) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIcon}>{icon}</div>
      <div className={styles.activityContent}>
        <div className={styles.activityAction}>{action}</div>
        <div className={styles.activityDetails}>{details}</div>
      </div>
      <div className={styles.activityTime}>{time}</div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className={styles.activityItem}>
      <Skeleton variant="circular" width={28} height={28} />
      <div className={styles.activityContent}>
        <Skeleton width={120} height={14} />
        <Skeleton width={160} height={12} />
      </div>
      <Skeleton width={60} height={12} />
    </div>
  );
}
