import { useState, useEffect, useRef, useCallback, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { isDemoMode } from '../lib/supabase';
import styles from './Login.module.css';

type AuthMode = 'login' | 'signup' | 'reset';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
  'User already registered': 'Un compte existe deja avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caracteres',
  'Unable to validate email address: invalid format': 'Format d\'email invalide',
  'Email rate limit exceeded': 'Trop de tentatives, reessayez plus tard',
  'Signup requires a valid password': 'Veuillez entrer un mot de passe valide',
};

function translateError(message: string): string {
  return ERROR_MESSAGES[message] || message;
}

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

function UnderlineInput({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  showToggle,
  toggleValue,
  onToggle,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className={`${styles.inputGroup} ${hasValue ? styles.hasValue : ''} ${focused ? styles.focused : ''}`}>
      <span className={styles.inputLabel}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`${styles.input} ${showToggle ? styles.inputWithIcon : ''}`}
        autoComplete={autoComplete}
      />
      {showToggle && (
        <button
          type="button"
          className={styles.inputToggle}
          onClick={onToggle}
          aria-label={toggleValue ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          tabIndex={-1}
        >
          {toggleValue ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

export function Login() {
  const { signIn, signUp, signInWithOAuth, resetPassword, loading } = useAuthContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = useCallback(() => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  }, []);

  const switchMode = useCallback((newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  }, [resetForm]);

  const validate = (): string | null => {
    if (!email.trim()) return 'Veuillez entrer votre email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format d\'email invalide';
    if (mode === 'reset') return null;
    if (!password) return 'Veuillez entrer votre mot de passe';
    if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caracteres';
    if (mode === 'signup') {
      if (!fullName.trim()) return 'Veuillez entrer votre nom';
      if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // In demo mode, bypass auth entirely
    if (isDemoMode) {
      navigate('/');
      return;
    }

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    if (mode === 'login') {
      const { error: authError } = await signIn(email, password);
      if (authError) setError(translateError(authError.message));
    } else if (mode === 'signup') {
      const { error: authError } = await signUp(email, password, { full_name: fullName });
      if (authError) {
        setError(translateError(authError.message));
      } else {
        switchMode('login');
        setSuccessMessage('Compte cree ! Verifiez votre email pour confirmer votre inscription.');
      }
    } else {
      const { error: authError } = await resetPassword(email);
      if (authError) {
        setError(translateError(authError.message));
      } else {
        setSuccessMessage('Un email de reinitialisation a ete envoye. Verifiez votre boite de reception.');
      }
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setError('');
    const { error: authError } = await signInWithOAuth(provider);
    if (authError) setError(translateError(authError.message));
  };

  const openModal = (authMode: AuthMode) => {
    resetForm();
    setMode(authMode);
    setShowModal(true);
  };

  const titles: Record<AuthMode, { title: string; subtitle: string }> = {
    login: { title: 'Bon retour', subtitle: 'Connectez-vous a votre espace studio.' },
    signup: { title: 'Rejoindre Rooom', subtitle: 'Creez votre compte gratuitement.\nAucune carte requise.' },
    reset: { title: 'Mot de passe oublie', subtitle: 'Entrez votre email pour recevoir un lien de reinitialisation.' },
  };

  const buttonLabels: Record<AuthMode, string> = {
    login: 'Se connecter',
    signup: 'Creer mon compte',
    reset: 'Envoyer le lien',
  };

  const { title, subtitle } = titles[mode];

  return (
    <div className={styles.page}>

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <img
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=85"
          alt=""
          className={styles.heroBg}
        />
        <div className={styles.heroOverlay} />

        <header className={styles.header}>
          <span className={styles.logo}>Rooom</span>
          <nav className={styles.headerNav}>
            <button className={styles.headerLink} onClick={() => openModal('login')}>Connexion</button>
            <button className={styles.headerCta} onClick={() => openModal('signup')}>
              Commencer
            </button>
          </nav>
        </header>

        <div className={styles.heroBottom}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Studio Management Platform</p>
            <h1 className={styles.heroHeadline}>
              L&apos;art de gerer<br />un studio creatif
            </h1>
          </div>
          <div className={styles.heroAside}>
            <p className={styles.heroDesc}>
              Reservations, clients, facturation et analytics reunis dans une plateforme concue pour les photographes et videoastes.
            </p>
            <button className={styles.heroCtaLink} onClick={() => openModal('signup')}>
              Essayer gratuitement <ArrowRight size={16} />
            </button>
          </div>
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
        <button className={styles.ctaButton} onClick={() => openModal('signup')}>
          Essayer gratuitement <ArrowRight size={16} />
        </button>
      </RevealSection>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerBrand}>Rooom</span>
            <p className={styles.footerDesc}>La plateforme de gestion<br />pour les studios creatifs.</p>
          </div>
          <div className={styles.footerRight}>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Produit</span>
              <button className={styles.footerLink} onClick={() => openModal('signup')}>Creer un compte</button>
              <button className={styles.footerLink} onClick={() => openModal('login')}>Se connecter</button>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Contact</span>
              <span className={styles.footerLink}>contact@rooom.studio</span>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>&copy; 2026 Rooom. Tous droits reserves.</span>
        </div>
      </footer>

      {/* ===== AUTH MODAL ===== */}
      {showModal && (
        <div className={styles.overlay} role="presentation" onClick={() => setShowModal(false)}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setShowModal(false)} aria-label="Fermer">
              <X size={24} />
            </button>

            <div className={styles.formSide} key={mode}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>{title}</h2>
                <p className={styles.formSubtitle}>{subtitle}</p>
              </div>

              {error && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                  <AlertCircle size={16} className={styles.alertIcon} />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                  <CheckCircle size={16} className={styles.alertIcon} />
                  <span>{successMessage}</span>
                </div>
              )}

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {mode === 'signup' && (
                  <UnderlineInput label="Nom complet" value={fullName} onChange={setFullName} autoComplete="name" />
                )}
                <UnderlineInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
                {mode !== 'reset' && (
                  <UnderlineInput
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    showToggle
                    toggleValue={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                )}
                {mode === 'signup' && (
                  <UnderlineInput
                    label="Confirmer le mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                )}
                {mode === 'login' && (
                  <button type="button" className={styles.forgotLink} onClick={() => switchMode('reset')}>
                    Mot de passe oublie ?
                  </button>
                )}
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading && <span className={styles.spinner} />}
                  {buttonLabels[mode]}
                </button>
              </form>

              {isDemoMode ? (
                <>
                  <div className={styles.divider}>ou</div>
                  <button type="button" className={styles.demoButton} onClick={() => navigate('/')}>
                    Entrer en mode demo
                  </button>
                </>
              ) : mode !== 'reset' && (
                <>
                  <div className={styles.divider}>ou</div>
                  <button type="button" className={styles.oauthButton} onClick={() => handleOAuth('google')} disabled={loading}>
                    <svg className={styles.oauthIcon} viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuer avec Google
                  </button>
                </>
              )}

              <div className={styles.formFooter}>
                {mode === 'login' && (
                  <span>Pas encore de compte ?<button type="button" className={styles.switchLink} onClick={() => switchMode('signup')}>Creer un compte</button></span>
                )}
                {mode === 'signup' && (
                  <span>Deja un compte ?<button type="button" className={styles.switchLink} onClick={() => switchMode('login')}>Se connecter</button></span>
                )}
                {mode === 'reset' && (
                  <button type="button" className={styles.switchLink} onClick={() => switchMode('login')}>Retour a la connexion</button>
                )}
              </div>
            </div>

            <div className={styles.photoSide}>
              <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80" alt="Studio professionnel" className={styles.photoImage} />
              <div className={styles.photoOverlay}>
                <h3 className={styles.photoTitle}>Gerez votre studio <em>sans effort</em>,<br />uniquement sur Rooom.</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
