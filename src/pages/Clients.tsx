import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
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
  Tag,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Clock,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  Send,
  FileText,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
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
import { DEMO_STUDIO_ID } from '../stores/authStore';
import type { Client, ClientTier, ClientInsert, ClientUpdate, Booking } from '../types/database';
import { ClientFormModal } from './clients/ClientFormModal';
import type { ClientFormData } from './clients/ClientFormModal';
import styles from './Clients.module.css';

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

// CRM Tag definitions
const crmTagDefinitions = [
  { id: 'vip', label: 'VIP', color: '#D97706' },
  { id: 'regulier', label: 'Regulier', color: '#22C55E' },
  { id: 'nouveau', label: 'Nouveau', color: '#3B82F6' },
  { id: 'fidele', label: 'Fidele', color: '#8B5CF6' },
  { id: 'inactif', label: 'Inactif', color: '#EF4444' },
] as const;

// Activity types for timeline
type ActivityType = 'reservation' | 'paiement' | 'pack' | 'message' | 'facture';

interface TimelineActivity {
  id: string;
  type: ActivityType;
  description: string;
  date: string;
}

interface ClientNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

const activityConfig: Record<ActivityType, { label: string; color: string; icon: typeof Calendar }> = {
  reservation: { label: 'Reservation', color: 'var(--state-info)', icon: Calendar },
  paiement: { label: 'Paiement', color: 'var(--state-success)', icon: CreditCard },
  pack: { label: 'Pack', color: '#8B5CF6', icon: ShoppingBag },
  message: { label: 'Message', color: 'var(--accent-primary)', icon: MessageSquare },
  facture: { label: 'Facture', color: 'var(--state-warning)', icon: FileText },
};

// Generate consistent mock activities per client (seeded by client id)
function generateMockActivities(clientId: string): TimelineActivity[] {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(clientId.length - 1);
  const templates: TimelineActivity[] = [
    { id: `${clientId}-a1`, type: 'reservation', description: 'Reservation Studio A - 2h', date: '2026-02-05T14:00:00' },
    { id: `${clientId}-a2`, type: 'paiement', description: 'Paiement de 150 \u20AC recu', date: '2026-02-03T10:30:00' },
    { id: `${clientId}-a3`, type: 'pack', description: 'Pack Premium achete (10 seances)', date: '2026-01-28T16:00:00' },
    { id: `${clientId}-a4`, type: 'message', description: 'Message envoye : Confirmation de reservation', date: '2026-01-25T09:15:00' },
    { id: `${clientId}-a5`, type: 'facture', description: 'Facture #2026-042 generee - 450 \u20AC', date: '2026-01-20T11:00:00' },
    { id: `${clientId}-a6`, type: 'reservation', description: 'Reservation Studio B - 4h (shooting produit)', date: '2026-01-15T13:00:00' },
  ];
  // Rotate starting point based on seed for variety
  const offset = seed % templates.length;
  return [...templates.slice(offset), ...templates.slice(0, offset)].slice(0, 5 + (seed % 2));
}

function generateMockNotes(clientId: string): ClientNote[] {
  const seed = clientId.charCodeAt(0);
  const templates: ClientNote[][] = [
    [
      { id: `${clientId}-n1`, text: 'Client tres professionnel, toujours a l\'heure. Prefere le studio avec lumiere naturelle.', date: '2026-01-15T10:00:00', author: 'Vous' },
      { id: `${clientId}-n2`, text: 'Interesse par un abonnement mensuel. Relancer en fevrier.', date: '2026-01-08T14:30:00', author: 'Vous' },
    ],
    [
      { id: `${clientId}-n1`, text: 'A demande des tarifs speciaux pour des shootings reguliers. Voir avec la direction.', date: '2026-01-20T09:00:00', author: 'Vous' },
    ],
    [
      { id: `${clientId}-n1`, text: 'Nouveau client recommande par Marie Dupont. Premier shooting reussi.', date: '2026-02-01T16:00:00', author: 'Vous' },
      { id: `${clientId}-n2`, text: 'Prefere les creneaux du matin. Materiel propre apporte.', date: '2026-01-25T11:00:00', author: 'Vous' },
    ],
  ];
  return templates[seed % templates.length];
}

function generateMockCrmStats(clientId: string) {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(Math.min(1, clientId.length - 1));
  const totalSpent = 500 + (seed * 137) % 4500;
  const nbReservations = 3 + (seed * 7) % 25;
  const derniereVisite = 1 + (seed * 3) % 30;
  const frequence = Math.max(0.5, Math.round(((seed * 11) % 40) / 10) / 2);
  return { totalSpent, nbReservations, derniereVisite, frequence };
}

