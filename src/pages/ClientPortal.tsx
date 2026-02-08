import { useState } from 'react';
import {
  CalendarDays,
  FileText,
  User,
  Package,
  CreditCard,
  Clock,
  MapPin,
  Download,
  Camera,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import styles from './ClientPortal.module.css';

// ─── Types ───────────────────────────────────────────────────────────

type TabId = 'reservations' | 'factures' | 'profil' | 'packs' | 'paiements';

interface Booking {
  id: string;
  date: string;
  heure: string;
  type: string;
  espace: string;
  statut: 'confirmee' | 'en_attente' | 'annulee' | 'terminee';
  prix: number;
}

interface Invoice {
  id: string;
  numero: string;
  date: string;
  montant: number;
  statut: 'payee' | 'impayee' | 'partielle';
  description: string;
}

interface ClientPack {
  id: string;
  nom: string;
  sessionsTotal: number;
  sessionsUtilisees: number;
  dateAchat: string;
  dateExpiration: string;
  actif: boolean;
}

interface Payment {
  id: string;
  date: string;
  montant: number;
  methode: string;
  reference: string;
  factureNumero: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────

const mockBookings: Booking[] = [
  {
    id: crypto.randomUUID(),
    date: '2026-02-15',
    heure: '10:00 - 12:00',
    type: 'Shooting Photo Portrait',
    espace: 'Studio A - Cyclorama',
    statut: 'confirmee',
    prix: 250,
  },
  {
    id: crypto.randomUUID(),
    date: '2026-02-22',
    heure: '14:00 - 17:00',
    type: 'Shooting Mode',
    espace: 'Studio B - Loft Naturel',
    statut: 'en_attente',
    prix: 450,
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-05',
    heure: '09:00 - 11:00',
    type: 'Video Corporate',
    espace: 'Studio C - Blackout',
    statut: 'confirmee',
    prix: 380,
  },
  {
    id: crypto.randomUUID(),
    date: '2026-01-10',
    heure: '13:00 - 16:00',
    type: 'Shooting Produit',
    espace: 'Studio A - Cyclorama',
    statut: 'terminee',
    prix: 320,
  },
  {
    id: crypto.randomUUID(),
    date: '2025-12-18',
    heure: '10:00 - 12:00',
    type: 'Shooting Photo Portrait',
    espace: 'Studio B - Loft Naturel',
    statut: 'terminee',
    prix: 250,
  },
  {
    id: crypto.randomUUID(),
    date: '2025-11-28',
    heure: '15:00 - 17:00',
    type: 'Shooting E-commerce',
    espace: 'Studio A - Cyclorama',
    statut: 'annulee',
    prix: 200,
  },
];

const mockInvoices: Invoice[] = [
  {
    id: crypto.randomUUID(),
    numero: 'FAC-2026-0042',
    date: '2026-02-15',
    montant: 250,
    statut: 'impayee',
    description: 'Shooting Photo Portrait - Studio A',
  },
  {
    id: crypto.randomUUID(),
    numero: 'FAC-2026-0038',
    date: '2026-01-10',
    montant: 320,
    statut: 'payee',
    description: 'Shooting Produit - Studio A',
  },
  {
    id: crypto.randomUUID(),
    numero: 'FAC-2025-0201',
    date: '2025-12-18',
    montant: 250,
    statut: 'payee',
    description: 'Shooting Photo Portrait - Studio B',
  },
  {
    id: crypto.randomUUID(),
    numero: 'FAC-2025-0195',
    date: '2025-11-28',
    montant: 200,
    statut: 'partielle',
    description: 'Shooting E-commerce - Studio A (remboursement partiel)',
  },
];

const mockPacks: ClientPack[] = [
  {
    id: crypto.randomUUID(),
    nom: 'Pack Portrait Premium',
    sessionsTotal: 10,
    sessionsUtilisees: 6,
    dateAchat: '2025-09-01',
    dateExpiration: '2026-09-01',
    actif: true,
  },
  {
    id: crypto.randomUUID(),
    nom: 'Pack Studio Mensuel',
    sessionsTotal: 4,
    sessionsUtilisees: 2,
    dateAchat: '2026-01-15',
    dateExpiration: '2026-02-15',
    actif: true,
  },
  {
    id: crypto.randomUUID(),
    nom: 'Pack Video Basic',
    sessionsTotal: 5,
    sessionsUtilisees: 5,
    dateAchat: '2025-06-01',
    dateExpiration: '2025-12-01',
    actif: false,
  },
];

const mockPayments: Payment[] = [
  {
    id: crypto.randomUUID(),
    date: '2026-01-10',
    montant: 320,
    methode: 'Carte bancaire',
    reference: 'PAY-20260110-A4F2',
    factureNumero: 'FAC-2026-0038',
  },
  {
    id: crypto.randomUUID(),
    date: '2025-12-18',
    montant: 250,
    methode: 'Carte bancaire',
    reference: 'PAY-20251218-B7C1',
    factureNumero: 'FAC-2025-0201',
  },
  {
    id: crypto.randomUUID(),
    date: '2025-11-28',
    montant: 100,
    methode: 'Virement',
    reference: 'PAY-20251128-D3E9',
    factureNumero: 'FAC-2025-0195',
  },
  {
    id: crypto.randomUUID(),
    date: '2025-09-01',
    montant: 750,
    methode: 'Carte bancaire',
    reference: 'PAY-20250901-F1A8',
    factureNumero: 'Pack Portrait Premium',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-01-15',
    montant: 280,
    methode: 'Carte bancaire',
    reference: 'PAY-20260115-G5H3',
    factureNumero: 'Pack Studio Mensuel',
  },
];

const mockProfile = {
  prenom: 'Marie',
  nom: 'Dupont',
  email: 'marie.dupont@email.com',
  telephone: '+33 6 12 34 56 78',
  entreprise: 'Studio Lumiere SARL',
  adresse: '42 rue de la Photographie, 75011 Paris',
  notes: 'Preference pour la lumiere naturelle. Allergique au latex (gants).',
};

// ─── Tab Config ──────────────────────────────────────────────────────

const tabConfig: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'reservations', label: 'Reservations', icon: CalendarDays },
  { id: 'factures', label: 'Factures', icon: FileText },
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'packs', label: 'Packs', icon: Package },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getStatusBadgeClass(statut: Booking['statut']): string {
  const map: Record<Booking['statut'], string> = {
    confirmee: styles.badgeConfirmee,
    en_attente: styles.badgeEnAttente,
    annulee: styles.badgeAnnulee,
    terminee: styles.badgeTerminee,
  };
  return map[statut];
}

