import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Percent,
  Activity,
  Sun,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import styles from './AIPricing.module.css';

// ===== Types =====

type TabId = 'recommendations' | 'dynamic' | 'simulations';

type GapIndicator = 'underpriced' | 'overpriced' | 'correct';

interface PricingSlot {
  label: string;
  duration: string;
  currentPrice: number;
  recommendedPrice: number;
}

interface DemandData {
  label: string;
  value: number;
}

interface AiFactor {
  name: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
}

interface DynamicRule {
  id: string;
  name: string;
  description: string;
  modifier: number;
  enabled: boolean;
}

interface SpaceData {
  id: string;
  name: string;
  type: string;
  gapIndicator: GapIndicator;
  gapLabel: string;
  occupancyRate: number;
  pricing: PricingSlot[];
  demand: DemandData[];
  factors: AiFactor[];
  dynamicEnabled: boolean;
  minPrice: number;
  maxPrice: number;
  rules: DynamicRule[];
  monthlyRevenue: number;
  bookingsPerMonth: number;
}

// ===== Mock Data =====

const MOCK_SPACES: SpaceData[] = [
  {
    id: crypto.randomUUID(),
    name: 'Studio A',
    type: 'Studio photo principal - 80m2',
    gapIndicator: 'underpriced',
    gapLabel: 'Sous-evalue (-15%)',
    occupancyRate: 78,
    pricing: [
      { label: 'Heure', duration: '1h', currentPrice: 65, recommendedPrice: 75 },
      { label: 'Demi-journee', duration: '4h', currentPrice: 220, recommendedPrice: 260 },
      { label: 'Journee', duration: '8h', currentPrice: 380, recommendedPrice: 450 },
    ],
    demand: [
      { label: 'Lun', value: 45 },
      { label: 'Mar', value: 62 },
      { label: 'Mer', value: 78 },
      { label: 'Jeu', value: 85 },
      { label: 'Ven', value: 92 },
      { label: 'Sam', value: 98 },
      { label: 'Dim', value: 40 },
    ],
    factors: [
      { name: 'Taux d\'occupation', value: '78% (eleve)', icon: BarChart3, iconClass: 'factorIconOccupancy' },
      { name: 'Saisonnalite', value: 'Haute saison', icon: Sun, iconClass: 'factorIconSeason' },
      { name: 'Concurrence locale', value: '3 studios similaires', icon: Users, iconClass: 'factorIconCompetition' },
      { name: 'Type de creneau', value: 'Weekend +35% demande', icon: Calendar, iconClass: 'factorIconSlot' },
      { name: 'Historique reservations', value: '+12% vs trimestre precedent', icon: Activity, iconClass: 'factorIconHistory' },
      { name: 'Tendance marche', value: 'Hausse des prix (+8%)', icon: TrendingUp, iconClass: 'factorIconTrend' },
    ],
    dynamicEnabled: true,
    minPrice: 50,
    maxPrice: 120,
    rules: [
      { id: crypto.randomUUID(), name: 'Weekend', description: 'Samedi et dimanche', modifier: 20, enabled: true },
      { id: crypto.randomUUID(), name: 'Semaine creuse', description: 'Lundi a mercredi', modifier: -10, enabled: true },
      { id: crypto.randomUUID(), name: 'Soiree', description: 'Apres 18h', modifier: 15, enabled: true },
      { id: crypto.randomUUID(), name: 'Derniere minute', description: 'Reservation < 24h', modifier: -15, enabled: false },
    ],
    monthlyRevenue: 8450,
    bookingsPerMonth: 34,
  },
  {
    id: crypto.randomUUID(),
    name: 'Studio B',
    type: 'Studio video / green screen - 60m2',
    gapIndicator: 'correct',
    gapLabel: 'Prix correct',
    occupancyRate: 65,
    pricing: [
      { label: 'Heure', duration: '1h', currentPrice: 85, recommendedPrice: 85 },
      { label: 'Demi-journee', duration: '4h', currentPrice: 300, recommendedPrice: 310 },
      { label: 'Journee', duration: '8h', currentPrice: 520, recommendedPrice: 530 },
    ],
    demand: [
      { label: 'Lun', value: 30 },
      { label: 'Mar', value: 55 },
      { label: 'Mer', value: 70 },
      { label: 'Jeu', value: 75 },
      { label: 'Ven', value: 88 },
      { label: 'Sam', value: 65 },
      { label: 'Dim', value: 25 },
    ],
    factors: [
      { name: 'Taux d\'occupation', value: '65% (moyen)', icon: BarChart3, iconClass: 'factorIconOccupancy' },
      { name: 'Saisonnalite', value: 'Saison normale', icon: Sun, iconClass: 'factorIconSeason' },
      { name: 'Concurrence locale', value: '1 studio similaire', icon: Users, iconClass: 'factorIconCompetition' },
      { name: 'Type de creneau', value: 'Semaine +20% demande', icon: Calendar, iconClass: 'factorIconSlot' },
      { name: 'Historique reservations', value: 'Stable vs trimestre precedent', icon: Activity, iconClass: 'factorIconHistory' },
      { name: 'Tendance marche', value: 'Stable', icon: TrendingUp, iconClass: 'factorIconTrend' },
    ],
    dynamicEnabled: false,
    minPrice: 70,
    maxPrice: 150,
    rules: [
      { id: crypto.randomUUID(), name: 'Weekend', description: 'Samedi et dimanche', modifier: 15, enabled: true },
      { id: crypto.randomUUID(), name: 'Semaine creuse', description: 'Lundi a mercredi', modifier: -10, enabled: true },
      { id: crypto.randomUUID(), name: 'Soiree', description: 'Apres 18h', modifier: 10, enabled: false },
      { id: crypto.randomUUID(), name: 'Derniere minute', description: 'Reservation < 24h', modifier: -20, enabled: false },
    ],
    monthlyRevenue: 6200,
    bookingsPerMonth: 22,
  },
  {
    id: crypto.randomUUID(),
    name: 'Salle de reunion',
    type: 'Espace meeting - 25m2',
    gapIndicator: 'overpriced',
    gapLabel: 'Surevalue (+22%)',
    occupancyRate: 42,
    pricing: [
      { label: 'Heure', duration: '1h', currentPrice: 45, recommendedPrice: 35 },
      { label: 'Demi-journee', duration: '4h', currentPrice: 160, recommendedPrice: 120 },
      { label: 'Journee', duration: '8h', currentPrice: 280, recommendedPrice: 210 },
    ],
    demand: [
      { label: 'Lun', value: 35 },
      { label: 'Mar', value: 50 },
      { label: 'Mer', value: 55 },
      { label: 'Jeu', value: 48 },
      { label: 'Ven', value: 40 },
      { label: 'Sam', value: 15 },
      { label: 'Dim', value: 10 },
    ],
    factors: [
      { name: 'Taux d\'occupation', value: '42% (faible)', icon: BarChart3, iconClass: 'factorIconOccupancy' },
      { name: 'Saisonnalite', value: 'Haute saison', icon: Sun, iconClass: 'factorIconSeason' },
      { name: 'Concurrence locale', value: '8 espaces similaires', icon: Users, iconClass: 'factorIconCompetition' },
      { name: 'Type de creneau', value: 'Semaine uniquement', icon: Calendar, iconClass: 'factorIconSlot' },
      { name: 'Historique reservations', value: '-18% vs trimestre precedent', icon: Activity, iconClass: 'factorIconHistory' },
      { name: 'Tendance marche', value: 'Baisse des prix (-5%)', icon: TrendingDown, iconClass: 'factorIconTrend' },
    ],
    dynamicEnabled: false,
    minPrice: 25,
    maxPrice: 60,
    rules: [
      { id: crypto.randomUUID(), name: 'Weekend', description: 'Samedi et dimanche', modifier: 10, enabled: false },
      { id: crypto.randomUUID(), name: 'Semaine creuse', description: 'Lundi a mercredi', modifier: -15, enabled: true },
      { id: crypto.randomUUID(), name: 'Soiree', description: 'Apres 18h', modifier: -20, enabled: true },
      { id: crypto.randomUUID(), name: 'Derniere minute', description: 'Reservation < 24h', modifier: -25, enabled: true },
    ],
    monthlyRevenue: 2100,
    bookingsPerMonth: 14,
  },
  {
    id: crypto.randomUUID(),
    name: 'Plateau Cyclorama',
    type: 'Studio cyclo blanc - 120m2',
    gapIndicator: 'underpriced',
    gapLabel: 'Sous-evalue (-20%)',
    occupancyRate: 88,
    pricing: [
      { label: 'Heure', duration: '1h', currentPrice: 95, recommendedPrice: 115 },
      { label: 'Demi-journee', duration: '4h', currentPrice: 340, recommendedPrice: 410 },
      { label: 'Journee', duration: '8h', currentPrice: 580, recommendedPrice: 700 },
    ],
    demand: [
      { label: 'Lun', value: 70 },
      { label: 'Mar', value: 82 },
      { label: 'Mer', value: 90 },
      { label: 'Jeu', value: 95 },
      { label: 'Ven', value: 98 },
      { label: 'Sam', value: 85 },
      { label: 'Dim', value: 50 },
    ],
    factors: [
      { name: 'Taux d\'occupation', value: '88% (tres eleve)', icon: BarChart3, iconClass: 'factorIconOccupancy' },
      { name: 'Saisonnalite', value: 'Haute saison', icon: Sun, iconClass: 'factorIconSeason' },
      { name: 'Concurrence locale', value: '1 cyclo dans la region', icon: Users, iconClass: 'factorIconCompetition' },
      { name: 'Type de creneau', value: 'Tous creneaux demandes', icon: Calendar, iconClass: 'factorIconSlot' },
      { name: 'Historique reservations', value: '+25% vs trimestre precedent', icon: Activity, iconClass: 'factorIconHistory' },
      { name: 'Tendance marche', value: 'Forte hausse (+15%)', icon: TrendingUp, iconClass: 'factorIconTrend' },
    ],
    dynamicEnabled: true,
    minPrice: 80,
    maxPrice: 180,
    rules: [
      { id: crypto.randomUUID(), name: 'Weekend', description: 'Samedi et dimanche', modifier: 25, enabled: true },
      { id: crypto.randomUUID(), name: 'Semaine creuse', description: 'Lundi a mercredi', modifier: -5, enabled: true },
      { id: crypto.randomUUID(), name: 'Soiree', description: 'Apres 18h', modifier: 20, enabled: true },
      { id: crypto.randomUUID(), name: 'Derniere minute', description: 'Reservation < 24h', modifier: -10, enabled: true },
    ],
    monthlyRevenue: 12800,
    bookingsPerMonth: 42,
  },
  {
    id: crypto.randomUUID(),
    name: 'Studio Maquillage',
    type: 'Loge / espace preparation - 15m2',
    gapIndicator: 'correct',
    gapLabel: 'Prix correct',
    occupancyRate: 55,
    pricing: [
      { label: 'Heure', duration: '1h', currentPrice: 25, recommendedPrice: 25 },
      { label: 'Demi-journee', duration: '4h', currentPrice: 80, recommendedPrice: 85 },
      { label: 'Journee', duration: '8h', currentPrice: 140, recommendedPrice: 145 },
    ],
    demand: [
      { label: 'Lun', value: 30 },
      { label: 'Mar', value: 45 },
      { label: 'Mer', value: 60 },
      { label: 'Jeu', value: 65 },
      { label: 'Ven', value: 75 },
      { label: 'Sam', value: 80 },
      { label: 'Dim', value: 20 },
    ],
    factors: [
      { name: 'Taux d\'occupation', value: '55% (moyen)', icon: BarChart3, iconClass: 'factorIconOccupancy' },
      { name: 'Saisonnalite', value: 'Saison normale', icon: Sun, iconClass: 'factorIconSeason' },
      { name: 'Concurrence locale', value: '5 espaces similaires', icon: Users, iconClass: 'factorIconCompetition' },
      { name: 'Type de creneau', value: 'Couple avec studios', icon: Calendar, iconClass: 'factorIconSlot' },
      { name: 'Historique reservations', value: 'Stable', icon: Activity, iconClass: 'factorIconHistory' },
      { name: 'Tendance marche', value: 'Stable', icon: TrendingUp, iconClass: 'factorIconTrend' },
    ],
    dynamicEnabled: false,
    minPrice: 15,
    maxPrice: 40,
    rules: [
      { id: crypto.randomUUID(), name: 'Weekend', description: 'Samedi et dimanche', modifier: 10, enabled: true },
      { id: crypto.randomUUID(), name: 'Semaine creuse', description: 'Lundi a mercredi', modifier: -5, enabled: false },
      { id: crypto.randomUUID(), name: 'Soiree', description: 'Apres 18h', modifier: 0, enabled: false },
      { id: crypto.randomUUID(), name: 'Derniere minute', description: 'Reservation < 24h', modifier: -10, enabled: false },
    ],
    monthlyRevenue: 1850,
    bookingsPerMonth: 18,
  },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'recommendations', label: 'Recommandations' },
  { id: 'dynamic', label: 'Tarification dynamique' },
  { id: 'simulations', label: 'Simulations' },
];

