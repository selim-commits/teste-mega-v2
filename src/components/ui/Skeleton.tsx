import { cn } from '../../lib/utils';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'wave',
  className,
}: SkeletonProps) {
  return (
    <span
      className={cn(
        styles.skeleton,
        styles[variant],
        animation !== 'none' && styles[animation],
        className
      )}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  hasImage?: boolean;
  imageHeight?: number;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  hasImage = false,
  imageHeight = 200,
  className,
}: SkeletonCardProps) {
  return (
    <div className={cn(styles.card, className)}>
      {hasImage && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={imageHeight}
          className={styles.cardImage}
        />
      )}
      <div className={styles.cardContent}>
        <Skeleton variant="text" width="60%" height="1.5em" />
        {[...Array(lines)].map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={i === lines - 1 ? '40%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn(styles.table, className)}>
      <div className={styles.tableHeader}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} variant="text" width="80%" height="1em" />
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className={styles.tableRow}>
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="70%" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizes = { sm: 32, md: 40, lg: 48 };
  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  );
}
