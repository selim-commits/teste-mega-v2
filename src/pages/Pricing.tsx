import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Minus, ChevronDown, ArrowRight } from 'lucide-react';
import styles from './Pricing.module.css';

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

const PLANS = [
  {
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    badge: 'Essai 14 jours',
    description: 'Pour decouvrir Rooom et gerer un espace.',
    features: [
      '1 espace',
      'Reservations en ligne',
      'Gestion clients',
      'Facturation basique',
      'Support email',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    name: 'Solo',
    price: { monthly: 49, yearly: 39 },
    badge: 'Populaire',
    description: 'Pour les studios independants qui veulent grandir.',
    features: [
      'Espaces illimites',
      'Tout Starter +',
      'Packs & offres',
      'Inventaire equipements',
      'Widgets personnalisables',
      'Integrations tierces',
      'Support prioritaire',
    ],
    cta: 'Essayer 14 jours',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: { monthly: 99, yearly: 79 },
    badge: null,
    description: 'Pour les studios multi-espaces et equipes.',
    features: [
      'Tout Solo +',
      'AI Console & suggestions',
      'AI Pricing dynamique',
      'Automations & workflows',
      'Rapports avances',
      'Benchmarking marche',
      'Onboarding dedie',
      'Support telephone',
    ],
    cta: 'Essayer 14 jours',
    highlighted: false,
  },
];

const COMPARISON_FEATURES = [
  { name: 'Espaces', starter: '1', solo: 'Illimite', pro: 'Illimite' },
  { name: 'Reservations en ligne', starter: true, solo: true, pro: true },
  { name: 'Gestion clients', starter: true, solo: true, pro: true },
  { name: 'Facturation', starter: 'Basique', solo: 'Complete', pro: 'Complete' },
  { name: 'Packs & offres', starter: false, solo: true, pro: true },
  { name: 'Inventaire', starter: false, solo: true, pro: true },
  { name: 'Widgets embed', starter: false, solo: true, pro: true },
  { name: 'Integrations', starter: false, solo: true, pro: true },
  { name: 'AI Console', starter: false, solo: false, pro: true },
  { name: 'AI Pricing', starter: false, solo: false, pro: true },
  { name: 'Automations', starter: false, solo: false, pro: true },
  { name: 'Rapports avances', starter: false, solo: false, pro: true },
  { name: 'Benchmarking', starter: false, solo: false, pro: true },
  { name: 'Support', starter: 'Email', solo: 'Prioritaire', pro: 'Telephone' },
];

const FAQ_ITEMS = [
  {
    question: 'Puis-je changer de formule a tout moment ?',
    answer: 'Oui, vous pouvez passer d\'une formule a une autre a tout moment depuis vos parametres. Le changement prend effet immediatement et la facturation est ajustee au prorata.',
  },
  {
    question: 'Y a-t-il un engagement ?',
    answer: 'Non, aucun engagement. Vous pouvez resilier votre abonnement a tout moment. La resiliation prend effet a la fin de la periode de facturation en cours.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: 'Nous acceptons les cartes Visa, Mastercard et American Express. Les paiements sont securises par Stripe.',
  },
  {
    question: 'Mes donnees sont-elles en securite ?',
    answer: 'Oui, vos donnees sont hebergees au sein de l\'Union europeenne, chiffrees en transit et au repos. Nous sommes conformes au RGPD.',
  },
  {
    question: 'Proposez-vous un essai gratuit ?',
    answer: 'Oui, toutes les formules incluent un essai gratuit de 14 jours sans carte bancaire requise. Vous pouvez explorer toutes les fonctionnalites avant de vous engager.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
      <button className={styles.faqQuestion} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <ChevronDown size={20} className={styles.faqChevron} />
      </button>
      <div className={styles.faqAnswer}>
        <p className={styles.faqAnswerText}>{answer}</p>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? <Check size={18} className={styles.checkIcon} /> : <Minus size={16} className={styles.minusIcon} />;
  }
  return <span>{value}</span>;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Tarifs</p>
        <h1 className={styles.heroTitle}>Tarifs simples et transparents</h1>
        <p className={styles.heroSubtitle}>
          Choisissez la formule adaptee a votre studio. Sans engagement, sans surprise.
        </p>

        <div className={styles.toggle}>
          <span className={`${styles.toggleLabel} ${!annual ? styles.toggleLabelActive : ''}`}>Mensuel</span>
          <button
            className={styles.toggleSwitch}
            onClick={() => setAnnual(!annual)}
            role="switch"
            aria-checked={annual}
            aria-label="Basculer entre tarif mensuel et annuel"
          >
            <span className={`${styles.toggleKnob} ${annual ? styles.toggleKnobActive : ''}`} />
          </button>
          <span className={`${styles.toggleLabel} ${annual ? styles.toggleLabelActive : ''}`}>
            Annuel <span className={styles.toggleBadge}>-20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <RevealSection className={styles.cardsSection}>
        <div className={styles.cardsGrid}>
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className={`${styles.card} ${plan.highlighted ? styles.cardHighlighted : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {plan.badge && (
                <span className={`${styles.cardBadge} ${plan.highlighted ? styles.cardBadgeHighlighted : ''}`}>
                  {plan.badge}
                </span>
              )}
              <h3 className={styles.cardName}>{plan.name}</h3>
              <div className={styles.cardPrice}>
                <span className={styles.cardAmount}>
                  {plan.price.monthly === 0 ? 'Gratuit' : `${annual ? plan.price.yearly : plan.price.monthly}\u00A0\u20AC`}
                </span>
                {plan.price.monthly > 0 && <span className={styles.cardPeriod}>/ mois</span>}
              </div>
              <p className={styles.cardDesc}>{plan.description}</p>
              <ul className={styles.cardFeatures}>
                {plan.features.map(f => (
                  <li key={f} className={styles.cardFeature}>
                    <Check size={16} className={styles.cardFeatureIcon} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`${styles.cardCta} ${plan.highlighted ? styles.cardCtaHighlighted : ''}`}
                onClick={() => navigate('/signup')}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* Comparison Table */}
      <RevealSection className={styles.comparisonSection}>
        <h2 className={styles.comparisonTitle}>Comparaison detaillee</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableFeatureHeader}>Fonctionnalite</th>
                <th className={styles.tablePlanHeader}>Starter</th>
                <th className={styles.tablePlanHeader}>Solo</th>
                <th className={styles.tablePlanHeader}>Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map(feat => (
                <tr key={feat.name} className={styles.tableRow}>
                  <td className={styles.tableFeatureCell}>{feat.name}</td>
                  <td className={styles.tableCell}><CellValue value={feat.starter} /></td>
                  <td className={styles.tableCell}><CellValue value={feat.solo} /></td>
                  <td className={styles.tableCell}><CellValue value={feat.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevealSection>

      {/* FAQ */}
      <RevealSection className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Questions frequentes</h2>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map(item => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </RevealSection>

      {/* CTA Final */}
      <RevealSection className={styles.ctaSection}>
        <p className={styles.ctaEyebrow}>Pret a commencer ?</p>
        <h2 className={styles.ctaHeadline}>
          Lancez votre studio sur Rooom<br />en moins de 5 minutes.
        </h2>
        <button className={styles.ctaButton} onClick={() => navigate('/signup')}>
          Commencer gratuitement <ArrowRight size={16} />
        </button>
      </RevealSection>
    </div>
  );
}

export default Pricing;
