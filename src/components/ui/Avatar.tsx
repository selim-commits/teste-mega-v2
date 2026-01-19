import { useState, type ImgHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import styles from './Avatar.module.css';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'circle' | 'rounded' | 'square';
type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: AvatarSize;
  variant?: AvatarVariant;
  name?: string;
  status?: AvatarStatus;
  showStatus?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'var(--accent-orange)',
    'var(--accent-green)',
    'var(--accent-blue)',
    'var(--accent-purple)',
    'var(--accent-yellow)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  size = 'md',
  variant = 'circle',
  name,
  status,
  showStatus = false,
  src,
  alt,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = src && !imageError;
  const initials = name ? getInitials(name) : '?';
  const backgroundColor = name ? getColorFromName(name) : 'var(--bg-elevated)';

  return (
    <motion.div
      className={cn(styles.avatar, styles[size], styles[variant], className)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={styles.image}
          onError={() => setImageError(true)}
          {...props}
        />
      ) : (
        <div
          className={styles.initials}
          style={{ backgroundColor }}
        >
          {initials}
        </div>
      )}
      {showStatus && status && (
        <span className={cn(styles.status, styles[`status-${status}`])} />
      )}
    </motion.div>
  );
}

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  children,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn(styles.group, className)}>
      {visibleAvatars}
      {remainingCount > 0 && (
        <div className={cn(styles.avatar, styles[size], styles.circle, styles.remaining)}>
          <span className={styles.remainingCount}>+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}
