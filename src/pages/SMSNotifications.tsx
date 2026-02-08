import { useState, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Edit2,
  Plus,
  Smartphone,
  Search,
  Copy,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Hash,
  TrendingUp,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import styles from './SMSNotifications.module.css';

// ── Types ──────────────────────────────────────────────────────────

type TemplateCategory = 'confirmation' | 'rappel' | 'suivi' | 'annulation';

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  category: TemplateCategory;
  enabled: boolean;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────

const STORAGE_KEY = 'rooom-sms-templates';

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  confirmation: 'Confirmation',
  rappel: 'Rappel',
  suivi: 'Suivi',
  annulation: 'Annulation',
};

const CATEGORY_VARIANTS: Record<TemplateCategory, 'success' | 'info' | 'warning' | 'error'> = {
  confirmation: 'success',
  rappel: 'info',
  suivi: 'warning',
  annulation: 'error',
};

const VARIABLES = [
  { key: '{{client_name}}', label: 'Client', sample: 'Marie Dupont' },
  { key: '{{date}}', label: 'Date', sample: '15/03/2026' },
  { key: '{{time}}', label: 'Heure', sample: '14h30' },
  { key: '{{service}}', label: 'Service', sample: 'Shooting Portrait' },
  { key: '{{studio_name}}', label: 'Studio', sample: 'Rooom Studio' },
  { key: '{{amount}}', label: 'Montant', sample: '150,00 \u20AC' },
  { key: '{{booking_ref}}', label: 'Ref.', sample: 'BK-2026-0042' },
];

const DEFAULT_TEMPLATES: SMSTemplate[] = [
  {
    id: 'tpl-confirmation-1',
    name: 'Confirmation de reservation',
    message:
      'Bonjour {{client_name}}, votre reservation pour {{service}} le {{date}} a {{time}} est confirmee. Ref: {{booking_ref}}. A bientot ! - {{studio_name}}',
    category: 'confirmation',
    enabled: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'tpl-rappel-24h',
    name: 'Rappel 24h avant',
    message:
      'Rappel: votre RDV {{service}} est demain a {{time}}. Pensez a arriver 10min en avance. A demain ! - {{studio_name}}',
    category: 'rappel',
    enabled: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'tpl-rappel-1h',
    name: 'Rappel 1h avant',
    message:
      'Bonjour {{client_name}}, votre seance commence dans 1h. On vous attend ! - {{studio_name}}',
    category: 'rappel',
    enabled: false,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'tpl-suivi-1',
    name: 'Suivi apres seance',
    message:
      'Merci {{client_name}} pour votre visite ! Vos photos seront disponibles sous 48h. Pour toute question: {{studio_name}}',
    category: 'suivi',
    enabled: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'tpl-annulation-1',
    name: 'Confirmation annulation',
    message:
      'Votre reservation {{booking_ref}} du {{date}} a bien ete annulee. Remboursement de {{amount}} sous 5 jours. - {{studio_name}}',
    category: 'annulation',
    enabled: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
];

// ── Helpers ────────────────────────────────────────────────────────

function loadTemplates(): SMSTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SMSTemplate[];
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_TEMPLATES;
}

function saveTemplates(templates: SMSTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function hasUnicode(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\x7F]/.test(text);
}

function computeSegments(text: string): { charCount: number; segmentSize: number; segments: number; isUnicode: boolean } {
  const isUnicode = hasUnicode(text);
  const charCount = text.length;
  const segmentSize = isUnicode ? 70 : 160;
  const segments = charCount === 0 ? 0 : Math.ceil(charCount / segmentSize);
  return { charCount, segmentSize, segments, isUnicode };
}

function replaceVariablesWithSample(text: string): string {
  let result = text;
  for (const v of VARIABLES) {
    result = result.replaceAll(v.key, v.sample);
  }
  return result;
}

function generateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Component ──────────────────────────────────────────────────────

