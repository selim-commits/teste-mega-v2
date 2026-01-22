# Rooom OS - Context & Design System Rules

> **IMPORTANT**: Ce fichier doit être lu au DÉBUT de chaque session Ralph.
> Il contient toutes les règles de design, architecture et conventions du projet.

---

## 1. IDENTITÉ DU PROJET

**Nom**: Rooom OS
**Type**: SaaS de gestion de studios/espaces
**Stack**: React 19 + TypeScript + Vite + Supabase + Zustand

**Esthétique**: Premium, minimaliste, inspiré de stills.com & Squarespace
**Mode**: Light mode uniquement (pas de dark mode)
**Palette**: Monochrome avec accent bleu marine (#1E3A5F)

---

## 2. DESIGN SYSTEM - TOKENS

### 2.1 Couleurs

```css
/* Backgrounds - Du plus clair au plus foncé */
--bg-primary: #FFFFFF      /* Surface principale */
--bg-secondary: #FAFAFA    /* Surface secondaire, cards */
--bg-tertiary: #F5F5F5     /* Surface tertiaire, inputs */
--bg-elevated: #FFFFFF     /* Éléments flottants (modals, dropdowns) */
--bg-hover: #F0F0F0        /* État hover */

/* Texte - Du plus foncé au plus clair */
--text-primary: #1A1A1A    /* Titres, texte principal */
--text-secondary: #6B6B6B  /* Corps de texte, descriptions */
--text-tertiary: #9CA3AF   /* Labels, placeholders */
--text-muted: #B5B5B5      /* Texte désactivé */

/* Bordures */
--border-default: #E5E5E5  /* Bordures standard */
--border-subtle: #EBEBEB   /* Bordures légères */
--border-strong: #D1D5DB   /* Bordures accentuées */
--border-focus: #1E3A5F    /* Focus state */

/* Accent */
--accent-primary: #1E3A5F        /* Boutons, liens actifs */
--accent-primary-hover: #152A45  /* Hover sur accent */
--accent-primary-light: #E8EEF4  /* Background accent léger */

/* États sémantiques */
--state-success: #22C55E   --state-success-bg: #F0FDF4
--state-warning: #F59E0B   --state-warning-bg: #FFFBEB
--state-error: #EF4444     --state-error-bg: #FEF2F2
--state-info: #3B82F6      --state-info-bg: #EFF6FF
```

### 2.2 Typographie

```css
/* Familles */
--font-display: 'Playfair Display'  /* Titres élégants, italique */
--font-sans: 'Inter'                /* Corps, UI */
--font-mono: 'SF Mono', 'Fira Code' /* Code, données */

/* Tailles */
--text-xs: 11px    /* Labels, badges */
--text-sm: 13px    /* Body small, captions */
--text-base: 15px  /* Body default */
--text-lg: 16px    /* Body large */
--text-xl: 18px    /* Heading 3 */
--text-2xl: 24px   /* Heading 2 */
--text-3xl: 32px   /* Heading 1, Page title */
--text-4xl: 40px   /* Display */
--text-5xl: 48px   /* Hero */
```

**Règles typographiques**:
- Titres de page: `Playfair Display`, italique, 32px
- Titres de section: `Inter`, uppercase, 13px, letter-spacing: 0.1em
- Titres de card: `Inter`, semibold, 16px
- Corps: `Inter`, regular, 15px
- Labels: `Inter`, medium, 11px, uppercase

### 2.3 Espacements

```css
/* Échelle de 4px */
--space-1: 4px    --space-2: 8px    --space-3: 12px
--space-4: 16px   --space-5: 20px   --space-6: 24px
--space-8: 32px   --space-10: 40px  --space-12: 48px

/* Contextuels */
--card-padding: 24px
--section-gap: 48px
--card-gap: 24px
--content-padding: 32px
```

### 2.4 Rayons de bordure

```css
--radius-sm: 4px   /* Badges, tags */
--radius-md: 6px   /* Inputs, boutons */
--radius-lg: 8px   /* Cards */
--radius-xl: 12px  /* Modals */
--radius-2xl: 16px /* Grandes surfaces */
--radius-full: 9999px /* Pills, avatars */
```

### 2.5 Ombres

```css
/* Minimalistes - Éviter les ombres lourdes */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)   /* Subtle */
--shadow-md: 0 2px 4px rgba(0,0,0,0.06)   /* Cards */
--shadow-lg: 0 4px 12px rgba(0,0,0,0.08)  /* Dropdowns */
--shadow-xl: 0 8px 24px rgba(0,0,0,0.1)   /* Modals */
```

---

## 3. COMPOSANTS - RÈGLES

### 3.1 Boutons

```
Primary:   bg: accent-primary, text: white, radius: 6px, height: 40px
Secondary: bg: transparent, border: 1px border-default, text: text-primary
Ghost:     bg: transparent, text: text-secondary, hover: bg-hover
Danger:    bg: state-error, text: white

Tailles:
- sm: height 32px, padding 12px, text-sm
- md: height 40px, padding 16px, text-base (default)
- lg: height 48px, padding 24px, text-lg

États:
- hover: darken 10% ou bg-hover
- focus: outline 2px accent-primary, offset 2px
- disabled: opacity 0.5, cursor not-allowed
- loading: spinner + texte grisé
```

### 3.2 Inputs & Forms

```
Structure:
<div class="form-field">
  <label class="form-label">Label</label>
  <input class="form-input" />
  <span class="form-hint">Hint text</span>
  <span class="form-error">Error message</span>
</div>

Styles:
- Input: height 40px, padding 12px, border 1px border-default, radius 6px
- Focus: border-color accent-primary, shadow subtle
- Error: border-color state-error, bg state-error-bg
- Disabled: bg bg-tertiary, cursor not-allowed

Labels:
- Position: au-dessus de l'input
- Style: text-xs, uppercase, font-weight 500, letter-spacing wide
- Couleur: text-tertiary
- Margin-bottom: 8px

Placeholders:
- Couleur: text-muted
- Style: italic pour les exemples

Groupes:
- Espacement vertical: 20px entre champs
- Espacement horizontal: 16px entre inputs inline
```

### 3.3 Cards

```
Structure:
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
    <div class="card-actions">...</div>
  </div>
  <div class="card-content">...</div>
  <div class="card-footer">...</div>
</div>

Styles:
- Background: bg-secondary ou bg-primary
- Border: 1px border-subtle
- Radius: radius-lg (8px)
- Padding: 24px
- Shadow: shadow-sm ou none

Variantes:
- Elevated: bg-primary + shadow-md
- Bordered: bg-secondary + border-default
- Flat: bg-tertiary + no border
```

### 3.4 Tables

```
Structure:
- Utiliser <table> sémantique
- Header: bg-tertiary, text uppercase, text-xs
- Rows: border-bottom border-subtle
- Cells: padding 12px 16px
- Hover: bg-hover sur les rows

Colonnes alignement:
- Texte: left
- Nombres/Prix: right
- Statuts: center
- Actions: right
```

### 3.5 Modals

```
Structure:
- Overlay: bg black/50
- Container: bg-primary, radius-xl, shadow-xl
- Max-width: 480px (sm), 640px (md), 800px (lg)
- Padding: 24px

Sections:
- Header: border-bottom, padding-bottom 16px
- Content: padding-y 24px
- Footer: border-top, padding-top 16px, flex justify-end gap-12px

Animations:
- Overlay: fadeIn 200ms
- Container: scaleIn 200ms avec ease-spring
```

### 3.6 Navigation & Tabs

```
Tabs:
- Container: border-bottom border-default
- Item: padding 12px 16px, text-secondary
- Active: text-primary, border-bottom 2px accent-primary
- Hover: text-primary

Sidebar:
- Width: 240px (expanded), 72px (collapsed)
- Background: bg-secondary
- Active item: bg-accent-primary-light, text-accent-primary
```

---

## 4. PATTERNS & CONVENTIONS

### 4.1 Structure des fichiers

```
src/
├── components/
│   ├── ui/           # Composants réutilisables
│   │   └── Button/
│   │       ├── Button.tsx
│   │       └── Button.module.css
│   ├── layout/       # Layout components
│   └── [feature]/    # Components par feature
├── pages/            # Pages/Routes
├── hooks/            # Custom hooks (useX)
├── services/         # API calls
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── lib/              # Utilities
```

### 4.2 Naming Conventions

```typescript
// Components: PascalCase
export function BookingCard() {}

// Hooks: camelCase avec "use"
export function useBookings() {}

// Services: camelCase avec "Service"
export const bookingService = {}

// Stores: camelCase avec "Store"
export const useBookingStore = create()

// CSS Modules: camelCase
.cardContainer {}
.headerTitle {}

// Variables CSS: kebab-case avec préfixe
--color-primary
--space-4
--text-lg
```

### 4.3 Patterns de code

```typescript
// ✅ Service avec React Query
export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getAll()
  });
}

// ✅ Store Zustand
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }))
}));

// ✅ Component structure
export function Component({ prop }: Props) {
  // 1. Hooks
  const { data } = useQuery();
  const [state, setState] = useState();

  // 2. Derived state
  const filtered = useMemo(() => {}, []);

  // 3. Handlers
  const handleClick = () => {};

  // 4. Effects
  useEffect(() => {}, []);

  // 5. Render
  return <div>...</div>;
}
```

---

## 5. DO's & DON'Ts

### ✅ DO

- Utiliser les variables CSS du design system
- Respecter l'échelle de spacing (4px)
- Garder les ombres subtiles
- Utiliser Playfair Display uniquement pour les titres principaux
- Animations courtes (200-300ms)
- Focus visible sur tous les éléments interactifs
- Messages d'erreur clairs et contextuels

### ❌ DON'T

- Ne PAS utiliser de couleurs hardcodées
- Ne PAS créer de nouvelles variables sans nécessité
- Ne PAS utiliser de shadows lourdes
- Ne PAS mélanger les familles de police
- Ne PAS utiliser d'animations longues (>500ms)
- Ne PAS créer de composants sans CSS Module
- Ne PAS oublier les états (hover, focus, disabled, loading, error)

---

## 6. CHECKLIST PRÉ-COMMIT

Avant chaque commit, vérifier:

- [ ] Variables CSS utilisées (pas de couleurs hardcodées)
- [ ] Espacement cohérent (multiples de 4px)
- [ ] États de composants complets (hover, focus, disabled)
- [ ] Typographie correcte (bonne famille, bonne taille)
- [ ] Accessibilité (focus visible, labels, aria)
- [ ] Responsive (fonctionne sur mobile)
- [ ] TypeScript sans erreurs
- [ ] Build passe (`npm run build`)

---

## 7. STRUCTURE DES PAGES

```
Page Layout:
┌─────────────────────────────────────────────┐
│ Header (56px)                               │
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Content                          │
│ (240px)  │ ┌──────────────────────────────┐ │
│          │ │ Page Header                  │ │
│          │ │ - Title (Playfair, italic)   │ │
│          │ │ - Actions                    │ │
│          │ ├──────────────────────────────┤ │
│          │ │ Content Area                 │ │
│          │ │ - Cards / Tables / Forms     │ │
│          │ │ - Gap: 24px                  │ │
│          │ └──────────────────────────────┘ │
└──────────┴──────────────────────────────────┘

Padding content: 32px
Max-width: 1200px (centré)
```

---

## 8. WORKFLOW RALPH

Quand Ralph démarre une session:

1. **LIRE** ce fichier CONTEXT.md
2. **VÉRIFIER** l'état actuel du code (`git status`, `npm run build`)
3. **IDENTIFIER** la tâche à accomplir
4. **APPLIQUER** les règles du design system
5. **TESTER** le build avant de terminer
6. **COMMIT** si tout est valide

**Completion Promise**: Terminer avec `<promise>TASK_COMPLETE</promise>` uniquement si:
- Le build passe
- Les règles du design system sont respectées
- Le code est propre et typé
