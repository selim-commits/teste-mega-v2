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

  const formatDuration = (service: EmbedService) => {
    const min = service.min_booking_hours;
    const max = service.max_booking_hours;
    if (min === max) return `${min}h`;
    return `${min}h - ${max}h`;
  };

  return (
    <div className="rooom-service-list-container">
      <h2 className="rooom-service-list-heading">Choisissez un espace</h2>
      <div className="rooom-service-list">
        {services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={() => selectService(service)}
            formatPrice={formatPrice}
            formatDuration={formatDuration}
          />
        ))}
      </div>
      {services.length === 0 && !isLoading && (
        <div className="rooom-service-list-empty">
          Aucun espace disponible pour le moment.
        </div>
      )}
    </div>
  );
}

interface ServiceRowProps {
  service: EmbedService;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (price: number) => string;
  formatDuration: (service: EmbedService) => string;
}

function ServiceRow({
  service,
  isSelected,
  onSelect,
  formatPrice,
  formatDuration,
}: ServiceRowProps) {
  return (
    <button
      type="button"
      className={`rooom-service-row ${isSelected ? 'rooom-service-row-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="rooom-service-row-info">
        <span className="rooom-service-row-name">{service.name}</span>
        {service.description && (
          <span className="rooom-service-row-desc">{service.description}</span>
        )}
        <span className="rooom-service-row-duration">{formatDuration(service)}</span>
      </div>
      <div className="rooom-service-row-action">
        <span className="rooom-service-row-price">
          {formatPrice(service.hourly_rate)}/h
        </span>
        <span className="rooom-service-row-btn">Selectionner</span>
      </div>
    </button>
  );
}
