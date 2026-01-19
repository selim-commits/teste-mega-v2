import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { DeviceType } from './DeviceSelector';
import type { WidgetConfig, WidgetType } from '../../pages/WidgetBuilder';
import styles from './WidgetPreview.module.css';

interface WidgetPreviewProps {
  config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>;
  device: DeviceType;
  isLoading?: boolean;
}

const deviceSizes: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 400, height: 500 },
  tablet: { width: 350, height: 450 },
  mobile: { width: 320, height: 500 },
};

export function WidgetPreview({ config, device, isLoading }: WidgetPreviewProps) {
  const { width, height } = deviceSizes[device];

  // Generate CSS variables from config
  const cssVariables = useMemo(() => ({
    '--rooom-primary': config.appearance.primaryColor,
    '--rooom-secondary': config.appearance.secondaryColor,
    '--rooom-background': config.appearance.backgroundColor,
    '--rooom-text': config.appearance.textColor,
    '--rooom-radius': `${config.appearance.borderRadius}px`,
    '--rooom-font-family': config.appearance.fontFamily,
  }), [config.appearance]);

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className={styles.loadingOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className={styles.spinner} size={32} />
            <span className={styles.loadingText}>Mise a jour du preview...</span>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            className={styles.previewFrame}
            style={{
              width,
              maxHeight: height,
              ...cssVariables,
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Widget Preview */}
            <div
              className={styles.widget}
              style={{
                backgroundColor: config.appearance.backgroundColor,
                borderRadius: config.appearance.borderRadius,
                fontFamily: config.appearance.fontFamily,
                color: config.appearance.textColor,
              }}
            >
              {/* Header */}
              <div className={styles.widgetHeader}>
                {config.content.logoUrl && (
                  <img
                    src={config.content.logoUrl}
                    alt="Logo"
                    className={styles.logo}
                  />
                )}
                <div className={styles.headerText}>
                  <h3
                    className={styles.title}
                    style={{ color: config.appearance.textColor }}
                  >
                    {config.content.title}
                  </h3>
                  <p
                    className={styles.subtitle}
                    style={{ color: config.appearance.secondaryColor }}
                  >
                    {config.content.subtitle}
                  </p>
                </div>
              </div>

              {/* Content based on widget type */}
              <div className={styles.widgetContent}>
                <WidgetTypeContent type={config.type} appearance={config.appearance} />
              </div>

              {/* Footer with CTA */}
              <div className={styles.widgetFooter}>
                <button
                  className={styles.ctaButton}
                  style={{
                    backgroundColor: config.appearance.primaryColor,
                    borderRadius: config.appearance.borderRadius / 2,
                  }}
                >
                  {config.content.buttonText}
                </button>
              </div>

              {/* Powered by badge */}
              <div className={styles.poweredBy}>
                <span style={{ color: config.appearance.secondaryColor }}>
                  Powered by <strong>ROOOM</strong>
                </span>
              </div>
            </div>

            {/* Custom CSS indicator */}
            {config.customCSS && (
              <div className={styles.customCSSBadge}>
                CSS personnalise actif
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device frame */}
      <div className={styles.deviceLabel}>
        {device === 'desktop' && 'Apercu Bureau'}
        {device === 'tablet' && 'Apercu Tablette'}
        {device === 'mobile' && 'Apercu Mobile'}
      </div>
    </div>
  );
}

// Component to render type-specific content
function WidgetTypeContent({ type, appearance }: { type: WidgetType; appearance: WidgetConfig['appearance'] }) {
  switch (type) {
    case 'booking':
      return <BookingPreview appearance={appearance} />;
    case 'chat':
      return <ChatPreview appearance={appearance} />;
    case 'packs':
      return <PacksPreview appearance={appearance} />;
    default:
      return null;
  }
}

function BookingPreview({ appearance }: { appearance: WidgetConfig['appearance'] }) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  const times = ['09:00', '10:00', '11:00', '14:00'];

  return (
    <div className={styles.bookingPreview}>
      {/* Mini calendar */}
      <div className={styles.miniCalendar}>
        {days.map((day, i) => (
          <div
            key={day}
            className={styles.calendarDay}
            style={{
              backgroundColor: i === 2 ? appearance.primaryColor : 'transparent',
              color: i === 2 ? '#fff' : appearance.textColor,
              borderRadius: appearance.borderRadius / 2,
            }}
          >
            <span className={styles.dayLabel}>{day}</span>
            <span className={styles.dayNumber}>{15 + i}</span>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className={styles.timeSlots}>
        {times.map((time, i) => (
          <div
            key={time}
            className={styles.timeSlot}
            style={{
              backgroundColor: i === 1 ? `${appearance.primaryColor}15` : 'transparent',
              borderColor: i === 1 ? appearance.primaryColor : appearance.secondaryColor + '40',
              borderRadius: appearance.borderRadius / 2,
              color: appearance.textColor,
            }}
          >
            {time}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPreview({ appearance }: { appearance: WidgetConfig['appearance'] }) {
  return (
    <div className={styles.chatPreview}>
      {/* Messages */}
      <div className={styles.messages}>
        <div
          className={styles.messageBot}
          style={{
            backgroundColor: `${appearance.primaryColor}15`,
            borderRadius: appearance.borderRadius,
            color: appearance.textColor,
          }}
        >
          Bonjour! Comment puis-je vous aider?
        </div>
        <div
          className={styles.messageUser}
          style={{
            backgroundColor: appearance.primaryColor,
            borderRadius: appearance.borderRadius,
          }}
        >
          Je voudrais reserver
        </div>
        <div
          className={styles.messageBot}
          style={{
            backgroundColor: `${appearance.primaryColor}15`,
            borderRadius: appearance.borderRadius,
            color: appearance.textColor,
          }}
        >
          Parfait! Quel type de session recherchez-vous?
        </div>
      </div>

      {/* Input */}
      <div
        className={styles.chatInput}
        style={{
          borderColor: appearance.secondaryColor + '40',
          borderRadius: appearance.borderRadius / 2,
          color: appearance.secondaryColor,
        }}
      >
        Ecrivez votre message...
      </div>
    </div>
  );
}

function PacksPreview({ appearance }: { appearance: WidgetConfig['appearance'] }) {
  const packs = [
    { name: 'Essentiel', price: '150', popular: false },
    { name: 'Pro', price: '350', popular: true },
    { name: 'Premium', price: '650', popular: false },
  ];

  return (
    <div className={styles.packsPreview}>
      {packs.map((pack) => (
        <div
          key={pack.name}
          className={styles.packCard}
          style={{
            borderColor: pack.popular ? appearance.primaryColor : appearance.secondaryColor + '40',
            borderRadius: appearance.borderRadius,
            backgroundColor: pack.popular ? `${appearance.primaryColor}08` : 'transparent',
          }}
        >
          {pack.popular && (
            <div
              className={styles.popularBadge}
              style={{ backgroundColor: appearance.primaryColor }}
            >
              Populaire
            </div>
          )}
          <span
            className={styles.packName}
            style={{ color: appearance.textColor }}
          >
            {pack.name}
          </span>
          <span
            className={styles.packPrice}
            style={{ color: appearance.primaryColor }}
          >
            {pack.price}EUR
          </span>
        </div>
      ))}
    </div>
  );
}
