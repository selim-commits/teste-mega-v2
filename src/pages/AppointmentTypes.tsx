import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ListChecks,
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import styles from './SettingsPage.module.css';

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
  isActive: boolean;
  description?: string;
}

const mockAppointmentTypes: AppointmentType[] = [
  {
    id: '1',
    name: 'Session Studio',
    duration: 60,
    price: 50,
    color: '#3B82F6',
    isActive: true,
    description: 'Session d\'enregistrement standard',
  },
  {
    id: '2',
    name: 'Mixage',
    duration: 120,
    price: 100,
    color: '#8B5CF6',
    isActive: true,
    description: 'Service de mixage professionnel',
  },
  {
    id: '3',
    name: 'Mastering',
    duration: 60,
    price: 75,
    color: '#EC4899',
    isActive: true,
    description: 'Mastering audio haute qualite',
  },
  {
    id: '4',
    name: 'Consultation',
    duration: 30,
    price: 0,
    color: '#10B981',
    isActive: false,
    description: 'Consultation gratuite pour nouveaux clients',
  },
];

export function AppointmentTypes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentTypes] = useState<AppointmentType[]>(mockAppointmentTypes);

  const filteredTypes = appointmentTypes.filter((type) =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className={styles.page}>
      <Header
        title="Types de rendez-vous"
        subtitle="Gerez vos services et leurs tarifs"
      />

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-blue)15' }}>
                <ListChecks size={20} color="var(--accent-blue)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{appointmentTypes.length}</span>
                <span className={styles.statLabel}>Types de service</span>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-green)15' }}>
                <DollarSign size={20} color="var(--accent-green)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>75 €</span>
                <span className={styles.statLabel}>Prix moyen</span>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card padding="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-purple)15' }}>
                <Clock size={20} color="var(--accent-purple)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>68 min</span>
                <span className={styles.statLabel}>Duree moyenne</span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={16} />}>
            Nouveau type
          </Button>
        </div>

        {/* Appointment Types Grid */}
        <div className={styles.grid}>
          {filteredTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="none" hoverable className={styles.card} style={{ opacity: type.isActive ? 1 : 0.6 }}>
                <div className={styles.cardHeader}>
                  <div
                    className={styles.cardIcon}
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <ListChecks size={24} color={type.color} />
                  </div>
                  <Dropdown
                    trigger={
                      <button style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 'var(--space-2)',
                        color: 'var(--text-muted)',
                      }} aria-label="Plus d'options">
                        <MoreVertical size={16} />
                      </button>
                    }
                    align="end"
                  >
                    <DropdownItem icon={<Edit2 size={16} />}>Modifier</DropdownItem>
                    <DropdownItem icon={<Copy size={16} />}>Dupliquer</DropdownItem>
                    <DropdownItem icon={type.isActive ? <EyeOff size={16} /> : <Eye size={16} />}>
                      {type.isActive ? 'Desactiver' : 'Activer'}
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<Trash2 size={16} />} destructive>
                      Supprimer
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <h4 className={styles.cardTitle}>{type.name}</h4>
                    {!type.isActive && <Badge variant="default" size="sm">Inactif</Badge>}
                  </div>
                  {type.description && (
                    <p className={styles.cardDescription}>{type.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {formatDuration(type.duration)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <DollarSign size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {type.price > 0 ? `${type.price} €` : 'Gratuit'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <Button variant="ghost" size="sm">Voir details</Button>
                  <Button variant="secondary" size="sm" icon={<Edit2 size={14} />}>
                    Modifier
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
