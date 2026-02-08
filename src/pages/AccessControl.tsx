import { useState, useMemo, useCallback } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  BatteryLow,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Smartphone,
  CreditCard,
  History,
  Settings,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import styles from './AccessControl.module.css';

// ---- Types ----

type LockStatus = 'locked' | 'unlocked' | 'offline' | 'low_battery';
type CodeType = 'temporary' | 'permanent' | 'master';
type AccessMethod = 'code' | 'app' | 'nfc';
type AccessAction = 'lock' | 'unlock' | 'denied';

interface SmartLock {
  id: string;
  name: string;
  space: string;
  model: string;
  brand: string;
  status: LockStatus;
  battery: number;
  lastActivity: string;
  autoLockMinutes: number | null;
}

interface AccessCode {
  id: string;
  code: string;
  label: string;
  type: CodeType;
  lockId: string;
  lockName: string;
  assignedTo: string;
  createdAt: string;
  expiresAt: string | null;
  bookingRef: string | null;
  isActive: boolean;
}

interface AccessLog {
  id: string;
  lockId: string;
  lockName: string;
  space: string;
  action: AccessAction;
  method: AccessMethod;
  user: string;
  timestamp: string;
  codeUsed: string | null;
}

// ---- Mock Data ----

const MOCK_LOCKS: SmartLock[] = [
  {
    id: crypto.randomUUID(),
    name: 'Studio A - Entree principale',
    space: 'Studio A',
    model: 'Smart Lock 3.0 Pro',
    brand: 'Nuki',
    status: 'locked',
    battery: 85,
    lastActivity: '2026-02-08T09:15:00',
    autoLockMinutes: 5,
  },
  {
    id: crypto.randomUUID(),
    name: 'Studio B - Porte coulissante',
    space: 'Studio B',
    model: 'Wi-Fi Smart Lock',
    brand: 'August',
    status: 'unlocked',
    battery: 62,
    lastActivity: '2026-02-08T10:30:00',
    autoLockMinutes: 10,
  },
  {
    id: crypto.randomUUID(),
    name: 'Salle maquillage',
    space: 'Salle Maquillage',
    model: 'Assure Lock 2',
    brand: 'Yale',
    status: 'locked',
    battery: 94,
    lastActivity: '2026-02-08T08:45:00',
    autoLockMinutes: 3,
  },
  {
    id: crypto.randomUUID(),
    name: 'Espace lounge',
    space: 'Lounge',
    model: 'Smart Lock 3.0 Pro',
    brand: 'Nuki',
    status: 'low_battery',
    battery: 12,
    lastActivity: '2026-02-08T07:20:00',
    autoLockMinutes: 5,
  },
  {
    id: crypto.randomUUID(),
    name: 'Reserve materiel',
    space: 'Reserve',
    model: 'Encode Plus',
    brand: 'Schlage',
    status: 'locked',
    battery: 78,
    lastActivity: '2026-02-07T18:00:00',
    autoLockMinutes: null,
  },
  {
    id: crypto.randomUUID(),
    name: 'Studio C - Acces livraison',
    space: 'Studio C',
    model: 'Wi-Fi Smart Lock',
    brand: 'August',
    status: 'offline',
    battery: 45,
    lastActivity: '2026-02-07T14:30:00',
    autoLockMinutes: 5,
  },
  {
    id: crypto.randomUUID(),
    name: 'Rooftop terrace',
    space: 'Rooftop',
    model: 'Assure Lock 2',
    brand: 'Yale',
    status: 'locked',
    battery: 55,
    lastActivity: '2026-02-08T06:00:00',
    autoLockMinutes: 10,
  },
  {
    id: crypto.randomUUID(),
    name: 'Bureau administratif',
    space: 'Bureau Admin',
    model: 'Smart Lock 3.0 Pro',
    brand: 'Nuki',
    status: 'locked',
    battery: 91,
    lastActivity: '2026-02-08T09:45:00',
    autoLockMinutes: 5,
  },
];

