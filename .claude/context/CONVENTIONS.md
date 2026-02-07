# Rooom OS - Conventions de Code

## Nommage

### Fichiers
| Type | Convention | Exemple |
|------|-----------|---------|
| Composant | PascalCase | `BookingCard.tsx` |
| Page | PascalCase | `Clients.tsx` |
| Hook | camelCase avec `use` | `useBookings.ts` |
| Service | camelCase | `bookings.ts` |
| Store | camelCase avec `Store` | `bookingStore.ts` |
| CSS Module | PascalCase | `BookingCard.module.css` |
| Type | camelCase | `database.ts` |
| Utilitaire | camelCase | `utils.ts` |

### Code
```typescript
// Composants: PascalCase
export function BookingCard() {}

// Hooks: camelCase avec "use"
export function useBookings() {}

// Services: objet camelCase
export const bookingService = {}

// Stores: fonction avec "use"
export const useBookingStore = create()

// Types: PascalCase
interface BookingFormData {}
type ClientTier = 'standard' | 'premium' | 'vip'

// Constantes: UPPER_SNAKE_CASE
const DEMO_STUDIO_ID = '...'
const MAX_PAGE_SIZE = 50

// CSS classes: camelCase
.cardContainer {}
.headerTitle {}

// Variables CSS: kebab-case avec prefixe semantique
--text-primary
--bg-secondary
--space-4
```

### Base de donnees (Supabase)
- Tables: snake_case pluriel (`team_members`, `wallet_transactions`)
- Colonnes: snake_case (`studio_id`, `created_at`, `is_active`)
- Enums: PascalCase dans TypeScript (`BookingStatus`), snake_case en DB

## Structure des fichiers

### Nouveau composant UI
```
src/components/ui/
├── ComponentName.tsx
├── ComponentName.module.css
└── index.ts (barrel export)
```

### Nouvelle feature
```
src/
├── types/database.ts          # Ajouter types
├── services/featureName.ts    # Service CRUD
├── hooks/useFeatureName.ts    # Hook React Query
├── stores/featureStore.ts     # Store Zustand (si etat global)
├── components/feature/        # Composants specifiques
│   ├── FeatureList.tsx
│   ├── FeatureCard.tsx
│   └── FeatureFormModal.tsx
└── pages/FeatureName.tsx      # Page route
```

### Nouvelle page
```
src/pages/
├── PageName.tsx
└── PageName.module.css
```
+ Ajouter la route dans `src/App.tsx`

## Patterns de code

### Service CRUD
```typescript
export const featureService = {
  async getAll(studioId: string, filters?: Filters): Promise<Feature[]> {
    const query = supabase.from('features').select('*').eq('studio_id', studioId);
    // Appliquer les filtres
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  async create(feature: FeatureInsert): Promise<Feature> { ... },
  async update(id: string, updates: FeatureUpdate): Promise<Feature> { ... },
  async delete(id: string): Promise<void> { ... },
};
```

### Hook React Query
```typescript
export function useFeatures(filters?: FeatureFilters) {
  const studioId = useAuthStore(s => s.currentStudioId);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.features.list(filters),
    queryFn: async () => {
      if (isDemoMode) return filterMockData(mockFeatures, filters);
      return featureService.getAll(studioId!, filters);
    },
    enabled: !!studioId,
  });

  const createMutation = useMutation({
    mutationFn: featureService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.features.all }),
  });

  return { ...query, create: createMutation };
}
```

### Store Zustand
```typescript
interface FeatureState {
  filter: string;
  selectedId: string | null;
  page: number;
  setFilter: (filter: string) => void;
  setSelectedId: (id: string | null) => void;
  setPage: (page: number) => void;
}

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      filter: '',
      selectedId: null,
      page: 1,
      setFilter: (filter) => set({ filter, page: 1 }),
      setSelectedId: (id) => set({ selectedId: id }),
      setPage: (page) => set({ page }),
    }),
    { name: 'feature-store', partialize: (state) => ({ filter: state.filter }) }
  )
);
```

### Composant Page
```typescript
export function FeaturePage() {
  // 1. Hooks
  const { data, isLoading, error } = useFeatures();
  const { filter, setFilter } = useFeatureStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 2. Derived state
  const filtered = useMemo(() => /* ... */, [data, filter]);

  // 3. Handlers
  const handleCreate = async (formData: FormData) => { /* ... */ };

  // 4. Render
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;

  return (
    <div className={styles.page}>
      <Header title="Features" actions={<Button onClick={() => setIsCreateOpen(true)}>Nouveau</Button>} />
      <Table data={filtered} columns={columns} />
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <FeatureFormModal onSubmit={handleCreate} />
      </Modal>
    </div>
  );
}
```

## CSS

### Regles absolues
- TOUJOURS utiliser les variables CSS du design system
- JAMAIS de couleurs hardcodees (`#xxx` interdit, utiliser `var(--text-primary)`)
- JAMAIS de spacing hardcode (`16px` interdit, utiliser `var(--space-4)`)
- TOUJOURS un CSS Module par composant
- Etats complets: default, hover, focus-visible, disabled, loading, error

### Imports CSS
```css
/* Pas d'imports - les variables CSS sont globales via design-system.css */
.container {
  padding: var(--space-6);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
```

## Commits

Format: `type(scope): description courte`

Types:
- `feat`: Nouvelle fonctionnalite
- `fix`: Correction de bug
- `style`: Changements CSS/formatting
- `refactor`: Refactoring sans changement de comportement
- `chore`: Maintenance, deps, config
- `docs`: Documentation
- `test`: Tests

Exemples:
```
feat(clients): add tier filtering to client list
fix(packs): prevent blank page in demo mode
style(finance): replace hardcoded colors with CSS variables
refactor(hooks): centralize demo mode check
```

## Gestion d'erreurs

```typescript
// Dans les services: throw l'erreur Supabase
if (error) throw error;

// Dans les hooks: React Query gere automatiquement
// L'erreur est dans query.error

// Dans les pages: afficher un toast
try {
  await mutation.mutateAsync(data);
  toast.success('Cree avec succes');
} catch (err) {
  toast.error('Erreur lors de la creation');
}
```
