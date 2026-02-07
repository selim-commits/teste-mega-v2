import { useState, useCallback } from 'react';
import { Plus, X, Zap, Clock, Package, RefreshCw, Gift } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import type { Pack, PackInsert, PackUpdate, PricingProductType, BillingPeriod, Space } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface PackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PackInsert | PackUpdate) => Promise<void>;
  pack?: Pack | null;
  spaces?: Space[];
  isLoading?: boolean;
  studioId: string;
}

interface FormData {
  name: string;
  description: string;
  type: PricingProductType;
  price: string;
  currency: string;
  credits_included: string;
  credits_type: string;
  valid_days: string;
  billing_period: BillingPeriod;
  valid_spaces: string[];
  is_featured: boolean;
  is_active: boolean;
  display_order: string;
  terms_and_conditions: string;
}

const defaultFormData: FormData = {
  name: '',
  description: '',
  type: 'pack',
  price: '',
  currency: 'CAD',
  credits_included: '',
  credits_type: 'heures',
  valid_days: '',
  billing_period: 'once',
  valid_spaces: [],
  is_featured: false,
  is_active: true,
  display_order: '0',
  terms_and_conditions: '',
};

const typeOptions = [
  { value: 'pack', label: 'Pack (Achat unique)' },
  { value: 'subscription', label: 'Abonnement (Recurrent)' },
  { value: 'gift_certificate', label: 'Certificat cadeau' },
];

const billingOptions = [
  { value: 'once', label: 'Achat unique' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'yearly', label: 'Annuel' },
];

const currencyOptions = [
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (E)' },
];

const creditTypeOptions = [
  { value: 'heures', label: 'Heures' },
  { value: 'credits', label: 'Credits' },
  { value: 'sessions', label: 'Sessions' },
];

