import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, Heart, Shield, ArrowRight } from 'lucide-react';
import styles from './Agents.module.css';

/* ===== Scroll Reveal ===== */

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

/* ===== Agent Data ===== */

const AGENTS = [
  {
    id: 'yoda',
    name: 'YODA',
    role: 'Analytics & Insights',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    Icon: Brain,
    shortDescription: 'Analyse de donnees, rapports, KPIs et business intelligence',
    description:
      'Plongez dans vos donnees. YODA analyse vos revenus, identifie les tendances clients et vous guide vers les meilleures decisions pour votre studio.',
    capabilities: [
      'Tendances de revenus',
      'Comportement clients',
      'Optimisation des performances',
      'Heures de pointe',
    ],
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    role: 'Automation',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    Icon: Zap,
    shortDescription: 'Workflows, automations, integrations et optimisation systeme',
    description:
      'Automatisez votre quotidien. NEXUS configure vos workflows, envoie vos rappels et genere vos factures sans intervention manuelle.',
    capabilities: [
      'Confirmations automatiques',
      'Rappels intelligents',
      'Facturation automatisee',
      'Alertes maintenance',
    ],
  },
  {
    id: 'nova',
    name: 'NOVA',
    role: 'Client Success',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    Icon: Heart,
    shortDescription: 'Relations clients, communications et satisfaction',
    description:
      'Enchantez vos clients. NOVA personnalise chaque interaction, automatise vos suivis et transforme vos clients en ambassadeurs.',
    capabilities: [
      'Communications personnalisees',
      'Suivi post-session',
      'Collecte de feedback',
      'Programme de fidelite',
    ],
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    role: 'Securite',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    Icon: Shield,
    shortDescription: "Controle d'acces, monitoring, conformite et protection des donnees",
    description:
      'Protegez votre studio. SENTINEL surveille les acces, securise vos donnees et garantit votre conformite RGPD.',
    capabilities: [
      "Logs d'acces",
      'Sauvegardes automatiques',
      'Audit des permissions',
      'Conformite RGPD',
    ],
  },
] as const;

type AgentId = (typeof AGENTS)[number]['id'];

/* ===== Component ===== */

export function Agents() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<AgentId>('yoda');
  const activeAgent = AGENTS.find((a) => a.id === activeId) ?? AGENTS[0];

  return (
    <div className={styles.page}>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Intelligence Artificielle</p>
        <h1 className={styles.heroTitle}>4 agents IA, un seul objectif</h1>
        <p className={styles.heroSubtitle}>
          Chaque agent est specialise dans un domaine cle de la gestion de votre studio.
          Ensemble, ils automatisent, analysent et optimisent votre activite.
        </p>
      </section>

      {/* ===== Agent Selector Tabs ===== */}
      <RevealSection className={styles.selectorSection}>
        <div className={styles.tabs} role="tablist" aria-label="Agents IA">
          {AGENTS.map((agent) => {
            const Icon = agent.Icon;
            const isActive = agent.id === activeId;
            return (
              <button
                key={agent.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${agent.id}`}
                id={`tab-${agent.id}`}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveId(agent.id)}
              >
                <span
                  className={`${styles.tabIcon} ${isActive ? styles.tabIconActive : ''}`}
                  style={{ background: isActive ? agent.gradient : undefined }}
                >
                  <Icon size={20} color={isActive ? '#fff' : undefined} />
                </span>
                <span className={styles.tabName}>{agent.name}</span>
                <span className={styles.tabRole}>{agent.role}</span>
              </button>
            );
          })}
        </div>

        {/* ===== Agent Detail Panel ===== */}
        <div
          key={activeAgent.id}
          id={`panel-${activeAgent.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeAgent.id}`}
          className={styles.detailPanel}
        >
          <div className={styles.detailLeft}>
            <div className={styles.detailIconCircle} style={{ background: activeAgent.gradient }}>
              <activeAgent.Icon size={36} color="#fff" />
            </div>
          </div>

          <div className={styles.detailRight}>
            <p className={styles.detailRole}>{activeAgent.role}</p>
            <h2 className={styles.detailName}>{activeAgent.name}</h2>
            <p className={styles.detailDescription}>{activeAgent.description}</p>

            <div className={styles.capabilitiesGrid}>
              {activeAgent.capabilities.map((cap) => (
                <div key={cap} className={styles.capability}>
                  <span
                    className={styles.capabilityDot}
                    style={{ background: activeAgent.color }}
                  />
                  <span className={styles.capabilityText}>{cap}</span>
                </div>
              ))}
            </div>

            <button
              className={styles.detailCta}
              onClick={() => navigate('/login')}
            >
              Essayer {activeAgent.name} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </RevealSection>

      {/* ===== Overview Grid ===== */}
      <RevealSection className={styles.overviewSection}>
        <p className={styles.overviewEyebrow}>Vue d'ensemble</p>
        <h2 className={styles.overviewTitle}>Chaque agent, une expertise</h2>
        <div className={styles.overviewGrid}>
          {AGENTS.map((agent, i) => {
            const Icon = agent.Icon;
            return (
              <div
                key={agent.id}
                className={styles.overviewCard}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={styles.overviewCardHeader}>
                  <span className={styles.overviewCardIcon} style={{ background: agent.gradient }}>
                    <Icon size={20} color="#fff" />
                  </span>
                  <div>
                    <h3 className={styles.overviewCardName}>{agent.name}</h3>
                    <p className={styles.overviewCardRole}>{agent.role}</p>
                  </div>
                </div>
                <p className={styles.overviewCardDesc}>{agent.shortDescription}</p>
                <ul className={styles.overviewCardList}>
                  {agent.capabilities.map((cap) => (
                    <li key={cap} className={styles.overviewCardItem}>
                      <span className={styles.overviewCardDot} style={{ background: agent.color }} />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </RevealSection>

      {/* ===== CTA Final ===== */}
      <RevealSection className={styles.ctaSection}>
        <p className={styles.ctaEyebrow}>Pret a les rencontrer ?</p>
        <h2 className={styles.ctaHeadline}>
          Decouvrez vos<br />agents IA.
        </h2>
        <button className={styles.ctaButton} onClick={() => navigate('/signup')}>
          Commencer gratuitement <ArrowRight size={16} />
        </button>
      </RevealSection>
    </div>
  );
}

export default Agents;
