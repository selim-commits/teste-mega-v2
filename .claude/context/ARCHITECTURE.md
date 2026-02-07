# Rooom OS - Architecture

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Pages   │→ │  Hooks   │→ │ Services │→ │   Supabase   │ │
│  │ (React)  │  │ (RQuery) │  │ (API)    │  │  (Postgres)  │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────────┘ │
│       │                                                      │
│  ┌────┴─────┐  ┌──────────┐  ┌──────────┐                  │
│  │Components│  │  Stores  │  │ Contexts │                   │
│  │   (UI)   │  │ (Zustand)│  │ (Auth)   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

## Flux de donnees

### Lecture (Query)
```
Page -> useXxx() hook -> React Query useQuery() -> xxxService.getAll() -> supabase.from('xxx').select()
                              |
                         Cache 5min staleTime
```

### Ecriture (Mutation)
```
Page -> handleSubmit() -> mutation.mutateAsync() -> xxxService.create() -> supabase.from('xxx').insert()
                              |
                      onSuccess: invalidateQueries(['xxx'])
```

### Etat global (UI)
```
Component -> useXxxStore() -> Zustand store -> persist (localStorage)
```

## Stores Zustand (8)

| Store | Responsabilite | Persistence |
|-------|---------------|-------------|
| `authStore` | User, session, studio | Oui |
| `bookingStore` | Filtres, vue, pagination | Oui |
| `clientStore` | Filtres, tier, tags | Oui |
| `equipmentStore` | Filtres, categories | Oui |
| `financeStore` | Stats, quotes, filtres | Oui |
| `teamStore` | Roles, permissions | Oui |
| `packsStore` | Filtres, tabs, pagination | Non |
| `uiStore` | Theme, notifications, modals | Oui |

## Services (19)

Tous suivent le pattern CRUD via `src/services/base.ts`:
```typescript
createBaseService<T>(tableName) → { getAll, getById, delete }
fetchAll, fetchById, createOne, updateOne, deleteOne
```

Services specifiques etendent avec des methodes supplementaires (filtres, calculs, relations).

## Hooks React Query (17)

Chaque service a un hook correspondant. Pattern:
```typescript
export function useXxx(filters?) {
  const studioId = useAuthStore(s => s.currentStudioId);
  return useQuery({
    queryKey: xxxQueryKeys.list(filters),
    queryFn: () => isDemoMode ? mockData : xxxService.getAll(filters),
    enabled: !!studioId,
  });
}
```

Query keys factory dans `src/lib/queryClient.ts` - 15+ domaines.

## Authentification

```
AuthContext (React Context)
├── Supabase Auth (email/password + OAuth)
├── Providers: Google, GitHub, Apple
├── Session auto-refresh
└── Demo mode fallback (authStore avec DEMO_STUDIO_ID)
```

## Routing (React Router v7)

```
/ ─── AppLayout (sidebar + header)
├── /              → Dashboard
├── /spaces        → Calendar (SpaceControl)
├── /bookings      → Bookings
├── /clients       → Clients
├── /finance       → Finance (invoices + payments + analytics)
├── /reports       → Reports
├── /availability  → Availability
├── /appointment-types → Services
├── /inventory     → Equipment
├── /packs         → Packs/subscriptions
├── /integrations  → Third-party
├── /calendar-sync → Calendar sync
├── /payments      → Payment methods
├── /notifications/email  → Email
├── /notifications/sms    → SMS
├── /notifications/alerts → Alerts
├── /widgets       → Widget builder
├── /ai            → AI Console
├── /chat          → Chat
├── /team          → Team
└── /settings      → Settings (stub)
```

## Widgets Embed (3 SPAs independantes)

Chaque widget a sa propre stack:
```
src/embed-xxx/
├── main.tsx          # Entry point
├── XxxApp.tsx        # App root
├── xxx.css           # Styles (prefixe --rooom-*)
├── types.ts          # Types specifiques
├── components/       # UI components
├── services/         # API calls
└── store/            # Zustand store
```

Build via Vite multi-entry dans `vite.config.ts`.

## Schema de la base (tables principales)

```
studios ──────┬── spaces
              ├── bookings ──── clients
              ├── equipment
              ├── team_members
              ├── invoices ──── payments
              ├── packs ────── client_purchases
              ├── pricing_rules
              ├── wallet_transactions
              ├── conversations ── messages
              └── settings
```

Toutes les tables ont `studio_id` pour l'isolation multi-tenant.
RLS (Row Level Security) sur toutes les tables.

## Mode Demo

```
ENV vars absentes?
    │
    ├── Oui → isDemoMode = true
    │         └── Hooks retournent mockData (src/lib/mockData.ts)
    │
    └── Non → isDemoMode = false
              └── Hooks appellent les services Supabase
```

Actuellement verifie dans chaque hook individuellement (11 fichiers).
A centraliser dans un service wrapper.
