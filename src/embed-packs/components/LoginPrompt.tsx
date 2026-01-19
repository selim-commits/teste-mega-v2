// src/embed-packs/components/LoginPrompt.tsx

interface LoginPromptProps {
  onLogin: () => void;
  onContinueAsGuest?: () => void;
  message?: string;
}

export function LoginPrompt({
  onLogin,
  onContinueAsGuest,
  message = 'Connectez-vous pour acceder a votre compte et historique d\'achats',
}: LoginPromptProps) {
  return (
    <div className="rooom-login-prompt">
      <div className="rooom-login-prompt-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 className="rooom-login-prompt-title">Connexion recommandee</h3>
      <p className="rooom-login-prompt-text">{message}</p>
      <div className="rooom-login-prompt-actions">
        <button className="rooom-packs-btn rooom-packs-btn-primary" onClick={onLogin}>
          Se connecter
        </button>
        {onContinueAsGuest && (
          <button className="rooom-packs-btn rooom-packs-btn-secondary" onClick={onContinueAsGuest}>
            Continuer sans compte
          </button>
        )}
      </div>
    </div>
  );
}
