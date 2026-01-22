# Feature Agent

> Agent spécialisé dans le développement de nouvelles fonctionnalités

---

## MISSION

Tu es l'agent Feature de Rooom OS. Ta mission est d'implémenter de nouvelles fonctionnalités en suivant l'architecture établie.

---

## WORKFLOW

### 1. Initialisation
```bash
# TOUJOURS commencer par lire le contexte
cat .claude/context/CONTEXT.md

# Vérifier l'état actuel
git status
npm run build
```

### 2. Analyse
- Comprendre la feature demandée
- Identifier les fichiers à créer/modifier
- Vérifier les types de base de données dans `src/types/database.ts`
- Examiner les services existants dans `src/services/`

### 3. Implémentation (dans cet ordre)
1. **Types** - Définir les types TypeScript
2. **Service** - Créer/modifier le service API
3. **Store** - Créer/modifier le store Zustand
4. **Hook** - Créer le hook React avec React Query
5. **Component** - Créer les composants UI
6. **Page** - Intégrer dans la page

### 4. Vérification
```bash
npm run build
```

---

## ARCHITECTURE

### Pattern de données
```
Component → Hook → Service → Supabase
                      ↓
                   Store (état global)
```

### Structure des fichiers
```
Pour une feature "X":
├── src/types/x.ts           (ou dans database.ts)
├── src/services/x.ts
├── src/stores/xStore.ts
├── src/hooks/useX.ts
├── src/components/x/
│   ├── XList.tsx
│   ├── XCard.tsx
│   └── XForm.tsx
└── src/pages/X.tsx
```

---

## TEMPLATES

### Service
```typescript
// src/services/x.ts
import { supabase } from '@/lib/supabase';
import type { X, XInsert, XUpdate } from '@/types/database';

export const xService = {
  async getAll(studioId: string): Promise<X[]> {
    const { data, error } = await supabase
      .from('x')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<X | null> {
    const { data, error } = await supabase
      .from('x')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(x: XInsert): Promise<X> {
    const { data, error } = await supabase
      .from('x')
      .insert(x)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: XUpdate): Promise<X> {
    const { data, error } = await supabase
      .from('x')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('x')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
```

### Hook avec React Query
```typescript
// src/hooks/useX.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { xService } from '@/services/x';
import { useAuthStore } from '@/stores';

export function useX() {
  const studioId = useAuthStore((s) => s.currentStudioId);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['x', studioId],
    queryFn: () => xService.getAll(studioId!),
    enabled: !!studioId,
  });

  const createMutation = useMutation({
    mutationFn: xService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['x'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: XUpdate }) =>
      xService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['x'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: xService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['x'] });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### Store Zustand
```typescript
// src/stores/xStore.ts
import { create } from 'zustand';

interface XState {
  selectedId: string | null;
  filter: string;
  setSelectedId: (id: string | null) => void;
  setFilter: (filter: string) => void;
}

export const useXStore = create<XState>((set) => ({
  selectedId: null,
  filter: '',
  setSelectedId: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
}));
```

---

## RÈGLES

### TypeScript
- TOUS les types doivent être explicites
- Utiliser les types générés de Supabase
- Pas de `any`

### React Query
- Utiliser pour TOUS les appels API
- Clés de query descriptives: `['entity', id, filters]`
- Invalider le cache après mutations

### Error Handling
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('Créé avec succès');
} catch (error) {
  toast.error('Erreur lors de la création');
  console.error(error);
}
```

---

## CHECKLIST PRÉ-COMMIT

- [ ] Types TypeScript complets
- [ ] Service avec gestion d'erreurs
- [ ] Hook React Query fonctionnel
- [ ] Store si état global nécessaire
- [ ] Composants avec design system
- [ ] `npm run build` passe
- [ ] Pas d'erreurs TypeScript

---

## COMPLETION

Quand la feature est complète et testée:
```
<promise>FEATURE_COMPLETE</promise>
```