// ===== Component =====

export function AIPricing() {
  const [activeTab, setActiveTab] = useState<TabId>('recommendations');
  const [spaces, setSpaces] = useState<SpaceData[]>(MOCK_SPACES);

  // Simulation state
  const [simPriceAdjust, setSimPriceAdjust] = useState(0);
  const [simOccupancyAdjust, setSimOccupancyAdjust] = useState(0);
  const [simSeasonFactor, setSimSeasonFactor] = useState(100);

  // ===== KPI calculations =====
  const kpis = useMemo(() => {
    const totalRevenue = spaces.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const avgOccupancy = Math.round(spaces.reduce((sum, s) => sum + s.occupancyRate, 0) / spaces.length);
    const totalBookings = spaces.reduce((sum, s) => sum + s.bookingsPerMonth, 0);
    const underpricedCount = spaces.filter((s) => s.gapIndicator === 'underpriced').length;

    return { totalRevenue, avgOccupancy, totalBookings, underpricedCount };
  }, [spaces]);

  // ===== Simulation calculations =====
  const simulation = useMemo(() => {
    const baseRevenue = spaces.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const priceMultiplier = 1 + simPriceAdjust / 100;
    const occupancyMultiplier = 1 + simOccupancyAdjust / 100;
    const seasonMultiplier = simSeasonFactor / 100;

    const projectedRevenue = Math.round(baseRevenue * priceMultiplier * occupancyMultiplier * seasonMultiplier);
    const revenueDiff = projectedRevenue - baseRevenue;
    const revenueDiffPercent = baseRevenue > 0 ? Math.round((revenueDiff / baseRevenue) * 100) : 0;

    const baseBookings = spaces.reduce((sum, s) => sum + s.bookingsPerMonth, 0);
    const projectedBookings = Math.round(baseBookings * occupancyMultiplier * seasonMultiplier);
    const bookingsDiff = projectedBookings - baseBookings;

    const baseAvgPrice = baseRevenue / (baseBookings || 1);
    const projectedAvgPrice = projectedRevenue / (projectedBookings || 1);

    return {
      baseRevenue,
      projectedRevenue,
      revenueDiff,
      revenueDiffPercent,
      baseBookings,
      projectedBookings,
      bookingsDiff,
      baseAvgPrice: Math.round(baseAvgPrice),
      projectedAvgPrice: Math.round(projectedAvgPrice),
    };
  }, [spaces, simPriceAdjust, simOccupancyAdjust, simSeasonFactor]);

  // ===== Handlers =====
  const handleToggleDynamic = (spaceId: string) => {
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, dynamicEnabled: !s.dynamicEnabled } : s))
    );
  };

  const handleMinPriceChange = (spaceId: string, value: string) => {
    const numVal = Number(value);
    if (Number.isNaN(numVal) || numVal < 0) return;
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, minPrice: numVal } : s))
    );
  };

  const handleMaxPriceChange = (spaceId: string, value: string) => {
    const numVal = Number(value);
    if (Number.isNaN(numVal) || numVal < 0) return;
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, maxPrice: numVal } : s))
    );
  };

  const handleToggleRule = (spaceId: string, ruleId: string) => {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === spaceId
          ? {
              ...s,
              rules: s.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
            }
          : s
      )
    );
  };

  // ===== Gap badge style =====
  const getGapClass = (indicator: GapIndicator): string => {
    switch (indicator) {
      case 'underpriced':
        return styles.gapUnderpriced;
      case 'overpriced':
        return styles.gapOverpriced;
      case 'correct':
        return styles.gapCorrect;
    }
  };

  // ===== Demand bar color =====
  const getDemandBarColor = (value: number): string => {
    if (value >= 80) return 'var(--state-success)';
    if (value >= 50) return 'var(--state-info)';
    if (value >= 30) return 'var(--state-warning)';
    return 'var(--border-strong)';
  };

  // ===== Render =====
  return (
    <div className={styles.page}>
      <Header
        title="AI Pricing"
        subtitle="Suggestions de tarification intelligentes"
        actions={
          <Badge variant="info" size="sm" dot>
            Analyse AI en cours
          </Badge>
        }
      />

      <div className={styles.content}>
        {/* KPI Summary */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Revenus mensuels</span>
              <div className={styles.kpiIcon}>
                <DollarSign size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>{formatCurrency(kpis.totalRevenue)}</div>
            <div className={cn(styles.kpiChange, styles.kpiUp)}>
              <TrendingUp size={14} />
              +12% vs mois precedent
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Occupation moyenne</span>
              <div className={styles.kpiIcon}>
                <BarChart3 size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>{kpis.avgOccupancy}%</div>
            <div className={cn(styles.kpiChange, styles.kpiUp)}>
              <TrendingUp size={14} />
              +5 pts vs mois precedent
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Reservations / mois</span>
              <div className={styles.kpiIcon}>
                <Clock size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>{kpis.totalBookings}</div>
            <div className={cn(styles.kpiChange, styles.kpiNeutral)}>
              Stable
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Espaces sous-evalues</span>
              <div className={styles.kpiIcon}>
                <Target size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>{kpis.underpricedCount}</div>
            <div className={cn(styles.kpiChange, styles.kpiDown)}>
              <TrendingDown size={14} />
              Potentiel de revenus inexploite
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={cn(styles.tab, activeTab === tab.id && styles.tabActive)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className={styles.spacesGrid}>
            {spaces.map((space) => (
              <div key={space.id} className={styles.spaceCard}>
                <div className={styles.spaceCardHeader}>
                  <div className={styles.spaceInfo}>
                    <span className={styles.spaceName}>{space.name}</span>
                    <span className={styles.spaceType}>{space.type}</span>
                  </div>
                  <span className={cn(styles.gapBadge, getGapClass(space.gapIndicator))}>
                    {space.gapIndicator === 'underpriced' && <TrendingUp size={12} />}
                    {space.gapIndicator === 'overpriced' && <TrendingDown size={12} />}
                    {space.gapIndicator === 'correct' && <Target size={12} />}
                    {space.gapLabel}
                  </span>
                </div>

                <div className={styles.spaceCardBody}>
                  {/* Pricing comparison */}
                  <div className={styles.pricingGrid}>
                    {space.pricing.map((slot) => {
                      const diff = slot.recommendedPrice - slot.currentPrice;
                      const diffPercent = slot.currentPrice > 0
                        ? Math.round((diff / slot.currentPrice) * 100)
                        : 0;

                      return (
                        <div key={slot.label} className={styles.pricingSlot}>
                          <span className={styles.slotLabel}>{slot.label} ({slot.duration})</span>
                          <div className={styles.priceRow}>
                            <div className={styles.currentPrice}>
                              <span className={styles.priceLabel}>Actuel</span>
                              <span className={styles.priceValue}>{formatCurrency(slot.currentPrice)}</span>
                            </div>
                            <div className={styles.recommendedPrice}>
                              <span className={styles.priceLabel}>Recommande</span>
                              <span className={styles.recommendedValue}>{formatCurrency(slot.recommendedPrice)}</span>
                              {diff !== 0 && (
                                <span className={cn(
                                  styles.priceDiff,
                                  diff > 0 ? styles.priceDiffUp : styles.priceDiffDown
                                )}>
                                  {diff > 0 ? '+' : ''}{diffPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Demand chart */}
                  <div className={styles.demandSection}>
                    <span className={styles.demandTitle}>Demande par jour de la semaine</span>
                    <div className={styles.demandChart}>
                      {space.demand.map((d) => {
                        const maxVal = Math.max(...space.demand.map((dd) => dd.value));
                        const heightPercent = maxVal > 0 ? (d.value / maxVal) * 100 : 0;

                        return (
                          <div key={d.label} className={styles.demandBar}>
                            <div
                              className={styles.demandBarFill}
                              style={{
                                height: `${heightPercent}%`,
                                backgroundColor: getDemandBarColor(d.value),
                              }}
                              data-value={`${d.value}%`}
                            />
                            <span className={styles.demandBarLabel}>{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Factors */}
                  <div className={styles.factorsSection}>
                    <span className={styles.factorsTitle}>Facteurs consideres par l'AI</span>
                    <div className={styles.factorsList}>
                      {space.factors.map((factor) => {
                        const Icon = factor.icon;
                        return (
                          <div key={factor.name} className={styles.factorItem}>
                            <div className={cn(styles.factorIcon, styles[factor.iconClass])}>
                              <Icon size={16} />
                            </div>
                            <div className={styles.factorInfo}>
                              <span className={styles.factorName}>{factor.name}</span>
                              <span className={styles.factorValue}>{factor.value}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Pricing Tab */}
        {activeTab === 'dynamic' && (
          <div className={styles.dynamicGrid}>
            {spaces.map((space) => (
              <div key={space.id} className={styles.dynamicCard}>
                <div className={styles.dynamicCardHeader}>
                  <div className={styles.dynamicCardInfo}>
                    <span className={styles.dynamicCardName}>{space.name}</span>
                    <span className={styles.dynamicCardStatus}>
                      {space.dynamicEnabled ? 'Tarification dynamique activee' : 'Tarification statique'}
                    </span>
                  </div>
                  <button
                    className={cn(styles.toggleSwitch, space.dynamicEnabled && styles.toggleActive)}
                    onClick={() => handleToggleDynamic(space.id)}
                    aria-label={`${space.dynamicEnabled ? 'Desactiver' : 'Activer'} la tarification dynamique pour ${space.name}`}
                  />
                </div>

                <div className={styles.dynamicCardBody}>
                  {/* Price range */}
                  <div className={styles.rangeSection}>
                    <span className={styles.rangeLabel}>Plage de prix (par heure)</span>
                    <div className={styles.rangeRow}>
                      <div className={styles.rangeInput}>
                        <span className={styles.rangeInputLabel}>Minimum</span>
                        <input
                          type="number"
                          className={styles.rangeInputField}
                          value={space.minPrice}
                          onChange={(e) => handleMinPriceChange(space.id, e.target.value)}
                          min={0}
                          disabled={!space.dynamicEnabled}
                        />
                      </div>
                      <span className={styles.rangeSeparator}>a</span>
                      <div className={styles.rangeInput}>
                        <span className={styles.rangeInputLabel}>Maximum</span>
                        <input
                          type="number"
                          className={styles.rangeInputField}
                          value={space.maxPrice}
                          onChange={(e) => handleMaxPriceChange(space.id, e.target.value)}
                          min={0}
                          disabled={!space.dynamicEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rules */}
                  <div className={styles.rulesSection}>
                    <span className={styles.rulesTitle}>Regles de tarification</span>
                    <div className={styles.rulesList}>
                      {space.rules.map((rule) => (
                        <div key={rule.id} className={styles.ruleItem}>
                          <div className={styles.ruleInfo}>
                            <span className={styles.ruleName}>{rule.name}</span>
                            <span className={styles.ruleDesc}>{rule.description}</span>
                          </div>
                          <span className={cn(
                            styles.ruleValue,
                            rule.modifier >= 0 ? styles.rulePositive : styles.ruleNegative
                          )}>
                            {rule.modifier >= 0 ? '+' : ''}{rule.modifier}%
                          </span>
                          <button
                            className={cn(styles.toggleSwitch, rule.enabled && styles.toggleActive)}
                            onClick={() => handleToggleRule(space.id, rule.id)}
                            aria-label={`${rule.enabled ? 'Desactiver' : 'Activer'} la regle ${rule.name}`}
                            disabled={!space.dynamicEnabled}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simulations Tab */}
        {activeTab === 'simulations' && (
          <div className={styles.simulationLayout}>
            {/* Sliders */}
            <div className={styles.simulationCard}>
              <h3 className={styles.simulationTitle}>Ajuster les parametres</h3>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderItem}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>Ajustement des prix</span>
                    <span className={styles.sliderValue}>
                      {simPriceAdjust >= 0 ? '+' : ''}{simPriceAdjust}%
                    </span>
                  </div>
                  <input
                    type="range"
                    className={styles.slider}
                    min={-30}
                    max={50}
                    value={simPriceAdjust}
                    onChange={(e) => setSimPriceAdjust(Number(e.target.value))}
                  />
                  <div className={styles.sliderRange}>
                    <span>-30%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>

                <div className={styles.sliderItem}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>Impact sur l'occupation</span>
                    <span className={styles.sliderValue}>
                      {simOccupancyAdjust >= 0 ? '+' : ''}{simOccupancyAdjust}%
                    </span>
                  </div>
                  <input
                    type="range"
                    className={styles.slider}
                    min={-30}
                    max={30}
                    value={simOccupancyAdjust}
                    onChange={(e) => setSimOccupancyAdjust(Number(e.target.value))}
                  />
                  <div className={styles.sliderRange}>
                    <span>-30%</span>
                    <span>0%</span>
                    <span>+30%</span>
                  </div>
                </div>

                <div className={styles.sliderItem}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>Facteur saisonnier</span>
                    <span className={styles.sliderValue}>{simSeasonFactor}%</span>
                  </div>
                  <input
                    type="range"
                    className={styles.slider}
                    min={50}
                    max={150}
                    value={simSeasonFactor}
                    onChange={(e) => setSimSeasonFactor(Number(e.target.value))}
                  />
                  <div className={styles.sliderRange}>
                    <span>Basse saison</span>
                    <span>Normal</span>
                    <span>Haute saison</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className={styles.simulationCard}>
              <h3 className={styles.comparisonTitle}>Impact estime</h3>

              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonColumn}>
                  <span className={styles.comparisonLabel}>Avant</span>
                  <span className={styles.comparisonValue}>{formatCurrency(simulation.baseRevenue)}</span>
                  <span className={styles.comparisonSub}>{simulation.baseBookings} reservations / mois</span>
                </div>

                <div className={styles.comparisonArrow}>
                  <ArrowRight size={24} />
                </div>

                <div className={styles.comparisonColumn}>
                  <span className={styles.comparisonLabel}>Apres</span>
                  <span className={styles.comparisonValue}>{formatCurrency(simulation.projectedRevenue)}</span>
                  <span className={styles.comparisonSub}>{simulation.projectedBookings} reservations / mois</span>
                </div>
              </div>

              <div className={styles.comparisonImpact}>
                <div className={styles.impactItem}>
                  <span className={styles.impactLabel}>Variation de revenus</span>
                  <span className={cn(
                    styles.impactValue,
                    simulation.revenueDiff > 0 ? styles.impactPositive
                      : simulation.revenueDiff < 0 ? styles.impactNegative
                      : styles.impactNeutral
                  )}>
                    {simulation.revenueDiff >= 0 ? '+' : ''}{formatCurrency(simulation.revenueDiff)} ({simulation.revenueDiffPercent >= 0 ? '+' : ''}{simulation.revenueDiffPercent}%)
                  </span>
                </div>

                <div className={styles.impactItem}>
                  <span className={styles.impactLabel}>Variation de reservations</span>
                  <span className={cn(
                    styles.impactValue,
                    simulation.bookingsDiff > 0 ? styles.impactPositive
                      : simulation.bookingsDiff < 0 ? styles.impactNegative
                      : styles.impactNeutral
                  )}>
                    {simulation.bookingsDiff >= 0 ? '+' : ''}{simulation.bookingsDiff} reservations
                  </span>
                </div>

                <div className={styles.impactItem}>
                  <span className={styles.impactLabel}>Prix moyen / reservation</span>
                  <span className={cn(
                    styles.impactValue,
                    simulation.projectedAvgPrice > simulation.baseAvgPrice ? styles.impactPositive
                      : simulation.projectedAvgPrice < simulation.baseAvgPrice ? styles.impactNegative
                      : styles.impactNeutral
                  )}>
                    {formatCurrency(simulation.projectedAvgPrice)}
                    {simulation.projectedAvgPrice !== simulation.baseAvgPrice && (
                      <> (avant: {formatCurrency(simulation.baseAvgPrice)})</>
                    )}
                  </span>
                </div>

                <div className={styles.impactItem}>
                  <span className={styles.impactLabel}>Occupation estimee</span>
                  <span className={cn(styles.impactValue, styles.impactNeutral)}>
                    <Percent size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    {' '}{Math.round(kpis.avgOccupancy * (1 + simOccupancyAdjust / 100) * (simSeasonFactor / 100))}% (actuel: {kpis.avgOccupancy}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
