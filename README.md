# Rooom OS

SaaS de gestion de studios photo/video. Interface premium, minimaliste, Apple-inspired.

## Stack

- **Frontend**: React 19 + TypeScript 5.9 + Vite 7
- **Backend**: Supabase (Auth, Database, Realtime)
- **State**: Zustand 5 (UI) + React Query 5 (server state)
- **Style**: CSS Modules + Design System custom
- **Animation**: Framer Motion

## Demarrage rapide

```bash
# Cloner et installer
git clone <repo-url>
cd teste-mega-v2
npm install

# Configuration (optionnel - l'app tourne en mode demo sans)
cp .env.example .env
# Editer .env avec vos credentials Supabase

# Lancer le dev server
npm run dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement (Vite) |
| `npm run build` | Build production (tsc + Vite) |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:ci` | Tests en mode CI |
| `npm run preview` | Preview du build |

## Architecture

```
src/
├── components/     # Composants reutilisables
│   ├── ui/         # Design system (Button, Card, Modal, etc.)
│   ├── layout/     # Layout (Header, Sidebar, AppLayout)
│   └── packs/      # Composants packs
├── pages/          # 22 pages de l'application
├── hooks/          # React Query hooks (donnees serveur)
├── services/       # Couche d'acces Supabase
├── stores/         # Zustand stores (etat UI)
├── lib/            # Utilitaires (utils, validations, mockData)
├── types/          # Types TypeScript
├── styles/         # Design system CSS
├── contexts/       # React contexts (Auth)
├── embed/          # Widget booking (standalone)
├── embed-chat/     # Widget chat (standalone)
└── embed-packs/    # Widget packs (standalone)
```

## Mode Demo

Sans variables d'environnement Supabase, l'app tourne automatiquement en mode demo avec des donnees fictives. Ideal pour le developpement et les demos.

## Widgets Embed

3 widgets independants integrables via iframe:
- **Booking** (`/src/embed/`) - Reservation en ligne
- **Chat** (`/src/embed-chat/`) - Chat client/studio
- **Packs** (`/src/embed-packs/`) - Achat de forfaits

## Conventions

- **CSS**: Variables du design system obligatoires (`var(--text-primary)`)
- **Composants**: CSS Modules (`.module.css`)
- **Commits**: `type(scope): description`
- **Locale**: FR par defaut (`fr-FR`)
