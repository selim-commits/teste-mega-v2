import { motion } from 'framer-motion';
import type { WidgetAppearance } from '../../pages/WidgetBuilder';
import styles from './ThemePresets.module.css';

interface ThemePresetsProps {
  onSelect: (preset: WidgetAppearance) => void;
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
];

export function ThemePresets({ onSelect }: ThemePresetsProps) {
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Themes rapides</h4>
      <div className={styles.presets}>
        {presets.map((preset) => (
          <motion.button
            key={preset.id}
            type="button"
            className={styles.preset}
            onClick={() => onSelect(preset.appearance)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
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
          </motion.button>
        ))}
      </div>
    </div>
  );
}
