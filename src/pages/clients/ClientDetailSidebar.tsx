import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  DollarSign,
  Clock,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  FileText,
  Tag,
  Plus,
  Send,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import type { Client, ClientTier, Booking, ClientNote, ActivityType, ClientBookingStats } from './types';
import {
  getInitials,
  getScoreColor,
  generateClientScore,
  generateMockCrmStats,
  generateMockActivities,
  generateMockNotes,
  crmTagDefinitions,
  getTagColor,
} from './types';
import styles from '../Clients.module.css';

function getTierBadge(tier: ClientTier) {
  switch (tier) {
    case 'vip':
      return <Badge variant="warning" size="sm">VIP</Badge>;
    case 'premium':
      return <Badge variant="info" size="sm">Premium</Badge>;
    case 'standard':
    default:
      return <Badge variant="default" size="sm">Standard</Badge>;
  }
}

const activityConfig: Record<ActivityType, { label: string; color: string; icon: typeof Calendar }> = {
  reservation: { label: 'Reservation', color: 'var(--state-info)', icon: Calendar },
  paiement: { label: 'Paiement', color: 'var(--state-success)', icon: CreditCard },
  pack: { label: 'Pack', color: '#8B5CF6', icon: ShoppingBag },
  message: { label: 'Message', color: 'var(--accent-primary)', icon: MessageSquare },
  facture: { label: 'Facture', color: 'var(--state-warning)', icon: FileText },
};

interface ClientDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  clientBookings: Booking[];
  clientStats: ClientBookingStats;
  clientCrmTags: Record<string, string[]>;
  onToggleCrmTag: (clientId: string, tagId: string) => void;
  clientNotes: Record<string, ClientNote[]>;
  onSaveNote: (clientId: string, text: string) => void;
  onOpenEdit: (client: Client) => void;
  onOpenDelete: () => void;
}

