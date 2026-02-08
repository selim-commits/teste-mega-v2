import { useState, useMemo } from 'react';
import {
  Zap,
  Search,
  Plus,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  Bell,
  FileText,
  ClipboardList,
  UserPlus,
  CalendarCheck,
  CreditCard,
  XCircle,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import styles from './Automations.module.css';

// Types

type AutomationStatus = 'active' | 'paused' | 'error';
type AutomationCategory = 'reservation' | 'paiement' | 'communication' | 'tache';

interface Automation {
  id: string;
  name: string;
  description: string;
  active: boolean;
  status: AutomationStatus;
  category: AutomationCategory;
  trigger: string;
  triggerIcon: React.ElementType;
  condition?: string;
  action: string;
  actionIcon: React.ElementType;
  lastExecuted: string | null;
  executionCount: number;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  trigger: string;
  action: string;
  category: AutomationCategory;
}

// Mock data

const STORAGE_KEY = 'rooom_automations';

function loadAutomations(): Automation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as Automation[];
    }
  } catch {
    // Ignore
  }
  return defaultAutomations;
}

function saveAutomations(automations: Automation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(automations));
  } catch {
    // Ignore
  }
}

const defaultAutomations: Automation[] = [
  {
    id: '1',
    name: 'Confirmation de reservation',
    description: 'Envoie un email de confirmation automatique a chaque nouvelle reservation',
    active: true,
    status: 'active',
    category: 'reservation',
    trigger: 'Nouvelle reservation',
    triggerIcon: CalendarCheck,
    condition: 'Reservation confirmee',
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-08T14:30:00',
    executionCount: 247,
  },
  {
    id: '2',
    name: 'Rappel J-1',
    description: 'Envoie un SMS de rappel 24 heures avant le rendez-vous',
    active: true,
    status: 'active',
    category: 'communication',
    trigger: '24h avant RDV',
    triggerIcon: Clock,
    action: 'Envoyer SMS',
    actionIcon: MessageSquare,
    lastExecuted: '2026-02-08T08:00:00',
    executionCount: 189,
  },
  {
    id: '3',
    name: 'Suivi post-session',
    description: 'Demande un avis client par email apres chaque session terminee',
    active: true,
    status: 'active',
    category: 'communication',
    trigger: 'Fin de session',
    triggerIcon: CheckCircle,
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-07T18:00:00',
    executionCount: 156,
  },
  {
    id: '4',
    name: 'Rappel de paiement',
    description: 'Relance automatique par email pour les factures impayees depuis 7 jours',
    active: true,
    status: 'active',
    category: 'paiement',
    trigger: 'Facture impayee 7j',
    triggerIcon: CreditCard,
    condition: 'Montant > 0',
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-06T09:00:00',
    executionCount: 34,
  },
  {
    id: '5',
    name: 'Tache de nettoyage',
    description: 'Cree automatiquement une tache de nettoyage apres chaque session',
    active: false,
    status: 'paused',
    category: 'tache',
    trigger: 'Fin de session',
    triggerIcon: CheckCircle,
    action: 'Creer tache',
    actionIcon: ClipboardList,
    lastExecuted: '2026-01-15T17:00:00',
    executionCount: 89,
  },
  {
    id: '6',
    name: 'Bienvenue nouveau client',
    description: 'Envoie un email de bienvenue personnalise aux nouveaux clients',
    active: true,
    status: 'active',
    category: 'communication',
    trigger: 'Nouveau client',
    triggerIcon: UserPlus,
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-08T11:00:00',
    executionCount: 78,
  },
  {
    id: '7',
    name: 'Alerte annulation',
    description: 'Notifie toute l\'equipe en cas d\'annulation de reservation',
    active: true,
    status: 'error',
    category: 'reservation',
    trigger: 'Annulation',
    triggerIcon: XCircle,
    action: 'Notification equipe',
    actionIcon: Bell,
    lastExecuted: '2026-02-05T16:45:00',
    executionCount: 12,
  },
  {
    id: '8',
    name: 'Facturation automatique',
    description: 'Genere automatiquement une facture a la fin de chaque session',
    active: true,
    status: 'active',
    category: 'paiement',
    trigger: 'Session terminee',
    triggerIcon: CheckCircle,
    action: 'Generer facture',
    actionIcon: FileText,
    lastExecuted: '2026-02-08T17:00:00',
    executionCount: 203,
  },
];

