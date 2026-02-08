import { create } from 'zustand';
import {
  type SupportedLocale,
  getStoredLocale,
  storeLocale,
} from '../lib/i18n';

interface I18nState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useI18nStore = create<I18nState>()((set) => ({
  locale: getStoredLocale(),

  setLocale: (locale) => {
    storeLocale(locale);
    set({ locale });
  },
}));
