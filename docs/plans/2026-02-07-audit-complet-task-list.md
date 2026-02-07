# Rooom OS - Audit Complet & Liste de Taches

> Date: 2026-02-07
> Audite par: 6 agents specialises (Architecture, Performance, Securite, UX/a11y, Features, DevOps)
> Completude globale: ~55-60%

---

## Resume Executif

| Dimension | Etat | Issues critiques |
|-----------|------|-----------------|
| **Securite** | CRITIQUE | Cle Supabase exposee, IDOR, pas de RLS, validation postMessage faible |
| **Architecture** | MOYEN | 26 `as any`, state management duplique, demo mode disperse |
| **Performance** | MOYEN | 0 React.memo, framer-motion surcharge (178 usages), fichiers 1000+ LOC |
| **UX / Accessibilite** | FAIBLE | Alt text manquant, aria-labels absents, pas de skip-nav |
| **i18n** | ABSENT | 200+ strings FR hardcodees, pas de systeme i18n |
| **Tests** | CRITIQUE | <2% couverture, 0 tests composants |
| **CI/CD** | ABSENT | Pas de pipeline, pas de Prettier, pas de Sentry |
| **Features** | ~55-60% | 0 integration fonctionnelle (Stripe, email, SMS = stubs) |

---

## P0 - CRITIQUE (Securite & Fondations)

### SEC-01: Rotation cle Supabase anon key
- **Fichier**: `.env`
- **Probleme**: Cle anon key potentiellement dans l'historique git
- **Action**: Rotater la cle dans Supabase, nettoyer historique git (BFG/filter-branch)
- **Effort**: 1h
- **Impact**: Securite critique

### SEC-02: Implementer RLS (Row Level Security) Supabase
- **Fichiers**: Toutes les tables Supabase
- **Probleme**: Aucune politique RLS = acces libre a toutes les donnees
- **Action**: Creer des policies pour isoler les donnees par `studio_id`
- **Effort**: 8h
- **Impact**: Securite critique - empeche l'acces inter-studios

### SEC-03: Corriger validation origin postMessage (embeds)
- **Fichiers**: `src/embed/EmbedApp.tsx`, `src/embed-packs/PacksApp.tsx`, `src/embed/components/BookingForm.tsx`
- **Probleme**: Fallback `'*'` quand referrer indisponible
- **Action**: Whitelist d'origines configurables, jamais `'*'`
- **Effort**: 3h
- **Impact**: Securite haute - empeche interception postMessage

### SEC-04: Corriger IDOR dans les services
- **Fichiers**: `src/services/clients.ts`, `src/services/base.ts`, tous les services
- **Probleme**: `getById(id)` sans filtrage `studio_id` = acces a n'importe quel enregistrement
- **Action**: Ajouter `studio_id` obligatoire a toutes les requetes
- **Effort**: 4h
- **Impact**: Securite haute

### SEC-05: Valider URLs de redirection paiement
- **Fichier**: `src/embed/components/PaymentStep.tsx`
- **Probleme**: `window.location.href = bookingResult.paymentUrl` sans validation
- **Action**: Whitelist de domaines de paiement, bloquer `javascript:` et domaines non-autorises
- **Effort**: 1h
- **Impact**: Securite haute - empeche phishing

### SEC-06: Sanitiser les recherches (injection PostgREST)
- **Fichiers**: `src/services/clients.ts` (l.31-32), `src/services/team.ts`
- **Probleme**: Interpolation directe du texte de recherche dans les requetes `.or()`
- **Action**: Echapper/limiter les caracteres speciaux, limiter longueur
- **Effort**: 2h
- **Impact**: Securite haute

### DEVOPS-01: Creer pipeline CI/CD (GitHub Actions)
- **Probleme**: Aucune CI = pas de verification automatique
- **Action**: Workflow avec: lint, typecheck (`tsc`), tests (`vitest run`), build
- **Effort**: 3h
- **Impact**: Qualite critique - previent les regressions

### TEST-01: Infrastructure tests (deja fait partiellement)
- **Etat**: vitest + happy-dom installes, 7 fichiers test existent
- **Action restante**: Ajouter `@testing-library/react`, `@vitest/coverage-v8`
- **Effort**: 1h

---

## P1 - HAUTE PRIORITE (Qualite & Architecture)

### ARCH-01: Supprimer tous les `as any` (26 instances)
- **Fichiers**: `src/services/base.ts`, `src/services/packs.ts`, `src/services/clients.ts`, `src/services/chatService.ts`, `src/stores/packsStore.ts`, etc.
- **Probleme**: `const db = supabase as any` dans tous les services = perte totale de type-safety
- **Action**: Utiliser `SupabaseClient<Database>` correctement type
- **Effort**: 4h
- **Impact**: Fiabilite haute

