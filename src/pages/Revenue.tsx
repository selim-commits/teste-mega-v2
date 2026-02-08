import { useState, useMemo, useCallback, Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Tag,
  Plus,
  Edit3,
  Shuffle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { formatCurrency } from '../lib/utils';
import styles from './Revenue.module.css';

// ─── Types ───────────────────────────────────────────────────────

interface Space {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  weekendPrice: number;
  peakPrice: number;
}

interface PricingRule {
  id: string;
  name: string;
  description: string;
  percentage: number;
  direction: 'up' | 'down';
  enabled: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  currentUses: number;
  status: 'active' | 'expired' | 'exhausted';
  spaces: string[];
}

interface PromoFormData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  spaces: string;
}

// ─── Mock Data ───────────────────────────────────────────────────

const initialSpaces: Space[] = [
  { id: '1', name: 'Studio A', type: 'Photo', basePrice: 75, weekendPrice: 90, peakPrice: 95 },
  { id: '2', name: 'Studio B', type: 'Video', basePrice: 120, weekendPrice: 145, peakPrice: 150 },
  { id: '3', name: 'Salle de maquillage', type: 'Maquillage', basePrice: 40, weekendPrice: 48, peakPrice: 50 },
  { id: '4', name: 'Plateau cyclorama', type: 'Photo/Video', basePrice: 150, weekendPrice: 180, peakPrice: 188 },
  { id: '5', name: 'Studio exterieur', type: 'Evenementiel', basePrice: 95, weekendPrice: 114, peakPrice: 119 },
];

const initialRules: PricingRule[] = [
  { id: '1', name: 'Majoration week-end', description: '+20% samedi et dimanche', percentage: 20, direction: 'up', enabled: true },
  { id: '2', name: 'Remise longue duree', description: '-10% pour les reservations de plus de 4 heures', percentage: 10, direction: 'down', enabled: true },
  { id: '3', name: 'Tarif early bird', description: '-15% si reserve 7 jours ou plus en avance', percentage: 15, direction: 'down', enabled: false },
  { id: '4', name: 'Heure de pointe', description: '+25% entre 18h et 22h', percentage: 25, direction: 'up', enabled: true },
  { id: '5', name: 'Remise fidelite', description: '-5% apres 10 reservations', percentage: 5, direction: 'down', enabled: false },
];

