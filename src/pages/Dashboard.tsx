import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus,
  UserPlus,
  FileText,
  CreditCard,
  RefreshCw,
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
  useRecentPayments,
} from '../hooks';
import { useTeamMembersByUser } from '../hooks/useTeam';
import type { Booking, Equipment } from '../types/database';
import styles from './Dashboard.module.css';

// --- Time Period Types ---
type TimePeriod = 'today' | 'week' | 'month' | 'quarter';

interface PeriodConfig {
  label: string;
  key: TimePeriod;
}

const PERIOD_OPTIONS: PeriodConfig[] = [
  { label: "Aujourd'hui", key: 'today' },
  { label: 'Cette semaine', key: 'week' },
  { label: 'Ce mois', key: 'month' },
  { label: 'Ce trimestre', key: 'quarter' },
];

// --- Helper Functions ---

function formatBookingTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function getBookingDisplayStatus(booking: Booking): 'active' | 'upcoming' | 'completed' {
  const now = new Date();
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  if (booking.status === 'completed') return 'completed';
  if (now >= start && now <= end) return 'active';
  return 'upcoming';
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

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

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const bookingDate = new Date(dateStr).toISOString().split('T')[0];
  return bookingDate === tomorrowStr;
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const bookingDate = new Date(dateStr).toISOString().split('T')[0];
  return bookingDate === today;
}

/** Get date range for the selected period */
function getPeriodDateRange(period: TimePeriod): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (period) {
    case 'today': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 1);
      break;
    }
    case 'week': {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      end = new Date(now);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      end = new Date(now);
      prevStart = new Date(now.getFullYear(), qMonth - 3, 1);
      prevEnd = new Date(now.getFullYear(), qMonth, 0, 23, 59, 59, 999);
      break;
    }
  }

  return { start, end, prevStart, prevEnd };
}

/** Filter bookings by period */
function filterBookingsByPeriod(bookings: Booking[], start: Date, end: Date): Booking[] {
  return bookings.filter(booking => {
    const bookingDate = new Date(booking.start_time);
    return bookingDate >= start && bookingDate <= end;
  });
}

/** Format the last updated timestamp */
function formatLastUpdated(): string {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Translate payment method to French */
function translatePaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    card: 'Carte',
    bank_transfer: 'Virement',
    transfer: 'Virement',
    cash: 'Especes',
    check: 'Cheque',
    other: 'Autre',
  };
  return methods[method] || method;
}

// --- Main Component ---

