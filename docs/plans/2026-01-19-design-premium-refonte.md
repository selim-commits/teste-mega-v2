# Rooom OS - Design Premium Refonte

## Direction
Inspiré de **stills.com** et **Squarespace Scheduling** - look premium, monochrome, professionnel.

## Palette de couleurs

```css
/* FOND */
--bg-primary: #FFFFFF;
--bg-secondary: #FAFAFA;
--bg-elevated: #FFFFFF;

/* TEXTE */
--text-primary: #1A1A1A;
--text-secondary: #6B6B6B;
--text-tertiary: #9CA3AF;

/* BORDURES */
--border-default: #E5E5E5;
--border-strong: #D1D5DB;

/* ACCENT - Bleu foncé */
--accent-primary: #1E3A5F;
--accent-primary-hover: #152A45;
--accent-primary-light: #E8EEF4;

/* ÉTATS */
--state-success: #22C55E;
--state-warning: #F59E0B;
--state-error: #EF4444;
--state-info: #3B82F6;
```

## Typographie

- **Display** : Playfair Display (serif) - titres de pages, headers
- **Body** : Inter (sans-serif) - tout le reste

### Échelle
- Page title: Playfair 32px, italic
- Section title: Inter 13px, uppercase, letter-spacing wide
- Body: Inter 15px
- Small: Inter 13px
- Label: Inter 11px, uppercase

## Composants

### Sidebar
- Fond blanc, bordure droite #E5E5E5
- Largeur: 240px
- Logo: "ROOOM" en Playfair, bleu foncé
- Items: Inter 14px, gris
- Item actif: texte noir + dot bleu à droite

### Cards
- Fond blanc, bordure #E5E5E5
- Border-radius: 8px
- Padding: 24px
- Pas d'ombre

### Boutons
- Primaire: fond #1E3A5F, texte blanc
- Secondaire: fond transparent, bordure #E5E5E5
- Border-radius: 6px

### Inputs
- Style underline (bordure bottom uniquement)
- Focus: bordure #1E3A5F
- Label au-dessus, uppercase, gris

### Tables
- Header: uppercase, gris, petit
- Bordures horizontales uniquement
- Hover: fond #FAFAFA

## Layout
- Sidebar 240px fixe
- Contenu avec padding 32px
- Gap entre cards: 24px
- Gap entre sections: 48px
