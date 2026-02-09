import { CheckCircle, ArrowRight } from 'lucide-react';
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

export function Complete({ data, onFinish }: StepProps) {
  return (
    <div className={styles.completeCenter}>
      <div className={styles.completeIcon}>
        <CheckCircle size={32} />
      </div>
      <h2 className={styles.completeTitle}>Tout est pret !</h2>
      <p className={styles.completeText}>
        Votre studio est configure. Vous pouvez commencer a recevoir des reservations.
      </p>

      <div className={styles.summaryList}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Studio</span>
          <span className={styles.summaryValue}>{data.studioName}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Type</span>
          <span className={styles.summaryValue}>{data.studioType}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Ville</span>
          <span className={styles.summaryValue}>{data.city}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Espace</span>
          <span className={styles.summaryValue}>{data.spaceName}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Tarif</span>
          <span className={styles.summaryValue}>{data.hourlyRate} EUR/h</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Horaires</span>
          <span className={styles.summaryValue}>{data.openTime} - {data.closeTime}</span>
        </div>
      </div>

      <button className={styles.finishButton} onClick={onFinish}>
        Acceder au tableau de bord <ArrowRight size={16} />
      </button>
    </div>
  );
}
