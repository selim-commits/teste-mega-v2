import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './About.module.css';

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

const STATS = [
  { number: '500+', label: 'Studios' },
  { number: '12k', label: 'Reservations / mois' },
  { number: '99.9%', label: 'Uptime' },
  { number: '24h', label: 'Temps de reponse' },
];

const TEAM = [
  { name: 'Alexandre Dubois', role: 'CEO & Co-fondateur', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Marie Laurent', role: 'CTO & Co-fondatrice', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Thomas Moreau', role: 'Head of Product', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
  { name: 'Sophie Martin', role: 'Head of Design', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
];

export function About() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>A propos</p>
        <h1 className={styles.heroTitle}>
          Construire l'outil que les studios meritent
        </h1>
        <p className={styles.heroSubtitle}>
          Rooom est ne de la conviction que les creatifs meritent des outils aussi soignes que leur travail.
        </p>
      </section>

      {/* Story */}
      <RevealSection className={styles.storySection}>
        <div className={styles.storyGrid}>
          <div className={styles.storyImage}>
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
              alt="Equipe Rooom"
              className={styles.storyImg}
            />
          </div>
          <div className={styles.storyContent}>
            <span className={styles.eyebrow}>Notre histoire</span>
            <h2 className={styles.storyTitle}>D'une frustration, une solution.</h2>
            <p className={styles.storyText}>
              En tant qu'anciens gerants de studio photo, nous avons vecu la complexite de jongler entre tableurs, agendas papier et outils disperses. Rooom est la reponse a cette frustration : une plateforme unique, elegante et pensee pour le quotidien des studios creatifs.
            </p>
            <p className={styles.storyText}>
              Depuis 2024, nous accompagnons des centaines de studios dans leur croissance, en leur offrant un outil qui respecte leur exigence de qualite.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* Stats */}
      <RevealSection className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {STATS.map(stat => (
            <div key={stat.label} className={styles.stat}>
              <span className={styles.statNumber}>{stat.number}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* Team */}
      <RevealSection className={styles.teamSection}>
        <p className={styles.teamEyebrow}>L'equipe</p>
        <h2 className={styles.teamTitle}>Les personnes derriere Rooom</h2>
        <div className={styles.teamGrid}>
          {TEAM.map(member => (
            <div key={member.name} className={styles.teamCard}>
              <img src={member.image} alt={member.name} className={styles.teamImage} />
              <h3 className={styles.teamName}>{member.name}</h3>
              <p className={styles.teamRole}>{member.role}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className={styles.ctaSection}>
        <p className={styles.ctaEyebrow}>Rejoignez-nous</p>
        <h2 className={styles.ctaHeadline}>
          Pret a transformer<br />votre studio ?
        </h2>
        <button className={styles.ctaButton} onClick={() => navigate('/signup')}>
          Commencer gratuitement <ArrowRight size={16} />
        </button>
      </RevealSection>
    </div>
  );
}

export default About;
