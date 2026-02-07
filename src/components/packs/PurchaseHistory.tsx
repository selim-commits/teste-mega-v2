import { useState } from 'react';
import { Search, Calendar, DollarSign, Package } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Table, Pagination } from '../ui/Table';
import type { ClientPurchase, ClientPurchaseWithRelations } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface PurchaseHistoryProps {
  purchases: ClientPurchase[];
  isLoading: boolean;
  currency?: string;
}

export function PurchaseHistory({
  purchases,
  isLoading,
  currency = '$',
}: PurchaseHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    if (!searchQuery) return true;
    const purchaseWithRelations = purchase as ClientPurchaseWithRelations;
    const client = purchaseWithRelations.client;
    const product = purchaseWithRelations.product;
    const query = searchQuery.toLowerCase();
    return (
      client?.name?.toLowerCase().includes(query) ||
      client?.email?.toLowerCase().includes(query) ||
      product?.name?.toLowerCase().includes(query)
    );
  });

  // Paginate
  const totalPages = Math.ceil(filteredPurchases.length / pageSize);
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'pack':
        return <Badge variant="default" size="sm">Pack</Badge>;
      case 'subscription':
        return <Badge variant="info" size="sm">Abonnement</Badge>;
      case 'gift_certificate':
        return <Badge variant="warning" size="sm">Certificat</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  const tableColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (purchase: ClientPurchase) => (
        <div className={styles.dateCell}>
          <Calendar size={14} />
          <span>{formatDate(purchase.purchased_at)}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (purchase: ClientPurchase) => {
        const client = (purchase as ClientPurchaseWithRelations).client;
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
      header: 'Produit',
      render: (purchase: ClientPurchase) => {
        const product = (purchase as ClientPurchaseWithRelations).product;
        return (
          <div className={styles.productCell}>
            <Package size={14} />
            <div>
              <span className={styles.productName}>{product?.name || 'Produit inconnu'}</span>
              {product && getTypeBadge(product.type)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Montant',
      render: (purchase: ClientPurchase) => {
        const product = (purchase as ClientPurchaseWithRelations).product;
        return (
          <div className={styles.amountCell}>
            <DollarSign size={14} />
            <span>{(product?.price || 0).toLocaleString('fr-FR')} {currency}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (purchase: ClientPurchase) => {
        switch (purchase.status) {
          case 'active':
            return <Badge variant="success" size="sm">Actif</Badge>;
          case 'paused':
            return <Badge variant="warning" size="sm">Pause</Badge>;
          case 'cancelled':
            return <Badge variant="error" size="sm">Annule</Badge>;
          case 'expired':
            return <Badge variant="default" size="sm">Expire</Badge>;
          default:
            return <Badge variant="default" size="sm">{purchase.status}</Badge>;
        }
      },
    },
    {
      key: 'gift',
      header: 'Cadeau',
      render: (purchase: ClientPurchase) => (
        purchase.gift_code ? (
          <Badge variant="info" size="sm">
            {purchase.gift_redeemed_at ? 'Utilise' : 'Non utilise'}
          </Badge>
        ) : (
          <span className={styles.noValue}>-</span>
        )
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <span>Chargement de l'historique...</span>
      </div>
    );
  }

  return (
    <div className={styles.historySection}>
      {/* Search */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher un achat..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Empty state */}
      {filteredPurchases.length === 0 ? (
        <div className={styles.emptyState}>
          <DollarSign size={48} />
          <h3>Aucun achat trouve</h3>
          <p>
            {searchQuery
              ? 'Essayez de modifier votre recherche'
              : 'Aucun achat n\'a encore ete effectue'}
          </p>
        </div>
      ) : (
        <>
          <Table
            data={paginatedPurchases}
            columns={tableColumns}
            isLoading={isLoading}
            emptyMessage="Aucun achat trouve"
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
