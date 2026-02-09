import type { OnboardingData } from '../Onboarding';
import styles from '../Onboarding.module.css';

interface StepProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  isLastStep: boolean;
}

export function FirstSpace({ data, updateData, onNext, onBack }: StepProps) {
  const canContinue = data.spaceName.trim() && data.capacity && data.hourlyRate;

  return (
    <div>
      <h2 className={styles.stepTitle}>Votre premier espace</h2>
      <p className={styles.stepSubtitle}>
        Configurez votre espace principal. Vous pourrez en ajouter d'autres plus tard.
      </p>

      <div className={styles.stepForm}>
        <div className={styles.stepField}>
          <label htmlFor="space-name" className={styles.stepFieldLabel}>Nom de l'espace</label>
          <input
            id="space-name"
            type="text"
            value={data.spaceName}
            onChange={e => updateData({ spaceName: e.target.value })}
            className={styles.stepInput}
            placeholder="Studio A"
          />
        </div>

        <div className={styles.stepField}>
          <label htmlFor="space-capacity" className={styles.stepFieldLabel}>Capacite (personnes)</label>
          <input
            id="space-capacity"
            type="number"
            min="1"
            value={data.capacity}
            onChange={e => updateData({ capacity: e.target.value })}
            className={styles.stepInput}
            placeholder="10"
          />
        </div>

        <div className={styles.stepField}>
          <label htmlFor="space-rate" className={styles.stepFieldLabel}>Tarif horaire (EUR)</label>
          <input
            id="space-rate"
            type="number"
            min="0"
            step="5"
            value={data.hourlyRate}
            onChange={e => updateData({ hourlyRate: e.target.value })}
            className={styles.stepInput}
            placeholder="50"
          />
        </div>

        <div className={styles.stepActions}>
          <button className={styles.backButton} onClick={onBack}>Retour</button>
          <button
            className={styles.nextButton}
            onClick={onNext}
            disabled={!canContinue}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
