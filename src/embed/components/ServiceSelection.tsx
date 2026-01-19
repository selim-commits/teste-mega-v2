// src/embed/components/ServiceSelection.tsx
import { useEmbedStore } from '../store/embedStore';
import type { EmbedService } from '../types';

export function ServiceSelection() {
  const { services, selectedService, selectService, isLoading } = useEmbedStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="rooom-services" style={styles.services}>
      <h2 className="rooom-mb-4" style={styles.heading}>
        Choisissez un espace
      </h2>
      <div className="rooom-services-grid" style={styles.servicesGrid}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={() => selectService(service)}
            formatPrice={formatPrice}
          />
        ))}
      </div>
      {services.length === 0 && !isLoading && (
        <div
          className="rooom-text-center rooom-text-muted rooom-mt-6"
          style={styles.emptyState}
        >
          Aucun espace disponible pour le moment.
        </div>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: EmbedService;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (price: number) => string;
}

function ServiceCard({
  service,
  isSelected,
  onSelect,
  formatPrice,
}: ServiceCardProps) {
  return (
    <button
      className={`rooom-service-card ${isSelected ? 'rooom-card-selected' : ''}`}
      onClick={onSelect}
      type="button"
      style={{
        ...styles.serviceCard,
        ...(isSelected ? styles.serviceCardSelected : {}),
      }}
    >
      {service.image_url && (
        <img
          src={service.image_url}
          alt={service.name}
          className="rooom-service-image"
          style={styles.serviceImage}
        />
      )}
      <div className="rooom-service-content" style={styles.serviceContent}>
        <h3 className="rooom-service-name" style={styles.serviceName}>
          {service.name}
        </h3>
        {service.description && (
          <p className="rooom-service-description" style={styles.serviceDescription}>
            {service.description}
          </p>
        )}
        <div className="rooom-service-meta" style={styles.serviceMeta}>
          <span className="rooom-service-price" style={styles.servicePrice}>
            {formatPrice(service.hourly_rate)}/h
          </span>
          {service.amenities.length > 0 && (
            <span className="rooom-service-amenities" style={styles.serviceAmenities}>
              {service.amenities.slice(0, 3).join(' • ')}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// Inline styles for component
const styles: Record<string, React.CSSProperties> = {
  services: {
    padding: '1rem',
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: 'var(--rooom-text-primary, #1a1a1a)',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  serviceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    padding: 0,
    border: '1px solid var(--rooom-border-color, #e5e5e5)',
    borderRadius: '0.75rem',
    backgroundColor: 'var(--rooom-bg-card, #ffffff)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    textAlign: 'left',
    outline: 'none',
  },
  serviceCardSelected: {
    borderColor: 'var(--rooom-accent-color, #3b82f6)',
    boxShadow: '0 0 0 2px var(--rooom-accent-color, #3b82f6)',
  },
  serviceImage: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
  },
  serviceContent: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  serviceName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--rooom-text-primary, #1a1a1a)',
    margin: 0,
  },
  serviceDescription: {
    fontSize: '0.875rem',
    color: 'var(--rooom-text-secondary, #6b7280)',
    margin: 0,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  serviceMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--rooom-border-color, #e5e5e5)',
  },
  servicePrice: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--rooom-accent-color, #3b82f6)',
  },
  serviceAmenities: {
    fontSize: '0.75rem',
    color: 'var(--rooom-text-muted, #9ca3af)',
  },
  emptyState: {
    textAlign: 'center',
    color: 'var(--rooom-text-muted, #9ca3af)',
    marginTop: '1.5rem',
    padding: '2rem',
  },
};
