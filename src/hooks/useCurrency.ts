import { useState, useCallback, useMemo } from 'react';

// Supported currency codes
export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD' | 'MAD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export interface CurrencyState {
  defaultCurrency: CurrencyCode;
  showConversion: boolean;
}

const STORAGE_KEY = 'rooom-currency';

// Supported currencies with their details
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', symbol: '\u20ac', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar americain' },
  { code: 'GBP', symbol: '\u00a3', name: 'Livre sterling' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc suisse' },
  { code: 'CAD', symbol: 'CA$', name: 'Dollar canadien' },
  { code: 'MAD', symbol: 'MAD', name: 'Dirham marocain' },
];

// Mock exchange rates (base: EUR = 1)
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.95,
  CAD: 1.47,
  MAD: 10.85,
};

function loadCurrencyState(): CurrencyState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as CurrencyState;
    }
  } catch {
    // Ignore parse errors
  }
  return { defaultCurrency: 'EUR', showConversion: false };
}

function saveCurrencyState(state: CurrencyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function getCurrencySymbol(code: CurrencyCode): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return currency?.symbol ?? code;
}

export function formatAmount(amount: number, currency: CurrencyCode = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  // Convert to EUR first (base), then to target
  const amountInEur = amount / EXCHANGE_RATES[from];
  return amountInEur * EXCHANGE_RATES[to];
}

export function useCurrency() {
  const [state, setState] = useState<CurrencyState>(loadCurrencyState);

  const setDefaultCurrency = useCallback((currency: CurrencyCode) => {
    setState((prev) => {
      const next = { ...prev, defaultCurrency: currency };
      saveCurrencyState(next);
      return next;
    });
  }, []);

  const setShowConversion = useCallback((show: boolean) => {
    setState((prev) => {
      const next = { ...prev, showConversion: show };
      saveCurrencyState(next);
      return next;
    });
  }, []);

  const format = useCallback(
    (amount: number, currency?: CurrencyCode) => {
      return formatAmount(amount, currency ?? state.defaultCurrency);
    },
    [state.defaultCurrency]
  );

  const convert = useCallback(
    (amount: number, from: CurrencyCode, to?: CurrencyCode) => {
      return convertAmount(amount, from, to ?? state.defaultCurrency);
    },
    [state.defaultCurrency]
  );

  const currencyOptions = useMemo(
    () =>
      SUPPORTED_CURRENCIES.map((c) => ({
        value: c.code,
        label: `${c.symbol} ${c.code} - ${c.name}`,
      })),
    []
  );

  return {
    defaultCurrency: state.defaultCurrency,
    showConversion: state.showConversion,
    setDefaultCurrency,
    setShowConversion,
    formatAmount: format,
    convertAmount: convert,
    getCurrencySymbol,
    currencyOptions,
    exchangeRates: EXCHANGE_RATES,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };
}
