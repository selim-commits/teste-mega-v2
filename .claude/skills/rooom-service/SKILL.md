---
name: rooom-service
description: Creer un nouveau service Supabase + hook React Query pour Rooom OS
---

# Skill: Creer un Service Rooom OS

## Quand utiliser
Quand on te demande de creer un nouveau service d'acces aux donnees Supabase avec son hook React Query.

## Etapes

### 1. Verifier les types existants
```bash
# Verifier si le type existe deja
grep -n "{TableName}" src/types/database.ts
```

### 2. Definir les types (si necessaire)

Ajouter dans `src/types/database.ts` ou creer le type dans le service:
```typescript
export interface {Entity} {
  id: string;
  studio_id: string;
  name: string;
  // ... champs specifiques
  created_at: string;
  updated_at: string;
}

export type {Entity}Insert = Omit<{Entity}, 'id' | 'created_at' | 'updated_at'>;
export type {Entity}Update = Partial<{Entity}Insert>;

export interface {Entity}Filters {
  search?: string;
  status?: string;
  // ... filtres specifiques
}
```

### 3. Creer le service

Fichier: `src/services/{entityName}.ts`

Pattern CRUD standard:
```typescript
import { supabase } from '@/lib/supabase';

export const {entity}Service = {
  // READ ALL (avec filtres optionnels)
  async getAll(studioId: string, filters?: {Entity}Filters): Promise<{Entity}[]> {
    let query = supabase
      .from('{entities}')
      .select('*')
      .eq('studio_id', studioId);

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  // READ ONE
  async getById(id: string): Promise<{Entity} | null> {
    const { data, error } = await supabase
      .from('{entities}')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // READ avec relations
  async getWithRelations(id: string): Promise<{Entity} & { relation: Relation }> {
    const { data, error } = await supabase
      .from('{entities}')
      .select('*, relation:related_table(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // CREATE
  async create(item: {Entity}Insert): Promise<{Entity}> {
    const { data, error } = await supabase
      .from('{entities}')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // UPDATE
  async update(id: string, updates: {Entity}Update): Promise<{Entity}> {
    const { data, error } = await supabase
      .from('{entities}')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // DELETE
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('{entities}')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // BULK OPERATIONS (optionnel)
  async bulkUpdate(ids: string[], updates: {Entity}Update): Promise<void> {
    const { error } = await supabase
      .from('{entities}')
      .update(updates)
      .in('id', ids);
    if (error) throw error;
  },
};
```

### 4. Creer le hook React Query

Fichier: `src/hooks/use{Entity}s.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { {entity}Service, type {Entity}, type {Entity}Filters } from '@/services/{entityName}';
import { useAuthStore } from '@/stores';
import { isDemoMode } from '@/lib/supabase';

// Query keys
const {entity}Keys = {
  all: ['{entities}'] as const,
  list: (filters?: {Entity}Filters) => ['{entities}', 'list', filters] as const,
  detail: (id: string) => ['{entities}', 'detail', id] as const,
};

// Hook principal
export function use{Entity}s(filters?: {Entity}Filters) {
  const studioId = useAuthStore(s => s.currentStudioId);
  const queryClient = useQueryClient();

  // Query
  const query = useQuery({
    queryKey: {entity}Keys.list(filters),
    queryFn: async () => {
      if (isDemoMode) return []; // TODO: mock data
      return {entity}Service.getAll(studioId!, filters);
    },
    enabled: !!studioId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: {entity}Service.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {entity}Keys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: {Entity}Update }) =>
      {entity}Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {entity}Keys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: {entity}Service.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {entity}Keys.all });
    },
  });

  return {
    // Data
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    // Mutations
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook pour un seul element
export function use{Entity}(id: string) {
  const query = useQuery({
    queryKey: {entity}Keys.detail(id),
    queryFn: () => {entity}Service.getById(id),
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

### 5. Ajouter les query keys (si queryClient centralisé)

Dans `src/lib/queryClient.ts`:
```typescript
{entities}: {
  all: ['{entities}'] as const,
  list: (filters: any) => ['{entities}', 'list', filters] as const,
  detail: (id: string) => ['{entities}', 'detail', id] as const,
},
```

### 6. Ajouter au barrel export

Dans `src/services/index.ts`:
```typescript
export { {entity}Service } from './{entityName}';
```

Dans `src/hooks/index.ts`:
```typescript
export { use{Entity}s, use{Entity} } from './use{Entity}s';
```

### 7. Verifier
```bash
npm run build
```

## Checklist
- [ ] Types definis (Entity, EntityInsert, EntityUpdate, EntityFilters)
- [ ] Service CRUD complet (getAll, getById, create, update, delete)
- [ ] Filtrage par studio_id dans toutes les queries
- [ ] Hook avec query + 3 mutations
- [ ] Query keys centralisees
- [ ] Support demo mode (isDemoMode check)
- [ ] Barrel exports mis a jour
- [ ] Pas de `as any`
- [ ] Build passe
