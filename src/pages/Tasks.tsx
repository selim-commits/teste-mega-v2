import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  ClipboardList,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  GripVertical,
  MapPin,
  Sparkles,
  Wrench,
  Trash2,
  Edit2,
  Eye,
  Link2,
  User,
  X,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import { useNotifications } from '../stores/uiStore';
import styles from './Tasks.module.css';

// Types
type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'high' | 'medium' | 'low';
type TaskType = 'cleaning' | 'maintenance' | 'setup' | 'other';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignee: string;
  space: string;
  dueDate: string;
  recurring: boolean;
  bookingId?: string;
  createdAt: string;
}

interface LinkedBooking {
  id: string;
  title: string;
  clientName: string;
  startTime: string;
  endTime: string;
}

// Options
const statusFilterOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'todo', label: 'A faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Termine' },
];

const priorityFilterOptions = [
  { value: 'all', label: 'Toutes les priorites' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

const typeFilterOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'setup', label: 'Preparation' },
  { value: 'other', label: 'Autre' },
];

const typeOptions = [
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'setup', label: 'Preparation' },
  { value: 'other', label: 'Autre' },
];

const priorityOptions = [
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

const teamMembers = [
  'Sophie Martin',
  'Lucas Dupont',
  'Emma Bernard',
  'Hugo Leroy',
  'Lea Moreau',
];

const studioSpaces = [
  'Studio A - Cyclo',
  'Studio B - Daylight',
  'Studio C - Green Screen',
  'Salle de montage',
  'Espace commun',
];

const teamMemberOptions = teamMembers.map((name) => ({ value: name, label: name }));
const spaceOptions = studioSpaces.map((name) => ({ value: name, label: name }));

// Helper functions
function getTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    cleaning: 'Nettoyage',
    maintenance: 'Maintenance',
    setup: 'Preparation',
    other: 'Autre',
  };
  return labels[type];
}

function getTypeBadge(type: TaskType) {
  const variants: Record<TaskType, 'info' | 'warning' | 'success' | 'default'> = {
    cleaning: 'info',
    maintenance: 'warning',
    setup: 'success',
    other: 'default',
  };
  return <Badge variant={variants[type]} size="sm">{getTypeLabel(type)}</Badge>;
}

