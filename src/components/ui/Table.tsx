import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import styles from './Table.module.css';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = 'Aucune donnée',
  className,
}: TableProps<T>) {
  const getValue = (item: T, key: string): ReactNode => {
    const keys = key.split('.');
    let value: unknown = item;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value as ReactNode;
  };

  if (isLoading) {
    return (
      <div className={cn(styles.table, className)}>
        <div className={styles.loading}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              {columns.map((col, j) => (
                <div key={j} className={styles.skeletonCell} style={{ width: col.width }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn(styles.table, styles.empty, className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(styles.tableWrapper, className)}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={styles.th}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {data.map((item, index) => (
            <motion.tr
              key={item.id}
              className={cn(styles.tr, onRowClick && styles.clickable)}
              onClick={() => onRowClick?.(item)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={styles.td}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(item) : getValue(item, String(col.key))}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Précédent
      </button>
      {start > 1 && (
        <>
          <button className={styles.pageBtn} onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className={styles.ellipsis}>...</span>}
        </>
      )}
      {pages.map((page) => (
        <button
          key={page}
          className={cn(styles.pageBtn, currentPage === page && styles.active)}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
          <button className={styles.pageBtn} onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
      </button>
    </div>
  );
}
