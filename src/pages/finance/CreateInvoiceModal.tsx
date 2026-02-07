import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';
import styles from '../Finance.module.css';

// Invoice line item type
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Invoice form data
export interface InvoiceFormData {
  client_id: string;
  issue_date: string;
  due_date: string;
  notes: string;
  terms: string;
  line_items: LineItem[];
  tax_rate: number;
  discount_amount: number;
}

const defaultLineItem: LineItem = {
  id: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  total: 0,
};

const defaultInvoiceFormData: InvoiceFormData = {
  client_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
  terms: 'Paiement dû dans les 30 jours suivant la date de facturation.',
  line_items: [{ ...defaultLineItem, id: crypto.randomUUID() }],
  tax_rate: 20,
  discount_amount: 0,
};

interface ClientOption {
  value: string;
  label: string;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    formData: InvoiceFormData;
    subtotal: number;
    taxAmount: number;
    total: number;
  }) => void;
  clients: ClientOption[];
  isSubmitting: boolean;
  generatedInvoiceNumber?: string;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
  isSubmitting,
  generatedInvoiceNumber,
}: CreateInvoiceModalProps) {
  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>(defaultInvoiceFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InvoiceFormData, string>>>({});

  // Form calculations
  const calculateTotals = useCallback((items: LineItem[], taxRate: number, discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    return { subtotal, taxAmount, total };
  }, []);

  const { subtotal, taxAmount, total } = useMemo(
    () => calculateTotals(formData.line_items, formData.tax_rate, formData.discount_amount),
    [formData.line_items, formData.tax_rate, formData.discount_amount, calculateTotals]
  );

  const handleLineItemChange = useCallback((index: number, field: keyof LineItem, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...prev.line_items];
      const item = { ...newItems[index] };

      if (field === 'quantity' || field === 'unit_price') {
        item[field] = Number(value);
        item.total = item.quantity * item.unit_price;
      } else if (field === 'description') {
        item.description = String(value);
      }

      newItems[index] = item;
      return { ...prev, line_items: newItems };
    });
  }, []);

  const addLineItem = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { ...defaultLineItem, id: crypto.randomUUID() }],
    }));
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof InvoiceFormData, string>> = {};

    if (!formData.client_id) {
      errors.client_id = 'Veuillez selectionner un client';
    }

    if (!formData.issue_date) {
      errors.issue_date = 'La date d\'emission est requise';
    }

    if (!formData.due_date) {
      errors.due_date = 'La date d\'echeance est requise';
    }

    if (formData.line_items.length === 0 || formData.line_items.every((item) => item.total === 0)) {
      errors.line_items = 'Au moins une ligne avec un montant est requise';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    onSubmit({ formData, subtotal, taxAmount, total });
  }, [formData, validateForm, subtotal, taxAmount, total, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData(defaultInvoiceFormData);
    setFormErrors({});
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader
        title="Nouvelle facture"
        subtitle={generatedInvoiceNumber ? `Numero: ${generatedInvoiceNumber}` : 'Chargement...'}
        onClose={handleClose}
      />
      <ModalBody>
        <div className={styles.invoiceForm}>
          {/* Client Selection */}
          <div className={styles.formSection}>
            <h4>Informations client</h4>
            <Select
              label="Client *"
              options={clients}
              value={formData.client_id}
              onChange={(value) => setFormData({ ...formData, client_id: value })}
              error={formErrors.client_id}
              fullWidth
              icon={<User size={16} />}
            />
          </div>

          {/* Dates */}
          <div className={styles.formSection}>
            <h4>Dates</h4>
            <div className={styles.formRow}>
              <Input
                label="Date d'emission *"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                error={formErrors.issue_date}
                fullWidth
                icon={<Calendar size={16} />}
              />
              <Input
                label="Date d'echeance *"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                error={formErrors.due_date}
                fullWidth
                icon={<Calendar size={16} />}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className={styles.formSection}>
            <h4>Articles</h4>
            {formErrors.line_items && (
              <span className={styles.errorMessage}>{formErrors.line_items}</span>
            )}
            <div className={styles.lineItems}>
              <div className={styles.lineItemHeader}>
                <span>Description</span>
                <span>Quantite</span>
                <span>Prix unitaire</span>
                <span>Total</span>
                <span></span>
              </div>
              {formData.line_items.map((item, index) => (
                <div key={item.id} className={styles.lineItem}>
                  <Input
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Description de l'article"
                    fullWidth
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    min={1}
                  />
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                    min={0}
                    step={0.01}
                  />
                  <span className={styles.lineItemTotal}>{formatCurrency(item.total)}</span>
                  <button
                    type="button"
                    className={styles.removeLineItem}
                    onClick={() => removeLineItem(index)}
                    disabled={formData.line_items.length === 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addLineItem}>
                Ajouter une ligne
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className={styles.formSection}>
            <h4>Calcul</h4>
            <div className={styles.formRow}>
              <Input
                label="Taux de TVA (%)"
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                min={0}
                max={100}
              />
              <Input
                label="Remise"
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                min={0}
              />
            </div>
            <div className={styles.totalsSection}>
              <div className={styles.totalRow}>
                <span>Sous-total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {formData.discount_amount > 0 && (
                <div className={styles.totalRow}>
                  <span>Remise</span>
                  <span>-{formatCurrency(formData.discount_amount)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>TVA ({formData.tax_rate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total TTC</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.formSection}>
            <h4>Notes & Conditions</h4>
            <div className={styles.formFullWidth}>
              <label className={styles.formLabel}>Notes</label>
              <textarea
                className={styles.textarea}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Notes visibles sur la facture..."
              />
            </div>
            <div className={styles.formFullWidth}>
              <label className={styles.formLabel}>Conditions de paiement</label>
              <textarea
                className={styles.textarea}
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={2}
                placeholder="Conditions de paiement..."
              />
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          Creer la facture
        </Button>
      </ModalFooter>
    </Modal>
  );
}
