// ============================================================
// Rooom OS - Lightweight i18n system (no external dependency)
// ============================================================

export type SupportedLocale = 'fr' | 'en';

export const SUPPORTED_LOCALES: { id: SupportedLocale; label: string }[] = [
  { id: 'fr', label: 'Francais' },
  { id: 'en', label: 'English' },
];

export const DEFAULT_LOCALE: SupportedLocale = 'fr';
const STORAGE_KEY = 'rooom-locale';

// --------------- Translation dictionaries ---------------

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

const fr: TranslationDictionary = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    close: 'Fermer',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succes',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Precedent',
    noResults: 'Aucun resultat',
    actions: 'Actions',
    status: 'Statut',
    name: 'Nom',
    email: 'E-mail',
    phone: 'Telephone',
    date: 'Date',
    time: 'Heure',
    amount: 'Montant',
    total: 'Total',
    description: 'Description',
    type: 'Type',
    settings: 'Parametres',
    dashboard: 'Tableau de bord',
    notifications: 'Notifications',
  },
  nav: {
    // Sections
    daily: 'Quotidien',
    clientsCrm: 'Clients & CRM',
    finances: 'Finances',
    operations: 'Espaces & Operations',
    tools: 'Outils',
    notifications: 'Notifications',
    // Items - Quotidien
    dashboard: 'Tableau de bord',
    calendar: 'Calendrier',
    bookings: 'Rendez-vous',
    messages: 'Messages',
    tasks: 'Taches',
    // Items - Clients & CRM
    clients: 'Clients',
    clientPortal: 'Portail Client',
    reviews: 'Avis & Notes',
    identityVerification: 'Verification',
    photoGallery: 'Galerie Photos',
    // Items - Finances
    invoices: 'Factures',
    reports: 'Rapports',
    benchmarking: 'Benchmarking',
    packs: 'Packs',
    ownerPortal: 'Portail Proprietaire',
    // Items - Espaces & Operations
    inventory: 'Inventaire',
    accessControl: "Controle d'acces",
    availability: 'Disponibilite',
    appointmentTypes: 'Types de RDV',
    calendarSync: 'Synchro Calendriers',
    // Items - Outils
    widgetBuilder: 'Widget Builder',
    automations: 'Automations',
    aiConsole: 'AI Console',
    aiPricing: 'AI Pricing',
    pricing: 'Tarification',
    paymentSettings: 'Paiements',
    integrations: 'Integrations',
    // Items - Notifications (sous-items)
    clientEmails: 'E-mails',
    clientSms: 'SMS',
    bookingAlerts: 'Alertes',
    // Items - Zone fixe
    team: 'Equipe',
    settings: 'Parametres',
  },
  auth: {
    login: 'Connexion',
    logout: 'Deconnexion',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublie ?',
  },
  bookings: {
    newBooking: 'Nouvelle reservation',
    editBooking: 'Modifier la reservation',
    cancelBooking: 'Annuler la reservation',
    confirmBooking: 'Confirmer la reservation',
    bookingConfirmed: 'Reservation confirmee',
    bookingCancelled: 'Reservation annulee',
    noBookings: 'Aucune reservation',
    count: '{{count}} reservations',
  },
  clients: {
    newClient: 'Nouveau client',
    editClient: 'Modifier le client',
    deleteClient: 'Supprimer le client',
    clientDetails: 'Details du client',
    totalClients: 'Total clients',
  },
  finance: {
    revenue: 'Revenus',
    expenses: 'Depenses',
    invoices: 'Factures',
    payments: 'Paiements',
    newInvoice: 'Nouvelle facture',
    totalRevenue: 'Revenu total',
  },
  settings: {
    general: 'General',
    profile: 'Profil',
    billing: 'Facturation',
    notifications: 'Notifications',
    appearance: 'Apparence',
    theme: 'Theme',
    language: 'Langue',
    languageDescription: "Choisissez la langue de l'interface",
    languageUpdated: 'Langue mise a jour',
    languageUpdatedMessage: 'La langue "{{label}}" a ete appliquee.',
  },
};

