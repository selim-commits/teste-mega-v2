import {
  ShieldAlert,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import type { TeamRole } from '../../types/database';
import styles from '../Team.module.css';

export function getRoleBadge(role: TeamRole) {
  switch (role) {
    case 'owner':
      return <Badge variant="warning" size="sm"><ShieldAlert size={12} className={styles.badgeIcon} />Proprietaire</Badge>;
    case 'admin':
      return <Badge variant="error" size="sm"><ShieldCheck size={12} className={styles.badgeIcon} />Admin</Badge>;
    case 'manager':
      return <Badge variant="info" size="sm"><Shield size={12} className={styles.badgeIcon} />Manager</Badge>;
    case 'staff':
      return <Badge variant="success" size="sm">Staff</Badge>;
    case 'viewer':
    default:
      return <Badge variant="default" size="sm">Lecteur</Badge>;
  }
}

export function getRoleLabel(role: TeamRole): string {
  switch (role) {
    case 'owner': return 'Proprietaire';
    case 'admin': return 'Administrateur';
    case 'manager': return 'Manager';
    case 'staff': return 'Staff';
    case 'viewer': return 'Lecteur';
    default: return role;
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
