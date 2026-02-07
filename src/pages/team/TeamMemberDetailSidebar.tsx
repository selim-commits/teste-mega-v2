import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  Briefcase,
  X,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import type { TeamMember } from '../../types/database';
import { getRoleBadge, getRoleLabel, formatDate } from './teamUtils';
import styles from '../Team.module.css';

interface TeamMemberDetailSidebarProps {
  member: TeamMember;
  onClose: () => void;
  onEdit: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember) => void;
  onDelete: () => void;
}

export function TeamMemberDetailSidebar({
  member,
  onClose,
  onEdit,
  onChangeRole,
  onDelete,
}: TeamMemberDetailSidebarProps) {
  return (
    <>
      <motion.div
        className={styles.sidebarOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.sidebar}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <h2>Profil du membre</h2>
            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.memberProfile}>
            <Avatar
              size="2xl"
              name={member.name}
              src={member.avatar_url || undefined}
              status={member.is_active ? 'online' : 'offline'}
              showStatus
            />
            <h3>{member.name}</h3>
            <p>{member.job_title || getRoleLabel(member.role)}</p>
            <div className={styles.profileBadges}>
              {getRoleBadge(member.role)}
              {member.is_active ? (
                <Badge variant="success" size="sm" dot>Actif</Badge>
              ) : (
                <Badge variant="error" size="sm" dot>Inactif</Badge>
              )}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h4>Informations de contact</h4>
            <div className={styles.contactList}>
              <div className={styles.contactRow}>
                <Mail size={16} />
                <a href={`mailto:${member.email}`}>{member.email}</a>
              </div>
              {member.phone && (
                <div className={styles.contactRow}>
                  <Phone size={16} />
                  <a href={`tel:${member.phone}`}>{member.phone}</a>
                </div>
              )}
              {member.job_title && (
                <div className={styles.contactRow}>
                  <Briefcase size={16} />
                  <span>{member.job_title}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h4>Permissions</h4>
            <div className={styles.permissionsList}>
              {member.role === 'owner' || member.role === 'admin' ? (
                <div className={styles.permissionItem}>
                  <ShieldCheck size={16} />
                  <span>Acces complet (administrateur)</span>
                </div>
              ) : (
                <>
                  {(member.permissions as Record<string, boolean>)?.can_manage_bookings && (
                    <div className={styles.permissionItem}>
                      <CheckCircle size={16} />
                      <span>Gestion des reservations</span>
                    </div>
                  )}
                  {(member.permissions as Record<string, boolean>)?.can_view_clients && (
                    <div className={styles.permissionItem}>
                      <CheckCircle size={16} />
                      <span>Consultation des clients</span>
                    </div>
                  )}
                  {(member.permissions as Record<string, boolean>)?.can_manage_clients && (
                    <div className={styles.permissionItem}>
                      <CheckCircle size={16} />
                      <span>Gestion des clients</span>
                    </div>
                  )}
                  {(member.permissions as Record<string, boolean>)?.can_view_equipment && (
                    <div className={styles.permissionItem}>
                      <CheckCircle size={16} />
                      <span>Consultation de l'equipement</span>
                    </div>
                  )}
                  {(member.permissions as Record<string, boolean>)?.can_view_reports && (
                    <div className={styles.permissionItem}>
                      <CheckCircle size={16} />
                      <span>Consultation des rapports</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h4>Historique d'activite</h4>
            <div className={styles.activityPlaceholder}>
              <Activity size={24} />
              <p>L'historique d'activite sera bientot disponible</p>
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h4>Informations</h4>
            <div className={styles.metaList}>
              <div className={styles.metaRow}>
                <span>Membre depuis</span>
                <span>{formatDate(member.created_at)}</span>
              </div>
              <div className={styles.metaRow}>
                <span>Derniere modification</span>
                <span>{formatDate(member.updated_at)}</span>
              </div>
              {member.hourly_rate && (
                <div className={styles.metaRow}>
                  <span>Taux horaire</span>
                  <span>{member.hourly_rate} EUR/h</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <Button
            variant="secondary"
            fullWidth
            icon={<Edit2 size={16} />}
            onClick={() => {
              onEdit(member);
              onClose();
            }}
          >
            Modifier
          </Button>
          <Button
            variant="secondary"
            fullWidth
            icon={<Shield size={16} />}
            onClick={() => {
              onChangeRole(member);
              onClose();
            }}
          >
            Changer le role
          </Button>
          <Button
            variant="ghost"
            fullWidth
            icon={<Trash2 size={16} />}
            onClick={onDelete}
            className={styles.deleteBtn}
          >
            Supprimer
          </Button>
        </div>
      </motion.div>
    </>
  );
}