function getPriorityBadge(priority: TaskPriority) {
  const config: Record<TaskPriority, { variant: 'error' | 'orange' | 'info'; label: string }> = {
    high: { variant: 'error', label: 'Haute' },
    medium: { variant: 'orange', label: 'Moyenne' },
    low: { variant: 'info', label: 'Basse' },
  };
  const { variant, label } = config[priority];
  return <Badge variant={variant} size="sm" dot>{label}</Badge>;
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

// Mock data
const today = new Date();

// Mock bookings data for linking
const mockLinkedBookings: LinkedBooking[] = [
  {
    id: 'booking-1',
    title: 'Shooting Mode - Marie Dupont',
    clientName: 'Marie Dupont',
    startTime: new Date(today.getTime() + 7200000).toISOString(),
    endTime: new Date(today.getTime() + 18000000).toISOString(),
  },
  {
    id: 'booking-2',
    title: 'Portrait Corporate - Jean Martin',
    clientName: 'Jean Martin',
    startTime: new Date(today.getTime() + 21600000).toISOString(),
    endTime: new Date(today.getTime() + 28800000).toISOString(),
  },
  {
    id: 'booking-3',
    title: 'Tournage Promo - Pierre Leroy',
    clientName: 'Pierre Leroy',
    startTime: new Date(today.getTime() + 118800000).toISOString(),
    endTime: new Date(today.getTime() + 136800000).toISOString(),
  },
  {
    id: 'booking-4',
    title: 'Fashion Week Prep - Claire Moreau',
    clientName: 'Claire Moreau',
    startTime: new Date(today.getTime() + 140400000).toISOString(),
    endTime: new Date(today.getTime() + 158400000).toISOString(),
  },
];

const bookingOptions = [
  { value: '', label: 'Aucune reservation' },
  ...mockLinkedBookings.map((booking) => ({
    value: booking.id,
    label: `${booking.clientName} - ${new Date(booking.startTime).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })}`,
  })),
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Nettoyer le Studio A apres le shooting',
    description: 'Nettoyage complet du cyclorama et du sol',
    status: 'todo',
    priority: 'high',
    type: 'cleaning',
    assignee: 'Sophie Martin',
    space: 'Studio A - Cyclo',
    dueDate: today.toISOString().split('T')[0],
    recurring: false,
    bookingId: 'booking-1',
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Verification eclairage Studio B',
    description: 'Verifier les flashs et les softbox',
    status: 'todo',
    priority: 'medium',
    type: 'maintenance',
    assignee: 'Lucas Dupont',
    space: 'Studio B - Daylight',
    dueDate: today.toISOString().split('T')[0],
    recurring: false,
    createdAt: new Date(today.getTime() - 172800000).toISOString(),
  },
  {
    id: '3',
    title: 'Preparer le fond vert pour le tournage',
    description: 'Installer et tendre le fond vert, verifier les lumiere',
    status: 'todo',
    priority: 'high',
    type: 'setup',
    assignee: 'Emma Bernard',
    space: 'Studio C - Green Screen',
    dueDate: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
    recurring: false,
    bookingId: 'booking-3',
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: '4',
    title: 'Reparer la climatisation Studio A',
    description: 'Le thermostat ne repond plus correctement',
    status: 'in_progress',
    priority: 'high',
    type: 'maintenance',
    assignee: 'Hugo Leroy',
    space: 'Studio A - Cyclo',
    dueDate: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
    recurring: false,
    createdAt: new Date(today.getTime() - 259200000).toISOString(),
  },
  {
    id: '5',
    title: 'Nettoyage hebdomadaire espaces communs',
    description: 'Aspirateur, poussiere, sanitaires',
    status: 'in_progress',
    priority: 'medium',
    type: 'cleaning',
    assignee: 'Lea Moreau',
    space: 'Espace commun',
    dueDate: today.toISOString().split('T')[0],
    recurring: true,
    createdAt: new Date(today.getTime() - 172800000).toISOString(),
  },
  {
    id: '6',
    title: 'Installer le nouveau projecteur',
    description: 'Montage et calibration du projecteur 4K',
    status: 'in_progress',
    priority: 'low',
    type: 'setup',
    assignee: 'Lucas Dupont',
    space: 'Salle de montage',
    dueDate: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
    recurring: false,
    createdAt: new Date(today.getTime() - 345600000).toISOString(),
  },
  {
    id: '7',
    title: 'Mise a jour logiciel montage',
    description: 'Mettre a jour DaVinci Resolve sur tous les postes',
    status: 'done',
    priority: 'medium',
    type: 'maintenance',
    assignee: 'Hugo Leroy',
    space: 'Salle de montage',
    dueDate: new Date(today.getTime() - 172800000).toISOString().split('T')[0],
    recurring: false,
    createdAt: new Date(today.getTime() - 432000000).toISOString(),
  },
  {
    id: '8',
    title: 'Rangement equipement apres evenement',
    description: 'Ranger les trepied, eclairages et accessoires',
    status: 'done',
    priority: 'low',
    type: 'cleaning',
    assignee: 'Sophie Martin',
    space: 'Studio B - Daylight',
    dueDate: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
    recurring: false,
    createdAt: new Date(today.getTime() - 259200000).toISOString(),
  },
  {
    id: '9',
    title: 'Verification securite incendie',
    description: 'Controle des extincteurs et sorties de secours',
    status: 'done',
    priority: 'high',
    type: 'other',
    assignee: 'Emma Bernard',
    space: 'Espace commun',
    dueDate: new Date(today.getTime() - 259200000).toISOString().split('T')[0],
    recurring: true,
    createdAt: new Date(today.getTime() - 518400000).toISOString(),
  },
  {
    id: '10',
    title: 'Preparer le studio pour demain',
    description: 'Disposer les meubles et accessoires pour le shooting lifestyle',
    status: 'todo',
    priority: 'low',
    type: 'setup',
    assignee: 'Lea Moreau',
    space: 'Studio A - Cyclo',
    dueDate: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
    recurring: false,
    createdAt: today.toISOString(),
  },
];

// Initial form state
const initialFormState = {
  title: '',
  description: '',
  type: 'cleaning' as TaskType,
  priority: 'medium' as TaskPriority,
  assignee: teamMembers[0],
  space: studioSpaces[0],
  dueDate: today.toISOString().split('T')[0],
  recurring: false,
  bookingId: '',
};