### ARCH-02: Error boundary global
- **Fichier**: `src/App.tsx`
- **Probleme**: Aucun error boundary = crash silencieux
- **Action**: Creer `ErrorBoundary.tsx`, wrapper autour du router
- **Effort**: 2h
- **Impact**: UX haute

### ARCH-03: Auth guards sur routes protegees
- **Fichier**: `src/App.tsx`
- **Probleme**: Toutes les routes accessibles sans authentification
- **Action**: Verifier session valide avant rendu des pages
- **Effort**: 3h
- **Impact**: Securite haute

### ARCH-04: Centraliser le mode demo
- **Fichiers**: 11 hooks avec `isDemoMode` duplique
- **Probleme**: Logique demo dispersee = maintenance difficile
- **Action**: Creer `withDemoMode()` wrapper ou service factory
- **Effort**: 4h
- **Impact**: Maintenabilite haute

### ARCH-05: Ajouter `onError` a toutes les mutations React Query
- **Fichiers**: Tous les hooks (`usePacks.ts`, `useClients.ts`, etc.)
- **Probleme**: Mutations sans callback erreur = echecs silencieux
- **Action**: Ajouter `onError` avec notification utilisateur
- **Effort**: 3h
- **Impact**: UX haute

### PERF-01: React.memo sur composants UI primitifs
- **Fichiers**: `src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Avatar.tsx`, `Table.tsx`
- **Probleme**: 0 `React.memo` sur 100+ composants = re-renders inutiles
- **Action**: Ajouter memo aux composants recevant des props stables
- **Effort**: 2h
- **Impact**: Performance haute

### PERF-02: Corriger les fuites de timers
- **Fichiers**: `src/pages/Bookings.tsx`, `src/pages/WidgetBuilder.tsx`, `src/pages/AIConsole.tsx`
- **Probleme**: `setTimeout` sans cleanup dans les composants = race conditions
- **Action**: Wrapper dans `useEffect` avec cleanup return
- **Effort**: 2h
- **Impact**: Stabilite haute

### TEST-02: Tests stores Zustand (fait)
- **Etat**: 4 fichiers test existent deja
- **Couverture**: uiStore, bookingStore, clientStore, equipmentStore

### TEST-03: Tests utilitaires (fait)
- **Etat**: `utils.test.ts`, `validations.test.ts`, `mockData.test.ts` existent

### TEST-04: Tests composants React (prioritaires)
- **Fichiers**: Creer tests pour `Button`, `Modal`, `Input`, `Select`, `Table`
- **Action**: Utiliser React Testing Library
- **Effort**: 6h
- **Impact**: Couverture composants de base

### TEST-05: Tests hooks React Query
- **Fichiers**: `useClients.ts`, `useBookings.ts`, `useInvoices.ts`
- **Action**: Tester mode demo + interactions store
- **Effort**: 6h

### CSS-01: Design system - corriger violations restantes
- **Etat**: ~630 violations CSS (couleurs, spacings, radius, shadows hardcodes)
- **Action**: Migrer fichier par fichier, build entre chaque
- **Effort**: 10h
- **Impact**: Coherence visuelle

### DX-01: Configurer Prettier
- **Probleme**: Pas de formatage automatique
- **Action**: Ajouter `.prettierrc`, script format, pre-commit hook (husky)
- **Effort**: 1h

### DX-02: Renforcer ESLint
- **Fichier**: `eslint.config.js`
- **Action**: Ajouter `eslint-plugin-jsx-a11y`, rules type-aware, import sorting
- **Effort**: 2h

---

## P2 - PRIORITE MOYENNE (UX, Performance, Features)

### A11Y-01: Alt text sur toutes les images
- **Fichiers**: `src/embed/components/WidgetHeader.tsx`, `ServiceSelection.tsx`, `Avatar.tsx`, `Team.tsx`
- **Probleme**: `<img>` sans `alt` = invisible aux lecteurs d'ecran
- **Action**: Ajouter `alt` descriptif
- **Effort**: 2h

### A11Y-02: Aria-labels sur boutons icone
- **Fichiers**: `src/components/layout/Header.tsx`, `src/pages/Clients.tsx`, etc.
- **Probleme**: Boutons avec icone seule sans label accessible
- **Action**: Ajouter `aria-label` a tous les boutons icone-only
- **Effort**: 3h

### A11Y-03: Skip navigation link
- **Fichier**: `src/components/layout/AppLayout.tsx`
- **Action**: Ajouter lien skip-to-main caché
- **Effort**: 30min

### A11Y-04: Tables keyboard-accessible
- **Fichier**: `src/components/ui/Table.tsx`
- **Probleme**: Lignes cliquables non accessibles au clavier
- **Action**: Ajouter `tabIndex`, `onKeyDown`, `role="button"` aux rows cliquables
- **Effort**: 2h

