import { Link } from 'react-router-dom';
import styles from './PublicLayout.module.css';

export function PublicFooter() {
  return (
    <footer className={styles.publicFooter}>
      <div className={styles.publicFooterInner}>
        <div className={styles.publicFooterBrand}>
          <span className={styles.publicFooterLogo}>Rooom</span>
          <p className={styles.publicFooterDesc}>
            La plateforme de gestion{'\n'}pour les studios creatifs.
          </p>
        </div>

        <div className={styles.publicFooterColumns}>
          <div className={styles.publicFooterCol}>
            <span className={styles.publicFooterColTitle}>Produit</span>
            <Link to="/features" className={styles.publicFooterLink}>Fonctionnalites</Link>
            <Link to="/pricing" className={styles.publicFooterLink}>Tarifs</Link>
            <Link to="/login" className={styles.publicFooterLink}>Connexion</Link>
            <Link to="/signup" className={styles.publicFooterLink}>Creer un compte</Link>
          </div>
          <div className={styles.publicFooterCol}>
            <span className={styles.publicFooterColTitle}>Legal</span>
            <Link to="/privacy" className={styles.publicFooterLink}>Confidentialite</Link>
            <Link to="/terms" className={styles.publicFooterLink}>CGU</Link>
          </div>
          <div className={styles.publicFooterCol}>
            <span className={styles.publicFooterColTitle}>Support</span>
            <Link to="/contact" className={styles.publicFooterLink}>Contact</Link>
            <Link to="/about" className={styles.publicFooterLink}>A propos</Link>
            <span className={styles.publicFooterLink}>contact@rooom.studio</span>
          </div>
        </div>
      </div>

      <div className={styles.publicFooterBottom}>
        <span>&copy; {new Date().getFullYear()} Rooom. Tous droits reserves.</span>
      </div>
    </footer>
  );
}
