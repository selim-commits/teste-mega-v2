import { useState } from 'react';
import {
  Mail,
  Send,
  Edit2,
  Eye,
  Check,
  Clock,
  FileText,
  Plus,
  Settings,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { useToast } from '../components/ui/Toast';
import styles from './SettingsPage.module.css';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  enabled: boolean;
  lastEdited: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'booking-confirmation',
    name: 'Confirmation de reservation',
    description: 'Envoye automatiquement apres une reservation',
    trigger: 'Nouvelle reservation',
    enabled: true,
    lastEdited: '2024-01-10',
  },
  {
    id: 'booking-reminder',
    name: 'Rappel de rendez-vous',
    description: 'Envoye 24h avant le rendez-vous',
    trigger: '24h avant',
    enabled: true,
    lastEdited: '2024-01-08',
  },
  {
    id: 'booking-cancelled',
    name: 'Annulation de reservation',
    description: 'Envoye lors d\'une annulation',
    trigger: 'Annulation',
    enabled: true,
    lastEdited: '2024-01-05',
  },
  {
    id: 'payment-receipt',
    name: 'Recu de paiement',
    description: 'Envoye apres un paiement reussi',
    trigger: 'Paiement recu',
    enabled: true,
    lastEdited: '2024-01-03',
  },
  {
    id: 'follow-up',
    name: 'Suivi apres visite',
    description: 'Envoye 2 jours apres le rendez-vous',
    trigger: '2 jours apres',
    enabled: false,
    lastEdited: '2023-12-20',
  },
  {
    id: 'welcome',
    name: 'Bienvenue',
    description: 'Envoye aux nouveaux clients',
    trigger: 'Nouveau client',
    enabled: true,
    lastEdited: '2023-12-15',
  },
];

export function EmailNotifications() {
  const [templates, setTemplates] = useState(emailTemplates);
  const { addToast } = useToast();

  const handleComingSoon = (action: string) => {
    addToast({
      title: 'Fonctionnalite bientot disponible',
      description: `${action} sera disponible prochainement.`,
      variant: 'info',
      duration: 3000,
    });
  };

  const handleNewTemplate = () => {
    addToast({
      title: 'Nouveau template',
      description: 'L\'editeur de templates sera bientot disponible.',
      variant: 'info',
      duration: 3000,
    });
  };

  const handlePreviewTemplate = (name: string) => {
    addToast({
      title: 'Apercu',
      description: `Apercu du template "${name}" bientot disponible.`,
      variant: 'info',
      duration: 3000,
    });
  };

  const handleEditTemplate = (name: string) => {
    addToast({
      title: 'Modification',
      description: `L'edition du template "${name}" sera bientot disponible.`,
      variant: 'info',
      duration: 3000,
    });
  };

  const toggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const enabledCount = templates.filter((t) => t.enabled).length;

  return (
    <div className={styles.page}>
      <Header
        title="E-mails client"
        subtitle="Configurez vos emails automatiques"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <Mail size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{templates.length}</span>
                <span className={styles.statLabel}>Templates</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <Check size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{enabledCount}</span>
                <span className={styles.statLabel}>Actifs</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-purple)15' }}>
                <Send size={20} color="var(--accent-purple)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>1,234</span>
                <span className={styles.statLabel}>Envoyes ce mois</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Email Settings */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Parametres generaux</h3>
            <Button variant="secondary" size="sm" icon={<Settings size={16} />} onClick={() => handleComingSoon('Configuration des parametres')}>
              Configurer
            </Button>
          </div>

          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Adresse d'expedition</span>
                  <span className={styles.listItemSubtitle}>noreply@rooom-os.com</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleComingSoon('Modification de l\'adresse d\'expedition')}>Modifier</Button>
            </div>
            <div className={styles.listItem}>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemText}>
                  <span className={styles.listItemTitle}>Nom d'expediteur</span>
                  <span className={styles.listItemSubtitle}>Rooom OS Studio</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleComingSoon('Modification du nom d\'expediteur')}>Modifier</Button>
            </div>
          </div>
        </Card>

        {/* Email Templates */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Templates d'emails</h3>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleNewTemplate}>
              Nouveau template
            </Button>
          </div>

          <div className={styles.list}>
            {templates.map((template, index) => (
              <div
                key={template.id}
                className={`${styles.listItem} ${styles.animateInLeft}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.listItemText}>
                    <span className={styles.listItemTitle}>{template.name}</span>
                    <span className={styles.listItemSubtitle}>{template.description}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Badge variant="default" size="sm">
                    <Clock size={10} style={{ marginRight: '4px' }} />
                    {template.trigger}
                  </Badge>

                  <Switch
                    checked={template.enabled}
                    onChange={() => toggleTemplate(template.id)}
                  />

                  <div className={styles.listItemActions}>
                    <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => handlePreviewTemplate(template.name)} />
                    <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => handleEditTemplate(template.name)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
