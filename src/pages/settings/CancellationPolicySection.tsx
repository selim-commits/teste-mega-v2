import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotifications } from '../../stores/uiStore';
import type { CancellationPolicySettings, RefundTier } from './types';
import { defaultCancellationPolicy } from './types';
import styles from '../Settings.module.css';

const STORAGE_KEY = 'rooom_cancellation_policy';

const cancellationWindowOptions = [
  { value: '24', label: '24 heures' },
  { value: '48', label: '48 heures' },
  { value: '72', label: '72 heures' },
  { value: '168', label: '1 semaine' },
  { value: 'custom', label: 'Personnalise' },
];

const gracePeriodOptions = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
];

const refundPercentageOptions = [
  { value: '100', label: '100% (remboursement total)' },
  { value: '75', label: '75%' },
  { value: '50', label: '50%' },
  { value: '25', label: '25%' },
  { value: '0', label: '0% (aucun remboursement)' },
];

const tierThresholdOptions = [
  { value: '168', label: '1 semaine avant' },
  { value: '72', label: '72 heures avant' },
  { value: '48', label: '48 heures avant' },
  { value: '24', label: '24 heures avant' },
  { value: '12', label: '12 heures avant' },
  { value: '6', label: '6 heures avant' },
  { value: '2', label: '2 heures avant' },
];

