/**
 * Hook de migration localStorage -> Supabase
 *
 * Detecte les donnees localStorage existantes, fournit des fonctions
 * pour migrer les donnees, et affiche un resume de l'etat de migration.
 */

import { useState, useCallback, useMemo } from 'react';
import { getLocalStorageKeys, type LocalStorageKeyInfo } from '../lib/supabaseMigration';
import { isDemoMode } from '../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type MigrationStatus = 'not_started' | 'in_progress' | 'completed' | 'error';

export interface CategorySummary {
  key: string;
  label: string;
  description: string;
  table: string;
  itemCount: number;
  sizeBytes: number;
  migrated: boolean;
}

export interface MigrationProgress {
  current: number;
  total: number;
  currentCategory: string;
}

export interface DataSummary {
  totalKeys: number;
  totalItems: number;
  totalSizeBytes: number;
  categories: CategorySummary[];
}

// ============================================================================
// Helpers
// ============================================================================

function countItems(value: string): number {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return 1;
    }
    return 1;
  } catch {
    return value.length > 0 ? 1 : 0;
  }
}

function getByteSize(value: string): number {
  return new Blob([value]).size;
}

function buildCategorySummary(info: LocalStorageKeyInfo): CategorySummary {
  try {
    const value = localStorage.getItem(info.key);
    if (value === null) {
      return {
        key: info.key,
        label: info.label,
        description: info.description,
        table: info.table,
        itemCount: 0,
        sizeBytes: 0,
        migrated: false,
      };
    }
    return {
      key: info.key,
      label: info.label,
      description: info.description,
      table: info.table,
      itemCount: countItems(value),
      sizeBytes: getByteSize(value),
      migrated: false,
    };
  } catch {
    return {
      key: info.key,
      label: info.label,
      description: info.description,
      table: info.table,
      itemCount: 0,
      sizeBytes: 0,
      migrated: false,
    };
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useMigration() {
  const [status, setStatus] = useState<MigrationStatus>('not_started');
  const [progress, setProgress] = useState<MigrationProgress>({
    current: 0,
    total: 0,
    currentCategory: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [migratedKeys, setMigratedKeys] = useState<Set<string>>(new Set());

  const keys = useMemo(() => getLocalStorageKeys(), []);

  /**
   * Detecte si des donnees existent dans localStorage
   */
  const hasLocalData = useMemo(() => {
    return keys.some((info) => {
      try {
        return localStorage.getItem(info.key) !== null;
      } catch {
        return false;
      }
    });
  }, [keys]);

  /**
   * Retourne un resume detaille de ce qui est stocke dans localStorage
   */
  const getDataSummary = useCallback((): DataSummary => {
    const categories = keys.map((info) => {
      const summary = buildCategorySummary(info);
      return {
        ...summary,
        migrated: migratedKeys.has(info.key),
      };
    });

    const populated = categories.filter((c) => c.itemCount > 0);

    return {
      totalKeys: populated.length,
      totalItems: populated.reduce((sum, c) => sum + c.itemCount, 0),
      totalSizeBytes: populated.reduce((sum, c) => sum + c.sizeBytes, 0),
      categories,
    };
  }, [keys, migratedKeys]);

  /**
   * Migre les donnees localStorage vers Supabase (mock pour le moment).
   * En mode demo, la migration est simulee avec des logs console.
   */
  const migrateToSupabase = useCallback(async () => {
    if (isDemoMode) {
      console.warn(
        '[Migration] Mode demo actif - la migration vers Supabase est simulee.'
      );
    }

    setStatus('in_progress');
    setError(null);

    const populatedKeys = keys.filter((info) => {
      try {
        return localStorage.getItem(info.key) !== null;
      } catch {
        return false;
      }
    });

    setProgress({ current: 0, total: populatedKeys.length, currentCategory: '' });

    try {
      const newMigrated = new Set(migratedKeys);

      for (let i = 0; i < populatedKeys.length; i++) {
        const info = populatedKeys[i];
        setProgress({
          current: i + 1,
          total: populatedKeys.length,
          currentCategory: info.label,
        });

        const value = localStorage.getItem(info.key);
        if (value === null) continue;

        // Simuler un delai reseau
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (isDemoMode) {
          // Mode demo : log en console uniquement
          let parsed: unknown;
          try {
            parsed = JSON.parse(value);
          } catch {
            parsed = value;
          }
          console.info(
            `[Migration] ${info.label} (${info.key}) -> table "${info.table}"`,
            {
              itemCount: countItems(value),
              sizeBytes: getByteSize(value),
              data: parsed,
            }
          );
        } else {
          // TODO: Implementer l'ecriture reelle vers Supabase
          // Exemple:
          // const parsed = JSON.parse(value);
          // await supabase.from(info.table).upsert(parsed);
          console.info(
            `[Migration] Ecriture vers Supabase: ${info.label} -> ${info.table}`
          );
        }

        newMigrated.add(info.key);
      }

      setMigratedKeys(newMigrated);
      setStatus('completed');
      console.info(
        `[Migration] Terminee: ${populatedKeys.length} categories migrees.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue lors de la migration';
      setError(message);
      setStatus('error');
      console.error('[Migration] Erreur:', message);
    }
  }, [keys, migratedKeys]);

  /**
   * Charge les donnees depuis Supabase vers localStorage (mock pour le moment).
   */
  const migrateFromSupabase = useCallback(async () => {
    if (isDemoMode) {
      console.warn(
        '[Migration] Mode demo actif - la migration depuis Supabase est simulee.'
      );
    }

    setStatus('in_progress');
    setError(null);
    setProgress({ current: 0, total: keys.length, currentCategory: '' });

    try {
      for (let i = 0; i < keys.length; i++) {
        const info = keys[i];
        setProgress({
          current: i + 1,
          total: keys.length,
          currentCategory: info.label,
        });

        // Simuler un delai reseau
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (isDemoMode) {
          console.info(
            `[Migration] Lecture depuis Supabase simulee: ${info.table} -> ${info.key}`
          );
        } else {
          // TODO: Implementer la lecture reelle depuis Supabase
          // Exemple:
          // const { data } = await supabase.from(info.table).select('*');
          // if (data) localStorage.setItem(info.key, JSON.stringify(data));
          console.info(
            `[Migration] Lecture Supabase: ${info.table} -> localStorage "${info.key}"`
          );
        }
      }

      setStatus('completed');
      console.info('[Migration] Import depuis Supabase termine.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur inconnue lors de l\'import depuis Supabase';
      setError(message);
      setStatus('error');
      console.error('[Migration] Erreur import:', message);
    }
  }, [keys]);

  /**
   * Efface toutes les donnees localStorage gerees par l'application
   */
  const clearLocalStorage = useCallback(() => {
    for (const info of keys) {
      try {
        localStorage.removeItem(info.key);
      } catch {
        // Ignorer les erreurs
      }
    }
    setMigratedKeys(new Set());
    setStatus('not_started');
  }, [keys]);

  /**
   * Remet l'etat de migration a zero
   */
  const resetMigration = useCallback(() => {
    setStatus('not_started');
    setProgress({ current: 0, total: 0, currentCategory: '' });
    setError(null);
    setMigratedKeys(new Set());
  }, []);

  return {
    status,
    progress,
    error,
    hasLocalData,
    isDemoMode,
    getDataSummary,
    migrateToSupabase,
    migrateFromSupabase,
    clearLocalStorage,
    resetMigration,
  };
}
