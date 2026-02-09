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
  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Compute dynamic week days (Mon-Sun) based on current date
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon...6=Sat
    // Calculate offset to Monday: if Sunday(0) -> -6, else 1 - currentDay
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.getDate();
    });
  }, []);

  const times = ['09:00', '10:30', '11:00', '14:00', '15:30', '17:00'];
  const bookedIndices = [1, 4]; // 10:30 and 15:30 are booked
  const selectedIndex = 3; // 14:00 is pre-selected
  const selectedDay = 2; // Wednesday selected in calendar

  return (
    <div className={styles.bookingPreview}>
      {/* Step indicator */}
      <div className={styles.stepIndicator}>
        <span className={styles.stepItem}>1. Service</span>
        <span className={styles.stepSeparator}>&gt;</span>
        <span className={`${styles.stepItem} ${styles.stepItemActive}`}>2. Date</span>
        <span className={styles.stepSeparator}>&gt;</span>
        <span className={styles.stepItem}>3. Horaire</span>
      </div>

      {/* Service pill */}
      <span
        className={styles.servicePill}
        style={{
          backgroundColor: `${appearance.primaryColor}15`,
          color: appearance.primaryColor,
        }}
      >
        Seance Portrait - 1h
      </span>

      {/* Mini calendar - 7 days Mon-Sun */}
      <div className={styles.miniCalendar}>
        {weekDays.map((dayNum, i) => (
          <div
            key={i}
            className={styles.calendarDay}
            style={{
              backgroundColor: i === selectedDay ? appearance.primaryColor : 'transparent',
              color: i === selectedDay ? '#fff' : appearance.textColor,
              borderRadius: appearance.borderRadius / 2,
            }}
          >
            <span className={styles.dayLabel}>{dayLabels[i]}</span>
            <span className={styles.dayNumber}>{dayNum}</span>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className={styles.timeSlots}>
        {times.map((time, i) => {
          const isBooked = bookedIndices.includes(i);
          const isSelected = i === selectedIndex;

          return (
            <div
              key={time}
              className={`${styles.timeSlot} ${isBooked ? styles.timeSlotBooked : ''}`}
              style={{
                backgroundColor: isSelected
                  ? appearance.primaryColor
                  : isBooked
                    ? 'transparent'
                    : 'transparent',
                borderColor: isSelected
                  ? appearance.primaryColor
                  : appearance.secondaryColor + '40',
                borderRadius: appearance.borderRadius / 2,
                color: isSelected ? '#fff' : appearance.textColor,
              }}
            >
              {time}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatPreview({ appearance }: { appearance: WidgetConfig['appearance'] }) {
  const messages: Array<{ sender: 'bot' | 'user'; text: string; time: string }> = [
    { sender: 'bot', text: 'Bonjour ! Comment puis-je vous aider ?', time: '14:32' },
    { sender: 'user', text: 'Je voudrais reserver une seance photo', time: '14:33' },
    { sender: 'bot', text: 'Bien sur ! Quel type de seance recherchez-vous ?', time: '14:33' },
    { sender: 'user', text: 'Un portrait professionnel', time: '14:34' },
    { sender: 'bot', text: 'Parfait, nous avons plusieurs formules disponibles. Souhaitez-vous voir nos offres ?', time: '14:34' },
  ];

  return (
    <div className={styles.chatPreview}>
      {/* Chat header with online indicator */}
      <div className={styles.chatHeaderOnline}>
        <div
          className={styles.avatarCircle}
          style={{ backgroundColor: appearance.primaryColor }}
        >
          R
        </div>
        <span style={{ color: appearance.textColor }}>Rooom Studio</span>
        <div className={styles.onlineIndicator} />
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`${styles.messageRow} ${msg.sender === 'user' ? styles.messageRowUser : ''}`}>
              {msg.sender === 'bot' && (
                <div
                  className={styles.avatarCircle}
                  style={{ backgroundColor: appearance.primaryColor, width: 24, height: 24, fontSize: 10 }}
                >
                  R
                </div>
              )}
              <div
                className={msg.sender === 'bot' ? styles.messageBot : styles.messageUser}
                style={{
                  backgroundColor: msg.sender === 'bot'
                    ? `${appearance.primaryColor}15`
                    : appearance.primaryColor,
                  borderRadius: appearance.borderRadius,
                  color: msg.sender === 'bot' ? appearance.textColor : '#fff',
                }}
              >
                {msg.text}
              </div>
            </div>
            <div className={`${styles.timestamp} ${msg.sender === 'user' ? styles.timestampRight : ''}`}
              style={{ marginLeft: msg.sender === 'bot' ? 32 : 0 }}
            >
              {msg.time}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className={styles.messageRow}>
          <div
            className={styles.avatarCircle}
            style={{ backgroundColor: appearance.primaryColor, width: 24, height: 24, fontSize: 10 }}
          >
            R
          </div>
          <div
            className={styles.typingIndicator}
            style={{
              backgroundColor: `${appearance.primaryColor}15`,
              borderRadius: appearance.borderRadius,
            }}
          >
            <span className={styles.typingDot} style={{ backgroundColor: appearance.textColor }} />
            <span className={styles.typingDot} style={{ backgroundColor: appearance.textColor }} />
            <span className={styles.typingDot} style={{ backgroundColor: appearance.textColor }} />
          </div>
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
    { name: 'Decouverte', price: '89', popular: false, features: ['1 photo retouchee', '30 min de shooting'] },
    { name: 'Essentiel', price: '190', popular: false, features: ['5 photos retouchees', '1h de shooting'] },
    { name: 'Pro', price: '390', popular: true, features: ['15 photos retouchees', '2h + maquillage inclus'] },
    { name: 'Premium', price: '690', popular: false, features: ['30 photos retouchees', 'Demi-journee complete'] },
  ];

  return (
    <div className={styles.packsPreview}>
      {packs.map((pack) => (
        <div
          key={pack.name}
          className={styles.packCardEnhanced}
          style={{
            borderColor: pack.popular ? appearance.primaryColor : appearance.secondaryColor + '40',
            borderWidth: pack.popular ? 2 : 1,
            borderRadius: appearance.borderRadius,
            backgroundColor: pack.popular ? `${appearance.primaryColor}08` : 'transparent',
          }}
        >
          {pack.popular && (
            <div
              className={styles.packPopularBadge}
              style={{ backgroundColor: appearance.primaryColor }}
            >
              Populaire
            </div>
          )}
          <div className={styles.packCardHeader}>
            <span
              className={styles.packName}
              style={{ color: appearance.textColor, fontWeight: 600 }}
            >
              {pack.name}
            </span>
          </div>
          <div className={styles.packFeatures}>
            {pack.features.map((feature, fi) => (
              <span key={fi} className={styles.packFeature} style={{ color: appearance.textColor }}>
                {feature}
              </span>
            ))}
          </div>
          <div className={styles.packFooter}>
            <span
              className={styles.packPrice}
              style={{ color: appearance.primaryColor }}
            >
              {pack.price}EUR
            </span>
            <button
              className={styles.packChooseBtn}
              style={{
                borderColor: appearance.primaryColor,
                color: appearance.primaryColor,
                borderRadius: appearance.borderRadius,
              }}
            >
              Choisir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
