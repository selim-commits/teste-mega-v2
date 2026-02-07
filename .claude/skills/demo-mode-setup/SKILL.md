---
name: demo-mode-setup
description: Ajouter le support du mode demo a une page/hook Rooom OS
---

# Skill: Setup Demo Mode

## Quand utiliser
Quand on te demande d'ajouter le support du mode demo a un hook ou une page qui n'en a pas encore.

## Contexte

Le mode demo permet a l'application de fonctionner sans backend Supabase configure.
- Detection: `isDemoMode` dans `src/lib/supabase.ts`
- Mock data: `src/lib/mockData.ts`
- DEMO_STUDIO_ID: `11111111-1111-1111-1111-111111111111`

## Etapes

### 1. Verifier le mock data existant

```bash
grep -n "mock{Entity}" src/lib/mockData.ts
```

### 2. Ajouter le mock data (si manquant)

Dans `src/lib/mockData.ts`:
```typescript
export const mock{Entities}: {Entity}[] = [
  {
    id: crypto.randomUUID(),
    studio_id: DEMO_STUDIO_ID,
    name: 'Element demo 1',
    // ... champs realistes
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Ajouter 3-5 elements avec des variations
  // (differents statuts, tiers, dates, etc.)
];
```

### Regles pour le mock data
- Utiliser `DEMO_STUDIO_ID` comme studio_id
- Dates relatives (`new Date()`, `addDays(new Date(), -3)`)
- Noms/emails realistes en francais
- Varier les statuts pour montrer tous les etats de l'UI
- 3-8 elements par collection (assez pour tester, pas trop pour rester lisible)

### 3. Modifier le hook

Dans `src/hooks/use{Entity}s.ts`:
```typescript
import { isDemoMode } from '@/lib/supabase';
import { mock{Entities} } from '@/lib/mockData';

export function use{Entity}s(filters?: {Entity}Filters) {
  // ...
  const query = useQuery({
    queryKey: {entity}Keys.list(filters),
    queryFn: async () => {
      if (isDemoMode) {
        let result = [...mock{Entities}];
        // Appliquer les filtres sur le mock data
        if (filters?.search) {
          result = result.filter(item =>
            item.name.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        if (filters?.status) {
          result = result.filter(item => item.status === filters.status);
        }
        return result;
      }
      return {entity}Service.getAll(studioId!, filters);
    },
    enabled: isDemoMode || !!studioId,  // Toujours enabled en demo
  });

  // Pour les mutations en demo mode
  const createMutation = useMutation({
    mutationFn: async (data: {Entity}Insert) => {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 300));
        return { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as {Entity};
      }
      return {entity}Service.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: {entity}Keys.all }),
  });
}
```

### 4. Verifier
```bash
npm run build
# Puis tester en supprimant les env vars Supabase
```

## Checklist
- [ ] Mock data ajoute dans mockData.ts (3-8 elements)
- [ ] Dates relatives (pas de dates fixes)
- [ ] DEMO_STUDIO_ID utilise
- [ ] Hook modifie avec isDemoMode check
- [ ] Filtres appliques sur mock data
- [ ] Mutations simulees avec delai
- [ ] enabled = isDemoMode || !!studioId
- [ ] Build passe
