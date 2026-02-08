import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './Sidebar.module.css';

interface NavItem {
  /** i18n key under the `nav` namespace (e.g. `"dashboard"` -> `t("nav.dashboard")`) */
  i18nKey: string;
  path: string;
}

interface NavSection {
  /** i18n key under the `nav` namespace for the section heading */
  i18nKey: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Scrollable sections ──
const navSections: NavSection[] = [
  {
    i18nKey: 'daily',
    items: [
      { i18nKey: 'dashboard', path: '/dashboard' },
      { i18nKey: 'calendar', path: '/spaces' },
      { i18nKey: 'bookings', path: '/bookings' },
      { i18nKey: 'messages', path: '/chat' },
      { i18nKey: 'tasks', path: '/tasks' },
    ],
  },
  {
    i18nKey: 'clientsCrm',
    items: [
      { i18nKey: 'clients', path: '/clients' },
      { i18nKey: 'clientPortal', path: '/client-portal' },
      { i18nKey: 'reviews', path: '/reviews' },
      { i18nKey: 'identityVerification', path: '/identity-verification' },
      { i18nKey: 'photoGallery', path: '/photo-gallery' },
    ],
  },
  {
    i18nKey: 'finances',
    items: [
      { i18nKey: 'invoices', path: '/finance' },
      { i18nKey: 'reports', path: '/reports' },
      { i18nKey: 'benchmarking', path: '/benchmarking' },
      { i18nKey: 'packs', path: '/packs' },
      { i18nKey: 'ownerPortal', path: '/owner-portal' },
    ],
  },
  {
    i18nKey: 'operations',
    items: [
      { i18nKey: 'inventory', path: '/inventory' },
      { i18nKey: 'accessControl', path: '/access-control' },
      { i18nKey: 'availability', path: '/availability' },
      { i18nKey: 'appointmentTypes', path: '/appointment-types' },
      { i18nKey: 'calendarSync', path: '/calendar-sync' },
    ],
  },
  {
    i18nKey: 'tools',
    items: [
      { i18nKey: 'widgetBuilder', path: '/widgets' },
      { i18nKey: 'automations', path: '/automations' },
      { i18nKey: 'aiConsole', path: '/ai' },
      { i18nKey: 'aiPricing', path: '/ai-pricing' },
      { i18nKey: 'pricing', path: '/revenue' },
      { i18nKey: 'paymentSettings', path: '/payments' },
      { i18nKey: 'integrations', path: '/integrations' },
    ],
  },
];

// ── Notification sub-items (collapsible in pinned zone) ──
const notificationItems: NavItem[] = [
  { i18nKey: 'clientEmails', path: '/notifications/email' },
  { i18nKey: 'clientSms', path: '/notifications/sms' },
  { i18nKey: 'bookingAlerts', path: '/notifications/alerts' },
];

// ── Pinned items (fixed bottom zone, excluding notifications) ──
const pinnedItems: NavItem[] = [
  { i18nKey: 'team', path: '/team' },
  { i18nKey: 'settings', path: '/settings' },
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
  const { t } = useTranslation();

  // Auto-expand notifications when on a notification route
  const isOnNotificationRoute = location.pathname.startsWith('/notifications');
  const [notificationsOpen, setNotificationsOpen] = useState(isOnNotificationRoute);

  // Keep in sync when navigating to/from notification routes
  useEffect(() => {
    if (isOnNotificationRoute) setNotificationsOpen(true);
  }, [isOnNotificationRoute]);

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
            <div key={section.i18nKey} className={styles.navSection}>
              <span className={styles.navLabel}>{t(`nav.${section.i18nKey}`)}</span>
              <ul className={styles.navList}>
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.active)
                      }
                    >
                      {t(`nav.${item.i18nKey}`)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Fixed bottom zone */}
        <div className={styles.pinnedSection}>
          {/* Collapsible Notifications */}
          <button
            className={cn(styles.collapsibleBtn, isOnNotificationRoute && styles.collapsibleBtnActive)}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-expanded={notificationsOpen}
          >
            <span>{t('nav.notifications')}</span>
            <ChevronDown
              size={16}
              className={cn(styles.chevronIcon, notificationsOpen && styles.chevronOpen)}
            />
          </button>
          {notificationsOpen && (
            <ul className={styles.subList}>
              {notificationItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(styles.navItem, styles.subItem, isActive && styles.active)
                    }
                  >
                    {t(`nav.${item.i18nKey}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          {/* Pinned links */}
          {pinnedItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(styles.navItem, isActive && styles.active)
              }
            >
              {t(`nav.${item.i18nKey}`)}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}
