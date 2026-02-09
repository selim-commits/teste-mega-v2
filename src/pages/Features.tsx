import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, Receipt, Package, Palette, Brain, Workflow, BarChart3, ArrowRight
} from 'lucide-react';
import styles from './Features.module.css';

function RevealSection({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);
  return (
    <section ref={ref} className={`${styles.reveal} ${visible ? styles.revealVisible : ''} ${className ?? ''}`}>
      {children}
    </section>
  );
}

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Reservations en ligne',
    description: 'Calendrier intelligent avec prevention des double-bookings, types de rendez-vous personnalisables et synchronisation Google Calendar.',
  },
  {
    icon: Users,
    title: 'Gestion clients & CRM',
    description: 'Fiches clients detaillees, historique complet des reservations, portail client et verification d\'identite integree.',
  },
  {
    icon: Receipt,
    title: 'Facturation & paiements',
    description: 'Factures automatiques, suivi des paiements, export comptable et tableau de bord financier en temps reel.',
  },
  {
    icon: Package,
    title: 'Inventaire & equipements',
    description: 'Gestion de vos equipements, association espace-materiel, suivi de l\'etat et alertes de maintenance.',
  },
  {
    icon: Palette,
    title: 'Widgets personnalisables',
    description: 'Integrez un widget de reservation, chat en direct ou catalogue de packs directement sur votre site web.',
  },
  {
    icon: Brain,
    title: 'Assistant AI',
    description: 'Console AI pour analyser votre activite, suggestions de tarification dynamique et benchmarking du marche.',
  },
  {
    icon: Workflow,
    title: 'Automations & workflows',
    description: 'Automatisez les emails de confirmation, rappels, suivis post-session et parcours client complets.',
  },
  {
    icon: BarChart3,
    title: 'Reporting & analytics',
    description: 'Rapports personnalisables, export CSV/PDF, KPIs en temps reel et comparaison avec le marche.',
  },
];

const STEPS = [
  { number: '01', title: 'Creez votre compte', description: 'Inscription gratuite en 30 secondes. Aucune carte bancaire requise.' },
  { number: '02', title: 'Configurez votre studio', description: 'Ajoutez vos espaces, horaires, tarifs et equipements en quelques clics.' },
  { number: '03', title: 'Recevez des reservations', description: 'Partagez votre lien ou integrez un widget. Vos clients reservent en autonomie.' },
];

export function Features() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Fonctionnalites</p>
        <h1 className={styles.heroTitle}>Tout pour gerer votre studio</h1>
        <p className={styles.heroSubtitle}>
          Une plateforme complete concue pour les photographes et videoastes professionnels.
        </p>
        <button className={styles.heroCta} onClick={() => navigate('/signup')}>
          Commencer gratuitement <ArrowRight size={16} />
        </button>
      </section>

      {/* Bento Grid */}
      <RevealSection className={styles.gridSection}>
        <div className={styles.bentoGrid}>
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className={styles.bentoCard} style={{ animationDelay: `${i * 80}ms` }}>
                <div className={styles.bentoIcon}>
                  <Icon size={24} />
                </div>
                <h3 className={styles.bentoTitle}>{feat.title}</h3>
                <p className={styles.bentoDesc}>{feat.description}</p>
              </div>
            );
          })}
        </div>
      </RevealSection>

      {/* How it works */}
      <RevealSection className={styles.stepsSection}>
        <p className={styles.stepsEyebrow}>Comment ca marche</p>
        <h2 className={styles.stepsTitle}>Pret en 3 etapes</h2>
        <div className={styles.stepsGrid}>
          {STEPS.map((step) => (
            <div key={step.number} className={styles.step}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* CTA Final */}
      <RevealSection className={styles.ctaSection}>
        <p className={styles.ctaEyebrow}>Convaincu ?</p>
        <h2 className={styles.ctaHeadline}>
          Rejoignez les studios qui ont<br />choisi Rooom.
        </h2>
        <button className={styles.ctaButton} onClick={() => navigate('/signup')}>
          Essayer gratuitement <ArrowRight size={16} />
        </button>
      </RevealSection>
    </div>
  );
}

export default Features;
