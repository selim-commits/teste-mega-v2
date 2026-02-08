# Rooom OS - Guide Claude Code

> Ce fichier est lu automatiquement au debut de chaque session Claude Code.

## Projet

**Nom**: Rooom OS
**Type**: SaaS de gestion de studios photo/video
**Stack**: React 19 + TypeScript 5.9 + Vite 7 + Supabase + Zustand 5 + React Query 5
**Esthetique**: Premium, minimaliste, Apple-inspired, light mode uniquement
**Palette**: Monochrome + accent bleu marine (#1E3A5F)

## Architecture

```
Component -> Hook (React Query) -> Service -> Supabase
                                       |
                                    Store (Zustand, si etat global)
```

**Fichiers cles**:
- Design system: `src/styles/design-system.css` (SOURCE DE VERITE)
- Types DB: `src/types/database.ts`
- Auth: `src/contexts/AuthContext.tsx`
- Routing: `src/App.tsx`
- Entry: `src/main.tsx`

## Commandes

```bash
npm run dev      # Serveur dev (Vite)
npm run build    # Build production (tsc + vite)
npm run lint     # ESLint
npm run preview  # Preview build
npm run test     # Vitest (134 tests)
```

## Conventions rapides

- CSS: Variables du design system OBLIGATOIRES (`var(--text-primary)`, jamais `#1A1A1A`)
- Composants: CSS Modules (`.module.css`)
- Hooks: React Query pour les donnees, Zustand pour l'etat UI
- Services: CRUD pattern avec Supabase
- Types: Stricts, jamais `any` (0 casts `as any` dans le codebase)
- IDs: `crypto.randomUUID()` (jamais `Math.random()`)
- Commits: `type(scope): description` (feat, fix, style, refactor, chore)
- Locale: FR par defaut (`fr-FR`)
- A11y: `htmlFor`+`id` sur tous les labels, `aria-live` pour les annonces, `prefers-reduced-motion` supporte

## Mode Demo

Quand les env vars Supabase sont absentes, l'app tourne en mode demo avec des mock data.
- Detection: `isDemoMode` dans `src/lib/supabase.ts`
- Mock data: `src/lib/mockData.ts`
- DEMO_STUDIO_ID: `11111111-1111-1111-1111-111111111111`

## Widgets Embed

3 widgets independants avec leur propre store/services/CSS:
- `/src/embed/` - Widget booking
- `/src/embed-chat/` - Widget chat
- `/src/embed-packs/` - Widget packs
Prefixes CSS embed: `--rooom-*`

## Context & Agents

- `.claude/context/CONTEXT.md` - Design system complet + tokens
- `.claude/context/RULES.md` - Regles globales pour les agents
- `.claude/context/ARCHITECTURE.md` - Architecture detaillee
- `.claude/context/CONVENTIONS.md` - Conventions de code
- `.claude/context/TECH-DEBT.md` - Dette technique connue
- `.claude/agents/` - 10 agents specialises (design, feature, polish, debug, supabase, testing, demo-mode, embed-widget, performance, accessibility)

## Pages (30+)

Dashboard, Calendar, Bookings, Clients, Finance, Revenue, Packs, Team, Inventory,
SpaceControl, Settings, Chat, AIConsole, Tasks, Automations, Reports, WidgetBuilder,
AppointmentTypes, Availability, EmailNotifications, SMSNotifications, AlertNotifications,
Integrations, CalendarSync, Payments, Login

## Points d'attention

- Settings.tsx ameliore a ~85% (persistence localStorage, Supabase a venir)
- AIConsole utilise des reponses mock (pas de vrai LLM - intentionnel pour demo)
- Demo mode centralise dans `src/lib/mockData.ts`
- 134 tests automatises (Vitest + React Testing Library)
- ESLint: 0 errors, 2 warnings
- Validation formulaires via `src/hooks/useFormValidation.ts` + `src/lib/validations.ts`
