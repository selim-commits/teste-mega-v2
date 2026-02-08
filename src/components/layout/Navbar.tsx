import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Users, User } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];
  const userInitial = (userName?.[0] || 'U').toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/', { replace: true });
  };

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className={styles.navbar}>
      {/* Left: hamburger (mobile) + logo */}
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
        <span className={styles.logo}>Rooom</span>
      </div>

      {/* Right: avatar */}
      <div className={styles.right}>
        <div className={styles.avatarContainer} ref={menuRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu utilisateur"
            aria-expanded={menuOpen}
          >
            <span>{userInitial}</span>
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <div className={styles.menuUser}>
                <span className={styles.menuName}>{userName}</span>
                <span className={styles.menuEmail}>{userEmail}</span>
              </div>

              <div className={styles.menuDivider} />

              <button className={styles.menuItem} onClick={() => handleNavigate('/settings')}>
                <Settings size={16} />
                Parametres
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigate('/team')}>
                <Users size={16} />
                Equipe
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigate('/clients')}>
                <User size={16} />
                Clients
              </button>

              <div className={styles.menuDivider} />

              <button className={`${styles.menuItem} ${styles.menuLogout}`} onClick={handleLogout}>
                <LogOut size={16} />
                Se deconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
