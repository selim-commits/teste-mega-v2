# Design Reference - Squarespace Scheduling / Acuity

> Analyse du design de Squarespace Scheduling pour servir d'inspiration à Rooom OS

---

## 1. PALETTE DE COULEURS

### Couleurs principales (Acuity)
```css
/* Primary */
--color-primary: #000000;        /* Noir pur - texte principal */
--color-inverse: #FFFFFF;        /* Blanc - backgrounds */

/* Buttons */
--button-color: #283849;         /* Slate foncé - CTA primary */
--button-hover: #040507;         /* Near black - hover state */

/* Text */
--text-color: #465050;           /* Gris muté - corps de texte */
```

### Approche design
- **Fond blanc dominant** - Ultra clean
- **Texte noir/gris** - Contraste maximal
- **Accents minimaux** - Bleu et orange en touches décoratives
- **Pas de gradients** - Couleurs plates, solides

---

## 2. TYPOGRAPHIE

### Font Stack Acuity
```css
font-family: 'Clarkson', 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Weights */
font-weight: 400; /* Light - corps */
font-weight: 500; /* Medium - titres, labels */
```

### Hiérarchie
| Élément | Style |
|---------|-------|
| Titre principal | Large, bold, minimal |
| Sous-titres | Medium weight, légèrement plus petit |
| Corps | Regular weight, gris muté |
| Labels | Small caps ou uppercase, tracking wide |

### Caractéristiques
- Police **sans-serif moderne** et épurée
- **Espacement généreux** entre les lignes
- **Hiérarchie claire** par taille et poids
- **Peu de variations** - simplicité

---

## 3. COMPOSANTS UI

### Sélecteurs CSS Acuity
```css
/* Business */
.business-container        /* Logo + nom */
.business-logo
.business-name
.business-description-container

/* Appointment Selection */
.select-item               /* Container types/calendars */
.select-type               /* Wrapper appointment types */
.appointment-type-name     /* Label du type */
.duration-container        /* Durée */
.type-description          /* Description */

/* Calendar */
.select-calendar
.scheduleday               /* Jour normal */
.scheduleday.activeday     /* Jour disponible */
.scheduleday.selectedday   /* Jour sélectionné */

/* Time Slots */
.time-selection            /* Créneaux horaires */
.time-selection.selected-time

/* Forms */
.custom-form
.addons-container
.addon-name, .addon-price

/* Actions */
.btn                       /* Boutons */
.step-title                /* Titres d'étapes */
```

### Patterns de composants
- **Cards épurées** - Bordures subtiles ou aucune
- **Boutons arrondis** - Border-radius modéré
- **Inputs minimalistes** - Bordures fines, focus subtil
- **Calendrier propre** - Grille simple, états clairs

---

## 4. LAYOUT & SPACING

### Structure
```
┌────────────────────────────────────────┐
│ Logo / Business Name                   │
├────────────────────────────────────────┤
│ Step Title                             │
│ ─────────────────────                  │
│                                        │
│ [Service Selection]                    │
│   ┌──────────────────────────────┐     │
│   │ Service 1                    │     │
│   │ Duration • Price             │     │
│   └──────────────────────────────┘     │
│                                        │
│ [Calendar]                             │
│   ┌──────────────────────────────┐     │
│   │  L  M  M  J  V  S  D         │     │
│   │  1  2  3  4  5  6  7         │     │
│   │  ...                         │     │
│   └──────────────────────────────┘     │
│                                        │
│ [Time Slots]                           │
│   ┌─────┐ ┌─────┐ ┌─────┐             │
│   │9:00 │ │10:00│ │11:00│             │
│   └─────┘ └─────┘ └─────┘             │
│                                        │
│           [Confirm Booking]            │
└────────────────────────────────────────┘
```

### Espacement
- **Sections** : 48-64px entre les sections
- **Cards** : 24px padding interne
- **Éléments** : 16-24px entre éléments
- **Texte** : 8-12px entre lignes

---

## 5. ÉTATS INTERACTIFS

### Boutons
```css
/* Default */
background: #283849;
color: white;
border-radius: 4-6px;

/* Hover */
background: #040507;

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
```

### Time Slots
```css
/* Available */
border: 1px solid #e0e0e0;
background: white;

/* Hover */
border-color: #283849;

/* Selected */
background: #283849;
color: white;
```

### Calendar Days
```css
/* Normal */
color: #465050;

/* Active (disponible) */
color: #000;
font-weight: 500;

/* Selected */
background: #283849;
color: white;
border-radius: 50%;

/* Today */
border: 1px solid #283849;
```

---

## 6. PRINCIPES DE DESIGN

### Ce qui fait le succès de Squarespace Scheduling

1. **Minimalisme extrême**
   - Pas de décoration inutile
   - Chaque élément a un but
   - Blanc dominant

2. **Clarté absolue**
   - Flux linéaire : Service → Date → Heure → Confirmer
   - Une action par écran
   - Progression visible

3. **Cohérence totale**
   - Même style partout
   - Transitions fluides
   - Pas de surprises

4. **Focus utilisateur**
   - CTA évident
   - Distraction minimale
   - Mobile-first

---

## 7. APPLICATION À ROOOM OS

### Ce qu'on garde de notre design system
- Palette monochrome avec accent bleu marine
- Playfair Display pour les titres (différenciation)
- Approche premium

### Ce qu'on adopte de Squarespace
- **Plus de blanc** - Réduire les fonds gris
- **Moins de bordures** - Seulement quand nécessaire
- **Spacing généreux** - Plus d'air
- **États plus subtils** - Transitions douces
- **Simplicité des forms** - Labels au-dessus, inputs épurés

### Ajustements recommandés
```css
/* Avant */
--bg-secondary: #FAFAFA;
--border-default: #E5E5E5;

/* Après - Plus proche de Squarespace */
--bg-secondary: #FFFFFF;  /* Plus de blanc */
--bg-tertiary: #FAFAFA;   /* Réservé aux zones spécifiques */
--border-default: #EBEBEB; /* Plus subtil */
```

---

## 8. CHECKLIST DESIGN SQUARESPACE-STYLE

- [ ] Fond blanc dominant (pas de gris partout)
- [ ] Bordures très subtiles ou absentes
- [ ] Un CTA principal par vue
- [ ] Espacement généreux (48px+ entre sections)
- [ ] Typographie épurée avec hiérarchie claire
- [ ] États hover/focus subtils mais visibles
- [ ] Flux linéaire et prévisible
- [ ] Mobile-first responsive

---

## SOURCES

- [Squarespace Scheduling](https://www.squarespace.com/scheduling)
- [Acuity CSS Customization](https://developers.acuityscheduling.com/docs/custom-css)
- [Acuity Style Editor](https://acuityscheduling.com/learn/customize-scheduling-page-style-editor)
- [Squarespace Help - Scheduling](https://support.squarespace.com/hc/en-us/articles/206545577-Scheduling-blocks)
