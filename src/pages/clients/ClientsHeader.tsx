import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Tag,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import type { ClientStatItem, ClientTier, ClientFilterCounts } from './types';
import { commonTags, getTagColor } from './types';
import styles from '../Clients.module.css';

const tierOptions = [
  { value: 'all', label: 'Tous les niveaux' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

interface ClientsHeaderProps {
  stats: ClientStatItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
  tierFilter: ClientTier | 'all';
  onTierFilterChange: (value: ClientTier | 'all') => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  tagFilter: string[];
  onToggleTagFilter: (tag: string) => void;
  filterCounts: ClientFilterCounts;
  onResetFilters: () => void;
  onOpenCreate: () => void;
}

export const ClientsHeader = memo(function ClientsHeader({
  stats,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onShowFiltersChange,
  tierFilter,
  onTierFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onToggleTagFilter,
  filterCounts,
  onResetFilters,
  onOpenCreate,
}: ClientsHeaderProps) {
  return (
    <>
      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
              <span className={styles.statChange}>{stat.change}</span>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.toolbarActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => onViewModeChange('list')}
            >
              <List size={16} />
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Filter size={16} />}
            onClick={() => onShowFiltersChange(!showFilters)}
          >
            Filtres
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={onOpenCreate}
          >
            Nouveau client
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
                label="Niveau"
                options={tierOptions}
                value={tierFilter}
                onChange={(value) => onTierFilterChange(value as ClientTier | 'all')}
              />
              <Select
                label="Statut"
                options={statusOptions}
                value={statusFilter}
                onChange={(value) => onStatusFilterChange(value as 'all' | 'active' | 'inactive')}
              />
              <Button variant="ghost" size="sm" onClick={onResetFilters}>
                Reinitialiser
              </Button>
            </div>
            {/* Tag Filters */}
            <div className={styles.tagFiltersSection}>
              <span className={styles.filterSectionLabel}>Filtrer par tags</span>
              <div className={styles.tagFilters}>
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagFilterBtn} ${tagFilter.includes(tag) ? styles.active : ''}`}
                    onClick={() => onToggleTagFilter(tag)}
                    style={{
                      '--tag-color': getTagColor(tag),
                    } as React.CSSProperties}
                  >
                    <Tag size={12} />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Filters */}
      <div className={styles.filters}>
        {[
          { id: 'all', name: 'Tous', count: filterCounts.all },
          { id: 'vip', name: 'VIP', count: filterCounts.vip },
          { id: 'premium', name: 'Premium', count: filterCounts.premium },
          { id: 'standard', name: 'Standard', count: filterCounts.standard },
        ].map((filter) => (
          <button
            key={filter.id}
            className={`${styles.filterBtn} ${tierFilter === filter.id ? styles.active : ''}`}
            onClick={() => onTierFilterChange(filter.id as ClientTier | 'all')}
          >
            <span>{filter.name}</span>
            <span className={styles.filterCount}>{filter.count}</span>
          </button>
        ))}
      </div>
    </>
  );
});