function getStatusLabel(statut: Booking['statut']): string {
  const map: Record<Booking['statut'], string> = {
    confirmee: 'Confirmee',
    en_attente: 'En attente',
    annulee: 'Annulee',
    terminee: 'Terminee',
  };
  return map[statut];
}

function getInvoiceStatusClass(statut: Invoice['statut']): string {
  const map: Record<Invoice['statut'], string> = {
    payee: styles.badgePayee,
    impayee: styles.badgeImpayee,
    partielle: styles.badgePartielle,
  };
  return map[statut];
}

function getInvoiceStatusLabel(statut: Invoice['statut']): string {
  const map: Record<Invoice['statut'], string> = {
    payee: 'Payee',
    impayee: 'Impayee',
    partielle: 'Partielle',
  };
  return map[statut];
}

// ─── Sub-components ──────────────────────────────────────────────────

function NextBookingCard() {
  const upcoming = mockBookings
    .filter((b) => b.statut === 'confirmee' || b.statut === 'en_attente')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const next = upcoming[0];
  if (!next) return null;

  return (
    <div className={styles.featuredCard}>
      <div className={styles.featuredIcon}>
        <Camera size={28} />
      </div>
      <div className={styles.featuredInfo}>
        <span className={styles.featuredLabel}>Prochaine reservation</span>
        <span className={styles.featuredTitle}>{next.type}</span>
        <div className={styles.featuredMeta}>
          <span className={styles.featuredMetaItem}>
            <CalendarDays size={14} />
            {formatDate(next.date)}
          </span>
          <span className={styles.featuredMetaItem}>
            <Clock size={14} />
            {next.heure}
          </span>
          <span className={styles.featuredMetaItem}>
            <MapPin size={14} />
            {next.espace}
          </span>
        </div>
      </div>
      <div className={styles.featuredActions}>
        <span className={`${styles.badge} ${getStatusBadgeClass(next.statut)}`}>
          {getStatusLabel(next.statut)}
        </span>
      </div>
    </div>
  );
}

