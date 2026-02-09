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

const STUDIO_TYPES = [
  'Studio photo',
  'Studio video',
  'Studio photo & video',
  'Studio de podcast',
  'Espace creatif polyvalent',
];

export function StudioProfile({ data, updateData, onNext }: StepProps) {
  const canContinue = data.studioName.trim() && data.studioType && data.city.trim();

  return (
    <div>
      <h2 className={styles.stepTitle}>Parlez-nous de votre studio</h2>
      <p className={styles.stepSubtitle}>
        Ces informations nous aident a personnaliser votre experience.
      </p>

      <div className={styles.stepForm}>
        <div className={styles.stepField}>
          <label htmlFor="studio-name" className={styles.stepFieldLabel}>Nom du studio</label>
          <input
            id="studio-name"
            type="text"
            value={data.studioName}
            onChange={e => updateData({ studioName: e.target.value })}
            className={styles.stepInput}
            placeholder="Mon Studio Photo"
          />
        </div>

        <div className={styles.stepField}>
          <label htmlFor="studio-type" className={styles.stepFieldLabel}>Type de studio</label>
          <select
            id="studio-type"
            value={data.studioType}
            onChange={e => updateData({ studioType: e.target.value })}
            className={styles.stepSelect}
          >
            <option value="">Choisir un type</option>
            {STUDIO_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.stepField}>
          <label htmlFor="studio-city" className={styles.stepFieldLabel}>Ville</label>
          <input
            id="studio-city"
            type="text"
            value={data.city}
            onChange={e => updateData({ city: e.target.value })}
            className={styles.stepInput}
            placeholder="Paris"
          />
        </div>

        <div className={styles.stepActions}>
          <div />
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
