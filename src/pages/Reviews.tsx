import { useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle,
  XCircle,
  Flag,
  Mail,
  BarChart3,
  Eye,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useNotifications } from '../stores/uiStore';
import { isDemoMode } from '../lib/supabase';
import styles from './Reviews.module.css';

// Types
interface Review {
  id: string;
  client_name: string;
  client_email: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  service: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  response?: string;
  response_date?: string;
  flagged: boolean;
}

// Mock data
const mockReviews: Review[] = [
  {
    id: crypto.randomUUID(),
    client_name: 'Marie Dubois',
    client_email: 'marie.dubois@email.com',
    rating: 5,
    comment: 'Service exceptionnel ! Le studio est magnifique et l\'équipe très professionnelle. Photos de qualité remarquable.',
    service: 'Shooting Photo Mode',
    date: '2025-02-05T14:30:00Z',
    status: 'approved',
    verified: true,
    response: 'Merci beaucoup Marie ! Nous sommes ravis que votre expérience ait été à la hauteur.',
    response_date: '2025-02-06T09:00:00Z',
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Jean Lefebvre',
    client_email: 'jean.lefebvre@email.com',
    rating: 4,
    comment: 'Très bon studio, équipement moderne. Juste un petit délai dans la livraison des photos finales.',
    service: 'Shooting Corporate',
    date: '2025-02-03T10:15:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Sophie Martin',
    client_email: 'sophie.m@email.com',
    rating: 5,
    comment: 'Parfait de A à Z ! Accueil chaleureux, studio impeccable, résultat au-delà de mes attentes.',
    service: 'Portrait Professionnel',
    date: '2025-02-01T16:45:00Z',
    status: 'approved',
    verified: true,
    response: 'Merci Sophie ! Au plaisir de vous revoir.',
    response_date: '2025-02-02T10:30:00Z',
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Pierre Durand',
    client_email: 'p.durand@email.com',
    rating: 3,
    comment: 'Bon studio mais prix un peu élevé par rapport à la concurrence. Qualité correcte.',
    service: 'Shooting Produit',
    date: '2025-01-28T11:20:00Z',
    status: 'approved',
    verified: false,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Claire Bernard',
    client_email: 'claire.b@email.com',
    rating: 5,
    comment: 'Équipe au top, équipements dernière génération, ambiance parfaite. Je recommande à 100% !',
    service: 'Vidéo Promo',
    date: '2025-01-25T14:00:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Lucas Moreau',
    client_email: 'lucas.moreau@email.com',
    rating: 4,
    comment: 'Très satisfait du résultat. Studio bien situé et facile d\'accès. Équipe compétente.',
    service: 'Shooting Photo Famille',
    date: '2025-01-22T15:30:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Emma Rousseau',
    client_email: 'emma.r@email.com',
    rating: 5,
    comment: 'Expérience incroyable ! Le photographe a su me mettre à l\'aise. Photos sublimes.',
    service: 'Portrait Artistique',
    date: '2025-01-20T10:00:00Z',
    status: 'approved',
    verified: true,
    response: 'Merci Emma pour ce retour ! C\'était un plaisir.',
    response_date: '2025-01-21T09:15:00Z',
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Thomas Laurent',
    client_email: 'thomas.l@email.com',
    rating: 4,
    comment: 'Studio professionnel, bon rapport qualité/prix. Recommandé pour les shootings corporate.',
    service: 'Shooting Corporate',
    date: '2025-01-18T13:45:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Camille Petit',
    client_email: 'camille.petit@email.com',
    rating: 5,
    comment: 'Excellente prestation ! Studio bien équipé, personnel attentionné. Rendu final parfait.',
    service: 'Shooting Mode',
    date: '2025-01-15T16:00:00Z',
    status: 'approved',
    verified: false,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Nicolas Blanc',
    client_email: 'nicolas.blanc@email.com',
    rating: 4,
    comment: 'Bonne expérience globale. Matériel de qualité et bon accompagnement.',
    service: 'Vidéo Corporate',
    date: '2025-01-12T11:30:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Léa Girard',
    client_email: 'lea.girard@email.com',
    rating: 5,
    comment: 'Studio magnifique avec une équipe vraiment professionnelle. Je reviendrai sans hésiter !',
    service: 'Shooting Photo Mode',
    date: '2025-01-10T14:15:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Hugo Fournier',
    client_email: 'hugo.f@email.com',
    rating: 3,
    comment: 'Correct sans plus. Le studio manque un peu de flexibilité sur les horaires.',
    service: 'Portrait Professionnel',
    date: '2025-01-08T09:45:00Z',
    status: 'approved',
    verified: false,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Chloé Simon',
    client_email: 'chloe.simon@email.com',
    rating: 5,
    comment: 'Superbe expérience du début à la fin. Photos de mariage magnifiques, merci infiniment !',
    service: 'Photo Mariage',
    date: '2025-01-05T12:00:00Z',
    status: 'approved',
    verified: true,
    response: 'Merci Chloé ! Ce fut un honneur de capturer votre grand jour.',
    response_date: '2025-01-06T10:00:00Z',
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Alexandre Roux',
    client_email: 'alex.roux@email.com',
    rating: 4,
    comment: 'Bon studio, équipe sympa. Quelques ajustements possibles sur la post-production.',
    service: 'Shooting Produit',
    date: '2025-01-03T15:20:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Manon Leroy',
    client_email: 'manon.leroy@email.com',
    rating: 5,
    comment: 'Parfait ! Photographe à l\'écoute, studio spacieux et lumineux. Résultat impeccable.',
    service: 'Portrait Professionnel',
    date: '2025-01-01T10:30:00Z',
    status: 'approved',
    verified: true,
    flagged: false,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Antoine Mercier',
    client_email: 'antoine.m@email.com',
    rating: 2,
    comment: 'Déçu par le résultat. Les photos ne correspondent pas à ce qui était annoncé.',
    service: 'Shooting Corporate',
    date: '2025-02-07T09:00:00Z',
    status: 'pending',
    verified: false,
    flagged: true,
  },
  {
    id: crypto.randomUUID(),
    client_name: 'Juliette Garnier',
    client_email: 'juliette.g@email.com',
    rating: 5,
    comment: 'Extraordinaire ! Un grand merci pour ces souvenirs magnifiques.',
    service: 'Photo Famille',
    date: '2025-02-06T16:00:00Z',
    status: 'pending',
    verified: true,
    flagged: false,
  },
];

