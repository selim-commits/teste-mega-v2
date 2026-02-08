import { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Download,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useNotifications } from '../../stores/uiStore';
import type { BillingSettingsData } from './types';
import { defaultBillingSettings } from './types';
import styles from '../Settings.module.css';

const STORAGE_KEY = 'rooom-settings-billing';

const vatRateOptions = [
  { value: '0', label: '0% (Exonere)' },
  { value: '5.5', label: '5,5% (Taux reduit)' },
  { value: '10', label: '10% (Taux intermediaire)' },
  { value: '20', label: '20% (Taux normal)' },
];

const mockInvoices = [
  { id: 'INV-2026-001', date: '01 janv. 2026', description: 'Abonnement Pro - Janvier 2026', amount: '49,00 \u20ac', status: 'Payee' },
  { id: 'INV-2025-012', date: '01 dec. 2025', description: 'Abonnement Pro - Decembre 2025', amount: '49,00 \u20ac', status: 'Payee' },
  { id: 'INV-2025-011', date: '01 nov. 2025', description: 'Abonnement Pro - Novembre 2025', amount: '49,00 \u20ac', status: 'Payee' },
  { id: 'INV-2025-010', date: '01 oct. 2025', description: 'Abonnement Pro - Octobre 2025', amount: '49,00 \u20ac', status: 'Payee' },
];

const usageStats = [
  { label: 'Reservations ce mois', value: '24', max: '100' },
  { label: 'Membres de l\'equipe', value: '3', max: '10' },
  { label: 'Espaces actifs', value: '2', max: '5' },
];

function loadFromStorage(): BillingSettingsData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as BillingSettingsData;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(data: BillingSettingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface BillingSectionProps {
  studioId: string;
}

export function BillingSection({ studioId: _studioId }: BillingSectionProps) {
  const { success, error: notifyError, info } = useNotifications();
  const [settings, setSettings] = useState<BillingSettingsData>(() => {
    return loadFromStorage() || defaultBillingSettings;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state on mount from localStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setSettings(stored);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveToStorage(settings);
      success(
        'Facturation mise a jour',
        'Les informations de facturation ont ete enregistrees.'
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder les informations.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = () => {
    info(
      'Mise a niveau',
      'Contactez-nous a contact@rooom.studio pour passer au plan Enterprise.'
    );
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    info(
      'Telechargement',
      `La facture ${invoiceId} sera disponible prochainement.`
    );
  };

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Facturation</h2>
          <p className={styles.sectionDescription}>
            Gerez votre abonnement et vos informations de facturation
          </p>
        </div>

        {/* Current Plan */}
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.planHeader}>
            <div className={styles.planInfo}>
              <div className={styles.planNameRow}>
                <h3 className={styles.subsectionTitle}>Plan actuel</h3>
                <Badge variant="success">Pro</Badge>
              </div>
              <div className={styles.planPrice}>
                <span className={styles.priceAmount}>49\u20ac</span>
                <span className={styles.pricePeriod}>/mois</span>
              </div>
            </div>
            <Button
              variant="secondary"
              icon={<ArrowUpRight size={16} />}
              onClick={handleUpgrade}
            >
              Passer a Enterprise
            </Button>
          </div>

          <div className={styles.planFeatures}>
            <div className={styles.planFeature}>
              <Check size={16} className={styles.featureIcon} />
              <span>Jusqu'a 100 reservations par mois</span>
            </div>
            <div className={styles.planFeature}>
              <Check size={16} className={styles.featureIcon} />
              <span>10 membres d'equipe</span>
            </div>
            <div className={styles.planFeature}>
              <Check size={16} className={styles.featureIcon} />
              <span>5 espaces configurables</span>
            </div>
            <div className={styles.planFeature}>
              <Check size={16} className={styles.featureIcon} />
              <span>Widget de reservation personnalisable</span>
            </div>
            <div className={styles.planFeature}>
              <Check size={16} className={styles.featureIcon} />
              <span>Notifications email et SMS</span>
            </div>
          </div>
        </Card>

        {/* Usage Stats */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Utilisation ce mois</h3>
          <p className={styles.subsectionDescription}>
            Suivi de votre consommation par rapport aux limites du plan
          </p>

          <div className={styles.usageGrid}>
            {usageStats.map((stat) => (
              <div key={stat.label} className={styles.usageStat}>
                <div className={styles.usageStatHeader}>
                  <span className={styles.usageStatLabel}>{stat.label}</span>
                  <span className={styles.usageStatValue}>
                    {stat.value} <span className={styles.usageStatMax}>/ {stat.max}</span>
                  </span>
                </div>
                <div className={styles.usageProgressBar}>
                  <div
                    className={styles.usageProgressFill}
                    style={{ width: `${(parseInt(stat.value) / parseInt(stat.max)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tax Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Parametres de TVA</h3>
          <p className={styles.subsectionDescription}>
            Configurez le taux de TVA applique a vos prestations
          </p>

          <Select
            label="Taux de TVA"
            options={vatRateOptions}
            value={settings.vatRate}
            onChange={(value) => setSettings(prev => ({ ...prev, vatRate: value }))}
            fullWidth
          />
        </Card>

        {/* Payment Terms */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Conditions de paiement</h3>
          <p className={styles.subsectionDescription}>
            Definissez vos conditions de paiement affichees sur les factures
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="billing-payment-terms">Conditions de paiement</label>
            <textarea
              id="billing-payment-terms"
              className={styles.textarea}
              placeholder="Ex: Paiement a la reservation. Annulation gratuite jusqu'a 48h avant."
              rows={3}
              value={settings.paymentTerms}
              onChange={(e) => setSettings(prev => ({ ...prev, paymentTerms: e.target.value }))}
            />
          </div>
        </Card>

        {/* Legal Information */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Informations legales</h3>
          <p className={styles.subsectionDescription}>
            Ces informations apparaitront sur vos factures
          </p>

          <div className={styles.formRow}>
            <Input
              label="SIRET"
              placeholder="123 456 789 00012"
              value={settings.siret}
              onChange={(e) => setSettings(prev => ({ ...prev, siret: e.target.value }))}
              fullWidth
            />
            <Input
              label="N\u00b0 TVA Intracommunautaire"
              placeholder="FR 12 123456789"
              value={settings.vatNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
              fullWidth
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="billing-legal-mentions">Mentions legales</label>
            <textarea
              id="billing-legal-mentions"
              className={styles.textarea}
              placeholder="Raison sociale, forme juridique, capital social, RCS..."
              rows={4}
              value={settings.legalMentions}
              onChange={(e) => setSettings(prev => ({ ...prev, legalMentions: e.target.value }))}
            />
            <span className={styles.hint}>
              Ces mentions seront incluses sur toutes vos factures.
            </span>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isSaving}
            >
              Enregistrer
            </Button>
          </div>
        </Card>

        {/* Invoice History */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Historique des factures</h3>
          <p className={styles.subsectionDescription}>
            Retrouvez toutes vos factures passees
          </p>

          <div className={styles.billingHistory}>
            {mockInvoices.map((invoice) => (
              <div key={invoice.id} className={styles.billingItem}>
                <span className={styles.billingDate}>{invoice.date}</span>
                <span className={styles.billingDescription}>{invoice.description}</span>
                <span className={styles.billingAmount}>{invoice.amount}</span>
                <div className={styles.billingItemActions}>
                  <Badge variant="success" size="sm">{invoice.status}</Badge>
                  <button
                    type="button"
                    className={styles.invoiceDownloadButton}
                    onClick={() => handleDownloadInvoice(invoice.id)}
                    aria-label={`Telecharger ${invoice.id}`}
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
