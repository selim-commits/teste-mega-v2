import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Package,
  Camera,
  Lightbulb,
  Monitor,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  QrCode,
  Wrench,
  Archive,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
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
import type { Equipment, EquipmentInsert, EquipmentStatus } from '../types/database';
import styles from './Inventory.module.css';

// TODO: Replace with actual studioId from user context/store
const DEMO_STUDIO_ID = 'demo-studio-id';

interface EquipmentFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  status: EquipmentStatus;
  condition: number;
  purchase_date: string;
  purchase_price: string;
  location: string;
  image_url: string;
}

const defaultFormData: EquipmentFormData = {
  name: '',
  description: '',
  category: '',
  brand: '',
  model: '',
  serial_number: '',
  status: 'available',
  condition: 10,
  purchase_date: '',
  purchase_price: '',
  location: '',
  image_url: '',
};

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Reserv\u00e9' },
  { value: 'in_use', label: 'En utilisation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retir\u00e9' },
];

const statusFormOptions = [
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Reserv\u00e9' },
  { value: 'in_use', label: 'En utilisation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retir\u00e9' },
];

const conditionOptions = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} - ${i < 3 ? 'Mauvais' : i < 6 ? 'Moyen' : i < 9 ? 'Bon' : 'Excellent'}`,
}));

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

  // Form state
  const [formData, setFormData] = useState<EquipmentFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<EquipmentFormData>>({});

  // Store state
  const { filters, setFilters, pagination, setPage, setEquipment } = useEquipmentStore();
  const filteredEquipment = useEquipmentStore(selectFilteredEquipment);

  // API hooks
  const { data: equipment, isLoading, refetch } = useEquipment({ studioId: DEMO_STUDIO_ID });
  const { data: categoriesData } = useEquipmentCategories(DEMO_STUDIO_ID);

  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();
  const updateStatusMutation = useUpdateEquipmentStatus();
  const retireMutation = useRetireEquipment();
  const maintenanceMutation = useSetEquipmentForMaintenance();

  // Sync API data with store
  useEffect(() => {
    if (equipment) {
      setEquipment(equipment);
    }
  }, [equipment, setEquipment]);

  // Categories with counts
  const categories = useMemo(() => {
    const counts: Record<string, number> = { all: filteredEquipment.length };
    filteredEquipment.forEach((item) => {
      const cat = item.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });

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
  }, [categoriesData, equipment, filteredEquipment.length]);

  // Stats
  const stats = useMemo(() => {
    if (!equipment) return { available: 0, inUse: 0, maintenance: 0, retired: 0 };
    return {
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

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ searchQuery: e.target.value });
  }, [setFilters]);

  const handleStatusFilter = useCallback((value: string) => {
    setFilters({ status: value as EquipmentStatus | 'all' });
  }, [setFilters]);

  const handleCategoryFilter = useCallback((categoryId: string) => {
    setFilters({ category: categoryId === 'all' ? 'all' : categoryId });
  }, [setFilters]);

  const handleFormChange = useCallback((field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<EquipmentFormData> = {};

    if (!formData.name.trim()) errors.name = 'Le nom est requis';
    if (!formData.category.trim()) errors.category = 'La cat\u00e9gorie est requise';
    if (formData.condition < 1 || formData.condition > 10) {
      errors.condition = 'La condition doit \u00eatre entre 1 et 10' as unknown as number;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    const newEquipment: Omit<EquipmentInsert, 'id' | 'created_at' | 'updated_at'> = {
      studio_id: DEMO_STUDIO_ID,
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
      location: formData.location || null,
      image_url: formData.image_url || null,
      qr_code: `EQ-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    try {
      await createMutation.mutateAsync(newEquipment);
      setShowCreateModal(false);
      setFormData(defaultFormData);
      refetch();
    } catch (error) {
      console.error('Failed to create equipment:', error);
    }
  }, [formData, validateForm, createMutation, refetch]);

  const handleUpdate = useCallback(async () => {
    if (!validateForm() || !selectedEquipment) return;

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
          location: formData.location || null,
          image_url: formData.image_url || null,
        },
      });
      setShowEditModal(false);
      setSelectedEquipment(null);
      setFormData(defaultFormData);
      refetch();
    } catch (error) {
      console.error('Failed to update equipment:', error);
    }
  }, [formData, selectedEquipment, validateForm, updateMutation, refetch]);

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
    setFormData({
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
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right' as const,
      render: (item: Equipment) => (
        <Dropdown
          trigger={
            <button className={styles.actionBtn}>
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
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(0, 184, 61, 0.15)' }}>
              <CheckCircle size={20} color="var(--accent-green)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.available}</span>
              <span className={styles.statLabel}>Disponibles</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(24, 144, 204, 0.15)' }}>
              <Clock size={20} color="var(--accent-blue)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.inUse}</span>
              <span className={styles.statLabel}>En utilisation</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)' }}>
              <AlertTriangle size={20} color="var(--accent-yellow)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.maintenance}</span>
              <span className={styles.statLabel}>Maintenance</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(229, 57, 53, 0.15)' }}>
              <Package size={20} color="var(--accent-red)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.retired}</span>
              <span className={styles.statLabel}>Retir\u00e9s</span>
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
              value={filters.searchQuery}
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
              onClick={() => {
                setFormData(defaultFormData);
                setFormErrors({});
                setShowCreateModal(true);
              }}
            >
              Ajouter
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            className={styles.filtersPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
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
          </motion.div>
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
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
                            <button className={styles.itemMenu}>
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
                      <p className={styles.itemCategory}>{item.category}</p>
                      {item.brand && item.model && (
                        <p className={styles.itemBrand}>{item.brand} {item.model}</p>
                      )}
                      <div className={styles.itemMeta}>
                        <span className={styles.itemLocation}>{item.location || '-'}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className={styles.itemCondition}>
                        <span className={styles.conditionLabel}>\u00c9tat</span>
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
                </motion.div>
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
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <ModalHeader title="Ajouter un \u00e9quipement" onClose={() => setShowCreateModal(false)} />
        <ModalBody>
          <div className={styles.formGrid}>
            <Input
              label="Nom *"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              error={formErrors.name}
              fullWidth
            />
            <Input
              label="Cat\u00e9gorie *"
              value={formData.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              error={formErrors.category}
              fullWidth
            />
            <Input
              label="Marque"
              value={formData.brand}
              onChange={(e) => handleFormChange('brand', e.target.value)}
              fullWidth
            />
            <Input
              label="Mod\u00e8le"
              value={formData.model}
              onChange={(e) => handleFormChange('model', e.target.value)}
              fullWidth
            />
            <Input
              label="Num\u00e9ro de s\u00e9rie"
              value={formData.serial_number}
              onChange={(e) => handleFormChange('serial_number', e.target.value)}
              fullWidth
            />
            <Select
              label="Statut"
              options={statusFormOptions}
              value={formData.status}
              onChange={(v) => handleFormChange('status', v)}
              fullWidth
            />
            <Select
              label="\u00c9tat (1-10)"
              options={conditionOptions}
              value={String(formData.condition)}
              onChange={(v) => handleFormChange('condition', v)}
              fullWidth
            />
            <Input
              label="Emplacement"
              value={formData.location}
              onChange={(e) => handleFormChange('location', e.target.value)}
              fullWidth
            />
            <Input
              label="Date d'achat"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => handleFormChange('purchase_date', e.target.value)}
              fullWidth
            />
            <Input
              label="Prix d'achat"
              type="number"
              value={formData.purchase_price}
              onChange={(e) => handleFormChange('purchase_price', e.target.value)}
              fullWidth
            />
            <div className={styles.fullWidth}>
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                fullWidth
              />
            </div>
            <div className={styles.fullWidth}>
              <Input
                label="URL de l'image"
                value={formData.image_url}
                onChange={(e) => handleFormChange('image_url', e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Cr\u00e9ation...' : 'Cr\u00e9er'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <ModalHeader title="Modifier l'\u00e9quipement" onClose={() => setShowEditModal(false)} />
        <ModalBody>
          <div className={styles.formGrid}>
            <Input
              label="Nom *"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              error={formErrors.name}
              fullWidth
            />
            <Input
              label="Cat\u00e9gorie *"
              value={formData.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              error={formErrors.category}
              fullWidth
            />
            <Input
              label="Marque"
              value={formData.brand}
              onChange={(e) => handleFormChange('brand', e.target.value)}
              fullWidth
            />
            <Input
              label="Mod\u00e8le"
              value={formData.model}
              onChange={(e) => handleFormChange('model', e.target.value)}
              fullWidth
            />
            <Input
              label="Num\u00e9ro de s\u00e9rie"
              value={formData.serial_number}
              onChange={(e) => handleFormChange('serial_number', e.target.value)}
              fullWidth
            />
            <Select
              label="Statut"
              options={statusFormOptions}
              value={formData.status}
              onChange={(v) => handleFormChange('status', v)}
              fullWidth
            />
            <Select
              label="\u00c9tat (1-10)"
              options={conditionOptions}
              value={String(formData.condition)}
              onChange={(v) => handleFormChange('condition', v)}
              fullWidth
            />
            <Input
              label="Emplacement"
              value={formData.location}
              onChange={(e) => handleFormChange('location', e.target.value)}
              fullWidth
            />
            <Input
              label="Date d'achat"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => handleFormChange('purchase_date', e.target.value)}
              fullWidth
            />
            <Input
              label="Prix d'achat"
              type="number"
              value={formData.purchase_price}
              onChange={(e) => handleFormChange('purchase_price', e.target.value)}
              fullWidth
            />
            <div className={styles.fullWidth}>
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                fullWidth
              />
            </div>
            <div className={styles.fullWidth}>
              <Input
                label="URL de l'image"
                value={formData.image_url}
                onChange={(e) => handleFormChange('image_url', e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Mise \u00e0 jour...' : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <ModalHeader title="Confirmer la suppression" onClose={() => setShowDeleteModal(false)} />
        <ModalBody>
          <p className={styles.deleteMessage}>
            \u00cates-vous s\u00fbr de vouloir supprimer <strong>{selectedEquipment?.name}</strong> ?
            Cette action est irr\u00e9versible.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className={styles.deleteBtn}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} size="sm">
        <ModalHeader title="QR Code" onClose={() => setShowQrModal(false)} />
        <ModalBody>
          <div className={styles.qrContainer}>
            <div className={styles.qrCode}>
              {/* QR Code placeholder - in production, use a QR library like qrcode.react */}
              <div className={styles.qrPlaceholder}>
                <QrCode size={120} />
                <span className={styles.qrText}>{selectedEquipment?.qr_code || 'N/A'}</span>
              </div>
            </div>
            <div className={styles.qrInfo}>
              <h4>{selectedEquipment?.name}</h4>
              <p>{selectedEquipment?.brand} {selectedEquipment?.model}</p>
              <p className={styles.qrSerial}>S/N: {selectedEquipment?.serial_number || 'N/A'}</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowQrModal(false)}>
            Fermer
          </Button>
          <Button variant="primary" icon={<QrCode size={16} />}>
            T\u00e9l\u00e9charger
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// Helper function to get icon for category
function getCategoryIcon(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('cam\u00e9ra') || cat.includes('camera')) return Camera;
  if (cat.includes('\u00e9clair') || cat.includes('light')) return Lightbulb;
  if (cat.includes('\u00e9cran') || cat.includes('monitor')) return Monitor;
  return Package;
}
