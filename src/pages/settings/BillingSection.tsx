import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { DEMO_STUDIO_ID } from '../../stores/authStore';
import {
  useSettings,
  useUpdateBillingSettings,
} from '../../hooks/useSettings';
import type { BillingSettingsData } from './types';
import { defaultBillingSettings } from './types';
import styles from '../Settings.module.css';

const vatRateOptions = [
  { value: '0', label: '0% (Exonere)' },
  { value: '5.5', label: '5,5% (Taux reduit)' },
  { value: '10', label: '10% (Taux intermediaire)' },
  { value: '20', label: '20% (Taux normal)' },
];

export function BillingSection() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<BillingSettingsData>(defaultBillingSettings);
  const { data: studioSettings } = useSettings(DEMO_STUDIO_ID);
  const updateBillingSettings = useUpdateBillingSettings(DEMO_STUDIO_ID);

  // Sync form with fetched data (React recommended pattern for prop-driven state)
  const [prevStudioSettings, setPrevStudioSettings] = useState(studioSettings);
  if (studioSettings !== prevStudioSettings) {
    setPrevStudioSettings(studioSettings);
    if (studioSettings?.billing) {
      const b = studioSettings.billing;
      setSettings({
        vatRate: b.vatRate ?? defaultBillingSettings.vatRate,
        paymentTerms: b.paymentTerms ?? defaultBillingSettings.paymentTerms,
        legalMentions: b.legalMentions ?? defaultBillingSettings.legalMentions,
        siret: b.siret ?? defaultBillingSettings.siret,
        vatNumber: b.vatNumber ?? defaultBillingSettings.vatNumber,
      });
    }
  }

  const handleSave = async () => {
    try {
      await updateBillingSettings.mutateAsync({
        vatRate: settings.vatRate,
        vatNumber: settings.vatNumber,
        siret: settings.siret,
        paymentTerms: settings.paymentTerms,
        legalMentions: settings.legalMentions,
      });
      addToast({
        title: 'Facturation mise a jour',
        description: 'Les informations de facturation ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations.',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const isLoading = updateBillingSettings.isPending;

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Facturation</h2>
          <p className={styles.sectionDescription}>
            Configurez vos informations de facturation et mentions legales
          </p>
        </div>

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
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