export function Dashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [lastUpdated] = useState<string>(formatLastUpdated);

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

  // Fetch recent payments for revenue feed
  const {
    data: recentPaymentsData,
    isLoading: paymentsLoading
  } = useRecentPayments(studioId, 5);

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

  // --- Period-based filtering ---
  const periodRange = useMemo(() => getPeriodDateRange(selectedPeriod), [selectedPeriod]);

  const periodBookings = useMemo(() => {
    if (!recentBookings) return [];
    return filterBookingsByPeriod(recentBookings, periodRange.start, periodRange.end);
  }, [recentBookings, periodRange]);

  const prevPeriodBookings = useMemo(() => {
    if (!recentBookings) return [];
    return filterBookingsByPeriod(recentBookings, periodRange.prevStart, periodRange.prevEnd);
  }, [recentBookings, periodRange]);

  // Compute period-sensitive metrics
  const periodStats = useMemo(() => {
    const currentCount = periodBookings.length;
    const prevCount = prevPeriodBookings.length;

    const currentRevenue = periodBookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const prevRevenue = prevPeriodBookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const bookingsChange = prevCount > 0
      ? Math.round(((currentCount - prevCount) / prevCount) * 100)
      : currentCount > 0 ? 100 : 0;

    const revenueChange = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    return {
      bookingsCount: currentCount,
      bookingsChange,
      revenue: currentRevenue,
      revenueChange,
    };
  }, [periodBookings, prevPeriodBookings]);

  // Get the label for "vs previous period"
  const periodComparisonLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'today': return 'vs hier';
      case 'week': return 'vs semaine dern.';
      case 'month': return 'vs mois dernier';
      case 'quarter': return 'vs trimestre dern.';
    }
  }, [selectedPeriod]);

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

    const totalSpaces = activeSpaces.length;
    const workingHours = 12;
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

  // Get recent activity items (expanded to 8)
  const recentActivity = useMemo(() => {
    if (!recentBookings) return [];

    return recentBookings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map(booking => {
        let action: string;
        let variant: 'booking' | 'completed' | 'cancelled' = 'booking';

        if (booking.status === 'completed') {
          action = 'Reservation terminee';
          variant = 'completed';
        } else if (booking.status === 'cancelled') {
          action = 'Reservation annulee';
          variant = 'cancelled';
        } else if (booking.status === 'confirmed') {
          action = 'Reservation confirmee';
        } else {
          action = 'Nouvelle reservation';
        }

        return {
          id: booking.id,
          action,
          details: booking.title,
          time: formatRelativeTime(booking.created_at),
          type: variant,
          amount: booking.total_amount || 0,
        };
      });
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

  // Quick action handlers
  const handleQuickAction = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

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
              <p>Vous n&apos;etes associe a aucun studio. Veuillez contacter votre administrateur.</p>
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

      <div className={styles.content}>
        {/* Top Bar: Period Selector + Last Updated */}
        <div className={styles.topBar}>
          <div className={styles.periodSelector}>
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.key}
                className={`${styles.periodBtn} ${selectedPeriod === option.key ? styles.periodBtnActive : ''}`}
                onClick={() => setSelectedPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={styles.lastUpdated}>
            <RefreshCw size={12} />
            <span>Mis a jour a {lastUpdated}</span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className={styles.quickActions}>
          <button className={styles.quickActionBtn} onClick={() => handleQuickAction('/bookings')}>
            <div className={styles.quickActionIcon}>
              <Plus size={16} />
            </div>
            <span>Nouvelle reservation</span>
          </button>
          <button className={styles.quickActionBtn} onClick={() => handleQuickAction('/clients')}>
            <div className={styles.quickActionIcon}>
              <UserPlus size={16} />
            </div>
            <span>Nouveau client</span>
          </button>
          <button className={styles.quickActionBtn} onClick={() => handleQuickAction('/finance')}>
            <div className={styles.quickActionIcon}>
              <FileText size={16} />
            </div>
            <span>Creer facture</span>
          </button>
          <button className={styles.quickActionBtn} onClick={() => handleQuickAction('/spaces')}>
            <div className={styles.quickActionIcon}>
              <Calendar size={16} />
            </div>
            <span>Voir calendrier</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.animateIn}>
            {statsLoading || recentBookingsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Revenus"
                value={formatCurrency(selectedPeriod === 'month' ? (stats?.totalRevenue || 0) : periodStats.revenue)}
                change={selectedPeriod === 'month' ? (stats?.revenueGrowth || 0) : periodStats.revenueChange}
                icon={<DollarSign size={20} />}
                trend={(selectedPeriod === 'month' ? (stats?.revenueGrowth || 0) : periodStats.revenueChange) >= 0 ? 'up' : 'down'}
                comparisonLabel={periodComparisonLabel}
                previousValue={selectedPeriod !== 'month' && periodStats.revenueChange !== 0
                  ? formatCurrency(periodStats.revenue / (1 + periodStats.revenueChange / 100))
                  : undefined}
              />
            )}
          </div>
          <div className={styles.animateIn}>
            {statsLoading || recentBookingsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Reservations"
                value={String(selectedPeriod === 'month' ? (stats?.totalBookings || 0) : periodStats.bookingsCount)}
                change={selectedPeriod === 'month' ? (stats?.bookingsGrowth || 0) : periodStats.bookingsChange}
                icon={<Calendar size={20} />}
                trend={(selectedPeriod === 'month' ? (stats?.bookingsGrowth || 0) : periodStats.bookingsChange) >= 0 ? 'up' : 'down'}
                comparisonLabel={periodComparisonLabel}
              />
            )}
          </div>
          <div className={styles.animateIn}>
            {spacesLoading || bookingsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Taux d'occupation"
                value={`${occupancyRate}%`}
                change={0}
                icon={<Activity size={20} />}
                trend={occupancyRate >= 50 ? 'up' : 'down'}
                comparisonLabel={periodComparisonLabel}
              />
            )}
          </div>
          <div className={styles.animateIn}>
            {clientsLoading ? (
              <KPICardSkeleton />
            ) : (
              <KPICard
                title="Clients actifs"
                value={String(activeClients?.length || 0)}
                change={stats?.clientsGrowth || 0}
                icon={<Users size={20} />}
                trend={stats?.clientsGrowth && stats.clientsGrowth >= 0 ? 'up' : 'down'}
                comparisonLabel={periodComparisonLabel}
              />
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className={styles.bentoGrid}>
          {/* Today + Tomorrow Schedule - Large */}
          <div className={`${styles.animateIn} ${styles.bentoLarge}`}>
            <Card padding="lg" className={styles.scheduleCard}>
              <CardHeader
                title="Prochaines reservations"
                subtitle={weekBookingsLoading ? 'Chargement...' : `${upcomingBookings.length} a venir`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
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
          </div>

          {/* 7-Day Bookings Chart */}
          <div className={`${styles.animateIn} ${styles.bentoMedium}`}>
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
          </div>

          {/* Quick Stats */}
          <div className={`${styles.animateIn} ${styles.bentoSmall}`}>
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
          </div>

          <div className={`${styles.animateIn} ${styles.bentoSmall}`}>
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
          </div>

          {/* AI Insights - Small */}
          <div className={`${styles.animateIn} ${styles.bentoMedium}`}>
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
              <Button variant="secondary" size="sm" className={styles.aiBtn} onClick={() => navigate('/ai')}>
                Voir les insights
              </Button>
            </Card>
          </div>

          {/* Alerts */}
          <div className={`${styles.animateIn} ${styles.bentoMedium}`}>
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
          </div>

          {/* Recent Activity - Enhanced */}
          <div className={`${styles.animateIn} ${styles.bentoWide}`}>
            <Card padding="lg">
              <CardHeader
                title="Activite recente"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
                    Historique
                  </Button>
                }
              />
              <CardContent>
                {recentBookingsLoading ? (
                  <div className={styles.activityList}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
                        icon={
                          activity.type === 'completed' ? <CheckCircle size={14} /> :
                          activity.type === 'cancelled' ? <AlertCircle size={14} /> :
                          <Calendar size={14} />
                        }
                        variant={activity.type}
                        amount={activity.amount}
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
          </div>

          {/* Revenus recents */}
          <div className={`${styles.animateIn} ${styles.bentoMedium}`}>
            <Card padding="lg">
              <CardHeader
                title="Revenus recents"
                subtitle="5 dernieres transactions"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
                    Voir tout
                  </Button>
                }
              />
              <CardContent>
                {paymentsLoading ? (
                  <div className={styles.revenueList}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <RevenueItemSkeleton key={i} />
                    ))}
                  </div>
                ) : recentPaymentsData && recentPaymentsData.length > 0 ? (
                  <div className={styles.revenueList}>
                    {recentPaymentsData.slice(0, 5).map((payment) => (
                      <RevenueItem
                        key={payment.id}
                        amount={payment.amount}
                        method={translatePaymentMethod(payment.method)}
                        reference={payment.reference || '-'}
                        date={formatRelativeTime(payment.created_at)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noActivity}>
                    <CreditCard size={24} />
                    <p>Aucun paiement recent</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  comparisonLabel: string;
  previousValue?: string;
}

function KPICard({ title, value, change, icon, trend, comparisonLabel, previousValue }: KPICardProps) {
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
        <span className={styles.kpiPeriod}>{comparisonLabel}</span>
      </div>
      {previousValue && (
        <div className={styles.kpiPrevious}>
          Precedent : {previousValue}
        </div>
      )}
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
  variant?: 'booking' | 'completed' | 'cancelled';
  amount?: number;
}

function ActivityItem({ action, details, time, icon, variant = 'booking', amount }: ActivityItemProps) {
  return (
    <div className={styles.activityItem}>
      <div className={`${styles.activityIcon} ${styles[`activityIcon_${variant}`]}`}>
        {icon}
      </div>
      <div className={styles.activityContent}>
        <div className={styles.activityAction}>{action}</div>
        <div className={styles.activityDetails}>{details}</div>
      </div>
      {amount != null && amount > 0 && (
        <div className={styles.activityAmount}>{formatCurrency(amount)}</div>
      )}
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

interface RevenueItemProps {
  amount: number;
  method: string;
  reference: string;
  date: string;
}

function RevenueItem({ amount, method, reference, date }: RevenueItemProps) {
  return (
    <div className={styles.revenueItem}>
      <div className={styles.revenueItemIcon}>
        <CreditCard size={14} />
      </div>
      <div className={styles.revenueItemContent}>
        <div className={styles.revenueItemAmount}>{formatCurrency(amount)}</div>
        <div className={styles.revenueItemMeta}>{method} &middot; {reference}</div>
      </div>
      <div className={styles.revenueItemDate}>{date}</div>
    </div>
  );
}

function RevenueItemSkeleton() {
  return (
    <div className={styles.revenueItem}>
      <Skeleton variant="circular" width={28} height={28} />
      <div className={styles.revenueItemContent}>
        <Skeleton width={80} height={14} />
        <Skeleton width={120} height={12} />
      </div>
      <Skeleton width={50} height={12} />
    </div>
  );
}
