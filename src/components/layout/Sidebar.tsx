import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Package,
  Users,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  UsersRound,
  Gift,
  MessageCircle,
  Palette,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import styles from './Sidebar.module.css';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Space Control', path: '/spaces' },
  { icon: CalendarCheck, label: 'Réservations', path: '/bookings' },
  { icon: Package, label: 'Inventaire', path: '/inventory' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: UsersRound, label: 'Equipe', path: '/team' },
  { icon: BarChart3, label: 'Finance', path: '/finance' },
  { icon: Gift, label: 'Packs', path: '/packs' },
  { icon: MessageCircle, label: 'Chat', path: '/chat', badge: 'NEW' },
  { icon: Palette, label: 'Widget Builder', path: '/widgets' },
  { icon: Bot, label: 'AI Console', path: '/ai', badge: 'BETA' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Paramètres', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={styles.sidebar}
    >
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap size={20} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className={styles.logoText}
            >
              ROOOM OS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>Menu</span>}
          <ul className={styles.navList}>
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(styles.navItem, isActive && styles.active)
                  }
                >
                  <item.icon size={20} className={styles.navIcon} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.navText}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && !collapsed && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className={styles.bottom}>
        <ul className={styles.navList}>
          {bottomNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(styles.navItem, isActive && styles.active)
                }
              >
                <item.icon size={20} className={styles.navIcon} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.navText}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
