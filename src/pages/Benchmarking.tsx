import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Star,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import styles from './Benchmarking.module.css';

// --- Types ---

type TabKey = 'overview' | 'competitors' | 'trends';
type PeriodFilter = 'month' | 'quarter' | 'year';
type SpaceCategory = 'all' | 'photo' | 'video' | 'podcast' | 'event';

interface Competitor {
  id: string;
  name: string;
  pricePerHour: number;
  occupancyRate: number;
  revenuePerSqm: number;
  clientRating: number;
  totalSpaces: number;
  monthlyBookings: number;
}

interface MarketKPI {
  label: string;
  yourValue: number;
  marketAverage: number;
  percentile: number;
  format: 'currency' | 'percent' | 'rating' | 'number';
  icon: React.ReactNode;
}

interface MarketTrend {
  id: string;
  title: string;
  description: string;
  direction: 'up' | 'down' | 'neutral';
  value: string;
}

interface MonthlyData {
  month: string;
  shortMonth: string;
  occupancy: number;
  isCurrent: boolean;
}

interface Recommendation {
  id: string;
  type: 'strength' | 'opportunity';
  title: string;
  description: string;
}

// --- Mock Data ---

function generateCompetitors(): Competitor[] {
  return [
    { id: crypto.randomUUID(), name: 'Votre Studio', pricePerHour: 75, occupancyRate: 72, revenuePerSqm: 185, clientRating: 4.6, totalSpaces: 4, monthlyBookings: 124 },
    { id: crypto.randomUUID(), name: 'Studio A', pricePerHour: 85, occupancyRate: 78, revenuePerSqm: 210, clientRating: 4.8, totalSpaces: 6, monthlyBookings: 156 },
    { id: crypto.randomUUID(), name: 'Studio B', pricePerHour: 65, occupancyRate: 68, revenuePerSqm: 155, clientRating: 4.3, totalSpaces: 3, monthlyBookings: 98 },
    { id: crypto.randomUUID(), name: 'Studio C', pricePerHour: 90, occupancyRate: 82, revenuePerSqm: 230, clientRating: 4.9, totalSpaces: 8, monthlyBookings: 189 },
    { id: crypto.randomUUID(), name: 'Studio D', pricePerHour: 55, occupancyRate: 60, revenuePerSqm: 120, clientRating: 4.0, totalSpaces: 2, monthlyBookings: 67 },
    { id: crypto.randomUUID(), name: 'Studio E', pricePerHour: 70, occupancyRate: 74, revenuePerSqm: 175, clientRating: 4.5, totalSpaces: 5, monthlyBookings: 132 },
    { id: crypto.randomUUID(), name: 'Studio F', pricePerHour: 95, occupancyRate: 70, revenuePerSqm: 195, clientRating: 4.4, totalSpaces: 4, monthlyBookings: 108 },
    { id: crypto.randomUUID(), name: 'Studio G', pricePerHour: 80, occupancyRate: 76, revenuePerSqm: 200, clientRating: 4.7, totalSpaces: 5, monthlyBookings: 145 },
    { id: crypto.randomUUID(), name: 'Studio H', pricePerHour: 60, occupancyRate: 65, revenuePerSqm: 140, clientRating: 4.2, totalSpaces: 3, monthlyBookings: 85 },
    { id: crypto.randomUUID(), name: 'Studio I', pricePerHour: 78, occupancyRate: 71, revenuePerSqm: 180, clientRating: 4.5, totalSpaces: 4, monthlyBookings: 118 },
  ];
}

function generateSeasonality(): MonthlyData[] {
  const months = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
  ];
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
  const occupancies = [58, 62, 70, 75, 78, 72, 55, 48, 80, 82, 76, 65];
  const currentMonth = new Date().getMonth();

  return months.map((month, i) => ({
    month,
    shortMonth: shortMonths[i],
    occupancy: occupancies[i],
    isCurrent: i === currentMonth,
  }));
}

