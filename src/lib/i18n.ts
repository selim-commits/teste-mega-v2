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
  landing: {
    eyebrow: 'Studio Management Platform',
    headline: "L'art de gerer un studio creatif",
    description: 'Reservations, clients, facturation et analytics reunis dans une plateforme concue pour les photographes et videoastes.',
    cta: 'Essayer gratuitement',
    editorialTitle1: 'Votre studio, unifie.',
    editorialBody1: 'Reservations en ligne, gestion des clients, suivi financier et inventaire d\'equipements. Une seule plateforme remplace vos dix outils.',
    editorialTitle2: 'Concu pour les creatifs.',
    editorialBody2: 'Interface epuree, widgets personnalisables pour votre site, et tableau de bord qui vous donne la vision complete de votre activite.',
    ctaTitle: 'Votre studio merite mieux qu\'un tableur.',
    ctaReady: 'Pret a commencer ?',
  },
  pricing: {
    title: 'Tarifs simples et transparents',
    subtitle: 'Choisissez la formule adaptee a votre studio. Sans engagement, sans surprise.',
    monthly: 'Mensuel',
    annual: 'Annuel',
    discount: '-20%',
    starter: 'Starter',
    solo: 'Solo',
    pro: 'Pro',
    popular: 'Populaire',
    trial: 'Essai 14 jours',
    free: 'Gratuit',
    perMonth: '/ mois',
    startFree: 'Commencer gratuitement',
    tryFree: 'Essayer 14 jours',
    comparison: 'Comparaison detaillee',
    faq: 'Questions frequentes',
    ctaTitle: 'Lancez votre studio sur Rooom en moins de 5 minutes.',
  },
  features: {
    title: 'Tout pour gerer votre studio',
    subtitle: 'Une plateforme complete concue pour les photographes et videoastes professionnels.',
    bookings: 'Reservations en ligne',
    crm: 'Gestion clients & CRM',
    billing: 'Facturation & paiements',
    inventory: 'Inventaire & equipements',
    widgets: 'Widgets personnalisables',
    ai: 'Assistant AI',
    automations: 'Automations & workflows',
    reporting: 'Reporting & analytics',
    howItWorks: 'Comment ca marche',
    stepsTitle: 'Pret en 3 etapes',
    step1: 'Creez votre compte',
    step2: 'Configurez votre studio',
    step3: 'Recevez des reservations',
    ctaTitle: 'Rejoignez les studios qui ont choisi Rooom.',
  },
  contact: {
    title: 'Parlons de votre studio',
    subtitle: 'Une question, une demande de demo ou besoin d\'aide ? Nous sommes la.',
    name: 'Nom',
    email: 'Email',
    subject: 'Sujet',
    message: 'Message',
    send: 'Envoyer le message',
    sent: 'Message envoye',
    sentText: 'Merci pour votre message. Notre equipe vous repondra dans les 24 heures.',
    sendAnother: 'Envoyer un autre message',
    responseTime: 'Temps de reponse',
    responseValue: 'Moins de 24 heures en jours ouvrables',
    subjects: {
      general: 'Question generale',
      demo: 'Demande de demo',
      support: 'Support technique',
      partnership: 'Partenariat',
      other: 'Autre',
    },
  },
  about: {
    title: 'Construire l\'outil que les studios meritent',
    subtitle: 'Rooom est ne de la conviction que les creatifs meritent des outils aussi soignes que leur travail.',
    storyEyebrow: 'Notre histoire',
    storyTitle: 'D\'une frustration, une solution.',
    teamEyebrow: 'L\'equipe',
    teamTitle: 'Les personnes derriere Rooom',
    ctaTitle: 'Pret a transformer votre studio ?',
  },
  legal: {
    privacy: 'Politique de confidentialite',
    terms: 'Conditions generales d\'utilisation',
    lastUpdated: 'Derniere mise a jour',
    toc: 'Sommaire',
  },
  onboarding: {
    step1: 'Votre studio',
    step2: 'Premier espace',
    step3: 'Horaires',
    step4: 'Termine',
    studioTitle: 'Parlez-nous de votre studio',
    studioSubtitle: 'Ces informations nous aident a personnaliser votre experience.',
    studioName: 'Nom du studio',
    studioType: 'Type de studio',
    city: 'Ville',
    spaceTitle: 'Votre premier espace',
    spaceSubtitle: 'Configurez votre espace principal. Vous pourrez en ajouter d\'autres plus tard.',
    spaceName: 'Nom de l\'espace',
    capacity: 'Capacite (personnes)',
    hourlyRate: 'Tarif horaire (EUR)',
    hoursTitle: 'Vos horaires',
    hoursSubtitle: 'Definissez vos jours et heures d\'ouverture. Modifiable a tout moment.',
    workDays: 'Jours ouvrables',
    openTime: 'Ouverture',
    closeTime: 'Fermeture',
    completeTitle: 'Tout est pret !',
    completeText: 'Votre studio est configure. Vous pouvez commencer a recevoir des reservations.',
    goToDashboard: 'Acceder au tableau de bord',
    continue: 'Continuer',
  },
  publicNav: {
    features: 'Fonctionnalites',
    pricing: 'Tarifs',
    about: 'A propos',
    contact: 'Contact',
    login: 'Connexion',
    signup: 'Commencer',
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
  landing: {
    eyebrow: 'Studio Management Platform',
    headline: 'The art of managing a creative studio',
    description: 'Bookings, clients, invoicing and analytics in one platform designed for photographers and videographers.',
    cta: 'Try for free',
    editorialTitle1: 'Your studio, unified.',
    editorialBody1: 'Online bookings, client management, financial tracking and equipment inventory. One platform replaces your ten tools.',
    editorialTitle2: 'Designed for creatives.',
    editorialBody2: 'Clean interface, customizable widgets for your website, and a dashboard that gives you a complete view of your business.',
    ctaTitle: 'Your studio deserves better than a spreadsheet.',
    ctaReady: 'Ready to start?',
  },
  pricing: {
    title: 'Simple and transparent pricing',
    subtitle: 'Choose the plan that fits your studio. No commitment, no surprises.',
    monthly: 'Monthly',
    annual: 'Annual',
    discount: '-20%',
    starter: 'Starter',
    solo: 'Solo',
    pro: 'Pro',
    popular: 'Popular',
    trial: '14-day trial',
    free: 'Free',
    perMonth: '/ month',
    startFree: 'Start for free',
    tryFree: 'Try 14 days free',
    comparison: 'Detailed comparison',
    faq: 'Frequently asked questions',
    ctaTitle: 'Launch your studio on Rooom in under 5 minutes.',
  },
  features: {
    title: 'Everything to manage your studio',
    subtitle: 'A complete platform designed for professional photographers and videographers.',
    bookings: 'Online bookings',
    crm: 'Client management & CRM',
    billing: 'Invoicing & payments',
    inventory: 'Inventory & equipment',
    widgets: 'Customizable widgets',
    ai: 'AI Assistant',
    automations: 'Automations & workflows',
    reporting: 'Reporting & analytics',
    howItWorks: 'How it works',
    stepsTitle: 'Ready in 3 steps',
    step1: 'Create your account',
    step2: 'Configure your studio',
    step3: 'Receive bookings',
    ctaTitle: 'Join the studios that chose Rooom.',
  },
  contact: {
    title: 'Let\'s talk about your studio',
    subtitle: 'A question, a demo request or need help? We\'re here.',
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    send: 'Send message',
    sent: 'Message sent',
    sentText: 'Thank you for your message. Our team will respond within 24 hours.',
    sendAnother: 'Send another message',
    responseTime: 'Response time',
    responseValue: 'Under 24 hours on business days',
    subjects: {
      general: 'General question',
      demo: 'Demo request',
      support: 'Technical support',
      partnership: 'Partnership',
      other: 'Other',
    },
  },
  about: {
    title: 'Building the tool studios deserve',
    subtitle: 'Rooom was born from the belief that creatives deserve tools as polished as their work.',
    storyEyebrow: 'Our story',
    storyTitle: 'From frustration, a solution.',
    teamEyebrow: 'The team',
    teamTitle: 'The people behind Rooom',
    ctaTitle: 'Ready to transform your studio?',
  },
  legal: {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    lastUpdated: 'Last updated',
    toc: 'Table of contents',
  },
  onboarding: {
    step1: 'Your studio',
    step2: 'First space',
    step3: 'Hours',
    step4: 'Done',
    studioTitle: 'Tell us about your studio',
    studioSubtitle: 'This information helps us personalize your experience.',
    studioName: 'Studio name',
    studioType: 'Studio type',
    city: 'City',
    spaceTitle: 'Your first space',
    spaceSubtitle: 'Configure your main space. You can add more later.',
    spaceName: 'Space name',
    capacity: 'Capacity (people)',
    hourlyRate: 'Hourly rate (EUR)',
    hoursTitle: 'Your hours',
    hoursSubtitle: 'Set your opening days and hours. Adjustable anytime.',
    workDays: 'Working days',
    openTime: 'Opening',
    closeTime: 'Closing',
    completeTitle: 'All set!',
    completeText: 'Your studio is configured. You can start receiving bookings.',
    goToDashboard: 'Go to dashboard',
    continue: 'Continue',
  },
  publicNav: {
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    login: 'Sign In',
    signup: 'Get Started',
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
