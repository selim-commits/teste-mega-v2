---
name: design-system-audit
description: Auditer la compliance au design system Rooom OS et corriger les violations
---

# Skill: Audit Design System Rooom OS

## Quand utiliser
Quand on te demande de verifier la compliance au design system, de corriger les violations CSS, ou d'harmoniser les styles.

## Etapes

### 1. Scanner les couleurs hardcodees

```bash
# Chercher les couleurs hex dans les CSS (hors design-system.css)
grep -rn '#[0-9a-fA-F]\{3,6\}' src/ --include="*.css" --include="*.module.css" | grep -v design-system.css | grep -v node_modules
```

### 2. Scanner les spacings hardcodes

```bash
# Chercher les valeurs en px non-variables
grep -rn '[0-9]\+px' src/ --include="*.css" --include="*.module.css" | grep -v design-system.css | grep -v 'var(' | grep -v node_modules
```

### 3. Scanner les fonts hardcodees

```bash
# Chercher les font-family non-variables
grep -rn 'font-family:' src/ --include="*.css" --include="*.module.css" | grep -v 'var(' | grep -v design-system.css
```

### 4. Scanner les shadows hardcodees

```bash
grep -rn 'box-shadow:' src/ --include="*.css" | grep -v 'var(' | grep -v design-system.css
```

### 5. Scanner les border-radius hardcodes

```bash
grep -rn 'border-radius:' src/ --include="*.css" | grep -v 'var(' | grep -v design-system.css
```

## Mapping de correction

### Couleurs
| Valeur hardcodee | Variable CSS |
|-----------------|-------------|
| `#FFFFFF` | `var(--bg-primary)` |
| `#FAFAFA` | `var(--bg-secondary)` |
| `#F5F5F5` | `var(--bg-tertiary)` |
| `#F0F0F0` | `var(--bg-hover)` |
| `#1A1A1A` | `var(--text-primary)` |
| `#6B6B6B` | `var(--text-secondary)` |
| `#9CA3AF` | `var(--text-tertiary)` |
| `#B5B5B5` | `var(--text-muted)` |
| `#E5E5E5` | `var(--border-default)` |
| `#EBEBEB` | `var(--border-subtle)` |
| `#D1D5DB` | `var(--border-strong)` |
| `#1E3A5F` | `var(--accent-primary)` |
| `#152A45` | `var(--accent-primary-hover)` |
| `#E8EEF4` | `var(--accent-primary-light)` |
| `#22C55E` | `var(--state-success)` |
| `#F59E0B` | `var(--state-warning)` |
| `#EF4444` | `var(--state-error)` |
| `#3B82F6` | `var(--state-info)` |

### Spacings
| Valeur | Variable |
|--------|---------|
| `4px` | `var(--space-1)` |
| `8px` | `var(--space-2)` |
| `12px` | `var(--space-3)` |
| `16px` | `var(--space-4)` |
| `20px` | `var(--space-5)` |
| `24px` | `var(--space-6)` |
| `32px` | `var(--space-8)` |
| `40px` | `var(--space-10)` |
| `48px` | `var(--space-12)` |

### Border radius
| Valeur | Variable |
|--------|---------|
| `4px` | `var(--radius-sm)` |
| `6px` | `var(--radius-md)` |
| `8px` | `var(--radius-lg)` |
| `12px` | `var(--radius-xl)` |
| `16px` | `var(--radius-2xl)` |
| `9999px` ou `50%` | `var(--radius-full)` |

### Shadows
| Pattern | Variable |
|---------|---------|
| `0 1px 2px rgba(0,0,0,0.04)` | `var(--shadow-sm)` |
| `0 2px 4px rgba(0,0,0,0.06)` | `var(--shadow-md)` |
| `0 4px 12px rgba(0,0,0,0.08)` | `var(--shadow-lg)` |
| `0 8px 24px rgba(0,0,0,0.1)` | `var(--shadow-xl)` |

## Rapport

Generer un rapport en format:
```
## Rapport d'Audit Design System
Date: YYYY-MM-DD

### Resume
- Couleurs hardcodees: X violations dans Y fichiers
- Spacings hardcodes: X violations dans Y fichiers
- Fonts hardcodees: X violations dans Y fichiers
- Shadows hardcodees: X violations dans Y fichiers
- Radius hardcodes: X violations dans Y fichiers

### Top 5 fichiers avec le plus de violations
1. fichier.css - XX violations
2. ...

### Details par fichier
#### fichier.css
- Ligne X: `color: #1A1A1A` → `color: var(--text-primary)`
- Ligne Y: `padding: 16px` → `padding: var(--space-4)`
```

## Regles
- NE PAS modifier design-system.css
- NE PAS modifier les fichiers embed (--rooom-* est intentionnel)
- Corriger fichier par fichier, build entre chaque
- Les valeurs en `px` pour width/height specifiques sont OK (pas des violations)
- Les `1px` pour les borders sont OK

## Exception embed
Les widgets embed (`src/embed*/`) utilisent `--rooom-*` intentionnellement.
Ne pas les convertir en `--*` du design system principal.
