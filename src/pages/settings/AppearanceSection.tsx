import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../stores/uiStore';
import type { Theme } from '../../stores/uiStore';
import styles from '../Settings.module.css';
import appearanceStyles from './AppearanceSection.module.css';

const themeOptions: { id: Theme; label: string; description: string; icon: typeof Sun }[] = [
  {
    id: 'light',
    label: 'Clair',
    description: 'Interface lumineuse, ideale pour les environnements bien eclaires',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Sombre',
    description: 'Interface sombre, reduit la fatigue oculaire en conditions de faible luminosite',
    icon: Moon,
  },
  {
    id: 'system',
    label: 'Systeme',
    description: 'S\'adapte automatiquement aux preferences de votre systeme d\'exploitation',
    icon: Monitor,
  },
];

export function AppearanceSection() {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const { success } = useNotifications();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const label = themeOptions.find((o) => o.id === newTheme)?.label ?? newTheme;
    success('Theme mis a jour', `Le theme "${label}" a ete applique.`);
  };

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Apparence</h2>
          <p className={styles.sectionDescription}>
            Personnalisez l&apos;apparence de votre espace de travail
          </p>
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.formGroup}>
            <span className={styles.subsectionTitle}>Theme de l&apos;interface</span>
            <p className={styles.subsectionDescription}>
              Choisissez le mode d&apos;affichage qui vous convient. Le mode actif est : <strong>{effectiveTheme === 'dark' ? 'sombre' : 'clair'}</strong>.
            </p>
          </div>

          <div className={appearanceStyles.themeGrid}>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.id;
              return (
                <button
                  key={option.id}
                  className={`${appearanceStyles.themeCard} ${isSelected ? appearanceStyles.themeCardActive : ''}`}
                  onClick={() => handleThemeChange(option.id)}
                  type="button"
                  aria-pressed={isSelected}
                >
                  <div className={appearanceStyles.themeCardIcon}>
                    <Icon size={24} />
                  </div>
                  <div className={appearanceStyles.themeCardContent}>
                    <span className={appearanceStyles.themeCardLabel}>{option.label}</span>
                    <span className={appearanceStyles.themeCardDescription}>{option.description}</span>
                  </div>
                  {isSelected && (
                    <div className={appearanceStyles.themeCardCheck}>
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
