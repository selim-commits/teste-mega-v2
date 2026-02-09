import { useState } from 'react';
import { Trash2, Calendar, MessageCircle, Package, Search } from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/utils';
import type { WidgetConfig, WidgetType } from '../../pages/WidgetBuilder';
import styles from './SavedConfigs.module.css';

interface SavedConfigsProps {
  configs: WidgetConfig[];
  activeConfigId: string | null;
  onLoad: (config: WidgetConfig) => void;
  onDelete: (configId: string) => void;
  onClose: () => void;
}

const typeIcons: Record<WidgetType, typeof Calendar> = {
  booking: Calendar,
  chat: MessageCircle,
  packs: Package,
};

const typeLabels: Record<WidgetType, string> = {
  booking: 'Reservation',
  chat: 'Chat',
  packs: 'Packs',
};

export function SavedConfigs({ configs, activeConfigId, onLoad, onDelete, onClose }: SavedConfigsProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredConfigs = configs.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <ModalHeader
        title="Configurations sauvegardees"
        subtitle={`${configs.length} configuration${configs.length !== 1 ? 's' : ''}`}
        onClose={onClose}
      />
      <ModalBody>
        {configs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Package size={48} />
            </div>
            <h3 className={styles.emptyTitle}>Aucune configuration</h3>
            <p className={styles.emptyText}>
              Vous n'avez pas encore sauvegarde de configuration de widget.
              Personnalisez votre widget et cliquez sur "Sauvegarder" pour creer une configuration.
            </p>
          </div>
        ) : (
          <div className={styles.configList}>
            {configs.length >= 3 && (
              <div className={styles.searchBar}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Rechercher une configuration..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            )}
            {filteredConfigs.map((config) => {
              const Icon = typeIcons[config.type];
              const isActive = config.id === activeConfigId;

              return (
                <div
                  key={config.id}
                  className={`${styles.configItem} ${styles.animateIn} ${isActive ? styles.configItemActive : ''}`}
                >
                  {/* Color preview */}
                  <div className={styles.colorPreview}>
                    <div
                      className={styles.colorSwatch}
                      style={{ backgroundColor: config.appearance.primaryColor }}
                    />
                    <div
                      className={styles.colorSwatch}
                      style={{ backgroundColor: config.appearance.secondaryColor }}
                    />
                    <div
                      className={styles.colorSwatch}
                      style={{ backgroundColor: config.appearance.backgroundColor }}
                    />
                  </div>

                  {/* Config info */}
                  <div className={styles.configInfo}>
                    <div className={styles.configHeader}>
                      <h4 className={styles.configName}>{config.name}</h4>
                      {isActive && (
                        <span className={styles.activeBadge}>Actif</span>
                      )}
                    </div>
                    <div className={styles.configMeta}>
                      <span className={styles.configType}>
                        <Icon size={14} />
                        {typeLabels[config.type]}
                      </span>
                      <span className={styles.configDate}>
                        Modifie {formatDate(config.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.configActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onLoad(config)}
                    >
                      Charger
                    </Button>
                    {pendingDeleteId === config.id ? (
                      <div className={styles.deleteConfirm}>
                        <span className={styles.deleteConfirmText}>Supprimer?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onDelete(config.id);
                            setPendingDeleteId(null);
                          }}
                          className={styles.deleteYes}
                        >
                          Oui
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Non
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => setPendingDeleteId(config.id)}
                        className={styles.deleteButton}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
