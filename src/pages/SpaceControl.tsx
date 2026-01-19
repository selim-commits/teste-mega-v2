import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import styles from './SpaceControl.module.css';

const studios = [
  { id: 1, name: 'Studio A', type: 'Photo', color: '#FF4400' },
  { id: 2, name: 'Studio B', type: 'Vidéo', color: '#1890CC' },
  { id: 3, name: 'Studio C', type: 'Événement', color: '#7C3AED' },
  { id: 4, name: 'Cyclorama', type: 'Multi', color: '#00B83D' },
];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
];

const bookings = [
  { id: 1, studioId: 1, start: '09:00', end: '12:00', client: 'Marie Dupont', type: 'Photo Mode' },
  { id: 2, studioId: 2, start: '10:00', end: '16:00', client: 'Studio XYZ', type: 'Tournage Pub' },
  { id: 3, studioId: 1, start: '14:00', end: '18:00', client: 'Jean Martin', type: 'Portrait' },
  { id: 4, studioId: 3, start: '19:00', end: '22:00', client: 'Event Corp', type: 'Lancement produit' },
  { id: 5, studioId: 4, start: '08:00', end: '12:00', client: 'Photo Plus', type: 'Shooting e-commerce' },
];

export function SpaceControl() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const goToToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };
  const goNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className={styles.page}>
      <Header
        title="Space Control"
        subtitle="Gérez vos espaces et réservations"
      />

      <div className={styles.content}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.dateNav}>
            <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={goPrev} />
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={goNext} />
            <span className={styles.currentDate}>{formatDate(currentDate)}</span>
          </div>

          <div className={styles.toolbarActions}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
            <Button variant="secondary" size="sm" icon={<Filter size={16} />}>
              Filtres
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
              Nouvelle réservation
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card padding="none" className={styles.calendarCard}>
          <div className={styles.calendar}>
            {/* Time Column */}
            <div className={styles.timeColumn}>
              <div className={styles.cornerCell} />
              {timeSlots.map((time) => (
                <div key={time} className={styles.timeCell}>
                  {time}
                </div>
              ))}
            </div>

            {/* Studio Columns */}
            {studios.map((studio) => (
              <div key={studio.id} className={styles.studioColumn}>
                <div className={styles.studioHeader}>
                  <div
                    className={styles.studioColor}
                    style={{ backgroundColor: studio.color }}
                  />
                  <div className={styles.studioInfo}>
                    <span className={styles.studioName}>{studio.name}</span>
                    <span className={styles.studioType}>{studio.type}</span>
                  </div>
                  <button className={styles.studioMenu}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>

                <div className={styles.slotGrid}>
                  {timeSlots.map((time) => {
                    const booking = bookings.find(
                      (b) => b.studioId === studio.id && b.start === time
                    );

                    if (booking) {
                      const startIndex = timeSlots.indexOf(booking.start);
                      const endIndex = timeSlots.indexOf(booking.end);
                      const span = endIndex - startIndex;

                      return (
                        <motion.div
                          key={`${studio.id}-${time}`}
                          className={styles.bookingSlot}
                          style={{
                            gridRow: `span ${span}`,
                            backgroundColor: `${studio.color}15`,
                            borderLeftColor: studio.color,
                          }}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className={styles.bookingTime}>
                            {booking.start} - {booking.end}
                          </div>
                          <div className={styles.bookingClient}>{booking.client}</div>
                          <div className={styles.bookingType}>{booking.type}</div>
                        </motion.div>
                      );
                    }

                    // Check if this slot is part of an ongoing booking
                    const isOccupied = bookings.some((b) => {
                      if (b.studioId !== studio.id) return false;
                      const startIndex = timeSlots.indexOf(b.start);
                      const endIndex = timeSlots.indexOf(b.end);
                      const currentIndex = timeSlots.indexOf(time);
                      return currentIndex > startIndex && currentIndex < endIndex;
                    });

                    if (isOccupied) return null;

                    return (
                      <div key={`${studio.id}-${time}`} className={styles.emptySlot}>
                        <Plus size={12} className={styles.addIcon} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Studio Overview */}
        <div className={styles.studioOverview}>
          {studios.map((studio) => (
            <Card key={studio.id} padding="md" hoverable className={styles.studioCard}>
              <div className={styles.studioCardHeader}>
                <div
                  className={styles.studioCardColor}
                  style={{ backgroundColor: studio.color }}
                />
                <div>
                  <div className={styles.studioCardName}>{studio.name}</div>
                  <div className={styles.studioCardType}>{studio.type}</div>
                </div>
              </div>
              <div className={styles.studioCardStats}>
                <div className={styles.studioCardStat}>
                  <span className={styles.studioCardValue}>4</span>
                  <span className={styles.studioCardLabel}>Réservations</span>
                </div>
                <div className={styles.studioCardStat}>
                  <span className={styles.studioCardValue}>72%</span>
                  <span className={styles.studioCardLabel}>Occupation</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
