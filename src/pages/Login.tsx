import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Calendar, Users, BarChart3 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
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

export function Login() {
  const { signIn, signUp, signInWithOAuth, resetPassword, loading } = useAuthContext();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

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

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

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

  const titles: Record<AuthMode, { title: string; subtitle: string }> = {
    login: {
      title: 'Bon retour',
      subtitle: 'Connectez-vous a votre espace studio',
    },
    signup: {
      title: 'Creer un compte',
      subtitle: 'Commencez a gerer votre studio en quelques minutes',
    },
    reset: {
      title: 'Mot de passe oublie',
      subtitle: 'Entrez votre email pour recevoir un lien de reinitialisation',
    },
  };

  const { title, subtitle } = titles[mode];

  return (
    <div className={styles.page}>
      {/* Branding Panel */}
      <div className={styles.brandingPanel}>
        <div className={styles.brandingContent}>
          <div className={styles.brandingLogo}>Rooom</div>
          <p className={styles.brandingTagline}>
            La plateforme premium pour gerer votre studio creatif
          </p>
          <div className={styles.brandingDecorator} />
          <div className={styles.brandingFeatures}>
            <div className={styles.brandingFeature}>
              <Calendar size={16} />
              <span>Reservations et planification</span>
            </div>
            <div className={styles.brandingFeature}>
              <Users size={16} />
              <span>Gestion clients et equipe</span>
            </div>
            <div className={styles.brandingFeature}>
              <BarChart3 size={16} />
              <span>Suivi financier et rapports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer} key={mode}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>{title}</h1>
            <p className={styles.formSubtitle}>{subtitle}</p>
          </div>

          {/* Alerts */}
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
            {/* Signup: Name field */}
            {mode === 'signup' && (
              <Input
                label="Nom complet"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User size={18} />}
                fullWidth
                autoComplete="name"
              />
            )}

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
              fullWidth
              autoComplete="email"
            />

            {/* Password (login + signup) */}
            {mode !== 'reset' && (
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                iconRight={
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                fullWidth
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}

            {/* Confirm password (signup) */}
            {mode === 'signup' && (
              <Input
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="Retapez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={18} />}
                fullWidth
                autoComplete="new-password"
              />
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => switchMode('reset')}
              >
                Mot de passe oublie ?
              </button>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {mode === 'login' && 'Se connecter'}
              {mode === 'signup' && 'Creer mon compte'}
              {mode === 'reset' && 'Envoyer le lien'}
            </Button>
          </form>

          {/* OAuth (login + signup) */}
          {mode !== 'reset' && (
            <>
              <div className={styles.divider}>ou</div>
              <button
                type="button"
                className={styles.oauthButton}
                onClick={() => handleOAuth('google')}
                disabled={loading}
              >
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

          {/* Switch mode */}
          <div className={styles.formFooter}>
            {mode === 'login' && (
              <span>
                Pas encore de compte ?
                <button type="button" className={styles.switchLink} onClick={() => switchMode('signup')}>
                  Creer un compte
                </button>
              </span>
            )}
            {mode === 'signup' && (
              <span>
                Deja un compte ?
                <button type="button" className={styles.switchLink} onClick={() => switchMode('login')}>
                  Se connecter
                </button>
              </span>
            )}
            {mode === 'reset' && (
              <span>
                <button type="button" className={styles.switchLink} onClick={() => switchMode('login')}>
                  Retour a la connexion
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