export function Tasks() {
  // State
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  // Notifications
  const { success: showSuccess } = useNotifications();

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.assignee.toLowerCase().includes(query) ||
          task.space.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((task) => task.type === typeFilter);
    }

    if (bookingFilter !== 'all') {
      if (bookingFilter === 'linked') {
        result = result.filter((task) => task.bookingId);
      } else if (bookingFilter === 'unlinked') {
        result = result.filter((task) => !task.bookingId);
      } else {
        result = result.filter((task) => task.bookingId === bookingFilter);
      }
    }

    return result;
  }, [tasks, debouncedSearch, statusFilter, priorityFilter, typeFilter, bookingFilter]);

  // Kanban columns
  const todoTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'todo'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'in_progress'), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'done'), [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(today.getTime() - 7 * 86400000);

    const todayCount = tasks.filter(
      (t) => t.status !== 'done' && t.dueDate === todayStr
    ).length;
    const overdueCount = tasks.filter(
      (t) => t.status !== 'done' && isOverdue(t.dueDate)
    ).length;
    const completedThisWeek = tasks.filter(
      (t) => t.status === 'done' && new Date(t.createdAt) >= oneWeekAgo
    ).length;
    const activeTotal = tasks.filter((t) => t.status !== 'done').length;
    const linkedCount = tasks.filter((t) => t.bookingId).length;

    return { todayCount, overdueCount, completedThisWeek, activeTotal, linkedCount };
  }, [tasks]);

  // Handlers
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      const statusLabels: Record<TaskStatus, string> = {
        todo: 'A faire',
        in_progress: 'En cours',
        done: 'Termine',
      };
      showSuccess('Statut mis a jour', `Tache deplacee vers "${statusLabels[newStatus]}"`);
    },
    [showSuccess]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      showSuccess('Tache supprimee', 'La tache a ete supprimee avec succes');
    },
    [showSuccess]
  );

  const handleCreateTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title.trim()) return;

      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newTask: Task = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        status: 'todo',
        priority: formData.priority,
        type: formData.type,
        assignee: formData.assignee,
        space: formData.space,
        dueDate: formData.dueDate,
        recurring: formData.recurring,
        bookingId: formData.bookingId || undefined,
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);
      setFormData(initialFormState);
      setIsCreateModalOpen(false);
      setIsSubmitting(false);
      showSuccess('Tache creee', 'La nouvelle tache a ete ajoutee avec succes');
    },
    [formData, showSuccess]
  );

  const resetFilters = useCallback(() => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setBookingFilter('all');
    setSearchQuery('');
  }, []);

  const getLinkedBooking = useCallback((bookingId?: string): LinkedBooking | null => {
    if (!bookingId) return null;
    return mockLinkedBookings.find((b) => b.id === bookingId) || null;
  }, []);

  const formatBookingDate = useCallback((dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Render task card
  const renderTaskCard = (task: Task, index: number) => {
    const priorityClass =
      task.priority === 'high'
        ? styles.taskCardHigh
        : task.priority === 'medium'
        ? styles.taskCardMedium
        : styles.taskCardLow;

    const taskIsOverdue = task.status !== 'done' && isOverdue(task.dueDate);
    const linkedBooking = getLinkedBooking(task.bookingId);
    const isBookingExpanded = expandedBookingId === task.bookingId;

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <div className={`${styles.taskCard} ${priorityClass}`}>
          <div className={styles.taskCardHeader}>
            <div className={styles.dragHandle}>
              <GripVertical size={14} />
            </div>
            <h4 className={styles.taskTitle}>{task.title}</h4>
            <Dropdown
              trigger={
                <button className={styles.taskMenu} aria-label="Plus d'options">
                  <MoreVertical size={14} />
                </button>
              }
              align="end"
            >
              <DropdownItem icon={<Eye size={14} />} onClick={() => {}}>
                Voir details
              </DropdownItem>
              <DropdownItem icon={<Edit2 size={14} />} onClick={() => {}}>
                Modifier
              </DropdownItem>
              <DropdownDivider />
              {task.status !== 'todo' && (
                <DropdownItem
                  icon={<ClipboardList size={14} />}
                  onClick={() => handleStatusChange(task.id, 'todo')}
                >
                  Deplacer vers A faire
                </DropdownItem>
              )}
              {task.status !== 'in_progress' && (
                <DropdownItem
                  icon={<Clock size={14} />}
                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                >
                  Deplacer vers En cours
                </DropdownItem>
              )}
              {task.status !== 'done' && (
                <DropdownItem
                  icon={<CheckCircle2 size={14} />}
                  onClick={() => handleStatusChange(task.id, 'done')}
                >
                  Marquer comme termine
                </DropdownItem>
              )}
              <DropdownDivider />
              <DropdownItem
                icon={<Trash2 size={14} />}
                destructive
                onClick={() => handleDeleteTask(task.id)}
              >
                Supprimer
              </DropdownItem>
            </Dropdown>
          </div>

          <div className={styles.taskSpace}>
            <MapPin size={12} />
            <span>{task.space}</span>
          </div>

          <div className={styles.taskCardBadges}>
            {getPriorityBadge(task.priority)}
            {getTypeBadge(task.type)}
            {task.recurring && (
              <Badge variant="default" size="sm">Recurrent</Badge>
            )}
            {linkedBooking && (
              <Badge variant="info" size="sm">
                <Link2 size={12} style={{ marginRight: 'var(--space-1)' }} />
                Lie
              </Badge>
            )}
          </div>

          {linkedBooking && (
            <div className={styles.taskBookingLink}>
              <button
                className={styles.bookingLinkButton}
                onClick={() => setExpandedBookingId(isBookingExpanded ? null : task.bookingId!)}
              >
                <User size={12} />
                <span>{linkedBooking.clientName}</span>
                <span className={styles.bookingLinkDate}>
                  {formatDate(linkedBooking.startTime.split('T')[0])}
                </span>
              </button>
              <AnimatePresence>
                {isBookingExpanded && (
                  <motion.div
                    className={styles.bookingDetail}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.bookingDetailContent}>
                      <div className={styles.bookingDetailHeader}>
                        <span className={styles.bookingDetailTitle}>{linkedBooking.title}</span>
                        <button
                          className={styles.bookingDetailClose}
                          onClick={() => setExpandedBookingId(null)}
                          aria-label="Fermer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className={styles.bookingDetailInfo}>
                        <div className={styles.bookingDetailRow}>
                          <Clock size={12} />
                          <span>
                            {formatBookingDate(linkedBooking.startTime)} -{' '}
                            {new Date(linkedBooking.endTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className={styles.taskCardFooter}>
            <div className={styles.taskAssignee}>
              <Avatar size="xs" name={task.assignee} />
              <span className={styles.taskAssigneeName}>{task.assignee.split(' ')[0]}</span>
            </div>
            <div
              className={`${styles.taskDueDate} ${taskIsOverdue ? styles.taskDueDateOverdue : ''}`}
            >
              <Calendar size={12} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={styles.page}>
      <Header
        title="Taches"
        subtitle="Gerez les taches du studio : nettoyage, maintenance et preparation"
      />

      <div className={styles.content}>
        {/* Stats Overview */}
        <div className={styles.statsGrid}>
          {[
            {
              label: 'Taches du jour',
              value: stats.todayCount.toString(),
              icon: Calendar,
              color: 'var(--state-info)',
              bgColor: 'var(--state-info-bg)',
            },
            {
              label: 'En retard',
              value: stats.overdueCount.toString(),
              icon: AlertTriangle,
              color: 'var(--state-error)',
              bgColor: 'var(--state-error-bg)',
            },
            {
              label: 'Liees a une reservation',
              value: stats.linkedCount.toString(),
              icon: Link2,
              color: 'var(--accent-primary)',
              bgColor: 'var(--accent-primary-light)',
            },
            {
              label: 'Total actives',
              value: stats.activeTotal.toString(),
              icon: ClipboardList,
              color: 'var(--state-success)',
              bgColor: 'var(--state-success-bg)',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="md" className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{ backgroundColor: stat.bgColor }}
                >
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
              placeholder="Rechercher une tache..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nouvelle tache
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
                  label="Statut"
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
                />
                <Select
                  label="Priorite"
                  options={priorityFilterOptions}
                  value={priorityFilter}
                  onChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
                />
                <Select
                  label="Type"
                  options={typeFilterOptions}
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value as TaskType | 'all')}
                />
                <Select
                  label="Reservation"
                  options={[
                    { value: 'all', label: 'Toutes les reservations' },
                    { value: 'linked', label: 'Avec reservation' },
                    { value: 'unlinked', label: 'Sans reservation' },
                    ...bookingOptions.filter((opt) => opt.value !== ''),
                  ]}
                  value={bookingFilter}
                  onChange={(value) => setBookingFilter(value)}
                />
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reinitialiser
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Board */}
        <div className={styles.kanban}>
          {/* A faire */}
          <div className={styles.kanbanColumn}>
            <div className={styles.kanbanColumnHeader}>
              <div className={styles.kanbanColumnTitle}>
                <span className={`${styles.columnDot} ${styles.columnDotTodo}`} />
                <h3>A faire</h3>
              </div>
              <span className={styles.columnCount}>{todoTasks.length}</span>
            </div>
            <div className={styles.kanbanColumnContent}>
              {todoTasks.length === 0 ? (
                <div className={styles.emptyColumn}>
                  <Sparkles size={24} />
                  <p>Aucune tache en attente</p>
                </div>
              ) : (
                todoTasks.map((task, index) => renderTaskCard(task, index))
              )}
            </div>
          </div>

          {/* En cours */}
          <div className={styles.kanbanColumn}>
            <div className={styles.kanbanColumnHeader}>
              <div className={styles.kanbanColumnTitle}>
                <span className={`${styles.columnDot} ${styles.columnDotInProgress}`} />
                <h3>En cours</h3>
              </div>
              <span className={styles.columnCount}>{inProgressTasks.length}</span>
            </div>
            <div className={styles.kanbanColumnContent}>
              {inProgressTasks.length === 0 ? (
                <div className={styles.emptyColumn}>
                  <Wrench size={24} />
                  <p>Aucune tache en cours</p>
                </div>
              ) : (
                inProgressTasks.map((task, index) => renderTaskCard(task, index))
              )}
            </div>
          </div>

          {/* Termine */}
          <div className={styles.kanbanColumn}>
            <div className={styles.kanbanColumnHeader}>
              <div className={styles.kanbanColumnTitle}>
                <span className={`${styles.columnDot} ${styles.columnDotDone}`} />
                <h3>Termine</h3>
              </div>
              <span className={styles.columnCount}>{doneTasks.length}</span>
            </div>
            <div className={styles.kanbanColumnContent}>
              {doneTasks.length === 0 ? (
                <div className={styles.emptyColumn}>
                  <CheckCircle2 size={24} />
                  <p>Aucune tache terminee</p>
                </div>
              ) : (
                doneTasks.map((task, index) => renderTaskCard(task, index))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData(initialFormState);
        }}
        size="lg"
      >
        <form onSubmit={handleCreateTask}>
          <ModalHeader
            title="Nouvelle tache"
            subtitle="Creez une tache pour votre equipe"
            onClose={() => {
              setIsCreateModalOpen(false);
              setFormData(initialFormState);
            }}
          />
          <ModalBody>
            <div className={styles.formGrid}>
              {/* Title */}
              <div className={`${styles.formField} ${styles.formFullWidth}`}>
                <label htmlFor="task-title" className={styles.formLabel}>
                  Titre <span style={{ color: 'var(--state-error)' }}>*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: Nettoyer le studio apres le shooting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className={`${styles.formField} ${styles.formFullWidth}`}>
                <label htmlFor="task-description" className={styles.formLabel}>Description</label>
                <textarea
                  id="task-description"
                  className={styles.formTextarea}
                  placeholder="Details de la tache..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Type */}
              <div className={styles.formField}>
                <label htmlFor="task-type" className={styles.formLabel}>Type</label>
                <select
                  id="task-type"
                  className={styles.formSelect}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className={styles.formField}>
                <label htmlFor="task-priority" className={styles.formLabel}>Priorite</label>
                <select
                  id="task-priority"
                  className={styles.formSelect}
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as TaskPriority })
                  }
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className={styles.formField}>
                <label htmlFor="task-assignee" className={styles.formLabel}>Assigner a</label>
                <select
                  id="task-assignee"
                  className={styles.formSelect}
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                >
                  {teamMemberOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Space */}
              <div className={styles.formField}>
                <label htmlFor="task-space" className={styles.formLabel}>Espace</label>
                <select
                  id="task-space"
                  className={styles.formSelect}
                  value={formData.space}
                  onChange={(e) => setFormData({ ...formData, space: e.target.value })}
                >
                  {spaceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div className={styles.formField}>
                <label htmlFor="task-due-date" className={styles.formLabel}>Date limite</label>
                <input
                  id="task-due-date"
                  type="date"
                  className={styles.formInput}
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              {/* Booking Link */}
              <div className={`${styles.formField} ${styles.formFullWidth}`}>
                <label htmlFor="task-booking" className={styles.formLabel}>
                  Reservation liee
                </label>
                <select
                  id="task-booking"
                  className={styles.formSelect}
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                >
                  {bookingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurring toggle */}
              <div className={`${styles.formField} ${styles.formFullWidth}`}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleLabelText}>Tache recurrente</span>
                    <span className={styles.toggleLabelHint}>
                      Cette tache sera recreee automatiquement
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${
                      formData.recurring ? styles.toggleSwitchActive : ''
                    }`}
                    onClick={() => setFormData({ ...formData, recurring: !formData.recurring })}
                    aria-pressed={formData.recurring}
                    aria-label="Tache recurrente"
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData(initialFormState);
              }}
              type="button"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              disabled={!formData.title.trim()}
            >
              Creer la tache
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
