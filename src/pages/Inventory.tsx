import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Package,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  QrCode,
  Wrench,
  Archive,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Table, Pagination } from '../components/ui/Table';
import { Checkbox } from '../components/ui/Checkbox';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import {
  useEquipment,
  useEquipmentCategories,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useUpdateEquipmentStatus,
  useRetireEquipment,
  useSetEquipmentForMaintenance,
} from '../hooks/useEquipment';
import { useEquipmentStore, selectFilteredEquipment } from '../stores/equipmentStore';
import { DEMO_STUDIO_ID as STUDIO_ID } from '../stores/authStore';
import type { Equipment, EquipmentInsert, EquipmentStatus } from '../types/database';
import { EquipmentFormModal } from './inventory/EquipmentFormModal';
import { DeleteEquipmentModal } from './inventory/DeleteEquipmentModal';
import { QrCodeModal } from './inventory/QrCodeModal';
import type { EquipmentFormData } from './inventory/types';
import { statusOptions, conditionOptions, getCategoryIcon } from './inventory/types';
import styles from './Inventory.module.css';

export function Inventory() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editFormData, setEditFormData] = useState<EquipmentFormData | null>(null);

  // Local search state with debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);

  // Store state (UI only: filters, pagination)
  const { filters, setFilters, pagination, setPage } = useEquipmentStore();

  // API hooks
  const { data: equipment, isLoading, refetch } = useEquipment({ studioId: STUDIO_ID });
  const { data: categoriesData } = useEquipmentCategories(STUDIO_ID);

  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();
  const updateStatusMutation = useUpdateEquipmentStatus();
  const retireMutation = useRetireEquipment();
  const maintenanceMutation = useSetEquipmentForMaintenance();

  // Filter equipment using store filters and React Query data
  const filteredEquipment = useMemo(
    () => selectFilteredEquipment(equipment || [], filters),
    [equipment, filters]
  );

  // Categories with counts
  const categories = useMemo(() => {
    const dbCategories = categoriesData || [];
    return [
      { id: 'all', name: 'Tout', icon: Package, count: equipment?.length || 0 },
      ...dbCategories.map((cat) => ({
        id: cat.toLowerCase(),
        name: cat,
        icon: getCategoryIcon(cat),
        count: equipment?.filter((e) => e.category.toLowerCase() === cat.toLowerCase()).length || 0,
      })),
    ];
  }, [categoriesData, equipment]);

  // Stats
  const stats = useMemo(() => {
    if (!equipment) return { total: 0, totalValue: 0, available: 0, inUse: 0, maintenance: 0, retired: 0 };
    const totalValue = equipment.reduce((sum, e) => sum + (e.current_value || e.purchase_price || 0), 0);
    return {
      total: equipment.length,
      totalValue,
      available: equipment.filter((e) => e.status === 'available').length,
      inUse: equipment.filter((e) => e.status === 'in_use' || e.status === 'reserved').length,
      maintenance: equipment.filter((e) => e.status === 'maintenance').length,
      retired: equipment.filter((e) => e.status === 'retired').length,
    };
  }, [equipment]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const { page, pageSize } = pagination;
    const start = (page - 1) * pageSize;
    return filteredEquipment.slice(start, start + pageSize);
  }, [filteredEquipment, pagination]);

  const totalPages = Math.ceil(filteredEquipment.length / pagination.pageSize);

  // Sync debounced search to store
  useEffect(() => {
    setFilters({ searchQuery: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setFilters({ status: value as EquipmentStatus | 'all' });
  }, [setFilters]);

  const handleCategoryFilter = useCallback((categoryId: string) => {
    setFilters({ category: categoryId === 'all' ? 'all' : categoryId });
  }, [setFilters]);

  const handleCreate = useCallback(async (formData: EquipmentFormData) => {
    const newEquipment: Omit<EquipmentInsert, 'id' | 'created_at' | 'updated_at'> = {
      studio_id: STUDIO_ID,
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      brand: formData.brand || null,
      model: formData.model || null,
      serial_number: formData.serial_number || null,
      status: formData.status,
      condition: formData.condition,
      purchase_date: formData.purchase_date || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      current_value: formData.current_value ? parseFloat(formData.current_value) : null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
      location: formData.location || null,
      image_url: formData.image_url || null,
      qr_code: `EQ-${crypto.randomUUID()}`,
    };

    try {
      await createMutation.mutateAsync(newEquipment);
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to create equipment:', error);
    }
  }, [createMutation, refetch]);

  const handleUpdate = useCallback(async (formData: EquipmentFormData) => {
    if (!selectedEquipment) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedEquipment.id,
        data: {
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          brand: formData.brand || null,
          model: formData.model || null,
          serial_number: formData.serial_number || null,
          status: formData.status,
          condition: formData.condition,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          current_value: formData.current_value ? parseFloat(formData.current_value) : null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
          location: formData.location || null,
          image_url: formData.image_url || null,
        },
      });
      setShowEditModal(false);
      setSelectedEquipment(null);
      setEditFormData(null);
      refetch();
    } catch (error) {
      console.error('Failed to update equipment:', error);
    }
  }, [selectedEquipment, updateMutation, refetch]);

  const handleDelete = useCallback(async () => {
    if (!selectedEquipment) return;

    try {
      await deleteMutation.mutateAsync(selectedEquipment.id);
      setShowDeleteModal(false);
      setSelectedEquipment(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete equipment:', error);
    }
  }, [selectedEquipment, deleteMutation, refetch]);

  const handleBulkDelete = useCallback(async () => {
    const promises = Array.from(selectedItems).map((id) => deleteMutation.mutateAsync(id));
    try {
      await Promise.all(promises);
      setSelectedItems(new Set());
      refetch();
    } catch (error) {
      console.error('Failed to delete equipment:', error);
    }
  }, [selectedItems, deleteMutation, refetch]);

  const handleStatusChange = useCallback(async (id: string, status: EquipmentStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [updateStatusMutation, refetch]);

  const handleMaintenance = useCallback(async (id: string) => {
    try {
      await maintenanceMutation.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Failed to set maintenance:', error);
    }
  }, [maintenanceMutation, refetch]);

  const handleRetire = useCallback(async (id: string) => {
    try {
      await retireMutation.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Failed to retire equipment:', error);
    }
  }, [retireMutation, refetch]);

  const openEditModal = useCallback((item: Equipment) => {
    setSelectedEquipment(item);
    setEditFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      serial_number: item.serial_number || '',
      status: item.status,
      condition: item.condition,
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price?.toString() || '',
      current_value: item.current_value?.toString() || '',
      hourly_rate: item.hourly_rate?.toString() || '',
      daily_rate: item.daily_rate?.toString() || '',
      location: item.location || '',
      image_url: item.image_url || '',
    });
    setShowEditModal(true);
  }, []);

  const openDeleteModal = useCallback((item: Equipment) => {
    setSelectedEquipment(item);
    setShowDeleteModal(true);
  }, []);

  const openQrModal = useCallback((item: Equipment) => {
    setSelectedEquipment(item);
    setShowQrModal(true);
  }, []);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map((item) => item.id)));
    }
  }, [selectedItems.size, paginatedData]);

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return <Badge variant="success" size="sm" dot>Disponible</Badge>;
      case 'reserved':
        return <Badge variant="info" size="sm" dot>R\u00e9serv\u00e9</Badge>;
      case 'in_use':
        return <Badge variant="info" size="sm" dot>En cours</Badge>;
      case 'maintenance':
        return <Badge variant="warning" size="sm" dot>Maintenance</Badge>;
      case 'retired':
        return <Badge variant="default" size="sm" dot>Retir\u00e9</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 8) return 'var(--accent-green)';
    if (condition >= 5) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const tableColumns = [
    {
      key: 'select',
      header: (
        <Checkbox
          checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
          indeterminate={selectedItems.size > 0 && selectedItems.size < paginatedData.length}
          onChange={toggleSelectAll}
        />
      ) as unknown as string,
      width: '50px',
      render: (item: Equipment) => (
        <Checkbox
          checked={selectedItems.has(item.id)}
          onChange={() => toggleSelectItem(item.id)}
        />
      ),
    },
    {
      key: 'name',
      header: 'Nom',
      render: (item: Equipment) => (
        <div className={styles.nameCell}>
          <div className={styles.itemThumbnail}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} />
            ) : (
              <Package size={20} />
            )}
          </div>
          <div>
            <span className={styles.itemName}>{item.name}</span>
            {item.brand && item.model && (
              <span className={styles.itemMeta}>{item.brand} {item.model}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Cat\u00e9gorie',
      render: (item: Equipment) => <span className={styles.categoryTag}>{item.category}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: Equipment) => getStatusBadge(item.status),
    },
    {
      key: 'condition',
      header: '\u00c9tat',
      render: (item: Equipment) => (
        <div className={styles.conditionCell}>
          <div className={styles.conditionBar}>
            <div
              className={styles.conditionFill}
              style={{
                width: `${item.condition * 10}%`,
                backgroundColor: getConditionColor(item.condition),
              }}
            />
          </div>
          <span style={{ color: getConditionColor(item.condition) }}>{item.condition}/10</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Emplacement',
      render: (item: Equipment) => item.location || '-',
    },
    {
      key: 'pricing',
      header: 'Tarifs',
      render: (item: Equipment) => (
        <div className={styles.pricingCell}>
          {item.hourly_rate && <span className={styles.priceTag}>{item.hourly_rate}$/h</span>}
          {item.daily_rate && <span className={styles.priceTag}>{item.daily_rate}$/j</span>}
          {!item.hourly_rate && !item.daily_rate && <span className={styles.noPrice}>-</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right' as const,
      render: (item: Equipment) => (
        <Dropdown
          trigger={
            <button className={styles.actionBtn} aria-label="Plus d'options">
              <MoreVertical size={16} />
            </button>
          }
          align="end"
        >
          <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(item)}>
            Modifier
          </DropdownItem>
          <DropdownItem icon={<QrCode size={16} />} onClick={() => openQrModal(item)}>
            Voir QR Code
          </DropdownItem>
          <DropdownDivider />
          {item.status !== 'maintenance' && (
            <DropdownItem icon={<Wrench size={16} />} onClick={() => handleMaintenance(item.id)}>
              Mettre en maintenance
            </DropdownItem>
          )}
          {item.status !== 'available' && item.status !== 'retired' && (
            <DropdownItem
              icon={<CheckCircle size={16} />}
              onClick={() => handleStatusChange(item.id, 'available')}
            >
              Marquer disponible
            </DropdownItem>
          )}
          {item.status !== 'retired' && (
            <DropdownItem icon={<Archive size={16} />} onClick={() => handleRetire(item.id)}>
              Retirer
            </DropdownItem>
          )}
          <DropdownDivider />
          <DropdownItem icon={<Trash2 size={16} />} destructive onClick={() => openDeleteModal(item)}>
            Supprimer
          </DropdownItem>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <Header
        title="Smart Inventory"
        subtitle="G\u00e9rez votre \u00e9quipement et consommables"
      />

      <div className={styles.content}>
        {/* Stats Overview */}
        <div className={styles.statsGrid}>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(156, 39, 176, 0.15)' }}>
              <Boxes size={20} color="#9c27b0" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total equipements</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)' }}>
              <DollarSign size={20} color="#4caf50" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalValue.toLocaleString('fr-FR')} $</span>
              <span className={styles.statLabel}>Valeur du parc</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(0, 184, 61, 0.15)' }}>
              <CheckCircle size={20} color="var(--accent-green)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.available}</span>
              <span className={styles.statLabel}>Disponibles</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)' }}>
              <AlertTriangle size={20} color="var(--accent-yellow)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.maintenance}</span>
              <span className={styles.statLabel}>En maintenance</span>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un \u00e9quipement..."
              value={searchInput}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.toolbarActions}>
            {selectedItems.size > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={handleBulkDelete}
              >
                Supprimer ({selectedItems.size})
              </Button>
            )}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Ajouter
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={`${styles.filtersPanel} ${styles.animateIn}`}>
            <div className={styles.filterRow}>
              <Select
                label="Statut"
                options={statusOptions}
                value={filters.status}
                onChange={handleStatusFilter}
              />
              <Select
                label="Cat\u00e9gorie"
                options={[
                  { value: 'all', label: 'Toutes les cat\u00e9gories' },
                  ...categories.slice(1).map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={filters.category}
                onChange={(v) => handleCategoryFilter(v)}
              />
              <Select
                label="Condition minimum"
                options={[
                  { value: '0', label: 'Tous' },
                  ...conditionOptions,
                ]}
                value={String(filters.conditionMin)}
                onChange={(v) => setFilters({ conditionMin: parseInt(v) })}
              />
            </div>
          </div>
        )}

        {/* Categories */}
        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryBtn} ${filters.category === cat.id ? styles.active : ''}`}
              onClick={() => handleCategoryFilter(cat.id)}
            >
              <cat.icon size={18} />
              <span>{cat.name}</span>
              <span className={styles.categoryCount}>{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <>
            <Table
              data={paginatedData}
              columns={tableColumns}
              isLoading={isLoading}
              emptyMessage="Aucun \u00e9quipement trouv\u00e9"
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <div className={styles.itemsGrid}>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} padding="none" className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                  </div>
                </Card>
              ))
            ) : paginatedData.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={48} />
                <p>Aucun \u00e9quipement trouv\u00e9</p>
              </div>
            ) : (
              paginatedData.map((item, index) => (
                <div
                  key={item.id}
                  className={styles.animateIn}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card padding="none" hoverable className={styles.itemCard}>
                    <div className={styles.itemImage}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <Package size={40} className={styles.itemPlaceholder} />
                      )}
                      <div className={styles.itemCheckbox}>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                      </div>
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <Dropdown
                          trigger={
                            <button className={styles.itemMenu} aria-label="Plus d'options">
                              <MoreVertical size={16} />
                            </button>
                          }
                          align="end"
                        >
                          <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(item)}>
                            Modifier
                          </DropdownItem>
                          <DropdownItem icon={<QrCode size={16} />} onClick={() => openQrModal(item)}>
                            Voir QR Code
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={<Trash2 size={16} />}
                            destructive
                            onClick={() => openDeleteModal(item)}
                          >
                            Supprimer
                          </DropdownItem>
                        </Dropdown>
                      </div>
                      <span className={styles.categoryBadge}>{item.category}</span>
                      {item.brand && item.model && (
                        <p className={styles.itemBrand}>{item.brand} {item.model}</p>
                      )}
                      <div className={styles.itemMeta}>
                        <span className={styles.itemLocation}>{item.location || '-'}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      {(item.hourly_rate || item.daily_rate) && (
                        <div className={styles.itemPricing}>
                          {item.hourly_rate && (
                            <span className={styles.priceTag}>
                              <Clock size={12} />
                              {item.hourly_rate}$/h
                            </span>
                          )}
                          {item.daily_rate && (
                            <span className={styles.priceTag}>
                              <DollarSign size={12} />
                              {item.daily_rate}$/j
                            </span>
                          )}
                        </div>
                      )}
                      <div className={styles.itemCondition}>
                        <span className={styles.conditionLabel}>Etat</span>
                        <div className={styles.conditionBar}>
                          <div
                            className={styles.conditionFill}
                            style={{
                              width: `${item.condition * 10}%`,
                              backgroundColor: getConditionColor(item.condition),
                            }}
                          />
                        </div>
                        <span className={styles.conditionValue}>{item.condition}/10</span>
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'grid' && totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Create Modal */}
      <EquipmentFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        title="Ajouter un \u00e9quipement"
        submitLabel="Cr\u00e9er"
      />

      {/* Edit Modal */}
      <EquipmentFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEquipment(null);
          setEditFormData(null);
        }}
        onSubmit={handleUpdate}
        initialData={editFormData}
        isSubmitting={updateMutation.isPending}
        title="Modifier l'\u00e9quipement"
        submitLabel="Enregistrer"
      />

      {/* Delete Confirmation Modal */}
      <DeleteEquipmentModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEquipment(null);
        }}
        onConfirm={handleDelete}
        equipment={selectedEquipment}
        isDeleting={deleteMutation.isPending}
      />

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => {
          setShowQrModal(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
      />
    </div>
  );
}