const MOCK_CODES: AccessCode[] = [
  {
    id: crypto.randomUUID(),
    code: '4829',
    label: 'Reservation #R-2026-0421',
    type: 'temporary',
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A',
    assignedTo: 'Marie Dupont',
    createdAt: '2026-02-08T08:00:00',
    expiresAt: '2026-02-08T18:00:00',
    bookingRef: 'R-2026-0421',
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    code: '7156',
    label: 'Reservation #R-2026-0422',
    type: 'temporary',
    lockId: MOCK_LOCKS[1].id,
    lockName: 'Studio B',
    assignedTo: 'Jean Martin',
    createdAt: '2026-02-08T09:00:00',
    expiresAt: '2026-02-08T14:00:00',
    bookingRef: 'R-2026-0422',
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    code: '3041',
    label: 'Reservation #R-2026-0418',
    type: 'temporary',
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A',
    assignedTo: 'Sophie Bernard',
    createdAt: '2026-02-07T10:00:00',
    expiresAt: '2026-02-07T17:00:00',
    bookingRef: 'R-2026-0418',
    isActive: false,
  },
  {
    id: crypto.randomUUID(),
    code: '9283',
    label: 'Equipe - Antoine',
    type: 'permanent',
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Tous les espaces',
    assignedTo: 'Antoine Moreau',
    createdAt: '2026-01-15T09:00:00',
    expiresAt: null,
    bookingRef: null,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    code: '6517',
    label: 'Equipe - Claire',
    type: 'permanent',
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Tous les espaces',
    assignedTo: 'Claire Lefevre',
    createdAt: '2026-01-15T09:00:00',
    expiresAt: null,
    bookingRef: null,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    code: '1234',
    label: 'Code master - Admin',
    type: 'master',
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Tous les espaces',
    assignedTo: 'Administrateur',
    createdAt: '2025-12-01T09:00:00',
    expiresAt: null,
    bookingRef: null,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    code: '8472',
    label: 'Reservation #R-2026-0423',
    type: 'temporary',
    lockId: MOCK_LOCKS[2].id,
    lockName: 'Salle Maquillage',
    assignedTo: 'Camille Rousseau',
    createdAt: '2026-02-08T10:00:00',
    expiresAt: '2026-02-08T16:00:00',
    bookingRef: 'R-2026-0423',
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    code: '5390',
    label: 'Equipe - Lucas',
    type: 'permanent',
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A, Studio B',
    assignedTo: 'Lucas Petit',
    createdAt: '2026-02-01T09:00:00',
    expiresAt: null,
    bookingRef: null,
    isActive: true,
  },
];

