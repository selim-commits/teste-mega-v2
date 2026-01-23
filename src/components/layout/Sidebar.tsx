import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  path: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Menu structure matching Acuity Scheduling
const navSections: NavSection[] = [
  {
    label: 'Aperçu',
    items: [
      { label: 'Calendrier', path: '/spaces' },
      { label: 'Page Rendez-vous', path: '/bookings' },
      { label: 'Clients', path: '/clients' },
      { label: 'Factures', path: '/finance' },
      { label: 'Rapports', path: '/reports' },
    ],
  },
  {
    label: 'Paramètres de l\'entreprise',
    items: [
      { label: 'Disponibilité', path: '/availability' },
      { label: 'Types de rendez-vous', path: '/appointment-types' },
      { label: 'Packs, cadeaux et abonnements', path: '/packs' },
      { label: 'Intégrations', path: '/integrations' },
      { label: 'Synchroniser vos différents calendriers', path: '/calendar-sync' },
      { label: 'Paramètres de paiement', path: '/payments' },
    ],
  },
  {
    label: 'Notifications',
    items: [
      { label: 'E-mails client', path: '/notifications/email' },
      { label: 'Text Messages client', path: '/notifications/sms' },
      { label: 'Alertes relatives aux réservations', path: '/notifications/alerts' },
    ],
  },
];

// Calendar helpers
const DAYS = ['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Generate calendar days
  const days: { day: number; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
      isPast: true,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday =
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const isPast = new Date(year, month, i) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday,
      isPast: isPast && !isToday,
    });
  }

  // Next month days to fill remaining
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
      isPast: false,
    });
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <span className={styles.calendarMonth}>
          {MONTHS[month]} {year}
        </span>
        <div className={styles.calendarNav}>
          <button onClick={prevMonth} className={styles.calendarNavBtn}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className={styles.calendarNavBtn}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        {DAYS.map((day) => (
          <div key={day} className={styles.calendarDayName}>
            {day}
          </div>
        ))}
        {days.map((d, i) => (
          <div
            key={i}
            className={cn(
              styles.calendarDay,
              !d.isCurrentMonth && styles.calendarDayOther,
              d.isToday && styles.calendarDayToday,
              d.isPast && styles.calendarDayPast
            )}
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoText}>acuity:scheduling</span>
      </div>

      {/* Scrollable content: Calendar + Navigation */}
      <nav className={styles.nav}>
        {/* Mini Calendar */}
        <MiniCalendar />

        {navSections.map((section) => (
          <div key={section.label} className={styles.navSection}>
            <span className={styles.navLabel}>{section.label}</span>
            <ul className={styles.navList}>
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(styles.navItem, isActive && styles.active)
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile at Bottom */}
      <div className={styles.userProfile}>
        <div className={styles.userAvatar}>
          <span>S</span>
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Selim Conrad</span>
          <span className={styles.userEmail}>selim@09h29.com</span>
        </div>
      </div>
    </aside>
  );
}
