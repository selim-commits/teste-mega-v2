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
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
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

export function Dashboard() {
  return (
    <div className={styles.page}>
      <Header
        title="Dashboard"
        subtitle="Vue d'ensemble de votre activité"
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
            <KPICard
              title="Revenus du mois"
              value={formatCurrency(24580)}
              change={12.5}
              icon={<DollarSign size={20} />}
              trend="up"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KPICard
              title="Réservations"
              value="156"
              change={8.2}
              icon={<Calendar size={20} />}
              trend="up"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KPICard
              title="Taux d'occupation"
              value="78%"
              change={-2.1}
              icon={<Activity size={20} />}
              trend="down"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KPICard
              title="Nouveaux clients"
              value="23"
              change={15.3}
              icon={<Users size={20} />}
              trend="up"
            />
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className={styles.bentoGrid}>
          {/* Today's Schedule - Large */}
          <motion.div variants={itemVariants} className={styles.bentoLarge}>
            <Card padding="lg" className={styles.scheduleCard}>
              <CardHeader
                title="Aujourd'hui"
                subtitle="4 réservations"
                action={
                  <Button variant="ghost" size="sm">
                    Voir tout
                  </Button>
                }
              />
              <CardContent>
                <div className={styles.scheduleList}>
                  <ScheduleItem
                    time="09:00 - 12:00"
                    studio="Studio A"
                    client="Marie Dupont"
                    type="Photo"
                    status="active"
                  />
                  <ScheduleItem
                    time="13:00 - 17:00"
                    studio="Studio B"
                    client="Jean Martin"
                    type="Vidéo"
                    status="upcoming"
                  />
                  <ScheduleItem
                    time="14:00 - 18:00"
                    studio="Studio A"
                    client="Sophie Bernard"
                    type="Photo"
                    status="upcoming"
                  />
                  <ScheduleItem
                    time="19:00 - 22:00"
                    studio="Studio C"
                    client="Lucas Petit"
                    type="Événement"
                    status="upcoming"
                  />
                </div>
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
                Augmentez vos revenus de 15% en proposant des créneaux de 6h
                le weekend. Basé sur l'analyse de 3 mois de données.
              </p>
              <Button variant="secondary" size="sm" className={styles.aiBtn}>
                Appliquer la suggestion
              </Button>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants} className={styles.bentoSmall}>
            <Card padding="md">
              <div className={styles.statIcon}>
                <Clock size={18} />
              </div>
              <div className={styles.statValue}>4h 32m</div>
              <div className={styles.statLabel}>Durée moyenne</div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.bentoSmall}>
            <Card padding="md">
              <div className={styles.statIcon}>
                <Package size={18} />
              </div>
              <div className={styles.statValue}>247</div>
              <div className={styles.statLabel}>Équipements actifs</div>
            </Card>
          </motion.div>

          {/* Alerts */}
          <motion.div variants={itemVariants} className={styles.bentoMedium}>
            <Card padding="lg">
              <CardHeader
                title="Alertes"
                subtitle="2 actions requises"
              />
              <CardContent>
                <div className={styles.alertList}>
                  <AlertItem
                    type="warning"
                    title="Stock bas"
                    message="Papier fond blanc - 2 rouleaux restants"
                  />
                  <AlertItem
                    type="info"
                    title="Maintenance"
                    message="Flash Profoto - révision prévue demain"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className={styles.bentoWide}>
            <Card padding="lg">
              <CardHeader
                title="Activité récente"
                action={
                  <Button variant="ghost" size="sm">
                    Historique
                  </Button>
                }
              />
              <CardContent>
                <div className={styles.activityList}>
                  <ActivityItem
                    action="Nouvelle réservation"
                    details="Studio A - Marie Dupont"
                    time="Il y a 5 min"
                    icon={<Calendar size={14} />}
                  />
                  <ActivityItem
                    action="Paiement reçu"
                    details="€850.00 - Facture #1247"
                    time="Il y a 1h"
                    icon={<DollarSign size={14} />}
                  />
                  <ActivityItem
                    action="Équipement retourné"
                    details="Canon EOS R5 - Studio B"
                    time="Il y a 2h"
                    icon={<Package size={14} />}
                  />
                  <ActivityItem
                    action="Nouveau client"
                    details="Thomas Leroy inscrit"
                    time="Il y a 3h"
                    icon={<Users size={14} />}
                  />
                </div>
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
