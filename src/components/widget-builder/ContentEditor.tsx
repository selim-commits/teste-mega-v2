import { Input } from '../ui/Input';
import { Link2 } from 'lucide-react';
import type { WidgetType, WidgetContent } from '../../pages/WidgetBuilder';
import styles from './ContentEditor.module.css';

interface ContentEditorProps {
  content: WidgetContent;
  onChange: (updates: Partial<WidgetContent>) => void;
  widgetType: WidgetType;
}

export function ContentEditor({ content, onChange, widgetType }: ContentEditorProps) {
  return (
    <div className={styles.container}>
      {/* Logo Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Logo & Marque</h4>

        <div className={styles.formGroup}>
          <Input
            label="URL du logo"
            placeholder="https://example.com/logo.png"
            value={content.logoUrl}
            onChange={(e) => onChange({ logoUrl: e.target.value })}
            icon={<Link2 size={16} />}
            fullWidth
            hint="Format recommande: PNG ou SVG, 200x200px minimum"
          />
          {content.logoUrl && (
            <div className={styles.logoPreview}>
              <img
                src={content.logoUrl}
                alt="Logo preview"
                className={styles.logoImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Text Content Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Textes</h4>

        <div className={styles.formGroup}>
          <Input
            label="Titre principal"
            placeholder="Reservez votre session"
            value={content.title}
            onChange={(e) => onChange({ title: e.target.value })}
            fullWidth
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Sous-titre"
            placeholder="Choisissez un creneau qui vous convient"
            value={content.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            fullWidth
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Texte du bouton"
            placeholder="Reserver maintenant"
            value={content.buttonText}
            onChange={(e) => onChange({ buttonText: e.target.value })}
            fullWidth
          />
        </div>

        {widgetType === 'chat' && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="welcome-message">Message de bienvenue</label>
            <textarea
              id="welcome-message"
              className={styles.textarea}
              placeholder="Bienvenue! Comment pouvons-nous vous aider?"
              value={content.welcomeMessage}
              onChange={(e) => onChange({ welcomeMessage: e.target.value })}
              rows={3}
            />
            <span className={styles.hint}>
              Ce message apparait lorsque le chat s'ouvre.
            </span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="success-message">Message de confirmation</label>
          <textarea
            id="success-message"
            className={styles.textarea}
            placeholder="Merci! Votre reservation a ete confirmee."
            value={content.successMessage}
            onChange={(e) => onChange({ successMessage: e.target.value })}
            rows={3}
          />
          <span className={styles.hint}>
            Affiche apres une action reussie (reservation, message envoye, etc.)
          </span>
        </div>
      </section>

      {/* Type-specific content */}
      {widgetType === 'packs' && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Affichage des packs</h4>
          <p className={styles.infoText}>
            Les packs seront automatiquement recuperes depuis votre configuration ROOOM.
            Vous pouvez personnaliser l'ordre et la visibilite dans les parametres de comportement.
          </p>
        </section>
      )}

      {widgetType === 'booking' && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Configuration des reservations</h4>
          <p className={styles.infoText}>
            Les creneaux disponibles et les services seront recuperes depuis votre configuration ROOOM.
            Assurez-vous d'avoir configure vos horaires et services dans les parametres.
          </p>
        </section>
      )}
    </div>
  );
}
