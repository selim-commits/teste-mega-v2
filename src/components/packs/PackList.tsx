import { Package, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { PackCard } from './PackCard';
import type { Pack } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface PackListProps {
  packs: Pack[];
  isLoading: boolean;
  onEdit: (pack: Pack) => void;
  onDelete: (pack: Pack) => void;
  onToggleActive: (pack: Pack) => void;
  onToggleFeatured: (pack: Pack) => void;
  onCreateNew: () => void;
  currency?: string;
  emptyMessage?: string;
}

export function PackList({
  packs,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onCreateNew,
  currency = '$',
  emptyMessage = 'Aucun pack trouve',
}: PackListProps) {
  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <span>Chargement des packs...</span>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Package size={48} />
        <h3>{emptyMessage}</h3>
        <p>Commencez par creer votre premier pack ou abonnement</p>
        <Button variant="primary" icon={<Plus size={16} />} onClick={onCreateNew}>
          Creer un pack
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.packsGrid}>
      {packs.map((pack, index) => (
        <PackCard
          key={pack.id}
          pack={pack}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onToggleFeatured={onToggleFeatured}
          currency={currency}
        />
      ))}
    </div>
  );
}
