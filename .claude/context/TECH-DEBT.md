# Rooom OS - Dette Technique

> Tracking des problemes connus et améliorations a faire.
> Mis a jour: 2026-02-08

## Resolus

| # | Probleme | Resolution |
|---|----------|-----------|
| 1 | Aucun test automatise | 134 tests Vitest + RTL (stores, hooks, composants) |
| 2 | Settings.tsx 40% | Ameliore a ~85% avec persistence localStorage |
| 4 | Pas de validation formulaires | useFormValidation + validations.ts (Zod-like) |
| 5 | `as any` eparpilles | 0 casts - types corriges dans chatService, base |
| 6 | Demo mode disperse | Centralise dans mockData.ts (7 filter functions) |
| 7 | Violations design system (spacings) | Spacings convertis en var(--space-X) |
| 9 | Math.random() pour IDs | crypto.randomUUID() + crypto.getRandomValues() partout |
| 15 | Modals sans focus trap | Focus trap implemente dans Modal.tsx |
| 18 | Accessibility gaps | skip-to-content, aria-live, reduced-motion, htmlFor+id |

---

## P0 - Critiques

### 3. AIConsole - Reponses mock
- **Impact**: Feature inutilisable en production
- **Etat**: chatAIService retourne des reponses simulees (intentionnel en demo)
- **Action**: Integrer un vrai LLM (OpenAI, Anthropic) quand backend pret
- **Fichiers**: src/services/chatAIService.ts, src/pages/AIConsole.tsx

---

## P1 - Importants

### 7b. Couleurs hardcodees CSS
- **Impact**: Inconsistance visuelle
- **Etat**: ~77 couleurs hex dans les CSS modules (hors embed)
- **Action**: En cours de correction - batch 8
- **Fichiers**: src/pages/*.module.css, src/components/*.module.css

### 8. Pas de gestion d'erreurs centralisee
- **Impact**: Erreurs non formatees pour l'utilisateur
- **Etat**: Error boundaries + React Query error state implementes
- **Action**: Creer ApiError type + error handler + toast automatique
- **Fichiers**: src/types/, src/lib/, src/hooks/

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
- **Action**: Integrer i18next si multi-langue prevu (task #113)
- **Fichiers**: src/lib/utils.ts, src/components/layout/Sidebar.tsx

---

## P2 - Nice to have

### 13. Dark mode non implemente
- Variables CSS definies (`--dark-*`) mais pas de toggle UI
- Task #114 planifiee
- Fichiers: src/stores/uiStore.ts, src/styles/design-system.css

### 14. Tables limitees
- Pas de tri par colonne natif, pas de selection bulk, pas de virtualisation
- Task #112 (bulk operations) planifiee
- Fichiers: src/components/ui/Table.tsx

### 16. Pas d'optimistic updates
- Les mutations attendent la reponse serveur avant de mettre a jour l'UI
- Fichiers: src/hooks/use*.ts

### 17. QR codes en placeholder
- La generation de QR codes pour l'equipement est un stub
- Fichiers: src/services/equipment.ts

### 19. packsStore sans persistence
- Seul store sans persistence Zustand
- Fichiers: src/stores/packsStore.ts

### 20. Naming DB vs Code
- `studio_id` (DB) vs `studioId` (code) - inconsistant dans les filtres
- Fichiers: src/services/*.ts, src/hooks/*.ts

---

## Backlog Features (tasks #101-#126)

Voir TaskList dans Claude Code pour la liste complete des features planifiees.
Categories: Cancellation policy, Client portal, Automation builder, PWA, Export,
Photo gallery, Task-booking link, Reviews, Guest journey, Equipment-space,
Calendar conflict, Bulk ops, i18n, Dark mode, Push notifications, Multi-currency,
Report builder, Supabase migration, Double-booking prevention, API docs,
Webhooks, Smart lock, AI pricing, Market benchmarking, Identity verification,
Owner portal.