const MOCK_LOGS: AccessLog[] = [
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A',
    space: 'Studio A',
    action: 'unlock',
    method: 'code',
    user: 'Marie Dupont',
    timestamp: '2026-02-08T09:15:00',
    codeUsed: '4829',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[1].id,
    lockName: 'Studio B',
    space: 'Studio B',
    action: 'unlock',
    method: 'app',
    user: 'Jean Martin',
    timestamp: '2026-02-08T10:30:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A',
    space: 'Studio A',
    action: 'lock',
    method: 'code',
    user: 'Antoine Moreau',
    timestamp: '2026-02-08T08:45:00',
    codeUsed: '9283',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[2].id,
    lockName: 'Salle Maquillage',
    space: 'Salle Maquillage',
    action: 'unlock',
    method: 'nfc',
    user: 'Claire Lefevre',
    timestamp: '2026-02-08T08:30:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[5].id,
    lockName: 'Studio C',
    space: 'Studio C',
    action: 'denied',
    method: 'code',
    user: 'Inconnu',
    timestamp: '2026-02-08T07:50:00',
    codeUsed: '0000',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[3].id,
    lockName: 'Lounge',
    space: 'Lounge',
    action: 'unlock',
    method: 'app',
    user: 'Antoine Moreau',
    timestamp: '2026-02-08T07:20:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A',
    space: 'Studio A',
    action: 'lock',
    method: 'app',
    user: 'Systeme (auto-lock)',
    timestamp: '2026-02-08T07:10:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[4].id,
    lockName: 'Reserve',
    space: 'Reserve',
    action: 'unlock',
    method: 'code',
    user: 'Lucas Petit',
    timestamp: '2026-02-07T18:00:00',
    codeUsed: '5390',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[4].id,
    lockName: 'Reserve',
    space: 'Reserve',
    action: 'lock',
    method: 'code',
    user: 'Lucas Petit',
    timestamp: '2026-02-07T17:45:00',
    codeUsed: '5390',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[6].id,
    lockName: 'Rooftop',
    space: 'Rooftop',
    action: 'unlock',
    method: 'nfc',
    user: 'Antoine Moreau',
    timestamp: '2026-02-08T06:00:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[1].id,
    lockName: 'Studio B',
    space: 'Studio B',
    action: 'lock',
    method: 'app',
    user: 'Systeme (auto-lock)',
    timestamp: '2026-02-07T22:00:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[7].id,
    lockName: 'Bureau Admin',
    space: 'Bureau Admin',
    action: 'unlock',
    method: 'code',
    user: 'Administrateur',
    timestamp: '2026-02-08T09:45:00',
    codeUsed: '1234',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[0].id,
    lockName: 'Studio A',
    space: 'Studio A',
    action: 'denied',
    method: 'code',
    user: 'Inconnu',
    timestamp: '2026-02-07T23:15:00',
    codeUsed: '9999',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[2].id,
    lockName: 'Salle Maquillage',
    space: 'Salle Maquillage',
    action: 'lock',
    method: 'app',
    user: 'Systeme (auto-lock)',
    timestamp: '2026-02-07T20:00:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[3].id,
    lockName: 'Lounge',
    space: 'Lounge',
    action: 'lock',
    method: 'nfc',
    user: 'Claire Lefevre',
    timestamp: '2026-02-07T19:30:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[6].id,
    lockName: 'Rooftop',
    space: 'Rooftop',
    action: 'lock',
    method: 'app',
    user: 'Antoine Moreau',
    timestamp: '2026-02-07T18:30:00',
    codeUsed: null,
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[5].id,
    lockName: 'Studio C',
    space: 'Studio C',
    action: 'unlock',
    method: 'code',
    user: 'Sophie Bernard',
    timestamp: '2026-02-07T14:30:00',
    codeUsed: '3041',
  },
  {
    id: crypto.randomUUID(),
    lockId: MOCK_LOCKS[7].id,
    lockName: 'Bureau Admin',
    space: 'Bureau Admin',
    action: 'lock',
    method: 'app',
    user: 'Systeme (auto-lock)',
    timestamp: '2026-02-07T19:00:00',
    codeUsed: null,
  },
];

// ---- Helpers ----

type TabId = 'locks' | 'codes' | 'history';

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getStatusLabel(status: LockStatus): string {
  switch (status) {
    case 'locked': return 'Verrouille';
    case 'unlocked': return 'Deverrouille';
    case 'offline': return 'Hors ligne';
    case 'low_battery': return 'Batterie faible';
  }
}

function getStatusBadgeVariant(status: LockStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'locked': return 'success';
    case 'unlocked': return 'info';
    case 'offline': return 'default';
    case 'low_battery': return 'warning';
  }
}

function getCodeTypeBadgeVariant(type: CodeType): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (type) {
    case 'temporary': return 'info';
    case 'permanent': return 'success';
    case 'master': return 'warning';
  }
}

function getCodeTypeLabel(type: CodeType): string {
  switch (type) {
    case 'temporary': return 'Temporaire';
    case 'permanent': return 'Permanent';
    case 'master': return 'Master';
  }
}

function getMethodIcon(method: AccessMethod) {
  switch (method) {
    case 'code': return <KeyRound size={14} />;
    case 'app': return <Smartphone size={14} />;
    case 'nfc': return <CreditCard size={14} />;
  }
}

function getMethodLabel(method: AccessMethod): string {
  switch (method) {
    case 'code': return 'Code';
    case 'app': return 'Application';
    case 'nfc': return 'NFC';
  }
}

