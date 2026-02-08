import { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Copy,
  Check,
  Trash2,
  Coffee,
  X,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Checkbox';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import styles from './Availability.module.css';

const STORAGE_KEY = 'rooom_availability_settings';

interface BreakTime {
  id: string;
  start: string;
  end: string;
}

interface ScheduleDay {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  breaks: BreakTime[];
}

type ExceptionType = 'blocked' | 'special';

interface DateException {
  id: string;
  date: string;
  type: ExceptionType;
  label: string;
  start: string;
  end: string;
}

interface AvailabilityData {
  schedule: ScheduleDay[];
  exceptions: DateException[];
}

const generateId = (): string => crypto.randomUUID();

const defaultSchedule: ScheduleDay[] = [
  { day: 'Lundi', enabled: true, start: '09:00', end: '18:00', breaks: [] },
  { day: 'Mardi', enabled: true, start: '09:00', end: '18:00', breaks: [] },
  { day: 'Mercredi', enabled: true, start: '09:00', end: '18:00', breaks: [] },
  { day: 'Jeudi', enabled: true, start: '09:00', end: '18:00', breaks: [] },
  { day: 'Vendredi', enabled: true, start: '09:00', end: '18:00', breaks: [] },
  { day: 'Samedi', enabled: false, start: '10:00', end: '16:00', breaks: [] },
  { day: 'Dimanche', enabled: false, start: '', end: '', breaks: [] },
];

const defaultData: AvailabilityData = {
  schedule: defaultSchedule,
  exceptions: [],
};

function loadData(): AvailabilityData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AvailabilityData;
      // Migration: ensure breaks array exists on all days
      if (parsed.schedule) {
        parsed.schedule = parsed.schedule.map((d) => ({
          ...d,
          breaks: d.breaks ?? [],
        }));
      }
      if (!parsed.exceptions) {
        parsed.exceptions = [];
      }
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return defaultData;
}

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function computeWeeklyHours(schedule: ScheduleDay[]): number {
  let totalMinutes = 0;
  for (const day of schedule) {
    if (!day.enabled || !day.start || !day.end) continue;
    const dayMinutes = timeToMinutes(day.end) - timeToMinutes(day.start);
    if (dayMinutes <= 0) continue;
    let breakMinutes = 0;
    for (const brk of day.breaks) {
      if (brk.start && brk.end) {
        const brkMins = timeToMinutes(brk.end) - timeToMinutes(brk.start);
        if (brkMins > 0) breakMinutes += brkMins;
      }
    }
    totalMinutes += Math.max(0, dayMinutes - breakMinutes);
  }
  return totalMinutes / 60;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function Availability() {
  const [data, setData] = useState<AvailabilityData>(loadData);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [newException, setNewException] = useState<Omit<DateException, 'id'>>({
    date: '',
    type: 'blocked',
    label: '',
    start: '',
    end: '',
  });
  const { success, info, error: notifyError } = useNotifications();

  const schedule = data.schedule;
  const exceptions = data.exceptions;

  const updateExceptions = useCallback((newExceptions: DateException[]) => {
    setData((prev) => ({ ...prev, exceptions: newExceptions }));
  }, []);

  // --- Day toggle ---
  const toggleDay = useCallback((index: number) => {
    setData((prev) => {
      const newSchedule = prev.schedule.map((d, i) =>
        i === index ? { ...d, enabled: !d.enabled } : d
      );
      return { ...prev, schedule: newSchedule };
    });
  }, []);

  // --- Update time ---
  const updateTime = useCallback((index: number, field: 'start' | 'end', value: string) => {
    setData((prev) => {
      const newSchedule = prev.schedule.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      );
      return { ...prev, schedule: newSchedule };
    });
  }, []);

  // --- Breaks ---
  const addBreak = useCallback((dayIndex: number) => {
    setData((prev) => {
      const newSchedule = prev.schedule.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          breaks: [...d.breaks, { id: generateId(), start: '12:00', end: '13:00' }],
        };
      });
      return { ...prev, schedule: newSchedule };
    });
  }, []);

  const removeBreak = useCallback((dayIndex: number, breakId: string) => {
    setData((prev) => {
      const newSchedule = prev.schedule.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          breaks: d.breaks.filter((b) => b.id !== breakId),
        };
      });
      return { ...prev, schedule: newSchedule };
    });
  }, []);

  const updateBreakTime = useCallback(
    (dayIndex: number, breakId: string, field: 'start' | 'end', value: string) => {
      setData((prev) => {
        const newSchedule = prev.schedule.map((d, i) => {
          if (i !== dayIndex) return d;
          return {
            ...d,
            breaks: d.breaks.map((b) =>
              b.id === breakId ? { ...b, [field]: value } : b
            ),
          };
        });
        return { ...prev, schedule: newSchedule };
      });
    },
    []
  );

  // --- Duplicate schedule ---
  const duplicateSchedule = useCallback(() => {
    setData((prev) => {
      const firstEnabled = prev.schedule.find((d) => d.enabled);
      if (!firstEnabled) return prev;
      const newSchedule = prev.schedule.map((d) => ({
        ...d,
        start: firstEnabled.start,
        end: firstEnabled.end,
        enabled: firstEnabled.enabled,
        breaks: firstEnabled.breaks.map((b) => ({ ...b, id: generateId() })),
      }));
      info(
        'Horaires dupliques',
        'Les horaires du premier jour actif ont ete appliques a tous les jours'
      );
      return { ...prev, schedule: newSchedule };
    });
  }, [info]);

  // --- Exceptions ---
  const openExceptionModal = useCallback(() => {
    setNewException({ date: '', type: 'blocked', label: '', start: '', end: '' });
    setExceptionModalOpen(true);
  }, []);

  const addException = useCallback(() => {
    if (!newException.date) {
      notifyError('Date requise', 'Veuillez selectionner une date');
      return;
    }
    if (!newException.label.trim()) {
      notifyError('Libelle requis', 'Veuillez saisir un libelle pour cette exception');
      return;
    }
    if (newException.type === 'special' && (!newException.start || !newException.end)) {
      notifyError('Horaires requis', 'Veuillez definir les horaires pour cette exception');
      return;
    }
    const exception: DateException = {
      ...newException,
      id: generateId(),
      label: newException.label.trim(),
    };
    updateExceptions([...exceptions, exception]);
    setExceptionModalOpen(false);
    info('Exception ajoutee', `${exception.label} le ${formatDate(exception.date)}`);
  }, [newException, exceptions, updateExceptions, info, notifyError]);

  const removeException = useCallback(
    (exceptionId: string) => {
      updateExceptions(exceptions.filter((e) => e.id !== exceptionId));
    },
    [exceptions, updateExceptions]
  );

  // --- Save ---
  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    success(
      'Modifications enregistrees',
      'Vos horaires de disponibilite ont ete sauvegardes'
    );
  }, [data, success]);

  // --- Dynamic stats ---
  const openDaysCount = useMemo(
    () => schedule.filter((d) => d.enabled).length,
    [schedule]
  );

  const weeklyHours = useMemo(() => computeWeeklyHours(schedule), [schedule]);

  const timeInputStyle: React.CSSProperties = {
    padding: 'var(--space-2)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
  };

  return (
    <div className={styles.page}>
      <Header
        title="Disponibilite"
        subtitle="Configurez vos horaires d'ouverture"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.animateIn}>
            <Card padding="md" className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: 'var(--accent-blue)15' }}
              >
                <Clock size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{formatHours(weeklyHours)}</span>
                <span className={styles.statLabel}>Heures/semaine</span>
              </div>
            </Card>
          </div>
          <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
            <Card padding="md" className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: 'var(--accent-green)15' }}
              >
                <Calendar size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{openDaysCount}</span>
                <span className={styles.statLabel}>Jours ouverts</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Weekly Schedule */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Horaires hebdomadaires</h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy size={16} />}
              onClick={duplicateSchedule}
            >
              Dupliquer
            </Button>
          </div>

          <div className={styles.scheduleGrid}>
            {schedule.map((day, index) => (
              <div key={day.day}>
                <div
                  className={`${styles.scheduleRow} ${styles.animateInLeft}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className={styles.scheduleDay}>{day.day}</span>
                  <Switch
                    checked={day.enabled}
                    onChange={() => toggleDay(index)}
                  />
                  {day.enabled ? (
                    <div className={styles.scheduleTime}>
                      <input
                        type="time"
                        value={day.start}
                        onChange={(e) => updateTime(index, 'start', e.target.value)}
                        style={timeInputStyle}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => updateTime(index, 'end', e.target.value)}
                        style={timeInputStyle}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Coffee size={14} />}
                        onClick={() => addBreak(index)}
                        title="Ajouter une pause"
                      />
                    </div>
                  ) : (
                    <span className={styles.scheduleClosed}>Ferme</span>
                  )}
                </div>

                {/* Breaks for this day */}
                {day.enabled &&
                  day.breaks.map((brk) => (
                    <div
                      key={brk.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-3)',
                        paddingLeft: 'var(--space-8)',
                        marginTop: 'var(--space-1)',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <Coffee
                        size={14}
                        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                      />
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Pause
                      </span>
                      <input
                        type="time"
                        value={brk.start}
                        onChange={(e) =>
                          updateBreakTime(index, brk.id, 'start', e.target.value)
                        }
                        style={{ ...timeInputStyle, fontSize: 'var(--text-xs)' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>a</span>
                      <input
                        type="time"
                        value={brk.end}
                        onChange={(e) =>
                          updateBreakTime(index, brk.id, 'end', e.target.value)
                        }
                        style={{ ...timeInputStyle, fontSize: 'var(--text-xs)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeBreak(index, brk.id)}
                        title="Supprimer la pause"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 'var(--space-1)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                          transition: 'color var(--duration-fast)',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = 'var(--state-error)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = 'var(--text-muted)')
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Exceptions */}
        <Card padding="lg" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Exceptions & Conges</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={openExceptionModal}
            >
              Ajouter
            </Button>
          </div>

          {exceptions.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={48} />
              <h3>Aucune exception</h3>
              <p>Ajoutez des jours feries ou des periodes de vacances</p>
            </div>
          ) : (
            <div className={styles.list}>
              {exceptions
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((exception) => (
                  <div key={exception.id} className={styles.listItem}>
                    <div className={styles.listItemInfo}>
                      <div
                        className={styles.listItemIcon}
                        style={{
                          backgroundColor:
                            exception.type === 'blocked'
                              ? 'var(--state-error-light)'
                              : 'var(--accent-primary-light)',
                          color:
                            exception.type === 'blocked'
                              ? 'var(--state-error)'
                              : 'var(--accent-primary)',
                        }}
                      >
                        {exception.type === 'blocked' ? (
                          <AlertCircle size={18} />
                        ) : (
                          <Clock size={18} />
                        )}
                      </div>
                      <div className={styles.listItemText}>
                        <span className={styles.listItemTitle}>
                          {exception.label}
                        </span>
                        <span className={styles.listItemSubtitle}>
                          {formatDate(exception.date)}
                          {exception.type === 'special' &&
                            exception.start &&
                            exception.end &&
                            ` — ${exception.start} a ${exception.end}`}
                          {exception.type === 'blocked' && ' — Ferme'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.listItemActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => removeException(exception.id)}
                        title="Supprimer cette exception"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 'var(--space-4)',
          }}
        >
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleSave}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      {/* Exception Modal */}
      <Modal
        isOpen={exceptionModalOpen}
        onClose={() => setExceptionModalOpen(false)}
        size="sm"
      >
        <ModalHeader
          title="Ajouter une exception"
          subtitle="Jour ferie, vacances ou horaires speciaux"
          onClose={() => setExceptionModalOpen(false)}
        />
        <ModalBody>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            {/* Date */}
            <div>
              <label
                htmlFor="exception-date"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Date
              </label>
              <input
                id="exception-date"
                type="date"
                value={newException.date}
                onChange={(e) =>
                  setNewException((prev) => ({ ...prev, date: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}
              />
            </div>

            {/* Label */}
            <div>
              <label
                htmlFor="exception-label"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Libelle
              </label>
              <input
                id="exception-label"
                type="text"
                value={newException.label}
                onChange={(e) =>
                  setNewException((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="Ex: Jour ferie, Vacances..."
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label
                htmlFor="exception-type"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Type
              </label>
              <input id="exception-type" type="hidden" value={newException.type} />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() =>
                    setNewException((prev) => ({
                      ...prev,
                      type: 'blocked',
                      start: '',
                      end: '',
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: 'var(--space-3)',
                    border: `2px solid ${
                      newException.type === 'blocked'
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    background:
                      newException.type === 'blocked'
                        ? 'var(--accent-primary-light)'
                        : 'var(--bg-primary)',
                    color:
                      newException.type === 'blocked'
                        ? 'var(--accent-primary)'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    transition: 'all var(--duration-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <AlertCircle size={16} />
                  Ferme
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewException((prev) => ({
                      ...prev,
                      type: 'special',
                      start: '09:00',
                      end: '17:00',
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: 'var(--space-3)',
                    border: `2px solid ${
                      newException.type === 'special'
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    background:
                      newException.type === 'special'
                        ? 'var(--accent-primary-light)'
                        : 'var(--bg-primary)',
                    color:
                      newException.type === 'special'
                        ? 'var(--accent-primary)'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    transition: 'all var(--duration-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Clock size={16} />
                  Horaires speciaux
                </button>
              </div>
            </div>

            {/* Special hours */}
            {newException.type === 'special' && (
              <div>
                <label
                  htmlFor="exception-start-time"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Horaires
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <input
                    id="exception-start-time"
                    type="time"
                    value={newException.start}
                    onChange={(e) =>
                      setNewException((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    style={{
                      flex: 1,
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    a
                  </span>
                  <input
                    type="time"
                    value={newException.end}
                    onChange={(e) =>
                      setNewException((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    style={{
                      flex: 1,
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
              width: '100%',
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setExceptionModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={addException}
            >
              Ajouter
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
}
