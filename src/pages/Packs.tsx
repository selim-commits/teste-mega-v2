import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Package,
  RefreshCw,
  Gift,
  Users,
  BarChart3,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import {
  PackStats,
  PackList,
  PackFormModal,
  ClientSubscriptions,
  GiftCertificateForm,
  PackAnalytics,
} from '../components/packs';
import {
  usePacks,
  usePackStats,
  useCreatePack,
  useUpdatePack,
  useDeletePack,
  useTogglePackActive,
  useTogglePackFeatured,
  useClientPurchases,
  useCreatePurchase,
  usePauseSubscription,
  useResumeSubscription,
  useUpdatePurchaseStatus,
} from '../hooks/usePacks';
import { useSpaces } from '../hooks/useSpaces';
import { usePacksStore } from '../stores/packsStore';
import { useShallow } from 'zustand/react/shallow';
import { useNotifications } from '../stores/uiStore';
import type { Pack, PackInsert, PackUpdate, PricingProductType, ClientPurchase } from '../types/database';
import styles from './Packs.module.css';

// Studio ID for Rooom OS
const STUDIO_ID = '11111111-1111-1111-1111-111111111111';

type TabType = 'packs' | 'subscriptions' | 'certificates' | 'clients' | 'analytics';

const tabConfig: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'packs', label: 'Packs', icon: Package },
  { id: 'subscriptions', label: 'Abonnements', icon: RefreshCw },
  { id: 'certificates', label: 'Certificats', icon: Gift },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'analytics', label: 'Analytiques', icon: BarChart3 },
];

const typeOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'pack', label: 'Packs' },
  { value: 'subscription', label: 'Abonnements' },
  { value: 'gift_certificate', label: 'Certificats' },
];

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: true, label: 'Actifs' },
  { value: false, label: 'Inactifs' },
];

