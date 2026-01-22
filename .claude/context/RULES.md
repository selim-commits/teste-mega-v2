# Rooom OS - Global Rules

> Ce fichier définit les règles globales pour TOUS les agents Ralph.
> À lire OBLIGATOIREMENT au début de chaque session.

---

## RÈGLE #1: TOUJOURS LIRE LE CONTEXTE

```bash
# Première action de TOUTE session
cat .claude/context/CONTEXT.md
```

Si tu ne lis pas le contexte, tu vas violer le design system.

---

## RÈGLE #2: VÉRIFIER AVANT D'AGIR

```bash
# Vérifier l'état du projet
git status
npm run build
```

Ne JAMAIS commencer à coder avant de savoir si le projet build.

---

## RÈGLE #3: DESIGN SYSTEM = LOI

| Ce qui est INTERDIT | Ce qui est OBLIGATOIRE |
|---------------------|------------------------|
| `color: #1A1A1A` | `color: var(--text-primary)` |
| `padding: 16px` | `padding: var(--space-4)` |
| `border-radius: 8px` | `border-radius: var(--radius-lg)` |
| `font-family: Inter` | `font-family: var(--font-sans)` |
| `box-shadow: 0 2px 4px...` | `box-shadow: var(--shadow-md)` |

**AUCUNE exception.**

---

## RÈGLE #4: ÉTATS COMPLETS

Chaque composant interactif DOIT avoir:

```css
/* Default */
.component { ... }

/* Hover */
.component:hover:not(:disabled) { ... }

/* Focus */
.component:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Disabled */
.component:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## RÈGLE #5: TYPOGRAPHIE CORRECTE

| Élément | Font | Taille | Style |
|---------|------|--------|-------|
| Titre de page | `--font-display` | 32px | italic |
| Titre de section | `--font-sans` | 13px | uppercase, tracking wide |
| Titre de card | `--font-sans` | 16px | semibold |
| Corps | `--font-sans` | 15px | regular |
| Label | `--font-sans` | 11px | uppercase, medium |

---

## RÈGLE #6: ARCHITECTURE RESPECTÉE

```
Component → Hook → Service → Supabase
              ↓
           Store (si état global)
```

- Components: UI uniquement
- Hooks: Logique + React Query
- Services: Appels API
- Stores: État global partagé

---

## RÈGLE #7: BUILD OBLIGATOIRE

```bash
# AVANT de terminer
npm run build
```

Si le build échoue, la tâche N'EST PAS terminée.

---

## RÈGLE #8: COMMITS CLAIRS

```bash
# Format
git add [fichiers]
git commit -m "type: description courte"

# Types
feat:   nouvelle fonctionnalité
fix:    correction de bug
style:  changements de style (CSS, formatting)
refactor: refactoring sans changement de comportement
chore:  tâches de maintenance
```

---

## RÈGLE #9: PAS DE HACK

```typescript
// ❌ INTERDIT
// @ts-ignore
// eslint-disable-next-line
as any

// ✅ CORRECT
// Corriger le problème à la source
```

---

## RÈGLE #10: COMPLETION HONNÊTE

```xml
<!-- UNIQUEMENT si TOUT est vrai: -->
<!-- - Le build passe -->
<!-- - Le design system est respecté -->
<!-- - Les états sont complets -->
<!-- - Le code est propre -->

<promise>TASK_COMPLETE</promise>
```

**NE JAMAIS mentir pour sortir de la boucle.**

---

## AGENTS DISPONIBLES

| Agent | Fichier | Usage |
|-------|---------|-------|
| Design | `agents/design-agent.md` | UI/UX, composants, styles |
| Feature | `agents/feature-agent.md` | Nouvelles fonctionnalités |
| Polish | `agents/polish-agent.md` | Amélioration, optimisation |
| Debug | `agents/debug-agent.md` | Correction de bugs |

Pour utiliser un agent spécifique:
```bash
cat .claude/agents/[agent-name].md
```

---

## QUICK REFERENCE

### Variables CSS essentielles
```css
/* Couleurs */
--text-primary, --text-secondary, --text-tertiary, --text-muted
--bg-primary, --bg-secondary, --bg-tertiary, --bg-hover
--border-default, --border-subtle, --border-strong
--accent-primary, --accent-primary-hover
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

### Imports standards
```typescript
import { clsx } from 'clsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { X } from '@/types/database';
```

---

## EN CAS DE DOUTE

1. Lire `CONTEXT.md`
2. Regarder les composants existants dans `src/components/ui/`
3. Consulter `src/styles/design-system.css`
4. Demander (si en mode interactif)

**La cohérence > La créativité**
