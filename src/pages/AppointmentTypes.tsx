import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  ListChecks,
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import styles from './AppointmentTypes.module.css';

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
  isActive: boolean;
  description?: string;
}

interface AppointmentTypeFormData {
  name: string;
  description: string;
  duration: string;
  price: string;
  color: string;
}

const STORAGE_KEY = 'rooom_appointment_types';

const COLOR_PRESETS = [
  { label: 'Bleu', value: '#3B82F6' },
  { label: 'Violet', value: '#8B5CF6' },
  { label: 'Rose', value: '#EC4899' },
  { label: 'Vert', value: '#10B981' },
  { label: 'Orange', value: '#F59E0B' },
  { label: 'Rouge', value: '#EF4444' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Indigo', value: '#6366F1' },
];

const defaultAppointmentTypes: AppointmentType[] = [
  {
    id: '1',
    name: 'Session Studio',
    duration: 60,
    price: 50,
    color: '#3B82F6',
    isActive: true,
    description: 'Session d\'enregistrement standard',
  },
  {
    id: '2',
    name: 'Mixage',
    duration: 120,
    price: 100,
    color: '#8B5CF6',
    isActive: true,
    description: 'Service de mixage professionnel',
  },
  {
    id: '3',
    name: 'Mastering',
    duration: 60,
    price: 75,
    color: '#EC4899',
    isActive: true,
    description: 'Mastering audio haute qualite',
  },
  {
    id: '4',
    name: 'Consultation',
    duration: 30,
    price: 0,
    color: '#10B981',
    isActive: false,
    description: 'Consultation gratuite pour nouveaux clients',
  },
];

const emptyFormData: AppointmentTypeFormData = {
  name: '',
  description: '',
  duration: '60',
  price: '0',
  color: '#3B82F6',
};

function loadFromStorage(): AppointmentType[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppointmentType[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Silently fall back to defaults
  }
  return defaultAppointmentTypes;
}

function saveToStorage(data: AppointmentType[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently ignore storage errors
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

export function AppointmentTypes() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(loadFromStorage);
  const { success } = useNotifications();

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [deletingType, setDeletingType] = useState<AppointmentType | null>(null);
  const [formData, setFormData] = useState<AppointmentTypeFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AppointmentTypeFormData, string>>>({});

  // Persist to localStorage on change
  useEffect(() => {
    saveToStorage(appointmentTypes);
  }, [appointmentTypes]);

  const filteredTypes = appointmentTypes.filter((type) =>
    type.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Dynamic stats
  const stats = useMemo(() => {
    const count = appointmentTypes.length;
    const avgPrice = count > 0
      ? Math.round(appointmentTypes.reduce((sum, t) => sum + t.price, 0) / count)
      : 0;
    const avgDuration = count > 0
      ? Math.round(appointmentTypes.reduce((sum, t) => sum + t.duration, 0) / count)
      : 0;
    return { count, avgPrice, avgDuration };
  }, [appointmentTypes]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Form helpers
  const handleFormChange = useCallback((field: keyof AppointmentTypeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof AppointmentTypeFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    const duration = Number(formData.duration);
    if (!formData.duration || isNaN(duration) || duration < 1) {
      errors.duration = 'La duree doit etre superieure a 0';
    }

    const price = Number(formData.price);
    if (formData.price === '' || isNaN(price) || price < 0) {
      errors.price = 'Le prix doit etre positif ou nul';
    }

    if (!formData.color) {
      errors.color = 'La couleur est requise';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Open create modal
  const handleOpenCreate = useCallback(() => {
    setEditingType(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setIsFormModalOpen(true);
  }, []);

  // Open edit modal
  const handleOpenEdit = useCallback((type: AppointmentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      duration: String(type.duration),
      price: String(type.price),
      color: type.color,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  }, []);

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingType(null);
    setFormData(emptyFormData);
    setFormErrors({});
  }, []);

  // Submit form (create or edit)
  const handleSubmitForm = useCallback(() => {
    if (!validateForm()) return;

    if (editingType) {
      // Update existing
      setAppointmentTypes((prev) =>
        prev.map((t) =>
          t.id === editingType.id
            ? {
                ...t,
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                duration: Number(formData.duration),
                price: Number(formData.price),
                color: formData.color,
              }
            : t
        )
      );
      success('Type modifie', `${formData.name} a ete mis a jour avec succes`);
    } else {
      // Create new
      const newType: AppointmentType = {
        id: generateId(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration: Number(formData.duration),
        price: Number(formData.price),
        color: formData.color,
        isActive: true,
      };
      setAppointmentTypes((prev) => [...prev, newType]);
      success('Type cree', `${formData.name} a ete ajoute avec succes`);
    }

    handleCloseFormModal();
  }, [editingType, formData, validateForm, handleCloseFormModal, success]);

  // Duplicate
  const handleDuplicate = useCallback((type: AppointmentType) => {
    const duplicate: AppointmentType = {
      ...type,
      id: generateId(),
      name: `${type.name} (copie)`,
    };
    setAppointmentTypes((prev) => [...prev, duplicate]);
    success('Type duplique', `${duplicate.name} a ete cree`);
  }, [success]);

  // Toggle active state
  const handleToggleActive = useCallback((type: AppointmentType) => {
    setAppointmentTypes((prev) =>
      prev.map((t) =>
        t.id === type.id ? { ...t, isActive: !t.isActive } : t
      )
    );
    const newState = !type.isActive;
    success(
      newState ? 'Type active' : 'Type desactive',
      `${type.name} a ete ${newState ? 'active' : 'desactive'}`
    );
  }, [success]);

  // Open delete confirmation
  const handleOpenDelete = useCallback((type: AppointmentType) => {
    setDeletingType(type);
    setIsDeleteModalOpen(true);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!deletingType) return;
    const name = deletingType.name;
    setAppointmentTypes((prev) => prev.filter((t) => t.id !== deletingType.id));
    setIsDeleteModalOpen(false);
    setDeletingType(null);
    success('Type supprime', `${name} a ete supprime avec succes`);
  }, [deletingType, success]);

  // Close delete modal
  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDeletingType(null);
  }, []);

  return (
    <div className={styles.page}>
      <Header
        title="Types de rendez-vous"
        subtitle="Gerez vos services et leurs tarifs"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <ListChecks size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.count}</span>
                <span className={styles.statLabel}>Types de service</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <DollarSign size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.avgPrice} &euro;</span>
                <span className={styles.statLabel}>Prix moyen</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-purple)15' }}>
                <Clock size={20} color="var(--accent-purple)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.avgDuration} min</span>
                <span className={styles.statLabel}>Duree moyenne</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
          >
            Nouveau type
          </Button>
        </div>

        {/* Appointment Types Grid */}
        <div className={styles.grid}>
          {filteredTypes.map((type, index) => (
            <div
              key={type.id}
              className={styles.animateIn}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card padding="none" hoverable className={styles.card} style={{ opacity: type.isActive ? 1 : 0.6 }}>
                <div className={styles.cardHeader}>
                  <div
                    className={styles.cardIcon}
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <ListChecks size={24} color={type.color} />
                  </div>
                  <Dropdown
                    trigger={
                      <button style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 'var(--space-2)',
                        color: 'var(--text-muted)',
                      }} aria-label="Plus d'options">
                        <MoreVertical size={16} />
                      </button>
                    }
                    align="end"
                  >
                    <DropdownItem icon={<Edit2 size={16} />} onClick={() => handleOpenEdit(type)}>Modifier</DropdownItem>
                    <DropdownItem icon={<Copy size={16} />} onClick={() => handleDuplicate(type)}>Dupliquer</DropdownItem>
                    <DropdownItem icon={type.isActive ? <EyeOff size={16} /> : <Eye size={16} />} onClick={() => handleToggleActive(type)}>
                      {type.isActive ? 'Desactiver' : 'Activer'}
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<Trash2 size={16} />} destructive onClick={() => handleOpenDelete(type)}>
                      Supprimer
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <h4 className={styles.cardTitle}>{type.name}</h4>
                    {!type.isActive && <Badge variant="default" size="sm">Inactif</Badge>}
                  </div>
                  {type.description && (
                    <p className={styles.cardDescription}>{type.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {formatDuration(type.duration)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <DollarSign size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {type.price > 0 ? `${type.price} \u20ac` : 'Gratuit'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(type)}>Voir details</Button>
                  <Button variant="secondary" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEdit(type)}>
                    Modifier
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredTypes.length === 0 && (
          <div className={styles.emptyState}>
            <ListChecks size={48} />
            <h3>Aucun type trouve</h3>
            <p>
              {debouncedSearch
                ? `Aucun resultat pour "${debouncedSearch}"`
                : 'Commencez par creer votre premier type de rendez-vous'}
            </p>
            {!debouncedSearch && (
              <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleOpenCreate}>
                Nouveau type
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} size="md">
        <ModalHeader
          title={editingType ? 'Modifier le type' : 'Nouveau type de rendez-vous'}
          subtitle={editingType ? `Modification de ${editingType.name}` : 'Definissez un nouveau service'}
          onClose={handleCloseFormModal}
        />
        <ModalBody>
          <div className={styles.formGrid}>
            <div className={styles.formFullWidth}>
              <Input
                label="Nom *"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={formErrors.name}
                placeholder="Ex: Session Studio"
                fullWidth
              />
            </div>
            <div className={styles.formFullWidth}>
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description du service"
                fullWidth
              />
            </div>
            <Input
              label="Duree (minutes) *"
              type="number"
              value={formData.duration}
              onChange={(e) => handleFormChange('duration', e.target.value)}
              error={formErrors.duration}
              placeholder="60"
              fullWidth
            />
            <Input
              label="Prix (euros) *"
              type="number"
              value={formData.price}
              onChange={(e) => handleFormChange('price', e.target.value)}
              error={formErrors.price}
              placeholder="0"
              fullWidth
            />
            <div className={styles.formFullWidth}>
              <label htmlFor="appointment-color-input" style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                Couleur *
              </label>
              <input id="appointment-color-input" type="hidden" value={formData.color} />
              {formErrors.color && (
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--state-error)',
                  marginBottom: 'var(--space-2)',
                  display: 'block',
                }}>
                  {formErrors.color}
                </span>
              )}
              <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
              }}>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleFormChange('color', preset.value)}
                    title={preset.label}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: preset.value,
                      border: formData.color === preset.value
                        ? '3px solid var(--text-primary)'
                        : '2px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast) var(--ease-default)',
                      outline: 'none',
                      boxShadow: formData.color === preset.value
                        ? '0 0 0 2px var(--bg-primary), 0 0 0 4px var(--text-primary)'
                        : 'none',
                    }}
                    aria-label={preset.label}
                    aria-pressed={formData.color === preset.value}
                  />
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseFormModal}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmitForm}>
            {editingType ? 'Enregistrer' : 'Creer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} size="sm">
        <ModalHeader title="Confirmer la suppression" onClose={handleCloseDeleteModal} />
        <ModalBody>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Etes-vous sur de vouloir supprimer <strong>{deletingType?.name}</strong> ?
            Cette action est irreversible.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
