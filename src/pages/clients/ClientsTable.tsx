import { memo } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Table } from '../../components/ui/Table';
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

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onOpenDetail: (client: Client) => void;
  onOpenEdit: (client: Client) => void;
  onToggleActive: (client: Client) => void;
  onOpenDelete: (client: Client) => void;
}

export const ClientsTable = memo(function ClientsTable({
  clients,
  isLoading,
  onOpenDetail,
  onOpenEdit,
  onToggleActive,
  onOpenDelete,
}: ClientsTableProps) {
  const tableColumns = [
    {
      key: 'name',
      header: 'Client',
      render: (client: Client) => (
        <div className={styles.clientTableCell}>
          <div className={styles.clientAvatar}>{getInitials(client.name)}</div>
          <div>
            <div className={styles.clientTableName}>{client.name}</div>
            <div className={styles.clientTableEmail}>{client.email || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Entreprise',
      render: (client: Client) => client.company || '-',
    },
    {
      key: 'tier',
      header: 'Niveau',
      render: (client: Client) => getTierBadge(client.tier),
    },
    {
      key: 'score',
      header: 'Score',
      render: (client: Client) => (
        <div className={styles.scoreCell}>
          <div className={styles.scoreGauge}>
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
          <span className={styles.scoreValue}>{client.score || 0}</span>
        </div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (client: Client) => (
        <div className={styles.tagsCell}>
          {client.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
          {(client.tags?.length || 0) > 2 && (
            <Badge variant="default" size="sm">+{client.tags!.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (client: Client) => (
        client.is_active ? (
          <Badge variant="success" size="sm" dot>Actif</Badge>
        ) : (
          <Badge variant="error" size="sm" dot>Inactif</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (client: Client) => (
        <Dropdown
          trigger={
            <button className={styles.clientMenu} aria-label="Plus d'options">
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
      ),
    },
  ];

  return (
    <Table
      data={clients}
      columns={tableColumns}
      onRowClick={onOpenDetail}
      isLoading={isLoading}
      emptyMessage="Aucun client trouve"
    />
  );
});
