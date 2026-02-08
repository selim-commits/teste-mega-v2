import { useState, useMemo } from 'react';
import {
  Database,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { useNotifications } from '../../stores/uiStore';
import { useMigration } from '../../hooks/useMigration';
import styles from '../Settings.module.css';
import migrationStyles from './DataMigration.module.css';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const units = ['o', 'Ko', 'Mo'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function DataMigrationSection() {
  const { success, error: notifyError, warning } = useNotifications();
  const {
    status,
    progress,
    error,
    hasLocalData,
    isDemoMode,
    getDataSummary,
    migrateToSupabase,
    migrateFromSupabase,
    clearLocalStorage,
    resetMigration,
  } = useMigration();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const summary = useMemo(() => getDataSummary(), [getDataSummary]);

  const populatedCategories = useMemo(
    () => summary.categories.filter((c) => c.itemCount > 0),
    [summary.categories]
  );

  const handleMigrateToSupabase = async () => {
    if (isDemoMode) {
      warning(
        'Mode demo',
        'La migration est simulee en mode demo. Connectez Supabase pour migrer reellement.'
      );
    }
    try {
      await migrateToSupabase();
      success(
        'Migration terminee',
        `${populatedCategories.length} categories ont ete migrees avec succes.`
      );
    } catch {
      notifyError(
        'Erreur de migration',
        'Une erreur est survenue lors de la migration.'
      );
    }
  };

  const handleMigrateFromSupabase = async () => {
    if (isDemoMode) {
      warning(
        'Mode demo',
        'L\'import est simule en mode demo. Connectez Supabase pour importer reellement.'
      );
    }
    try {
      await migrateFromSupabase();
      success(
        'Import termine',
        'Les donnees ont ete importees depuis Supabase.'
      );
    } catch {
      notifyError(
        'Erreur d\'import',
        'Une erreur est survenue lors de l\'import.'
      );
    }
  };

  const handleClearLocalStorage = () => {
    clearLocalStorage();
    setShowClearConfirm(false);
    success(
      'Cache efface',
      'Toutes les donnees locales de l\'application ont ete supprimees.'
    );
  };

  const progressPercentage =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Donnees & Migration</h2>
          <p className={styles.sectionDescription}>
            Gerez vos donnees locales et preparez la migration vers Supabase
          </p>
        </div>

        {/* Resume des donnees */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Resume des donnees locales</h3>
          <p className={styles.subsectionDescription}>
            Donnees actuellement stockees dans votre navigateur (localStorage)
          </p>

          <div className={migrationStyles.statsGrid}>
            <div className={migrationStyles.statCard}>
              <div className={migrationStyles.statIcon}>
                <HardDrive size={20} />
              </div>
              <div className={migrationStyles.statContent}>
                <span className={migrationStyles.statValue}>{summary.totalKeys}</span>
                <span className={migrationStyles.statLabel}>Categories</span>
              </div>
            </div>
            <div className={migrationStyles.statCard}>
              <div className={migrationStyles.statIcon}>
                <Database size={20} />
              </div>
              <div className={migrationStyles.statContent}>
                <span className={migrationStyles.statValue}>{summary.totalItems}</span>
                <span className={migrationStyles.statLabel}>Elements</span>
              </div>
            </div>
            <div className={migrationStyles.statCard}>
              <div className={migrationStyles.statIcon}>
                <Cloud size={20} />
              </div>
              <div className={migrationStyles.statContent}>
                <span className={migrationStyles.statValue}>
                  {formatBytes(summary.totalSizeBytes)}
                </span>
                <span className={migrationStyles.statLabel}>Taille totale</span>
              </div>
            </div>
          </div>

          {/* Liste des categories */}
          {populatedCategories.length > 0 ? (
            <div className={migrationStyles.categoryList}>
              {populatedCategories.map((cat) => (
                <div key={cat.key} className={migrationStyles.categoryItem}>
                  <div className={migrationStyles.categoryInfo}>
                    <span className={migrationStyles.categoryLabel}>{cat.label}</span>
                    <span className={migrationStyles.categoryDescription}>
                      {cat.description}
                    </span>
                  </div>
                  <div className={migrationStyles.categoryMeta}>
                    <span className={migrationStyles.categoryCount}>
                      {cat.itemCount} {cat.itemCount > 1 ? 'elements' : 'element'}
                    </span>
                    <span className={migrationStyles.categorySize}>
                      {formatBytes(cat.sizeBytes)}
                    </span>
                  </div>
                  <div className={migrationStyles.categoryStatus}>
                    {cat.migrated ? (
                      <span className={migrationStyles.statusMigrated}>
                        <CheckCircle2 size={14} />
                        Migre
                      </span>
                    ) : (
                      <span className={migrationStyles.statusPending}>
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={migrationStyles.emptyState}>
              <Database size={32} />
              <p>Aucune donnee locale detectee</p>
            </div>
          )}
        </Card>

        {/* Migration vers Supabase */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Migration vers Supabase</h3>
          <p className={styles.subsectionDescription}>
            Transferez vos donnees locales vers la base de donnees Supabase pour
            une persistance durable et un acces multi-appareils
          </p>

          {isDemoMode && (
            <div className={migrationStyles.demoNotice}>
              <AlertCircle size={16} />
              <div>
                <strong>Mode demo actif</strong>
                <p>
                  Les variables d'environnement Supabase ne sont pas configurees.
                  La migration sera simulee (log en console uniquement).
                  Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour
                  activer la migration reelle.
                </p>
              </div>
            </div>
          )}

          {/* Barre de progression */}
          {status === 'in_progress' && (
            <div className={migrationStyles.progressSection}>
              <Progress
                value={progressPercentage}
                max={100}
                showLabel
                label={progress.currentCategory || 'Migration en cours...'}
                variant="default"
              />
              <span className={migrationStyles.progressDetail}>
                {progress.current} / {progress.total} categories
              </span>
            </div>
          )}

          {/* Statut complete */}
          {status === 'completed' && (
            <div className={migrationStyles.statusBanner}>
              <CheckCircle2 size={16} />
              <span>Migration terminee avec succes</span>
            </div>
          )}

          {/* Statut erreur */}
          {status === 'error' && error && (
            <div className={migrationStyles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={migrationStyles.actionRow}>
            <Button
              variant="primary"
              icon={<Upload size={16} />}
              onClick={handleMigrateToSupabase}
              loading={status === 'in_progress'}
              disabled={!hasLocalData || status === 'in_progress'}
            >
              Migrer vers Supabase
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={handleMigrateFromSupabase}
              loading={status === 'in_progress'}
              disabled={status === 'in_progress'}
            >
              Importer depuis Supabase
            </Button>
            {status === 'completed' || status === 'error' ? (
              <Button
                variant="ghost"
                icon={<RefreshCw size={16} />}
                onClick={resetMigration}
              >
                Reinitialiser
              </Button>
            ) : null}
          </div>
        </Card>

        {/* Gestion du cache local */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Donnees locales</h3>
          <p className={styles.subsectionDescription}>
            Gerez le cache de donnees stocke dans votre navigateur.
            Cette action est irreversible.
          </p>

          {!showClearConfirm ? (
            <div className={migrationStyles.actionRow}>
              <Button
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={() => setShowClearConfirm(true)}
                disabled={!hasLocalData}
              >
                Effacer le cache local
              </Button>
            </div>
          ) : (
            <div className={migrationStyles.confirmSection}>
              <div className={migrationStyles.confirmMessage}>
                <AlertCircle size={16} />
                <span>
                  Etes-vous sur de vouloir supprimer toutes les donnees locales ?
                  Cette action est irreversible et supprimera {summary.totalKeys} categories
                  ({summary.totalItems} elements).
                </span>
              </div>
              <div className={migrationStyles.actionRow}>
                <Button
                  variant="danger"
                  onClick={handleClearLocalStorage}
                >
                  Confirmer la suppression
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
