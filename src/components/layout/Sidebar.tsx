import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarCheck,
  Users,
  FileText,
  BarChart3,
  Clock,
  ListChecks,
  Gift,
  Plug,
  CalendarSync,
  CreditCard,
  Mail,
  MessageSquare,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Package,
  Bot,
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

interface NavSection {
  label: string;
  items: NavItem[];
}

// Menu structure inspired by Acuity Scheduling
const navSections: NavSection[] = [
  {
    label: 'Aperçu',
    items: [
      { icon: Calendar, label: 'Calendrier', path: '/spaces' },
      { icon: CalendarCheck, label: 'Réservations', path: '/bookings' },
      { icon: Users, label: 'Clients', path: '/clients' },
      { icon: FileText, label: 'Factures', path: '/finance' },
      { icon: BarChart3, label: 'Rapports', path: '/reports' },
    ],
  },
  {
    label: 'Paramètres de l\'entreprise',
    items: [
      { icon: Clock, label: 'Disponibilité', path: '/availability' },
      { icon: ListChecks, label: 'Types de rendez-vous', path: '/appointment-types' },
      { icon: Package, label: 'Inventaire', path: '/inventory' },
      { icon: Gift, label: 'Packs & Abonnements', path: '/packs' },
      { icon: Plug, label: 'Intégrations', path: '/integrations' },
      { icon: CalendarSync, label: 'Sync Calendriers', path: '/calendar-sync' },
      { icon: CreditCard, label: 'Paiements', path: '/payments' },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { icon: Mail, label: 'E-mails client', path: '/notifications/email' },
      { icon: MessageSquare, label: 'Messages SMS', path: '/notifications/sms' },
      { icon: Bell, label: 'Alertes réservations', path: '/notifications/alerts' },
    ],
  },
  {
    label: 'Outils avancés',
    items: [
      { icon: Palette, label: 'Widget Builder', path: '/widgets' },
      { icon: Bot, label: 'AI Console', path: '/ai', badge: 'BETA' },
    ],
  },
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

      {/* Main Navigation with Sections */}
      <nav className={styles.nav}>
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={styles.navSection}>
            {!collapsed && (
              <span className={styles.navLabel}>{section.label}</span>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className={styles.sectionDivider} />
            )}
            <ul className={styles.navList}>
              {section.items.map((item) => (
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
        ))}
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
