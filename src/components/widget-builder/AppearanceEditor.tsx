import { ColorPicker } from './ColorPicker';
import { FontSelector } from './FontSelector';
import type { WidgetAppearance } from '../../pages/WidgetBuilder';
import styles from './AppearanceEditor.module.css';

interface AppearanceEditorProps {
  appearance: WidgetAppearance;
  onChange: (updates: Partial<WidgetAppearance>) => void;
}

interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  text: string;
}

const colorPalettes: ColorPalette[] = [
  { name: 'Ocean', primary: '#0369A1', secondary: '#BAE6FD', bg: '#F0F9FF', text: '#0C4A6E' },
  { name: 'Foret', primary: '#15803D', secondary: '#BBF7D0', bg: '#F0FDF4', text: '#14532D' },
  { name: 'Sunset', primary: '#EA580C', secondary: '#FED7AA', bg: '#FFF7ED', text: '#7C2D12' },
  { name: 'Lavande', primary: '#7C3AED', secondary: '#DDD6FE', bg: '#F5F3FF', text: '#4C1D95' },
  { name: 'Ardoise', primary: '#334155', secondary: '#CBD5E1', bg: '#F8FAFC', text: '#0F172A' },
  { name: 'Rose', primary: '#DB2777', secondary: '#FBCFE8', bg: '#FDF2F8', text: '#831843' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function AppearanceEditor({ appearance, onChange }: AppearanceEditorProps) {
  const contrastRatio = getContrastRatio(appearance.textColor, appearance.backgroundColor);

  let contrastBadgeClass = styles.contrastBadgeFail;
  let contrastLabel = 'Echec';
  if (contrastRatio >= 4.5) {
    contrastBadgeClass = styles.contrastBadgePass;
    contrastLabel = 'AA \u2713';
  } else if (contrastRatio >= 3.0) {
    contrastBadgeClass = styles.contrastBadgeWarn;
    contrastLabel = 'AA Large';
  }

  return (
    <div className={styles.container}>
      {/* Colors Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Couleurs</h4>

        <div className={styles.palettesRow}>
          {colorPalettes.map((palette) => (
            <button
              key={palette.name}
              type="button"
              className={styles.paletteItem}
              title={palette.name}
              onClick={() =>
                onChange({
                  primaryColor: palette.primary,
                  secondaryColor: palette.secondary,
                  backgroundColor: palette.bg,
                  textColor: palette.text,
                })
              }
            >
              <div className={styles.paletteBar} style={{ backgroundColor: palette.primary }} />
              <div className={styles.paletteBar} style={{ backgroundColor: palette.secondary }} />
              <div className={styles.paletteBar} style={{ backgroundColor: palette.bg }} />
              <div className={styles.paletteBar} style={{ backgroundColor: palette.text }} />
            </button>
          ))}
        </div>

        <div className={styles.colorGrid}>
          <ColorPicker
            label="Couleur principale"
            value={appearance.primaryColor}
            onChange={(color) => onChange({ primaryColor: color })}
          />
          <ColorPicker
            label="Couleur secondaire"
            value={appearance.secondaryColor}
            onChange={(color) => onChange({ secondaryColor: color })}
          />
          <ColorPicker
            label="Arriere-plan"
            value={appearance.backgroundColor}
            onChange={(color) => onChange({ backgroundColor: color })}
          />
          <ColorPicker
            label="Texte"
            value={appearance.textColor}
            onChange={(color) => onChange({ textColor: color })}
          />
        </div>

        <div className={styles.contrastRow}>
          <span className={`${styles.contrastBadge} ${contrastBadgeClass}`}>
            {contrastLabel}
          </span>
          <span className={styles.contrastRatio}>
            {contrastRatio.toFixed(1)}:1
          </span>
        </div>
      </section>

      {/* Typography Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Typographie</h4>

        <FontSelector
          label="Police"
          value={appearance.fontFamily}
          onChange={(font) => onChange({ fontFamily: font })}
        />
      </section>

      {/* Style Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Style</h4>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="border-radius-slider">Arrondi des coins</label>
          <div className={styles.sliderContainer}>
            <input
              id="border-radius-slider"
              type="range"
              min="0"
              max="24"
              value={appearance.borderRadius}
              onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{appearance.borderRadius}px</span>
          </div>
          <div className={styles.radiusPreview}>
            <div
              className={styles.radiusBox}
              style={{ borderRadius: appearance.borderRadius }}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <span className={styles.label}>Mode d&apos;affichage</span>
          <div className={styles.modeCards}>
            <button
              type="button"
              className={`${styles.modeCard} ${appearance.mode === 'light' ? styles.modeCardActive : ''}`}
              onClick={() => onChange({ mode: 'light' })}
              style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
            >
              <span className={styles.modeIcon}>{'\u2600\uFE0F'}</span>
              <span className={styles.modeLabel}>Clair</span>
            </button>
            <button
              type="button"
              className={`${styles.modeCard} ${appearance.mode === 'dark' ? styles.modeCardActive : ''}`}
              onClick={() => onChange({ mode: 'dark' })}
              style={{ backgroundColor: '#18181B', color: '#FFFFFF' }}
            >
              <span className={styles.modeIcon}>{'\uD83C\uDF19'}</span>
              <span className={styles.modeLabel}>Sombre</span>
            </button>
            <button
              type="button"
              className={`${styles.modeCard} ${appearance.mode === 'auto' ? styles.modeCardActive : ''}`}
              onClick={() => onChange({ mode: 'auto' })}
              style={{ background: 'linear-gradient(135deg, #FFFFFF 50%, #18181B 50%)', color: '#1A1A1A' }}
            >
              <span className={styles.modeIcon}>{'\u2600\uFE0F\uD83C\uDF19'}</span>
              <span className={styles.modeLabel}>Auto</span>
            </button>
          </div>
          <p className={styles.hint}>
            Le mode automatique s&apos;adapte aux preferences systeme de l&apos;utilisateur.
          </p>
        </div>
      </section>
    </div>
  );
}
