---
name: rooom-component
description: Creer un nouveau composant UI Rooom OS avec CSS Module, types, et tous les etats
---

# Skill: Creer un Composant Rooom OS

## Quand utiliser
Quand on te demande de creer un nouveau composant UI reutilisable pour Rooom OS.

## Etapes

### 1. Verifier le design system
```bash
cat src/styles/design-system.css | head -100
ls src/components/ui/
```

### 2. Creer le composant TSX

Fichier: `src/components/ui/{ComponentName}.tsx`

```typescript
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import styles from './{ComponentName}.module.css';

interface {ComponentName}Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const {ComponentName} = forwardRef<HTMLDivElement, {ComponentName}Props>(
  function {ComponentName}({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(
          styles.root,
          styles[variant],
          styles[size],
          disabled && styles.disabled,
          loading && styles.loading,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
```

### 3. Creer le CSS Module

Fichier: `src/components/ui/{ComponentName}.module.css`

```css
/* {ComponentName} */

.root {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: all var(--duration-base) var(--ease-default);
}

/* Variants */
.primary {
  background: var(--accent-primary);
  color: white;
}

.secondary {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.ghost {
  background: transparent;
  color: var(--text-secondary);
}

/* Sizes */
.sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
}

.md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
}

.lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
}

/* States */
.root:hover:not(.disabled) {
  /* hover style */
}

.root:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.loading {
  position: relative;
  color: transparent;
}

.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 4. Exporter depuis l'index

Ajouter dans `src/components/ui/index.ts`:
```typescript
export { {ComponentName} } from './{ComponentName}';
```

### 5. Verifier

```bash
npm run build
```

## Checklist
- [ ] Variables CSS du design system utilisees (AUCUNE valeur hardcodee)
- [ ] Tous les etats: default, hover, focus-visible, disabled, loading
- [ ] Types TypeScript complets
- [ ] forwardRef si element interactif
- [ ] CSS Module cree
- [ ] Export ajoute dans index.ts
- [ ] Build passe
