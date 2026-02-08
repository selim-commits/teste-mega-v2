import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail,
  Send,
  Edit2,
  Eye,
  Check,
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  AlertTriangle,
  BarChart3,
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
import styles from './EmailNotifications.module.css';

type TemplateCategory = 'confirmation' | 'reminder' | 'follow-up' | 'cancellation' | 'invoice';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: TemplateCategory;
  enabled: boolean;
  lastEdited: string;
}

const STORAGE_KEY = 'rooom-email-templates';

const CATEGORIES: { value: TemplateCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'reminder', label: 'Rappel' },
  { value: 'follow-up', label: 'Suivi' },
  { value: 'cancellation', label: 'Annulation' },
  { value: 'invoice', label: 'Facture' },
];

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  confirmation: 'Confirmation',
  reminder: 'Rappel',
  'follow-up': 'Suivi',
  cancellation: 'Annulation',
  invoice: 'Facture',
};

const VARIABLES = [
  { key: '{{client_name}}', label: 'Nom du client' },
  { key: '{{date}}', label: 'Date' },
  { key: '{{time}}', label: 'Heure' },
  { key: '{{service}}', label: 'Service' },
  { key: '{{studio_name}}', label: 'Nom du studio' },
  { key: '{{amount}}', label: 'Montant' },
  { key: '{{booking_ref}}', label: 'Ref. reservation' },
];

const SAMPLE_DATA: Record<string, string> = {
  '{{client_name}}': 'Marie Dupont',
  '{{date}}': '15 mars 2026',
  '{{time}}': '14h00',
  '{{service}}': 'Shooting photo portrait',
  '{{studio_name}}': 'Studio Lumiere',
  '{{amount}}': '250,00 \u20AC',
  '{{booking_ref}}': 'RES-2026-0342',
};

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Confirmation de reservation',
    subject: 'Confirmation de votre reservation - {{booking_ref}}',
    body: `Bonjour {{client_name}},\n\nNous confirmons votre reservation pour le {{date}} a {{time}}.\n\n**Service** : {{service}}\n**Lieu** : {{studio_name}}\n**Reference** : {{booking_ref}}\n\nSi vous avez des questions, n'hesitez pas a nous contacter.\n\nCordialement,\n{{studio_name}}`,
    category: 'confirmation',
    enabled: true,
    lastEdited: '2026-01-15',
  },
  {
    id: 'tpl-2',
    name: 'Rappel de rendez-vous',
    subject: 'Rappel : votre rendez-vous demain a {{time}}',
    body: `Bonjour {{client_name}},\n\nNous vous rappelons votre rendez-vous prevu demain :\n\n**Date** : {{date}}\n**Heure** : {{time}}\n**Service** : {{service}}\n**Lieu** : {{studio_name}}\n\nA bientot !\n{{studio_name}}`,
    category: 'reminder',
    enabled: true,
    lastEdited: '2026-01-12',
  },
  {
    id: 'tpl-3',
    name: 'Suivi apres visite',
    subject: 'Merci pour votre visite, {{client_name}} !',
    body: `Bonjour {{client_name}},\n\nMerci d'avoir choisi {{studio_name}} pour votre {{service}}.\n\nNous esperons que votre experience a ete a la hauteur de vos attentes. Vos photos seront disponibles sous 48h.\n\nN'hesitez pas a nous laisser un avis ou a nous contacter pour toute question.\n\nCordialement,\n{{studio_name}}`,
    category: 'follow-up',
    enabled: true,
    lastEdited: '2026-01-10',
  },
  {
    id: 'tpl-4',
    name: 'Annulation de reservation',
    subject: 'Annulation de votre reservation {{booking_ref}}',
    body: `Bonjour {{client_name}},\n\nNous confirmons l'annulation de votre reservation :\n\n**Reference** : {{booking_ref}}\n**Date prevue** : {{date}} a {{time}}\n**Service** : {{service}}\n\nSi cette annulation n'est pas de votre fait, merci de nous contacter immediatement.\n\nCordialement,\n{{studio_name}}`,
    category: 'cancellation',
    enabled: true,
    lastEdited: '2026-01-08',
  },
  {
    id: 'tpl-5',
    name: 'Facture client',
    subject: 'Votre facture {{booking_ref}} - {{amount}}',
    body: `Bonjour {{client_name}},\n\nVeuillez trouver ci-joint votre facture :\n\n**Reference** : {{booking_ref}}\n**Service** : {{service}}\n**Montant** : {{amount}}\n**Date** : {{date}}\n\nMerci pour votre confiance.\n\nCordialement,\n{{studio_name}}`,
    category: 'invoice',
    enabled: true,
    lastEdited: '2026-01-05',
  },
  {
    id: 'tpl-6',
    name: 'Rappel de paiement',
    subject: 'Rappel de paiement - {{booking_ref}}',
    body: `Bonjour {{client_name}},\n\nNous souhaitons vous rappeler qu'un paiement de {{amount}} est en attente pour votre reservation {{booking_ref}} du {{date}}.\n\nMerci de proceder au reglement dans les meilleurs delais.\n\nCordialement,\n{{studio_name}}`,
    category: 'invoice',
    enabled: false,
    lastEdited: '2025-12-20',
  },
];

function generateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function loadTemplates(): EmailTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as EmailTemplate[];
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_TEMPLATES;
}

function saveTemplates(templates: EmailTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function replaceVariables(text: string): string {
  let result = text;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

function getCategoryBadgeVariant(category: TemplateCategory): 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange' {
  switch (category) {
    case 'confirmation': return 'success';
    case 'reminder': return 'info';
    case 'follow-up': return 'default';
    case 'cancellation': return 'error';
    case 'invoice': return 'warning';
    default: return 'default';
  }
}

export function EmailNotifications() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(loadTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // Form state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState<TemplateCategory>('confirmation');
  const [formErrors, setFormErrors] = useState<{ subject?: string; body?: string; name?: string }>({});

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { success, info, error: notifyError } = useNotifications();

  // Persist templates
  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      debouncedSearch === '' ||
      t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.enabled).length;
  const sentThisMonth = 1234;
  const openRate = 68.5;

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: { subject?: string; body?: string; name?: string } = {};
    if (!formName.trim()) {
      errors.name = 'Le nom est requis';
    }
    if (!formSubject.trim()) {
      errors.subject = 'L\'objet est requis';
    }
    if (!formBody.trim()) {
      errors.body = 'Le contenu est requis';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formName, formSubject, formBody]);

  // Open editor for new template
  const handleNewTemplate = useCallback(() => {
    setEditingTemplate(null);
    setFormName('');
    setFormSubject('');
    setFormBody('');
    setFormCategory('confirmation');
    setFormErrors({});
    setEditorTab('edit');
    setEditorOpen(true);
  }, []);

  // Open editor for existing template
  const handleEditTemplate = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setFormCategory(template.category);
    setFormErrors({});
    setEditorTab('edit');
    setEditorOpen(true);
  }, []);

  // Save template
  const handleSaveTemplate = useCallback(() => {
    if (!validateForm()) return;

    const now = new Date().toISOString().split('T')[0];

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, name: formName.trim(), subject: formSubject.trim(), body: formBody.trim(), category: formCategory, lastEdited: now }
            : t
        )
      );
      success('Template modifie', `"${formName.trim()}" a ete mis a jour.`);
    } else {
      const newTemplate: EmailTemplate = {
        id: generateId(),
        name: formName.trim(),
        subject: formSubject.trim(),
        body: formBody.trim(),
        category: formCategory,
        enabled: true,
        lastEdited: now,
      };
      setTemplates((prev) => [newTemplate, ...prev]);
      success('Template cree', `"${formName.trim()}" a ete ajoute.`);
    }

    setEditorOpen(false);
  }, [editingTemplate, formName, formSubject, formBody, formCategory, validateForm, success]);

  // Duplicate template
  const handleDuplicateTemplate = useCallback((template: EmailTemplate) => {
    const duplicate: EmailTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (copie)`,
      lastEdited: new Date().toISOString().split('T')[0],
    };
    setTemplates((prev) => [duplicate, ...prev]);
    info('Template duplique', `"${duplicate.name}" a ete cree.`);
  }, [info]);

  // Delete template
  const handleRequestDelete = useCallback((template: EmailTemplate) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!templateToDelete) return;
    setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
    notifyError('Template supprime', `"${templateToDelete.name}" a ete supprime.`);
    setDeleteConfirmOpen(false);
    setTemplateToDelete(null);
  }, [templateToDelete, notifyError]);

  // Toggle template
  const toggleTemplate = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  // Send test email
  const handleSendTest = useCallback((template: EmailTemplate) => {
    info('Email de test envoye', `Un email de test pour "${template.name}" a ete envoye.`);
  }, [info]);

  // Insert variable into textarea
  const insertVariable = useCallback((variable: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setFormBody((prev) => prev + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = formBody.substring(0, start) + variable + formBody.substring(end);
    setFormBody(newBody);

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursor = start + variable.length;
      textarea.setSelectionRange(newCursor, newCursor);
    });
  }, [formBody]);

  return (
    <div className={styles.page}>
      <Header
        title="E-mails client"
        subtitle="Gerez vos templates d'emails automatiques"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                <Mail size={20} style={{ color: 'var(--state-info)' }} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{totalTemplates}</span>
                <span className={styles.statLabel}>Templates</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                <Check size={20} style={{ color: 'var(--state-success)' }} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{activeTemplates}</span>
                <span className={styles.statLabel}>Actifs</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-lighter)' }}>
                <Send size={20} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{sentThisMonth.toLocaleString('fr-FR')}</span>
                <span className={styles.statLabel}>Envoyes ce mois</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)' }}>
                <BarChart3 size={20} style={{ color: 'var(--state-warning)' }} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{openRate}%</span>
                <span className={styles.statLabel}>Taux d'ouverture</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Templates Section */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Templates d'emails</h3>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleNewTemplate}>
              Nouveau template
            </Button>
          </div>

          {/* Toolbar: Search + Category Filters */}
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
            <div className={styles.categoryFilters}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`${styles.categoryChip} ${activeCategory === cat.value ? styles.categoryChipActive : ''}`}
                  onClick={() => setActiveCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template List */}
          {filteredTemplates.length > 0 ? (
            <div className={styles.list}>
              {filteredTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className={`${styles.listItem} ${styles.animateInLeft} ${!template.enabled ? styles.listItemDisabled : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={styles.listItemInfo}>
                    <div className={styles.listItemIcon}>
                      <FileText size={20} />
                    </div>
                    <div className={styles.listItemText}>
                      <span className={styles.listItemTitle}>{template.name}</span>
                      <span className={styles.listItemSubtitle}>{template.subject}</span>
                    </div>
                  </div>

                  <div className={styles.listItemRight}>
                    <Badge variant={getCategoryBadgeVariant(template.category)} size="sm">
                      {CATEGORY_LABELS[template.category]}
                    </Badge>

                    <Switch
                      checked={template.enabled}
                      onChange={() => toggleTemplate(template.id)}
                    />

                    <div className={styles.listItemActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Send size={14} />}
                        onClick={() => handleSendTest(template)}
                        title="Envoyer un email de test"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Copy size={14} />}
                        onClick={() => handleDuplicateTemplate(template)}
                        title="Dupliquer"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 size={14} />}
                        onClick={() => handleEditTemplate(template)}
                        title="Modifier"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleRequestDelete(template)}
                        title="Supprimer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Mail size={48} />
              <h3 className={styles.emptyTitle}>Aucun template trouve</h3>
              <p className={styles.emptySubtitle}>
                {debouncedSearch || activeCategory !== 'all'
                  ? 'Essayez de modifier vos filtres de recherche.'
                  : 'Creez votre premier template d\'email.'}
              </p>
              {!debouncedSearch && activeCategory === 'all' && (
                <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleNewTemplate}>
                  Creer un template
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Editor Modal */}
      <Modal isOpen={editorOpen} onClose={() => setEditorOpen(false)} size="lg">
        <ModalHeader
          title={editingTemplate ? 'Modifier le template' : 'Nouveau template'}
          onClose={() => setEditorOpen(false)}
        />
        <ModalBody>
          {/* Tabs */}
          <div className={styles.editorTabs}>
            <button
              className={`${styles.editorTab} ${editorTab === 'edit' ? styles.editorTabActive : ''}`}
              onClick={() => setEditorTab('edit')}
            >
              <Edit2 size={14} />
              Edition
            </button>
            <button
              className={`${styles.editorTab} ${editorTab === 'preview' ? styles.editorTabActive : ''}`}
              onClick={() => setEditorTab('preview')}
            >
              <Eye size={14} />
              Apercu
            </button>
          </div>

          {editorTab === 'edit' ? (
            <>
              {/* Name */}
              <div className={styles.formField}>
                <Input
                  label="Nom du template"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ex: Confirmation de reservation"
                  error={formErrors.name}
                  fullWidth
                />
              </div>

              {/* Category */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Categorie</label>
                <select
                  className={styles.formSelect}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
                >
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className={styles.formField}>
                <Input
                  label="Objet de l'email"
                  value={formSubject}
                  onChange={(e) => {
                    setFormSubject(e.target.value);
                    if (formErrors.subject) setFormErrors((prev) => ({ ...prev, subject: undefined }));
                  }}
                  placeholder="Ex: Confirmation de votre reservation - {{booking_ref}}"
                  error={formErrors.subject}
                  fullWidth
                />
              </div>

              {/* Body */}
              <div className={styles.formField}>
                <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                  Contenu de l'email
                </label>
                <textarea
                  ref={bodyTextareaRef}
                  className={`${styles.textarea} ${formErrors.body ? styles.textareaError : ''}`}
                  value={formBody}
                  onChange={(e) => {
                    setFormBody(e.target.value);
                    if (formErrors.body) setFormErrors((prev) => ({ ...prev, body: undefined }));
                  }}
                  placeholder="Redigez le contenu de votre email..."
                />
                {formErrors.body && (
                  <span className={styles.formError}>{formErrors.body}</span>
                )}
                <div className={styles.formattingHints}>
                  <span className={styles.formattingHint}>
                    <code>**texte**</code> pour le gras
                  </span>
                  <span className={styles.formattingHint}>
                    <code>_texte_</code> pour l'italique
                  </span>
                </div>
              </div>

              {/* Variables */}
              <div className={styles.variablesSection}>
                <div className={styles.variablesLabel}>
                  Inserer une variable
                </div>
                <div className={styles.variablesList}>
                  {VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      className={styles.variableBtn}
                      onClick={() => insertVariable(v.key)}
                      title={v.label}
                      type="button"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Preview Tab */
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <div className={styles.previewSubjectLabel}>Objet</div>
                <div className={styles.previewSubject}>
                  {formSubject ? replaceVariables(formSubject) : '(Aucun objet)'}
                </div>
              </div>
              <div className={styles.previewBody}>
                {formBody
                  ? replaceVariables(formBody)
                  : '(Aucun contenu)'}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditorOpen(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveTemplate}>
            {editingTemplate ? 'Enregistrer' : 'Creer le template'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} size="sm">
        <ModalBody>
          <div className={styles.confirmDeleteContent}>
            <div className={styles.confirmDeleteIcon}>
              <AlertTriangle size={24} />
            </div>
            <h3 className={styles.confirmDeleteTitle}>Supprimer ce template ?</h3>
            <p className={styles.confirmDeleteText}>
              Le template &laquo; {templateToDelete?.name} &raquo; sera supprime definitivement. Cette action est irreversible.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
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
