import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Header with Hamburger */}
      <div className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen(true)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span className={styles.mobileLogoText}>acuity:scheduling</span>
      </div>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
