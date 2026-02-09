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

const ALL_DAYS = [
  { id: 'lundi', label: 'Lun' },
  { id: 'mardi', label: 'Mar' },
  { id: 'mercredi', label: 'Mer' },
  { id: 'jeudi', label: 'Jeu' },
  { id: 'vendredi', label: 'Ven' },
  { id: 'samedi', label: 'Sam' },
  { id: 'dimanche', label: 'Dim' },
];

export function BusinessHours({ data, updateData, onNext, onBack }: StepProps) {
  const toggleDay = (dayId: string) => {
    const current = data.workDays;
    const updated = current.includes(dayId)
      ? current.filter(d => d !== dayId)
      : [...current, dayId];
    updateData({ workDays: updated });
  };

  const canContinue = data.workDays.length > 0 && data.openTime && data.closeTime;

  return (
    <div>
      <h2 className={styles.stepTitle}>Vos horaires</h2>
      <p className={styles.stepSubtitle}>
        Definissez vos jours et heures d'ouverture. Modifiable a tout moment.
      </p>

      <div className={styles.stepForm}>
        <div className={styles.stepField}>
          <span className={styles.stepFieldLabel}>Jours ouvrables</span>
          <div className={styles.daysGrid}>
            {ALL_DAYS.map(day => (
              <button
                key={day.id}
                type="button"
                className={`${styles.dayToggle} ${data.workDays.includes(day.id) ? styles.dayToggleActive : ''}`}
                onClick={() => toggleDay(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.timeRow}>
          <div className={styles.stepField}>
            <label htmlFor="open-time" className={styles.stepFieldLabel}>Ouverture</label>
            <input
              id="open-time"
              type="time"
              value={data.openTime}
              onChange={e => updateData({ openTime: e.target.value })}
              className={styles.stepInput}
            />
          </div>
          <div className={styles.stepField}>
            <label htmlFor="close-time" className={styles.stepFieldLabel}>Fermeture</label>
            <input
              id="close-time"
              type="time"
              value={data.closeTime}
              onChange={e => updateData({ closeTime: e.target.value })}
              className={styles.stepInput}
            />
          </div>
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
