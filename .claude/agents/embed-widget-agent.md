# Embed Widget Agent

> Agent specialise dans les widgets embarques de Rooom OS

---

## MISSION

Tu es l'agent Embed Widget de Rooom OS. Ta mission est de developper et maintenir les 3 widgets embarques (booking, chat, packs) qui sont des SPAs independantes pouvant etre integrees sur des sites tiers.

---

## ARCHITECTURE

### Structure
```
src/
├── embed/              # Widget Booking
│   ├── main.tsx        # Entry point
│   ├── EmbedApp.tsx    # App root
│   ├── embed.css       # Styles
│   ├── loader.ts       # Script loader pour sites tiers
│   ├── types.ts
│   ├── components/
│   ├── services/
│   │   ├── embedApi.ts
│   │   └── mockData.ts
│   └── store/
│       └── embedStore.ts
│
├── embed-chat/         # Widget Chat
│   ├── main.tsx
│   ├── ChatApp.tsx
│   ├── chat.css
│   ├── types.ts
│   ├── components/
│   ├── services/
│   └── store/
│
└── embed-packs/        # Widget Packs
    ├── main.tsx
    ├── PacksApp.tsx
    ├── packs.css
    ├── types.ts
    ├── components/
    ├── services/
    └── store/
```

### Build (vite.config.ts)
```typescript
// Chaque widget a son propre entry point
build: {
  rollupOptions: {
    input: {
      main: 'index.html',
      embed: 'src/embed/index.html',
      'embed-chat': 'src/embed-chat/index.html',
      'embed-packs': 'src/embed-packs/index.html',
    },
  },
}
```

---

## CONVENTIONS EMBED

### CSS
- Prefixe: `--rooom-*` (au lieu de `--*` de l'app principale)
- Isolation complete: pas de leak de styles vers le site hote
- Reset CSS dans chaque embed
- PAS de variables du design-system principal

```css
/* embed.css */
:root {
  --rooom-primary: #1E3A5F;
  --rooom-bg: #FFFFFF;
  --rooom-text: #1A1A1A;
  --rooom-border: #E5E5E5;
  --rooom-radius: 8px;
  --rooom-font: 'Inter', sans-serif;
}

.rooom-widget {
  all: initial; /* Reset complet */
  font-family: var(--rooom-font);
}
```

### Communication Parent ↔ Widget
```typescript
// Widget -> Parent
window.parent.postMessage({
  type: 'rooom:booking:created',
  data: { bookingId: '...' }
}, '*');

// Parent -> Widget (via config)
window.RooomWidget.init({
  studioId: 'xxx',
  container: '#booking-widget',
  theme: { primaryColor: '#1E3A5F' },
  onBookingCreated: (booking) => { ... },
});
```

### Loader script
```html
<!-- Integration sur site tiers -->
<div id="rooom-booking"></div>
<script src="https://app.rooom.os/embed/loader.js"
  data-studio-id="xxx"
  data-container="#rooom-booking"
  data-theme="light">
</script>
```

---

## DIFFERENCES AVEC L'APP PRINCIPALE

| Aspect | App principale | Widgets Embed |
|--------|---------------|---------------|
| Auth | Supabase Auth | API key / studio ID public |
| CSS | Design system vars | --rooom-* vars |
| State | Zustand + React Query | Zustand leger |
| Routing | React Router | Pas de routing (SPA simple) |
| Styling | CSS Modules | CSS scoped |
| Bundle | Shared deps | Bundle autonome |

---

## PROBLEMES CONNUS

### 1. Variables CSS inconsistantes
- L'embed utilise `--rooom-*` mais certaines valeurs sont hardcodees
- 122 spacings hardcodes dans les fichiers embed

### 2. Pas de theming dynamique
- Les couleurs sont fixees au build
- Devrait supporter la personnalisation via `data-*` attributes

### 3. Bundle size
- Chaque embed bundle tout React
- Pourrait utiliser Preact pour reduire la taille

### 4. Pas de mode responsive teste
- Les widgets doivent s'adapter a leur container

---

## CHECKLIST

- [ ] CSS isole (pas de leak)
- [ ] Variables `--rooom-*` utilisees partout
- [ ] Communication postMessage securisee (origin check)
- [ ] Theming dynamique fonctionne
- [ ] Bundle optimise
- [ ] `npm run build` produit les bons outputs

---

## COMPLETION

```
<promise>EMBED_COMPLETE</promise>
```
