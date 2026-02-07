import { motion } from 'framer-motion';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Package,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';
import { Switch } from '../ui/Checkbox';
import type { Pack, PricingProductType } from '../../types/database';
import styles from '../../pages/Packs.module.css';

interface PackCardProps {
  pack: Pack;
  index: number;
  onEdit: (pack: Pack) => void;
  onDelete: (pack: Pack) => void;
  onToggleActive: (pack: Pack) => void;
  onToggleFeatured: (pack: Pack) => void;
  currency?: string;
}

const typeIcons: Record<PricingProductType, React.ElementType> = {
  pack: Package,
  subscription: RefreshCw,
  gift_certificate: Gift,
};

const typeLabels: Record<PricingProductType, string> = {
  pack: 'Pack',
  subscription: 'Abonnement',
  gift_certificate: 'Certificat',
};

const typeColors: Record<PricingProductType, string> = {
  pack: 'var(--accent-purple)',
  subscription: 'var(--accent-blue)',
  gift_certificate: 'var(--accent-pink)',
};

const billingLabels: Record<string, string> = {
  once: 'Achat unique',
  monthly: '/ mois',
  quarterly: '/ trimestre',
  yearly: '/ an',
};

export function PackCard({
  pack,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  currency = '$',
}: PackCardProps) {
  const TypeIcon = typeIcons[pack.type] || Package;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        padding="none"
        hoverable
        className={`${styles.packCard} ${!pack.is_active ? styles.inactive : ''}`}
      >
        <div className={styles.packHeader}>
          <div
            className={styles.packTypeIcon}
            style={{ backgroundColor: `${typeColors[pack.type]}15` }}
          >
            <TypeIcon size={20} color={typeColors[pack.type]} />
          </div>
          <div className={styles.packHeaderActions}>
            {pack.is_featured && (
              <Star size={16} className={styles.featuredStar} fill="var(--accent-orange)" />
            )}
            <Dropdown
              trigger={
                <button className={styles.packMenu} aria-label="Plus d'options">
                  <MoreVertical size={16} />
                </button>
              }
              align="end"
            >
              <DropdownItem icon={<Edit2 size={16} />} onClick={() => onEdit(pack)}>
                Modifier
              </DropdownItem>
              <DropdownItem
                icon={pack.is_featured ? <Star size={16} /> : <Star size={16} />}
                onClick={() => onToggleFeatured(pack)}
              >
                {pack.is_featured ? 'Retirer des favoris' : 'Mettre en avant'}
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={pack.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                onClick={() => onToggleActive(pack)}
              >
                {pack.is_active ? 'Desactiver' : 'Activer'}
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<Trash2 size={16} />}
                destructive
                onClick={() => onDelete(pack)}
              >
                Supprimer
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className={styles.packContent}>
          <div className={styles.packInfo}>
            <div className={styles.packTypeBadge}>
              <Badge
                variant={pack.type === 'subscription' ? 'info' : pack.type === 'gift_certificate' ? 'warning' : 'default'}
                size="sm"
              >
                {typeLabels[pack.type]}
              </Badge>
              {!pack.is_active && (
                <Badge variant="default" size="sm">
                  Inactif
                </Badge>
              )}
            </div>
            <h4 className={styles.packName}>{pack.name}</h4>
            {pack.description && (
              <p className={styles.packDescription}>{pack.description}</p>
            )}
          </div>

          <div className={styles.packPricing}>
            <span className={styles.packPrice}>
              {pack.price.toLocaleString('fr-FR')} {currency}
            </span>
            <span className={styles.packBilling}>
              {billingLabels[pack.billing_period] || ''}
            </span>
          </div>

          <div className={styles.packDetails}>
            {pack.credits_included && (
              <div className={styles.packDetail}>
                <Zap size={14} />
                <span>{pack.credits_included} {pack.credits_type || 'credits'}</span>
              </div>
            )}
            {pack.valid_days && (
              <div className={styles.packDetail}>
                <Clock size={14} />
                <span>Valide {pack.valid_days} jours</span>
              </div>
            )}
          </div>

          <div className={styles.packFooter}>
            <div className={styles.packActiveSwitch}>
              <Switch
                checked={pack.is_active}
                onChange={() => onToggleActive(pack)}
                label=""
              />
              <span className={styles.switchLabel}>
                {pack.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(pack)}>
              Modifier
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
