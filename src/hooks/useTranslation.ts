import { useCallback } from 'react';
import { useI18nStore } from '../stores/i18nStore';
import {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  translate,
} from '../lib/i18n';

/**
 * Reactive translation hook.
 *
 * Components that call `useTranslation()` automatically re-render when the
 * locale changes thanks to the underlying Zustand store subscription.
 *
 * @example
 *   const { t, locale, setLocale } = useTranslation();
 *   t('common.save')                          // "Enregistrer" | "Save"
 *   t('bookings.count', { count: '5' })       // "5 reservations" | "5 bookings"
 */
export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(locale, key, params),
    [locale],
  );

  return {
    /** Current translation function, bound to the active locale */
    t,
    /** The active locale code (`'fr'` or `'en'`) */
    locale,
    /** Switch to a different locale (persists in localStorage) */
    setLocale,
    /** All supported locales with their display labels */
    supportedLocales: SUPPORTED_LOCALES,
  } as const;
}

/**
 * Utility to get a locale's display label.
 */
export function getLocaleLabel(locale: SupportedLocale): string {
  return SUPPORTED_LOCALES.find((l) => l.id === locale)?.label ?? locale;
}