function generateTrends(): MarketTrend[] {
  return [
    { id: crypto.randomUUID(), title: 'Croissance du secteur', description: 'Le marche des studios creatifs affiche une croissance soutenue sur les 12 derniers mois.', direction: 'up', value: '+12%' },
    { id: crypto.randomUUID(), title: 'Prix moyen en hausse', description: 'Les tarifs horaires moyens augmentent avec la demande croissante pour des espaces premium.', direction: 'up', value: '+8%' },
    { id: crypto.randomUUID(), title: 'Demande video en forte hausse', description: 'Les reservations pour des espaces de tournage video connaissent la plus forte croissance.', direction: 'up', value: '+25%' },
    { id: crypto.randomUUID(), title: 'Saisonnalite marquee', description: 'La periode septembre-novembre represente le pic d\'activite du secteur.', direction: 'neutral', value: 'Pic Q3-Q4' },
    { id: crypto.randomUUID(), title: 'Equipements haut de gamme', description: 'Les studios offrant du materiel inclus atteignent un taux d\'occupation superieur de 15%.', direction: 'up', value: '+15%' },
    { id: crypto.randomUUID(), title: 'Baisse des reservations courtes', description: 'Les sessions de moins d\'une heure sont en recul au profit de journees completes.', direction: 'down', value: '-18%' },
  ];
}

function generateRecommendations(): { strengths: Recommendation[]; opportunities: Recommendation[] } {
  return {
    strengths: [
      { id: crypto.randomUUID(), type: 'strength', title: 'Rapport qualite-prix competitif', description: 'Votre tarif horaire est inferieur a la moyenne du marche tout en maintenant une note client elevee.' },
      { id: crypto.randomUUID(), type: 'strength', title: 'Satisfaction client elevee', description: 'Votre note de 4.6/5 vous place dans le top 40% du marche.' },
      { id: crypto.randomUUID(), type: 'strength', title: 'Croissance des reservations', description: 'Votre volume de reservations a augmente de 15% par rapport au trimestre precedent.' },
    ],
    opportunities: [
      { id: crypto.randomUUID(), type: 'opportunity', title: 'Augmenter le taux d\'occupation', description: 'Votre taux de 72% est en dessous des leaders du marche (82%). Des offres promotionnelles en heures creuses pourraient aider.' },
      { id: crypto.randomUUID(), type: 'opportunity', title: 'Optimiser le revenu/m\u00B2', description: 'A 185 EUR/m\u00B2, il y a une marge d\'amelioration par rapport aux 230 EUR/m\u00B2 des meilleurs studios.' },
      { id: crypto.randomUUID(), type: 'opportunity', title: 'Elargir l\'offre video', description: 'La demande pour les espaces video augmente de 25%. Investir dans ce segment pourrait augmenter les revenus.' },
    ],
  };
}

// --- Helpers ---

