import { memo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Download,
  Plus,
  Search,
  FileText,
  Eye,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Banknote,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, Pagination } from '../../components/ui/Table';
import { Dropdown, DropdownItem, DropdownDivider } from '../../components/ui/Dropdown';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice, InvoiceStatus, FilterCountsData } from './types';
import styles from '../Finance.module.css';

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyee' },
  { value: 'paid', label: 'Payee' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulee' },
];

function getStatusBadge(status: string): ReactNode {
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

interface InvoiceTableProps {
  filteredInvoices: Invoice[];
  paginatedInvoices: Invoice[];
  isLoading: boolean;
  queryError: Error | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: InvoiceStatus | 'all';
  onStatusFilterChange: (value: InvoiceStatus | 'all') => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filterCounts: FilterCountsData;
  getClientName: (clientId: string) => string;
  onOpenDetail: (invoice: Invoice) => void;
  onOpenPayment: (invoice: Invoice) => void;
  onStatusChange: (invoice: Invoice, status: InvoiceStatus) => void;
  onExportPDF: (invoice: Invoice) => void;
  onExportCSV: () => void;
  onOpenCreate: () => void;
  onOpenDeleteConfirm: (invoice: Invoice) => void;
  onResetFilters: () => void;
}

export const InvoiceTable = memo(function InvoiceTable({
  filteredInvoices,
  paginatedInvoices,
  isLoading,
  queryError,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  showFilters,
  onShowFiltersChange,
  currentPage,
  totalPages,
  onPageChange,
  filterCounts,
  getClientName,
  onOpenDetail,
  onOpenPayment,
  onStatusChange,
  onExportPDF,
  onExportCSV,
  onOpenCreate,
  onOpenDeleteConfirm,
  onResetFilters,
}: InvoiceTableProps) {
  // Table columns
  const tableColumns = [
    {
      key: 'invoice_number',
      header: 'Facture',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceId}>{invoice.invoice_number}</span>
      ),
    },
    {
      key: 'client_id',
      header: 'Client',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceClient}>{getClientName(invoice.client_id)}</span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Montant',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceAmount}>{formatCurrency(invoice.total_amount)}</span>
      ),
    },
    {
      key: 'issue_date',
      header: 'Date',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceDate}>{formatDate(invoice.issue_date)}</span>
      ),
    },
    {
      key: 'due_date',
      header: 'Echeance',
      render: (invoice: Invoice) => (
        <span className={styles.invoiceDue}>{formatDate(invoice.due_date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (invoice: Invoice) => getStatusBadge(invoice.status),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (invoice: Invoice) => (
        <Dropdown
          trigger={
            <button className={styles.invoiceMenu} aria-label="Plus d'options">
              <MoreVertical size={16} />
            </button>
          }
          align="end"
        >
          <DropdownItem icon={<Eye size={16} />} onClick={() => onOpenDetail(invoice)}>
            Voir details
          </DropdownItem>
          <DropdownItem icon={<Download size={16} />} onClick={() => onExportPDF(invoice)}>
            Exporter PDF
          </DropdownItem>
          <DropdownDivider />
          {['sent', 'overdue'].includes(invoice.status) && invoice.paid_amount < invoice.total_amount && (
            <DropdownItem icon={<Banknote size={16} />} onClick={() => onOpenPayment(invoice)}>
              Enregistrer paiement
            </DropdownItem>
          )}
          {invoice.status === 'draft' && (
            <DropdownItem icon={<Send size={16} />} onClick={() => onStatusChange(invoice, 'sent')}>
              Marquer comme envoyee
            </DropdownItem>
          )}
          {['draft', 'sent', 'overdue'].includes(invoice.status) && (
            <DropdownItem icon={<CheckCircle size={16} />} onClick={() => onStatusChange(invoice, 'paid')}>
              Marquer comme payee
            </DropdownItem>
          )}
          {invoice.status === 'sent' && (
            <DropdownItem icon={<AlertTriangle size={16} />} onClick={() => onStatusChange(invoice, 'overdue')}>
              Marquer en retard
            </DropdownItem>
          )}
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <>
              <DropdownDivider />
              <DropdownItem icon={<XCircle size={16} />} destructive onClick={() => onStatusChange(invoice, 'cancelled')}>
                Annuler
              </DropdownItem>
            </>
          )}
          {invoice.status === 'draft' && (
            <>
              <DropdownDivider />
              <DropdownItem icon={<Trash2 size={16} />} destructive onClick={() => onOpenDeleteConfirm(invoice)}>
                Supprimer
              </DropdownItem>
            </>
          )}
        </Dropdown>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card padding="none" className={styles.invoicesCard}>
        <div className={styles.invoicesHeader}>
          <div>
            <h3 className={styles.invoicesTitle}>Gestion des factures</h3>
            <p className={styles.invoicesSubtitle}>Gerez vos factures et paiements</p>
          </div>
          <div className={styles.invoicesActions}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => onShowFiltersChange(!showFilters)}
            >
              Filtres
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={16} />}
              onClick={onExportCSV}
            >
              Exporter CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={onOpenCreate}
            >
              Nouvelle facture
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className={styles.filtersPanel}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.filterRow}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher par numero ou notes..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(value) => onStatusFilterChange(value as InvoiceStatus | 'all')}
                  placeholder="Statut"
                />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  placeholder="Date debut"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  placeholder="Date fin"
                />
                <Button variant="ghost" size="sm" onClick={onResetFilters}>
                  Reinitialiser
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Filters */}
        <div className={styles.quickFilters}>
          {[
            { id: 'all', name: 'Tous', count: filterCounts.all },
            { id: 'draft', name: 'Brouillons', count: filterCounts.draft },
            { id: 'sent', name: 'Envoyees', count: filterCounts.sent },
            { id: 'paid', name: 'Payees', count: filterCounts.paid },
            { id: 'overdue', name: 'En retard', count: filterCounts.overdue },
          ].map((filter) => (
            <button
              key={filter.id}
              className={`${styles.quickFilterBtn} ${statusFilter === filter.id ? styles.active : ''}`}
              onClick={() => {
                onStatusFilterChange(filter.id as InvoiceStatus | 'all');
                onPageChange(1);
              }}
            >
              <span>{filter.name}</span>
              <span className={styles.filterCount}>{filter.count}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Chargement des factures...</span>
          </div>
        )}

        {/* Error State */}
        {queryError && (
          <div className={styles.errorState}>
            <span>Erreur lors du chargement des factures</span>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Reessayer
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !queryError && filteredInvoices.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <h3>Aucune facture trouvee</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || dateFrom || dateTo
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par creer votre premiere facture'}
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={onOpenCreate}
            >
              Creer une facture
            </Button>
          </div>
        )}

        {/* Invoices Table */}
        {!isLoading && !queryError && filteredInvoices.length > 0 && (
          <>
            <Table
              data={paginatedInvoices}
              columns={tableColumns}
              onRowClick={onOpenDetail}
              isLoading={isLoading}
              emptyMessage="Aucune facture trouvee"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
});
