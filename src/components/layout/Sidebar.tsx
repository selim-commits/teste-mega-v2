import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Menu structure matching Acuity Scheduling
const navSections: NavSection[] = [
  {
    label: 'Aperçu',
    items: [
      { label: 'Tableau de bord', path: '/dashboard' },
      { label: 'Calendrier', path: '/spaces' },
      { label: 'Page Rendez-vous', path: '/bookings' },
      { label: 'Clients', path: '/clients' },
      { label: 'Portail Client', path: '/client-portal' },
      { label: 'Verification d\'identite', path: '/identity-verification' },
      { label: 'Avis & Notes', path: '/reviews' },
      { label: 'Galerie Photos', path: '/photo-gallery' },
      { label: 'Factures', path: '/finance' },
      { label: 'Rapports', path: '/reports' },
      { label: 'Benchmarking', path: '/benchmarking' },
    ],
  },
  {
    label: 'Paramètres de l\'entreprise',
    items: [
      { label: 'Disponibilité', path: '/availability' },
      { label: 'Types de rendez-vous', path: '/appointment-types' },
      { label: 'Packs, cadeaux et abonnements', path: '/packs' },
      { label: 'Inventaire', path: '/inventory' },
      { label: 'Tâches', path: '/tasks' },
      { label: 'Intégrations', path: '/integrations' },
      { label: 'Synchroniser vos différents calendriers', path: '/calendar-sync' },
      { label: 'Paramètres de paiement', path: '/payments' },
      { label: 'Tarification', path: '/revenue' },
      { label: 'Controle d\'acces', path: '/access-control' },
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
  {
    label: 'Outils avancés',
    items: [
      { label: 'Widget Builder', path: '/widgets' },
      { label: 'Automations', path: '/automations' },
      { label: 'AI Console', path: '/ai' },
      { label: 'AI Pricing', path: '/ai-pricing' },
      { label: 'Messages', path: '/chat' },
      { label: 'Documentation API', path: '/api-docs' },
      { label: 'Webhooks', path: '/webhooks' },
    ],
  },
  {
    label: 'Portails',
    items: [
      { label: 'Portail Proprietaire', path: '/owner-portal' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Équipe', path: '/team' },
      { label: 'Paramètres', path: '/settings' },
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
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectMonth = (m: number) => {
    setCurrentDate(new Date(year, m, 1));
    setShowPicker(false);
  };

  const selectYear = (y: number) => {
    setCurrentDate(new Date(y, month, 1));
  };

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
    <div className={styles.calendar} ref={pickerRef}>
      <div className={styles.calendarHeader}>
        <button
          className={styles.calendarMonthBtn}
          onClick={() => setShowPicker(!showPicker)}
        >
          {MONTHS[month]} {year}
          <ChevronDown size={14} />
        </button>
        <div className={styles.calendarNav}>
          <button onClick={prevMonth} className={styles.calendarNavBtn} aria-label="Mois precedent">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className={styles.calendarNavBtn} aria-label="Mois suivant">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Month/Year Picker Dropdown */}
      {showPicker && (
        <div className={styles.monthPicker}>
          {/* Year selector */}
          <div className={styles.yearSelector}>
            <button
              className={styles.yearNavBtn}
              onClick={() => selectYear(year - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.yearLabel}>{year}</span>
            <button
              className={styles.yearNavBtn}
              onClick={() => selectYear(year + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {/* Month grid */}
          <div className={styles.monthGrid}>
            {MONTHS.map((m, i) => (
              <button
                key={m}
                className={cn(
                  styles.monthOption,
                  i === month && styles.monthOptionActive,
                  i === today.getMonth() && year === today.getFullYear() && styles.monthOptionToday
                )}
                onClick={() => selectMonth(i)}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

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

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- Close sidebar on route change only, not when isOpen/onClose change

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(styles.overlay, isOpen && styles.overlayVisible)}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        role="button"
        tabIndex={-1}
        aria-label="Fermer le menu"
      />

      <aside className={cn(styles.sidebar, isOpen && styles.sidebarOpen)}>
        {/* Mobile close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

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
      </aside>
    </>
  );
}
