import { useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react';
import { Send, Mail, Clock } from 'lucide-react';
import styles from './Contact.module.css';

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

const SUBJECTS = [
  'Question generale',
  'Demande de demo',
  'Support technique',
  'Partenariat',
  'Autre',
];

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Veuillez entrer votre nom';
    if (!email.trim()) newErrors.email = 'Veuillez entrer votre email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (!subject) newErrors.subject = 'Veuillez choisir un sujet';
    if (!message.trim()) newErrors.message = 'Veuillez entrer votre message';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.successPage}>
          <div className={styles.successIcon}>
            <Send size={32} />
          </div>
          <h2 className={styles.successTitle}>Message envoye</h2>
          <p className={styles.successText}>
            Merci pour votre message. Notre equipe vous repondra dans les 24 heures.
          </p>
          <button className={styles.successButton} onClick={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}>
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Contact</p>
        <h1 className={styles.heroTitle}>Parlons de votre studio</h1>
        <p className={styles.heroSubtitle}>
          Une question, une demande de demo ou besoin d'aide ? Nous sommes la.
        </p>
      </section>

      <RevealSection className={styles.contentSection}>
        <div className={styles.contentGrid}>
          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label htmlFor="contact-name" className={styles.label}>Nom</label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="Votre nom"
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="contact-email" className={styles.label}>Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="votre@email.com"
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="contact-subject" className={styles.label}>Sujet</label>
              <select
                id="contact-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className={`${styles.select} ${errors.subject ? styles.inputError : ''}`}
              >
                <option value="">Choisir un sujet</option>
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.subject && <span className={styles.errorText}>{errors.subject}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="contact-message" className={styles.label}>Message</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                placeholder="Decrivez votre demande..."
                rows={6}
              />
              {errors.message && <span className={styles.errorText}>{errors.message}</span>}
            </div>

            <button type="submit" className={styles.submitButton}>
              Envoyer le message <Send size={16} />
            </button>
          </form>

          {/* Info sidebar */}
          <div className={styles.infoSidebar}>
            <div className={styles.infoCard}>
              <Mail size={20} className={styles.infoIcon} />
              <h3 className={styles.infoTitle}>Email</h3>
              <p className={styles.infoText}>contact@rooom.studio</p>
            </div>
            <div className={styles.infoCard}>
              <Clock size={20} className={styles.infoIcon} />
              <h3 className={styles.infoTitle}>Temps de reponse</h3>
              <p className={styles.infoText}>Moins de 24 heures en jours ouvrables</p>
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}

export default Contact;