const automationTemplates: AutomationTemplate[] = [
  {
    id: 't1',
    name: 'Confirmation de reservation',
    description: 'Email de confirmation automatique pour chaque nouvelle reservation',
    icon: CalendarCheck,
    trigger: 'Nouvelle reservation',
    action: 'Envoyer email',
    category: 'reservation',
  },
  {
    id: 't2',
    name: 'Rappel J-1',
    description: 'SMS de rappel 24h avant le rendez-vous',
    icon: Clock,
    trigger: '24h avant RDV',
    action: 'Envoyer SMS',
    category: 'communication',
  },
  {
    id: 't3',
    name: 'Suivi post-session',
    description: 'Demande d\'avis client apres la session',
    icon: Mail,
    trigger: 'Fin de session',
    action: 'Envoyer email',
    category: 'communication',
  },
  {
    id: 't4',
    name: 'Rappel de paiement',
    description: 'Relance email pour facture impayee depuis 7 jours',
    icon: CreditCard,
    trigger: 'Facture impayee 7j',
    action: 'Envoyer email',
    category: 'paiement',
  },
  {
    id: 't5',
    name: 'Tache de nettoyage',
    description: 'Creer une tache nettoyage apres chaque session',
    icon: ClipboardList,
    trigger: 'Fin de session',
    action: 'Creer tache',
    category: 'tache',
  },
  {
    id: 't6',
    name: 'Bienvenue nouveau client',
    description: 'Email de bienvenue personnalise pour les nouveaux clients',
    icon: UserPlus,
    trigger: 'Nouveau client',
    action: 'Envoyer email',
    category: 'communication',
  },
  {
    id: 't7',
    name: 'Alerte annulation',
    description: 'Notification a l\'equipe lors d\'une annulation',
    icon: XCircle,
    trigger: 'Annulation',
    action: 'Notification equipe',
    category: 'reservation',
  },
  {
    id: 't8',
    name: 'Facturation automatique',
    description: 'Generer une facture apres chaque session terminee',
    icon: FileText,
    trigger: 'Session terminee',
    action: 'Generer facture',
    category: 'paiement',
  },
];

const categories = [
  { id: 'all', label: 'Toutes' },
  { id: 'reservation', label: 'Reservation' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'communication', label: 'Communication' },
  { id: 'tache', label: 'Tache' },
];

const triggerOptions = [
  'Nouvelle reservation',
  'Paiement recu',
  'Annulation',
  '24h avant RDV',
  'Fin de session',
  'Nouveau client',
  'Facture impayee 7j',
] as const;

const actionOptions = [
  'Envoyer email',
  'Envoyer SMS',
  'Creer tache',
  'Notification push',
  'Generer facture',
  'Mettre a jour statut',
] as const;

const triggerIconMap: Record<string, React.ElementType> = {
  'Nouvelle reservation': CalendarCheck,
  'Paiement recu': CreditCard,
  'Annulation': XCircle,
  '24h avant RDV': Clock,
  'Fin de session': CheckCircle,
  'Nouveau client': UserPlus,
  'Facture impayee 7j': CreditCard,
};