function ReservationsTab() {
  const upcoming = mockBookings
    .filter((b) => b.statut === 'confirmee' || b.statut === 'en_attente')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = mockBookings
    .filter((b) => b.statut === 'terminee' || b.statut === 'annulee')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>Reservations a venir</div>
            <div className={styles.sectionSubtitle}>
              {upcoming.length} reservation{upcoming.length > 1 ? 's' : ''} programmee{upcoming.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {upcoming.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaire</th>
                <th>Type</th>
                <th>Espace</th>
                <th>Statut</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((b) => (
                <tr key={b.id}>
                  <td>{formatDate(b.date)}</td>
                  <td>{b.heure}</td>
                  <td>{b.type}</td>
                  <td>{b.espace}</td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadgeClass(b.statut)}`}>
                      {getStatusLabel(b.statut)}
                    </span>
                  </td>
                  <td className={styles.amount}>{formatCurrency(b.prix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <CalendarDays className={styles.emptyIcon} />
            <span className={styles.emptyText}>Aucune reservation a venir</span>
          </div>
        )}
      </div>

      <div className={styles.sectionCard} style={{ marginTop: 'var(--space-6)' }}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>Historique</div>
            <div className={styles.sectionSubtitle}>
              {past.length} reservation{past.length > 1 ? 's' : ''} passee{past.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {past.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaire</th>
                <th>Type</th>
                <th>Espace</th>
                <th>Statut</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              {past.map((b) => (
                <tr key={b.id}>
                  <td>{formatDate(b.date)}</td>
                  <td>{b.heure}</td>
                  <td>{b.type}</td>
                  <td>{b.espace}</td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadgeClass(b.statut)}`}>
                      {getStatusLabel(b.statut)}
                    </span>
                  </td>
                  <td className={styles.amount}>{formatCurrency(b.prix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <CalendarDays className={styles.emptyIcon} />
            <span className={styles.emptyText}>Aucun historique</span>
          </div>
        )}
      </div>
    </>
  );
}

function FacturesTab() {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Mes factures</div>
          <div className={styles.sectionSubtitle}>{mockInvoices.length} facture{mockInvoices.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Numero</th>
            <th>Date</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mockInvoices.map((inv) => (
            <tr key={inv.id}>
              <td style={{ fontWeight: 500 }}>{inv.numero}</td>
              <td>{formatDate(inv.date)}</td>
              <td>{inv.description}</td>
              <td className={styles.amount}>{formatCurrency(inv.montant)}</td>
              <td>
                <span className={`${styles.badge} ${getInvoiceStatusClass(inv.statut)}`}>
                  {getInvoiceStatusLabel(inv.statut)}
                </span>
              </td>
              <td>
                <button className={styles.actionBtn} type="button">
                  <Download size={14} />
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfilTab() {
  const [profile, setProfile] = useState(mockProfile);

  const handleChange = (field: keyof typeof mockProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Informations personnelles</div>
          <div className={styles.sectionSubtitle}>Gerez vos coordonnees et preferences</div>
        </div>
      </div>
      <div className={styles.profileGrid}>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="prenom">Prenom</label>
          <input
            id="prenom"
            className={styles.profileInput}
            type="text"
            value={profile.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
          />
        </div>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="nom">Nom</label>
          <input
            id="nom"
            className={styles.profileInput}
            type="text"
            value={profile.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
          />
        </div>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="email">Email</label>
          <input
            id="email"
            className={styles.profileInput}
            type="email"
            value={profile.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="telephone">Telephone</label>
          <input
            id="telephone"
            className={styles.profileInput}
            type="tel"
            value={profile.telephone}
            onChange={(e) => handleChange('telephone', e.target.value)}
          />
        </div>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="entreprise">Entreprise</label>
          <input
            id="entreprise"
            className={styles.profileInput}
            type="text"
            value={profile.entreprise}
            onChange={(e) => handleChange('entreprise', e.target.value)}
          />
        </div>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="adresse">Adresse</label>
          <input
            id="adresse"
            className={styles.profileInput}
            type="text"
            value={profile.adresse}
            onChange={(e) => handleChange('adresse', e.target.value)}
          />
        </div>
        <div className={`${styles.profileField} ${styles.profileFieldFull}`}>
          <label className={styles.profileLabel} htmlFor="notes">Notes / Preferences</label>
          <textarea
            id="notes"
            className={styles.profileTextarea}
            value={profile.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>
        <div className={styles.profileActions}>
          <Button variant="secondary">Annuler</Button>
          <Button variant="primary">Sauvegarder</Button>
        </div>
      </div>
    </div>
  );
}

function PacksTab() {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Mes packs</div>
          <div className={styles.sectionSubtitle}>{mockPacks.filter((p) => p.actif).length} pack{mockPacks.filter((p) => p.actif).length > 1 ? 's' : ''} actif{mockPacks.filter((p) => p.actif).length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div className={styles.packsGrid}>
        {mockPacks.map((pack) => {
          const remaining = pack.sessionsTotal - pack.sessionsUtilisees;
          const progressPercent = (pack.sessionsUtilisees / pack.sessionsTotal) * 100;

          return (
            <div key={pack.id} className={styles.packCard}>
              <div className={styles.packHeader}>
                <span className={styles.packName}>{pack.nom}</span>
                <span className={styles.packBadge} style={!pack.actif ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}>
                  {pack.actif ? 'Actif' : 'Expire'}
                </span>
              </div>
              <div className={styles.packDetails}>
                <div className={styles.packDetailRow}>
                  <span>Sessions restantes</span>
                  <span className={styles.packDetailValue}>{remaining} / {pack.sessionsTotal}</span>
                </div>
                <div className={styles.packDetailRow}>
                  <span>Date d&apos;achat</span>
                  <span className={styles.packDetailValue}>{formatDate(pack.dateAchat)}</span>
                </div>
                <div className={styles.packDetailRow}>
                  <span>Expiration</span>
                  <span className={styles.packDetailValue}>{formatDate(pack.dateExpiration)}</span>
                </div>
              </div>
              <div className={styles.packProgress}>
                <div className={styles.packProgressLabel}>
                  <span>Utilisation</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className={styles.packProgressBar}>
                  <div
                    className={styles.packProgressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaiementsTab() {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Historique des paiements</div>
          <div className={styles.sectionSubtitle}>{mockPayments.length} paiement{mockPayments.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Facture / Pack</th>
            <th>Methode</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {mockPayments.map((p) => (
            <tr key={p.id}>
              <td>{formatDate(p.date)}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{p.reference}</td>
              <td>{p.factureNumero}</td>
              <td>{p.methode}</td>
              <td className={styles.amount}>{formatCurrency(p.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function ClientPortal() {
  const [activeTab, setActiveTab] = useState<TabId>('reservations');

  const renderTab = () => {
    switch (activeTab) {
      case 'reservations':
        return <ReservationsTab />;
      case 'factures':
        return <FacturesTab />;
      case 'profil':
        return <ProfilTab />;
      case 'packs':
        return <PacksTab />;
      case 'paiements':
        return <PaiementsTab />;
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="Portail Client"
        subtitle="Vue client - Reservations, factures et profil"
      />

      <div className={styles.content}>
        <NextBookingCard />

        <div className={styles.tabs}>
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {renderTab()}
      </div>
    </div>
  );
}
