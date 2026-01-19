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
  TrendingUp,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../lib/utils';
import { useAuthContext } from '../contexts/AuthContext';
import { DEMO_STUDIO_ID } from '../stores/authStore';
import {
  useDashboardStats,
  useTodayBookings,
  useEquipment,
  useMaintenanceNeeded,
  useActiveClients,
  useBookings,
  useActiveSpaces,
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

// Helper to get bookings for the last 7 days
interface DailyBookingData {
  date: string;
  dayName: string;
  count: number;
  maxCount: number;
}

function getLast7DaysBookings(bookings: Booking[]): DailyBookingData[] {
  const result: DailyBookingData[] = [];
  const now = new Date();
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const count = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
      return bookingDate === dateStr;
    }).length;

    result.push({
      date: dateStr,
      dayName: dayNames[date.getDay()],
      count,
      maxCount: 0,
    });
  }

  const maxCount = Math.max(...result.map(d => d.count), 1);
  return result.map(d => ({ ...d, maxCount }));
}

// Helper to check if a booking is tomorrow
function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const bookingDate = new Date(dateStr).toISOString().split('T')[0];
  return bookingDate === tomorrowStr;
}

// Helper to check if a booking is today
function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const bookingDate = new Date(dateStr).toISOString().split('T')[0];
  return bookingDate === today;
}

export function Dashboard() {
  const { user } = useAuthContext();

  // Get user's team memberships to find their studioId
  const { data: teamMemberships, isLoading: teamLoading } = useTeamMembersByUser(user?.id || '');

  // Get the first studio the user belongs to, fallback to demo studio
  const studioId = teamMemberships?.[0]?.studio_id || DEMO_STUDIO_ID;

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

  // Fetch active spaces for occupancy calculation
  const {
    data: activeSpaces,
    isLoading: spacesLoading
  } = useActiveSpaces(studioId);

  // Fetch last 7 days bookings for chart
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString();
  }, []);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }, []);

  const {
    data: weekBookings,
    isLoading: weekBookingsLoading
  } = useBookings({
    studioId,
    startDate: sevenDaysAgo,
    endDate: tomorrow
  });

  // Calculate equipment stats
  const equipmentStats = useMemo(() => {
    if (!equipment) return { total: 0, available: 0 };
    const available = equipment.filter(e => e.status === 'available').length;
    const total = equipment.length;
    return { total, available };
  }, [equipment]);

  // Calculate real occupancy rate based on spaces and bookings
  const occupancyRate = useMemo(() => {
    if (!activeSpaces || activeSpaces.length === 0 || !todayBookings) return 0;

    // Calculate hours booked today vs total available hours
    const totalSpaces = activeSpaces.length;
    const workingHours = 12; // Assume 12 working hours per day
    const totalAvailableHours = totalSpaces * workingHours;

    const bookedHours = todayBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.min(Math.round((bookedHours / totalAvailableHours) * 100), 100);
  }, [activeSpaces, todayBookings]);

  // Get 7-day chart data
  const chartData = useMemo(() => {
    return getLast7DaysBookings(weekBookings || []);
  }, [weekBookings]);

  // Get upcoming bookings (today + tomorrow)
  const upcomingBookings = useMemo(() => {
    if (!weekBookings) return [];

    return weekBookings
      .filter(booking => {
        const bookingDate = booking.start_time;
        return (isToday(bookingDate) || isTomorrow(bookingDate)) &&
               booking.status !== 'cancelled' &&
               booking.status !== 'completed';
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 6);
  }, [weekBookings]);

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
            {spacesLoading || bookingsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Taux d'occupation"
                value={`${occupancyRate}%`}
                change={0}
                icon={<Activity size={20} />}
                trend={occupancyRate >= 50 ? 'up' : 'down'}
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
          {/* Today + Tomorrow Schedule - Large */}
          <motion.div variants={itemVariants} className={styles.bentoLarge}>
            <Card padding="lg" className={styles.scheduleCard}>
              <CardHeader
                title="Prochaines reservations"
                subtitle={weekBookingsLoading ? 'Chargement...' : `${upcomingBookings.length} a venir`}
                action={
                  <Button variant="ghost" size="sm">
                    Voir tout
                  </Button>
                }
              />
              <CardContent>
                {weekBookingsLoading ? (
                  <div className={styles.scheduleList}>
                    {[1, 2, 3, 4].map((i) => (
                      <ScheduleItemSkeleton key={i} />
                    ))}
                  </div>
                ) : upcomingBookings.length > 0 ? (
                  <div className={styles.scheduleList}>
                    {upcomingBookings.map((booking) => (
                      <ScheduleItem
                        key={booking.id}
                        time={formatBookingTime(booking.start_time, booking.end_time)}
                        studio={booking.title}
                        client={booking.description || 'Client'}
                        type={isToday(booking.start_time) ? "Aujourd'hui" : 'Demain'}
                        status={getBookingDisplayStatus(booking)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptySchedule}>
                    <Calendar size={32} />
                    <p>Aucune reservation prevue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 7-Day Bookings Chart */}
          <motion.div variants={itemVariants} className={styles.bentoMedium}>
            <Card padding="lg">
              <CardHeader
                title="Reservations"
                subtitle="7 derniers jours"
                action={<TrendingUp size={16} className={styles.chartIcon} />}
              />
              <CardContent>
                {weekBookingsLoading ? (
                  <div className={styles.chartContainer}>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className={styles.chartBarWrapper}>
                        <Skeleton width={24} height={60} />
                        <Skeleton width={20} height={12} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.chartContainer}>
                    {chartData.map((day) => (
                      <div key={day.date} className={styles.chartBarWrapper}>
                        <div className={styles.chartBarContainer}>
                          <div
                            className={styles.chartBar}
                            style={{
                              height: `${day.maxCount > 0 ? (day.count / day.maxCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className={styles.chartLabel}>{day.dayName}</span>
                        <span className={styles.chartValue}>{day.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
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

          {/* AI Insights - Small */}
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
