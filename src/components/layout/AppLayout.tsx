import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { InstallPrompt } from '../ui/InstallPrompt';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <a href="#main-content" className={styles.skipLink}>
        Aller au contenu principal
      </a>

      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      <InstallPrompt />
    </div>
  );
}