// Star rating component
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? 'var(--state-warning)' : 'none'}
          color={star <= rating ? 'var(--state-warning)' : 'var(--border-default)'}
        />
      ))}
    </div>
  );
}

export function Reviews() {
  const [reviews] = useState<Review[]>(isDemoMode ? mockReviews : []);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  const { success: showSuccess } = useNotifications();

  // Calculate stats
  const stats = useMemo(() => {
    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    const totalReviews = approvedReviews.length;
    const averageRating = totalReviews > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Distribution
    const distribution = {
      5: approvedReviews.filter((r) => r.rating === 5).length,
      4: approvedReviews.filter((r) => r.rating === 4).length,
      3: approvedReviews.filter((r) => r.rating === 3).length,
      2: approvedReviews.filter((r) => r.rating === 2).length,
      1: approvedReviews.filter((r) => r.rating === 1).length,
    };

    // Trend (mock: +12% vs last month)
    const trend = 12;

    const pendingCount = reviews.filter((r) => r.status === 'pending').length;

    return {
      totalReviews,
      averageRating,
      distribution,
      trend,
      pendingCount,
    };
  }, [reviews]);

  // Filtered & sorted reviews
  const filteredReviews = useMemo(() => {
    let result = reviews;

    if (filterRating !== 'all') {
      result = result.filter((r) => r.rating === filterRating);
    }

    if (filterService !== 'all') {
      result = result.filter((r) => r.service === filterService);
    }

    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.rating - a.rating;
    });

    return result;
  }, [reviews, filterRating, filterService, filterStatus, sortBy]);

  // Unique services
  const services = useMemo(() => {
    return Array.from(new Set(reviews.map((r) => r.service)));
  }, [reviews]);

  // Handlers
  const handleApprove = (_reviewId: string) => {
    showSuccess('Avis approuvé', 'L\'avis est maintenant visible publiquement');
  };

  const handleReject = (_reviewId: string) => {
    showSuccess('Avis rejeté', 'L\'avis a été masqué');
  };

  const handleFlag = (_reviewId: string) => {
    showSuccess('Avis signalé', 'L\'avis a été marqué pour modération');
  };

  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.response || '');
    setIsResponseModalOpen(true);
  };

  const handleSaveResponse = () => {
    if (!selectedReview) return;
    showSuccess('Réponse publiée', 'Votre réponse a été ajoutée à l\'avis');
    setIsResponseModalOpen(false);
    setSelectedReview(null);
    setResponseText('');
  };

  const handleRequestReview = () => {
    showSuccess('Email envoyé', 'La demande d\'avis a été envoyée au client');
    setIsRequestModalOpen(false);
  };

  return (
    <div className={styles.page}>
      <Header
        title="Avis & Notes"
        subtitle="Gérez les avis clients et améliorez votre réputation"
        actions={
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => setIsRequestModalOpen(true)}>
              <Mail size={16} />
              Demander un avis
            </Button>
            <Button onClick={() => setIsEmbedModalOpen(true)}>
              <Eye size={16} />
              Widget Aperçu
            </Button>
          </div>
        }
      />

      <div className={styles.content}>
        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className="card">
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Star size={20} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>
                  {stats.averageRating.toFixed(1)}
                  <span className={styles.statMax}>/5</span>
                </div>
                <div className={styles.statLabel}>Note moyenne</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MessageSquare size={20} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{stats.totalReviews}</div>
                <div className={styles.statLabel}>Avis totaux</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                {stats.trend >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>
                  {stats.trend >= 0 ? '+' : ''}
                  {stats.trend}%
                </div>
                <div className={styles.statLabel}>vs mois dernier</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <BarChart3 size={20} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{stats.pendingCount}</div>
                <div className={styles.statLabel}>En attente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="card">
          <div className="card-content">
            <h3 className={styles.sectionTitle}>Distribution des notes</h3>
            <div className={styles.distribution}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.distribution[rating as keyof typeof stats.distribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className={styles.distributionRow}>
                    <div className={styles.distributionLabel}>
                      {rating} <Star size={14} fill="var(--state-warning)" color="var(--state-warning)" />
                    </div>
                    <div className={styles.distributionBar}>
                      <div
                        className={styles.distributionFill}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className={styles.distributionCount}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className={styles.filterSelect}
            >
              <option value="all">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Toutes les prestations</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className={styles.filterSelect}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
              className={styles.filterSelect}
            >
              <option value="date">Plus récents</option>
              <option value="rating">Mieux notés</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className={styles.reviewsList}>
          {filteredReviews.length === 0 ? (
            <div className={styles.emptyState}>
              <Star size={48} />
              <h3>Aucun avis</h3>
              <p>Aucun avis ne correspond à vos filtres</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className={`card ${styles.reviewCard}`}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewClient}>
                    <div className={styles.reviewAvatar}>
                      {review.client_name.charAt(0)}
                    </div>
                    <div className={styles.reviewClientInfo}>
                      <div className={styles.reviewClientName}>
                        {review.client_name}
                        {review.verified && (
                          <Badge variant="success" size="sm" className={styles.verifiedBadge}>
                            <CheckCircle size={12} />
                            Vérifié
                          </Badge>
                        )}
                      </div>
                      <div className={styles.reviewMeta}>
                        {review.service} · {new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className={styles.reviewActions}>
                    {review.status === 'pending' && (
                      <>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleApprove(review.id)}
                          title="Approuver"
                        >
                          <CheckCircle size={18} color="var(--state-success)" />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleReject(review.id)}
                          title="Rejeter"
                        >
                          <XCircle size={18} color="var(--state-error)" />
                        </button>
                      </>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleFlag(review.id)}
                      title="Signaler"
                    >
                      <Flag size={18} color={review.flagged ? 'var(--state-error)' : 'var(--text-muted)'} />
                    </button>
                  </div>
                </div>

                <div className={styles.reviewBody}>
                  <StarRating rating={review.rating} size={20} />
                  <p className={styles.reviewComment}>{review.comment}</p>
                </div>

                {review.response && (
                  <div className={styles.reviewResponse}>
                    <div className={styles.responseHeader}>
                      <strong>Votre réponse</strong>
                      <span className={styles.responseDate}>
                        {new Date(review.response_date!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p className={styles.responseText}>{review.response}</p>
                  </div>
                )}

                <div className={styles.reviewFooter}>
                  <Badge variant={review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'error'}>
                    {review.status === 'approved' ? 'Approuvé' : review.status === 'pending' ? 'En attente' : 'Rejeté'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleRespond(review)}>
                    <MessageSquare size={16} />
                    {review.response ? 'Modifier la réponse' : 'Répondre'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Response Modal */}
      {isResponseModalOpen && selectedReview && (
        <Modal isOpen onClose={() => setIsResponseModalOpen(false)} size="md">
          <ModalHeader title="Répondre à l'avis" onClose={() => setIsResponseModalOpen(false)} />
          <ModalBody>
            <div className={styles.responsePreview}>
              <div className={styles.previewClient}>
                <strong>{selectedReview.client_name}</strong>
                <StarRating rating={selectedReview.rating} />
              </div>
              <p className={styles.previewComment}>{selectedReview.comment}</p>
            </div>
            <div className="form-field">
              <label className="form-label">Votre réponse</label>
              <textarea
                className={`form-input form-textarea ${styles.responseTextarea}`}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Rédigez une réponse professionnelle et courtoise..."
                rows={6}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsResponseModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveResponse} disabled={!responseText.trim()}>
              Publier la réponse
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Request Review Modal */}
      {isRequestModalOpen && (
        <Modal isOpen onClose={() => setIsRequestModalOpen(false)} size="md">
          <ModalHeader title="Demander un avis client" onClose={() => setIsRequestModalOpen(false)} />
          <ModalBody>
            <div className="form-field">
              <label className="form-label">Email du client</label>
              <input type="email" className="form-input" placeholder="client@email.com" />
            </div>
            <div className="form-field">
              <label className="form-label">Nom du client</label>
              <input type="text" className="form-input" placeholder="Nom complet" />
            </div>
            <div className="form-field">
              <label className="form-label">Prestation</label>
              <select className="form-input form-select">
                <option value="">Sélectionner une prestation</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRequestReview}>
              <Mail size={16} />
              Envoyer la demande
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Embed Preview Modal */}
      {isEmbedModalOpen && (
        <Modal isOpen onClose={() => setIsEmbedModalOpen(false)} size="lg">
          <ModalHeader title="Aperçu du widget d'avis" onClose={() => setIsEmbedModalOpen(false)} />
          <ModalBody>
            <div className={styles.embedPreview}>
              <div className={styles.embedWidget}>
                <div className={styles.embedHeader}>
                  <div className={styles.embedRating}>
                    <div className={styles.embedScore}>{stats.averageRating.toFixed(1)}</div>
                    <StarRating rating={Math.round(stats.averageRating)} size={18} />
                    <div className={styles.embedCount}>{stats.totalReviews} avis</div>
                  </div>
                </div>
                <div className={styles.embedReviews}>
                  {filteredReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className={styles.embedReviewCard}>
                      <div className={styles.embedReviewHeader}>
                        <StarRating rating={review.rating} size={14} />
                        <span className={styles.embedReviewDate}>
                          {new Date(review.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className={styles.embedReviewText}>{review.comment}</p>
                      <div className={styles.embedReviewAuthor}>— {review.client_name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className={styles.embedNote}>
                Ce widget peut être intégré sur votre site web pour afficher vos meilleurs avis.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsEmbedModalOpen(false)}>
              Fermer
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
