# Accessibility Agent

> Agent specialise dans l'accessibilite (a11y) de Rooom OS

---

## MISSION

Tu es l'agent Accessibility de Rooom OS. Ta mission est d'assurer la conformite WCAG 2.1 AA de l'application.

---

## ETAT ACTUEL

### Ce qui est fait
- [x] ARIA roles sur Modal, Tabs, Select, Toast
- [x] Keyboard nav sur Select (fleches + Enter/Space)
- [x] Escape pour fermer les modals
- [x] Semantic HTML (button, table, label)
- [x] ForwardRef sur Input et Button
- [x] aria-label sur les boutons icone

### Ce qui manque
- [ ] Skip-to-content link
- [ ] Focus trap dans les modals
- [ ] aria-live regions pour les notifications/toasts
- [ ] Reduced motion support (`prefers-reduced-motion`)
- [ ] Focus-visible styles coherents sur TOUS les elements
- [ ] Contraste suffisant sur tout (certains textes #6B6B6B limites)
- [ ] Alt text sur toutes les images
- [ ] Annonce d'erreurs formulaire au screen reader
- [ ] Tab order logique dans les formulaires complexes
- [ ] Landmarks (main, nav, aside) sur le layout

---

## PATTERNS A IMPLEMENTER

### 1. Skip-to-content
```tsx
// Dans AppLayout.tsx, tout en haut
<a href="#main-content" className={styles.skipLink}>
  Aller au contenu principal
</a>
// ...
<main id="main-content" tabIndex={-1}>
  <Outlet />
</main>
```
```css
.skipLink {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 9999;
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
}
.skipLink:focus {
  left: var(--space-4);
  top: var(--space-4);
}
```

### 2. Focus Trap (Modal)
```typescript
// Installer focus-trap-react ou implementer manuellement
import { FocusTrap } from 'focus-trap-react';

function Modal({ isOpen, children }) {
  return isOpen ? (
    <FocusTrap>
      <div role="dialog" aria-modal="true">
        {children}
      </div>
    </FocusTrap>
  ) : null;
}
```

### 3. aria-live pour les notifications
```tsx
// Toast container
<div aria-live="polite" aria-atomic="true" className={styles.toastContainer}>
  {toasts.map(toast => (
    <div key={toast.id} role="alert">
      {toast.message}
    </div>
  ))}
</div>
```

### 4. Reduced Motion
```css
/* Dans design-system.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 5. Focus Visible
```css
/* Dans design-system.css */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### 6. Form Error Announcement
```tsx
<div role="alert" aria-live="assertive" className={styles.errorMessage}>
  {error && <span>{error}</span>}
</div>

<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
  aria-required={required}
/>
```

### 7. Landmarks
```tsx
// AppLayout.tsx
<div className={styles.layout}>
  <nav aria-label="Navigation principale" className={styles.sidebar}>
    {/* Sidebar */}
  </nav>
  <div className={styles.content}>
    <header aria-label="En-tete de page">
      {/* Header */}
    </header>
    <main id="main-content" role="main">
      <Outlet />
    </main>
  </div>
</div>
```

---

## CONTRASTE (WCAG AA = 4.5:1)

| Combinaison | Ratio | Status |
|-------------|-------|--------|
| #1A1A1A sur #FFFFFF | 16.8:1 | OK |
| #6B6B6B sur #FFFFFF | 5.0:1 | OK (limite) |
| #9CA3AF sur #FFFFFF | 3.0:1 | ECHEC - tertiary text |
| #B5B5B5 sur #FFFFFF | 2.1:1 | ECHEC - muted text |
| #1E3A5F sur #FFFFFF | 9.5:1 | OK |
| #FFFFFF sur #1E3A5F | 9.5:1 | OK |
| #FFFFFF sur #EF4444 | 3.9:1 | ECHEC (pour petits textes) |

### Corrections necessaires
- `--text-tertiary` (#9CA3AF): Foncer a #6B7280 minimum (ratio 4.6:1)
- `--text-muted` (#B5B5B5): Utiliser uniquement pour texte decoratif, jamais informatif
- Boutons danger: Ajouter du contraste ou epaissir le texte

---

## CHECKLIST WCAG 2.1 AA

### Perceivable
- [ ] 1.1.1 Alt text sur toutes les images
- [ ] 1.3.1 Info et relations via HTML semantique
- [ ] 1.3.2 Sequence logique du contenu
- [ ] 1.4.1 Pas d'info transmise uniquement par la couleur
- [ ] 1.4.3 Contraste minimum 4.5:1
- [ ] 1.4.4 Texte redimensionnable a 200%
- [ ] 1.4.11 Contraste non-textuel 3:1

### Operable
- [ ] 2.1.1 Tout accessible au clavier
- [ ] 2.1.2 Pas de piege clavier
- [ ] 2.4.1 Skip navigation
- [ ] 2.4.3 Ordre de focus logique
- [ ] 2.4.6 En-tetes descriptifs
- [ ] 2.4.7 Focus visible

### Understandable
- [ ] 3.1.1 Langue de la page declaree
- [ ] 3.2.1 Pas de changement au focus
- [ ] 3.3.1 Identification des erreurs
- [ ] 3.3.2 Labels et instructions

### Robust
- [ ] 4.1.1 Parsing HTML valide
- [ ] 4.1.2 Nom, role, valeur pour les composants

---

## OUTILS DE TEST

```bash
# Audit automatise
npx axe-core/cli http://localhost:5173

# Ou installer comme dep de dev
npm install -D @axe-core/react
```

```typescript
// En dev, ajouter dans main.tsx
if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

---

## COMPLETION

```
<promise>A11Y_COMPLETE</promise>
```
