# Rooom OS - Global Rules

> Ce fichier definit les regles globales pour TOUS les agents Ralph.
> A lire OBLIGATOIREMENT au debut de chaque session.

---

## REGLE #1: TOUJOURS LIRE LE CONTEXTE

```bash
# Premiere action de TOUTE session
cat CLAUDE.md                          # Vue d'ensemble rapide
cat .claude/context/CONTEXT.md         # Design system complet
```

Fichiers de contexte disponibles:
- `CLAUDE.md` - Vue d'ensemble du projet (lu automatiquement par Claude Code)
- `.claude/context/CONTEXT.md` - Design system complet avec tokens
- `.claude/context/ARCHITECTURE.md` - Architecture detaillee du projet
- `.claude/context/CONVENTIONS.md` - Conventions de code
- `.claude/context/TECH-DEBT.md` - Dette technique connue

---

## REGLE #2: VERIFIER AVANT D'AGIR

```bash
git status
npm run build
```

Ne JAMAIS commencer a coder avant de savoir si le projet build.

---

## REGLE #3: DESIGN SYSTEM = LOI

| Ce qui est INTERDIT | Ce qui est OBLIGATOIRE |
|---------------------|------------------------|
| `color: #1A1A1A` | `color: var(--text-primary)` |
| `padding: 16px` | `padding: var(--space-4)` |
| `border-radius: 8px` | `border-radius: var(--radius-lg)` |
| `font-family: Inter` | `font-family: var(--font-sans)` |
| `box-shadow: 0 2px 4px...` | `box-shadow: var(--shadow-md)` |

**AUCUNE exception** (sauf widgets embed qui utilisent `--rooom-*`).

---

## REGLE #4: ETATS COMPLETS

Chaque composant interactif DOIT avoir:
```css
.component { ... }                              /* Default */
.component:hover:not(:disabled) { ... }          /* Hover */
.component:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; } /* Focus */
.component:disabled { opacity: 0.5; cursor: not-allowed; } /* Disabled */
```

---

## REGLE #5: TYPOGRAPHIE CORRECTE

| Element | Font | Taille | Style |
|---------|------|--------|-------|
| Titre de page | `--font-display` | 32px | italic |
| Titre de section | `--font-sans` | 13px | uppercase, tracking wide |
| Titre de card | `--font-sans` | 16px | semibold |
| Corps | `--font-sans` | 15px | regular |
| Label | `--font-sans` | 11px | uppercase, medium |

---

## REGLE #6: ARCHITECTURE RESPECTEE

```
Component -> Hook -> Service -> Supabase
              |
           Store (si etat global)
```

- Components: UI uniquement
- Hooks: Logique + React Query + demo mode check
- Services: Appels API Supabase
- Stores: Etat global partage (Zustand)

---

## REGLE #7: DEMO MODE SUPPORT

Chaque hook DOIT supporter le mode demo:
```typescript
if (isDemoMode) return mockData;
// enabled: isDemoMode || !!studioId
```

---

## REGLE #8: BUILD OBLIGATOIRE

```bash
npm run build
```

Si le build echoue, la tache N'EST PAS terminee.

---

## REGLE #9: COMMITS CLAIRS

```bash
git commit -m "type(scope): description courte"
# Types: feat, fix, style, refactor, chore, docs, test
```

---

## REGLE #10: PAS DE HACK

```typescript
// INTERDIT
// @ts-ignore
// eslint-disable-next-line
as any

// CORRECT: Corriger le probleme a la source
```

---

## REGLE #11: COMPLETION HONNETE

```xml
<promise>TASK_COMPLETE</promise>
```

UNIQUEMENT si:
- Le build passe
- Le design system est respecte
- Les etats sont complets
- Le code est propre et type

**NE JAMAIS mentir pour sortir de la boucle.**

---

## AGENTS DISPONIBLES

### Agents de base
| Agent | Fichier | Usage |
|-------|---------|-------|
| Design | `agents/design-agent.md` | UI/UX, composants, styles |
| Feature | `agents/feature-agent.md` | Nouvelles fonctionnalites |
| Polish | `agents/polish-agent.md` | Amelioration, optimisation |
| Debug | `agents/debug-agent.md` | Correction de bugs |

### Agents specialises
| Agent | Fichier | Usage |
|-------|---------|-------|
| Supabase | `agents/supabase-agent.md` | Base de donnees, migrations, RLS |
| Testing | `agents/testing-agent.md` | Tests unitaires, integration |
| Demo Mode | `agents/demo-mode-agent.md` | Mode demo, mock data |
| Embed Widget | `agents/embed-widget-agent.md` | Widgets embarques (booking, chat, packs) |
| Performance | `agents/performance-agent.md` | Optimisation, lazy loading, virtualisation |
| Accessibility | `agents/accessibility-agent.md` | WCAG 2.1 AA, a11y |

Pour utiliser un agent specifique:
```bash
cat .claude/agents/[agent-name].md
```

---

## SKILLS DISPONIBLES

| Skill | Usage |
|-------|-------|
| `rooom-component` | Creer un nouveau composant UI |
| `rooom-page` | Scaffolder une page complete (page + store + hook + service) |
| `rooom-service` | Creer un service Supabase + hook React Query |
| `design-system-audit` | Scanner les violations du design system |
| `demo-mode-setup` | Ajouter le support demo mode a un hook |
| `form-builder` | Generer un formulaire modal complet |

---

## QUICK REFERENCE

### Variables CSS essentielles
```css
/* Couleurs */
--text-primary, --text-secondary, --text-tertiary, --text-muted
--bg-primary, --bg-secondary, --bg-tertiary, --bg-hover
--border-default, --border-subtle, --border-strong
--accent-primary, --accent-primary-hover, --accent-primary-light
--state-success, --state-warning, --state-error, --state-info

/* Espacements */
--space-1 (4px), --space-2 (8px), --space-3 (12px), --space-4 (16px)
--space-5 (20px), --space-6 (24px), --space-8 (32px)

/* Rayons */
--radius-sm (4px), --radius-md (6px), --radius-lg (8px)
--radius-xl (12px), --radius-full (9999px)

/* Ombres */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

/* Transitions */
--duration-fast (150ms), --duration-base (200ms), --duration-slow (300ms)
```

### Breakpoints standardises
```css
@media (max-width: 480px)  { /* Mobile */ }
@media (max-width: 768px)  { /* Tablet */ }
@media (max-width: 1024px) { /* Desktop small */ }
@media (max-width: 1200px) { /* Desktop large */ }
```

### Imports standards
```typescript
import { clsx } from 'clsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase, isDemoMode } from '@/lib/supabase';
import type { X } from '@/types/database';
```

---

## EN CAS DE DOUTE

1. Lire `CLAUDE.md` (racine)
2. Lire `CONTEXT.md` (design system)
3. Lire `ARCHITECTURE.md` (architecture)
4. Regarder les composants existants dans `src/components/ui/`
5. Consulter `src/styles/design-system.css`

**La coherence > La creativite**
