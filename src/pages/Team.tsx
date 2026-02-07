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
  MoreVertical,
  Calendar,
  Briefcase,
  Clock,
  UserCheck,
  UserX,
  UserCog,
  X,
  Edit2,
  Trash2,
  Eye,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle,
  XCircle,
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
import styles from './Team.module.css';

interface TeamMemberFormData {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  role: TeamRole;
  hourly_rate: string;
  is_active: boolean;
}

const defaultFormData: TeamMemberFormData = {
  name: '',
  email: '',
  phone: '',
  job_title: '',
  role: 'staff',
  hourly_rate: '',
  is_active: true,
};

const roleOptions = [
  { value: 'all', label: 'Tous les roles' },
  { value: 'owner', label: 'Proprietaire' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Lecteur' },
];

const roleOptionsForForm = roleOptions.filter((o) => o.value !== 'all');

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

  // Form state
  const [formData, setFormData] = useState<TeamMemberFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TeamMemberFormData, string>>>({});
  const [newRole, setNewRole] = useState<TeamRole>('staff');

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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query) ||
          member.job_title?.toLowerCase().includes(query) ||
          member.phone?.includes(query)
      );
    }

    return result;
  }, [teamMembers, searchQuery]);

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
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof TeamMemberFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleCreateMember = useCallback(async () => {
    if (!validateForm()) return;

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
      setFormData(defaultFormData);
    } catch {
      showError('Erreur', "Impossible d'ajouter le membre");
    }
  }, [formData, validateForm, createMutation, showSuccess, showError]);

  const handleUpdateMember = useCallback(async () => {
    if (!selectedMemberId || !validateForm()) return;

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
  }, [selectedMemberId, formData, validateForm, updateMutation, showSuccess, showError]);

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

  const handleChangeRole = useCallback(async () => {
    if (!selectedMemberId) return;

    try {
      await updateRoleMutation.mutateAsync({ id: selectedMemberId, role: newRole });
      showSuccess('Role modifie', 'Le role a ete modifie avec succes');
      setIsRoleChangeModalOpen(false);
    } catch {
      showError('Erreur', 'Impossible de modifier le role');
    }
  }, [selectedMemberId, newRole, updateRoleMutation, showSuccess, showError]);

  const openEditModal = useCallback((member: TeamMember) => {
    setSelectedMemberId(member.id);
    setFormData({
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
    setNewRole(member.role);
    setIsRoleChangeModalOpen(true);
  }, []);

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return <Badge variant="warning" size="sm"><ShieldAlert size={12} className={styles.badgeIcon} />Proprietaire</Badge>;
      case 'admin':
        return <Badge variant="error" size="sm"><ShieldCheck size={12} className={styles.badgeIcon} />Admin</Badge>;
      case 'manager':
        return <Badge variant="info" size="sm"><Shield size={12} className={styles.badgeIcon} />Manager</Badge>;
      case 'staff':
        return <Badge variant="success" size="sm">Staff</Badge>;
      case 'viewer':
      default:
        return <Badge variant="default" size="sm">Lecteur</Badge>;
    }
  };

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case 'owner': return 'Proprietaire';
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'staff': return 'Staff';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
        label="Email *"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={formErrors.email}
        icon={<Mail size={16} />}
        fullWidth
      />
      <Input
        label="Telephone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        icon={<Phone size={16} />}
        fullWidth
      />
      <Input
        label="Poste"
        value={formData.job_title}
        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
        icon={<Briefcase size={16} />}
        fullWidth
      />
      <Select
        label="Role"
        options={roleOptionsForForm}
        value={formData.role}
        onChange={(value) => setFormData({ ...formData, role: value as TeamRole })}
        fullWidth
      />
      <Input
        label="Taux horaire (EUR)"
        type="number"
        value={formData.hourly_rate}
        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
        fullWidth
      />
      <div className={styles.formFullWidth}>
        <Switch
          label="Membre actif"
          description="Les membres inactifs ne peuvent pas se connecter"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
      </div>
    </div>
  );

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
              onClick={() => {
                setFormData(defaultFormData);
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
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
              onClick={() => {
                setFormData(defaultFormData);
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
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

                      <div className={styles.memberContent} onClick={() => openDetailSidebar(member)}>
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="lg">
        <ModalHeader title="Inviter un membre" subtitle="Ajoutez un nouveau membre a votre equipe" onClose={() => setIsCreateModalOpen(false)} />
        <ModalBody>{renderFormFields()}</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateMember}
            loading={createMutation.isPending}
          >
            Inviter
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="lg">
        <ModalHeader
          title="Modifier le membre"
          subtitle={selectedMember?.name}
          onClose={() => setIsEditModalOpen(false)}
        />
        <ModalBody>{renderFormFields()}</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateMember}
            loading={updateMutation.isPending}
          >
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Role Change Modal */}
      <Modal isOpen={isRoleChangeModalOpen} onClose={() => setIsRoleChangeModalOpen(false)} size="sm">
        <ModalHeader title="Changer le role" onClose={() => setIsRoleChangeModalOpen(false)} />
        <ModalBody>
          <p className={styles.roleChangeInfo}>
            Selectionnez le nouveau role pour {selectedMember?.name}
          </p>
          <Select
            label="Nouveau role"
            options={roleOptionsForForm}
            value={newRole}
            onChange={(value) => setNewRole(value as TeamRole)}
            fullWidth
          />
          <div className={styles.rolePermissions}>
            <h4>Permissions du role</h4>
            {newRole === 'owner' && (
              <p>Acces complet a toutes les fonctionnalites et parametres.</p>
            )}
            {newRole === 'admin' && (
              <p>Peut gerer l'equipe, les clients, les reservations et les parametres.</p>
            )}
            {newRole === 'manager' && (
              <p>Peut gerer les reservations, les clients et consulter les rapports.</p>
            )}
            {newRole === 'staff' && (
              <p>Peut consulter et gerer les reservations qui lui sont assignees.</p>
            )}
            {newRole === 'viewer' && (
              <p>Peut uniquement consulter les informations sans modification.</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsRoleChangeModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleChangeRole}
            loading={updateRoleMutation.isPending}
          >
            Changer le role
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} size="sm">
        <ModalHeader title="Supprimer le membre" onClose={() => setIsDeleteConfirmOpen(false)} />
        <ModalBody>
          <p>Etes-vous sur de vouloir supprimer ce membre ? Cette action est irreversible.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteMember}
            loading={deleteMutation.isPending}
            className={styles.deleteBtn}
          >
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Member Detail Sidebar */}
      <AnimatePresence>
        {isDetailSidebarOpen && selectedMember && (
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
                  <h2>Profil du membre</h2>
                  <button onClick={() => setIsDetailSidebarOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.sidebarContent}>
                <div className={styles.memberProfile}>
                  <Avatar
                    size="2xl"
                    name={selectedMember.name}
                    src={selectedMember.avatar_url || undefined}
                    status={selectedMember.is_active ? 'online' : 'offline'}
                    showStatus
                  />
                  <h3>{selectedMember.name}</h3>
                  <p>{selectedMember.job_title || getRoleLabel(selectedMember.role)}</p>
                  <div className={styles.profileBadges}>
                    {getRoleBadge(selectedMember.role)}
                    {selectedMember.is_active ? (
                      <Badge variant="success" size="sm" dot>Actif</Badge>
                    ) : (
                      <Badge variant="error" size="sm" dot>Inactif</Badge>
                    )}
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <h4>Informations de contact</h4>
                  <div className={styles.contactList}>
                    <div className={styles.contactRow}>
                      <Mail size={16} />
                      <a href={`mailto:${selectedMember.email}`}>{selectedMember.email}</a>
                    </div>
                    {selectedMember.phone && (
                      <div className={styles.contactRow}>
                        <Phone size={16} />
                        <a href={`tel:${selectedMember.phone}`}>{selectedMember.phone}</a>
                      </div>
                    )}
                    {selectedMember.job_title && (
                      <div className={styles.contactRow}>
                        <Briefcase size={16} />
                        <span>{selectedMember.job_title}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <h4>Permissions</h4>
                  <div className={styles.permissionsList}>
                    {selectedMember.role === 'owner' || selectedMember.role === 'admin' ? (
                      <div className={styles.permissionItem}>
                        <ShieldCheck size={16} />
                        <span>Acces complet (administrateur)</span>
                      </div>
                    ) : (
                      <>
                        {(selectedMember.permissions as Record<string, boolean>)?.can_manage_bookings && (
                          <div className={styles.permissionItem}>
                            <CheckCircle size={16} />
                            <span>Gestion des reservations</span>
                          </div>
                        )}
                        {(selectedMember.permissions as Record<string, boolean>)?.can_view_clients && (
                          <div className={styles.permissionItem}>
                            <CheckCircle size={16} />
                            <span>Consultation des clients</span>
                          </div>
                        )}
                        {(selectedMember.permissions as Record<string, boolean>)?.can_manage_clients && (
                          <div className={styles.permissionItem}>
                            <CheckCircle size={16} />
                            <span>Gestion des clients</span>
                          </div>
                        )}
                        {(selectedMember.permissions as Record<string, boolean>)?.can_view_equipment && (
                          <div className={styles.permissionItem}>
                            <CheckCircle size={16} />
                            <span>Consultation de l'equipement</span>
                          </div>
                        )}
                        {(selectedMember.permissions as Record<string, boolean>)?.can_view_reports && (
                          <div className={styles.permissionItem}>
                            <CheckCircle size={16} />
                            <span>Consultation des rapports</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <h4>Historique d'activite</h4>
                  <div className={styles.activityPlaceholder}>
                    <Activity size={24} />
                    <p>L'historique d'activite sera bientot disponible</p>
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <h4>Informations</h4>
                  <div className={styles.metaList}>
                    <div className={styles.metaRow}>
                      <span>Membre depuis</span>
                      <span>{formatDate(selectedMember.created_at)}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Derniere modification</span>
                      <span>{formatDate(selectedMember.updated_at)}</span>
                    </div>
                    {selectedMember.hourly_rate && (
                      <div className={styles.metaRow}>
                        <span>Taux horaire</span>
                        <span>{selectedMember.hourly_rate} EUR/h</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.sidebarFooter}>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Edit2 size={16} />}
                  onClick={() => {
                    openEditModal(selectedMember);
                    setIsDetailSidebarOpen(false);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Shield size={16} />}
                  onClick={() => {
                    openRoleChangeModal(selectedMember);
                    setIsDetailSidebarOpen(false);
                  }}
                >
                  Changer le role
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
