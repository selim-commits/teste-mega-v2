import { useState, useMemo } from 'react';
import {
  Camera,
  Upload,
  Download,
  Trash2,
  Heart,
  Grid3x3,
  List,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useNotifications } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import styles from './PhotoGallery.module.css';

type PhotoCategory = 'portrait' | 'produit' | 'evenement' | 'autre';
type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size';

interface Photo {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  category: PhotoCategory;
  studio: string;
  uploadDate: Date;
  size: number;
  isFavorite: boolean;
  width: number;
  height: number;
}

// Mock data generator
function generateMockPhotos(): Photo[] {
  const categories: PhotoCategory[] = ['portrait', 'produit', 'evenement', 'autre'];
  const studios = ['Studio A', 'Studio B', 'Studio C'];
  const colors = [
    '#E8F4F8', '#F3E8F8', '#F8F3E8', '#E8F8F3',
    '#F8E8F3', '#F3F8E8', '#E8F3F8', '#F8E8E8',
    '#E8E8F8', '#F8F8E8', '#E8F8E8', '#F8E8F8',
  ];

  return Array.from({ length: 15 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Photo_${String(i + 1).padStart(3, '0')}.jpg`,
    url: colors[i % colors.length],
    thumbnail: colors[i % colors.length],
    category: categories[i % categories.length],
    studio: studios[i % studios.length],
    uploadDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    size: Math.floor(Math.random() * 5000000) + 500000,
    isFavorite: Math.random() > 0.7,
    width: 3000 + Math.floor(Math.random() * 2000),
    height: 2000 + Math.floor(Math.random() * 2000),
  }));
}

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  portrait: 'Portrait',
  produit: 'Produit',
  evenement: 'Événement',
  autre: 'Autre',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function PhotoGallery() {
  const { success: showSuccess } = useNotifications();

  // State
  const [photos, setPhotos] = useState<Photo[]>(generateMockPhotos());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [studioFilter, setStudioFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('date');

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Get unique studios from photos
  const studios = useMemo(() => {
    const uniqueStudios = Array.from(new Set(photos.map((p) => p.studio)));
    return uniqueStudios.sort();
  }, [photos]);

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    let filtered = photos;

    // Search filter
    if (debouncedSearch) {
      filtered = filtered.filter((photo) =>
        photo.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Studio filter
    if (studioFilter !== 'all') {
      filtered = filtered.filter((photo) => photo.studio === studioFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((photo) => photo.category === categoryFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.uploadDate.getTime() - a.uploadDate.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return filtered;
  }, [photos, debouncedSearch, studioFilter, categoryFilter, sortBy]);

  // Stats by studio
  const studioStats = useMemo(() => {
    const stats: Record<string, number> = {};
    photos.forEach((photo) => {
      stats[photo.studio] = (stats[photo.studio] || 0) + 1;
    });
    return stats;
  }, [photos]);

  // Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    showSuccess('Photos ajoutées', 'Les photos ont été téléversées avec succès (démo)');
  };

  const handleUploadClick = () => {
    showSuccess('Upload démarré', 'Les photos sont en cours de téléversement (démo)');
  };

  const toggleFavorite = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, isFavorite: !photo.isFavorite } : photo
      )
    );
  };

  const handleDownload = (photo: Photo) => {
    showSuccess('Téléchargement démarré', `${photo.name} est en cours de téléchargement`);
  };

  const handleDeleteClick = (photo: Photo) => {
    setPhotoToDelete(photo);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!photoToDelete) return;

    setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
    showSuccess('Photo supprimée', `${photoToDelete.name} a été supprimée`);
    setDeleteConfirmOpen(false);
    setPhotoToDelete(null);
  };

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = filteredPhotos[currentPhotoIndex];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Camera size={28} />
          <div>
            <h1 className="heading-page">Galerie Photos</h1>
            <p className={styles.subtitle}>
              {filteredPhotos.length} photo{filteredPhotos.length > 1 ? 's' : ''}
              {studioFilter !== 'all' && ` - ${studioFilter}`}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="primary"
            icon={<Upload size={18} />}
            onClick={handleUploadClick}
          >
            Téléverser
          </Button>
        </div>
      </header>

      {/* Filters & Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par nom de photo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={styles.searchClear}
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.controlsRight}>
          <Button
            variant={showFilters ? 'primary' : 'ghost'}
            icon={<Filter size={18} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtres
          </Button>

          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.viewButtonActive : styles.viewButton}
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              className={viewMode === 'list' ? styles.viewButtonActive : styles.viewButton}
              onClick={() => setViewMode('list')}
              aria-label="Vue liste"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label htmlFor="studio-filter" className={styles.filterLabel}>
              Studio / Espace
            </label>
            <select
              id="studio-filter"
              value={studioFilter}
              onChange={(e) => setStudioFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tous les studios</option>
              {studios.map((studio) => (
                <option key={studio} value={studio}>
                  {studio} ({studioStats[studio] || 0})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="category-filter" className={styles.filterLabel}>
              Catégorie
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as PhotoCategory | 'all')}
              className={styles.filterSelect}
            >
              <option value="all">Toutes les catégories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sort-filter" className={styles.filterLabel}>
              Trier par
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className={styles.filterSelect}
            >
              <option value="date">Date (plus récent)</option>
              <option value="name">Nom (A-Z)</option>
              <option value="size">Taille (plus grand)</option>
            </select>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload size={32} className={styles.uploadIcon} />
        <p className={styles.uploadText}>
          Glissez-déposez vos photos ici ou{' '}
          <button onClick={handleUploadClick} className={styles.uploadButton}>
            parcourez
          </button>
        </p>
        <p className={styles.uploadHint}>JPG, PNG, WebP (max 10 MB)</p>
      </div>

      {/* Photos Grid/List */}
      {filteredPhotos.length === 0 ? (
        <div className={styles.emptyState}>
          <Camera size={64} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Aucune photo trouvée</h3>
          <p className={styles.emptyText}>
            {searchQuery || studioFilter !== 'all' || categoryFilter !== 'all'
              ? 'Essayez de modifier vos filtres ou votre recherche.'
              : 'Commencez par téléverser des photos.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {filteredPhotos.map((photo, index) => (
            <div key={photo.id} className={styles.photoCard}>
              <div
                className={styles.photoThumbnail}
                style={{ backgroundColor: photo.thumbnail }}
                onClick={() => openLightbox(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Voir ${photo.name} en grand`}
              >
                <div className={styles.photoOverlay}>
                  <Button
                    variant="ghost"
                    icon={<Heart size={18} fill={photo.isFavorite ? 'currentColor' : 'none'} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                    className={styles.photoAction}
                  />
                  <Button
                    variant="ghost"
                    icon={<Download size={18} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(photo);
                    }}
                    className={styles.photoAction}
                  />
                  <Button
                    variant="ghost"
                    icon={<Trash2 size={18} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(photo);
                    }}
                    className={styles.photoAction}
                  />
                </div>
                {photo.isFavorite && (
                  <div className={styles.favoriteBadge}>
                    <Star size={14} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className={styles.photoInfo}>
                <p className={styles.photoName}>{photo.name}</p>
                <div className={styles.photoMeta}>
                  <span className={styles.photoCategory}>
                    {CATEGORY_LABELS[photo.category]}
                  </span>
                  <span className={styles.photoSize}>{formatFileSize(photo.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Studio</th>
                <th>Catégorie</th>
                <th>Taille</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPhotos.map((photo, index) => (
                <tr key={photo.id} onClick={() => openLightbox(index)}>
                  <td>
                    <div className={styles.listPhotoName}>
                      <div
                        className={styles.listThumbnail}
                        style={{ backgroundColor: photo.thumbnail }}
                      />
                      {photo.name}
                      {photo.isFavorite && (
                        <Star size={14} fill="var(--state-warning)" className={styles.listStar} />
                      )}
                    </div>
                  </td>
                  <td>{photo.studio}</td>
                  <td>
                    <span className={styles.badge}>{CATEGORY_LABELS[photo.category]}</span>
                  </td>
                  <td>{formatFileSize(photo.size)}</td>
                  <td>{formatDate(photo.uploadDate)}</td>
                  <td>
                    <div className={styles.listActions}>
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(photo.id);
                        }}
                        aria-label="Favoris"
                      >
                        <Heart
                          size={16}
                          fill={photo.isFavorite ? 'currentColor' : 'none'}
                        />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo);
                        }}
                        aria-label="Télécharger"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(photo);
                        }}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && currentPhoto && (
        <Modal isOpen onClose={closeLightbox} size="xl">
          <ModalHeader
            title={currentPhoto.name}
            subtitle={`${currentPhoto.width} × ${currentPhoto.height} • ${formatFileSize(currentPhoto.size)} • ${formatDate(currentPhoto.uploadDate)}`}
            onClose={closeLightbox}
          />
          <ModalBody>
            <div className={styles.lightboxContent}>
              <button
                className={styles.lightboxNav}
                onClick={goToPrevious}
                aria-label="Photo précédente"
              >
                <ChevronLeft size={32} />
              </button>

              <div
                className={styles.lightboxImage}
                style={{ backgroundColor: currentPhoto.thumbnail }}
              >
                <div className={styles.lightboxImagePlaceholder}>
                  <Camera size={64} />
                  <p>{currentPhoto.name}</p>
                </div>
              </div>

              <button
                className={styles.lightboxNav}
                onClick={goToNext}
                aria-label="Photo suivante"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            <div className={styles.lightboxInfo}>
              <div className={styles.lightboxInfoItem}>
                <span className={styles.lightboxInfoLabel}>Studio</span>
                <span>{currentPhoto.studio}</span>
              </div>
              <div className={styles.lightboxInfoItem}>
                <span className={styles.lightboxInfoLabel}>Catégorie</span>
                <span className={styles.badge}>{CATEGORY_LABELS[currentPhoto.category]}</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              icon={<Heart size={18} fill={currentPhoto.isFavorite ? 'currentColor' : 'none'} />}
              onClick={() => toggleFavorite(currentPhoto.id)}
            >
              {currentPhoto.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              onClick={() => handleDownload(currentPhoto)}
            >
              Télécharger
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={18} />}
              onClick={() => {
                closeLightbox();
                handleDeleteClick(currentPhoto);
              }}
            >
              Supprimer
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && photoToDelete && (
        <Modal isOpen onClose={() => setDeleteConfirmOpen(false)} size="sm">
          <ModalHeader
            title="Confirmer la suppression"
            onClose={() => setDeleteConfirmOpen(false)}
          />
          <ModalBody>
            <p>
              Êtes-vous sûr de vouloir supprimer <strong>{photoToDelete.name}</strong> ? Cette
              action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
