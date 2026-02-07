import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { WidgetType, WidgetBehavior } from '../../pages/WidgetBuilder';
import styles from './BehaviorEditor.module.css';

interface BehaviorEditorProps {
  behavior: WidgetBehavior;
  onChange: (updates: Partial<WidgetBehavior>) => void;
  widgetType: WidgetType;
}

const positionOptions = [
  { value: 'bottom-right', label: 'Bas droite' },
  { value: 'bottom-left', label: 'Bas gauche' },
  { value: 'top-right', label: 'Haut droite' },
  { value: 'top-left', label: 'Haut gauche' },
];

const animationOptions = [
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'scale', label: 'Zoom' },
];

export function BehaviorEditor({ behavior, onChange, widgetType }: BehaviorEditorProps) {
  return (
    <div className={styles.container}>
      {/* Position Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Position & Affichage</h4>

        <div className={styles.formGroup}>
          <Select
            label="Position du widget"
            options={positionOptions}
            value={behavior.position}
            onChange={(pos) => onChange({ position: pos as WidgetBehavior['position'] })}
            fullWidth
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Animation d'ouverture"
            options={animationOptions}
            value={behavior.animationType}
            onChange={(anim) => onChange({ animationType: anim as WidgetBehavior['animationType'] })}
            fullWidth
          />
        </div>

        {/* Mobile Toggle */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Afficher sur mobile</span>
            <span className={styles.toggleDescription}>
              Le widget sera visible sur les appareils mobiles
            </span>
          </div>
          <label className={styles.toggle} aria-label="Afficher sur mobile">
            <input
              type="checkbox"
              checked={behavior.showOnMobile}
              onChange={(e) => onChange({ showOnMobile: e.target.checked })}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </section>

      {/* Auto-open Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Ouverture automatique</h4>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Activer l'ouverture automatique</span>
            <span className={styles.toggleDescription}>
              Le widget s'ouvre apres un delai
            </span>
          </div>
          <label className={styles.toggle} aria-label="Activer l'ouverture automatique">
            <input
              type="checkbox"
              checked={behavior.autoOpen}
              onChange={(e) => onChange({ autoOpen: e.target.checked })}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        {behavior.autoOpen && (
          <div className={styles.formGroup}>
            <Input
              label="Delai avant ouverture (secondes)"
              type="number"
              min={1}
              max={60}
              value={behavior.autoOpenDelay.toString()}
              onChange={(e) => onChange({ autoOpenDelay: parseInt(e.target.value) || 5 })}
              fullWidth
            />
          </div>
        )}
      </section>

      {/* Interaction Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Interactions</h4>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Fermer au clic exterieur</span>
            <span className={styles.toggleDescription}>
              Le widget se ferme quand on clique en dehors
            </span>
          </div>
          <label className={styles.toggle} aria-label="Fermer au clic exterieur">
            <input
              type="checkbox"
              checked={behavior.closeOnOutsideClick}
              onChange={(e) => onChange({ closeOnOutsideClick: e.target.checked })}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </section>

      {/* Type-specific behaviors */}
      {widgetType === 'booking' && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Parametres de reservation</h4>
          <p className={styles.infoText}>
            Les parametres avances de reservation (duree par defaut, tampon entre rendez-vous, etc.)
            sont configurables dans les Parametres {">"} Reservations.
          </p>
        </section>
      )}

      {widgetType === 'chat' && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Parametres du chat</h4>
          <p className={styles.infoText}>
            Configurez les reponses automatiques et les messages predefinies dans la console AI.
          </p>
        </section>
      )}

      {widgetType === 'packs' && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Affichage des packs</h4>
          <p className={styles.infoText}>
            Les packs affiches sont ceux configures dans la section Inventaire.
            Vous pouvez modifier leur ordre et visibilite directement depuis cette section.
          </p>
        </section>
      )}
    </div>
  );
}
