import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './Landing.module.css';

function RevealSection({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <section
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.revealVisible : ''} ${className ?? ''}`}
    >
      {children}
    </section>
  );
}

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroEyebrow}>Studio Management Platform</p>
          <h1 className={styles.heroHeadline}>
            L&apos;art de gerer<br />un studio creatif
          </h1>
          <p className={styles.heroDesc}>
            Reservations, clients, facturation et analytics reunis dans une plateforme concue pour les photographes et videoastes.
          </p>
          <button className={styles.heroCtaBtn} onClick={() => navigate('/signup')}>
            Essayer gratuitement <ArrowRight size={16} />
          </button>
        </div>
        <div className={styles.heroImageWrap}>
          <img
            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=85"
            alt="Studio de musique professionnel"
            className={styles.heroImg}
          />
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {[...Array(2)].map((_, i) => (
            <div className={styles.marqueeGroup} key={i}>
              <span>Reservations</span>
              <span className={styles.marqueeDot} />
              <span>Clients</span>
              <span className={styles.marqueeDot} />
              <span>Facturation</span>
              <span className={styles.marqueeDot} />
              <span>Inventaire</span>
              <span className={styles.marqueeDot} />
              <span>Analytics</span>
              <span className={styles.marqueeDot} />
              <span>Chat en direct</span>
              <span className={styles.marqueeDot} />
              <span>Widgets</span>
              <span className={styles.marqueeDot} />
              <span>Equipes</span>
              <span className={styles.marqueeDot} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== EDITORIAL SECTION 1 ===== */}
      <RevealSection className={styles.editorialSection}>
        <div className={styles.editorialGrid}>
          <div className={styles.editorialQuote}>
            <blockquote className={styles.pullQuote}>
              <span className={styles.pullQuoteMark}>&ldquo;</span>
              Simplifier la gestion, pour se concentrer sur la creation.
            </blockquote>
          </div>
          <div className={styles.editorialImage}>
            <img
              src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80"
              alt="Photographe en studio"
              className={styles.editImg}
            />
          </div>
          <div className={styles.editorialText}>
            <span className={styles.eyebrow}>01 — Tout-en-un</span>
            <h2 className={styles.editorialHeadline}>Votre studio, unifie.</h2>
            <p className={styles.editorialBody}>
              Reservations en ligne, gestion des clients, suivi financier et inventaire d&apos;equipements. Une seule plateforme remplace vos dix outils.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ===== EDITORIAL SECTION 2 ===== */}
      <RevealSection className={styles.editorialSection}>
        <div className={styles.editorialGridReversed}>
          <div className={styles.editorialText}>
            <span className={styles.eyebrow}>02 — Experience premium</span>
            <h2 className={styles.editorialHeadline}>Concu pour les creatifs.</h2>
            <p className={styles.editorialBody}>
              Interface epuree, widgets personnalisables pour votre site, et tableau de bord qui vous donne la vision complete de votre activite.
            </p>
          </div>
          <div className={styles.editorialImage}>
            <img
              src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80"
              alt="Equipement de studio"
              className={styles.editImg}
            />
          </div>
        </div>
      </RevealSection>

      {/* ===== STATS ===== */}
      <RevealSection className={styles.statsSection}>
        <div className={styles.statsInner}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>500+</span>
            <span className={styles.statLabel}>Studios</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>12k</span>
            <span className={styles.statLabel}>Reservations / mois</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>99.9%</span>
            <span className={styles.statLabel}>Uptime</span>
          </div>
        </div>
      </RevealSection>

      {/* ===== FULL IMAGE BREAK ===== */}
      <section className={styles.imageBreak}>
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
          alt="Studio creatif"
          className={styles.imageBreakImg}
        />
      </section>

      {/* ===== CTA SECTION ===== */}
      <RevealSection className={styles.ctaSection}>
        <p className={styles.ctaEyebrow}>Pret a commencer ?</p>
        <h2 className={styles.ctaHeadline}>
          Votre studio merite<br />mieux qu&apos;un tableur.
        </h2>
        <button className={styles.ctaButton} onClick={() => navigate('/signup')}>
          Essayer gratuitement <ArrowRight size={16} />
        </button>
      </RevealSection>
    </div>
  );
}

export default Landing;
