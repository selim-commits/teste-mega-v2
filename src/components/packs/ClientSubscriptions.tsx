import { useState } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  XCircle,
  Clock,
  Zap,
  User,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Table, Pagination } from '../ui/Table';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';
import type { ClientPurchase, Client, Pack, SubscriptionStatus } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface ClientSubscriptionsProps {
  purchases: ClientPurchase[];
  isLoading: boolean;
  onPause: (purchase: ClientPurchase) => void;
  onResume: (purchase: ClientPurchase) => void;
  onCancel: (purchase: ClientPurchase) => void;
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'paused', label: 'En pause' },
  { value: 'cancelled', label: 'Annule' },
  { value: 'expired', label: 'Expire' },
];

export function ClientSubscriptions({
  purchases,
  isLoading,
  onPause,
  onResume,
  onCancel,
}: ClientSubscriptionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (purchase as any).client as Client | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = (purchase as any).product as Pack | undefined;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesClient = client?.name?.toLowerCase().includes(query) || client?.email?.toLowerCase().includes(query);
      const matchesProduct = product?.name?.toLowerCase().includes(query);
      if (!matchesClient && !matchesProduct) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && purchase.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Paginate
  const totalPages = Math.ceil(filteredPurchases.length / pageSize);
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm" dot>Actif</Badge>;
      case 'paused':
        return <Badge variant="warning" size="sm" dot>En pause</Badge>;
      case 'cancelled':
        return <Badge variant="error" size="sm" dot>Annule</Badge>;
      case 'expired':
        return <Badge variant="default" size="sm" dot>Expire</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const tableColumns = [
    {
      key: 'client',
      header: 'Client',
      render: (purchase: ClientPurchase) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (purchase as any).client as Client | undefined;
        return (
          <div className={styles.clientCell}>
            <div className={styles.clientAvatar}>
              {client?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <span className={styles.clientName}>{client?.name || 'Client inconnu'}</span>
              <span className={styles.clientEmail}>{client?.email || '-'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'product',
      header: 'Pack / Abonnement',
      render: (purchase: ClientPurchase) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const product = (purchase as any).product as Pack | undefined;
        return (
          <div className={styles.productCell}>
            <Package size={14} />
            <span>{product?.name || 'Pack inconnu'}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (purchase: ClientPurchase) => getStatusBadge(purchase.status),
    },
    {
      key: 'credits',
      header: 'Credits restants',
      render: (purchase: ClientPurchase) => (
        <div className={styles.creditsCell}>
          <Zap size={14} />
          <span>{purchase.credits_remaining ?? '-'}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Periode',
      render: (purchase: ClientPurchase) => (
        <div className={styles.datesCell}>
          <span>{formatDate(purchase.current_period_start)}</span>
          <span className={styles.dateSeparator}>-</span>
          <span>{formatDate(purchase.current_period_end)}</span>
        </div>
      ),
    },
    {
      key: 'expiry',
      header: 'Expiration',
      render: (purchase: ClientPurchase) => (
        <div className={styles.expiryCell}>
          <Clock size={14} />
          <span>{formatDate(purchase.expires_at)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (purchase: ClientPurchase) => (
        <Dropdown
          trigger={
            <button className={styles.actionBtn}>
              <MoreVertical size={16} />
            </button>
          }
          align="end"
        >
          {purchase.status === 'active' && (
            <DropdownItem icon={<Pause size={16} />} onClick={() => onPause(purchase)}>
              Mettre en pause
            </DropdownItem>
          )}
          {purchase.status === 'paused' && (
            <DropdownItem icon={<Play size={16} />} onClick={() => onResume(purchase)}>
              Reactiver
            </DropdownItem>
          )}
          {(purchase.status === 'active' || purchase.status === 'paused') && (
            <>
              <DropdownDivider />
              <DropdownItem
                icon={<XCircle size={16} />}
                destructive
                onClick={() => onCancel(purchase)}
              >
                Annuler
              </DropdownItem>
            </>
          )}
        </Dropdown>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <span>Chargement des abonnements...</span>
      </div>
    );
  }

  return (
    <div className={styles.subscriptionsSection}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher un client ou pack..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.toolbarActions}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtres
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
              <Select
                label="Statut"
                options={statusOptions}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v as SubscriptionStatus | 'all');
                  setCurrentPage(1);
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                Reinitialiser
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick filters */}
      <div className={styles.filters}>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.filterBtn} ${statusFilter === option.value ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter(option.value as SubscriptionStatus | 'all');
              setCurrentPage(1);
            }}
          >
            <span>{option.label}</span>
            <span className={styles.filterCount}>
              {option.value === 'all'
                ? purchases.length
                : purchases.filter((p) => p.status === option.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredPurchases.length === 0 ? (
        <div className={styles.emptyState}>
          <User size={48} />
          <h3>Aucun abonnement trouve</h3>
          <p>
            {searchQuery || statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Aucun client n\'a encore souscrit a un pack'}
          </p>
        </div>
      ) : (
        <>
          <Table
            data={paginatedPurchases}
            columns={tableColumns}
            isLoading={isLoading}
            emptyMessage="Aucun abonnement trouve"
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