function generateClientScore(clientId: string): number {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(Math.min(2, clientId.length - 1));
  return 20 + (seed * 17) % 80;
}

function getScoreColor(score: number): string {
  if (score > 70) return 'var(--state-success)';
  if (score >= 40) return 'var(--state-warning)';
  return 'var(--state-error)';
}

export function Clients() {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
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

  // Edit mode data for client form modal
  const [editFormData, setEditFormData] = useState<ClientFormData | null>(null);

  // CRM Enhancement State
  const [clientCrmTags, setClientCrmTags] = useState<Record<string, string[]>>({});
  const [clientNotes, setClientNotes] = useState<Record<string, ClientNote[]>>({});
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

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
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
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
  }, [clients, debouncedSearch, tagFilter]);

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
  const handleCreateClient = useCallback(async (formData: ClientFormData) => {
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
    } catch {
      showError('Erreur', 'Impossible de créer le client');
    }
  }, [createMutation, showSuccess, showError]);

  const handleUpdateClient = useCallback(async (formData: ClientFormData) => {
    if (!selectedClientId) return;

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
    } catch {
      showError('Erreur', 'Impossible de modifier le client');
    }
  }, [selectedClientId, updateMutation, showSuccess, showError]);

  const handleDeleteClient = useCallback(async () => {
    if (!selectedClientId) return;

    try {
      await deleteMutation.mutateAsync(selectedClientId);
      showSuccess('Client supprimé', 'Le client a été supprimé avec succès');
      setIsDeleteConfirmOpen(false);
      setIsDetailSidebarOpen(false);
      setSelectedClientId(null);
    } catch {
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
    } catch {
      showError('Erreur', 'Impossible de modifier le statut du client');
    }
  }, [activateMutation, deactivateMutation, showSuccess, showError]);

  const handleToggleTagFilter = useCallback((tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  }, []);

  // CRM: Toggle a CRM tag on the selected client
  const handleToggleCrmTag = useCallback((clientId: string, tagId: string) => {
    setClientCrmTags((prev) => {
      const current = prev[clientId] || [];
      const updated = current.includes(tagId)
        ? current.filter((t) => t !== tagId)
        : [...current, tagId];
      return { ...prev, [clientId]: updated };
    });
  }, []);

  // CRM: Save a new note
  const handleSaveNote = useCallback((clientId: string) => {
    if (!newNoteText.trim()) return;
    const note: ClientNote = {
      id: `${clientId}-n-${Date.now()}`,
      text: newNoteText.trim(),
      date: new Date().toISOString(),
      author: 'Vous',
    };
    setClientNotes((prev) => {
      const current = prev[clientId] || generateMockNotes(clientId);
      return { ...prev, [clientId]: [note, ...current] };
    });
    setNewNoteText('');
    setIsAddingNote(false);
  }, [newNoteText]);

  const openEditModal = useCallback((client: Client) => {
    setSelectedClientId(client.id);
    setEditFormData({
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
            <button className={styles.clientMenu} aria-label="Plus d'options">
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
              onClick={() => setIsCreateModalOpen(true)}
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
                <span className={styles.filterSectionLabel}>Filtrer par tags</span>
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
              onClick={() => setIsCreateModalOpen(true)}
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

                      <div className={styles.clientContent} onClick={() => openDetailSidebar(client)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetailSidebar(client); } }} role="button" tabIndex={0}>
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
      {isCreateModalOpen && (
        <ClientFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateClient}
          isSubmitting={createMutation.isPending}
          title="Nouveau client"
          subtitle="Ajoutez un nouveau client à votre base"
          submitLabel="Créer le client"
        />
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <ClientFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateClient}
          initialData={editFormData}
          isSubmitting={updateMutation.isPending}
          title="Modifier le client"
          subtitle={selectedClient?.name}
          submitLabel="Enregistrer"
        />
      )}

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
                  {/* CRM Tags */}
                  <div className={styles.crmTagsRow}>
                    {crmTagDefinitions.map((tag) => {
                      const isActive = (clientCrmTags[selectedClient.id] || []).includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`${styles.crmTag} ${isActive ? styles.crmTagActive : ''}`}
                          style={{
                            ...(isActive
                              ? { backgroundColor: tag.color, borderColor: tag.color }
                              : {}),
                          }}
                          onClick={() => handleToggleCrmTag(selectedClient.id, tag.id)}
                        >
                          <Tag size={10} />
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CRM: Score client circulaire */}
                <div className={styles.sidebarSection}>
                  <h4>Score client</h4>
                  {(() => {
                    const crmScore = selectedClient.score || generateClientScore(selectedClient.id);
                    const circumference = 2 * Math.PI * 40;
                    const offset = circumference - (crmScore / 100) * circumference;
                    return (
                      <div className={styles.clientScoreCircle}>
                        <div className={styles.scoreCircleWrapper}>
                          <svg className={styles.scoreCircleSvg} viewBox="0 0 96 96">
                            <circle className={styles.scoreCircleTrack} cx="48" cy="48" r="40" />
                            <circle
                              className={styles.scoreCircleProgress}
                              cx="48" cy="48" r="40"
                              stroke={getScoreColor(crmScore)}
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                            />
                          </svg>
                          <div className={styles.scoreCircleValue}>
                            <span className={styles.scoreCircleNumber}>{crmScore}</span>
                            <span className={styles.scoreCircleSuffix}>/100</span>
                          </div>
                        </div>
                        <span className={styles.scoreCircleLabel}>
                          {crmScore > 70 ? 'Excellent' : crmScore >= 40 ? 'Bon' : 'A ameliorer'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* CRM: Stats resume */}
                <div className={styles.sidebarSection}>
                  <h4>Resume CRM</h4>
                  {(() => {
                    const crmStats = generateMockCrmStats(selectedClient.id);
                    return (
                      <div className={styles.crmStatsGrid}>
                        <div className={styles.crmStatCard}>
                          <span className={styles.crmStatCardValue}>{crmStats.totalSpent.toLocaleString('fr-FR')} \u20AC</span>
                          <span className={styles.crmStatCardLabel}>Total depense</span>
                        </div>
                        <div className={styles.crmStatCard}>
                          <span className={styles.crmStatCardValue}>{crmStats.nbReservations}</span>
                          <span className={styles.crmStatCardLabel}>Nb reservations</span>
                        </div>
                        <div className={styles.crmStatCard}>
                          <span className={styles.crmStatCardValue}>{crmStats.derniereVisite}j</span>
                          <span className={styles.crmStatCardLabel}>Derniere visite</span>
                        </div>
                        <div className={styles.crmStatCard}>
                          <span className={styles.crmStatCardValue}>{crmStats.frequence}/mois</span>
                          <span className={styles.crmStatCardLabel}>Frequence</span>
                        </div>
                      </div>
                    );
                  })()}
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

                {/* CRM: Activity Timeline */}
                <div className={styles.sidebarSection}>
                  <h4>Activite recente</h4>
                  <div className={styles.timeline}>
                    {generateMockActivities(selectedClient.id).map((activity) => {
                      const config = activityConfig[activity.type];
                      const IconComponent = config.icon;
                      return (
                        <div key={activity.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} style={{ borderColor: config.color }}>
                            <IconComponent size={8} color={config.color} />
                          </div>
                          <div className={styles.timelineItemHeader}>
                            <span className={styles.timelineType} style={{ color: config.color }}>
                              {config.label}
                            </span>
                            <span className={styles.timelineDate}>
                              {new Date(activity.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <span className={styles.timelineDescription}>{activity.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CRM: Notes enrichies */}
                <div className={styles.sidebarSection}>
                  <h4>Notes</h4>
                  <div className={styles.notesList}>
                    {selectedClient.notes && (
                      <div className={styles.noteCard}>
                        <p className={styles.noteText}>{selectedClient.notes}</p>
                        <div className={styles.noteMeta}>
                          <span>par Vous</span>
                          <span>{new Date(selectedClient.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    )}
                    {(clientNotes[selectedClient.id] || generateMockNotes(selectedClient.id)).map((note) => (
                      <div key={note.id} className={styles.noteCard}>
                        <p className={styles.noteText}>{note.text}</p>
                        <div className={styles.noteMeta}>
                          <span>par {note.author}</span>
                          <span>{new Date(note.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                    {isAddingNote ? (
                      <div className={styles.noteForm}>
                        <textarea
                          className={styles.noteTextarea}
                          placeholder="Ajouter une note..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          autoFocus
                        />
                        <div className={styles.noteFormActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsAddingNote(false);
                              setNewNoteText('');
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Send size={14} />}
                            onClick={() => handleSaveNote(selectedClient.id)}
                            disabled={!newNoteText.trim()}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.addNoteBtn}
                        onClick={() => setIsAddingNote(true)}
                      >
                        <Plus size={14} />
                        Ajouter une note
                      </button>
                    )}
                  </div>
                </div>

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
