import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { useUIStore, type Theme } from '../stores/uiStore';

const STORAGE_KEY = 'rooom-theme';

/**
 * Apply the theme to the document root element via data-theme attribute.
 *
 * - 'dark': sets data-theme="dark" to activate dark CSS variables
 * - 'light': sets data-theme="light" for light mode
 * - 'system': detects OS preference via matchMedia and applies data-theme accordingly
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    // 'system' - detect OS preference and apply via data-theme
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

/**
 * Subscribe to system color scheme changes.
 */
function subscribeToSystemTheme(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSystemThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to manage the application theme.
 *
 * - Manages 3 modes: 'light', 'dark', 'system'
 * - Persists the preference in localStorage under 'rooom-theme'
 * - Applies data-theme="dark" on document.documentElement when in dark mode
 * - Listens to prefers-color-scheme for the 'system' mode
 *
 * @returns theme, effectiveTheme, setTheme, toggleTheme
 */
export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const storeSetTheme = useUIStore((s) => s.setTheme);

  // Subscribe to system theme preference changes
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSnapshot
  );

  const effectiveTheme: 'light' | 'dark' =
    theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  // Apply theme whenever effectiveTheme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, systemPrefersDark]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      storeSetTheme(newTheme);
      // Persist to localStorage under our key
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Ignore storage errors
      }
      applyTheme(newTheme);
    },
    [storeSetTheme]
  );

  const toggleTheme = useCallback(() => {
    const next: Theme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  }, [theme, setTheme]);

  return {
    /** The stored preference: 'light' | 'dark' | 'system' */
    theme,
    /** The resolved theme applied to the UI: 'light' | 'dark' */
    effectiveTheme,
    /** Set a specific theme preference */
    setTheme,
    /** Cycle through: light -> dark -> system -> light */
    toggleTheme,
  };
}
