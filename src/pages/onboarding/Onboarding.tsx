import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { StudioProfile } from './steps/StudioProfile';
import { FirstSpace } from './steps/FirstSpace';
import { BusinessHours } from './steps/BusinessHours';
import { Complete } from './steps/Complete';
import styles from './Onboarding.module.css';

export interface OnboardingData {
  studioName: string;
  studioType: string;
  city: string;
  spaceName: string;
  capacity: string;
  hourlyRate: string;
  workDays: string[];
  openTime: string;
  closeTime: string;
}

const INITIAL_DATA: OnboardingData = {
  studioName: '',
  studioType: '',
  city: '',
  spaceName: '',
  capacity: '',
  hourlyRate: '',
  workDays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
  openTime: '09:00',
  closeTime: '19:00',
};

const STEPS = [
  { label: 'Votre studio', component: StudioProfile },
  { label: 'Premier espace', component: FirstSpace },
  { label: 'Horaires', component: BusinessHours },
  { label: 'Terminé', component: Complete },
];

export function Onboarding() {
  useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const updateData = (partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const finish = () => {
    navigate('/dashboard');
  };

  const StepComponent = STEPS[currentStep].component;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Rooom</Link>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className={styles.stepCount}>
          {currentStep + 1} / {STEPS.length}
        </span>
      </header>

      <div className={styles.content}>
        {/* Sidebar steps */}
        <aside className={styles.sidebar}>
          <nav className={styles.stepList}>
            {STEPS.map((step, i) => (
              <div
                key={step.label}
                className={`${styles.stepItem} ${i === currentStep ? styles.stepItemActive : ''} ${i < currentStep ? styles.stepItemDone : ''}`}
              >
                <span className={styles.stepDot}>
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Step content */}
        <main className={styles.main}>
          <div className={styles.stepContent} key={currentStep}>
            <StepComponent
              data={data}
              updateData={updateData}
              onNext={next}
              onBack={back}
              onFinish={finish}
              isLastStep={isLastStep}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Onboarding;