### UX-01: Composant LoadingState unifie
- **Probleme**: Dashboard = skeletons, Clients = spinner, Finance = varie
- **Action**: Creer un composant `LoadingState` standard reutilisable
- **Effort**: 2h

### UX-02: Composant EmptyState unifie
- **Probleme**: Etats vides inconsistants entre les pages
- **Action**: Creer un composant `EmptyState` avec icone + message + CTA
- **Effort**: 2h

### UX-03: Composant ErrorState unifie
- **Probleme**: Pas de pattern standard de gestion d'erreur visuel
- **Action**: Creer composant avec retry, message convivial
- **Effort**: 2h

### PERF-03: Decomposer fichiers > 1000 LOC
- **Fichiers**: `Finance.tsx` (1633), `Clients.tsx` (1380), `Settings.tsx` (1311), `Inventory.tsx` (1170), `Team.tsx` (1142), `SpaceControl.tsx` (1122)
- **Action**: Extraire modals, forms, tables en sous-composants
- **Effort**: 12h (2h par fichier)

### PERF-04: Remplacer framer-motion par CSS pour animations simples
- **Fichiers**: `Button.tsx`, `Input.tsx`, `Badge.tsx`, `Avatar.tsx`
- **Probleme**: 178 usages de motion.* pour des effets CSS simples
- **Action**: Garder framer-motion uniquement pour AnimatePresence (modals, toasts)
- **Effort**: 6h
- **Gain**: ~40-50KB gzip

### PERF-05: AudioContext singleton (embed-chat)
- **Fichier**: `src/embed-chat/store/chatStore.ts`
- **Probleme**: Nouveau `AudioContext` cree a chaque notification = fuite memoire
- **Action**: Reutiliser une instance partagee
- **Effort**: 30min

### PERF-06: Ajouter `gcTime` a React Query
- **Fichier**: `src/lib/queryClient.ts`
- **Action**: Ajouter `gcTime: 1000 * 60 * 30` (30min) pour nettoyer les caches inactifs
- **Effort**: 15min

### ARCH-06: Consolider state management (Zustand vs React Query)
- **Probleme**: 6 stores Zustand dupliquent l'etat serveur (deja dans React Query)
- **Action**: Garder Zustand pour UI (filters, pagination, selection) uniquement. Laisser React Query gerer les donnees serveur.
- **Effort**: 8h
- **Impact**: Architecture propre, pas de double source de verite

### ARCH-07: Factory pour patterns de store repetes
- **Fichiers**: clientStore, equipmentStore, financeStore, bookingStore, teamStore
- **Probleme**: `setFilters`, `setPagination`, `resetFilters` dupliques partout
- **Action**: Creer `createFilteredStore()` factory
- **Effort**: 4h

### ARCH-08: Centraliser query key factories
- **Fichiers**: `src/lib/queryClient.ts`, `src/hooks/useChat.ts`, `src/hooks/usePacks.ts`
- **Probleme**: 3 approches differentes pour les query keys
- **Action**: Un seul systeme dans `queryClient.ts`
- **Effort**: 2h

### DOC-01: Reecrire README.md
- **Etat**: Template generique Vite
- **Action**: Vue d'ensemble projet, setup, architecture, features, contributing
- **Effort**: 2h

### DOC-02: Documenter variables d'environnement
- **Action**: Creer validation Zod des env vars + `.env.example` complet
- **Effort**: 1h

---

## P3 - BASSE PRIORITE (Nice-to-have)

### I18N-01: Installer systeme i18n (react-i18next)
- **Probleme**: 200+ strings FR hardcodees dans 22 pages + validations
- **Action**: Setup react-i18next, extraire strings en fichiers JSON
- **Effort**: 24h (setup 4h + extraction 20h)
- **Note**: Priorite basse sauf si expansion internationale prevue

### I18N-02: Locale dynamique pour dates/nombres
- **Probleme**: `'fr-FR'` hardcode partout
- **Action**: Provider de locale, utilitaires `formatDate(date, locale)`
- **Effort**: 3h

### FEAT-01: Integration Stripe (paiements)
- **Etat**: UI existe mais 0 logique backend
- **Action**: Webhooks, checkout session, intent de paiement
- **Effort**: 20h+
- **Dependance**: Backend Supabase Edge Functions

### FEAT-02: Integration email (SendGrid/Resend)
- **Etat**: UI notifications existe mais 0 envoi
- **Action**: Templates email, declencheurs sur events
- **Effort**: 12h+