function loadFromStorage(): CancellationPolicySettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CancellationPolicySettings;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(data: CancellationPolicySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface CancellationPolicySectionProps {
  studioId: string;
}

export function CancellationPolicySection({ studioId: _studioId }: CancellationPolicySectionProps) {
  const { success, error: notifyError } = useNotifications();
  const [settings, setSettings] = useState<CancellationPolicySettings>(() => {
    return loadFromStorage() || defaultCancellationPolicy;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state on mount from localStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setSettings(stored);
    }
  }, []);

  const handleTierChange = (index: number, field: keyof RefundTier, value: string) => {
    setSettings(prev => {
      const newTiers = [...prev.refundTiers];
      newTiers[index] = { ...newTiers[index], [field]: value };
      return { ...prev, refundTiers: newTiers };
    });
  };

  const handleAddTier = () => {
    if (settings.refundTiers.length >= 5) {
      notifyError(
        'Limite atteinte',
        'Vous pouvez configurer un maximum de 5 paliers de remboursement.'
      );
      return;
    }
    setSettings(prev => ({
      ...prev,
      refundTiers: [...prev.refundTiers, { threshold: '24', percentage: '50' }],
    }));
  };

  const handleRemoveTier = (index: number) => {
    if (settings.refundTiers.length <= 1) {
      notifyError(
        'Action impossible',
        'Vous devez conserver au moins un palier de remboursement.'
      );
      return;
    }
    setSettings(prev => ({
      ...prev,
      refundTiers: prev.refundTiers.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    // Validate custom window hours
    if (settings.cancellationWindow === 'custom') {
      const hours = parseInt(settings.customWindowHours);
      if (isNaN(hours) || hours < 1) {
        notifyError(
          'Erreur de validation',
          'Veuillez entrer un nombre d\'heures valide pour le delai d\'annulation.'
        );
        return;
      }
    }

    // Validate late cancellation fee amount
    if (settings.lateCancellationFeeEnabled) {
      const amount = parseFloat(settings.lateCancellationFeeAmount);
      if (isNaN(amount) || amount <= 0) {
        notifyError(
          'Erreur de validation',
          'Le montant des frais d\'annulation tardive doit etre superieur a 0.'
        );
        return;
      }
    }

    // Validate no-show fee amount
    if (settings.noShowFeeEnabled) {
      const amount = parseFloat(settings.noShowFeeAmount);
      if (isNaN(amount) || amount <= 0) {
        notifyError(
          'Erreur de validation',
          'Le montant des frais de no-show doit etre superieur a 0.'
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      saveToStorage(settings);
      success(
        'Politique d\'annulation mise a jour',
        'Les parametres de politique d\'annulation ont ete enregistres.'
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder la politique d\'annulation.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Politique d'annulation</h2>
          <p className={styles.sectionDescription}>
            Definissez les regles d'annulation, remboursements et frais pour vos reservations
          </p>
        </div>

        {/* Cancellation Window */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Delai d'annulation</h3>
          <p className={styles.subsectionDescription}>
            Definissez le delai minimum avant lequel un client peut annuler sans frais
          </p>

          <Select
            label="Fenetre d'annulation"
            options={cancellationWindowOptions}
            value={settings.cancellationWindow}
            onChange={(value) => setSettings(prev => ({ ...prev, cancellationWindow: value }))}
            fullWidth
          />

          {settings.cancellationWindow === 'custom' && (
            <div className={styles.depositPercentageRow}>
              <Input
                label="Nombre d'heures personnalise"
                type="number"
                placeholder="36"
                value={settings.customWindowHours}
                onChange={(e) => setSettings(prev => ({ ...prev, customWindowHours: e.target.value }))}
                hint="Nombre d'heures avant la reservation"
              />
            </div>
          )}
        </Card>

        {/* Refund Tiers */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Paliers de remboursement</h3>
          <p className={styles.subsectionDescription}>
            Configurez les pourcentages de remboursement selon le delai d'annulation
          </p>

          <div className={styles.refundTiersList}>
            {settings.refundTiers.map((tier, index) => (
              <div key={index} className={styles.refundTierItem}>
                <div className={styles.refundTierFields}>
                  <Select
                    label="Si annule avant"
                    options={tierThresholdOptions}
                    value={tier.threshold}
                    onChange={(value) => handleTierChange(index, 'threshold', value)}
                    fullWidth
                  />
                  <Select
                    label="Remboursement"
                    options={refundPercentageOptions}
                    value={tier.percentage}
                    onChange={(value) => handleTierChange(index, 'percentage', value)}
                    fullWidth
                  />
                </div>
                <button
                  type="button"
                  className={styles.refundTierRemove}
                  onClick={() => handleRemoveTier(index)}
                  aria-label="Supprimer ce palier"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.addTierButton}
            onClick={handleAddTier}
          >
            <Plus size={16} />
            Ajouter un palier
          </button>
        </Card>

        {/* Late Cancellation & No-Show Fees */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Frais et penalites</h3>
          <p className={styles.subsectionDescription}>
            Configurez les frais pour les annulations tardives et les absences
          </p>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Frais d'annulation tardive</span>
                <span className={styles.notificationDescription}>
                  Appliquer des frais lorsqu'une annulation est faite apres le delai autorise
                </span>
              </div>
              <label className={styles.toggle} aria-label="Frais d'annulation tardive">
                <input
                  type="checkbox"
                  checked={settings.lateCancellationFeeEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, lateCancellationFeeEnabled: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {settings.lateCancellationFeeEnabled && (
              <div className={styles.depositPercentageRow}>
                <Input
                  label="Montant des frais d'annulation tardive"
                  type="number"
                  placeholder="50"
                  value={settings.lateCancellationFeeAmount}
                  onChange={(e) => setSettings(prev => ({ ...prev, lateCancellationFeeAmount: e.target.value }))}
                  hint="Montant en euros (EUR)"
                  iconRight={<span className={styles.currencySuffix}>EUR</span>}
                />
              </div>
            )}

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Frais de no-show</span>
                <span className={styles.notificationDescription}>
                  Appliquer des frais lorsqu'un client ne se presente pas a sa reservation
                </span>
              </div>
              <label className={styles.toggle} aria-label="Frais de no-show">
                <input
                  type="checkbox"
                  checked={settings.noShowFeeEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, noShowFeeEnabled: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {settings.noShowFeeEnabled && (
              <div className={styles.depositPercentageRow}>
                <Input
                  label="Montant des frais de no-show"
                  type="number"
                  placeholder="100"
                  value={settings.noShowFeeAmount}
                  onChange={(e) => setSettings(prev => ({ ...prev, noShowFeeAmount: e.target.value }))}
                  hint="Montant en euros (EUR)"
                  iconRight={<span className={styles.currencySuffix}>EUR</span>}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Grace Period */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Delai de grace</h3>
          <p className={styles.subsectionDescription}>
            Temps d'attente apres le debut de la reservation avant de marquer un client comme absent
          </p>

          <Select
            label="Delai avant marquage no-show"
            options={gracePeriodOptions}
            value={settings.gracePeriodMinutes}
            onChange={(value) => setSettings(prev => ({ ...prev, gracePeriodMinutes: value }))}
            fullWidth
          />
        </Card>

        {/* Confirmation Message Template */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Message de confirmation</h3>
          <p className={styles.subsectionDescription}>
            Personnalisez le message envoye au client apres une annulation
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="cancellation-confirmation-message">
              Modele de message
            </label>
            <textarea
              id="cancellation-confirmation-message"
              className={styles.textarea}
              placeholder="Votre reservation a ete annulee..."
              rows={5}
              value={settings.confirmationMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, confirmationMessage: e.target.value }))}
            />
            <span className={styles.hint}>
              Ce message sera envoye par email au client lors de la confirmation d'annulation.
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
      </div>
    </div>
  );
}
