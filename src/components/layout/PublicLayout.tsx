import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import styles from './PublicLayout.module.css';

export function PublicLayout() {
  // Public pages are always light mode
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    return () => {
      if (previous) root.setAttribute('data-theme', previous);
    };
  }, []);

  return (
    <div className={styles.publicPage}>
      <PublicHeader />
      <main className={styles.publicMain}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