function formatValue(value: number, format: 'currency' | 'percent' | 'rating' | 'number'): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value}%`;
    case 'rating':
      return `${value.toFixed(1)}/5`;
    case 'number':
      return String(value);
  }
}

function getPercentileClass(percentile: number): string {
  if (percentile >= 70) return styles.percentileHigh;
  if (percentile >= 40) return styles.percentileMid;
  return styles.percentileLow;
}

function calculateCompetitivityScore(
  competitors: Competitor[],
  yourStudio: Competitor
): number {
  const metrics = [
    { yours: yourStudio.pricePerHour, values: competitors.map(c => c.pricePerHour), weight: 0.2, inverse: true },
    { yours: yourStudio.occupancyRate, values: competitors.map(c => c.occupancyRate), weight: 0.3, inverse: false },
    { yours: yourStudio.revenuePerSqm, values: competitors.map(c => c.revenuePerSqm), weight: 0.25, inverse: false },
    { yours: yourStudio.clientRating, values: competitors.map(c => c.clientRating), weight: 0.25, inverse: false },
  ];

  let score = 0;
  for (const metric of metrics) {
    const sorted = [...metric.values].sort((a, b) => metric.inverse ? a - b : b - a);
    const rank = sorted.indexOf(metric.yours) + 1;
    const normalizedScore = ((sorted.length - rank + 1) / sorted.length) * 100;
    score += normalizedScore * metric.weight;
  }

  return Math.round(score);
}

// --- Tab Labels ---

const TAB_CONFIG: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Vue d\'ensemble' },
  { key: 'competitors', label: 'Concurrents' },
  { key: 'trends', label: 'Tendances' },
];

const PERIOD_OPTIONS: Array<{ key: PeriodFilter; label: string }> = [
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette annee' },
];

const SPACE_CATEGORIES: Array<{ key: SpaceCategory; label: string }> = [
  { key: 'all', label: 'Tous les espaces' },
  { key: 'photo', label: 'Studios photo' },
  { key: 'video', label: 'Studios video' },
  { key: 'podcast', label: 'Studios podcast' },
  { key: 'event', label: 'Espaces evenement' },
];

// --- Main Component ---

export function Benchmarking() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [spaceCategory, setSpaceCategory] = useState<SpaceCategory>('all');

  const competitors = useMemo(() => generateCompetitors(), []);
  const seasonality = useMemo(() => generateSeasonality(), []);
  const trends = useMemo(() => generateTrends(), []);
  const recommendations = useMemo(() => generateRecommendations(), []);

  const yourStudio = competitors[0];

  const marketAverage = useMemo(() => ({
    pricePerHour: Math.round(competitors.reduce((s, c) => s + c.pricePerHour, 0) / competitors.length),
    occupancyRate: Math.round(competitors.reduce((s, c) => s + c.occupancyRate, 0) / competitors.length),
    revenuePerSqm: Math.round(competitors.reduce((s, c) => s + c.revenuePerSqm, 0) / competitors.length),
    clientRating: Number((competitors.reduce((s, c) => s + c.clientRating, 0) / competitors.length).toFixed(1)),
  }), [competitors]);

  const calculatePercentile = (value: number, allValues: number[], higherIsBetter = true): number => {
    const sorted = [...allValues].sort((a, b) => a - b);
    const rank = sorted.filter(v => (higherIsBetter ? v <= value : v >= value)).length;
    return Math.round((rank / sorted.length) * 100);
  };

  const kpis: MarketKPI[] = useMemo(() => [
    {
      label: 'Prix moyen / heure',
      yourValue: yourStudio.pricePerHour,
      marketAverage: marketAverage.pricePerHour,
      percentile: calculatePercentile(yourStudio.pricePerHour, competitors.map(c => c.pricePerHour), false),
      format: 'currency',
      icon: <DollarSign size={20} />,
    },
    {
      label: 'Taux d\'occupation',
      yourValue: yourStudio.occupancyRate,
      marketAverage: marketAverage.occupancyRate,
      percentile: calculatePercentile(yourStudio.occupancyRate, competitors.map(c => c.occupancyRate)),
      format: 'percent',
      icon: <Clock size={20} />,
    },
    {
      label: 'Revenu / m\u00B2',
      yourValue: yourStudio.revenuePerSqm,
      marketAverage: marketAverage.revenuePerSqm,
      percentile: calculatePercentile(yourStudio.revenuePerSqm, competitors.map(c => c.revenuePerSqm)),
      format: 'currency',
      icon: <BarChart3 size={20} />,
    },
    {
      label: 'Note moyenne clients',
      yourValue: yourStudio.clientRating,
      marketAverage: marketAverage.clientRating,
      percentile: calculatePercentile(yourStudio.clientRating, competitors.map(c => c.clientRating)),
      format: 'rating',
      icon: <Star size={20} />,
    },
  ], [yourStudio, marketAverage, competitors]);

  const rankedCompetitors = useMemo(() => {
    return [...competitors].sort((a, b) => {
      const scoreA = a.occupancyRate * 0.3 + a.clientRating * 20 * 0.25 + a.revenuePerSqm / 10 * 0.25 + a.monthlyBookings / 10 * 0.2;
      const scoreB = b.occupancyRate * 0.3 + b.clientRating * 20 * 0.25 + b.revenuePerSqm / 10 * 0.25 + b.monthlyBookings / 10 * 0.2;
      return scoreB - scoreA;
    });
  }, [competitors]);

  const competitivityScore = useMemo(
    () => calculateCompetitivityScore(competitors, yourStudio),
    [competitors, yourStudio]
  );

  const maxOccupancy = useMemo(
    () => Math.max(...seasonality.map(m => m.occupancy)),
    [seasonality]
  );

  // Apply filters for display (mock: filters are decorative in demo mode)
  void period;
  void spaceCategory;

  return (
    <div className={styles.page}>
      <Header
        title="Benchmarking"
        subtitle="Analyse comparative du marche"
      />

      <div className={styles.content}>
        {/* Top Bar: Filters */}
        <div className={styles.topBar}>
          <div className={styles.tabs}>
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={spaceCategory}
              onChange={(e) => setSpaceCategory(e.target.value as SpaceCategory)}
            >
              {SPACE_CATEGORIES.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            kpis={kpis}
            rankedCompetitors={rankedCompetitors}
            yourStudioName={yourStudio.name}
            competitivityScore={competitivityScore}
            recommendations={recommendations}
          />
        )}

        {activeTab === 'competitors' && (
          <CompetitorsTab
            rankedCompetitors={rankedCompetitors}
            yourStudioName={yourStudio.name}
            marketAverage={marketAverage}
            competitors={competitors}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsTab
            trends={trends}
            seasonality={seasonality}
            maxOccupancy={maxOccupancy}
          />
        )}
      </div>
    </div>
  );
}

// --- Tab: Overview ---

interface OverviewTabProps {
  kpis: MarketKPI[];
  rankedCompetitors: Competitor[];
  yourStudioName: string;
  competitivityScore: number;
  recommendations: { strengths: Recommendation[]; opportunities: Recommendation[] };
}

function OverviewTab({ kpis, rankedCompetitors, yourStudioName, competitivityScore, recommendations }: OverviewTabProps) {
  return (
    <>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className={styles.animateIn}>
            <Card padding="lg" hoverable className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>{kpi.label}</span>
                <div className={styles.kpiIcon}>{kpi.icon}</div>
              </div>
              <div className={styles.kpiValue}>{formatValue(kpi.yourValue, kpi.format)}</div>
              <div className={styles.kpiMeta}>
                <div className={styles.kpiMetaRow}>
                  <span className={styles.kpiMetaLabel}>Moyenne marche</span>
                  <span className={styles.kpiMetaValue}>{formatValue(kpi.marketAverage, kpi.format)}</span>
                </div>
              </div>
              <div className={`${styles.kpiPercentile} ${getPercentileClass(kpi.percentile)}`}>
                {kpi.percentile >= 50 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.percentile}e percentile
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Overview: Chart + Gauge */}
      <div className={styles.overviewGrid}>
        {/* Top 5 Ranking */}
        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Top 5 du classement" subtitle="Positionnement global" />
            <CardContent>
              <table className={styles.rankingTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Studio</th>
                    <th>Occupation</th>
                    <th>Note</th>
                    <th>Reservations/mois</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedCompetitors.slice(0, 5).map((competitor, index) => (
                    <tr
                      key={competitor.id}
                      className={competitor.name === yourStudioName ? styles.rankHighlight : ''}
                    >
                      <td>
                        <span className={styles.rankPosition}>{index + 1}</span>
                      </td>
                      <td>{competitor.name}</td>
                      <td>{competitor.occupancyRate}%</td>
                      <td>{competitor.clientRating.toFixed(1)}</td>
                      <td>{competitor.monthlyBookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Competitivity Gauge */}
        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Score de competitivite" subtitle="Indice global" />
            <CardContent>
              <CompetitivityGauge score={competitivityScore} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.recommendationsGrid}>
        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Points forts" subtitle="Vos avantages concurrentiels" />
            <CardContent>
              <div className={styles.recommendationList}>
                {recommendations.strengths.map((rec) => (
                  <div key={rec.id} className={styles.recommendationItem}>
                    <div className={`${styles.recommendationIcon} ${styles.recommendationIconStrength}`}>
                      <CheckCircle size={14} />
                    </div>
                    <div className={styles.recommendationContent}>
                      <div className={styles.recommendationTitle}>{rec.title}</div>
                      <div className={styles.recommendationDescription}>{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Opportunites" subtitle="Pistes d'amelioration" />
            <CardContent>
              <div className={styles.recommendationList}>
                {recommendations.opportunities.map((rec) => (
                  <div key={rec.id} className={styles.recommendationItem}>
                    <div className={`${styles.recommendationIcon} ${styles.recommendationIconOpportunity}`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className={styles.recommendationContent}>
                      <div className={styles.recommendationTitle}>{rec.title}</div>
                      <div className={styles.recommendationDescription}>{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Score global" />
            <CardContent>
              <CompetitivityGauge score={competitivityScore} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// --- Tab: Competitors ---

interface CompetitorsTabProps {
  rankedCompetitors: Competitor[];
  yourStudioName: string;
  marketAverage: {
    pricePerHour: number;
    occupancyRate: number;
    revenuePerSqm: number;
    clientRating: number;
  };
  competitors: Competitor[];
}

function CompetitorsTab({ rankedCompetitors, yourStudioName, marketAverage, competitors }: CompetitorsTabProps) {
  const maxPrice = Math.max(...competitors.map(c => c.pricePerHour));
  const maxOccupancy = Math.max(...competitors.map(c => c.occupancyRate));
  const maxRating = 5;

  return (
    <>
      {/* Full Ranking Table */}
      <div className={`${styles.animateIn} ${styles.rankingSection}`}>
        <Card padding="lg">
          <CardHeader
            title="Classement complet"
            subtitle={`${rankedCompetitors.length} studios compares`}
          />
          <CardContent>
            <table className={styles.rankingTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Studio</th>
                  <th>Prix/h</th>
                  <th>Occupation</th>
                  <th>Revenu/m&sup2;</th>
                  <th>Note</th>
                  <th>Espaces</th>
                  <th>Reservations/mois</th>
                </tr>
              </thead>
              <tbody>
                {rankedCompetitors.map((competitor, index) => (
                  <tr
                    key={competitor.id}
                    className={competitor.name === yourStudioName ? styles.rankHighlight : ''}
                  >
                    <td>
                      <span className={styles.rankPosition}>{index + 1}</span>
                    </td>
                    <td>{competitor.name}</td>
                    <td>{formatCurrency(competitor.pricePerHour)}</td>
                    <td>{competitor.occupancyRate}%</td>
                    <td>{formatCurrency(competitor.revenuePerSqm)}</td>
                    <td>{competitor.clientRating.toFixed(1)}</td>
                    <td>{competitor.totalSpaces}</td>
                    <td>{competitor.monthlyBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Comparative Bar Charts */}
      <div className={styles.chartSection}>
        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Prix compares" subtitle="Tarif horaire" />
            <CardContent>
              <div className={styles.barChart}>
                {rankedCompetitors.slice(0, 6).map((competitor) => (
                  <div key={competitor.id} className={styles.barItem}>
                    <div className={styles.barLabel}>
                      <span className={styles.barLabelName}>{competitor.name}</span>
                      <span className={styles.barLabelValue}>{formatCurrency(competitor.pricePerHour)}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${competitor.name === yourStudioName ? styles.barFillYou : styles.barFillPrimary}`}
                        style={{ width: `${(competitor.pricePerHour / maxPrice) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className={styles.barItem}>
                  <div className={styles.barLabel}>
                    <span className={styles.barLabelName}>Moyenne marche</span>
                    <span className={styles.barLabelValue}>{formatCurrency(marketAverage.pricePerHour)}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles.barFillWarning}`}
                      style={{ width: `${(marketAverage.pricePerHour / maxPrice) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Occupation comparee" subtitle="Taux d'occupation" />
            <CardContent>
              <div className={styles.barChart}>
                {rankedCompetitors.slice(0, 6).map((competitor) => (
                  <div key={competitor.id} className={styles.barItem}>
                    <div className={styles.barLabel}>
                      <span className={styles.barLabelName}>{competitor.name}</span>
                      <span className={styles.barLabelValue}>{competitor.occupancyRate}%</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${competitor.name === yourStudioName ? styles.barFillYou : styles.barFillPrimary}`}
                        style={{ width: `${(competitor.occupancyRate / maxOccupancy) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className={styles.barItem}>
                  <div className={styles.barLabel}>
                    <span className={styles.barLabelName}>Moyenne marche</span>
                    <span className={styles.barLabelValue}>{marketAverage.occupancyRate}%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles.barFillWarning}`}
                      style={{ width: `${(marketAverage.occupancyRate / maxOccupancy) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.animateIn}>
          <Card padding="lg">
            <CardHeader title="Satisfaction comparee" subtitle="Note clients" />
            <CardContent>
              <div className={styles.barChart}>
                {rankedCompetitors.slice(0, 6).map((competitor) => (
                  <div key={competitor.id} className={styles.barItem}>
                    <div className={styles.barLabel}>
                      <span className={styles.barLabelName}>{competitor.name}</span>
                      <span className={styles.barLabelValue}>{competitor.clientRating.toFixed(1)}/5</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${competitor.name === yourStudioName ? styles.barFillYou : styles.barFillPrimary}`}
                        style={{ width: `${(competitor.clientRating / maxRating) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className={styles.barItem}>
                  <div className={styles.barLabel}>
                    <span className={styles.barLabelName}>Moyenne marche</span>
                    <span className={styles.barLabelValue}>{marketAverage.clientRating.toFixed(1)}/5</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles.barFillWarning}`}
                      style={{ width: `${(marketAverage.clientRating / maxRating) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// --- Tab: Trends ---

interface TrendsTabProps {
  trends: MarketTrend[];
  seasonality: MonthlyData[];
  maxOccupancy: number;
}

function TrendsTab({ trends, seasonality, maxOccupancy }: TrendsTabProps) {
  return (
    <>
      {/* Market Trends */}
      <div className={styles.animateIn}>
        <Card padding="lg" style={{ marginBottom: 'var(--section-gap)' }}>
          <CardHeader title="Tendances du marche" subtitle="Evolutions recentes du secteur" />
          <CardContent>
            <div className={styles.trendsGrid}>
              {trends.map((trend) => (
                <TrendItem key={trend.id} trend={trend} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seasonality */}
      <div className={styles.animateIn}>
        <Card padding="lg">
          <CardHeader title="Saisonnalite" subtitle="Taux d'occupation moyen par mois sur le marche" />
          <CardContent>
            <div className={styles.seasonalityChart}>
              {seasonality.map((month) => (
                <div key={month.month} className={styles.seasonalityBar}>
                  <div className={styles.seasonalityValue}>{month.occupancy}%</div>
                  <div className={styles.seasonalityBarTrack}>
                    <div
                      className={`${styles.seasonalityBarFill} ${month.isCurrent ? styles.seasonalityBarCurrent : ''}`}
                      style={{ height: `${(month.occupancy / maxOccupancy) * 100}%` }}
                    />
                  </div>
                  <span className={styles.seasonalityLabel}>{month.shortMonth}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// --- Sub-components ---

function TrendItem({ trend }: { trend: MarketTrend }) {
  const directionConfig = {
    up: { icon: <TrendingUp size={18} />, iconClass: styles.trendIconUp, valueClass: styles.trendValueUp },
    down: { icon: <TrendingDown size={18} />, iconClass: styles.trendIconDown, valueClass: styles.trendValueDown },
    neutral: { icon: <Minus size={18} />, iconClass: styles.trendIconNeutral, valueClass: styles.trendValueNeutral },
  };

  const config = directionConfig[trend.direction];

  return (
    <div className={styles.trendItem}>
      <div className={`${styles.trendIcon} ${config.iconClass}`}>
        {config.icon}
      </div>
      <div className={styles.trendContent}>
        <div className={styles.trendTitle}>{trend.title}</div>
        <div className={styles.trendDescription}>{trend.description}</div>
        <div className={`${styles.trendValue} ${config.valueClass}`}>
          {trend.direction === 'up' && <ArrowUpRight size={14} />}
          {trend.direction === 'down' && <ArrowDownRight size={14} />}
          {trend.value}
        </div>
      </div>
    </div>
  );
}

interface CompetitivityGaugeProps {
  score: number;
}

function CompetitivityGauge({ score }: CompetitivityGaugeProps) {
  const angle = (score / 100) * 360;
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Bon' : 'A ameliorer';

  return (
    <div className={styles.gaugeContainer}>
      <div className={styles.gauge}>
        <div
          className={styles.gaugeCircle}
          style={{ '--gauge-angle': `${angle}deg` } as React.CSSProperties}
        >
          <div className={styles.gaugeInner}>
            <span className={styles.gaugeValue}>{score}</span>
            <span className={styles.gaugeUnit}>/ 100</span>
          </div>
        </div>
      </div>
      <div className={styles.gaugeLabel}>{label}</div>
      <div className={styles.gaugeSublabel}>Score de competitivite global</div>
    </div>
  );
}
