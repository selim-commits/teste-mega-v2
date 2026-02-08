import { memo } from 'react';
import {
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Banknote,
  Trash2,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice, InvoiceStatus } from './types';
import styles from '../Finance.module.css';

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge variant="success" size="sm" dot>Payee</Badge>;
    case 'sent':
      return <Badge variant="info" size="sm" dot>Envoyee</Badge>;
    case 'draft':
      return <Badge variant="default" size="sm" dot>Brouillon</Badge>;
    case 'overdue':
      return <Badge variant="error" size="sm" dot>En retard</Badge>;
    case 'cancelled':
      return <Badge variant="warning" size="sm" dot>Annulee</Badge>;
    default:
      return <Badge variant="default" size="sm">{status}</Badge>;
  }
}

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  getClientName: (clientId: string) => string;
  onStatusChange: (invoice: Invoice, status: InvoiceStatus) => void;
  onExportPDF: (invoice: Invoice) => void;
  onOpenPayment: (invoice: Invoice) => void;
  onOpenDeleteConfirm: (invoice: Invoice) => void;
}

export const InvoiceDetailModal = memo(function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  getClientName,
  onStatusChange,
  onExportPDF,
  onOpenPayment,
  onOpenDeleteConfirm,
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title={`Facture ${invoice.invoice_number}`}
        subtitle={getClientName(invoice.client_id)}
        onClose={onClose}
      />
      <ModalBody>
        <div className={styles.invoiceDetail}>
          {/* Status Banner */}
          <div className={styles.detailStatus}>
            {getStatusBadge(invoice.status)}
            <span className={styles.detailStatusText}>
              {invoice.status === 'paid' && 'Cette facture a ete payee'}
              {invoice.status === 'sent' && 'En attente de paiement'}
              {invoice.status === 'draft' && 'Brouillon - non envoyee'}
              {invoice.status === 'overdue' && 'Paiement en retard'}
              {invoice.status === 'cancelled' && 'Facture annulee'}
            </span>
          </div>

          {/* Invoice Info */}
          <div className={styles.detailSection}>
            <h4>Informations</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Client</span>
                <span className={styles.detailValue}>{getClientName(invoice.client_id)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date d'emission</span>
                <span className={styles.detailValue}>{formatDate(invoice.issue_date)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date d'echeance</span>
                <span className={styles.detailValue}>{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className={styles.detailSection}>
            <h4>Montants</h4>
            <div className={styles.detailAmounts}>
              <div className={styles.amountRow}>
                <span>Sous-total</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className={styles.amountRow}>
                  <span>Remise</span>
                  <span>-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className={styles.amountRow}>
                <span>TVA</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className={`${styles.amountRow} ${styles.totalAmount}`}>
                <span>Total TTC</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <>
                  <div className={styles.amountRow}>
                    <span>Paye</span>
                    <span className={styles.paidAmount}>{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  <div className={`${styles.amountRow} ${styles.dueAmount}`}>
                    <span>Reste du</span>
                    <span>{formatCurrency(invoice.total_amount - invoice.paid_amount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className={styles.detailSection}>
              <h4>Notes</h4>
              <p className={styles.detailNotes}>{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.terms && (
            <div className={styles.detailSection}>
              <h4>Conditions</h4>
              <p className={styles.detailNotes}>{invoice.terms}</p>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <div className={styles.detailActions}>
          <div className={styles.detailActionGroup}>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => onExportPDF(invoice)}
            >
              Exporter PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button
                variant="ghost"
                icon={<Trash2 size={16} />}
                onClick={() => onOpenDeleteConfirm(invoice)}
                className={styles.cancelBtn}
              >
                Supprimer
              </Button>
            )}
          </div>
          <div className={styles.detailActionGroup}>
            {['sent', 'overdue'].includes(invoice.status) && invoice.paid_amount < invoice.total_amount && (
              <Button
                variant="secondary"
                icon={<Banknote size={16} />}
                onClick={() => {
                  onClose();
                  onOpenPayment(invoice);
                }}
              >
                Enregistrer paiement
              </Button>
            )}
            {invoice.status === 'draft' && (
              <Button
                variant="primary"
                icon={<Send size={16} />}
                onClick={() => {
                  onStatusChange(invoice, 'sent');
                  onClose();
                }}
              >
                Envoyer
              </Button>
            )}
            {['draft', 'sent', 'overdue'].includes(invoice.status) && (
              <Button
                variant="primary"
                icon={<CheckCircle size={16} />}
                onClick={() => {
                  onStatusChange(invoice, 'paid');
                  onClose();
                }}
              >
                Marquer payee
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button
                variant="secondary"
                icon={<AlertTriangle size={16} />}
                onClick={() => {
                  onStatusChange(invoice, 'overdue');
                  onClose();
                }}
              >
                Marquer en retard
              </Button>
            )}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <Button
                variant="ghost"
                icon={<XCircle size={16} />}
                onClick={() => {
                  onStatusChange(invoice, 'cancelled');
                  onClose();
                }}
                className={styles.cancelBtn}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
});