### FEAT-03: Integration calendrier (Google/Outlook OAuth)
- **Etat**: CalendarSync.tsx = mock complet
- **Action**: OAuth flow, sync bidirectionnelle
- **Effort**: 16h+

### FEAT-04: AIConsole - connexion LLM reel
- **Etat**: Reponses mock uniquement
- **Action**: API Claude/OpenAI, context studio, RAG sur donnees
- **Effort**: 20h+

### FEAT-05: Calendar drag & drop
- **Etat**: Vue quotidienne affiche mais pas interactif
- **Action**: Librairie DnD, redimensionner, deplacer bookings
- **Effort**: 12h

### FEAT-06: PDF generation (factures)
- **Etat**: Pas d'export PDF
- **Action**: @react-pdf/renderer ou serveur-side
- **Effort**: 8h

### FEAT-07: Import/Export CSV (clients, bookings)
- **Effort**: 6h

### FEAT-08: Real-time (WebSocket/Supabase Realtime)
- **Etat**: Aucune fonctionnalite temps reel
- **Action**: Subscriptions Supabase sur chat, bookings, dashboard
- **Effort**: 8h

### PERF-07: Bundle analyzer
- **Action**: Ajouter `vite-plugin-visualizer`
- **Effort**: 15min

### PERF-08: Chunking manuel Vite
- **Action**: `manualChunks` pour react, supabase, framer-motion
- **Effort**: 1h

### DX-03: Activer `noUnusedLocals` et `noUnusedParameters`
- **Fichier**: `tsconfig.app.json`
- **Effort**: 2h (fixer les violations)

### DX-04: Sentry / error tracking
- **Action**: Installer @sentry/react, configurer error boundary
- **Effort**: 2h

### DX-05: Dependabot
- **Action**: Activer sur GitHub pour mises a jour automatiques
- **Effort**: 15min

### SEC-07: Ajouter CSRF tokens aux formulaires embed
- **Effort**: 3h

### SEC-08: Headers de securite (CSP, HSTS, X-Frame-Options)
- **Action**: Configurer dans le serveur/CDN
- **Effort**: 2h

### SEC-09: Rate limiting cote client + Supabase
- **Action**: Debounce recherches + policies Supabase
- **Effort**: 3h

---

## Completude par Page

| Page | Completude | Priorite amelioration |
|------|-----------|----------------------|
| Dashboard | 75% | P2 (real-time, drill-down) |
| Calendar | 65% | P3 (drag & drop) |
| Bookings | 70% | P2 (notifications, paiement) |
| Clients | 75% | P2 (import/export) |
| Finance | 70% | P2 (PDF, export comptable) |
| Inventory | 70% | P3 (QR, maintenance) |
| Team | 75% | P3 (planning, permissions) |
| Packs | 65% | P2 (Stripe, credits) |
| Chat | 60% | P3 (real-time, fichiers) |
| SpaceControl | 70% | P2 (drag & drop, conflits) |
| Settings | 60% | P2 (persistence Supabase) |
| AIConsole | 30% | P3 (LLM reel) |
| WidgetBuilder | 85% | OK |
| Integrations | 10% | P3 (OAuth, webhooks) |
| CalendarSync | 20% | P3 (OAuth Google/Outlook) |
| Availability | 50% | P3 (jours feries, sync) |
| Notifications | 40% | P3 (email/SMS delivery) |
| Payments | 30% | P3 (Stripe webhooks) |

---

## Estimation d'effort total

| Priorite | Taches | Effort estime |
|----------|--------|--------------|
| **P0 - Critique** | 8 taches | ~22h |
| **P1 - Haute** | 14 taches | ~48h |
| **P2 - Moyenne** | 16 taches | ~52h |
| **P3 - Basse** | 17 taches | ~140h+ |
| **TOTAL** | **55 taches** | **~262h** |

---

## Ordre d'execution recommande

### Sprint 1 (Semaine 1-2): Securite & Fondations
1. SEC-01 a SEC-06 (securite)
2. DEVOPS-01 (CI/CD)
3. TEST-01 (infra tests)
4. ARCH-01 (`as any`)

### Sprint 2 (Semaine 3-4): Architecture & Qualite
5. ARCH-02 a ARCH-05 (error boundary, auth, demo, mutations)
6. PERF-01, PERF-02 (memo, timers)
7. DX-01, DX-02 (Prettier, ESLint)
8. TEST-04, TEST-05 (tests composants + hooks)

### Sprint 3 (Semaine 5-6): UX & Performance
9. A11Y-01 a A11Y-04 (accessibilite)
10. UX-01 a UX-03 (composants unifies)
11. PERF-03, PERF-04 (decomposition, framer-motion)
12. CSS-01 (design system violations)

### Sprint 4+ : Features & Integrations
13. Selon priorite business: Stripe, email, calendar sync, AI...
