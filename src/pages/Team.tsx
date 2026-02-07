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
  MoreVertical,
  Calendar,
  Briefcase,
  Clock,
  UserCheck,
  UserX,
  UserCog,
  Edit2,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Table, Pagination } from '../components/ui/Table';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import { Avatar } from '../components/ui/Avatar';
import {
  useTeamMembers,
  useTeamMember,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useActivateTeamMember,
  useDeactivateTeamMember,
  useUpdateTeamMemberRole,
} from '../hooks/useTeam';
import { useTeamStore } from '../stores/teamStore';
import { useNotifications } from '../stores/uiStore';
import { DEMO_STUDIO_ID } from '../stores/authStore';
import type { TeamMember, TeamRole, TeamMemberInsert, TeamMemberUpdate } from '../types/database';
import { TeamMemberFormModal } from './team/TeamMemberFormModal';
import type { TeamMemberFormData } from './team/TeamMemberFormModal';
import { TeamRoleChangeModal } from './team/TeamRoleChangeModal';
import { TeamDeleteConfirmModal } from './team/TeamDeleteConfirmModal';
import { TeamMemberDetailSidebar } from './team/TeamMemberDetailSidebar';
import { getRoleBadge, getRoleLabel, formatDate } from './team/teamUtils';
import styles from './Team.module.css';

