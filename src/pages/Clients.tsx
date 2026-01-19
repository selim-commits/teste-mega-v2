import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Users,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Star,
  TrendingUp,
  UserPlus,
  X,
  Edit2,
  Trash2,
  Eye,
  Building,
  Tag,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import { Switch } from '../components/ui/Checkbox';
import { Progress } from '../components/ui/Progress';
import {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useActivateClient,
  useDeactivateClient,
} from '../hooks/useClients';
import { useBookings } from '../hooks/useBookings';
import { useNotifications } from '../stores/uiStore';
import type { Client, ClientTier, ClientInsert, ClientUpdate, Booking } from '../types/database';
import styles from './Clients.module.css';

// Studio ID - configured for Rooom OS
const DEMO_STUDIO_ID = '11111111-1111-1111-1111-111111111111';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  tier: ClientTier;
  notes: string;
  tags: string[];
  is_active: boolean;
}

const defaultFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  country: '',
  postal_code: '',
  tier: 'standard',
  notes: '',
  tags: [],
  is_active: true,
};

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

// Tag colors for visual distinction
const tagColors: Record<string, string> = {
  'Photographe': 'var(--accent-blue)',
  'Vidéaste': 'var(--accent-purple)',
  'Entreprise': 'var(--accent-green)',
  'Particulier': 'var(--accent-orange)',
  'Régulier': 'var(--state-success)',
  'Événementiel': 'var(--accent-pink)',
  'Mode': 'var(--accent-rose)',
  'Portrait': 'var(--accent-teal)',
  'Produit': 'var(--accent-amber)',
  'Immobilier': 'var(--accent-cyan)',
};

const getTagColor = (tag: string): string => {
  return tagColors[tag] || 'var(--accent-primary)';
};

const commonTags = [
  'Photographe',
  'Vidéaste',
  'Entreprise',
  'Particulier',
  'Régulier',
  'Événementiel',
  'Mode',
  'Portrait',
  'Produit',
  'Immobilier',
];

