import { z } from 'zod';

// ===== Common Validators =====

const emailSchema = z
  .string()
  .email("Format d'email invalide")
  .or(z.literal(''));

const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Format de telephone invalide')
  .min(8, 'Le telephone doit contenir au moins 8 caracteres')
  .or(z.literal(''));

const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} est requis`).trim();

// ===== Client Schema =====

export const clientSchema = z.object({
  name: requiredString('Le nom'),
  email: emailSchema.optional().default(''),
  phone: phoneSchema.optional().default(''),
  company: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  country: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
  tier: z.enum(['standard', 'premium', 'vip']).default('standard'),
  notes: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ===== Booking Schema =====

export const bookingSchema = z.object({
  title: requiredString('Le titre'),
  space_id: requiredString("L'espace"),
  client_id: requiredString('Le client'),
  start_time: requiredString("L'heure de debut"),
  end_time: requiredString("L'heure de fin"),
  total_amount: z.coerce.number().min(0, 'Le montant doit etre positif'),
  notes: z.string().optional().default(''),
  internal_notes: z.string().optional().default(''),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('pending'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// ===== Embed Booking Schema =====

export const embedBookingSchema = z.object({
  clientName: requiredString('Le nom'),
  clientEmail: requiredString("L'email").pipe(z.string().email("Format d'email invalide")),
  clientPhone: requiredString('Le telephone').pipe(
    z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Format de telephone invalide')
      .min(8, 'Le telephone doit contenir au moins 8 caracteres')
  ),
  notes: z.string().optional().default(''),
  acceptTerms: z.literal(true, {
    message: 'Vous devez accepter les conditions',
  }),
});

export type EmbedBookingFormData = z.infer<typeof embedBookingSchema>;

// ===== Team Member Schema =====

export const teamMemberSchema = z.object({
  name: requiredString('Le nom'),
  email: requiredString("L'email").pipe(z.string().email("Format d'email invalide")),
  role: z.enum(['owner', 'admin', 'manager', 'staff', 'viewer']).default('staff'),
  phone: phoneSchema.optional().default(''),
  specialties: z.array(z.string()).default([]),
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// ===== Equipment Schema =====

export const equipmentSchema = z.object({
  name: requiredString('Le nom'),
  category: requiredString('La categorie'),
  brand: z.string().optional().default(''),
  model: z.string().optional().default(''),
  serial_number: z.string().optional().default(''),
  hourly_rate: z.coerce.number().min(0, 'Le tarif doit etre positif'),
  daily_rate: z.coerce.number().min(0, 'Le tarif doit etre positif').optional(),
  quantity: z.coerce.number().int().min(1, 'La quantite minimum est 1').default(1),
  description: z.string().optional().default(''),
  status: z.enum(['available', 'reserved', 'in_use', 'maintenance', 'retired']).default('available'),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

// ===== Invoice Schema =====

export const invoiceSchema = z.object({
  client_id: requiredString('Le client'),
  total_amount: z.coerce.number().min(0, 'Le montant doit etre positif'),
  tax_rate: z.coerce.number().min(0).max(100, 'Le taux de taxe doit etre entre 0 et 100').default(20),
  due_date: requiredString("La date d'echeance"),
  notes: z.string().optional().default(''),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ===== Settings Schemas =====

export const profileSettingsSchema = z.object({
  name: requiredString('Le nom du studio'),
  email: emailSchema.optional().default(''),
  phone: phoneSchema.optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  country: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
  website: z.string().url('URL invalide').or(z.literal('')).optional().default(''),
  description: z.string().optional().default(''),
});

export const billingSettingsSchema = z.object({
  companyName: z.string().optional().default(''),
  vatNumber: z.string().optional().default(''),
  vatRate: z.string().optional().default('20'),
  siret: z.string().optional().default(''),
  billingEmail: emailSchema.optional().default(''),
  invoicePrefix: z.string().optional().default('INV'),
  paymentTerms: z.string().optional().default('30'),
  legalMentions: z.string().optional().default(''),
});

// ===== Utility: Extract Zod Errors =====

export function extractErrors<T extends z.ZodType>(
  schema: T,
  data: unknown
): Partial<Record<string, string>> {
  const result = schema.safeParse(data);
  if (result.success) return {};

  const errors: Partial<Record<string, string>> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

export function validateField<T extends z.ZodType>(
  schema: T,
  field: string,
  data: unknown
): string | undefined {
  const result = schema.safeParse(data);
  if (result.success) return undefined;

  const issue = result.error.issues.find((i) => i.path.join('.') === field);
  return issue?.message;
}
