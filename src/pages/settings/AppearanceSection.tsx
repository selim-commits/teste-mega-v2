import { Sun, Moon, Monitor, Check, Globe } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation, getLocaleLabel } from '../../hooks/useTranslation';
import { useNotifications } from '../../stores/uiStore';
import type { Theme } from '../../stores/uiStore';
import type { SupportedLocale } from '../../lib/i18n';
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
  const { t, locale, setLocale, supportedLocales } = useTranslation();
  const { success } = useNotifications();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const label = themeOptions.find((o) => o.id === newTheme)?.label ?? newTheme;
    success('Theme mis a jour', `Le theme "${label}" a ete applique.`);
  };

  const handleLocaleChange = (newLocale: SupportedLocale) => {
    setLocale(newLocale);
    const label = getLocaleLabel(newLocale);
    success(
      t('settings.languageUpdated'),
      t('settings.languageUpdatedMessage', { label }),
    );
  };

  return (
    <div className={styles.animateIn}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('settings.appearance')}</h2>
          <p className={styles.sectionDescription}>
            Personnalisez l&apos;apparence de votre espace de travail
          </p>
        </div>

        {/* Theme selector */}
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.formGroup}>
            <span className={styles.subsectionTitle}>{t('settings.theme')} de l&apos;interface</span>
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

        {/* Language selector */}
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.formGroup}>
            <span className={styles.subsectionTitle}>{t('settings.language')}</span>
            <p className={styles.subsectionDescription}>
              {t('settings.languageDescription')}
            </p>
          </div>

          <div className={appearanceStyles.localeGrid}>
            {supportedLocales.map((loc) => {
              const isSelected = locale === loc.id;
              return (
                <button
                  key={loc.id}
                  className={`${appearanceStyles.themeCard} ${isSelected ? appearanceStyles.themeCardActive : ''}`}
                  onClick={() => handleLocaleChange(loc.id)}
                  type="button"
                  aria-pressed={isSelected}
                >
                  <div className={appearanceStyles.themeCardIcon}>
                    <Globe size={24} />
                  </div>
                  <div className={appearanceStyles.themeCardContent}>
                    <span className={appearanceStyles.themeCardLabel}>{loc.label}</span>
                    <span className={appearanceStyles.themeCardDescription}>{loc.id.toUpperCase()}</span>
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