function getBatteryClass(battery: number): string {
  if (battery >= 50) return styles.batteryFillGood;
  if (battery >= 20) return styles.batteryFillMedium;
  return styles.batteryFillLow;
}

function getLockIconWrapperClass(status: LockStatus): string {
  switch (status) {
    case 'locked': return styles.lockIconWrapper;
    case 'unlocked': return `${styles.lockIconWrapper} ${styles.lockIconWrapperUnlocked}`;
    case 'offline': return `${styles.lockIconWrapper} ${styles.lockIconWrapperOffline}`;
    case 'low_battery': return `${styles.lockIconWrapper} ${styles.lockIconWrapperLowBattery}`;
  }
}

// ---- Component ----

export function AccessControl() {
  const [activeTab, setActiveTab] = useState<TabId>('locks');
  const [locks, setLocks] = useState<SmartLock[]>(MOCK_LOCKS);
  const [codes, setCodes] = useState<AccessCode[]>(MOCK_CODES);
  const [logs] = useState<AccessLog[]>(MOCK_LOGS);

  // Filter states
  const [codeTypeFilter, setCodeTypeFilter] = useState<CodeType | 'all'>('all');
  const [historySpaceFilter, setHistorySpaceFilter] = useState<string>('all');
  const [historyActionFilter, setHistoryActionFilter] = useState<AccessAction | 'all'>('all');

  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newCodeForm, setNewCodeForm] = useState({
    label: '',
    type: 'temporary' as CodeType,
    lockName: '',
    assignedTo: '',
    expiresAt: '',
  });

  // Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter((log) => log.timestamp.startsWith(todayStr));
    const lockedCount = locks.filter((l) => l.status === 'locked').length;
    const offlineCount = locks.filter((l) => l.status === 'offline').length;
    const lowBatteryCount = locks.filter((l) => l.battery < 20).length;
    const activeCodes = codes.filter((c) => c.isActive && !isExpired(c.expiresAt)).length;

    // Accesses by space today
    const accessBySpace = todayLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.space] = (acc[log.space] || 0) + 1;
      return acc;
    }, {});

    const topSpace = Object.entries(accessBySpace).sort((a, b) => b[1] - a[1])[0];

    return {
      totalAccesses: todayLogs.length,
      lockedCount,
      offlineCount,
      lowBatteryCount,
      activeCodes,
      topSpace: topSpace ? `${topSpace[0]} (${topSpace[1]})` : '-',
    };
  }, [locks, codes, logs]);

  // Filtered codes
  const filteredCodes = useMemo(() => {
    if (codeTypeFilter === 'all') return codes;
    return codes.filter((c) => c.type === codeTypeFilter);
  }, [codes, codeTypeFilter]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (historySpaceFilter !== 'all') {
      result = result.filter((l) => l.space === historySpaceFilter);
    }
    if (historyActionFilter !== 'all') {
      result = result.filter((l) => l.action === historyActionFilter);
    }
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, historySpaceFilter, historyActionFilter]);

  // Unique spaces for filter
  const uniqueSpaces = useMemo(() => {
    const spaces = new Set(logs.map((l) => l.space));
    return Array.from(spaces).sort();
  }, [logs]);

  // Handlers
  const handleToggleLock = useCallback((lockId: string) => {
    setLocks((prev) =>
      prev.map((lock) => {
        if (lock.id !== lockId) return lock;
        if (lock.status === 'offline') return lock;
        const newStatus: LockStatus = lock.status === 'locked' ? 'unlocked' : 'locked';
        return {
          ...lock,
          status: newStatus,
          lastActivity: new Date().toISOString(),
        };
      })
    );
  }, []);

  const handleRevokeCode = useCallback((codeId: string) => {
    setCodes((prev) =>
      prev.map((code) =>
        code.id === codeId ? { ...code, isActive: false } : code
      )
    );
  }, []);

  const handleGenerateCode = useCallback(() => {
    const newCode: AccessCode = {
      id: crypto.randomUUID(),
      code: generateCode(),
      label: newCodeForm.label,
      type: newCodeForm.type,
      lockId: MOCK_LOCKS[0].id,
      lockName: newCodeForm.lockName || 'Studio A',
      assignedTo: newCodeForm.assignedTo,
      createdAt: new Date().toISOString(),
      expiresAt: newCodeForm.expiresAt || null,
      bookingRef: newCodeForm.type === 'temporary' ? `R-2026-${Math.floor(1000 + Math.random() * 9000)}` : null,
      isActive: true,
    };
    setCodes((prev) => [newCode, ...prev]);
    setShowGenerateModal(false);
    setNewCodeForm({ label: '', type: 'temporary', lockName: '', assignedTo: '', expiresAt: '' });
  }, [newCodeForm]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).catch(() => {
      // Silently fail if clipboard API is not available
    });
  }, []);

  // ---- Render: Locks Tab ----
  const renderLocksTab = () => (
    <div className={styles.locksGrid}>
      {locks.map((lock, index) => (
        <div
          key={lock.id}
          className={styles.animateIn}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Card padding="md" className={styles.lockCard}>
            <div className={styles.lockHeader}>
              <div className={styles.lockInfo}>
                <div className={getLockIconWrapperClass(lock.status)}>
                  {lock.status === 'locked' && <Lock size={20} />}
                  {lock.status === 'unlocked' && <Unlock size={20} />}
                  {lock.status === 'offline' && <WifiOff size={20} />}
                  {lock.status === 'low_battery' && <BatteryLow size={20} />}
                </div>
                <div className={styles.lockDetails}>
                  <h4 className={styles.lockName}>{lock.name}</h4>
                  <span className={styles.lockSpace}>{lock.space}</span>
                  <span className={styles.lockModel}>{lock.brand} {lock.model}</span>
                </div>
              </div>
              <div className={styles.lockActions}>
                <Badge variant={getStatusBadgeVariant(lock.status)} size="sm" dot>
                  {getStatusLabel(lock.status)}
                </Badge>
              </div>
            </div>

            <div className={styles.lockStatusRow}>
              <div className={styles.lockLastActivity}>
                <Clock size={12} />
                <span>{formatRelativeTime(lock.lastActivity)}</span>
              </div>
              {lock.status !== 'offline' && (
                <div className={styles.lockLastActivity}>
                  <Wifi size={12} />
                  <span>Connecte</span>
                </div>
              )}
            </div>

            <div className={styles.batteryRow}>
              <span className={styles.batteryLabel}>Batterie</span>
              <div className={styles.batteryBar}>
                <div
                  className={`${styles.batteryFill} ${getBatteryClass(lock.battery)}`}
                  style={{ width: `${lock.battery}%` }}
                />
              </div>
              <span className={styles.batteryPercent}>{lock.battery}%</span>
            </div>

            {lock.autoLockMinutes !== null && (
              <div className={styles.autoLockConfig}>
                <Settings size={14} />
                <span className={styles.autoLockLabel}>Auto-lock:</span>
                <span className={styles.autoLockValue}>{lock.autoLockMinutes} min</span>
              </div>
            )}

            <button
              className={`${styles.lockToggleBtn} ${
                lock.status === 'offline'
                  ? styles.lockToggleBtnDisabled
                  : lock.status === 'unlocked'
                    ? styles.lockToggleBtnUnlocked
                    : styles.lockToggleBtnLocked
              }`}
              onClick={() => handleToggleLock(lock.id)}
              disabled={lock.status === 'offline'}
            >
              {lock.status === 'locked' || lock.status === 'low_battery' ? (
                <>
                  <Unlock size={16} />
                  Deverrouiller
                </>
              ) : lock.status === 'unlocked' ? (
                <>
                  <Lock size={16} />
                  Verrouiller
                </>
              ) : (
                <>
                  <WifiOff size={16} />
                  Hors ligne
                </>
              )}
            </button>
          </Card>
        </div>
      ))}
    </div>
  );

  // ---- Render: Codes Tab ----
  const renderCodesTab = () => (
    <>
      <div className={styles.codesToolbar}>
        <div className={styles.codesFilters}>
          <button
            className={`${styles.filterBtn} ${codeTypeFilter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setCodeTypeFilter('all')}
          >
            Tous
          </button>
          <button
            className={`${styles.filterBtn} ${codeTypeFilter === 'temporary' ? styles.filterBtnActive : ''}`}
            onClick={() => setCodeTypeFilter('temporary')}
          >
            <Clock size={14} />
            Temporaires
          </button>
          <button
            className={`${styles.filterBtn} ${codeTypeFilter === 'permanent' ? styles.filterBtnActive : ''}`}
            onClick={() => setCodeTypeFilter('permanent')}
          >
            <KeyRound size={14} />
            Permanents
          </button>
          <button
            className={`${styles.filterBtn} ${codeTypeFilter === 'master' ? styles.filterBtnActive : ''}`}
            onClick={() => setCodeTypeFilter('master')}
          >
            <Shield size={14} />
            Master
          </button>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setShowGenerateModal(true)}
        >
          Generer un code
        </Button>
      </div>

      <Card padding="none">
        <table className={styles.codesTable}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Label</th>
              <th>Type</th>
              <th>Serrure</th>
              <th>Assigne a</th>
              <th>Expiration</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((code) => {
              const expired = isExpired(code.expiresAt);
              return (
                <tr key={code.id}>
                  <td>
                    <span className={styles.codeValue}>{code.code}</span>
                  </td>
                  <td>{code.label}</td>
                  <td>
                    <Badge variant={getCodeTypeBadgeVariant(code.type)} size="sm">
                      {getCodeTypeLabel(code.type)}
                    </Badge>
                  </td>
                  <td>{code.lockName}</td>
                  <td>{code.assignedTo}</td>
                  <td>
                    {code.expiresAt ? (
                      <span className={`${styles.codeExpiry} ${expired ? styles.codeExpired : ''}`}>
                        {formatDateTime(code.expiresAt)}
                        {expired && ' (expire)'}
                      </span>
                    ) : (
                      <span className={styles.codeExpiry}>Aucune</span>
                    )}
                  </td>
                  <td>
                    {!code.isActive || expired ? (
                      <Badge variant="default" size="sm">Inactif</Badge>
                    ) : (
                      <Badge variant="success" size="sm" dot>Actif</Badge>
                    )}
                  </td>
                  <td>
                    <div className={styles.codeActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleCopyCode(code.code)}
                        title="Copier le code"
                      >
                        <Copy size={14} />
                      </button>
                      {code.isActive && !expired && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleRevokeCode(code.id)}
                          title="Revoquer le code"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );

  // ---- Render: History Tab ----
  const renderHistoryTab = () => (
    <>
      <div className={styles.historyToolbar}>
        <div className={styles.historyFilters}>
          <select
            className={styles.historySelect}
            value={historySpaceFilter}
            onChange={(e) => setHistorySpaceFilter(e.target.value)}
          >
            <option value="all">Tous les espaces</option>
            {uniqueSpaces.map((space) => (
              <option key={space} value={space}>{space}</option>
            ))}
          </select>
          <select
            className={styles.historySelect}
            value={historyActionFilter}
            onChange={(e) => setHistoryActionFilter(e.target.value as AccessAction | 'all')}
          >
            <option value="all">Toutes les actions</option>
            <option value="lock">Verrouillage</option>
            <option value="unlock">Deverrouillage</option>
            <option value="denied">Acces refuse</option>
          </select>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
        >
          Actualiser
        </Button>
      </div>

      <Card padding="md">
        <div className={styles.historyList}>
          {filteredLogs.map((log) => (
            <div key={log.id} className={styles.historyItem}>
              <div
                className={`${styles.historyIcon} ${
                  log.action === 'lock'
                    ? styles.historyIconLock
                    : log.action === 'unlock'
                      ? styles.historyIconUnlock
                      : styles.historyIconDenied
                }`}
              >
                {log.action === 'lock' && <Lock size={16} />}
                {log.action === 'unlock' && <Unlock size={16} />}
                {log.action === 'denied' && <Shield size={16} />}
              </div>
              <div className={styles.historyContent}>
                <span className={styles.historyAction}>
                  {log.action === 'lock' && 'Verrouillage'}
                  {log.action === 'unlock' && 'Deverrouillage'}
                  {log.action === 'denied' && 'Acces refuse'}
                  {' - '}
                  {log.lockName}
                </span>
                <div className={styles.historyMeta}>
                  <span>{log.user}</span>
                  <span className={styles.historyMetaDot} />
                  <span>{getMethodLabel(log.method)}</span>
                  {getMethodIcon(log.method)}
                  {log.codeUsed && (
                    <>
                      <span className={styles.historyMetaDot} />
                      <span>Code: {log.codeUsed}</span>
                    </>
                  )}
                </div>
              </div>
              <span className={styles.historyTime}>
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className={styles.emptyState}>
              <History size={40} />
              <p>Aucun historique pour ces filtres</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );

  return (
    <div className={styles.page}>
      <Header
        title="Controle d'acces"
        subtitle="Gerez vos serrures connectees et codes d'acces"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowGenerateModal(true)}
          >
            Nouveau code
          </Button>
        }
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)' }}>
              <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalAccesses}</span>
              <span className={styles.statLabel}>Acces aujourd'hui</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
              <Lock size={20} style={{ color: 'var(--state-success)' }} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.lockedCount}/{locks.length}</span>
              <span className={styles.statLabel}>Serrures verrouillees</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
              <KeyRound size={20} style={{ color: 'var(--state-info)' }} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.activeCodes}</span>
              <span className={styles.statLabel}>Codes actifs</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)' }}>
              <BatteryLow size={20} style={{ color: 'var(--state-warning)' }} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.lowBatteryCount}</span>
              <span className={styles.statLabel}>Batteries faibles</span>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'locks' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('locks')}
          >
            Serrures
            <span className={styles.tabBadge}>{locks.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'codes' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('codes')}
          >
            Codes d'acces
            <span className={styles.tabBadge}>{codes.filter((c) => c.isActive && !isExpired(c.expiresAt)).length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historique
            <span className={styles.tabBadge}>{logs.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'locks' && renderLocksTab()}
        {activeTab === 'codes' && renderCodesTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>

      {/* Generate Code Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        size="md"
      >
        <ModalHeader title="Generer un code d'acces" onClose={() => setShowGenerateModal(false)} />
        <ModalBody>
          <div className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Type de code</label>
              <select
                className={styles.formSelect}
                value={newCodeForm.type}
                onChange={(e) => setNewCodeForm((prev) => ({ ...prev, type: e.target.value as CodeType }))}
              >
                <option value="temporary">Temporaire (lie a une reservation)</option>
                <option value="permanent">Permanent (equipe)</option>
                <option value="master">Master (admin)</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Label</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Ex: Reservation #R-2026-0425"
                value={newCodeForm.label}
                onChange={(e) => setNewCodeForm((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Serrure / Espace</label>
                <select
                  className={styles.formSelect}
                  value={newCodeForm.lockName}
                  onChange={(e) => setNewCodeForm((prev) => ({ ...prev, lockName: e.target.value }))}
                >
                  <option value="">Selectionner...</option>
                  <option value="Tous les espaces">Tous les espaces</option>
                  {locks.map((lock) => (
                    <option key={lock.id} value={lock.space}>{lock.space} - {lock.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Assigne a</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Nom de la personne"
                  value={newCodeForm.assignedTo}
                  onChange={(e) => setNewCodeForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                />
              </div>
            </div>
            {newCodeForm.type === 'temporary' && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Expiration</label>
                <input
                  type="datetime-local"
                  className={styles.formInput}
                  value={newCodeForm.expiresAt}
                  onChange={(e) => setNewCodeForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            icon={<KeyRound size={16} />}
            onClick={handleGenerateCode}
            disabled={!newCodeForm.label || !newCodeForm.assignedTo}
          >
            Generer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