export function SMSNotifications() {
  const { success: notifySuccess, info: notifyInfo } = useNotifications();

  // State
  const [templates, setTemplates] = useState<SMSTemplate[]>(loadTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');

  // Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formCategory, setFormCategory] = useState<TemplateCategory>('confirmation');
  const [formErrors, setFormErrors] = useState<{ name?: string; message?: string }>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Persistence helper ───────────────────────────────────────

  const updateTemplates = useCallback((updater: (prev: SMSTemplate[]) => SMSTemplate[]) => {
    setTemplates((prev) => {
      const next = updater(prev);
      saveTemplates(next);
      return next;
    });
  }, []);

  // ── Computed ────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [templates, categoryFilter, debouncedSearch]);

  const activeCount = templates.filter((t) => t.enabled).length;
  const mockSentThisMonth = 456;
  const mockDeliveryRate = 97.2;

  const messageInfo = computeSegments(formMessage);
  const costPerSegment = 0.05;
  const estimatedCost = messageInfo.segments * costPerSegment;

  // ── Handlers ────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormMessage('');
    setFormCategory('confirmation');
    setFormErrors({});
    setEditorOpen(true);
  };

  const openEditModal = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormMessage(template.message);
    setFormCategory(template.category);
    setFormErrors({});
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; message?: string } = {};
    if (!formName.trim()) {
      errors.name = 'Le nom est requis';
    }
    if (!formMessage.trim()) {
      errors.message = 'Le message est requis';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (editingTemplate) {
      updateTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, name: formName.trim(), message: formMessage, category: formCategory }
            : t
        )
      );
      notifySuccess('Template modifie', `"${formName.trim()}" a ete mis a jour.`);
    } else {
      const newTemplate: SMSTemplate = {
        id: generateId(),
        name: formName.trim(),
        message: formMessage,
        category: formCategory,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      updateTemplates((prev) => [...prev, newTemplate]);
      notifySuccess('Template cree', `"${formName.trim()}" a ete ajoute.`);
    }

    closeEditor();
  };

  const handleDuplicate = (template: SMSTemplate) => {
    const duplicated: SMSTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (copie)`,
      createdAt: new Date().toISOString(),
    };
    updateTemplates((prev) => [...prev, duplicated]);
    notifySuccess('Template duplique', `"${duplicated.name}" a ete cree.`);
  };

  const openDeleteConfirm = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    const template = templates.find((t) => t.id === deleteTargetId);
    updateTemplates((prev) => prev.filter((t) => t.id !== deleteTargetId));
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    if (template) {
      notifySuccess('Template supprime', `"${template.name}" a ete supprime.`);
    }
  };

  const toggleTemplate = (id: string) => {
    updateTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSendTest = (template: SMSTemplate) => {
    notifyInfo('SMS de test envoye', `Un SMS de test pour "${template.name}" a ete envoye.`);
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormMessage((prev) => prev + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage =
      formMessage.substring(0, start) + variable + formMessage.substring(end);
    setFormMessage(newMessage);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + variable.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const previewText = replaceVariablesWithSample(formMessage);

  const deleteTargetTemplate = deleteTargetId
    ? templates.find((t) => t.id === deleteTargetId)
    : null;

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <Header
        title="Messages SMS"
        subtitle="Gerez vos templates de notifications SMS"
      />

      <div className={styles.content}>
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Hash size={20} color="var(--text-secondary)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{templates.length}</span>
                <span className={styles.statLabel}>Templates total</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                <MessageSquare size={20} color="var(--state-success)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeCount}</span>
                <span className={styles.statLabel}>Templates actifs</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                <Send size={20} color="var(--state-info)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{mockSentThisMonth}</span>
                <span className={styles.statLabel}>Envoyes ce mois</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)' }}>
                <TrendingUp size={20} color="var(--state-warning)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{mockDeliveryRate}%</span>
                <span className={styles.statLabel}>Taux de livraison</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Toolbar: Search + Filters + New Template */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.toolbarActions}>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={openCreateModal}
              >
                Nouveau template
              </Button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${categoryFilter === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              Tous
            </button>
            {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((cat) => (
              <button
                key={cat}
                className={`${styles.filterTab} ${categoryFilter === cat ? styles.filterTabActive : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </Card>

        {/* Templates List */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Templates SMS</h3>
            <Badge variant="default" size="sm">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className={styles.emptyState}>
              <Smartphone size={48} />
              <h3 className={styles.emptyStateTitle}>Aucun template trouve</h3>
              <p className={styles.emptyStateText}>
                {debouncedSearch.trim() || categoryFilter !== 'all'
                  ? 'Modifiez vos filtres ou creez un nouveau template.'
                  : 'Commencez par creer votre premier template SMS.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={openCreateModal}
              >
                Creer un template
              </Button>
            </div>
          ) : (
            <div className={styles.templateList}>
              {filteredTemplates.map((template, index) => {
                const info = computeSegments(template.message);
                const cost = info.segments * costPerSegment;
                return (
                  <div
                    key={template.id}
                    className={`${styles.templateItem} ${!template.enabled ? styles.templateItemDisabled : ''} ${styles.animateInLeft}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={styles.templateItemHeader}>
                      <div className={styles.templateItemInfo}>
                        <div className={styles.templateItemText}>
                          <span className={styles.templateItemTitle}>{template.name}</span>
                          <Badge variant={CATEGORY_VARIANTS[template.category]} size="sm">
                            {CATEGORY_LABELS[template.category]}
                          </Badge>
                        </div>
                      </div>
                      <div className={styles.templateItemActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Send size={14} />}
                          onClick={() => handleSendTest(template)}
                        >
                          Tester
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Copy size={14} />}
                          onClick={() => handleDuplicate(template)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={14} />}
                          onClick={() => openEditModal(template)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => openDeleteConfirm(template.id)}
                        />
                        <Switch
                          checked={template.enabled}
                          onChange={() => toggleTemplate(template.id)}
                        />
                      </div>
                    </div>

                    <div className={styles.templatePreview}>
                      {template.message}
                      <div className={styles.templateMeta}>
                        <div className={styles.templateMetaLeft}>
                          <span>{info.charCount} car.</span>
                          <ChevronRight size={10} />
                          <span>
                            {info.segments} segment{info.segments !== 1 ? 's' : ''}{' '}
                            ({info.isUnicode ? 'Unicode' : 'GSM'})
                          </span>
                          <ChevronRight size={10} />
                          <span>~{cost.toFixed(2)} EUR</span>
                        </div>
                        <div className={styles.templateMetaRight}>
                          {template.enabled ? 'Actif' : 'Inactif'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Editor Modal ───────────────────────────────────── */}
      <Modal isOpen={editorOpen} onClose={closeEditor} size="lg">
        <ModalHeader
          title={editingTemplate ? 'Modifier le template' : 'Nouveau template SMS'}
          onClose={closeEditor}
        />
        <ModalBody>
          {/* Name */}
          <div className={styles.formField}>
            <Input
              label="Nom du template"
              placeholder="Ex: Confirmation de reservation"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={formErrors.name}
              fullWidth
            />
          </div>

          {/* Category */}
          <div className={styles.formField}>
            <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
              Categorie
            </label>
            <select
              className={styles.formSelect}
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
            >
              {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className={styles.formField}>
            <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
              Message
            </label>
            <textarea
              ref={textareaRef}
              className={`${styles.formTextarea} ${
                formErrors.message
                  ? styles.formTextareaError
                  : messageInfo.segments > 3
                    ? styles.formTextareaWarn
                    : ''
              }`}
              placeholder="Redigez votre message SMS..."
              value={formMessage}
              onChange={(e) => {
                setFormMessage(e.target.value);
                if (formErrors.message) setFormErrors((prev) => ({ ...prev, message: undefined }));
              }}
            />
            {formErrors.message && (
              <span className={styles.formError}>{formErrors.message}</span>
            )}

            {/* Character counter + segment info */}
            <div className={styles.charCounter}>
              <div className={styles.charInfo}>
                <span
                  className={`${styles.charInfoItem} ${
                    messageInfo.segments > 3 ? styles.charCountWarn : ''
                  }`}
                >
                  {messageInfo.charCount} / {messageInfo.segmentSize} car.
                </span>
                <span className={styles.charInfoItem}>
                  {messageInfo.segments} segment{messageInfo.segments !== 1 ? 's' : ''}
                  {messageInfo.isUnicode ? ' (Unicode: 70 car./seg.)' : ' (GSM: 160 car./seg.)'}
                </span>
              </div>
              <span className={styles.costEstimate}>
                Cout estime : {estimatedCost.toFixed(2)} EUR
              </span>
            </div>

            {messageInfo.segments > 3 && (
              <span className={styles.formWarn}>
                <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
                Attention : plus de 3 segments augmentent le cout d&apos;envoi.
              </span>
            )}
          </div>

          {/* Variable Buttons */}
          <div className={styles.variablesSection}>
            <div className={styles.variablesLabel}>Inserer une variable</div>
            <div className={styles.variablesList}>
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={styles.variableBtn}
                  onClick={() => insertVariable(v.key)}
                  title={`Inserer ${v.label} (ex: ${v.sample})`}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {formMessage.trim() && (
            <div className={styles.previewSection}>
              <div className={styles.previewLabel}>Apercu</div>
              <div className={styles.previewPhone}>
                <div className={styles.previewSender}>Rooom Studio</div>
                <div className={styles.previewBubble}>{previewText}</div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={closeEditor}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingTemplate ? 'Enregistrer' : 'Creer le template'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} size="sm">
        <ModalHeader
          title="Supprimer le template"
          onClose={() => setDeleteConfirmOpen(false)}
        />
        <ModalBody>
          <p className={styles.confirmText}>
            Etes-vous sur de vouloir supprimer le template{' '}
            <span className={styles.confirmHighlight}>
              {deleteTargetTemplate?.name}
            </span>{' '}
            ? Cette action est irreversible.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
