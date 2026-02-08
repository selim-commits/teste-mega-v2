import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Mail,
  UserCheck,
  UserX,
  FileQuestion,
  Users,
  TrendingUp,
  Timer,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Table';
import { cn, formatDate } from '../lib/utils';
import styles from './IdentityVerification.module.css';

// ===== Types =====

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface SubmittedDocument {
  type: 'identity' | 'address_proof';
  name: string;
  submitted: boolean;
  submittedAt: string | null;
  fileSize: string | null;
}

interface VerificationRecord {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhoto: string | null;
  avatarColor: string;
  status: VerificationStatus;
  documents: SubmittedDocument[];
  submissionDate: string | null;
  verificationDate: string | null;
  confidenceScore: number;
  verifierNotes: string;
}

type TabKey = 'pending' | 'verified' | 'rejected' | 'all';

// ===== Mock Data =====

const AVATAR_COLORS = [
  'var(--accent-primary)',
  'var(--state-info)',
  'var(--state-success)',
  'var(--state-warning)',
  'var(--state-error)',
];

function generateMockData(): VerificationRecord[] {
  const records: VerificationRecord[] = [
    {
      id: crypto.randomUUID(),
      clientName: 'Marie Dupont',
      clientEmail: 'marie.dupont@email.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[0],
      status: 'verified',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2025-12-15T10:30:00Z', fileSize: '2.4 Mo' },
        { type: 'address_proof', name: 'Facture EDF', submitted: true, submittedAt: '2025-12-15T10:32:00Z', fileSize: '1.1 Mo' },
      ],
      submissionDate: '2025-12-15T10:30:00Z',
      verificationDate: '2025-12-16T14:00:00Z',
      confidenceScore: 95,
      verifierNotes: 'Documents clairs et conformes. Identite verifiee avec succes.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Jean-Pierre Martin',
      clientEmail: 'jp.martin@gmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[1],
      status: 'pending',
      documents: [
        { type: 'identity', name: 'Passeport', submitted: true, submittedAt: '2026-01-20T09:00:00Z', fileSize: '3.2 Mo' },
        { type: 'address_proof', name: 'Avis d\'imposition', submitted: true, submittedAt: '2026-01-20T09:05:00Z', fileSize: '1.8 Mo' },
      ],
      submissionDate: '2026-01-20T09:00:00Z',
      verificationDate: null,
      confidenceScore: 72,
      verifierNotes: '',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Sophie Lemoine',
      clientEmail: 'sophie.lemoine@outlook.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[2],
      status: 'rejected',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2026-01-10T15:20:00Z', fileSize: '1.9 Mo' },
        { type: 'address_proof', name: 'Justificatif de domicile', submitted: true, submittedAt: '2026-01-10T15:22:00Z', fileSize: '0.8 Mo' },
      ],
      submissionDate: '2026-01-10T15:20:00Z',
      verificationDate: '2026-01-12T11:00:00Z',
      confidenceScore: 28,
      verifierNotes: 'Document d\'identite illisible. Photo floue, informations non verifiables.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Thomas Bernard',
      clientEmail: 'thomas.b@protonmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[3],
      status: 'pending',
      documents: [
        { type: 'identity', name: 'Permis de conduire', submitted: true, submittedAt: '2026-02-01T08:45:00Z', fileSize: '2.1 Mo' },
        { type: 'address_proof', name: '', submitted: false, submittedAt: null, fileSize: null },
      ],
      submissionDate: '2026-02-01T08:45:00Z',
      verificationDate: null,
      confidenceScore: 45,
      verifierNotes: 'En attente du justificatif de domicile.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Camille Roux',
      clientEmail: 'camille.roux@yahoo.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[4],
      status: 'verified',
      documents: [
        { type: 'identity', name: 'Passeport', submitted: true, submittedAt: '2025-11-28T12:00:00Z', fileSize: '2.9 Mo' },
        { type: 'address_proof', name: 'Facture telephonique', submitted: true, submittedAt: '2025-11-28T12:03:00Z', fileSize: '0.7 Mo' },
      ],
      submissionDate: '2025-11-28T12:00:00Z',
      verificationDate: '2025-11-29T09:30:00Z',
      confidenceScore: 88,
      verifierNotes: 'Verification rapide. Tous les documents en ordre.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Lucas Petit',
      clientEmail: 'lucas.petit@icloud.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[0],
      status: 'unverified',
      documents: [
        { type: 'identity', name: '', submitted: false, submittedAt: null, fileSize: null },
        { type: 'address_proof', name: '', submitted: false, submittedAt: null, fileSize: null },
      ],
      submissionDate: null,
      verificationDate: null,
      confidenceScore: 0,
      verifierNotes: '',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Emma Moreau',
      clientEmail: 'emma.moreau@gmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[1],
      status: 'pending',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2026-02-03T16:10:00Z', fileSize: '2.0 Mo' },
        { type: 'address_proof', name: 'Facture internet', submitted: true, submittedAt: '2026-02-03T16:12:00Z', fileSize: '1.3 Mo' },
      ],
      submissionDate: '2026-02-03T16:10:00Z',
      verificationDate: null,
      confidenceScore: 81,
      verifierNotes: '',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Hugo Lefevre',
      clientEmail: 'hugo.lefevre@email.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[2],
      status: 'verified',
      documents: [
        { type: 'identity', name: 'Passeport', submitted: true, submittedAt: '2025-10-05T11:00:00Z', fileSize: '3.5 Mo' },
        { type: 'address_proof', name: 'Quittance de loyer', submitted: true, submittedAt: '2025-10-05T11:05:00Z', fileSize: '0.9 Mo' },
      ],
      submissionDate: '2025-10-05T11:00:00Z',
      verificationDate: '2025-10-06T10:00:00Z',
      confidenceScore: 92,
      verifierNotes: 'Excellent. Documents parfaitement lisibles.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Lea Girard',
      clientEmail: 'lea.girard@outlook.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[3],
      status: 'rejected',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2026-01-25T14:00:00Z', fileSize: '1.5 Mo' },
        { type: 'address_proof', name: 'Facture eau', submitted: true, submittedAt: '2026-01-25T14:02:00Z', fileSize: '0.6 Mo' },
      ],
      submissionDate: '2026-01-25T14:00:00Z',
      verificationDate: '2026-01-27T16:30:00Z',
      confidenceScore: 15,
      verifierNotes: 'Document d\'identite expire. Justificatif de domicile date de plus de 3 mois.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Nathan Fournier',
      clientEmail: 'nathan.fournier@gmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[4],
      status: 'verified',
      documents: [
        { type: 'identity', name: 'Permis de conduire', submitted: true, submittedAt: '2025-12-01T09:30:00Z', fileSize: '2.7 Mo' },
        { type: 'address_proof', name: 'Avis d\'imposition', submitted: true, submittedAt: '2025-12-01T09:33:00Z', fileSize: '1.4 Mo' },
      ],
      submissionDate: '2025-12-01T09:30:00Z',
      verificationDate: '2025-12-02T15:00:00Z',
      confidenceScore: 90,
      verifierNotes: 'Verification standard. Aucune anomalie.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Chloe Mercier',
      clientEmail: 'chloe.mercier@free.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[0],
      status: 'pending',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2026-02-05T07:50:00Z', fileSize: '2.2 Mo' },
        { type: 'address_proof', name: 'Attestation d\'hebergement', submitted: true, submittedAt: '2026-02-05T07:55:00Z', fileSize: '0.5 Mo' },
      ],
      submissionDate: '2026-02-05T07:50:00Z',
      verificationDate: null,
      confidenceScore: 65,
      verifierNotes: '',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Antoine Blanc',
      clientEmail: 'antoine.blanc@laposte.net',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[1],
      status: 'unverified',
      documents: [
        { type: 'identity', name: '', submitted: false, submittedAt: null, fileSize: null },
        { type: 'address_proof', name: '', submitted: false, submittedAt: null, fileSize: null },
      ],
      submissionDate: null,
      verificationDate: null,
      confidenceScore: 0,
      verifierNotes: '',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Manon Dubois',
      clientEmail: 'manon.dubois@gmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[2],
      status: 'verified',
      documents: [
        { type: 'identity', name: 'Passeport', submitted: true, submittedAt: '2025-11-15T13:20:00Z', fileSize: '3.1 Mo' },
        { type: 'address_proof', name: 'Facture gaz', submitted: true, submittedAt: '2025-11-15T13:25:00Z', fileSize: '0.8 Mo' },
      ],
      submissionDate: '2025-11-15T13:20:00Z',
      verificationDate: '2025-11-16T10:00:00Z',
      confidenceScore: 97,
      verifierNotes: 'Dossier exemplaire. Verification instantanee.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Raphael Simon',
      clientEmail: 'raphael.simon@hotmail.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[3],
      status: 'pending',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2026-02-06T11:00:00Z', fileSize: '1.8 Mo' },
        { type: 'address_proof', name: '', submitted: false, submittedAt: null, fileSize: null },
      ],
      submissionDate: '2026-02-06T11:00:00Z',
      verificationDate: null,
      confidenceScore: 40,
      verifierNotes: 'Justificatif de domicile manquant.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Julie Laurent',
      clientEmail: 'julie.laurent@sfr.fr',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[4],
      status: 'rejected',
      documents: [
        { type: 'identity', name: 'Permis de conduire', submitted: true, submittedAt: '2026-01-18T10:00:00Z', fileSize: '2.5 Mo' },
        { type: 'address_proof', name: 'Facture EDF', submitted: true, submittedAt: '2026-01-18T10:03:00Z', fileSize: '1.0 Mo' },
      ],
      submissionDate: '2026-01-18T10:00:00Z',
      verificationDate: '2026-01-20T09:00:00Z',
      confidenceScore: 22,
      verifierNotes: 'Le nom sur le justificatif de domicile ne correspond pas a celui de la piece d\'identite.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Alexandre Morel',
      clientEmail: 'alex.morel@protonmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[0],
      status: 'verified',
      documents: [
        { type: 'identity', name: 'Carte nationale d\'identite', submitted: true, submittedAt: '2025-12-20T08:00:00Z', fileSize: '2.3 Mo' },
        { type: 'address_proof', name: 'Quittance de loyer', submitted: true, submittedAt: '2025-12-20T08:05:00Z', fileSize: '0.7 Mo' },
      ],
      submissionDate: '2025-12-20T08:00:00Z',
      verificationDate: '2025-12-21T13:00:00Z',
      confidenceScore: 85,
      verifierNotes: 'Verifie sans difficulte.',
    },
    {
      id: crypto.randomUUID(),
      clientName: 'Ines Fontaine',
      clientEmail: 'ines.fontaine@gmail.com',
      clientPhoto: null,
      avatarColor: AVATAR_COLORS[1],
      status: 'unverified',
      documents: [
        { type: 'identity', name: '', submitted: false, submittedAt: null, fileSize: null },
        { type: 'address_proof', name: '', submitted: false, submittedAt: null, fileSize: null },
      ],
      submissionDate: null,
      verificationDate: null,
      confidenceScore: 0,
      verifierNotes: '',
    },
  ];

  return records;
}

