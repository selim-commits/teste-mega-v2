import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './PublicLayout.module.css';

const NAV_LINKS = [
  { to: '/features', label: 'Fonctionnalites' },
  { to: '/pricing', label: 'Tarifs' },
  { to: '/about', label: 'A propos' },
  { to: '/contact', label: 'Contact' },
];

export function PublicHeader() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={styles.publicHeader}>
      <Link to="/" className={styles.publicLogo}>Rooom</Link>

      <nav className={`${styles.publicNav} ${mobileOpen ? styles.publicNavOpen : ''}`}>
        {NAV_LINKS.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={styles.publicNavLink}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <div className={styles.publicNavActions}>
          <button className={styles.publicNavLogin} onClick={() => { navigate('/login'); setMobileOpen(false); }}>
            Connexion
          </button>
          <button className={styles.publicNavCta} onClick={() => { navigate('/signup'); setMobileOpen(false); }}>
            Commencer
          </button>
        </div>
      </nav>

      <button
        className={styles.mobileMenuBtn}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
}
