import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Plus,
  User,
  ChevronDown,
  Command,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.right}>
        {/* Search */}
        <button
          className={styles.iconBtn}
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search size={18} />
          <span className={styles.shortcut}>
            <Command size={10} />K
          </span>
        </button>

        {/* Notifications */}
        <div className={styles.dropdownContainer}>
          <button
            className={cn(styles.iconBtn, showNotifications && styles.active)}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            <span className={styles.notifDot} />
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={styles.dropdown}
              >
                <div className={styles.dropdownHeader}>
                  <span>Notifications</span>
                  <button className={styles.dropdownAction}>Tout marquer lu</button>
                </div>
                <div className={styles.dropdownContent}>
                  <NotificationItem
                    title="Nouvelle réservation"
                    message="Studio A - 14h00 à 18h00"
                    time="Il y a 5 min"
                    type="booking"
                  />
                  <NotificationItem
                    title="Stock bas"
                    message="Ampoules LED - 3 restantes"
                    time="Il y a 1h"
                    type="warning"
                  />
                  <NotificationItem
                    title="Paiement reçu"
                    message="€1,250.00 de Studio XYZ"
                    time="Il y a 2h"
                    type="success"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Booking */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
        >
          Réservation
        </Button>

        {/* Profile */}
        <div className={styles.dropdownContainer}>
          <button
            className={cn(styles.profileBtn, showProfile && styles.active)}
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className={styles.avatar}>
              <User size={16} />
            </div>
            <ChevronDown size={14} className={styles.chevron} />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(styles.dropdown, styles.profileDropdown)}
              >
                <div className={styles.profileInfo}>
                  <div className={styles.profileAvatar}>
                    <User size={20} />
                  </div>
                  <div>
                    <div className={styles.profileName}>Admin Rooom</div>
                    <div className={styles.profileEmail}>admin@rooom.studio</div>
                  </div>
                </div>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem}>Mon profil</button>
                <button className={styles.dropdownItem}>Préférences</button>
                <div className={styles.dropdownDivider} />
                <button className={cn(styles.dropdownItem, styles.danger)}>
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

interface NotificationItemProps {
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'warning' | 'success' | 'info';
}

function NotificationItem({ title, message, time, type }: NotificationItemProps) {
  return (
    <div className={styles.notifItem}>
      <div className={cn(styles.notifIcon, styles[type])} />
      <div className={styles.notifContent}>
        <div className={styles.notifTitle}>{title}</div>
        <div className={styles.notifMessage}>{message}</div>
        <div className={styles.notifTime}>{time}</div>
      </div>
    </div>
  );
}