const initialPromoCodes: PromoCode[] = [
  { id: '1', code: 'BIENVENUE20', type: 'percentage', value: 20, startDate: '2026-01-01', endDate: '2026-03-31', maxUses: 100, currentUses: 42, status: 'active', spaces: ['Tous'] },
  { id: '2', code: 'STUDIO50', type: 'fixed', value: 50, startDate: '2026-02-01', endDate: '2026-02-28', maxUses: 30, currentUses: 18, status: 'active', spaces: ['Studio A', 'Studio B'] },
  { id: '3', code: 'NOEL2025', type: 'percentage', value: 25, startDate: '2025-12-01', endDate: '2025-12-31', maxUses: 50, currentUses: 50, status: 'exhausted', spaces: ['Tous'] },
  { id: '4', code: 'ETE2025', type: 'percentage', value: 15, startDate: '2025-06-01', endDate: '2025-08-31', maxUses: 0, currentUses: 87, status: 'expired', spaces: ['Tous'] },
  { id: '5', code: 'VIP10', type: 'fixed', value: 10, startDate: '2026-01-15', endDate: '2026-06-30', maxUses: 0, currentUses: 12, status: 'active', spaces: ['Tous'] },
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Component ───────────────────────────────────────────────────

export function Revenue() {
  // State
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [rules, setRules] = useState<PricingRule[]>(initialRules);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes);

  // Modals
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isEditSpaceModalOpen, setIsEditSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  // Promo form
  const [promoForm, setPromoForm] = useState<PromoFormData>({
    code: '',
    type: 'percentage',
    value: 0,
    startDate: '',
    endDate: '',
    maxUses: 0,
    spaces: 'all',
  });

  // Edit space form
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editWeekendPrice, setEditWeekendPrice] = useState('');
  const [editPeakPrice, setEditPeakPrice] = useState('');

  // Hooks
  const { success: showSuccess, info: showInfo } = useNotifications();

  // ─── KPI Calculations ──────────────────────────────────────

  const stats = useMemo(() => {
    const avgRevenuePerHour = spaces.reduce((sum, s) => sum + s.basePrice, 0) / spaces.length;
    const occupancyRate = 72; // Mock
    const revpar = avgRevenuePerHour * (occupancyRate / 100);
    const activePromos = promoCodes.filter((p) => p.status === 'active').length;

    return { avgRevenuePerHour, occupancyRate, revpar, activePromos };
  }, [spaces, promoCodes]);

  const kpis = [
    {
      title: 'Revenu moyen / heure',
      value: formatCurrency(stats.avgRevenuePerHour),
      icon: DollarSign,
      color: 'var(--accent-green)',
    },
    {
      title: "Taux d'occupation",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'var(--accent-blue)',
    },
    {
      title: 'RevPAR',
      value: formatCurrency(stats.revpar),
      icon: Percent,
      color: 'var(--accent-purple, var(--accent-primary))',
    },
    {
      title: 'Codes promo actifs',
      value: String(stats.activePromos),
      icon: Tag,
      color: 'var(--accent-orange, var(--state-warning))',
    },
  ];

  // ─── Calendar Price Calculation ─────────────────────────────

  const calendarData = useMemo(() => {
    return spaces.map((space) => {
      const prices = DAYS_OF_WEEK.map((_, dayIndex) => {
        const isWeekend = dayIndex >= 5; // Samedi, Dimanche
        const isPeak = dayIndex >= 0 && dayIndex <= 4; // Lun-Ven (simulant heures de pointe)

        let price = space.basePrice;
        let variant: 'normal' | 'increased' | 'decreased' = 'normal';

        if (isWeekend) {
          price = space.weekendPrice;
          variant = 'increased';
        } else if (isPeak && dayIndex === 4) {
          // Vendredi soir = heure de pointe
          price = space.peakPrice;
          variant = 'increased';
        }

        // Apply early bird discount on Tuesday/Wednesday (simulated lower-demand days)
        if (dayIndex === 1 || dayIndex === 2) {
          price = Math.round(space.basePrice * 0.9);
          variant = 'decreased';
        }

        return { price, variant };
      });
      return { space, prices };
    });
  }, [spaces]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleToggleRule = useCallback((ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const handleOpenEditSpace = useCallback((space: Space) => {
    setEditingSpace(space);
    setEditBasePrice(String(space.basePrice));
    setEditWeekendPrice(String(space.weekendPrice));
    setEditPeakPrice(String(space.peakPrice));
    setIsEditSpaceModalOpen(true);
  }, []);

  const handleSaveSpace = useCallback(() => {
    if (!editingSpace) return;

    const base = parseFloat(editBasePrice);
    const weekend = parseFloat(editWeekendPrice);
    const peak = parseFloat(editPeakPrice);

    if (isNaN(base) || isNaN(weekend) || isNaN(peak)) return;

    setSpaces((prev) =>
      prev.map((s) =>
        s.id === editingSpace.id
          ? { ...s, basePrice: base, weekendPrice: weekend, peakPrice: peak }
          : s
      )
    );

    setIsEditSpaceModalOpen(false);
    setEditingSpace(null);
    showSuccess('Tarifs mis a jour', `Les tarifs de ${editingSpace.name} ont ete mis a jour`);
  }, [editingSpace, editBasePrice, editWeekendPrice, editPeakPrice, showSuccess]);

  const handleGenerateCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromoForm((prev) => ({ ...prev, code }));
  }, []);

  const handleCreatePromo = useCallback(() => {
    if (!promoForm.code || !promoForm.startDate || !promoForm.endDate || promoForm.value <= 0) {
      return;
    }

    const newPromo: PromoCode = {
      id: String(Date.now()),
      code: promoForm.code.toUpperCase(),
      type: promoForm.type,
      value: promoForm.value,
      startDate: promoForm.startDate,
      endDate: promoForm.endDate,
      maxUses: promoForm.maxUses,
      currentUses: 0,
      status: 'active',
      spaces: promoForm.spaces === 'all' ? ['Tous'] : [promoForm.spaces],
    };

    setPromoCodes((prev) => [newPromo, ...prev]);
    setIsPromoModalOpen(false);
    setPromoForm({ code: '', type: 'percentage', value: 0, startDate: '', endDate: '', maxUses: 0, spaces: 'all' });
    showSuccess('Code promo cree', `Le code ${newPromo.code} a ete cree avec succes`);
  }, [promoForm, showSuccess]);

  const getStatusBadge = (status: PromoCode['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm" dot>Actif</Badge>;
      case 'expired':
        return <Badge variant="default" size="sm" dot>Expire</Badge>;
      case 'exhausted':
        return <Badge variant="warning" size="sm" dot>Epuise</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDateFR = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const spaceOptions = [
    { value: 'all', label: 'Tous les espaces' },
    ...spaces.map((s) => ({ value: s.name, label: s.name })),
  ];

  const typeOptions = [
    { value: 'percentage', label: 'Pourcentage' },
    { value: 'fixed', label: 'Montant fixe' },
  ];

  return (
    <div className={styles.page}>
      <Header
        title="Tarification"
        subtitle="Gerez vos prix, regles de tarification et promotions"
      />

      <div className={styles.content}>
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="lg" hoverable className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>{kpi.title}</span>
                  <div className={styles.kpiIcon} style={{ backgroundColor: `${kpi.color}15` }}>
                    <kpi.icon size={20} color={kpi.color} />
                  </div>
                </div>
                <div className={styles.kpiValue}>{kpi.value}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Section 1: Tarification par espace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Tarification par espace</h3>
                <p className={styles.sectionSubtitle}>Prix horaires par type de creneau</p>
              </div>
            </div>
            <CardContent>
              <table className={styles.pricingTable}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prix de base/h</th>
                    <th>Prix week-end/h</th>
                    <th>Prix heure de pointe/h</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spaces.map((space) => (
                    <tr key={space.id}>
                      <td>
                        <span className={styles.spaceName}>{space.name}</span>
                        <span className={styles.spaceType}>{space.type}</span>
                      </td>
                      <td className={styles.priceCell}>{formatCurrency(space.basePrice)}</td>
                      <td className={styles.priceCell}>{formatCurrency(space.weekendPrice)}</td>
                      <td className={styles.priceCell}>{formatCurrency(space.peakPrice)}</td>
                      <td className={styles.actionCell}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Edit3 size={14} />}
                          onClick={() => handleOpenEditSpace(space)}
                        >
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: Regles de tarification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Regles de tarification</h3>
                <p className={styles.sectionSubtitle}>Ajustements automatiques des prix</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => showInfo('Ajouter une regle', 'Fonctionnalite bientot disponible')}
              >
                Ajouter une regle
              </Button>
            </div>
            <CardContent>
              <div className={styles.rulesList}>
                {rules.map((rule) => (
                  <div key={rule.id} className={styles.ruleCard}>
                    <div className={styles.ruleInfo}>
                      <span className={styles.ruleName}>
                        {rule.name}
                        {!rule.enabled && (
                          <Badge variant="default" size="sm">Desactive</Badge>
                        )}
                      </span>
                      <span className={styles.ruleDescription}>{rule.description}</span>
                    </div>
                    <div className={styles.ruleActions}>
                      <span className={`${styles.rulePercentage} ${rule.direction === 'up' ? styles.rulePercentageUp : styles.rulePercentageDown}`}>
                        {rule.direction === 'up' ? '+' : '-'}{rule.percentage}%
                      </span>
                      <Switch
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: Codes promotionnels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Codes promotionnels</h3>
                <p className={styles.sectionSubtitle}>Gerez vos codes de reduction</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setIsPromoModalOpen(true)}
              >
                Nouveau code promo
              </Button>
            </div>
            <CardContent>
              <div className={styles.promoGrid}>
                {promoCodes.map((promo) => (
                  <div key={promo.id} className={styles.promoCard}>
                    <div className={styles.promoHeader}>
                      <span className={styles.promoCode}>{promo.code}</span>
                      {getStatusBadge(promo.status)}
                    </div>
                    <div className={styles.promoValue}>
                      {promo.type === 'percentage' ? `-${promo.value}%` : `-${formatCurrency(promo.value)}`}
                    </div>
                    <div className={styles.promoDetails}>
                      <div className={styles.promoRow}>
                        <span>Periode</span>
                        <span>{formatDateFR(promo.startDate)} - {formatDateFR(promo.endDate)}</span>
                      </div>
                      <div className={styles.promoRow}>
                        <span>Utilisations</span>
                        <span>{promo.currentUses}{promo.maxUses > 0 ? ` / ${promo.maxUses}` : ' (illimite)'}</span>
                      </div>
                      <div className={styles.promoRow}>
                        <span>Espaces</span>
                        <span>{promo.spaces.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 4: Apercu calendrier tarifaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Apercu calendrier tarifaire</h3>
                <p className={styles.sectionSubtitle}>Prix par jour de la semaine</p>
              </div>
            </div>
            <CardContent>
              <div className={styles.calendarSection}>
                <div className={styles.calendarGrid}>
                  {/* Header row */}
                  <div className={styles.calendarHeaderCell}>Espace</div>
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className={styles.calendarHeaderCell}>{day}</div>
                  ))}

                  {/* Data rows */}
                  {calendarData.map(({ space, prices }) => (
                    <Fragment key={space.id}>
                      <div className={styles.calendarSpaceLabel}>{space.name}</div>
                      {prices.map((priceData, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`${styles.calendarPriceCell} ${
                            priceData.variant === 'increased'
                              ? styles.priceIncreased
                              : priceData.variant === 'decreased'
                                ? styles.priceDecreased
                                : styles.priceNormal
                          }`}
                        >
                          {formatCurrency(priceData.price)}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>

                {/* Legend */}
                <div className={styles.calendarLegend}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendNormal}`} />
                    <span>Tarif normal</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendIncreased}`} />
                    <span>Majore</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendDecreased}`} />
                    <span>Reduit</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Promo Code Creation Modal */}
      <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} size="md">
        <ModalHeader
          title="Nouveau code promotionnel"
          subtitle="Creez un code de reduction pour vos clients"
          onClose={() => setIsPromoModalOpen(false)}
        />
        <ModalBody>
          <div className={styles.modalForm}>
            <div className={styles.formGroup}>
              <span className={styles.formLabel}>Code</span>
              <div className={styles.codeInputWrapper}>
                <Input
                  value={promoForm.code}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Ex: PROMO20"
                />
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Shuffle size={16} />}
                  onClick={handleGenerateCode}
                >
                  Generer
                </Button>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <Select
                  label="Type de reduction"
                  options={typeOptions}
                  value={promoForm.type}
                  onChange={(value) => setPromoForm((prev) => ({ ...prev, type: value as 'percentage' | 'fixed' }))}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  label="Valeur"
                  type="number"
                  min={0}
                  value={promoForm.value || ''}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={promoForm.type === 'percentage' ? 'Ex: 20' : 'Ex: 50'}
                  hint={promoForm.type === 'percentage' ? 'En pourcentage (%)' : 'En euros (EUR)'}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <Input
                  label="Date de debut"
                  type="date"
                  value={promoForm.startDate}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  label="Date d'expiration"
                  type="date"
                  value={promoForm.endDate}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <Input
                  label="Nombre max d'utilisations"
                  type="number"
                  min={0}
                  value={promoForm.maxUses || ''}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  hint="0 = illimite"
                />
              </div>
              <div className={styles.formGroup}>
                <Select
                  label="Espaces applicables"
                  options={spaceOptions}
                  value={promoForm.spaces}
                  onChange={(value) => setPromoForm((prev) => ({ ...prev, spaces: value }))}
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsPromoModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreatePromo}
            disabled={!promoForm.code || !promoForm.startDate || !promoForm.endDate || promoForm.value <= 0}
          >
            Creer le code
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Space Pricing Modal */}
      <Modal isOpen={isEditSpaceModalOpen} onClose={() => setIsEditSpaceModalOpen(false)} size="md">
        {editingSpace && (
          <>
            <ModalHeader
              title={`Modifier les tarifs - ${editingSpace.name}`}
              subtitle={editingSpace.type}
              onClose={() => setIsEditSpaceModalOpen(false)}
            />
            <ModalBody>
              <div className={styles.editForm}>
                <div className={styles.editFormGrid}>
                  <div className={styles.formGroup}>
                    <Input
                      label="Prix de base/h"
                      type="number"
                      min={0}
                      step={0.01}
                      value={editBasePrice}
                      onChange={(e) => setEditBasePrice(e.target.value)}
                      hint="EUR"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Input
                      label="Prix week-end/h"
                      type="number"
                      min={0}
                      step={0.01}
                      value={editWeekendPrice}
                      onChange={(e) => setEditWeekendPrice(e.target.value)}
                      hint="EUR"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Input
                      label="Prix heure de pointe/h"
                      type="number"
                      min={0}
                      step={0.01}
                      value={editPeakPrice}
                      onChange={(e) => setEditPeakPrice(e.target.value)}
                      hint="EUR"
                    />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setIsEditSpaceModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSaveSpace}>
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