const roleOptions = [
  { value: 'all', label: 'Tous les roles' },
  { value: 'owner', label: 'Proprietaire' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Lecteur' },
];

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

const defaultPermissions = {
  can_manage_bookings: true,
  can_view_clients: true,
  can_manage_clients: false,
  can_view_invoices: false,
  can_manage_invoices: false,
  can_view_equipment: true,
  can_manage_equipment: false,
  can_view_reports: false,
  can_manage_settings: false,
};

export function Team() {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<TeamMemberFormData | null>(null);

  // Zustand store (reserved for future use)
  void useTeamStore;

  // Hooks
  const { success: showSuccess, error: showError } = useNotifications();

  // Queries
  const { data: teamMembers = [], isLoading, error: queryError } = useTeamMembers({
    studioId: DEMO_STUDIO_ID,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  const { data: selectedMember } = useTeamMember(selectedMemberId || '');

  // Mutations
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();
  const activateMutation = useActivateTeamMember();
  const deactivateMutation = useDeactivateTeamMember();
  const updateRoleMutation = useUpdateTeamMemberRole();

  // Filtered and paginated members
  const filteredMembers = useMemo(() => {
    let result = teamMembers;

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query) ||
          member.job_title?.toLowerCase().includes(query) ||
          member.phone?.includes(query)
      );
    }

    return result;
  }, [teamMembers, debouncedSearch]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  // Stats computation
  const stats = useMemo(() => {
    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.is_active).length;
    const inactive = teamMembers.filter((m) => !m.is_active).length;
    const admins = teamMembers.filter((m) => m.role === 'admin' || m.role === 'owner').length;

    return [
      { label: 'Membres actifs', value: active.toString(), icon: UserCheck, color: 'var(--accent-green)' },
      { label: 'Inactifs', value: inactive.toString(), icon: UserX, color: 'var(--accent-orange)' },
      { label: 'Administrateurs', value: admins.toString(), icon: UserCog, color: 'var(--accent-blue)' },
      { label: 'Total equipe', value: total.toString(), icon: Users, color: 'var(--accent-purple)' },
    ];
  }, [teamMembers]);

  // Filter counts by role
  const filterCounts = useMemo(() => {
    return {
      all: teamMembers.length,
      owner: teamMembers.filter((m) => m.role === 'owner').length,
      admin: teamMembers.filter((m) => m.role === 'admin').length,
      manager: teamMembers.filter((m) => m.role === 'manager').length,
      staff: teamMembers.filter((m) => m.role === 'staff').length,
      viewer: teamMembers.filter((m) => m.role === 'viewer').length,
      active: teamMembers.filter((m) => m.is_active).length,
      inactive: teamMembers.filter((m) => !m.is_active).length,
    };
  }, [teamMembers]);

  // Handlers
  const handleCreateMember = useCallback(async (formData: TeamMemberFormData) => {
    const memberData: Omit<TeamMemberInsert, 'id' | 'created_at' | 'updated_at'> = {
      studio_id: DEMO_STUDIO_ID,
      user_id: crypto.randomUUID(), // In production, this would be the actual user ID from auth
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      job_title: formData.job_title || null,
      role: formData.role,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      is_active: formData.is_active,
      permissions: defaultPermissions,
    };

    try {
      await createMutation.mutateAsync(memberData);
      showSuccess('Membre ajoute', 'Le membre a ete ajoute avec succes');
      setIsCreateModalOpen(false);
    } catch {
      showError('Erreur', "Impossible d'ajouter le membre");
    }
  }, [createMutation, showSuccess, showError]);

  const handleUpdateMember = useCallback(async (formData: TeamMemberFormData) => {
    if (!selectedMemberId) return;

    const updateData: TeamMemberUpdate = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      job_title: formData.job_title || null,
      role: formData.role,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      is_active: formData.is_active,
    };

    try {
      await updateMutation.mutateAsync({ id: selectedMemberId, data: updateData });
      showSuccess('Membre modifie', 'Le membre a ete modifie avec succes');
      setIsEditModalOpen(false);
      setSelectedMemberId(null);
    } catch {
      showError('Erreur', 'Impossible de modifier le membre');
    }
  }, [selectedMemberId, updateMutation, showSuccess, showError]);

  const handleDeleteMember = useCallback(async () => {
    if (!selectedMemberId) return;

    try {
      await deleteMutation.mutateAsync(selectedMemberId);
      showSuccess('Membre supprime', 'Le membre a ete supprime avec succes');
      setIsDeleteConfirmOpen(false);
      setIsDetailSidebarOpen(false);
      setSelectedMemberId(null);
    } catch {
      showError('Erreur', 'Impossible de supprimer le membre');
    }
  }, [selectedMemberId, deleteMutation, showSuccess, showError]);

  const handleToggleActive = useCallback(async (member: TeamMember) => {
    try {
      if (member.is_active) {
        await deactivateMutation.mutateAsync(member.id);
        showSuccess('Membre desactive', `${member.name} a ete desactive`);
      } else {
        await activateMutation.mutateAsync(member.id);
        showSuccess('Membre active', `${member.name} a ete active`);
      }
    } catch {
      showError('Erreur', 'Impossible de modifier le statut du membre');
    }
  }, [activateMutation, deactivateMutation, showSuccess, showError]);

  const handleChangeRole = useCallback(async (role: TeamRole) => {
    if (!selectedMemberId) return;

    try {
      await updateRoleMutation.mutateAsync({ id: selectedMemberId, role });
      showSuccess('Role modifie', 'Le role a ete modifie avec succes');
      setIsRoleChangeModalOpen(false);
    } catch {
      showError('Erreur', 'Impossible de modifier le role');
    }
  }, [selectedMemberId, updateRoleMutation, showSuccess, showError]);

  const openEditModal = useCallback((member: TeamMember) => {
    setSelectedMemberId(member.id);
    setEditFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      job_title: member.job_title || '',
      role: member.role,
      hourly_rate: member.hourly_rate?.toString() || '',
      is_active: member.is_active,
    });
    setIsEditModalOpen(true);
  }, []);

  const openDetailSidebar = useCallback((member: TeamMember) => {
    setSelectedMemberId(member.id);
    setIsDetailSidebarOpen(true);
  }, []);

  const openRoleChangeModal = useCallback((member: TeamMember) => {
    setSelectedMemberId(member.id);
    setIsRoleChangeModalOpen(true);
  }, []);

  // Table columns for list view
  const tableColumns = [
    {
      key: 'name',
      header: 'Membre',
      render: (member: TeamMember) => (
        <div className={styles.memberTableCell}>
          <Avatar
            size="sm"
            name={member.name}
            src={member.avatar_url || undefined}
            status={member.is_active ? 'online' : 'offline'}
            showStatus
          />
          <div>
            <div className={styles.memberTableName}>{member.name}</div>
            <div className={styles.memberTableEmail}>{member.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'job_title',
      header: 'Poste',
      render: (member: TeamMember) => member.job_title || '-',
    },
    {
      key: 'role',
      header: 'Role',
      render: (member: TeamMember) => getRoleBadge(member.role),
    },
    {
      key: 'phone',
      header: 'Telephone',
      render: (member: TeamMember) => member.phone || '-',
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (member: TeamMember) => (
        member.is_active ? (
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
      render: (member: TeamMember) => (
        <Dropdown
          trigger={
            <button className={styles.memberMenu} aria-label="Plus d'options">
              <MoreVertical size={16} />
            </button>
          }
          align="end"
        >
          <DropdownItem icon={<Eye size={16} />} onClick={() => openDetailSidebar(member)}>
            Voir details
          </DropdownItem>
          <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(member)}>
            Modifier
          </DropdownItem>
          <DropdownItem icon={<Shield size={16} />} onClick={() => openRoleChangeModal(member)}>
            Changer le role
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={member.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            onClick={() => handleToggleActive(member)}
          >
            {member.is_active ? 'Desactiver' : 'Activer'}
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={<Trash2 size={16} />}
            destructive
            onClick={() => {
              setSelectedMemberId(member.id);
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
      <Header
        title="Equipe"
        subtitle="Gerez votre equipe et les collaborateurs"
      />

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
              placeholder="Rechercher un membre..."
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
              Nouveau membre
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
                  label="Role"
                  options={roleOptions}
                  value={roleFilter}
                  onChange={(value) => {
                    setRoleFilter(value as TeamRole | 'all');
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
                    setRoleFilter('all');
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

        {/* Quick Filters */}
        <div className={styles.filters}>
          {[
            { id: 'all', name: 'Tous', count: filterCounts.all },
            { id: 'owner', name: 'Proprietaires', count: filterCounts.owner },
            { id: 'admin', name: 'Admins', count: filterCounts.admin },
            { id: 'manager', name: 'Managers', count: filterCounts.manager },
            { id: 'staff', name: 'Staff', count: filterCounts.staff },
            { id: 'viewer', name: 'Lecteurs', count: filterCounts.viewer },
          ].map((filter) => (
            <button
              key={filter.id}
              className={`${styles.filterBtn} ${roleFilter === filter.id ? styles.active : ''}`}
              onClick={() => {
                setRoleFilter(filter.id as TeamRole | 'all');
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
            <span>Chargement des membres...</span>
          </div>
        )}

        {/* Error State */}
        {queryError && (
          <div className={styles.errorState}>
            <span>Erreur lors du chargement des membres</span>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Reessayer
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !queryError && filteredMembers.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>Aucun membre trouve</h3>
            <p>
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter votre premier membre'}
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Ajouter un membre
            </Button>
          </div>
        )}

        {/* Team Grid/List */}
        {!isLoading && !queryError && filteredMembers.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className={styles.teamGrid}>
                {paginatedMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card padding="none" hoverable className={styles.memberCard}>
                      <div className={styles.memberHeader}>
                        <Avatar
                          size="lg"
                          name={member.name}
                          src={member.avatar_url || undefined}
                          status={member.is_active ? 'online' : 'offline'}
                          showStatus
                        />
                        <Dropdown
                          trigger={
                            <button className={styles.memberMenu}>
                              <MoreVertical size={16} />
                            </button>
                          }
                          align="end"
                        >
                          <DropdownItem icon={<Eye size={16} />} onClick={() => openDetailSidebar(member)}>
                            Voir details
                          </DropdownItem>
                          <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(member)}>
                            Modifier
                          </DropdownItem>
                          <DropdownItem icon={<Shield size={16} />} onClick={() => openRoleChangeModal(member)}>
                            Changer le role
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={member.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            onClick={() => handleToggleActive(member)}
                          >
                            {member.is_active ? 'Desactiver' : 'Activer'}
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={<Trash2 size={16} />}
                            destructive
                            onClick={() => {
                              setSelectedMemberId(member.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                          >
                            Supprimer
                          </DropdownItem>
                        </Dropdown>
                      </div>

                      <div className={styles.memberContent} onClick={() => openDetailSidebar(member)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetailSidebar(member); } }} role="button" tabIndex={0}>
                        <div className={styles.memberInfo}>
                          <h4 className={styles.memberName}>{member.name}</h4>
                          <p className={styles.memberRole}>{member.job_title || getRoleLabel(member.role)}</p>
                          <div className={styles.memberBadges}>
                            {getRoleBadge(member.role)}
                            {!member.is_active && <Badge variant="error" size="sm" dot>Inactif</Badge>}
                          </div>
                        </div>

                        <div className={styles.memberContact}>
                          <div className={styles.contactItem}>
                            <Mail size={14} />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className={styles.contactItem}>
                              <Phone size={14} />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.job_title && (
                            <div className={styles.contactItem}>
                              <Briefcase size={14} />
                              <span>{member.job_title}</span>
                            </div>
                          )}
                        </div>

                        <div className={styles.memberMeta}>
                          <div className={styles.metaItem}>
                            <Calendar size={14} />
                            <span>Depuis {formatDate(member.created_at)}</span>
                          </div>
                          <div className={styles.metaItem}>
                            <Clock size={14} />
                            <span>{member.is_active ? 'Actif' : 'Inactif'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.memberFooter}>
                        <Button variant="ghost" size="sm" onClick={() => openDetailSidebar(member)}>
                          Voir profil
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(member)}>
                          Modifier
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Table
                data={paginatedMembers}
                columns={tableColumns}
                onRowClick={openDetailSidebar}
                isLoading={isLoading}
                emptyMessage="Aucun membre trouve"
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

      {/* Create Member Modal */}
      <TeamMemberFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMember}
        isSubmitting={createMutation.isPending}
      />

      {/* Edit Member Modal */}
      <TeamMemberFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMemberId(null);
        }}
        onSubmit={handleUpdateMember}
        initialData={editFormData}
        isSubmitting={updateMutation.isPending}
        title="Modifier le membre"
        subtitle={selectedMember?.name}
        submitLabel="Enregistrer"
      />

      {/* Role Change Modal */}
      <TeamRoleChangeModal
        isOpen={isRoleChangeModalOpen}
        onClose={() => setIsRoleChangeModalOpen(false)}
        onSubmit={handleChangeRole}
        memberName={selectedMember?.name}
        currentRole={selectedMember?.role || 'staff'}
        isSubmitting={updateRoleMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <TeamDeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteMember}
        isDeleting={deleteMutation.isPending}
      />

      {/* Member Detail Sidebar */}
      <AnimatePresence>
        {isDetailSidebarOpen && selectedMember && (
          <TeamMemberDetailSidebar
            member={selectedMember}
            onClose={() => setIsDetailSidebarOpen(false)}
            onEdit={openEditModal}
            onChangeRole={openRoleChangeModal}
            onDelete={() => setIsDeleteConfirmOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