const actionIconMap: Record<string, React.ElementType> = {
  'Envoyer email': Mail,
  'Envoyer SMS': MessageSquare,
  'Creer tache': ClipboardList,
  'Notification push': Bell,
  'Generer facture': FileText,
  'Mettre a jour statut': RefreshCw,
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'A l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

// Component

export function Automations() {
  const [automations, setAutomations] = useState<Automation[]>(loadAutomations);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrigger, setNewTrigger] = useState<string>(triggerOptions[0]);
  const [newAction, setNewAction] = useState<string>(actionOptions[0]);
  const [newActive, setNewActive] = useState(true);
  const { success } = useNotifications();

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filtered automations
  const filteredAutomations = useMemo(() => {
    return automations.filter((a) => {
      const matchesSearch =
        !debouncedSearch ||
        a.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        a.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [automations, debouncedSearch, activeCategory]);

  // Stats
  const activeCount = automations.filter((a) => a.active).length;
  const todayExecutions = automations.reduce((sum, a) => {
    if (a.lastExecuted) {
      const execDate = new Date(a.lastExecuted);
      const today = new Date();
      if (
        execDate.getDate() === today.getDate() &&
        execDate.getMonth() === today.getMonth() &&
        execDate.getFullYear() === today.getFullYear()
      ) {
        return sum + 1;
      }
    }
    return sum;
  }, 0);
  const monthExecutions = automations.reduce((sum, a) => sum + a.executionCount, 0);
  const successRate = automations.length > 0
    ? Math.round((automations.filter((a) => a.status !== 'error').length / automations.length) * 100)
    : 0;

  // Handlers
  const toggleAutomation = (id: string) => {
    const updated = automations.map((a) =>
      a.id === id
        ? { ...a, active: !a.active, status: (!a.active ? 'active' : 'paused') as AutomationStatus }
        : a
    );
    setAutomations(updated);
    saveAutomations(updated);
    const automation = updated.find((a) => a.id === id);
    if (automation) {
      success(
        automation.active ? 'Automation activee' : 'Automation desactivee',
        automation.name
      );
    }
  };

  const handleCreateAutomation = () => {
    if (!newName.trim()) return;

    const newAutomation: Automation = {
      id: Date.now().toString(),
      name: newName.trim(),
      description: newDescription.trim(),
      active: newActive,
      status: newActive ? 'active' : 'paused',
      category: getCategoryForTrigger(newTrigger),
      trigger: newTrigger,
      triggerIcon: triggerIconMap[newTrigger] || Zap,
      action: newAction,
      actionIcon: actionIconMap[newAction] || Zap,
      lastExecuted: null,
      executionCount: 0,
    };

    const updated = [...automations, newAutomation];
    setAutomations(updated);
    saveAutomations(updated);
    resetForm();
    setIsCreateModalOpen(false);
    success('Automation creee', newAutomation.name);
  };

  const handleUseTemplate = (template: AutomationTemplate) => {
    setNewName(template.name);
    setNewDescription(template.description);
    setNewTrigger(template.trigger);
    setNewAction(template.action);
    setNewActive(true);
    setIsCreateModalOpen(true);
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewTrigger(triggerOptions[0]);
    setNewAction(actionOptions[0]);
    setNewActive(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  return (
    <div className={styles.page}>
      <Header
        title="Automations"
        subtitle="Automatisez vos workflows pour gagner du temps"
      />

      <div className={styles.content}>
        {/* Stats Row */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                <Zap size={20} color="var(--state-success)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeCount}</span>
                <span className={styles.statLabel}>Automations actives</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                <Play size={20} color="var(--state-info)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{todayExecutions}</span>
                <span className={styles.statLabel}>Executees aujourd'hui</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)' }}>
                <BarChart3 size={20} color="var(--state-warning)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{monthExecutions.toLocaleString('fr-FR')}</span>
                <span className={styles.statLabel}>Executees ce mois</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)' }}>
                <CheckCircle size={20} color="var(--accent-primary)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{successRate}%</span>
                <span className={styles.statLabel}>Taux de succes</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Rechercher une automation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
          >
            Nouvelle automation
          </Button>
        </div>

        {/* Automations List */}
        {filteredAutomations.length > 0 ? (
          <div className={styles.automationsGrid}>
            {filteredAutomations.map((automation, index) => (
              <div
                key={automation.id}
                className={styles.animateIn}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  padding="md"
                  className={`${styles.automationCard} ${
                    automation.status === 'active'
                      ? styles.automationCardActive
                      : automation.status === 'error'
                      ? styles.automationCardError
                      : styles.automationCardPaused
                  }`}
                >
                  {/* Top: Name + Toggle */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardInfo}>
                      <h4 className={styles.cardName}>{automation.name}</h4>
                      <p className={styles.cardDescription}>{automation.description}</p>
                    </div>
                    <div className={styles.toggleRow}>
                      <Switch
                        checked={automation.active}
                        onChange={() => toggleAutomation(automation.id)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Visual Workflow Flow */}
                  <div className={styles.workflowFlow}>
                    <div className={styles.flowStep}>
                      <automation.triggerIcon size={14} className={styles.flowStepIcon} />
                      <span className={styles.flowStepLabel}>{automation.trigger}</span>
                    </div>
                    <ArrowRight size={14} className={styles.flowArrow} />
                    {automation.condition && (
                      <>
                        <div className={styles.flowStep}>
                          <AlertCircle size={14} className={styles.flowStepIcon} />
                          <span className={styles.flowStepLabel}>{automation.condition}</span>
                        </div>
                        <ArrowRight size={14} className={styles.flowArrow} />
                      </>
                    )}
                    <div className={styles.flowStep}>
                      <automation.actionIcon size={14} className={styles.flowStepIcon} />
                      <span className={styles.flowStepLabel}>{automation.action}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className={styles.badgeRow}>
                    <span className={styles.triggerBadge}>
                      <Zap size={10} />
                      {automation.trigger}
                    </span>
                    <span className={styles.actionBadge}>
                      <Play size={10} />
                      {automation.action}
                    </span>
                    <Badge
                      variant={
                        automation.status === 'active'
                          ? 'success'
                          : automation.status === 'error'
                          ? 'error'
                          : 'warning'
                      }
                      size="sm"
                      dot
                    >
                      {automation.status === 'active'
                        ? 'Active'
                        : automation.status === 'error'
                        ? 'Erreur'
                        : 'En pause'}
                    </Badge>
                  </div>

                  {/* Bottom: Meta */}
                  <div className={styles.cardBottom}>
                    <div className={styles.cardMeta}>
                      <span className={styles.metaItem}>
                        <Clock size={12} />
                        {formatRelativeTime(automation.lastExecuted)}
                      </span>
                      <span className={styles.metaItem}>
                        <Play size={12} />
                        {automation.executionCount} executions
                      </span>
                    </div>
                    <div
                      className={`${styles.statusDot} ${
                        automation.status === 'active'
                          ? styles.statusDotActive
                          : automation.status === 'error'
                          ? styles.statusDotError
                          : styles.statusDotPaused
                      }`}
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card padding="lg">
            <div className={styles.emptyState}>
              <Zap size={48} />
              <h3>Aucune automation trouvee</h3>
              <p>
                {debouncedSearch
                  ? 'Modifiez votre recherche ou vos filtres'
                  : 'Creez votre premiere automation pour commencer'}
              </p>
              {!debouncedSearch && (
                <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
                  Creer une automation
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Templates Section */}
        <div style={{ marginTop: 'var(--section-gap)' }}>
          <h3 className={styles.sectionTitle}>Modeles d'automations</h3>
          <div className={styles.templatesGrid}>
            {automationTemplates.map((template, index) => (
              <div
                key={template.id}
                className={styles.animateIn}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  padding="md"
                  hoverable
                  className={styles.templateCard}
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className={styles.templateIcon}>
                    <template.icon size={20} />
                  </div>
                  <h4 className={styles.templateName}>{template.name}</h4>
                  <p className={styles.templateDescription}>{template.description}</p>
                  <div className={styles.templateFlow}>
                    <span>{template.trigger}</span>
                    <ArrowRight size={12} className={styles.templateFlowArrow} />
                    <span>{template.action}</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="md"
      >
        <ModalHeader
          title="Nouvelle automation"
          subtitle="Configurez votre workflow automatise"
          onClose={() => setIsCreateModalOpen(false)}
        />
        <ModalBody>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nom *</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Ex: Confirmation de reservation"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Decrivez ce que fait cette automation..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Declencheur</label>
            <select
              className={styles.formSelect}
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
            >
              {triggerOptions.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {trigger}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Action</label>
            <select
              className={styles.formSelect}
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
            >
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formToggleRow}>
            <div className={styles.formToggleLabel}>
              <span className={styles.formToggleLabelText}>Activer immediatement</span>
              <span className={styles.formToggleLabelHint}>
                L'automation sera executee des sa creation
              </span>
            </div>
            <Switch
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            icon={<Zap size={16} />}
            onClick={handleCreateAutomation}
            disabled={!newName.trim()}
          >
            Creer l'automation
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// Helpers

function getCategoryForTrigger(trigger: string): AutomationCategory {
  if (['Nouvelle reservation', 'Annulation'].includes(trigger)) return 'reservation';
  if (['Paiement recu', 'Facture impayee 7j'].includes(trigger)) return 'paiement';
  if (['Nouveau client', '24h avant RDV'].includes(trigger)) return 'communication';
  return 'tache';
}
