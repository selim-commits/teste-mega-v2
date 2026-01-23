import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Edit2,
  Check,
  Clock,
  AlertCircle,
  Plus,
  Settings,
  Smartphone,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import styles from './SettingsPage.module.css';

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  trigger: string;
  enabled: boolean;
  charCount: number;
}

const smsTemplates: SMSTemplate[] = [
  {
    id: 'booking-confirmation',
    name: 'Confirmation SMS',
    message: 'Votre reservation est confirmee pour le {date} a {heure}. A bientot!',
    trigger: 'Nouvelle reservation',
    enabled: true,
    charCount: 72,
  },
  {
    id: 'reminder-24h',
    name: 'Rappel 24h',
    message: 'Rappel: RDV demain a {heure}. Repondez STOP pour annuler.',
    trigger: '24h avant',
    enabled: true,
    charCount: 58,
  },
  {
    id: 'reminder-1h',
    name: 'Rappel 1h',
    message: 'Votre RDV est dans 1 heure. On vous attend!',
    trigger: '1h avant',
    enabled: false,
    charCount: 44,
  },
];

export function SMSNotifications() {
  const [templates, setTemplates] = useState(smsTemplates);
  const [smsEnabled, setSmsEnabled] = useState(true);

  const toggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const enabledCount = templates.filter((t) => t.enabled).length;

  return (
    <div className={styles.page}>
      <Header
        title="Messages SMS"
        subtitle="Configurez vos notifications SMS"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <MessageSquare size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{enabledCount}</span>
                <span className={styles.statLabel}>Templates actifs</span>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <Send size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>456</span>
                <span className={styles.statLabel}>Envoyes ce mois</span>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-purple)15' }}>
                <Smartphone size={20} color="var(--accent-purple)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>89%</span>
                <span className={styles.statLabel}>Taux de livraison</span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* SMS Provider */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Configuration SMS</h3>
            <Switch
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
            />
          </div>

          {!smsEnabled ? (
            <div className={styles.emptyState}>
              <AlertCircle size={48} />
              <h3>SMS desactives</h3>
              <p>Activez les SMS pour envoyer des notifications a vos clients</p>
            </div>
          ) : (
            <div className={styles.list}>
              <div className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemIcon} style={{ fontSize: '20px' }}>
                    📱
                  </div>
                  <div className={styles.listItemText}>
                    <span className={styles.listItemTitle}>Twilio</span>
                    <span className={styles.listItemSubtitle}>
                      Fournisseur SMS connecte • Credits restants: 1,250
                    </span>
                  </div>
                </div>
                <div className={styles.listItemActions}>
                  <Badge variant="success" size="sm" dot>Connecte</Badge>
                  <Button variant="ghost" size="sm" icon={<Settings size={14} />} />
                </div>
              </div>

              <div className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemText}>
                    <span className={styles.listItemTitle}>Numero d'expedition</span>
                    <span className={styles.listItemSubtitle}>+33 6 12 34 56 78</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Modifier</Button>
              </div>
            </div>
          )}
        </Card>

        {/* SMS Templates */}
        {smsEnabled && (
          <Card padding="lg" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Templates SMS</h3>
              <Button variant="primary" size="sm" icon={<Plus size={16} />}>
                Nouveau template
              </Button>
            </div>

            <div className={styles.list}>
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={styles.listItem}
                  style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-3)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className={styles.listItemInfo}>
                      <div className={styles.listItemText}>
                        <span className={styles.listItemTitle}>{template.name}</span>
                        <Badge variant="default" size="sm">
                          <Clock size={10} style={{ marginRight: '4px' }} />
                          {template.trigger}
                        </Badge>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Switch
                        checked={template.enabled}
                        onChange={() => toggleTemplate(template.id)}
                      />
                      <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} />
                    </div>
                  </div>

                  <div style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}>
                    {template.message}
                    <div style={{
                      marginTop: 'var(--space-2)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}>
                      {template.charCount} caracteres • 1 SMS
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