export function PackFormModal({
  isOpen,
  onClose,
  onSubmit,
  pack,
  spaces = [],
  isLoading,
  studioId,
}: PackFormModalProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  const [prevPack, setPrevPack] = useState(pack);

  const isEdit = !!pack;

  // Reset form when modal opens/closes or pack changes (React recommended pattern)
  if (isOpen !== prevIsOpen || pack !== prevPack) {
    setPrevIsOpen(isOpen);
    setPrevPack(pack);
    if (isOpen && pack) {
      setFormData({
        name: pack.name,
        description: pack.description || '',
        type: pack.type,
        price: pack.price.toString(),
        currency: pack.currency,
        credits_included: pack.credits_included?.toString() || '',
        credits_type: pack.credits_type || 'heures',
        valid_days: pack.valid_days?.toString() || '',
        billing_period: pack.billing_period,
        valid_spaces: pack.valid_spaces || [],
        is_featured: pack.is_featured,
        is_active: pack.is_active,
        display_order: pack.display_order.toString(),
        terms_and_conditions: pack.terms_and_conditions || '',
      });
      // Extract benefits from metadata if exists
      const metadata = pack.metadata as { benefits?: string[] } | null;
      setBenefits(metadata?.benefits || []);
    } else if (isOpen) {
      setFormData(defaultFormData);
      setBenefits([]);
    }
    setFormErrors({});
  }

  const handleChange = useCallback((field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleAddBenefit = useCallback(() => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits((prev) => [...prev, newBenefit.trim()]);
      setNewBenefit('');
    }
  }, [newBenefit, benefits]);

  const handleRemoveBenefit = useCallback((benefit: string) => {
    setBenefits((prev) => prev.filter((b) => b !== benefit));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      errors.price = 'Le prix est requis et doit etre positif';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const data: PackInsert | PackUpdate = {
      studio_id: studioId,
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      price: parseFloat(formData.price),
      currency: formData.currency,
      credits_included: formData.credits_included ? parseInt(formData.credits_included) : null,
      credits_type: formData.credits_type || null,
      valid_days: formData.valid_days ? parseInt(formData.valid_days) : null,
      billing_period: formData.billing_period,
      valid_spaces: formData.valid_spaces.length > 0 ? formData.valid_spaces : null,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      display_order: parseInt(formData.display_order) || 0,
      terms_and_conditions: formData.terms_and_conditions || null,
      metadata: { benefits },
    };

    await onSubmit(data);
  }, [formData, benefits, studioId, validateForm, onSubmit]);

  const getTypeIcon = (type: PricingProductType) => {
    switch (type) {
      case 'pack':
        return <Package size={16} />;
      case 'subscription':
        return <RefreshCw size={16} />;
      case 'gift_certificate':
        return <Gift size={16} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title={isEdit ? 'Modifier le pack' : 'Nouveau pack'}
        subtitle={isEdit ? pack?.name : 'Creez un nouveau pack, abonnement ou certificat'}
        onClose={onClose}
      />
      <ModalBody>
        <div className={styles.formGrid}>
          {/* Basic Info */}
          <div className={styles.formFullWidth}>
            <Select
              label="Type de produit"
              options={typeOptions}
              value={formData.type}
              onChange={(v) => handleChange('type', v as PricingProductType)}
              fullWidth
            />
          </div>

          <Input
            label="Nom *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={formErrors.name}
            placeholder="Ex: Pack 10 heures"
            fullWidth
          />

          <Select
            label="Devise"
            options={currencyOptions}
            value={formData.currency}
            onChange={(v) => handleChange('currency', v)}
            fullWidth
          />

          <Input
            label="Prix *"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            error={formErrors.price}
            placeholder="0.00"
            icon={<span>$</span>}
            fullWidth
          />

          <Select
            label="Facturation"
            options={billingOptions}
            value={formData.billing_period}
            onChange={(v) => handleChange('billing_period', v as BillingPeriod)}
            fullWidth
            disabled={formData.type !== 'subscription'}
          />

          <Input
            label="Credits inclus"
            type="number"
            value={formData.credits_included}
            onChange={(e) => handleChange('credits_included', e.target.value)}
            placeholder="Ex: 10"
            icon={<Zap size={16} />}
            fullWidth
          />

          <Select
            label="Type de credits"
            options={creditTypeOptions}
            value={formData.credits_type}
            onChange={(v) => handleChange('credits_type', v)}
            fullWidth
          />

          <Input
            label="Validite (jours)"
            type="number"
            value={formData.valid_days}
            onChange={(e) => handleChange('valid_days', e.target.value)}
            placeholder="Ex: 365"
            icon={<Clock size={16} />}
            fullWidth
          />

          <Input
            label="Ordre d'affichage"
            type="number"
            value={formData.display_order}
            onChange={(e) => handleChange('display_order', e.target.value)}
            placeholder="0"
            fullWidth
          />

          <div className={styles.formFullWidth}>
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du pack..."
              fullWidth
            />
          </div>

          {/* Applicable Spaces */}
          {spaces.length > 0 && (
            <div className={styles.formFullWidth}>
              <label className={styles.formLabel}>Espaces applicables</label>
              <div className={styles.spacesSelection}>
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    type="button"
                    className={`${styles.spaceOption} ${
                      formData.valid_spaces.includes(space.id) ? styles.active : ''
                    }`}
                    onClick={() => {
                      const newSpaces = formData.valid_spaces.includes(space.id)
                        ? formData.valid_spaces.filter((s) => s !== space.id)
                        : [...formData.valid_spaces, space.id];
                      handleChange('valid_spaces', newSpaces);
                    }}
                  >
                    <div
                      className={styles.spaceColor}
                      style={{ backgroundColor: space.color }}
                    />
                    {space.name}
                  </button>
                ))}
              </div>
              {formData.valid_spaces.length === 0 && (
                <p className={styles.helperText}>Tous les espaces seront applicables si aucun n'est selectionne</p>
              )}
            </div>
          )}

          {/* Benefits */}
          <div className={styles.formFullWidth}>
            <label className={styles.formLabel}>Avantages inclus</label>
            <div className={styles.benefitsSection}>
              <div className={styles.benefitsInput}>
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                  placeholder="Ajouter un avantage..."
                />
                <Button variant="secondary" size="sm" onClick={handleAddBenefit}>
                  <Plus size={16} />
                </Button>
              </div>
              {benefits.length > 0 && (
                <div className={styles.benefitsList}>
                  {benefits.map((benefit, index) => (
                    <Badge key={index} variant="info" size="sm">
                      {benefit}
                      <button
                        type="button"
                        className={styles.removeBenefit}
                        onClick={() => handleRemoveBenefit(benefit)}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className={styles.formFullWidth}>
            <label className={styles.formLabel}>Termes et conditions</label>
            <textarea
              className={styles.textarea}
              value={formData.terms_and_conditions}
              onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
              rows={3}
              placeholder="Conditions d'utilisation du pack..."
            />
          </div>

          {/* Toggles */}
          <div className={styles.formFullWidth}>
            <div className={styles.togglesRow}>
              <Switch
                label="Pack actif"
                description="Visible et disponible a l'achat"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
              />
              <Switch
                label="Mettre en avant"
                description="Affiche avec un badge 'Populaire'"
                checked={formData.is_featured}
                onChange={(e) => handleChange('is_featured', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isLoading}
          icon={getTypeIcon(formData.type)}
        >
          {isEdit ? 'Enregistrer' : 'Creer le pack'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