export const ClientDetailSidebar = memo(function ClientDetailSidebar({
  isOpen,
  onClose,
  client,
  clientBookings,
  clientStats,
  clientCrmTags,
  onToggleCrmTag,
  clientNotes,
  onSaveNote,
  onOpenEdit,
  onOpenDelete,
}: ClientDetailSidebarProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const handleSaveNote = useCallback(() => {
    if (!client || !newNoteText.trim()) return;
    onSaveNote(client.id, newNoteText.trim());
    setNewNoteText('');
    setIsAddingNote(false);
  }, [client, newNoteText, onSaveNote]);

  return (
    <AnimatePresence>
      {isOpen && client && (
        <>
          <motion.div
            className={styles.sidebarOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.sidebar}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitle}>
                <h2>Details du client</h2>
                <button onClick={onClose}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className={styles.sidebarContent}>
              <div className={styles.clientProfile}>
                <div
                  className={styles.profileAvatar}
                  style={{
                    backgroundColor:
                      client.tier === 'vip'
                        ? 'var(--accent-orange)'
                        : client.tier === 'premium'
                        ? 'var(--accent-blue)'
                        : 'var(--bg-surface-hover)',
                  }}
                >
                  {getInitials(client.name)}
                </div>
                <h3>{client.name}</h3>
                <p>{client.company || 'Particulier'}</p>
                <div className={styles.profileBadges}>
                  {getTierBadge(client.tier)}
                  {client.is_active ? (
                    <Badge variant="success" size="sm" dot>Actif</Badge>
                  ) : (
                    <Badge variant="error" size="sm" dot>Inactif</Badge>
                  )}
                </div>
                {/* CRM Tags */}
                <div className={styles.crmTagsRow}>
                  {crmTagDefinitions.map((tag) => {
                    const isActive = (clientCrmTags[client.id] || []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`${styles.crmTag} ${isActive ? styles.crmTagActive : ''}`}
                        style={{
                          ...(isActive
                            ? { backgroundColor: tag.color, borderColor: tag.color }
                            : {}),
                        }}
                        onClick={() => onToggleCrmTag(client.id, tag.id)}
                      >
                        <Tag size={10} />
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CRM: Score client circulaire */}
              <div className={styles.sidebarSection}>
                <h4>Score client</h4>
                {(() => {
                  const crmScore = client.score || generateClientScore(client.id);
                  const circumference = 2 * Math.PI * 40;
                  const offset = circumference - (crmScore / 100) * circumference;
                  return (
                    <div className={styles.clientScoreCircle}>
                      <div className={styles.scoreCircleWrapper}>
                        <svg className={styles.scoreCircleSvg} viewBox="0 0 96 96">
                          <circle className={styles.scoreCircleTrack} cx="48" cy="48" r="40" />
                          <circle
                            className={styles.scoreCircleProgress}
                            cx="48" cy="48" r="40"
                            stroke={getScoreColor(crmScore)}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                          />
                        </svg>
                        <div className={styles.scoreCircleValue}>
                          <span className={styles.scoreCircleNumber}>{crmScore}</span>
                          <span className={styles.scoreCircleSuffix}>/100</span>
                        </div>
                      </div>
                      <span className={styles.scoreCircleLabel}>
                        {crmScore > 70 ? 'Excellent' : crmScore >= 40 ? 'Bon' : 'A ameliorer'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* CRM: Stats resume */}
              <div className={styles.sidebarSection}>
                <h4>Resume CRM</h4>
                {(() => {
                  const crmStats = generateMockCrmStats(client.id);
                  return (
                    <div className={styles.crmStatsGrid}>
                      <div className={styles.crmStatCard}>
                        <span className={styles.crmStatCardValue}>{crmStats.totalSpent.toLocaleString('fr-FR')} {'\u20AC'}</span>
                        <span className={styles.crmStatCardLabel}>Total depense</span>
                      </div>
                      <div className={styles.crmStatCard}>
                        <span className={styles.crmStatCardValue}>{crmStats.nbReservations}</span>
                        <span className={styles.crmStatCardLabel}>Nb reservations</span>
                      </div>
                      <div className={styles.crmStatCard}>
                        <span className={styles.crmStatCardValue}>{crmStats.derniereVisite}j</span>
                        <span className={styles.crmStatCardLabel}>Derniere visite</span>
                      </div>
                      <div className={styles.crmStatCard}>
                        <span className={styles.crmStatCardValue}>{crmStats.frequence}/mois</span>
                        <span className={styles.crmStatCardLabel}>Frequence</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className={styles.sidebarSection}>
                <h4>Informations de contact</h4>
                <div className={styles.contactList}>
                  {client.email && (
                    <div className={styles.contactRow}>
                      <Mail size={16} />
                      <a href={`mailto:${client.email}`}>{client.email}</a>
                    </div>
                  )}
                  {client.phone && (
                    <div className={styles.contactRow}>
                      <Phone size={16} />
                      <a href={`tel:${client.phone}`}>{client.phone}</a>
                    </div>
                  )}
                  {(client.address || client.city) && (
                    <div className={styles.contactRow}>
                      <MapPin size={16} />
                      <span>
                        {[client.address, client.postal_code, client.city, client.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.sidebarSection}>
                <h4>Statistiques</h4>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <Star size={20} />
                    <div>
                      <span className={styles.statValue}>{client.score || 0}</span>
                      <span className={styles.statLabel}>Score</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <Calendar size={20} />
                    <div>
                      <span className={styles.statValue}>{clientStats.totalBookings}</span>
                      <span className={styles.statLabel}>Reservations</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <DollarSign size={20} />
                    <div>
                      <span className={styles.statValue}>{clientStats.totalSpent.toLocaleString('fr-FR')} {'\u20AC'}</span>
                      <span className={styles.statLabel}>Total depense</span>
                    </div>
                  </div>
                  {clientStats.lastBooking && (
                    <div className={styles.statItem}>
                      <Clock size={20} />
                      <div>
                        <span className={styles.statValue}>
                          {new Date(clientStats.lastBooking.start_time).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className={styles.statLabel}>Derniere visite</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Score Progress Bar */}
                <div className={styles.scoreProgressSection}>
                  <div className={styles.scoreProgressHeader}>
                    <span>Score client</span>
                    <span>{client.score || 0}/100</span>
                  </div>
                  <Progress
                    value={client.score || 0}
                    max={100}
                    size="md"
                    variant={
                      (client.score || 0) >= 80
                        ? 'success'
                        : (client.score || 0) >= 50
                        ? 'warning'
                        : 'default'
                    }
                  />
                </div>
              </div>

              {client.tags && client.tags.length > 0 && (
                <div className={styles.sidebarSection}>
                  <h4>Tags</h4>
                  <div className={styles.tagsList}>
                    {client.tags.map((tag) => (
                      <span
                        key={tag}
                        className={styles.coloredTag}
                        style={{ '--tag-color': getTagColor(tag) } as React.CSSProperties}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking History */}
              {clientBookings.length > 0 && (
                <div className={styles.sidebarSection}>
                  <h4>Historique des reservations</h4>
                  <div className={styles.bookingHistory}>
                    {clientBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className={styles.bookingItem}>
                        <div className={styles.bookingInfo}>
                          <span className={styles.bookingTitle}>{booking.title}</span>
                          <span className={styles.bookingDate}>
                            {new Date(booking.start_time).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className={styles.bookingMeta}>
                          <Badge
                            variant={
                              booking.status === 'completed'
                                ? 'success'
                                : booking.status === 'confirmed'
                                ? 'info'
                                : booking.status === 'cancelled'
                                ? 'error'
                                : 'default'
                            }
                            size="sm"
                          >
                            {booking.status === 'completed'
                              ? 'Terminee'
                              : booking.status === 'confirmed'
                              ? 'Confirmee'
                              : booking.status === 'pending'
                              ? 'En attente'
                              : booking.status === 'cancelled'
                              ? 'Annulee'
                              : booking.status === 'in_progress'
                              ? 'En cours'
                              : booking.status}
                          </Badge>
                          <span className={styles.bookingAmount}>
                            {booking.total_amount?.toLocaleString('fr-FR')} {'\u20AC'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {clientBookings.length > 5 && (
                      <div className={styles.moreBookings}>
                        + {clientBookings.length - 5} autres reservations
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CRM: Activity Timeline */}
              <div className={styles.sidebarSection}>
                <h4>Activite recente</h4>
                <div className={styles.timeline}>
                  {generateMockActivities(client.id).map((activity) => {
                    const config = activityConfig[activity.type];
                    const IconComponent = config.icon;
                    return (
                      <div key={activity.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} style={{ borderColor: config.color }}>
                          <IconComponent size={8} color={config.color} />
                        </div>
                        <div className={styles.timelineItemHeader}>
                          <span className={styles.timelineType} style={{ color: config.color }}>
                            {config.label}
                          </span>
                          <span className={styles.timelineDate}>
                            {new Date(activity.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <span className={styles.timelineDescription}>{activity.description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CRM: Notes enrichies */}
              <div className={styles.sidebarSection}>
                <h4>Notes</h4>
                <div className={styles.notesList}>
                  {client.notes && (
                    <div className={styles.noteCard}>
                      <p className={styles.noteText}>{client.notes}</p>
                      <div className={styles.noteMeta}>
                        <span>par Vous</span>
                        <span>{new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  )}
                  {(clientNotes[client.id] || generateMockNotes(client.id)).map((note) => (
                    <div key={note.id} className={styles.noteCard}>
                      <p className={styles.noteText}>{note.text}</p>
                      <div className={styles.noteMeta}>
                        <span>par {note.author}</span>
                        <span>{new Date(note.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                  {isAddingNote ? (
                    <div className={styles.noteForm}>
                      <textarea
                        className={styles.noteTextarea}
                        placeholder="Ajouter une note..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                      />
                      <div className={styles.noteFormActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteText('');
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Send size={14} />}
                          onClick={handleSaveNote}
                          disabled={!newNoteText.trim()}
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.addNoteBtn}
                      onClick={() => setIsAddingNote(true)}
                    >
                      <Plus size={14} />
                      Ajouter une note
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.sidebarSection}>
                <h4>Informations</h4>
                <div className={styles.metaList}>
                  <div className={styles.metaRow}>
                    <span>Cree le</span>
                    <span>{new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Modifie le</span>
                    <span>{new Date(client.updated_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sidebarFooter}>
              <Button
                variant="secondary"
                fullWidth
                icon={<Edit2 size={16} />}
                onClick={() => {
                  onOpenEdit(client);
                  onClose();
                }}
              >
                Modifier
              </Button>
              <Button
                variant="ghost"
                fullWidth
                icon={<Trash2 size={16} />}
                onClick={onOpenDelete}
                className={styles.deleteBtn}
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