const MOCK_DATA = generateMockData();

// ===== Helpers =====

function getStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    unverified: 'Non verifie',
    pending: 'En cours',
    verified: 'Verifie',
    rejected: 'Rejete',
  };
  return labels[status];
}

function getStatusStyle(status: VerificationStatus): string {
  const map: Record<VerificationStatus, string> = {
    unverified: styles.statusUnverified,
    pending: styles.statusPending,
    verified: styles.statusVerified,
    rejected: styles.statusRejected,
  };
  return map[status];
}

function getStatusIcon(status: VerificationStatus) {
  switch (status) {
    case 'verified': return <ShieldCheck size={14} />;
    case 'pending': return <Clock size={14} />;
    case 'rejected': return <ShieldX size={14} />;
    default: return <Shield size={14} />;
  }
}

function getScoreClass(score: number): string {
  if (score >= 70) return styles.scoreHigh;
  if (score >= 40) return styles.scoreMedium;
  return styles.scoreLow;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--state-success)';
  if (score >= 40) return 'var(--state-warning)';
  return 'var(--state-error)';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ===== Component =====

export function IdentityVerification() {
  // State
  const [records, setRecords] = useState<VerificationRecord[]>(MOCK_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal state
  const [detailRecord, setDetailRecord] = useState<VerificationRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request' | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Stats
  const stats = useMemo(() => {
    const total = records.length;
    const verified = records.filter((r) => r.status === 'verified').length;
    const pending = records.filter((r) => r.status === 'pending').length;
    const rejected = records.filter((r) => r.status === 'rejected').length;
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;

    const verifiedRecords = records.filter((r) => r.status === 'verified' && r.submissionDate && r.verificationDate);
    const avgProcessingTime = verifiedRecords.length > 0
      ? Math.round(
          verifiedRecords.reduce((sum, r) => {
            const sub = new Date(r.submissionDate!).getTime();
            const ver = new Date(r.verificationDate!).getTime();
            return sum + (ver - sub) / (1000 * 60 * 60);
          }, 0) / verifiedRecords.length
        )
      : 0;

    return { total, verified, pending, rejected, verificationRate, avgProcessingTime };
  }, [records]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: records.length,
    pending: records.filter((r) => r.status === 'pending').length,
    verified: records.filter((r) => r.status === 'verified').length,
    rejected: records.filter((r) => r.status === 'rejected').length,
  }), [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter((r) => r.status === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.clientName.toLowerCase().includes(query) ||
          r.clientEmail.toLowerCase().includes(query)
      );
    }

    // Score filter
    if (scoreFilter !== 'all') {
      switch (scoreFilter) {
        case 'high':
          result = result.filter((r) => r.confidenceScore >= 70);
          break;
        case 'medium':
          result = result.filter((r) => r.confidenceScore >= 40 && r.confidenceScore < 70);
          break;
        case 'low':
          result = result.filter((r) => r.confidenceScore < 40);
          break;
      }
    }

    return result;
  }, [records, activeTab, searchQuery, scoreFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  // Handlers
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleOpenDetail = useCallback((record: VerificationRecord) => {
    setDetailRecord(record);
    setIsDetailOpen(true);
  }, []);

  const handleOpenAction = useCallback((type: 'approve' | 'reject' | 'request', id: string) => {
    setActionType(type);
    setActionTargetId(id);
    setActionNotes('');
    setIsActionModalOpen(true);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!actionTargetId || !actionType) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== actionTargetId) return r;

        if (actionType === 'approve') {
          return {
            ...r,
            status: 'verified' as VerificationStatus,
            verificationDate: new Date().toISOString(),
            verifierNotes: actionNotes || r.verifierNotes,
            confidenceScore: Math.max(r.confidenceScore, 80),
          };
        }
        if (actionType === 'reject') {
          return {
            ...r,
            status: 'rejected' as VerificationStatus,
            verificationDate: new Date().toISOString(),
            verifierNotes: actionNotes || r.verifierNotes,
          };
        }
        // request
        return {
          ...r,
          verifierNotes: actionNotes
            ? `${r.verifierNotes ? r.verifierNotes + '\n' : ''}[Demande] ${actionNotes}`
            : r.verifierNotes,
        };
      })
    );

    setIsActionModalOpen(false);
    setActionType(null);
    setActionTargetId(null);
    setActionNotes('');

    // Close detail modal if the same record was being viewed
    if (detailRecord?.id === actionTargetId) {
      setIsDetailOpen(false);
      setDetailRecord(null);
    }
  }, [actionTargetId, actionType, actionNotes, detailRecord]);

  const getActionModalTitle = () => {
    switch (actionType) {
      case 'approve': return 'Approuver la verification';
      case 'reject': return 'Rejeter la verification';
      case 'request': return 'Demander des documents';
      default: return '';
    }
  };

  const getActionModalDescription = () => {
    const target = records.find((r) => r.id === actionTargetId);
    if (!target) return '';
    switch (actionType) {
      case 'approve': return `Confirmez l'approbation de la verification pour ${target.clientName}.`;
      case 'reject': return `Confirmez le rejet de la verification pour ${target.clientName}. Indiquez la raison ci-dessous.`;
      case 'request': return `Envoyez une demande de documents supplementaires a ${target.clientName}.`;
      default: return '';
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="Verification d'identite"
        subtitle="Gerez les verifications d'identite de vos clients"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
              <Users size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total clients</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)', color: 'var(--state-success)' }}>
              <ShieldCheck size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.verified}</span>
              <span className={styles.statLabel}>Verifies</span>
            </div>
            <span className={styles.statChange}>{stats.verificationRate}%</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)', color: 'var(--state-warning)' }}>
              <ShieldAlert size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.pending}</span>
              <span className={styles.statLabel}>En attente</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-error-bg)', color: 'var(--state-error)' }}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.avgProcessingTime}h</span>
              <span className={styles.statLabel}>Temps moyen</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.toolbarActions}>
            <Timer size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Taux: {stats.verificationRate}%
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {([
            { key: 'all' as TabKey, label: 'Tous' },
            { key: 'pending' as TabKey, label: 'En attente' },
            { key: 'verified' as TabKey, label: 'Verifies' },
            { key: 'rejected' as TabKey, label: 'Rejetes' },
          ]).map((tab) => (
            <button
              key={tab.key}
              className={cn(styles.tab, activeTab === tab.key && styles.tabActive)}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
              <span className={styles.tabCount}>{tabCounts[tab.key]}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <span className={styles.filterLabel}>Score :</span>
          <select
            className={styles.filterSelect}
            value={scoreFilter}
            onChange={(e) => {
              setScoreFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tous les scores</option>
            <option value="high">Eleve (70+)</option>
            <option value="medium">Moyen (40-69)</option>
            <option value="low">Faible (&lt;40)</option>
          </select>
        </div>

        {/* Table */}
        {filteredRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldCheck size={48} />
            <h3>Aucun resultat</h3>
            <p>Aucune verification ne correspond a vos criteres de recherche.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Statut</th>
                    <th>Documents</th>
                    <th>Score</th>
                    <th>Soumission</th>
                    <th>Verification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => (
                    <tr key={record.id}>
                      {/* Client */}
                      <td>
                        <div className={styles.clientCell}>
                          <div
                            className={styles.clientAvatar}
                            style={{ backgroundColor: record.avatarColor }}
                          >
                            {getInitials(record.clientName)}
                          </div>
                          <div className={styles.clientInfo}>
                            <span className={styles.clientName}>{record.clientName}</span>
                            <span className={styles.clientEmail}>{record.clientEmail}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={cn(styles.statusBadge, getStatusStyle(record.status))}>
                          <span className={styles.statusDot} />
                          {getStatusLabel(record.status)}
                        </span>
                      </td>

                      {/* Documents */}
                      <td>
                        <div className={styles.documentsCell}>
                          {record.documents.map((doc) => (
                            <div
                              key={doc.type}
                              className={cn(
                                styles.documentItem,
                                doc.submitted ? styles.documentPresent : styles.documentMissing
                              )}
                            >
                              {doc.submitted ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              <span>
                                {doc.type === 'identity' ? 'Piece d\'identite' : 'Justificatif'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Score */}
                      <td>
                        <div className={cn(styles.scoreCell, getScoreClass(record.confidenceScore))}>
                          <div className={styles.scoreBar}>
                            <div
                              className={styles.scoreBarFill}
                              style={{ width: `${record.confidenceScore}%` }}
                            />
                          </div>
                          <span className={styles.scoreValue}>{record.confidenceScore}</span>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td>
                        <span className={styles.dateCell}>
                          {record.submissionDate
                            ? formatDate(record.submissionDate)
                            : '\u2014'}
                        </span>
                      </td>

                      {/* Verification Date */}
                      <td>
                        <span className={styles.dateCell}>
                          {record.verificationDate
                            ? formatDate(record.verificationDate)
                            : '\u2014'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleOpenDetail(record)}
                            title="Voir les details"
                          >
                            <Eye size={16} />
                          </button>
                          {(record.status === 'pending' || record.status === 'unverified') && (
                            <>
                              <button
                                className={cn(styles.actionBtn, styles.actionBtnApprove)}
                                onClick={() => handleOpenAction('approve', record.id)}
                                title="Approuver"
                              >
                                <UserCheck size={16} />
                              </button>
                              <button
                                className={cn(styles.actionBtn, styles.actionBtnReject)}
                                onClick={() => handleOpenAction('reject', record.id)}
                                title="Rejeter"
                              >
                                <UserX size={16} />
                              </button>
                            </>
                          )}
                          <button
                            className={cn(styles.actionBtn, styles.actionBtnRequest)}
                            onClick={() => handleOpenAction('request', record.id)}
                            title="Demander des documents"
                          >
                            <Mail size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} size="lg">
        {detailRecord && (
          <>
            <ModalHeader
              title="Details de la verification"
              onClose={() => setIsDetailOpen(false)}
            />
            <ModalBody>
              {/* Client Header */}
              <div className={styles.detailClientHeader}>
                <div
                  className={styles.detailAvatar}
                  style={{ backgroundColor: detailRecord.avatarColor }}
                >
                  {getInitials(detailRecord.clientName)}
                </div>
                <div className={styles.detailClientInfo}>
                  <h3 className={styles.detailClientName}>{detailRecord.clientName}</h3>
                  <p className={styles.detailClientEmail}>{detailRecord.clientEmail}</p>
                  <span className={cn(styles.statusBadge, getStatusStyle(detailRecord.status))}>
                    {getStatusIcon(detailRecord.status)}
                    {getStatusLabel(detailRecord.status)}
                  </span>
                </div>
              </div>

              <div className={styles.detailGrid}>
                {/* Score */}
                <div className={styles.detailSection}>
                  <h4 className={styles.detailLabel}>Score de confiance</h4>
                  <div className={cn(styles.scoreCell, getScoreClass(detailRecord.confidenceScore))}>
                    <div className={styles.scoreBar} style={{ width: 100 }}>
                      <div
                        className={styles.scoreBarFill}
                        style={{ width: `${detailRecord.confidenceScore}%` }}
                      />
                    </div>
                    <span className={styles.scoreValue} style={{ color: getScoreColor(detailRecord.confidenceScore) }}>
                      {detailRecord.confidenceScore}/100
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className={styles.detailSection}>
                  <h4 className={styles.detailLabel}>Dates</h4>
                  <p className={styles.detailValue}>
                    Soumission : {detailRecord.submissionDate ? formatDate(detailRecord.submissionDate) : 'Non soumis'}
                  </p>
                  <p className={styles.detailValue}>
                    Verification : {detailRecord.verificationDate ? formatDate(detailRecord.verificationDate) : 'En attente'}
                  </p>
                </div>

                {/* Documents */}
                <div className={cn(styles.detailSection, styles.detailSectionFull)}>
                  <h4 className={styles.detailLabel}>Documents soumis</h4>
                  {detailRecord.documents.map((doc) => (
                    <div key={doc.type} className={styles.documentCard}>
                      <div className={styles.documentCardIcon}>
                        {doc.type === 'identity' ? <FileText size={18} /> : <FileQuestion size={18} />}
                      </div>
                      <div className={styles.documentCardInfo}>
                        <span className={styles.documentCardName}>
                          {doc.type === 'identity' ? 'Piece d\'identite' : 'Justificatif de domicile'}
                        </span>
                        <span className={styles.documentCardMeta}>
                          {doc.submitted
                            ? `${doc.name} - ${doc.fileSize} - ${formatDate(doc.submittedAt!)}`
                            : 'Non soumis'}
                        </span>
                      </div>
                      <div className={styles.documentCardStatus}>
                        {doc.submitted ? (
                          <Badge variant="success" dot>Soumis</Badge>
                        ) : (
                          <Badge variant="default" dot>Manquant</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className={cn(styles.detailSection, styles.detailSectionFull)}>
                  <h4 className={styles.detailLabel}>Notes du verificateur</h4>
                  <p className={styles.detailValue}>
                    {detailRecord.verifierNotes || 'Aucune note pour le moment.'}
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              {(detailRecord.status === 'pending' || detailRecord.status === 'unverified') && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<UserX size={14} />}
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenAction('reject', detailRecord.id);
                    }}
                  >
                    Rejeter
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={<UserCheck size={14} />}
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenAction('approve', detailRecord.id);
                    }}
                  >
                    Approuver
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<Mail size={14} />}
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenAction('request', detailRecord.id);
                }}
              >
                Demander des documents
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} size="sm">
        <ModalHeader
          title={getActionModalTitle()}
          onClose={() => setIsActionModalOpen(false)}
        />
        <ModalBody>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            {getActionModalDescription()}
          </p>
          <textarea
            className={styles.notesTextarea}
            placeholder={
              actionType === 'approve'
                ? 'Notes optionnelles...'
                : actionType === 'reject'
                ? 'Raison du rejet (obligatoire)...'
                : 'Decrivez les documents requis...'
            }
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            rows={3}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setIsActionModalOpen(false)}>
            Annuler
          </Button>
          {actionType === 'approve' && (
            <Button
              variant="success"
              size="sm"
              icon={<CheckCircle2 size={14} />}
              onClick={handleConfirmAction}
            >
              Confirmer l'approbation
            </Button>
          )}
          {actionType === 'reject' && (
            <Button
              variant="danger"
              size="sm"
              icon={<XCircle size={14} />}
              onClick={handleConfirmAction}
              disabled={!actionNotes.trim()}
            >
              Confirmer le rejet
            </Button>
          )}
          {actionType === 'request' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Mail size={14} />}
              onClick={handleConfirmAction}
              disabled={!actionNotes.trim()}
            >
              Envoyer la demande
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
