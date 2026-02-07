import { useState, useCallback } from 'react';
import {
  DollarSign,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import type { Invoice, PaymentMethod } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import styles from '../Finance.module.css';

// Payment form data
export interface PaymentFormData {
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

const defaultPaymentFormData: PaymentFormData = {
  amount: 0,
  method: 'bank_transfer',
  reference: '',
  notes: '',
};

const paymentMethodOptions = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'cash', label: 'Especes' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Autre' },
];

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => void;
  invoice: Invoice | null;
  isSubmitting: boolean;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  isSubmitting,
}: RecordPaymentModalProps) {
  const remainingAmount = invoice ? invoice.total_amount - invoice.paid_amount : 0;

  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    ...defaultPaymentFormData,
    amount: remainingAmount > 0 ? remainingAmount : 0,
  });
  const [paymentFormErrors, setPaymentFormErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});

  // No effect needed - component is conditionally rendered by parent
  // so it remounts fresh each time the modal opens

  const validatePaymentForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof PaymentFormData, string>> = {};

    if (!paymentFormData.amount || paymentFormData.amount <= 0) {
      errors.amount = 'Le montant doit etre superieur a 0';
    }

    if (invoice && paymentFormData.amount > (invoice.total_amount - invoice.paid_amount)) {
      errors.amount = 'Le montant ne peut pas depasser le solde restant';
    }

    if (!paymentFormData.method) {
      errors.method = 'Veuillez selectionner une methode de paiement';
    }

    setPaymentFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [paymentFormData, invoice]);

  const handleSubmit = useCallback(() => {
    if (!validatePaymentForm() || !invoice) return;
    onSubmit(paymentFormData);
  }, [paymentFormData, validatePaymentForm, invoice, onSubmit]);

  const handleClose = useCallback(() => {
    setPaymentFormData(defaultPaymentFormData);
    setPaymentFormErrors({});
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader
        title="Enregistrer un paiement"
        subtitle={invoice ? `Facture ${invoice.invoice_number}` : ''}
        onClose={handleClose}
      />
      <ModalBody>
        {invoice && (
          <div className={styles.paymentForm}>
            {/* Invoice Summary */}
            <div className={styles.paymentSummary}>
              <div className={styles.paymentSummaryRow}>
                <span>Total facture</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className={styles.paymentSummaryRow}>
                <span>Deja paye</span>
                <span>{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className={`${styles.paymentSummaryRow} ${styles.paymentSummaryTotal}`}>
                <span>Solde restant</span>
                <span>{formatCurrency(invoice.total_amount - invoice.paid_amount)}</span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className={styles.formSection}>
              <Input
                label="Montant du paiement *"
                type="number"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })}
                error={paymentFormErrors.amount}
                min={0}
                max={invoice.total_amount - invoice.paid_amount}
                step={0.01}
                fullWidth
                icon={<DollarSign size={16} />}
              />
            </div>

            {/* Payment Method */}
            <div className={styles.formSection}>
              <Select
                label="Methode de paiement *"
                options={paymentMethodOptions}
                value={paymentFormData.method}
                onChange={(value) => setPaymentFormData({ ...paymentFormData, method: value as PaymentMethod })}
                error={paymentFormErrors.method}
                fullWidth
                icon={<CreditCard size={16} />}
              />
            </div>

            {/* Reference */}
            <div className={styles.formSection}>
              <Input
                label="Reference (optionnel)"
                type="text"
                value={paymentFormData.reference}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                placeholder="Ex: CHQ-12345, VIR-67890..."
                fullWidth
              />
            </div>

            {/* Notes */}
            <div className={styles.formSection}>
              <div className={styles.formFullWidth}>
                <label className={styles.formLabel} htmlFor="payment-notes">Notes (optionnel)</label>
                <textarea
                  id="payment-notes"
                  className={styles.textarea}
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  rows={2}
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          icon={<Banknote size={16} />}
        >
          Enregistrer le paiement
        </Button>
      </ModalFooter>
    </Modal>
  );
}
