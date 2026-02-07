# Rooom OS - Dette Technique

> Tracking des problemes connus et améliorations a faire.
> Mis a jour: 2026-02-07

## P0 - Critiques

### 1. Aucun test automatise
- **Impact**: Aucune garantie de non-regression
- **Etat**: 0 fichier test, pas de framework configure
- **Action**: Installer Vitest + React Testing Library
- **Fichiers**: package.json, vite.config.ts

### 2. Settings.tsx - 40% complete
- **Impact**: Les parametres ne persistent pas
- **Etat**: Tout en local state, aucune connexion Supabase
- **Action**: Connecter au service settings existant
- **Fichiers**: src/pages/Settings.tsx, src/services/settings.ts

### 3. AIConsole - Reponses mock
- **Impact**: Feature inutilisable en production
- **Etat**: chatAIService retourne des reponses simulees
- **Action**: Integrer un vrai LLM (OpenAI, Anthropic)
- **Fichiers**: src/services/chatAIService.ts, src/pages/AIConsole.tsx

### 4. Pas de validation formulaires
- **Impact**: Donnees invalides envoyees au backend
- **Etat**: Aucune validation client-side
- **Action**: Integrer Zod pour la validation
- **Fichiers**: Tous les formulaires (Clients, Bookings, Finance, etc.)

### 5. `as any` eparpilles
- **Impact**: Perte de securite TypeScript
- **Etat**: Casts dans services/base.ts, services/packs.ts, etc.
- **Action**: Corriger les types, supprimer les casts
- **Fichiers**: src/services/base.ts, src/services/packs.ts, src/services/bookings.ts

---

## P1 - Importants

### 6. Demo mode disperse
- **Impact**: Code duplique, maintenance difficile
- **Etat**: `isDemoMode` verifie dans 11 fichiers hooks separement
- **Action**: Centraliser dans un service wrapper ou middleware React Query
- **Fichiers**: src/hooks/use*.ts (11 fichiers)

### 7. 239 violations design system
- **Impact**: Inconsistance visuelle
- **Detail**:
  - 66 couleurs hardcodees (AIConsole.module.css: 25, embeds: 41)
  - 173 spacings hardcodes (embeds: 122, pages: 51)
- **Action**: Remplacer par des variables CSS
- **Fichiers**: src/pages/*.module.css, src/embed*/**/*.css

### 8. Pas de gestion d'erreurs centralisee
- **Impact**: Erreurs non formatees pour l'utilisateur
- **Etat**: Services throw raw, hooks rely on React Query error
- **Action**: Creer ApiError type + error handler + toast automatique
- **Fichiers**: src/types/, src/lib/, src/hooks/

### 9. generateId() avec Math.random()
- **Impact**: IDs potentiellement non uniques en production
- **Etat**: `src/lib/utils.ts` utilise Math.random()
- **Action**: Remplacer par `crypto.randomUUID()`
- **Fichiers**: src/lib/utils.ts

### 10. Breakpoints responsive incohérents
- **Impact**: Comportement inconsistant entre pages
- **Etat**: 5+ valeurs differentes (640, 768, 900, 1024, 1200)
- **Action**: Standardiser 4 breakpoints dans le design system
- **Fichiers**: src/styles/design-system.css, *.module.css

### 11. Quote type duplique
- **Impact**: Risque de divergence
- **Etat**: Defini dans financeStore.ts ET utilise dans Finance.tsx
- **Action**: Deplacer dans types/database.ts
- **Fichiers**: src/stores/financeStore.ts, src/types/database.ts

### 12. Locale hardcodee fr-FR
- **Impact**: Pas de support multi-langue
- **Etat**: Toutes les dates/monnaies hardcodees en fr-FR
- **Action**: Creer un contexte Locale ou integrer i18next si multi-langue prevu
- **Fichiers**: src/lib/utils.ts, src/components/layout/Sidebar.tsx

---

## P2 - Nice to have

### 13. Dark mode non implemente
- Variables CSS definies (`--dark-*`) mais pas de toggle UI
- Fichiers: src/stores/uiStore.ts, src/styles/design-system.css

### 14. Tables limitees
- Pas de tri par colonne, pas de selection bulk, pas de virtualisation
- Fichiers: src/components/ui/Table.tsx

### 15. Modals sans focus trap
- Le focus peut s'echapper du modal vers le contenu derriere
- Fichiers: src/components/ui/Modal.tsx

### 16. Pas d'optimistic updates
- Les mutations attendent la reponse serveur avant de mettre a jour l'UI
- Fichiers: src/hooks/use*.ts

### 17. QR codes en placeholder
- La generation de QR codes pour l'equipement est un stub
- Fichiers: src/services/equipment.ts

### 18. Accessibility gaps
- Pas de skip-to-content, pas d'aria-live, pas de reduced motion
- Fichiers: src/components/layout/AppLayout.tsx, src/components/ui/

### 19. packsStore sans persistence
- Seul store sans persistence Zustand
- Fichiers: src/stores/packsStore.ts

### 20. Naming DB vs Code
- `studio_id` (DB) vs `studioId` (code) - inconsistant dans les filtres
- Fichiers: src/services/*.ts, src/hooks/*.ts
