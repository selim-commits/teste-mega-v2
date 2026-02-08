import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Star,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Dropdown, DropdownItem, DropdownDivider } from '../../components/ui/Dropdown';
import type { Client, ClientTier } from './types';
import { getInitials } from './types';
import styles from '../Clients.module.css';

function getTierBadge(tier: ClientTier) {
  switch (tier) {
    case 'vip':
      return <Badge variant="warning" size="sm">VIP</Badge>;
    case 'premium':
      return <Badge variant="info" size="sm">Premium</Badge>;
    case 'standard':
    default:
      return <Badge variant="default" size="sm">Standard</Badge>;
  }
}

interface ClientsGridProps {
  clients: Client[];
  onOpenDetail: (client: Client) => void;
  onOpenEdit: (client: Client) => void;
  onToggleActive: (client: Client) => void;
  onOpenDelete: (client: Client) => void;
}

export const ClientsGrid = memo(function ClientsGrid({
  clients,
  onOpenDetail,
  onOpenEdit,
  onToggleActive,
  onOpenDelete,
}: ClientsGridProps) {
  return (
    <div className={styles.clientsGrid}>
      {clients.map((client, index) => (
        <motion.div
          key={client.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <Card padding="none" hoverable className={styles.clientCard}>
            <div className={styles.clientHeader}>
              <div
                className={styles.clientAvatar}
                style={{
                  backgroundColor:
                    client.tier === 'vip'
                      ? 'var(--accent-orange)'
                      : client.tier === 'premium'
                      ? 'var(--accent-blue)'
                      : 'var(--bg-surface-hover)',
                }}
              >
                {getInitials(client.name)}
              </div>
              <Dropdown
                trigger={
                  <button className={styles.clientMenu}>
                    <MoreVertical size={16} />
                  </button>
                }
                align="end"
              >
                <DropdownItem icon={<Eye size={16} />} onClick={() => onOpenDetail(client)}>
                  Voir details
                </DropdownItem>
                <DropdownItem icon={<Edit2 size={16} />} onClick={() => onOpenEdit(client)}>
                  Modifier
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  icon={client.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  onClick={() => onToggleActive(client)}
                >
                  {client.is_active ? 'Desactiver' : 'Activer'}
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  icon={<Trash2 size={16} />}
                  destructive
                  onClick={() => onOpenDelete(client)}
                >
                  Supprimer
                </DropdownItem>
              </Dropdown>
            </div>

            <div className={styles.clientContent} onClick={() => onOpenDetail(client)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(client); } }} role="button" tabIndex={0}>
              <div className={styles.clientInfo}>
                <h4 className={styles.clientName}>{client.name}</h4>
                <p className={styles.clientCompany}>{client.company || 'Particulier'}</p>
                <div className={styles.clientBadges}>
                  {getTierBadge(client.tier)}
                  {!client.is_active && <Badge variant="error" size="sm">Inactif</Badge>}
                </div>
              </div>

              <div className={styles.clientContact}>
                {client.email && (
                  <div className={styles.contactItem}>
                    <Mail size={14} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className={styles.contactItem}>
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className={styles.contactItem}>
                    <MapPin size={14} />
                    <span>{client.city}</span>
                  </div>
                )}
              </div>

              {client.tags && client.tags.length > 0 && (
                <div className={styles.clientTags}>
                  {client.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                  {client.tags.length > 3 && (
                    <Badge variant="default" size="sm">+{client.tags.length - 3}</Badge>
                  )}
                </div>
              )}

              <div className={styles.clientStats}>
                <div className={styles.clientScoreSection}>
                  <div className={styles.clientScoreHeader}>
                    <Star size={14} />
                    <span className={styles.clientScoreLabel}>Score client</span>
                    <span className={styles.clientScoreValue}>{client.score || 0}/100</span>
                  </div>
                  <Progress
                    value={client.score || 0}
                    max={100}
                    size="sm"
                    variant={
                      (client.score || 0) >= 80
                        ? 'success'
                        : (client.score || 0) >= 50
                        ? 'warning'
                        : 'default'
                    }
                  />
                </div>
              </div>
            </div>

            <div className={styles.clientFooter}>
              <span className={styles.lastVisit}>
                Cree le {new Date(client.created_at).toLocaleDateString('fr-FR')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => onOpenDetail(client)}>
                Voir profil
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});