export function Clients() {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<ClientTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [newTag, setNewTag] = useState('');

  // Hooks
  const { success: showSuccess, error: showError } = useNotifications();

  // Queries
  const { data: clients = [], isLoading, error: queryError } = useClients({
    studioId: DEMO_STUDIO_ID,
    tier: tierFilter !== 'all' ? tierFilter : undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  const { data: selectedClient } = useClient(selectedClientId || '');

  // Get client's booking history
  const { data: clientBookings = [] } = useBookings({
    clientId: selectedClientId || undefined,
  });

  // Calculate client stats from bookings
  const clientStats = useMemo(() => {
    if (!clientBookings.length) {
      return { totalBookings: 0, totalSpent: 0, lastBooking: null as Booking | null };
    }

    const completedBookings = clientBookings.filter(
      (b) => b.status === 'completed' || b.status === 'confirmed'
    );
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const sortedBookings = [...clientBookings].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    return {
      totalBookings: clientBookings.length,
      totalSpent,
      lastBooking: sortedBookings[0] || null,
    };
  }, [clientBookings]);

  // Mutations
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const activateMutation = useActivateClient();
  const deactivateMutation = useDeactivateClient();

  // Filtered and paginated clients
  const filteredClients = useMemo(() => {
    let result = clients;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.company?.toLowerCase().includes(query) ||
          client.phone?.includes(query)
      );
    }

    // Tag filter
    if (tagFilter.length > 0) {
      result = result.filter((client) =>
        tagFilter.some((tag) => client.tags?.includes(tag))
      );
    }

    return result;
  }, [clients, searchQuery, tagFilter]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredClients.length / pageSize);

  // Stats computation
  const stats = useMemo(() => {
    const total = clients.length;
    const vip = clients.filter((c) => c.tier === 'vip').length;
    const premium = clients.filter((c) => c.tier === 'premium').length;
    const newThisMonth = clients.filter((c) => {
      const created = new Date(c.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return [
      { label: 'Total clients', value: total.toString(), icon: Users, change: '+12%', color: 'var(--accent-blue)' },
      { label: 'Nouveaux ce mois', value: newThisMonth.toString(), icon: UserPlus, change: '+8%', color: 'var(--accent-green)' },
      { label: 'Clients VIP', value: vip.toString(), icon: Star, change: '+5%', color: 'var(--accent-orange)' },
      { label: 'Clients Premium', value: premium.toString(), icon: TrendingUp, change: '+15%', color: 'var(--accent-purple)' },
    ];
  }, [clients]);

  // Filter counts
  const filterCounts = useMemo(() => {
    return {
      all: clients.length,
      vip: clients.filter((c) => c.tier === 'vip').length,
      premium: clients.filter((c) => c.tier === 'premium').length,
      standard: clients.filter((c) => c.tier === 'standard').length,
      active: clients.filter((c) => c.is_active).length,
      inactive: clients.filter((c) => !c.is_active).length,
    };
  }, [clients]);

  // Handlers
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleCreateClient = useCallback(async () => {
    if (!validateForm()) return;

    const clientData: Omit<ClientInsert, 'id' | 'created_at' | 'updated_at'> = {
      studio_id: DEMO_STUDIO_ID,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      company: formData.company || null,
      address: formData.address || null,
      city: formData.city || null,
      country: formData.country || null,
      postal_code: formData.postal_code || null,
      tier: formData.tier,
      notes: formData.notes || null,
      tags: formData.tags,
      is_active: formData.is_active,
    };

    try {
      await createMutation.mutateAsync(clientData);
      showSuccess('Client créé', 'Le client a été créé avec succès');
      setIsCreateModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      showError('Erreur', 'Impossible de créer le client');
    }
  }, [formData, validateForm, createMutation, showSuccess, showError]);

  const handleUpdateClient = useCallback(async () => {
    if (!selectedClientId || !validateForm()) return;

    const updateData: ClientUpdate = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      company: formData.company || null,
      address: formData.address || null,
      city: formData.city || null,
      country: formData.country || null,
      postal_code: formData.postal_code || null,
      tier: formData.tier,
      notes: formData.notes || null,
      tags: formData.tags,
      is_active: formData.is_active,
    };

    try {
      await updateMutation.mutateAsync({ id: selectedClientId, data: updateData });
      showSuccess('Client modifié', 'Le client a été modifié avec succès');
      setIsEditModalOpen(false);
      setSelectedClientId(null);
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le client');
    }
  }, [selectedClientId, formData, validateForm, updateMutation, showSuccess, showError]);

  const handleDeleteClient = useCallback(async () => {
    if (!selectedClientId) return;

    try {
      await deleteMutation.mutateAsync(selectedClientId);
      showSuccess('Client supprimé', 'Le client a été supprimé avec succès');
      setIsDeleteConfirmOpen(false);
      setIsDetailSidebarOpen(false);
      setSelectedClientId(null);
    } catch (error) {
      showError('Erreur', 'Impossible de supprimer le client');
    }
  }, [selectedClientId, deleteMutation, showSuccess, showError]);

  const handleToggleActive = useCallback(async (client: Client) => {
    try {
      if (client.is_active) {
        await deactivateMutation.mutateAsync(client.id);
        showSuccess('Client désactivé', `${client.name} a été désactivé`);
      } else {
        await activateMutation.mutateAsync(client.id);
        showSuccess('Client activé', `${client.name} a été activé`);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le statut du client');
    }
  }, [activateMutation, deactivateMutation, showSuccess, showError]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  const handleToggleTagFilter = useCallback((tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  }, []);

  const openEditModal = useCallback((client: Client) => {
    setSelectedClientId(client.id);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || '',
      postal_code: client.postal_code || '',
      tier: client.tier,
      notes: client.notes || '',
      tags: client.tags || [],
      is_active: client.is_active,
    });
    setIsEditModalOpen(true);
  }, []);

  const openDetailSidebar = useCallback((client: Client) => {
    setSelectedClientId(client.id);
    setIsDetailSidebarOpen(true);
  }, []);

  const getTierBadge = (tier: ClientTier) => {
    switch (tier) {
      case 'vip':
        return <Badge variant="warning" size="sm">VIP</Badge>;
      case 'premium':
        return <Badge variant="info" size="sm">Premium</Badge>;
      case 'standard':
      default:
        return <Badge variant="default" size="sm">Standard</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Table columns for list view
  const tableColumns = [
    {
      key: 'name',
      header: 'Client',
      render: (client: Client) => (
        <div className={styles.clientTableCell}>
          <div className={styles.clientAvatar}>{getInitials(client.name)}</div>
          <div>
            <div className={styles.clientTableName}>{client.name}</div>
            <div className={styles.clientTableEmail}>{client.email || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Entreprise',
      render: (client: Client) => client.company || '-',
    },
    {
      key: 'tier',
      header: 'Niveau',
      render: (client: Client) => getTierBadge(client.tier),
    },
    {
      key: 'score',
      header: 'Score',
      render: (client: Client) => (
        <div className={styles.scoreCell}>
          <div className={styles.scoreGauge}>
            <Progress
              value={client.score || 0}
              max={100}
              size="sm"
              variant={
                (client.score || 0) >= 80
                  ? 'success'
                  : (client.score || 0) >= 50
                  ? 'warning'
                  : 'default'
              }
            />
          </div>
          <span className={styles.scoreValue}>{client.score || 0}</span>
        </div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (client: Client) => (
        <div className={styles.tagsCell}>
          {client.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
          {(client.tags?.length || 0) > 2 && (
            <Badge variant="default" size="sm">+{client.tags!.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (client: Client) => (
        client.is_active ? (
          <Badge variant="success" size="sm" dot>Actif</Badge>
        ) : (
          <Badge variant="error" size="sm" dot>Inactif</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (client: Client) => (
        <Dropdown
          trigger={
            <button className={styles.clientMenu}>
              <MoreVertical size={16} />
            </button>
          }
          align="end"
        >
          <DropdownItem icon={<Eye size={16} />} onClick={() => openDetailSidebar(client)}>
            Voir détails
          </DropdownItem>
          <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(client)}>
            Modifier
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={client.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            onClick={() => handleToggleActive(client)}
          >
            {client.is_active ? 'Désactiver' : 'Activer'}
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={<Trash2 size={16} />}
            destructive
            onClick={() => {
              setSelectedClientId(client.id);
              setIsDeleteConfirmOpen(true);
            }}
          >
            Supprimer
          </DropdownItem>
        </Dropdown>
      ),
    },
  ];

  // Render form fields (shared between create and edit modals)
  const renderFormFields = () => (
    <div className={styles.formGrid}>
      <Input
        label="Nom *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={formErrors.name}
        fullWidth
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={formErrors.email}
        icon={<Mail size={16} />}
        fullWidth
      />
      <Input
        label="Téléphone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        icon={<Phone size={16} />}
        fullWidth
      />
      <Input
        label="Entreprise"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        icon={<Building size={16} />}
        fullWidth
      />
      <Input
        label="Adresse"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        icon={<MapPin size={16} />}
        fullWidth
      />
      <Input
        label="Ville"
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        fullWidth
      />
      <Input
        label="Code postal"
        value={formData.postal_code}
        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
        fullWidth
      />
      <Input
        label="Pays"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        fullWidth
      />
      <Select
        label="Niveau"
        options={tierOptions.filter((o) => o.value !== 'all')}
        value={formData.tier}
        onChange={(value) => setFormData({ ...formData, tier: value as ClientTier })}
        fullWidth
      />
      <div className={styles.formFullWidth}>
        <label className={styles.formLabel}>Notes</label>
        <textarea
          className={styles.textarea}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder="Notes internes sur le client..."
        />
      </div>
      <div className={styles.formFullWidth}>
        <label className={styles.formLabel}>Tags</label>
        <div className={styles.tagsSection}>
          <div className={styles.tagsInput}>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Ajouter un tag..."
              icon={<Tag size={16} />}
            />
            <Button variant="secondary" size="sm" onClick={handleAddTag}>
              Ajouter
            </Button>
          </div>
          <div className={styles.commonTags}>
            {commonTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.commonTag} ${formData.tags.includes(tag) ? styles.active : ''}`}
                onClick={() => {
                  if (formData.tags.includes(tag)) {
                    handleRemoveTag(tag);
                  } else {
                    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                  }
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          {formData.tags.length > 0 && (
            <div className={styles.selectedTags}>
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="info" size="sm">
                  {tag}
                  <button
                    type="button"
                    className={styles.removeTag}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.formFullWidth}>
        <Switch
          label="Client actif"
          description="Les clients inactifs n'apparaissent pas dans les listes de sélection"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Header title="Client 360" subtitle="Gérez vos relations clients" />

      <div className={styles.content}>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.toolbarActions}>
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
                setIsCreateModalOpen(true);
              }}
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
                  onChange={(value) => {
                    setTierFilter(value as ClientTier | 'all');
                    setCurrentPage(1);
                  }}
                />
                <Select
                  label="Statut"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value as 'all' | 'active' | 'inactive');
                    setCurrentPage(1);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTierFilter('all');
                    setStatusFilter('all');
                    setTagFilter([]);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
              {/* Tag Filters */}
              <div className={styles.tagFiltersSection}>
                <label className={styles.filterSectionLabel}>Filtrer par tags</label>
                <div className={styles.tagFilters}>
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagFilterBtn} ${tagFilter.includes(tag) ? styles.active : ''}`}
                      onClick={() => handleToggleTagFilter(tag)}
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
              onClick={() => {
                setTierFilter(filter.id as ClientTier | 'all');
                setCurrentPage(1);
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
            <span>Chargement des clients...</span>
          </div>
        )}

        {/* Error State */}
        {queryError && (
          <div className={styles.errorState}>
            <span>Erreur lors du chargement des clients</span>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !queryError && filteredClients.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>Aucun client trouvé</h3>
            <p>
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter votre premier client'}
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setFormData(defaultFormData);
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
            >
              Ajouter un client
            </Button>
          </div>
        )}

        {/* Clients Grid/List */}
        {!isLoading && !queryError && filteredClients.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className={styles.clientsGrid}>
                {paginatedClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card padding="none" hoverable className={styles.clientCard}>
                      <div className={styles.clientHeader}>
                        <div
                          className={styles.clientAvatar}
                          style={{
                            backgroundColor:
                              client.tier === 'vip'
                                ? 'var(--accent-orange)'
                                : client.tier === 'premium'
                                ? 'var(--accent-blue)'
                                : 'var(--bg-surface-hover)',
                          }}
                        >
                          {getInitials(client.name)}
                        </div>
                        <Dropdown
                          trigger={
                            <button className={styles.clientMenu}>
                              <MoreVertical size={16} />
                            </button>
                          }
                          align="end"
                        >
                          <DropdownItem icon={<Eye size={16} />} onClick={() => openDetailSidebar(client)}>
                            Voir détails
                          </DropdownItem>
                          <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(client)}>
                            Modifier
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={client.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            onClick={() => handleToggleActive(client)}
                          >
                            {client.is_active ? 'Désactiver' : 'Activer'}
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={<Trash2 size={16} />}
                            destructive
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                          >
                            Supprimer
                          </DropdownItem>
                        </Dropdown>
                      </div>

                      <div className={styles.clientContent} onClick={() => openDetailSidebar(client)}>
                        <div className={styles.clientInfo}>
                          <h4 className={styles.clientName}>{client.name}</h4>
                          <p className={styles.clientCompany}>{client.company || 'Particulier'}</p>
                          <div className={styles.clientBadges}>
                            {getTierBadge(client.tier)}
                            {!client.is_active && <Badge variant="error" size="sm">Inactif</Badge>}
                          </div>
                        </div>

                        <div className={styles.clientContact}>
                          {client.email && (
                            <div className={styles.contactItem}>
                              <Mail size={14} />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className={styles.contactItem}>
                              <Phone size={14} />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.city && (
                            <div className={styles.contactItem}>
                              <MapPin size={14} />
                              <span>{client.city}</span>
                            </div>
                          )}
                        </div>

                        {client.tags && client.tags.length > 0 && (
                          <div className={styles.clientTags}>
                            {client.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                            ))}
                            {client.tags.length > 3 && (
                              <Badge variant="default" size="sm">+{client.tags.length - 3}</Badge>
                            )}
                          </div>
                        )}

                        <div className={styles.clientStats}>
                          <div className={styles.clientScoreSection}>
                            <div className={styles.clientScoreHeader}>
                              <Star size={14} />
                              <span className={styles.clientScoreLabel}>Score client</span>
                              <span className={styles.clientScoreValue}>{client.score || 0}/100</span>
                            </div>
                            <Progress
                              value={client.score || 0}
                              max={100}
                              size="sm"
                              variant={
                                (client.score || 0) >= 80
                                  ? 'success'
                                  : (client.score || 0) >= 50
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.clientFooter}>
                        <span className={styles.lastVisit}>
                          Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => openDetailSidebar(client)}>
                          Voir profil
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Table
                data={paginatedClients}
                columns={tableColumns}
                onRowClick={openDetailSidebar}
                isLoading={isLoading}
                emptyMessage="Aucun client trouvé"
              />
            )}

            {/* Pagination */}
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

      {/* Create Client Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="lg">
        <ModalHeader title="Nouveau client" subtitle="Ajoutez un nouveau client à votre base" onClose={() => setIsCreateModalOpen(false)} />
        <ModalBody>{renderFormFields()}</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateClient}
            loading={createMutation.isPending}
          >
            Créer le client
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="lg">
        <ModalHeader
          title="Modifier le client"
          subtitle={selectedClient?.name}
          onClose={() => setIsEditModalOpen(false)}
        />
        <ModalBody>{renderFormFields()}</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateClient}
            loading={updateMutation.isPending}
          >
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} size="sm">
        <ModalHeader title="Supprimer le client" onClose={() => setIsDeleteConfirmOpen(false)} />
        <ModalBody>
          <p>Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteClient}
            loading={deleteMutation.isPending}
            className={styles.deleteBtn}
          >
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Client Detail Sidebar */}
      <AnimatePresence>
        {isDetailSidebarOpen && selectedClient && (
          <>
            <motion.div
              className={styles.sidebarOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailSidebarOpen(false)}
            />
            <motion.div
              className={styles.sidebar}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarTitle}>
                  <h2>Détails du client</h2>
                  <button onClick={() => setIsDetailSidebarOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.sidebarContent}>
                <div className={styles.clientProfile}>
                  <div
                    className={styles.profileAvatar}
                    style={{
                      backgroundColor:
                        selectedClient.tier === 'vip'
                          ? 'var(--accent-orange)'
                          : selectedClient.tier === 'premium'
                          ? 'var(--accent-blue)'
                          : 'var(--bg-surface-hover)',
                    }}
                  >
                    {getInitials(selectedClient.name)}
                  </div>
                  <h3>{selectedClient.name}</h3>
                  <p>{selectedClient.company || 'Particulier'}</p>
                  <div className={styles.profileBadges}>
                    {getTierBadge(selectedClient.tier)}
                    {selectedClient.is_active ? (
                      <Badge variant="success" size="sm" dot>Actif</Badge>
                    ) : (
                      <Badge variant="error" size="sm" dot>Inactif</Badge>
                    )}
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <h4>Informations de contact</h4>
                  <div className={styles.contactList}>
                    {selectedClient.email && (
                      <div className={styles.contactRow}>
                        <Mail size={16} />
                        <a href={`mailto:${selectedClient.email}`}>{selectedClient.email}</a>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className={styles.contactRow}>
                        <Phone size={16} />
                        <a href={`tel:${selectedClient.phone}`}>{selectedClient.phone}</a>
                      </div>
                    )}
                    {(selectedClient.address || selectedClient.city) && (
                      <div className={styles.contactRow}>
                        <MapPin size={16} />
                        <span>
                          {[selectedClient.address, selectedClient.postal_code, selectedClient.city, selectedClient.country]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <h4>Statistiques</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <Star size={20} />
                      <div>
                        <span className={styles.statValue}>{selectedClient.score || 0}</span>
                        <span className={styles.statLabel}>Score</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <Calendar size={20} />
                      <div>
                        <span className={styles.statValue}>{clientStats.totalBookings}</span>
                        <span className={styles.statLabel}>Réservations</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <DollarSign size={20} />
                      <div>
                        <span className={styles.statValue}>{clientStats.totalSpent.toLocaleString('fr-FR')} €</span>
                        <span className={styles.statLabel}>Total dépensé</span>
                      </div>
                    </div>
                    {clientStats.lastBooking && (
                      <div className={styles.statItem}>
                        <Clock size={20} />
                        <div>
                          <span className={styles.statValue}>
                            {new Date(clientStats.lastBooking.start_time).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className={styles.statLabel}>Dernière visite</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Score Progress Bar */}
                  <div className={styles.scoreProgressSection}>
                    <div className={styles.scoreProgressHeader}>
                      <span>Score client</span>
                      <span>{selectedClient.score || 0}/100</span>
                    </div>
                    <Progress
                      value={selectedClient.score || 0}
                      max={100}
                      size="md"
                      variant={
                        (selectedClient.score || 0) >= 80
                          ? 'success'
                          : (selectedClient.score || 0) >= 50
                          ? 'warning'
                          : 'default'
                      }
                    />
                  </div>
                </div>

                {selectedClient.tags && selectedClient.tags.length > 0 && (
                  <div className={styles.sidebarSection}>
                    <h4>Tags</h4>
                    <div className={styles.tagsList}>
                      {selectedClient.tags.map((tag) => (
                        <span
                          key={tag}
                          className={styles.coloredTag}
                          style={{ '--tag-color': getTagColor(tag) } as React.CSSProperties}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking History */}
                {clientBookings.length > 0 && (
                  <div className={styles.sidebarSection}>
                    <h4>Historique des réservations</h4>
                    <div className={styles.bookingHistory}>
                      {clientBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className={styles.bookingItem}>
                          <div className={styles.bookingInfo}>
                            <span className={styles.bookingTitle}>{booking.title}</span>
                            <span className={styles.bookingDate}>
                              {new Date(booking.start_time).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className={styles.bookingMeta}>
                            <Badge
                              variant={
                                booking.status === 'completed'
                                  ? 'success'
                                  : booking.status === 'confirmed'
                                  ? 'info'
                                  : booking.status === 'cancelled'
                                  ? 'error'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {booking.status === 'completed'
                                ? 'Terminée'
                                : booking.status === 'confirmed'
                                ? 'Confirmée'
                                : booking.status === 'pending'
                                ? 'En attente'
                                : booking.status === 'cancelled'
                                ? 'Annulée'
                                : booking.status === 'in_progress'
                                ? 'En cours'
                                : booking.status}
                            </Badge>
                            <span className={styles.bookingAmount}>
                              {booking.total_amount?.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                        </div>
                      ))}
                      {clientBookings.length > 5 && (
                        <div className={styles.moreBookings}>
                          + {clientBookings.length - 5} autres réservations
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedClient.notes && (
                  <div className={styles.sidebarSection}>
                    <h4>Notes</h4>
                    <p className={styles.notesText}>{selectedClient.notes}</p>
                  </div>
                )}

                <div className={styles.sidebarSection}>
                  <h4>Informations</h4>
                  <div className={styles.metaList}>
                    <div className={styles.metaRow}>
                      <span>Créé le</span>
                      <span>{new Date(selectedClient.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Modifié le</span>
                      <span>{new Date(selectedClient.updated_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sidebarFooter}>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Edit2 size={16} />}
                  onClick={() => {
                    openEditModal(selectedClient);
                    setIsDetailSidebarOpen(false);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  icon={<Trash2 size={16} />}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={styles.deleteBtn}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