const en: TranslationDictionary = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    noResults: 'No results',
    actions: 'Actions',
    status: 'Status',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    date: 'Date',
    time: 'Time',
    amount: 'Amount',
    total: 'Total',
    description: 'Description',
    type: 'Type',
    settings: 'Settings',
    dashboard: 'Dashboard',
    notifications: 'Notifications',
  },
  nav: {
    // Sections
    daily: 'Daily',
    clientsCrm: 'Clients & CRM',
    finances: 'Finances',
    operations: 'Spaces & Operations',
    tools: 'Tools',
    notifications: 'Notifications',
    // Items - Daily
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    bookings: 'Appointments',
    messages: 'Messages',
    tasks: 'Tasks',
    // Items - Clients & CRM
    clients: 'Clients',
    clientPortal: 'Client Portal',
    reviews: 'Reviews & Ratings',
    identityVerification: 'Verification',
    photoGallery: 'Photo Gallery',
    // Items - Finances
    invoices: 'Invoices',
    reports: 'Reports',
    benchmarking: 'Benchmarking',
    packs: 'Packs',
    ownerPortal: 'Owner Portal',
    // Items - Spaces & Operations
    inventory: 'Inventory',
    accessControl: 'Access Control',
    availability: 'Availability',
    appointmentTypes: 'Appointment Types',
    calendarSync: 'Calendar Sync',
    // Items - Tools
    widgetBuilder: 'Widget Builder',
    automations: 'Automations',
    aiConsole: 'AI Console',
    aiPricing: 'AI Pricing',
    pricing: 'Pricing',
    paymentSettings: 'Payments',
    integrations: 'Integrations',
    // Items - Notifications (sub-items)
    clientEmails: 'Emails',
    clientSms: 'SMS',
    bookingAlerts: 'Alerts',
    // Items - Pinned
    team: 'Team',
    settings: 'Settings',
  },
  auth: {
    login: 'Sign In',
    logout: 'Sign Out',
    password: 'Password',
    forgotPassword: 'Forgot password?',
  },
  bookings: {
    newBooking: 'New booking',
    editBooking: 'Edit booking',
    cancelBooking: 'Cancel booking',
    confirmBooking: 'Confirm booking',
    bookingConfirmed: 'Booking confirmed',
    bookingCancelled: 'Booking cancelled',
    noBookings: 'No bookings',
    count: '{{count}} bookings',
  },
  clients: {
    newClient: 'New client',
    editClient: 'Edit client',
    deleteClient: 'Delete client',
    clientDetails: 'Client details',
    totalClients: 'Total clients',
  },
  finance: {
    revenue: 'Revenue',
    expenses: 'Expenses',
    invoices: 'Invoices',
    payments: 'Payments',
    newInvoice: 'New invoice',
    totalRevenue: 'Total revenue',
  },
  settings: {
    general: 'General',
    profile: 'Profile',
    billing: 'Billing',
    notifications: 'Notifications',
    appearance: 'Appearance',
    theme: 'Theme',
    language: 'Language',
    languageDescription: 'Choose the interface language',
    languageUpdated: 'Language updated',
    languageUpdatedMessage: 'Language "{{label}}" has been applied.',
  },
};

const dictionaries: Record<SupportedLocale, TranslationDictionary> = { fr, en };

// --------------- Locale persistence ---------------

export function getStoredLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // Ignore storage errors (SSR, private mode, etc.)
  }
  return DEFAULT_LOCALE;
}

export function storeLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage errors
  }
}

// --------------- Translation function ---------------

/**
 * Resolve a dotted key path (`"nav.dashboard"`) inside a nested dictionary.
 */
function resolve(dict: TranslationDictionary, key: string): string | undefined {
  const parts = key.split('.');
  let current: TranslationDictionary | string = dict;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Translate a key for the given locale, with optional parameter interpolation.
 *
 * @example
 *   translate('fr', 'common.save')                    // "Enregistrer"
 *   translate('en', 'bookings.count', { count: '5' }) // "5 bookings"
 */
export function translate(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string>,
): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  let value = resolve(dict, key);

  // Fallback to the default locale when the key is missing
  if (value === undefined && locale !== DEFAULT_LOCALE) {
    value = resolve(dictionaries[DEFAULT_LOCALE], key);
  }

  // Last-resort fallback: return the key itself
  if (value === undefined) return key;

  // Interpolate `{{param}}` placeholders
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue);
    }
  }

  return value;
}
