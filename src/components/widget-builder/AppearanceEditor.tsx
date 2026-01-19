import { Select } from '../ui/Select';
import { ColorPicker } from './ColorPicker';
import { FontSelector } from './FontSelector';
import type { WidgetAppearance } from '../../pages/WidgetBuilder';
import styles from './AppearanceEditor.module.css';

interface AppearanceEditorProps {
  appearance: WidgetAppearance;
  onChange: (updates: Partial<WidgetAppearance>) => void;
}

const modeOptions = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'auto', label: 'Automatique' },
];

export function AppearanceEditor({ appearance, onChange }: AppearanceEditorProps) {
  return (
    <div className={styles.container}>
      {/* Colors Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Couleurs</h4>

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
          <label className={styles.label}>Arrondi des coins</label>
          <div className={styles.sliderContainer}>
            <input
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
          <Select
            label="Mode d'affichage"
            options={modeOptions}
            value={appearance.mode}
            onChange={(mode) => onChange({ mode: mode as WidgetAppearance['mode'] })}
            fullWidth
          />
          <p className={styles.hint}>
            Le mode automatique s'adapte aux preferences systeme de l'utilisateur.
          </p>
        </div>
      </section>
    </div>
  );
}
