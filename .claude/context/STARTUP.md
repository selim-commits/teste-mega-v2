# Rooom OS - Startup Sequence

> Ce fichier est la PREMIÈRE chose à lire au démarrage d'une session Ralph.

---

## SÉQUENCE D'INITIALISATION

### Étape 1: Lire les règles
```bash
cat .claude/context/RULES.md
```

### Étape 2: Lire le contexte complet
```bash
cat .claude/context/CONTEXT.md
```

### Étape 3: Vérifier l'état du projet
```bash
git status
npm run build 2>&1 | tail -20
```

### Étape 4: Identifier l'agent approprié

| Si la tâche concerne... | Utiliser |
|------------------------|----------|
| UI, composants, styles | `agents/design-agent.md` |
| Nouvelle fonctionnalité | `agents/feature-agent.md` |
| Amélioration, optimization | `agents/polish-agent.md` |
| Bug, erreur | `agents/debug-agent.md` |

```bash
cat .claude/agents/[agent-approprié].md
```

### Étape 5: Exécuter la tâche

Suivre les instructions de l'agent choisi.

---

## CHECKLIST PRÉ-COMPLETION

Avant de terminer avec `<promise>...</promise>`:

- [ ] `npm run build` passe sans erreur
- [ ] Design system respecté (variables CSS)
- [ ] États complets (hover, focus, disabled)
- [ ] Typographie correcte
- [ ] Code TypeScript propre
- [ ] Pas de console.log de debug

---

## STRUCTURE DU PROJET (Quick Reference)

```
src/
├── components/
│   ├── ui/           # Composants réutilisables
│   ├── layout/       # Header, Sidebar, AppLayout
│   └── [feature]/    # Composants par feature
├── pages/            # Pages principales
├── hooks/            # Custom hooks (useX)
├── services/         # API calls vers Supabase
├── stores/           # Zustand stores
├── styles/
│   └── design-system.css  # ⭐ SOURCE DE VÉRITÉ
├── types/
│   └── database.ts   # Types Supabase
└── lib/
    ├── supabase.ts   # Client Supabase
    └── queryClient.ts # React Query config
```

---

## FICHIERS IMPORTANTS

| Fichier | Rôle |
|---------|------|
| `src/styles/design-system.css` | Toutes les variables CSS |
| `src/types/database.ts` | Types de la base de données |
| `src/App.tsx` | Routes de l'application |
| `.claude/context/CONTEXT.md` | Règles du design system |
| `.claude/context/RULES.md` | Règles globales |

---

## COMMANDES UTILES

```bash
# Build
npm run build

# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## EN CAS D'ERREUR DE BUILD

1. Lire le message d'erreur complet
2. Identifier le fichier et la ligne
3. Corriger le problème spécifique
4. Re-build pour vérifier

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

---

## RAPPEL FINAL

**Tu es autonome mais pas seul.**

Le design system, le contexte et les règles sont là pour te guider.
Respecte-les et le code sera cohérent.

Bonne session!
