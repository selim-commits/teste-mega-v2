import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Package,
  Camera,
  Lightbulb,
  Monitor,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import styles from './Inventory.module.css';

const categories = [
  { id: 'all', name: 'Tout', icon: Package, count: 247 },
  { id: 'cameras', name: 'Caméras', icon: Camera, count: 45 },
  { id: 'lighting', name: 'Éclairage', icon: Lightbulb, count: 89 },
  { id: 'monitors', name: 'Écrans', icon: Monitor, count: 32 },
];

const items = [
  {
    id: 1,
    name: 'Canon EOS R5',
    category: 'Caméras',
    status: 'available',
    location: 'Studio A',
    lastUsed: '2024-01-15',
    condition: 95,
    image: '/equipment/canon-r5.jpg',
  },
  {
    id: 2,
    name: 'Profoto B10X',
    category: 'Éclairage',
    status: 'in-use',
    location: 'Studio B',
    lastUsed: '2024-01-18',
    condition: 88,
    image: '/equipment/profoto.jpg',
  },
  {
    id: 3,
    name: 'Sony A7S III',
    category: 'Caméras',
    status: 'maintenance',
    location: 'Atelier',
    lastUsed: '2024-01-10',
    condition: 72,
    image: '/equipment/sony-a7s.jpg',
  },
  {
    id: 4,
    name: 'Aputure 600d Pro',
    category: 'Éclairage',
    status: 'available',
    location: 'Stock',
    lastUsed: '2024-01-14',
    condition: 100,
    image: '/equipment/aputure.jpg',
  },
  {
    id: 5,
    name: 'SmallHD 702',
    category: 'Écrans',
    status: 'available',
    location: 'Studio A',
    lastUsed: '2024-01-17',
    condition: 90,
    image: '/equipment/smallhd.jpg',
  },
  {
    id: 6,
    name: 'Godox AD600',
    category: 'Éclairage',
    status: 'low-stock',
    location: 'Stock',
    lastUsed: '2024-01-12',
    condition: 85,
    image: '/equipment/godox.jpg',
  },
];

export function Inventory() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category.toLowerCase().includes(activeCategory);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success" size="sm" dot>Disponible</Badge>;
      case 'in-use':
        return <Badge variant="info" size="sm" dot>En cours</Badge>;
      case 'maintenance':
        return <Badge variant="warning" size="sm" dot>Maintenance</Badge>;
      case 'low-stock':
        return <Badge variant="error" size="sm" dot>Stock bas</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="Smart Inventory"
        subtitle="Gérez votre équipement et consommables"
      />

      <div className={styles.content}>
        {/* Stats Overview */}
        <div className={styles.statsGrid}>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(0, 184, 61, 0.15)' }}>
              <CheckCircle size={20} color="var(--accent-green)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>198</span>
              <span className={styles.statLabel}>Disponibles</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(24, 144, 204, 0.15)' }}>
              <Clock size={20} color="var(--accent-blue)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>32</span>
              <span className={styles.statLabel}>En utilisation</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)' }}>
              <AlertTriangle size={20} color="var(--accent-yellow)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>12</span>
              <span className={styles.statLabel}>Maintenance</span>
            </div>
          </Card>
          <Card padding="md" className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(229, 57, 53, 0.15)' }}>
              <Package size={20} color="var(--accent-red)" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>5</span>
              <span className={styles.statLabel}>Stock bas</span>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un équipement..."
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
              Ajouter
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <cat.icon size={18} />
              <span>{cat.name}</span>
              <span className={styles.categoryCount}>{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className={viewMode === 'grid' ? styles.itemsGrid : styles.itemsList}>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="none" hoverable className={styles.itemCard}>
                <div className={styles.itemImage}>
                  <Package size={40} className={styles.itemPlaceholder} />
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <button className={styles.itemMenu}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <p className={styles.itemCategory}>{item.category}</p>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemLocation}>{item.location}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className={styles.itemCondition}>
                    <span className={styles.conditionLabel}>État</span>
                    <div className={styles.conditionBar}>
                      <div
                        className={styles.conditionFill}
                        style={{
                          width: `${item.condition}%`,
                          backgroundColor: item.condition > 80 ? 'var(--accent-green)' : item.condition > 50 ? 'var(--accent-yellow)' : 'var(--accent-red)',
                        }}
                      />
                    </div>
                    <span className={styles.conditionValue}>{item.condition}%</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
