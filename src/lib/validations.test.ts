import { describe, it, expect } from 'vitest';
import {
  clientSchema,
  bookingSchema,
  embedBookingSchema,
  teamMemberSchema,
  equipmentSchema,
  invoiceSchema,
  extractErrors,
  validateField,
} from './validations';

describe('clientSchema', () => {
  it('valide un client minimal', () => {
    const result = clientSchema.safeParse({ name: 'Test Client' });
    expect(result.success).toBe(true);
  });

  it('rejette un nom vide', () => {
    const result = clientSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('valide un client complet', () => {
    const result = clientSchema.safeParse({
      name: 'Marie Dupont',
      email: 'marie@test.com',
      phone: '+33 6 12 34 56 78',
      company: 'Studio Pro',
      tier: 'vip',
      tags: ['photo', 'mode'],
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejette un email invalide', () => {
    const result = clientSchema.safeParse({ name: 'Test', email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('accepte un email vide', () => {
    const result = clientSchema.safeParse({ name: 'Test', email: '' });
    expect(result.success).toBe(true);
  });
});

describe('bookingSchema', () => {
  const validBooking = {
    title: 'Shooting Photo',
    space_id: 'space-1',
    client_id: 'client-1',
    start_time: '2024-06-15T10:00:00Z',
    end_time: '2024-06-15T14:00:00Z',
    total_amount: 500,
  };

  it('valide une reservation complete', () => {
    const result = bookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('rejette un titre vide', () => {
    const result = bookingSchema.safeParse({ ...validBooking, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejette un montant negatif', () => {
    const result = bookingSchema.safeParse({ ...validBooking, total_amount: -10 });
    expect(result.success).toBe(false);
  });

  it('coerce les montants string en number', () => {
    const result = bookingSchema.safeParse({ ...validBooking, total_amount: '250' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_amount).toBe(250);
    }
  });
});

describe('embedBookingSchema', () => {
  const validEmbed = {
    clientName: 'Jean Martin',
    clientEmail: 'jean@test.com',
    clientPhone: '+33 6 12 34 56 78',
    acceptTerms: true as const,
  };

  it('valide un formulaire embed complet', () => {
    const result = embedBookingSchema.safeParse(validEmbed);
    expect(result.success).toBe(true);
  });

  it('rejette sans acceptation des conditions', () => {
    const result = embedBookingSchema.safeParse({ ...validEmbed, acceptTerms: false });
    expect(result.success).toBe(false);
  });

  it('rejette un telephone trop court', () => {
    const result = embedBookingSchema.safeParse({ ...validEmbed, clientPhone: '123' });
    expect(result.success).toBe(false);
  });
});

describe('teamMemberSchema', () => {
  it('valide un membre minimal', () => {
    const result = teamMemberSchema.safeParse({
      name: 'Lucas Petit',
      email: 'lucas@studio.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejette un email invalide', () => {
    const result = teamMemberSchema.safeParse({
      name: 'Lucas',
      email: 'not-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('equipmentSchema', () => {
  it('valide un equipement minimal', () => {
    const result = equipmentSchema.safeParse({
      name: 'Canon EOS R5',
      category: 'camera',
      hourly_rate: 50,
    });
    expect(result.success).toBe(true);
  });

  it('rejette un tarif negatif', () => {
    const result = equipmentSchema.safeParse({
      name: 'Canon',
      category: 'camera',
      hourly_rate: -10,
    });
    expect(result.success).toBe(false);
  });

  it('defaut quantite a 1', () => {
    const result = equipmentSchema.safeParse({
      name: 'Trepied',
      category: 'support',
      hourly_rate: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });
});

describe('invoiceSchema', () => {
  it('rejette un taux de taxe > 100', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'client-1',
      total_amount: 100,
      tax_rate: 150,
      due_date: '2024-06-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('extractErrors', () => {
  it('retourne un objet vide si valide', () => {
    const errors = extractErrors(clientSchema, { name: 'Test' });
    expect(errors).toEqual({});
  });

  it('retourne les erreurs par champ', () => {
    const errors = extractErrors(clientSchema, { name: '', email: 'bad' });
    expect(errors).toHaveProperty('name');
    expect(errors).toHaveProperty('email');
  });
});

describe('validateField', () => {
  it('retourne undefined si le champ est valide', () => {
    const error = validateField(clientSchema, 'name', { name: 'Test' });
    expect(error).toBeUndefined();
  });

  it('retourne le message si le champ est invalide', () => {
    const error = validateField(clientSchema, 'name', { name: '' });
    expect(error).toBeDefined();
    expect(typeof error).toBe('string');
  });
});
