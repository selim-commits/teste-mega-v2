import type { WidgetAppearance } from '../../pages/WidgetBuilder';
import styles from './ThemePresets.module.css';

interface ThemePresetsProps {
  onSelect: (preset: WidgetAppearance) => void;
  appearance?: WidgetAppearance;
}

const presets: Array<{
  id: string;
  name: string;
  appearance: WidgetAppearance;
}> = [
  {
    id: 'minimal',
    name: 'Minimal',
    appearance: {
      primaryColor: '#1A1A1A',
      secondaryColor: '#6B6B6B',
      backgroundColor: '#FFFFFF',
      textColor: '#1A1A1A',
      fontFamily: 'Inter',
      borderRadius: 4,
      mode: 'light',
    },
  },
  {
    id: 'bold',
    name: 'Audacieux',
    appearance: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7C59F',
      backgroundColor: '#FFFFFF',
      textColor: '#2E2E3A',
      fontFamily: 'Montserrat',
      borderRadius: 12,
      mode: 'light',
    },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    appearance: {
      primaryColor: '#1E3A5F',
      secondaryColor: '#8B9DC3',
      backgroundColor: '#FAFAFA',
      textColor: '#1A1A1A',
      fontFamily: 'Playfair Display',
      borderRadius: 8,
      mode: 'light',
    },
  },
  {
    id: 'dark',
    name: 'Sombre',
    appearance: {
      primaryColor: '#6366F1',
      secondaryColor: '#A5B4FC',
      backgroundColor: '#18181B',
      textColor: '#FFFFFF',
      fontFamily: 'Inter',
      borderRadius: 8,
      mode: 'dark',
    },
  },
  {
    id: 'nature',
    name: 'Nature',
    appearance: {
      primaryColor: '#22C55E',
      secondaryColor: '#86EFAC',
      backgroundColor: '#F0FDF4',
      textColor: '#14532D',
      fontFamily: 'Nunito',
      borderRadius: 16,
      mode: 'light',
    },
  },
  {
    id: 'studio',
    name: 'Studio',
    appearance: {
      primaryColor: '#7C3AED',
      secondaryColor: '#DDD6FE',
      backgroundColor: '#FFFFFF',
      textColor: '#1A1A1A',
      fontFamily: 'Poppins',
      borderRadius: 10,
      mode: 'light',
    },
  },
  {
    id: 'tech',
    name: 'Tech',
    appearance: {
      primaryColor: '#0EA5E9',
      secondaryColor: '#7DD3FC',
      backgroundColor: '#0F172A',
      textColor: '#E2E8F0',
      fontFamily: 'Inter',
      borderRadius: 6,
      mode: 'dark',
    },
  },
  {
    id: 'luxe',
    name: 'Luxe',
    appearance: {
      primaryColor: '#B8860B',
      secondaryColor: '#DAA520',
      backgroundColor: '#FFFDF7',
      textColor: '#1A1A1A',
      fontFamily: 'Playfair Display',
      borderRadius: 2,
      mode: 'light',
    },
  },
];

function isPresetActive(preset: WidgetAppearance, current: WidgetAppearance): boolean {
  return (
    preset.primaryColor === current.primaryColor &&
    preset.secondaryColor === current.secondaryColor &&
    preset.backgroundColor === current.backgroundColor &&
    preset.textColor === current.textColor &&
    preset.fontFamily === current.fontFamily &&
    preset.borderRadius === current.borderRadius &&
    preset.mode === current.mode
  );
}

export function ThemePresets({ onSelect, appearance }: ThemePresetsProps) {
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Themes rapides</h4>
      <div className={styles.presets}>
        {presets.map((preset) => {
          const active = appearance ? isPresetActive(preset.appearance, appearance) : false;
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.preset} ${active ? styles.presetActive : ''}`}
              onClick={() => onSelect(preset.appearance)}
            >
              {active && (
                <div className={styles.checkmarkOverlay}>
                  {'\u2713'}
                </div>
              )}
              <div
                className={styles.previewCard}
                style={{
                  backgroundColor: preset.appearance.backgroundColor,
                  borderRadius: preset.appearance.borderRadius,
                }}
              >
                <div
                  className={styles.previewHeader}
                  style={{ backgroundColor: preset.appearance.primaryColor }}
                />
                <div className={styles.previewContent}>
                  <div
                    className={styles.previewLine}
                    style={{ backgroundColor: preset.appearance.textColor }}
                  />
                  <div
                    className={styles.previewLineSm}
                    style={{ backgroundColor: preset.appearance.secondaryColor }}
                  />
                </div>
                <div
                  className={styles.previewButton}
                  style={{
                    backgroundColor: preset.appearance.primaryColor,
                    borderRadius: preset.appearance.borderRadius / 2,
                  }}
                />
              </div>
              <span className={styles.presetName}>{preset.name}</span>
              <div className={styles.presetMeta}>
                <div
                  className={styles.presetColorDot}
                  style={{ backgroundColor: preset.appearance.primaryColor }}
                />
                <span className={styles.presetFont}>{preset.appearance.fontFamily}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
