import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Users,
  UserPlus,
  Star,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Table';
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
import type { ClientNote } from './clients/types';
import { generateMockNotes } from './clients/types';

// Sub-components
import { ClientsHeader } from './clients/ClientsHeader';
import { ClientsGrid } from './clients/ClientsGrid';
import { ClientsTable } from './clients/ClientsTable';
import { ClientDetailSidebar } from './clients/ClientDetailSidebar';
import { ClientFormModal } from './clients/ClientFormModal';
import type { ClientFormData } from './clients/ClientFormModal';

import styles from './Clients.module.css';

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

  // Edit mode data
  const [editFormData, setEditFormData] = useState<ClientFormData | null>(null);

  // CRM Enhancement State
  const [clientCrmTags, setClientCrmTags] = useState<Record<string, string[]>>({});
  const [clientNotes, setClientNotes] = useState<Record<string, ClientNote[]>>({});

  // Hooks
  const { success: showSuccess, error: showError } = useNotifications();

  // Queries
  const { data: clients = [], isLoading, error: queryError } = useClients({
    studioId: DEMO_STUDIO_ID,
    tier: tierFilter !== 'all' ? tierFilter : undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  const { data: selectedClient } = useClient(selectedClientId || '');

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

  // Stats
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

  // ===== Handlers =====

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
      showSuccess('Client cree', 'Le client a ete cree avec succes');
      setIsCreateModalOpen(false);
    } catch {
      showError('Erreur', 'Impossible de creer le client');
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
      showSuccess('Client modifie', 'Le client a ete modifie avec succes');
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
      showSuccess('Client supprime', 'Le client a ete supprime avec succes');
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
        showSuccess('Client desactive', `${client.name} a ete desactive`);
      } else {
        await activateMutation.mutateAsync(client.id);
        showSuccess('Client active', `${client.name} a ete active`);
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

  const handleToggleCrmTag = useCallback((clientId: string, tagId: string) => {
    setClientCrmTags((prev) => {
      const current = prev[clientId] || [];
      const updated = current.includes(tagId)
        ? current.filter((t) => t !== tagId)
        : [...current, tagId];
      return { ...prev, [clientId]: updated };
    });
  }, []);

  const handleSaveNote = useCallback((clientId: string, text: string) => {
    const note: ClientNote = {
      id: `${clientId}-n-${Date.now()}`,
      text,
      date: new Date().toISOString(),
      author: 'Vous',
    };
    setClientNotes((prev) => {
      const current = prev[clientId] || generateMockNotes(clientId);
      return { ...prev, [clientId]: [note, ...current] };
    });
  }, []);

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

  const handleOpenDelete = useCallback((client: Client) => {
    setSelectedClientId(client.id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleResetFilters = useCallback(() => {
    setTierFilter('all');
    setStatusFilter('all');
    setTagFilter([]);
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  return (
    <div className={styles.page}>
      <Header title="Client 360" subtitle="Gerez vos relations clients" />

      <div className={styles.content}>
        <ClientsHeader
          stats={stats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showFilters}
          onShowFiltersChange={setShowFilters}
          tierFilter={tierFilter}
          onTierFilterChange={(value) => {
            setTierFilter(value);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          tagFilter={tagFilter}
          onToggleTagFilter={handleToggleTagFilter}
          filterCounts={filterCounts}
          onResetFilters={handleResetFilters}
          onOpenCreate={() => setIsCreateModalOpen(true)}
        />

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
              Reessayer
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !queryError && filteredClients.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>Aucun client trouve</h3>
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
              <ClientsGrid
                clients={paginatedClients}
                onOpenDetail={openDetailSidebar}
                onOpenEdit={openEditModal}
                onToggleActive={handleToggleActive}
                onOpenDelete={handleOpenDelete}
              />
            ) : (
              <ClientsTable
                clients={paginatedClients}
                isLoading={isLoading}
                onOpenDetail={openDetailSidebar}
                onOpenEdit={openEditModal}
                onToggleActive={handleToggleActive}
                onOpenDelete={handleOpenDelete}
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
          subtitle="Ajoutez un nouveau client a votre base"
          submitLabel="Creer le client"
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
          <p>Etes-vous sur de vouloir supprimer ce client ? Cette action est irreversible.</p>
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
      <ClientDetailSidebar
        isOpen={isDetailSidebarOpen}
        onClose={() => setIsDetailSidebarOpen(false)}
        client={selectedClient || null}
        clientBookings={clientBookings}
        clientStats={clientStats}
        clientCrmTags={clientCrmTags}
        onToggleCrmTag={handleToggleCrmTag}
        clientNotes={clientNotes}
        onSaveNote={handleSaveNote}
        onOpenEdit={openEditModal}
        onOpenDelete={() => setIsDeleteConfirmOpen(true)}
      />
    </div>
  );
}
