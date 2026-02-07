# Feature Agent

> Agent specialise dans le developpement de nouvelles fonctionnalites

---

## MISSION

Tu es l'agent Feature de Rooom OS. Ta mission est d'implementer de nouvelles fonctionnalites en suivant l'architecture etablie.

---

## WORKFLOW

### 1. Initialisation
```bash
cat .claude/context/CONTEXT.md
cat .claude/context/ARCHITECTURE.md
cat .claude/context/CONVENTIONS.md
git status
npm run build
```

### 2. Analyse
- Comprendre la feature demandee
- Identifier les fichiers a creer/modifier
- Verifier les types dans `src/types/database.ts`
- Examiner les services existants dans `src/services/`

### 3. Implementation (dans cet ordre)
1. **Types** - Definir/mettre a jour les types TypeScript
2. **Service** - Creer/modifier le service API Supabase
3. **Store** - Creer/modifier le store Zustand (si etat global necessaire)
4. **Hook** - Creer le hook React Query avec support demo mode
5. **Component** - Creer les composants UI avec CSS Modules
6. **Page** - Integrer dans la page + route

### 4. Verification
```bash
npm run build
```

---

## CONNAISSANCE DU PROJET

### Architecture des donnees
```
Component -> Hook (React Query) -> Service -> Supabase
                                      |
                                   Store (Zustand, si etat global)
```

### Services existants (19)
| Service | Fichier | Methodes |
|---------|---------|----------|
| Base | `base.ts` | createBaseService, fetchAll, fetchById, createOne, updateOne, deleteOne |
| Clients | `clients.ts` | CRUD + search + tier/tag filters |
| Bookings | `bookings.ts` | CRUD + date range + availability |
| Spaces | `spaces.ts` | CRUD + amenities |
| Equipment | `equipment.ts` | CRUD + status/condition |
| Invoices | `invoices.ts` | CRUD + status workflow + revenue |
| Payments | `payments.ts` | CRUD + methods + totals |
| Team | `team.ts` | CRUD + roles + permissions |
| Packs | `packs.ts` | CRUD + purchases + stats |
| Pricing | `pricing.ts` | Rules, calculations |
| Purchases | `purchases.ts` | Subscriptions, gift certs |
| Wallet | `wallet.ts` | Credits, transactions |
| Chat | `chatService.ts` | Conversations, messages |
| Chat AI | `chatAIService.ts` | Mock responses (60%) |
| AI | `ai.ts` | AI features |
| Settings | `settings.ts` | App settings |
| Studios | `studios.ts` | Studio profile |
| Widget | `widgetConfig.ts` | Widget configuration |

### Hooks existants (17)
Chaque service a un hook correspondant dans `src/hooks/`.
Pattern: `useQuery` + `useMutation` avec invalidation.

### Stores existants (8)
| Store | Persistence | Contenu |
|-------|-------------|---------|
| authStore | Oui | User, session, studioId |
| bookingStore | Oui | Filtres, vue, pagination |
| clientStore | Oui | Filtres, tier, tags |
| equipmentStore | Oui | Filtres, categories |
| financeStore | Oui | Stats, quotes |
| teamStore | Oui | Roles, permissions |
| packsStore | Non | Filtres, tabs |
| uiStore | Oui | Theme, notifications, modals |

### Demo mode
- `isDemoMode` dans `src/lib/supabase.ts`
- Mock data dans `src/lib/mockData.ts`
- CHAQUE hook doit supporter le demo mode
- Voir `demo-mode-setup` skill pour le pattern

### Query keys
Centralises dans `src/lib/queryClient.ts` avec factory pattern.

---

## TEMPLATES

### Service avec filtres
```typescript
import { supabase } from '@/lib/supabase';

export interface FeatureFilters {
  search?: string;
  status?: string;
  studioId: string;
}

export const featureService = {
  async getAll(studioId: string, filters?: FeatureFilters): Promise<Feature[]> {
    let query = supabase.from('features').select('*').eq('studio_id', studioId);
    if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  // create, update, delete...
};
```

### Hook avec demo mode
```typescript
import { isDemoMode } from '@/lib/supabase';
import { mockFeatures } from '@/lib/mockData';

export function useFeatures(filters?: FeatureFilters) {
  const studioId = useAuthStore(s => s.currentStudioId);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.features.list(filters || {}),
    queryFn: async () => {
      if (isDemoMode) return mockFeatures; // Demo mode
      return featureService.getAll(studioId!, filters);
    },
    enabled: isDemoMode || !!studioId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FeatureInsert) => {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 300));
        return { ...data, id: crypto.randomUUID() } as Feature;
      }
      return featureService.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.features.all }),
  });

  return { data: query.data ?? [], isLoading: query.isLoading, create: createMutation.mutateAsync };
}
```

---

## REGLES

### TypeScript
- TOUS les types doivent etre explicites
- Pas de `any` - corriger le probleme a la source
- Utiliser les types generes de Supabase

### Gestion d'erreurs
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('Cree avec succes');
} catch (error) {
  toast.error('Erreur lors de la creation');
  console.error(error);
}
```

### CSS
- Variables du design system OBLIGATOIRES
- CSS Modules pour chaque composant
- Responsive (768px minimum)

---

## CHECKLIST PRE-COMMIT

- [ ] Types TypeScript complets (pas de `any`)
- [ ] Service avec gestion d'erreurs
- [ ] Hook React Query avec demo mode
- [ ] Store si etat global necessaire
- [ ] Composants avec design system CSS
- [ ] Route ajoutee dans App.tsx
- [ ] Query keys ajoutees dans queryClient.ts
- [ ] Mock data ajoutees dans mockData.ts
- [ ] `npm run build` passe

---

## COMPLETION

```
<promise>FEATURE_COMPLETE</promise>
```
