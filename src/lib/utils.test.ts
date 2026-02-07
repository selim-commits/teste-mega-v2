import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatTime, truncate, generateId } from './utils';

describe('cn', () => {
  it('combine les classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignore les valeurs falsy', () => {
    const condition = false;
    expect(cn('a', condition && 'b', 'c')).toBe('a c');
  });
});

describe('formatCurrency', () => {
  it('formate en EUR par defaut', () => {
    const result = formatCurrency(1500);
    // Intl peut utiliser un espace insécable, on normalise
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toContain('1');
    expect(normalized).toContain('500');
    expect(normalized).toContain('€');
  });

  it('formate en USD', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('99,99');
    expect(result).toContain('$');
  });
});

describe('formatDate', () => {
  it('formate une Date', () => {
    const result = formatDate(new Date(2024, 5, 15)); // 15 juin 2024
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formate une string ISO', () => {
    const result = formatDate('2024-03-01T10:00:00Z');
    expect(result).toContain('2024');
  });
});

describe('formatTime', () => {
  it('formate une heure', () => {
    const result = formatTime(new Date(2024, 0, 1, 14, 30));
    expect(result).toBe('14:30');
  });
});

describe('truncate', () => {
  it('ne tronque pas si assez court', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('tronque avec ...', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });
});

describe('generateId', () => {
  it('retourne un string non vide', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('genere des IDs uniques', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
