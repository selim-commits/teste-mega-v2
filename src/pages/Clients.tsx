import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Users,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
  UserPlus,
  Heart,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import styles from './Clients.module.css';

const stats = [
  { label: 'Total clients', value: '1,247', icon: Users, change: '+12%', color: 'var(--accent-blue)' },
  { label: 'Nouveaux ce mois', value: '23', icon: UserPlus, change: '+8%', color: 'var(--accent-green)' },
  { label: 'Taux de rétention', value: '94%', icon: Heart, change: '+2%', color: 'var(--accent-orange)' },
  { label: 'Revenu moyen', value: '€2,450', icon: TrendingUp, change: '+15%', color: 'var(--accent-purple)' },
];

const clients = [
  {
    id: 1,
    name: 'Marie Dupont',
    email: 'marie.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    company: 'Studio MDP',
    location: 'Paris',
    type: 'VIP',
    totalSpent: 15420,
    bookings: 24,
    lastVisit: '2024-01-18',
    rating: 5,
    avatar: null,
  },
  {
    id: 2,
    name: 'Jean Martin',
    email: 'jean.martin@company.fr',
    phone: '+33 6 98 76 54 32',
    company: 'Martin Productions',
    location: 'Lyon',
    type: 'Regular',
    totalSpent: 8750,
    bookings: 12,
    lastVisit: '2024-01-15',
    rating: 4,
    avatar: null,
  },
  {
    id: 3,
    name: 'Sophie Bernard',
    email: 'sophie@bernardphoto.com',
    phone: '+33 6 11 22 33 44',
    company: 'Bernard Photo',
    location: 'Bordeaux',
    type: 'VIP',
    totalSpent: 22100,
    bookings: 35,
    lastVisit: '2024-01-17',
    rating: 5,
    avatar: null,
  },
  {
    id: 4,
    name: 'Lucas Petit',
    email: 'lucas.petit@gmail.com',
    phone: '+33 6 55 44 33 22',
    company: 'Freelance',
    location: 'Marseille',
    type: 'New',
    totalSpent: 850,
    bookings: 2,
    lastVisit: '2024-01-10',
    rating: 4,
    avatar: null,
  },
  {
    id: 5,
    name: 'Emma Leroy',
    email: 'emma@leroystudio.fr',
    phone: '+33 6 77 88 99 00',
    company: 'Leroy Studio',
    location: 'Toulouse',
    type: 'Regular',
    totalSpent: 5200,
    bookings: 8,
    lastVisit: '2024-01-12',
    rating: 5,
    avatar: null,
  },
  {
    id: 6,
    name: 'Thomas Moreau',
    email: 'thomas@moreaumedia.com',
    phone: '+33 6 22 33 44 55',
    company: 'Moreau Media',
    location: 'Nantes',
    type: 'VIP',
    totalSpent: 18900,
    bookings: 28,
    lastVisit: '2024-01-16',
    rating: 5,
    avatar: null,
  },
];

const filters = [
  { id: 'all', name: 'Tous', count: 1247 },
  { id: 'vip', name: 'VIP', count: 89 },
  { id: 'regular', name: 'Réguliers', count: 654 },
  { id: 'new', name: 'Nouveaux', count: 156 },
  { id: 'inactive', name: 'Inactifs', count: 348 },
];

export function Clients() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter((client) => {
    const matchesFilter = activeFilter === 'all' || client.type.toLowerCase() === activeFilter;
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'VIP':
        return <Badge variant="warning" size="sm">VIP</Badge>;
      case 'Regular':
        return <Badge variant="info" size="sm">Régulier</Badge>;
      case 'New':
        return <Badge variant="success" size="sm">Nouveau</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={styles.page}>
      <Header
        title="Client 360"
        subtitle="Gérez vos relations clients"
      />

      <div className={styles.content}>
        {/* Stats Overview */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="md" className={styles.statCard}>
                <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={20} color={stat.color} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
                <span className={styles.statChange}>{stat.change}</span>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
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
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.active : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span>{filter.name}</span>
              <span className={styles.filterCount}>{filter.count}</span>
            </button>
          ))}
        </div>

        {/* Clients Grid */}
        <div className={viewMode === 'grid' ? styles.clientsGrid : styles.clientsList}>
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="none" hoverable className={styles.clientCard}>
                <div className={styles.clientHeader}>
                  <div className={styles.clientAvatar}>
                    {getInitials(client.name)}
                  </div>
                  <button className={styles.clientMenu}>
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className={styles.clientContent}>
                  <div className={styles.clientInfo}>
                    <h4 className={styles.clientName}>{client.name}</h4>
                    <p className={styles.clientCompany}>{client.company}</p>
                    {getTypeBadge(client.type)}
                  </div>

                  <div className={styles.clientContact}>
                    <div className={styles.contactItem}>
                      <Mail size={14} />
                      <span>{client.email}</span>
                    </div>
                    <div className={styles.contactItem}>
                      <Phone size={14} />
                      <span>{client.phone}</span>
                    </div>
                    <div className={styles.contactItem}>
                      <MapPin size={14} />
                      <span>{client.location}</span>
                    </div>
                  </div>

                  <div className={styles.clientStats}>
                    <div className={styles.clientStat}>
                      <DollarSign size={14} />
                      <span className={styles.clientStatValue}>{formatCurrency(client.totalSpent)}</span>
                      <span className={styles.clientStatLabel}>Total</span>
                    </div>
                    <div className={styles.clientStat}>
                      <Calendar size={14} />
                      <span className={styles.clientStatValue}>{client.bookings}</span>
                      <span className={styles.clientStatLabel}>Réservations</span>
                    </div>
                    <div className={styles.clientStat}>
                      <Star size={14} />
                      <span className={styles.clientStatValue}>{client.rating}/5</span>
                      <span className={styles.clientStatLabel}>Note</span>
                    </div>
                  </div>
                </div>

                <div className={styles.clientFooter}>
                  <span className={styles.lastVisit}>
                    Dernière visite: {new Date(client.lastVisit).toLocaleDateString('fr-FR')}
                  </span>
                  <Button variant="ghost" size="sm">
                    Voir profil
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