export function Packs() {
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('packs');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  // Store - only use for filters (UI state), not for data
  const {
    packFilters,
    setPackFilters,
    resetPackFilters,
  } = usePacksStore(
    useShallow((state) => ({
      packFilters: state.packFilters,
      setPackFilters: state.setPackFilters,
      resetPackFilters: state.resetPackFilters,
    }))
  );

  // Notifications
  const { success: showSuccess, error: showError } = useNotifications();

  // Queries
  const { data: packsData = [], isLoading: isLoadingPacks, refetch: refetchPacks } = usePacks({
    studioId: STUDIO_ID,
  });
  const { data: statsData } = usePackStats(STUDIO_ID);
  const { data: purchasesData = [], isLoading: isLoadingPurchases, refetch: refetchPurchases } = useClientPurchases({
    studioId: STUDIO_ID,
  });
  const { data: spacesData = [] } = useSpaces({ studioId: STUDIO_ID });

  // Mutations
  const createMutation = useCreatePack();
  const updateMutation = useUpdatePack();
  const deleteMutation = useDeletePack();
  const toggleActiveMutation = useTogglePackActive();
  const toggleFeaturedMutation = useTogglePackFeatured();
  const createPurchaseMutation = useCreatePurchase();
  const pauseSubscriptionMutation = usePauseSubscription();
  const resumeSubscriptionMutation = useResumeSubscription();
  const updateStatusMutation = useUpdatePurchaseStatus();

  // Filter packs based on search, type, and active status
  const filteredPacks = useMemo(() => {
    const hasSearchFilter = packFilters.searchQuery !== '';
    const hasTypeFilter = packFilters.type !== 'all';
    const hasActiveFilter = packFilters.isActive !== 'all';

    if (!hasSearchFilter && !hasTypeFilter && !hasActiveFilter) {
      return packsData;
    }

    return packsData.filter((pack) => {
      if (hasSearchFilter) {
        const query = packFilters.searchQuery.toLowerCase();
        if (!pack.name.toLowerCase().includes(query) &&
            !(pack.description && pack.description.toLowerCase().includes(query))) {
          return false;
        }
      }
      if (hasTypeFilter && pack.type !== packFilters.type) {
        return false;
      }
      if (hasActiveFilter && pack.is_active !== packFilters.isActive) {
        return false;
      }
      return true;
    });
  }, [packsData, packFilters]);

  // Filtered packs based on active tab
  const displayedPacks = useMemo(() => {
    let result = filteredPacks;

    // Filter by tab type
    if (activeTab === 'packs') {
      result = result.filter((p) => p.type === 'pack');
    } else if (activeTab === 'subscriptions') {
      result = result.filter((p) => p.type === 'subscription');
    } else if (activeTab === 'certificates') {
      result = result.filter((p) => p.type === 'gift_certificate');
    }

    return result;
  }, [filteredPacks, activeTab]);

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPackFilters({ searchQuery: e.target.value });
  }, [setPackFilters]);

  const handleTypeFilter = useCallback((value: string) => {
    setPackFilters({ type: value as PricingProductType | 'all' });
  }, [setPackFilters]);

  const handleStatusFilter = useCallback((value: string) => {
    const isActive = value === 'all' ? 'all' : value === 'true';
    setPackFilters({ isActive });
  }, [setPackFilters]);

  const handleCreatePack = useCallback(async (data: PackInsert | PackUpdate) => {
    try {
      await createMutation.mutateAsync(data as PackInsert);
      showSuccess('Pack cree', 'Le pack a ete cree avec succes');
      setIsCreateModalOpen(false);
      refetchPacks();
    } catch (error) {
      showError('Erreur', 'Impossible de creer le pack');
    }
  }, [createMutation, showSuccess, showError, refetchPacks]);

  const handleUpdatePack = useCallback(async (data: PackInsert | PackUpdate) => {
    if (!selectedPack) return;

    try {
      await updateMutation.mutateAsync({ id: selectedPack.id, data: data as PackUpdate });
      showSuccess('Pack modifie', 'Le pack a ete modifie avec succes');
      setIsEditModalOpen(false);
      setSelectedPack(null);
      refetchPacks();
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le pack');
    }
  }, [selectedPack, updateMutation, showSuccess, showError, refetchPacks]);

  const handleDeletePack = useCallback(async () => {
    if (!selectedPack) return;

    try {
      await deleteMutation.mutateAsync(selectedPack.id);
      showSuccess('Pack supprime', 'Le pack a ete supprime avec succes');
      setIsDeleteModalOpen(false);
      setSelectedPack(null);
      refetchPacks();
    } catch (error) {
      showError('Erreur', 'Impossible de supprimer le pack');
    }
  }, [selectedPack, deleteMutation, showSuccess, showError, refetchPacks]);

  const handleToggleActive = useCallback(async (pack: Pack) => {
    try {
      await toggleActiveMutation.mutateAsync({ id: pack.id, isActive: !pack.is_active });
      showSuccess(
        pack.is_active ? 'Pack desactive' : 'Pack active',
        `${pack.name} a ete ${pack.is_active ? 'desactive' : 'active'}`
      );
      refetchPacks();
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le statut du pack');
    }
  }, [toggleActiveMutation, showSuccess, showError, refetchPacks]);

  const handleToggleFeatured = useCallback(async (pack: Pack) => {
    try {
      await toggleFeaturedMutation.mutateAsync({ id: pack.id, isFeatured: !pack.is_featured });
      showSuccess(
        pack.is_featured ? 'Retire des favoris' : 'Mis en avant',
        `${pack.name} ${pack.is_featured ? 'a ete retire des favoris' : 'est maintenant mis en avant'}`
      );
      refetchPacks();
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le statut du pack');
    }
  }, [toggleFeaturedMutation, showSuccess, showError, refetchPacks]);

  const handleEditPack = useCallback((pack: Pack) => {
    setSelectedPack(pack);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((pack: Pack) => {
    setSelectedPack(pack);
    setIsDeleteModalOpen(true);
  }, []);

  const handlePauseSubscription = useCallback(async (purchase: ClientPurchase) => {
    try {
      await pauseSubscriptionMutation.mutateAsync({ id: purchase.id });
      showSuccess('Abonnement mis en pause', 'L\'abonnement a ete mis en pause');
      refetchPurchases();
    } catch (error) {
      showError('Erreur', 'Impossible de mettre en pause l\'abonnement');
    }
  }, [pauseSubscriptionMutation, showSuccess, showError, refetchPurchases]);

  const handleResumeSubscription = useCallback(async (purchase: ClientPurchase) => {
    try {
      await resumeSubscriptionMutation.mutateAsync(purchase.id);
      showSuccess('Abonnement reactive', 'L\'abonnement a ete reactive');
      refetchPurchases();
    } catch (error) {
      showError('Erreur', 'Impossible de reactiver l\'abonnement');
    }
  }, [resumeSubscriptionMutation, showSuccess, showError, refetchPurchases]);

  const handleCancelSubscription = useCallback(async (purchase: ClientPurchase) => {
    try {
      await updateStatusMutation.mutateAsync({ id: purchase.id, status: 'cancelled' });
      showSuccess('Abonnement annule', 'L\'abonnement a ete annule');
      refetchPurchases();
    } catch (error) {
      showError('Erreur', 'Impossible d\'annuler l\'abonnement');
    }
  }, [updateStatusMutation, showSuccess, showError, refetchPurchases]);

  const openCreateModal = useCallback(() => {
    setSelectedPack(null);
    setIsCreateModalOpen(true);
  }, []);

  return (
    <div className={styles.page}>
      <Header
        title="Packs & Abonnements"
        subtitle="Gerez vos offres et suivez vos ventes"
      />

      <div className={styles.content}>
        {/* Stats Overview */}
        <PackStats
          totalPacks={statsData?.activePacks || 0}
          totalSold={statsData?.totalSold || 0}
          monthlyRevenue={statsData?.monthlyRevenue || 0}
          activeSubscriptions={statsData?.activeSubscriptions || 0}
          currency="$"
        />

        {/* Tabs */}
        <div className={styles.tabs}>
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Toolbar for pack tabs */}
        {(activeTab === 'packs' || activeTab === 'subscriptions' || activeTab === 'certificates') && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Rechercher un pack..."
                  value={packFilters.searchQuery}
                  onChange={handleSearchChange}
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
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={openCreateModal}
                >
                  Nouveau
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
                      label="Type"
                      options={typeOptions}
                      value={packFilters.type}
                      onChange={handleTypeFilter}
                    />
                    <Select
                      label="Statut"
                      options={statusOptions.map(o => ({ value: String(o.value), label: o.label }))}
                      value={String(packFilters.isActive)}
                      onChange={handleStatusFilter}
                    />
                    <Button variant="ghost" size="sm" onClick={resetPackFilters}>
                      Reinitialiser
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pack List */}
            <PackList
              packs={displayedPacks}
              isLoading={isLoadingPacks}
              onEdit={handleEditPack}
              onDelete={handleDeleteClick}
              onToggleActive={handleToggleActive}
              onToggleFeatured={handleToggleFeatured}
              onCreateNew={openCreateModal}
              currency="$"
              emptyMessage={
                activeTab === 'packs'
                  ? 'Aucun pack trouve'
                  : activeTab === 'subscriptions'
                  ? 'Aucun abonnement trouve'
                  : 'Aucun certificat trouve'
              }
            />
          </>
        )}

        {/* Client Subscriptions Tab */}
        {activeTab === 'clients' && (
          <ClientSubscriptions
            purchases={purchasesData}
            isLoading={isLoadingPurchases}
            onPause={handlePauseSubscription}
            onResume={handleResumeSubscription}
            onCancel={handleCancelSubscription}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <PackAnalytics
            packs={packsData}
            purchases={purchasesData}
            currency="$"
          />
        )}
      </div>

      {/* Create Modal */}
      <PackFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePack}
        spaces={spacesData}
        isLoading={createMutation.isPending}
        studioId={STUDIO_ID}
      />

      {/* Edit Modal */}
      <PackFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPack(null);
        }}
        onSubmit={handleUpdatePack}
        pack={selectedPack}
        spaces={spacesData}
        isLoading={updateMutation.isPending}
        studioId={STUDIO_ID}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
        <ModalHeader title="Supprimer le pack" onClose={() => setIsDeleteModalOpen(false)} />
        <ModalBody>
          <p className={styles.deleteMessage}>
            Etes-vous sur de vouloir supprimer <strong>{selectedPack?.name}</strong> ?
            Cette action est irreversible.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleDeletePack}
            loading={deleteMutation.isPending}
            className={styles.deleteBtn}
          >
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Gift Certificate Modal */}
      <GiftCertificateForm
        isOpen={isGiftModalOpen}
        onClose={() => {
          setIsGiftModalOpen(false);
          setSelectedPack(null);
        }}
        onSubmit={async (data) => {
          await createPurchaseMutation.mutateAsync(data);
          setIsGiftModalOpen(false);
          setSelectedPack(null);
          refetchPurchases();
        }}
        pack={selectedPack}
        studioId={STUDIO_ID}
        clientId="" // Would need to be selected
        isLoading={createPurchaseMutation.isPending}
      />
    </div>
  );
}
